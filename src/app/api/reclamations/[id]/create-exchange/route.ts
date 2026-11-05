import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadReclamations, updateReclamation } from '@/lib/reclamations';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const tickets = loadReclamations();
    const ticket = tickets.find((t) => t.id === id);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: 'Ticket de réclamation introuvable' },
        { status: 404 }
      );
    }

    // 1. Fetch original order
    let originalOrder = await prisma.order.findFirst({
      where: {
        OR: [
          ...(ticket.orderId ? [{ id: ticket.orderId }] : []),
          ...(ticket.orderNumber ? [{ orderNumber: ticket.orderNumber }] : []),
        ],
      },
      include: {
        items: true,
      },
    });

    // Determine target storeId
    let targetStoreId = originalOrder?.storeId || ticket.storeId;
    if (!targetStoreId) {
      const anyStore = await prisma.store.findFirst();
      if (!anyStore) {
        return NextResponse.json({ success: false, error: 'Aucune boutique configurée' }, { status: 400 });
      }
      targetStoreId = anyStore.id;
    }

    // Generate unique exchange order number
    const baseNum = originalOrder?.orderNumber || ticket.orderNumber || '1000';
    const cleanBase = baseNum.replace(/-ECH.*$/, '');
    const randSuffix = Math.floor(100 + Math.random() * 900);
    const exchangeOrderNumber = `${cleanBase}-ECH-${randSuffix}`;

    const exchangeFee = body.exchangeFee !== undefined ? Number(body.exchangeFee) : 0;
    const notes = `[🔄 ÉCHANGE SAV - ${ticket.ticketNumber}] REPRISE ANCIEN COLIS OBLIGATOIRE.\nMotif: ${
      body.exchangeNotes || ticket.description
    }${body.variantNote ? `\nNouvelle Spécification: ${body.variantNote}` : ''}`;

    // Prepare items for the new exchange order
    let itemsToCreate: any[] = [];
    if (originalOrder && originalOrder.items.length > 0) {
      itemsToCreate = originalOrder.items.map((item) => ({
        productId: item.productId,
        variant: body.newVariant || item.variant || null,
        color: body.newColor || item.color || null,
        size: body.newSize || item.size || null,
        quantity: item.quantity || 1,
        unitPrice: exchangeFee > 0 ? exchangeFee : 0,
        unitCost: item.unitCost || 0,
      }));
    } else {
      // Find default or first product of store
      const prod = await prisma.product.findFirst({
        where: { storeId: targetStoreId },
      });
      if (prod) {
        itemsToCreate = [
          {
            productId: prod.id,
            variant: body.newVariant || null,
            quantity: 1,
            unitPrice: exchangeFee,
            unitCost: prod.costPrice,
          },
        ];
      }
    }

    // Create the exchange order
    const newOrder = await prisma.order.create({
      data: {
        orderNumber: exchangeOrderNumber,
        storeId: targetStoreId,
        customerName: ticket.customerName || originalOrder?.customerName || 'Client SAV',
        customerPhone: ticket.customerPhone || originalOrder?.customerPhone || '',
        customerCity: ticket.customerCity || originalOrder?.customerCity || '',
        customerAddress: ticket.customerAddress || originalOrder?.customerAddress || '',
        customerNote: notes,
        status: 'CONFIRMED',
        subStatus: 'ECHANGE_SAV',
        totalAmount: exchangeFee,
        shippingCost: originalOrder?.shippingCost || 35.0,
        confirmerFee: 0,
        source: 'SAV_EXCHANGE',
        assignedAgentId: body.agentId || ticket.assignedAgentId || originalOrder?.assignedAgentId || null,
        courierProvider: originalOrder?.courierProvider || ticket.courierProvider || null,
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: true,
      },
    });

    // Update ticket state
    const updatedTicket = updateReclamation(id, {
      status: 'ECHANGE_PROGRAMME',
      exchangeOrderId: newOrder.id,
      exchangeOrderNumber: newOrder.orderNumber,
      resolutionNotes: `Commande d'échange #${newOrder.orderNumber} créée avec succès. (Frais: ${exchangeFee} ${ticket.currency || 'MAD'})`,
    });

    // Audit log
    await logActivity({
      userId: body.agentId || null,
      userName: body.agentName || 'Agent SAV',
      userRole: body.agentRole || 'CALL_AGENT',
      action: 'ORDER_EDIT',
      entity: 'ORDER',
      entityId: newOrder.id,
      orderId: newOrder.id,
      storeId: targetStoreId,
      details: `Création de commande d'échange #${newOrder.orderNumber} pour la réclamation ${ticket.ticketNumber}`,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      ticket: updatedTicket,
    });
  } catch (error: any) {
    console.error('Error creating exchange order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la création de la commande d\'échange' },
      { status: 500 }
    );
  }
}

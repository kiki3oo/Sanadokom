import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  loadReclamations,
  createReclamation,
  ReclamationTicket,
} from '@/lib/reclamations';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const agentId = searchParams.get('agentId');
    const search = searchParams.get('search')?.toLowerCase().trim();

    let tickets = loadReclamations();

    // 1. Filter by store (supporting multi-store comma-separated for country scoping)
    if (storeId && storeId !== 'ALL') {
      const allowedStores = storeId.split(',').map((s) => s.trim());
      tickets = tickets.filter((t) => !t.storeId || allowedStores.includes(t.storeId));
    }

    // 2. Filter by status
    if (status && status !== 'ALL') {
      tickets = tickets.filter((t) => t.status === status);
    }

    // 3. Filter by type
    if (type && type !== 'ALL') {
      tickets = tickets.filter((t) => t.type === type);
    }

    // 4. Filter by priority
    if (priority && priority !== 'ALL') {
      tickets = tickets.filter((t) => t.priority === priority);
    }

    // 5. Filter by agent
    if (agentId && agentId !== 'ALL') {
      tickets = tickets.filter((t) => t.assignedAgentId === agentId);
    }

    // 6. Search by customer phone, name, order number, ticket number
    if (search) {
      tickets = tickets.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(search) ||
          t.orderNumber.toLowerCase().includes(search) ||
          t.customerName.toLowerCase().includes(search) ||
          t.customerPhone.includes(search) ||
          (t.productName && t.productName.toLowerCase().includes(search))
      );
    }

    // Compute metrics on all tickets (or filtered by store)
    const allStoreTickets = storeId && storeId !== 'ALL'
      ? loadReclamations().filter((t) => {
          const allowed = storeId.split(',').map((s) => s.trim());
          return !t.storeId || allowed.includes(t.storeId);
        })
      : loadReclamations();

    const metrics = {
      total: allStoreTickets.length,
      nouveau: allStoreTickets.filter((t) => t.status === 'NOUVEAU').length,
      enCours: allStoreTickets.filter((t) => ['EN_COURS', 'ATTENTE_CLIENT', 'ATTENTE_TRANSPORTEUR'].includes(t.status)).length,
      echanges: allStoreTickets.filter((t) => t.status === 'ECHANGE_PROGRAMME' || t.exchangeOrderId).length,
      resolu: allStoreTickets.filter((t) => t.status === 'RESOLU').length,
      rejete: allStoreTickets.filter((t) => t.status === 'REJETE').length,
      resolutionRate: allStoreTickets.length > 0 
        ? Math.round((allStoreTickets.filter((t) => t.status === 'RESOLU').length / allStoreTickets.length) * 100) 
        : 100,
    };

    return NextResponse.json({
      success: true,
      tickets,
      metrics,
    });
  } catch (error: any) {
    console.error('Error fetching reclamations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la récupération des réclamations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.customerPhone || !body.customerName || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants (Téléphone, Nom, Description)' },
        { status: 400 }
      );
    }

    // If orderId or orderNumber was passed, enrich with real order data from DB
    let orderData: any = null;
    if (body.orderId || body.orderNumber) {
      orderData = await prisma.order.findFirst({
        where: {
          OR: [
            ...(body.orderId ? [{ id: body.orderId }] : []),
            ...(body.orderNumber ? [{ orderNumber: body.orderNumber }] : []),
          ],
        },
        include: {
          store: true,
          items: {
            include: { product: true },
          },
          assignedAgent: true,
        },
      });
    }

    const firstItem = orderData?.items?.[0];

    const newTicket = createReclamation({
      orderId: orderData?.id || body.orderId || '',
      orderNumber: orderData?.orderNumber || body.orderNumber || 'DIRECT',
      storeId: orderData?.storeId || body.storeId || '',
      storeName: orderData?.store?.name || body.storeName || 'Boutique Principale',
      customerName: body.customerName || orderData?.customerName || '',
      customerPhone: body.customerPhone || orderData?.customerPhone || '',
      customerCity: body.customerCity || orderData?.customerCity || '',
      customerAddress: body.customerAddress || orderData?.customerAddress || '',
      productName: firstItem?.product?.name || body.productName || 'Article Standard',
      productSku: firstItem?.product?.sku || body.productSku || '',
      courierProvider: orderData?.courierProvider || body.courierProvider || null,
      trackingNumber: orderData?.trackingNumber || body.trackingNumber || null,
      totalAmount: orderData?.totalAmount || body.totalAmount || 0,
      currency: orderData?.store?.currency || body.currency || 'MAD',
      type: body.type || 'PRODUIT_DEFECTUEUX',
      priority: body.priority || 'MEDIUM',
      status: body.status || 'NOUVEAU',
      description: body.description,
      customerDemand: body.customerDemand || '',
      resolutionNotes: body.resolutionNotes || '',
      photos: body.photos || [],
      assignedAgentId: body.assignedAgentId || orderData?.assignedAgentId || null,
      assignedAgentName: body.assignedAgentName || orderData?.assignedAgent?.name || null,
      exchangeOrderId: null,
      exchangeOrderNumber: null,
      refundAmount: body.refundAmount ? Number(body.refundAmount) : 0,
      resolvedAt: null,
    });

    // Activity log
    await logActivity({
      userId: body.authorId || null,
      userName: body.authorName || 'Agent SAV',
      userRole: body.authorRole || 'CALL_AGENT',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: orderData?.id || newTicket.id,
      orderId: orderData?.id || null,
      storeId: newTicket.storeId || null,
      details: `Création Ticket Réclamation ${newTicket.ticketNumber} [${newTicket.type}] pour commande #${newTicket.orderNumber}`,
    });

    return NextResponse.json({
      success: true,
      ticket: newTicket,
    });
  } catch (error: any) {
    console.error('Error creating reclamation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la création du ticket' },
      { status: 500 }
    );
  }
}

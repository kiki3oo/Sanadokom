import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { enrichOrdersWithCustomerProfiles } from '@/lib/customerHistory';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');
    const agentId = searchParams.get('agentId');
    const requestAgentId = searchParams.get('requestAgentId') || agentId;
    const search = searchParams.get('search');
    const logisticsOnly = searchParams.get('logisticsOnly') === 'true';

    const remittanceFilter = searchParams.get('remittance');

    const where: any = {};

    if (storeId && storeId !== 'ALL') {
      where.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }
    if (status === 'SUIVI_LIVRAISON' || searchParams.get('isSuivi') === 'true') {
      where.status = { in: ['SHIPPED', 'IN_TRANSIT'] };
      where.subStatus = {
        in: [
          'LIVREUR_NE_REPOND_PAS',
          'NE_REPOND_PAS',
          'LIVREUR_INJOIGNABLE',
          'LIVREUR_REFUSE',
          'LIVREUR_REPORTE',
          'LIVREUR_ADRESSE_INVALIDE',
          'SAUVE_A_RELIVRER',
          'EN_COURS_LIVRAISON',
        ],
      };
    } else if (status === 'INCIDENTS_LIVRAISON') {
      where.status = { in: ['SHIPPED', 'IN_TRANSIT'] };
      where.subStatus = {
        in: [
          'LIVREUR_NE_REPOND_PAS',
          'NE_REPOND_PAS',
          'LIVREUR_INJOIGNABLE',
          'LIVREUR_REFUSE',
          'LIVREUR_REPORTE',
          'LIVREUR_ADRESSE_INVALIDE',
        ],
      };
    } else if (status === 'SAUVE_A_RELIVRER') {
      where.subStatus = 'SAUVE_A_RELIVRER';
    } else if (status === 'EN_COURS_LIVRAISON' || status === 'SORTI_EN_LIVRAISON') {
      where.subStatus = 'EN_COURS_LIVRAISON';
    } else if (status && status !== 'ALL') {
      where.status = status;
    } else if (logisticsOnly) {
      // Exclude unconfirmed leads from logistics module
      where.status = {
        in: ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'],
      };
    }

    if (remittanceFilter === 'VERSE') {
      where.courierStatus = { in: ['VERSE', 'PAYE'] };
    } else if (remittanceFilter === 'NON_VERSE') {
      where.courierStatus = { notIn: ['VERSE', 'PAYE'] };
    }
    if (agentId) {
      where.assignedAgentId = agentId;
    }

    if (requestAgentId) {
      const reqUser = await prisma.user.findUnique({
        where: { id: requestAgentId },
        select: { role: true, permissions: true },
      });
      if (reqUser?.role === 'CALL_AGENT' && reqUser.permissions) {
        try {
          const p = JSON.parse(reqUser.permissions);
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            if (storeId && storeId !== 'ALL' && p.assignedStoreIds.includes(storeId)) {
              where.storeId = storeId;
            } else {
              where.storeId = { in: p.assignedStoreIds };
            }
          }
        } catch (e) {}
      }
    }
    if (search) {
      where.OR = [
        { customerPhone: { contains: search } },
        { customerName: { contains: search } },
        { orderNumber: { contains: search } },
        { customerCity: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, currency: true } },
        assignedAgent: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, stockQuantity: true } },
          },
        },
        callLogs: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: status === 'CALLBACK' ? [{ callbackAt: 'asc' }, { createdAt: 'desc' }] : { createdAt: 'desc' },
    });

    const enrichedOrders = await enrichOrdersWithCustomerProfiles(orders);

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      storeId,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerNote,
      agentNotes,
      source,
      utmSource,
      utmCampaign,
      adSet,
      items,
      status, // CONFIRMED or PENDING
      upsell,
      assignedAgentId,
      userId,
      userName,
      userRole,
    } = body;

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Boutique (storeId) obligatoire' }, { status: 400 });
    }

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Nom du client et numéro de téléphone obligatoires' },
        { status: 400 }
      );
    }

    const cleanPhone = customerPhone.replace(/[^0-9+]/g, '');

    // Resolve Store
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.json({ success: false, error: 'Boutique introuvable' }, { status: 404 });
    }

    // Process Items & Financials
    let totalAmount = 0;
    let costAmount = 0;
    const orderItemsToCreate: any[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        if (!it.productId) continue;
        const prod = await prisma.product.findUnique({ where: { id: it.productId } });
        if (prod) {
          const qty = parseInt(it.quantity || 1);
          const unitPrice = it.unitPrice !== undefined && it.unitPrice !== '' ? parseFloat(it.unitPrice) : prod.sellingPrice;
          const unitCost = prod.costPrice || 0;

          totalAmount += unitPrice * qty;
          costAmount += unitCost * qty;

          orderItemsToCreate.push({
            productId: prod.id,
            quantity: qty,
            unitPrice,
            unitCost,
            variant: it.variant || null,
            color: it.color || null,
            size: it.size || null,
          });
        }
      }
    }

    // Generate Order Number
    const count = await prisma.order.count();
    const orderNumber = `ORD-${1000 + count + 1}`;

    const orderStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING';

    // Agent commission fee
    let confirmerFee = 10.0;
    if (assignedAgentId) {
      const ag = await prisma.user.findUnique({ where: { id: assignedAgentId } });
      if (ag && ag.commissionFee) confirmerFee = ag.commissionFee;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        storeId,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerCity: customerCity?.trim() || 'Casablanca',
        customerAddress: customerAddress?.trim() || '',
        customerNote: customerNote?.trim() || null,
        agentNotes: agentNotes?.trim() || null,
        status: orderStatus,
        assignedAgentId: assignedAgentId || (userRole === 'CALL_AGENT' ? userId : null),
        confirmerFee,
        totalAmount,
        costAmount,
        shippingCost: store.currency === 'XOF' ? 2000.0 : 35.0,
        source: source || 'WhatsApp Direct / Appel',
        utmSource: utmSource?.trim() || null,
        utmCampaign: utmCampaign?.trim() || null,
        adSet: adSet?.trim() || null,
        upsell: upsell?.trim() || null,
        items: {
          create: orderItemsToCreate,
        },
      },
      include: {
        store: true,
        items: { include: { product: true } },
        assignedAgent: true,
      },
    });

    // If order created directly as CONFIRMED, deduct stock
    if (orderStatus === 'CONFIRMED') {
      for (const it of orderItemsToCreate) {
        const prod = await prisma.product.findUnique({ where: { id: it.productId } });
        if (prod && prod.stockQuantity >= it.quantity) {
          const prev = prod.stockQuantity;
          const next = prev - it.quantity;

          await prisma.product.update({
            where: { id: prod.id },
            data: { stockQuantity: next },
          });

          await prisma.stockMovement.create({
            data: {
              productId: prod.id,
              type: 'SALE',
              quantity: -it.quantity,
              previousStock: prev,
              newStock: next,
              reference: order.orderNumber,
              notes: `Déduction automatique pour commande manuelle ${order.source}`,
            },
          });
        }
      }
    }

    // Audit Log
    await logActivity({
      userId: userId || null,
      userName: userName || 'Admin',
      userRole: userRole || 'ADMIN',
      action: 'ORDER_EDIT',
      entity: 'ORDER',
      entityId: order.id,
      orderId: order.id,
      storeId,
      newValue: orderStatus,
      details: `A créé manuellement la commande #${order.orderNumber} via [${order.source}] (Client: ${order.customerName}, Montant: ${totalAmount} MAD, Statut: ${orderStatus})${upsell ? ` | UpSell: "${upsell}"` : ''}`,
    });

    return NextResponse.json({
      success: true,
      message: `Commande #${order.orderNumber} créée avec succès`,
      order,
    });
  } catch (error: any) {
    console.error('Error creating manual order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


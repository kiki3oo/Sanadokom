import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    const orderWhere: any = {};
    if (storeId && storeId !== 'ALL') {
      orderWhere.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    const targetStoreIds = storeId && storeId !== 'ALL' ? storeId.split(',') : null;

    let countryCurrency = 'MAD';
    if (targetStoreIds && targetStoreIds.length > 0) {
      const sampleStore = await prisma.store.findFirst({
        where: { id: { in: targetStoreIds } },
        select: { currency: true },
      });
      if (sampleStore?.currency) countryCurrency = sampleStore.currency;
    }

    const allAgents = await prisma.user.findMany({
      where: { role: 'CALL_AGENT' },
      include: {
        assignedOrders: {
          where: orderWhere,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            subStatus: true,
            courierStatus: true,
            totalAmount: true,
            confirmerFee: true,
            confirmerPaid: true,
            deliveredAt: true,
            createdAt: true,
          },
        },
      },
    });

    const agents = allAgents.filter((agent) => {
      if (!targetStoreIds || targetStoreIds.length === 0) return true;
      if (agent.assignedOrders.length > 0) return true;
      if (agent.permissions) {
        try {
          const p = JSON.parse(agent.permissions);
          if (Array.isArray(p.assignedStoreIds)) {
            return p.assignedStoreIds.some((id: string) => targetStoreIds.includes(id));
          }
        } catch (e) {}
      }
      return false;
    });

    const report = agents.map((agent) => {
      const orders = agent.assignedOrders;
      const total = orders.length;
      const confirmed = orders.filter((o) =>
        ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
      ).length;
      const delivered = orders.filter((o) => o.status === 'DELIVERED').length;
      const returned = orders.filter((o) => o.status === 'RETURNED').length;
      const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;

      const confRate = total > 0 ? ((confirmed / total) * 100).toFixed(1) : '0.0';
      const delivRate = confirmed > 0 ? ((delivered / confirmed) * 100).toFixed(1) : '0.0';

      let upsellCommissionFee = 5.0;
      let bankName = null;
      let bankRib = null;
      if (agent.permissions) {
        try {
          const p = JSON.parse(agent.permissions);
          if (p.upsellCommissionFee !== undefined && !isNaN(parseFloat(p.upsellCommissionFee))) {
            upsellCommissionFee = parseFloat(p.upsellCommissionFee);
          }
          if (p.bankName) bankName = p.bankName;
          if (p.bankRib) bankRib = p.bankRib;
        } catch (e) {}
      }

      // Commissions: calculated on DELIVERED orders (including base + upsell)
      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
      const totalEarnedCommission = deliveredOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);

      // Versement Société de Livraison Breakdown
      const courierRemittedOrders = deliveredOrders.filter((o) => ['VERSE', 'PAYE'].includes(o.courierStatus || ''));
      const courierPendingOrders = deliveredOrders.filter((o) => !['VERSE', 'PAYE'].includes(o.courierStatus || ''));

      // UNLOCKED commissions: Delivered AND courier has paid us, but agent not yet paid
      const unlockedOrders = courierRemittedOrders.filter((o) => !o.confirmerPaid);
      const unlockedPayout = unlockedOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);

      // LOCKED / PENDING courier remittance: Delivered BUT delivery company hasn't remitted cash yet
      const lockedOrders = courierPendingOrders.filter((o) => !o.confirmerPaid);
      const lockedPayout = lockedOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);

      const unpaidOrders = deliveredOrders.filter((o) => !o.confirmerPaid);
      const pendingPayout = unpaidOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);
      const upsellDeliveredCount = deliveredOrders.filter((o) => (o.confirmerFee || agent.commissionFee) > agent.commissionFee).length;

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        commissionFee: agent.commissionFee,
        upsellCommissionFee,
        upsellDeliveredCount,
        bankName,
        bankRib,
        totalOrders: total,
        confirmedOrders: confirmed,
        deliveredOrders: delivered,
        returnedOrders: returned,
        cancelledOrders: cancelled,
        confirmationRate: confRate,
        deliveryRate: delivRate,
        totalEarnedCommission,
        pendingPayout,
        unpaidOrdersCount: unpaidOrders.length,
        unlockedPayout,
        unlockedOrdersCount: unlockedOrders.length,
        lockedPayout,
        lockedOrdersCount: lockedOrders.length,
        courierRemittedCount: courierRemittedOrders.length,
        courierPendingCount: courierPendingOrders.length,
      };
    });

    return NextResponse.json({ success: true, report, currency: countryCurrency });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, agentId } = body;

    // Action: Mark delivered orders of this agent as PAID & generate official receipt
    if (action === 'PAY_COMMISSIONS' && agentId) {
      const {
        paymentMethod = 'Virement CIH Bank',
        transactionRef = '',
        notes = '',
        onlyCourierRemitted = true,
      } = body;

      const whereClause: any = {
        assignedAgentId: agentId,
        status: 'DELIVERED',
        confirmerPaid: false,
      };

      if (onlyCourierRemitted) {
        whereClause.courierStatus = { in: ['VERSE', 'PAYE'] };
      }

      const unpaidDelivered = await prisma.order.findMany({
        where: whereClause,
        include: {
          store: { select: { name: true } },
        },
      });

      const agent = await prisma.user.findUnique({ where: { id: agentId } });

      const count = unpaidDelivered.length;
      if (count === 0) {
        return NextResponse.json({
          error: 'Aucune commande débloquée (fonds déjà versés par le transporteur) en attente de paiement pour cet agent.',
        }, { status: 400 });
      }

      const totalAmount = unpaidDelivered.reduce(
        (sum, o) => sum + (o.confirmerFee || agent?.commissionFee || 10.0),
        0
      );

      await prisma.order.updateMany({
        where: whereClause,
        data: { confirmerPaid: true },
      });

      const receipt = {
        receiptNumber: `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
        agentName: agent?.name || 'Agent',
        agentEmail: agent?.email || '',
        agentPhone: agent?.phone || '',
        paidOrdersCount: count,
        totalAmount,
        paymentMethod,
        transactionRef: transactionRef || `VIR-${Date.now().toString().slice(-6)}`,
        notes,
        paidAt: new Date().toISOString(),
        orderNumbers: unpaidDelivered.map((o) => o.orderNumber),
      };

      return NextResponse.json({
        success: true,
        message: 'Commissions réglées avec succès !',
        receipt,
      });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

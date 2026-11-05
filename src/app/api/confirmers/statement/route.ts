import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const storeId = searchParams.get('storeId');
    const statusFilter = searchParams.get('status'); // ALL, PAID, UNPAID

    if (!agentId) {
      return NextResponse.json({ error: 'agentId est obligatoire' }, { status: 400 });
    }

    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        commissionFee: true,
        role: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent introuvable' }, { status: 404 });
    }

    const whereOrder: any = {
      assignedAgentId: agentId,
      status: 'DELIVERED', // Commissions are strictly paid on DELIVERED orders
    };

    if (storeId && storeId !== 'ALL') {
      whereOrder.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    if (statusFilter === 'PAID') {
      whereOrder.confirmerPaid = true;
    } else if (statusFilter === 'UNPAID') {
      whereOrder.confirmerPaid = false;
    }

    // Fetch all delivered orders matching the criteria
    const orders = await prisma.order.findMany({
      where: whereOrder,
      include: {
        store: { select: { id: true, name: true, currency: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    });

    // Also get overall counts for the agent scoped to storeId
    const storeCondition = storeId && storeId !== 'ALL' ? (storeId.includes(',') ? { in: storeId.split(',') } : storeId) : undefined;
    const allAssigned = await prisma.order.findMany({
      where: {
        assignedAgentId: agentId,
        ...(storeCondition ? { storeId: storeCondition } : {}),
      },
      select: {
        id: true,
        status: true,
        courierStatus: true,
        confirmerPaid: true,
        confirmerFee: true,
      },
    });

    const totalAssigned = allAssigned.length;
    const confirmedCount = allAssigned.filter((o) =>
      ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
    ).length;
    const deliveredCount = allAssigned.filter((o) => o.status === 'DELIVERED').length;
    const returnedCount = allAssigned.filter((o) => o.status === 'RETURNED').length;

    const paidOrders = allAssigned.filter((o) => o.status === 'DELIVERED' && o.confirmerPaid);
    const unpaidOrders = allAssigned.filter((o) => o.status === 'DELIVERED' && !o.confirmerPaid);

    const unlockedOrders = unpaidOrders.filter((o) => ['VERSE', 'PAYE'].includes(o.courierStatus || ''));
    const lockedOrders = unpaidOrders.filter((o) => !['VERSE', 'PAYE'].includes(o.courierStatus || ''));

    const paidAmount = paidOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);
    const pendingAmount = unpaidOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);
    const unlockedAmount = unlockedOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);
    const lockedAmount = lockedOrders.reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee), 0);
    const totalEarned = paidAmount + pendingAmount;

    const confirmationRate = totalAssigned > 0 ? ((confirmedCount / totalAssigned) * 100).toFixed(1) : '0.0';
    const deliveryRate = confirmedCount > 0 ? ((deliveredCount / confirmedCount) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      agent,
      summary: {
        totalAssigned,
        confirmedCount,
        deliveredCount,
        returnedCount,
        confirmationRate,
        deliveryRate,
        paidOrdersCount: paidOrders.length,
        unpaidOrdersCount: unpaidOrders.length,
        paidAmount,
        pendingAmount,
        unlockedOrdersCount: unlockedOrders.length,
        lockedOrdersCount: lockedOrders.length,
        unlockedAmount,
        lockedAmount,
        totalEarned,
      },
      orders,
    });
  } catch (error: any) {
    console.error('Error fetching agent statement:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

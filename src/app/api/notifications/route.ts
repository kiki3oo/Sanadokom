import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country'); // optional 'MA' | 'SN'
    const storeId = searchParams.get('storeId');
    const agentId = searchParams.get('agentId');
    const role = searchParams.get('role');
    const assignedStoreIdsParam = searchParams.get('assignedStoreIds');

    const isAgent = role === 'CALL_AGENT';

    const productWhere: any = {};
    const orderWhere: any = {};

    if (storeId && storeId !== 'ALL') {
      const storeCond = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
      productWhere.storeId = storeCond;
      orderWhere.storeId = storeCond;
    } else if (country) {
      const curr = country === 'SN' ? 'XOF' : 'MAD';
      productWhere.store = { currency: curr };
      orderWhere.store = { currency: curr };
    }

    // Scoping for CALL_AGENT
    if (isAgent && agentId) {
      // 1. Only orders assigned to this agent
      orderWhere.assignedAgentId = agentId;

      // 2. Products assigned to this agent (via stores or active orders)
      const assignedStoreIds = assignedStoreIdsParam ? assignedStoreIdsParam.split(',').filter(Boolean) : [];
      
      const agentItems = await prisma.orderItem.findMany({
        where: { order: { assignedAgentId: agentId } },
        select: { productId: true },
        distinct: ['productId'],
      });
      const orderProductIds = agentItems.map((i) => i.productId);

      if (assignedStoreIds.length > 0 && orderProductIds.length > 0) {
        productWhere.OR = [
          { storeId: { in: assignedStoreIds } },
          { id: { in: orderProductIds } },
        ];
      } else if (assignedStoreIds.length > 0) {
        productWhere.storeId = { in: assignedStoreIds };
      } else if (orderProductIds.length > 0) {
        productWhere.id = { in: orderProductIds };
      }
    }

    const now = new Date();

    // 1. Fetch Out-of-Stock and Low-Stock Products
    const products = await prisma.product.findMany({
      where: productWhere,
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        alertThreshold: true,
        store: { select: { name: true, currency: true } },
      },
      orderBy: { stockQuantity: 'asc' },
    });

    const outOfStockProducts = products.filter((p) => p.stockQuantity <= 0);
    const lowStockProducts = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= (p.alertThreshold || 5));

    // 2. Fetch Absent / On-Leave Agents (ONLY for Admin & Manager!)
    let absentAgents: any[] = [];
    if (!isAgent) {
      const agents = await prisma.user.findMany({
        where: {
          role: 'CALL_AGENT',
        },
        select: {
          id: true,
          name: true,
          email: true,
          permissions: true,
          active: true,
        },
      });

      agents.forEach((ag) => {
        if (ag.permissions) {
          try {
            const perms = typeof ag.permissions === 'string' ? JSON.parse(ag.permissions) : ag.permissions;
            if (perms.workStatus === 'ON_LEAVE' || perms.workStatus === 'QUITTED' || !ag.active) {
              absentAgents.push({
                id: ag.id,
                name: ag.name,
                email: ag.email,
                workStatus: perms.workStatus || 'ON_LEAVE',
                leaveReason: perms.leaveReason || 'Congé / Absence déclarée',
                replacementAgentId: perms.replacementAgentId || null,
              });
            }
          } catch (e) {}
        }
      });
    }

    // 3. Fetch Overdue Callbacks (strictly agent's own if CALL_AGENT)
    const overdueCallbacks = await prisma.order.findMany({
      where: {
        ...orderWhere,
        status: 'CALLBACK',
        callbackAt: { lte: now },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        callbackAt: true,
        assignedAgent: { select: { name: true } },
      },
      take: 15,
      orderBy: { callbackAt: 'asc' },
    });

    // 4. Fetch Stuck Shipments (> 4 days in transit, strictly agent's own if CALL_AGENT)
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 3600 * 1000);
    const stuckShipments = await prisma.order.findMany({
      where: {
        ...orderWhere,
        status: { in: ['SHIPPED', 'IN_TRANSIT'] },
        shippedAt: { lte: fourDaysAgo },
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerCity: true,
        courierProvider: true,
        shippedAt: true,
      },
      take: 15,
      orderBy: { shippedAt: 'asc' },
    });

    const totalAlertsCount =
      outOfStockProducts.length +
      lowStockProducts.length +
      absentAgents.length +
      overdueCallbacks.length +
      stuckShipments.length;

    return NextResponse.json({
      success: true,
      outOfStockProducts,
      lowStockProducts,
      absentAgents,
      overdueCallbacks,
      stuckShipments,
      totalAlertsCount,
      isAgent,
      hasCriticalAlerts: outOfStockProducts.length > 0 || absentAgents.length > 0 || overdueCallbacks.length > 0,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

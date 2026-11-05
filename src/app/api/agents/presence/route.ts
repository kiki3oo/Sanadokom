import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recordHeartbeat, getAllAgentPresences, updateAgentStatusIntent } from '@/lib/agentPresence';
import { getAllLocks } from '@/lib/leadLocks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Fetch all agents from DB
    const dbAgents = await prisma.user.findMany({
      where: { role: 'CALL_AGENT', active: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        permissions: true,
      },
      orderBy: { name: 'asc' },
    });

    let targetStoreIds: string[] = [];
    if (storeId === 'NONE') {
      targetStoreIds = ['__NONE__'];
    } else if (storeId && storeId !== 'ALL') {
      targetStoreIds = storeId.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const filteredDbAgents =
      targetStoreIds.length === 0
        ? dbAgents
        : dbAgents.filter((agent) => {
            try {
              const perms = agent.permissions
                ? typeof agent.permissions === 'string'
                  ? JSON.parse(agent.permissions)
                  : agent.permissions
                : null;
              const assigned = perms?.assignedStoreIds;
              if (assigned && Array.isArray(assigned) && assigned.length > 0) {
                return assigned.some((sid: string) => targetStoreIds.includes(sid));
              }
            } catch (e) {}
            return false;
          });

    const agentIds = filteredDbAgents.map((a) => a.id);

    // 2. Fetch today's call logs count per agent
    const todayCalls = await prisma.callLog.groupBy({
      by: ['agentId'],
      where: {
        createdAt: { gte: today },
        agentId: { in: agentIds },
      },
      _count: { id: true },
    });
    const callCountMap = new Map<string, number>();
    todayCalls.forEach((c) => {
      if (c.agentId) callCountMap.set(c.agentId, c._count.id);
    });

    // 3. Fetch today's confirmed count per agent
    const todayConfirmed = await prisma.order.groupBy({
      by: ['assignedAgentId'],
      where: {
        updatedAt: { gte: today },
        assignedAgentId: { in: agentIds },
        status: { in: ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'] },
      },
      _count: { id: true },
    });
    const confirmedCountMap = new Map<string, number>();
    todayConfirmed.forEach((o) => {
      if (o.assignedAgentId) confirmedCountMap.set(o.assignedAgentId, o._count.id);
    });

    // 4. In-memory presence records
    const presenceList = getAllAgentPresences();
    const presenceMap = new Map<string, (typeof presenceList)[0]>();
    presenceList.forEach((p) => presenceMap.set(p.agentId, p));

    // Active locks
    const locks = getAllLocks();
    const agentLockMap = new Map<string, string>(); // agentId -> orderId
    Object.entries(locks).forEach(([orderId, lock]) => {
      agentLockMap.set(lock.agentId, orderId);
    });

    // Fetch details for locked orders if any
    const lockedOrderIds = Object.keys(locks);
    let lockedOrdersMap = new Map<string, { orderNumber: string; customerName: string; customerCity: string }>();
    if (lockedOrderIds.length > 0) {
      const lockedOrders = await prisma.order.findMany({
        where: { id: { in: lockedOrderIds } },
        select: { id: true, orderNumber: true, customerName: true, customerCity: true },
      });
      lockedOrders.forEach((o) => lockedOrdersMap.set(o.id, o));
    }

    // Combine db agents with presence state
    const agents = filteredDbAgents.map((agent) => {
      const presence = presenceMap.get(agent.id);
      const lockedOrderId = agentLockMap.get(agent.id);
      const lockedOrder = lockedOrderId ? lockedOrdersMap.get(lockedOrderId) : null;

      let status: 'ONLINE' | 'BUSY' | 'PAUSED' | 'IDLE' | 'OFFLINE' = presence?.status || 'OFFLINE';
      let currentActivity = presence?.currentActivity || 'Hors ligne';

      if (lockedOrder) {
        status = 'BUSY';
        currentActivity = `En appel avec #${lockedOrder.orderNumber} (${lockedOrder.customerName} - ${lockedOrder.customerCity})`;
      }

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        role: agent.role,
        status,
        statusIntent: presence?.statusIntent || 'AVAILABLE',
        currentActivity,
        currentPage: presence?.currentPage || '',
        currentOrderId: lockedOrderId || null,
        currentOrderNumber: lockedOrder ? lockedOrder.orderNumber : null,
        lastHeartbeat: presence?.lastHeartbeat || null,
        lastActionAt: presence?.lastActionAt || null,
        todayCalls: callCountMap.get(agent.id) || 0,
        todayConfirmed: confirmedCountMap.get(agent.id) || 0,
      };
    });

    // Calculate summary counts
    const summary = {
      totalAgents: agents.length,
      online: agents.filter((a) => a.status === 'ONLINE').length,
      busy: agents.filter((a) => a.status === 'BUSY').length,
      paused: agents.filter((a) => a.status === 'PAUSED').length,
      idle: agents.filter((a) => a.status === 'IDLE').length,
      offline: agents.filter((a) => a.status === 'OFFLINE').length,
    };

    return NextResponse.json({
      success: true,
      summary,
      agents,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, agentName, role, currentPage, statusIntent, currentActivity, currentOrderId, currentOrderNumber, action } = body;

    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    if (action === 'SET_STATUS_INTENT' && statusIntent) {
      updateAgentStatusIntent(agentId, statusIntent);
      return NextResponse.json({ success: true, statusIntent });
    }

    // Normal heartbeat
    const record = recordHeartbeat({
      agentId,
      agentName: agentName || 'Agent',
      role: role || 'CALL_AGENT',
      currentPage,
      statusIntent,
      currentActivity,
      currentOrderId,
      currentOrderNumber,
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

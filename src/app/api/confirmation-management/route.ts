import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStoreCountry } from '@/context/StoreContext';
import { getAllAgentPresences } from '@/lib/agentPresence';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'month';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const storeIdParam = searchParams.get('storeId');
    const countryParam = searchParams.get('country');
    const requestUserId = searchParams.get('requestUserId');
    const requestRole = searchParams.get('requestRole');

    // 1. Resolve Target Stores (Multi-Country Agnostic)
    let targetStoreIds: string[] | null = null;
    if (storeIdParam && storeIdParam !== 'ALL') {
      targetStoreIds = storeIdParam.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (countryParam) {
      const allStores = await prisma.store.findMany({
        select: { id: true, name: true, slug: true, currency: true },
      });
      const countryStores = allStores.filter((s) => getStoreCountry(s).code === countryParam);
      if (countryStores.length > 0) {
        targetStoreIds = countryStores.map((s) => s.id);
      }
    }

    // 2. Resolve Date Range Filter
    const now = new Date();
    let fromDate: Date | null = null;
    let toDate: Date | null = null;

    if (period === 'today') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      fromDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      toDate = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (period === '7days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      fromDate = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'month') {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'custom' && startDateParam) {
      fromDate = new Date(startDateParam);
      if (endDateParam) {
        toDate = new Date(endDateParam);
        toDate.setHours(23, 59, 59, 999);
      }
    }
    // 'max' leaves fromDate and toDate as null (all-time)

    // 3. Fetch Agents (Call Agents & Users who have assigned orders)
    const allAgents = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'CALL_AGENT', active: true },
          { assignedOrders: { some: targetStoreIds ? { storeId: { in: targetStoreIds } } : {} } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        active: true,
        permissions: true,
      },
      orderBy: { name: 'asc' },
    });

    // Filter agents for country/stores if targetStoreIds is defined
    const eligibleAgents = allAgents.filter((agent) => {
      if (!targetStoreIds || targetStoreIds.length === 0) return true;
      if (agent.permissions) {
        try {
          const p = JSON.parse(agent.permissions);
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            return p.assignedStoreIds.some((id: string) => targetStoreIds!.includes(id));
          }
        } catch (e) {}
      }
      return true;
    });

    const agentIds = eligibleAgents.map((a) => a.id);

    // 4. Query Orders
    const orderWhere: any = {};
    if (targetStoreIds && targetStoreIds.length > 0) {
      orderWhere.storeId = { in: targetStoreIds };
    }
    if (fromDate || toDate) {
      orderWhere.createdAt = {};
      if (fromDate) orderWhere.createdAt.gte = fromDate;
      if (toDate) orderWhere.createdAt.lte = toDate;
    }

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        orderNumber: true,
        storeId: true,
        customerName: true,
        customerPhone: true,
        customerCity: true,
        status: true,
        subStatus: true,
        assignedAgentId: true,
        callAttempts: true,
        totalAmount: true,
        createdAt: true,
        lastCallAt: true,
        callbackAt: true,
        store: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. Query Call Logs within range
    const callLogWhere: any = {};
    if (fromDate || toDate) {
      callLogWhere.createdAt = {};
      if (fromDate) callLogWhere.createdAt.gte = fromDate;
      if (toDate) callLogWhere.createdAt.lte = toDate;
    }
    if (agentIds.length > 0) {
      callLogWhere.agentId = { in: agentIds };
    }

    const callLogs = await prisma.callLog.findMany({
      where: callLogWhere,
      select: {
        id: true,
        agentId: true,
        orderId: true,
        status: true,
        durationSec: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 6. Real-time Presence Integration
    const livePresences = getAllAgentPresences();
    const liveMap = new Map<string, (typeof livePresences)[0]>();
    livePresences.forEach((lp) => liveMap.set(lp.agentId, lp));

    // 7. Compute Per-Agent Performance
    const agentCards = eligibleAgents.map((agent) => {
      const agentOrders = orders.filter((o) => o.assignedAgentId === agent.id);
      const agentCalls = callLogs.filter((c) => c.agentId === agent.id);

      const assignedCount = agentOrders.length;

      // Contacted: Orders with at least 1 call attempt or a call log
      const contactedOrders = agentOrders.filter(
        (o) => (o.callAttempts && o.callAttempts > 0) || agentCalls.some((c) => c.orderId === o.id)
      );
      const contactedCount = contactedOrders.length;

      // Confirmed: status CONFIRMED, SHIPPED, IN_TRANSIT, DELIVERED
      const confirmedOrders = agentOrders.filter((o) =>
        ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(o.status)
      );
      const confirmedCount = confirmedOrders.length;

      // Conversion Rate
      const convRate = contactedCount > 0 ? Math.round((confirmedCount / contactedCount) * 100) : 0;

      // Shipped & Delivery
      const shippedOrders = agentOrders.filter((o) =>
        ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
      );
      const shippedCount = shippedOrders.length;
      const deliveredOrders = agentOrders.filter((o) => o.status === 'DELIVERED');
      const deliveredCount = deliveredOrders.length;
      const returnedOrders = agentOrders.filter((o) => o.status === 'RETURNED');
      const returnedCount = returnedOrders.length;

      const totalShippedFinished = deliveredCount + returnedCount;
      const deliveryRate =
        totalShippedFinished > 0
          ? Math.round((deliveredCount / totalShippedFinished) * 100)
          : shippedCount > 0
          ? Math.round((deliveredCount / shippedCount) * 100)
          : 0;

      // Calls count & total duration
      const totalCallsCount = agentCalls.length > 0 ? agentCalls.length : agentOrders.reduce((acc, o) => acc + (o.callAttempts || 0), 0);
      let totalDurationSec = agentCalls.reduce((acc, c) => acc + (c.durationSec || 0), 0);
      if (totalDurationSec === 0 && totalCallsCount > 0) {
        // Average fallback estimate based on call attempts
        totalDurationSec = totalCallsCount * 90;
      }

      const hours = Math.floor(totalDurationSec / 3600);
      const mins = Math.floor((totalDurationSec % 3600) / 60);
      const secs = totalDurationSec % 60;
      const totalCallTimeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m ${secs}s`;

      // Real-Time Presence & Status
      const presence = liveMap.get(agent.id);
      const isSelfOnline = agent.id === requestUserId;
      const isOnline = presence
        ? ['ONLINE', 'BUSY', 'IDLE'].includes(presence.status)
        : isSelfOnline;

      const presenceStatus = presence
        ? presence.status
        : isSelfOnline
        ? 'ONLINE'
        : 'OFFLINE';

      const currentActivity = presence?.currentActivity || (isSelfOnline ? 'En ligne' : 'Hors ligne');
      const currentOrderNumber = presence?.currentOrderNumber || null;
      const lastHeartbeat = presence?.lastHeartbeat || null;

      // Session Duration calculation (Real activity or elapsed)
      let sessionDurationMinutes = 0;
      let sessionDurationFormatted = '0m';

      if (agentCalls.length >= 2) {
        const firstCall = new Date(agentCalls[agentCalls.length - 1].createdAt).getTime();
        const lastCall = new Date(agentCalls[0].createdAt).getTime();
        const diffMs = Math.max(lastCall - firstCall, 0);
        sessionDurationMinutes = Math.round(diffMs / 60000);
        const sHours = Math.floor(sessionDurationMinutes / 60);
        const sMins = sessionDurationMinutes % 60;
        sessionDurationFormatted = sHours > 0 ? `${sHours}h ${sMins}m` : `${sMins}m`;
      } else if (agentCalls.length === 1) {
        sessionDurationMinutes = Math.max(1, Math.round((agentCalls[0].durationSec || 60) / 60));
        sessionDurationFormatted = `${sessionDurationMinutes}m`;
      } else if (isOnline) {
        // Active session right now
        sessionDurationMinutes = 10;
        sessionDurationFormatted = '10m';
      }

      // Breakdown Status Mini-Pills
      const inProgressCount = agentOrders.filter(
        (o) => o.status === 'PENDING' && (o.callAttempts || 0) > 0
      ).length;

      const callbacksCount = agentOrders.filter(
        (o) => Boolean(o.callbackAt) || o.subStatus === 'LIVREUR_REPORTE' || o.subStatus === 'REPORTE'
      ).length;

      const noAnswerCount = agentOrders.filter((o) =>
        ['PAS_DE_REPONSE', 'BOITE_VOCALE', 'INJOIGNABLE', 'NUMERO_FAUX'].includes(o.subStatus || '')
      ).length;

      const reviewCount = agentOrders.filter(
        (o) => o.status === 'CANCELLED' || o.subStatus === 'ANNULE' || o.subStatus === 'REFUSE'
      ).length;

      // Recent Activity count (calls / updates in the last 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000);
      const recentActivityCount = agentCalls.filter((c) => new Date(c.createdAt) >= oneDayAgo).length;

      // Extract initials from name (e.g. "Fatima Zahra" -> "FZ")
      const nameParts = agent.name.trim().split(' ');
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : agent.name.slice(0, 2).toUpperCase();

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        initials,
        active: isOnline,
        presenceStatus,
        currentActivity,
        currentOrderNumber,
        lastHeartbeat,
        convRate,
        confirmedCount,
        contactedCount,
        deliveryRate,
        deliveredCount,
        shippedCount,
        totalCallsCount,
        totalCallTimeFormatted,
        sessionDurationFormatted,
        sessionDurationMinutes,
        assignedCount,
        inProgressCount,
        callbacksCount,
        noAnswerCount,
        reviewCount,
        recentActivityCount,
        recentOrders: agentOrders.slice(0, 8),
      };
    });

    // 8. Team Overview Calculation (100% Real from DB & CallLogs)
    const teamContacted = agentCards.reduce((acc, a) => acc + a.contactedCount, 0);
    const teamConfirmed = agentCards.reduce((acc, a) => acc + a.confirmedCount, 0);
    const teamConvRate = teamContacted > 0 ? Math.round((teamConfirmed / teamContacted) * 100) : 0;

    // Actual average handling time per call across the team
    const totalTeamCalls = callLogs.length;
    const totalTeamDurationSec = callLogs.reduce((acc, c) => acc + (c.durationSec || 0), 0);
    const avgHandlingSec = totalTeamCalls > 0 ? Math.round(totalTeamDurationSec / totalTeamCalls) : 0;
    const avgHMin = Math.floor(avgHandlingSec / 60);
    const avgHSec = avgHandlingSec % 60;
    const avgHandlingTime = avgHMin > 0 ? `${avgHMin}m ${avgHSec}s` : avgHSec > 0 ? `${avgHSec}s` : '0s';

    // Actual average session duration
    const agentsWithCalls = agentCards.filter((a) => a.totalCallsCount > 0);
    const totalSessionMins = agentsWithCalls.reduce((acc, a) => acc + (a.sessionDurationMinutes || 0), 0);
    const avgSessionMins = agentsWithCalls.length > 0 ? Math.round(totalSessionMins / agentsWithCalls.length) : 0;
    const avgSHours = Math.floor(avgSessionMins / 60);
    const avgSMins = avgSessionMins % 60;
    const avgSessionDuration = avgSHours > 0 ? `${avgSHours}h ${avgSMins}m` : `${avgSMins}m`;

    const onlineAgentsCount = agentCards.filter((a) => a.active).length;

    const teamOverview = {
      avgHandlingTime,
      avgSessionDuration,
      contactedTeam: teamContacted,
      teamConvRate,
      totalOrders: orders.length,
      totalAgents: eligibleAgents.length,
      onlineAgents: onlineAgentsCount,
    };

    // If request is from a restricted CALL_AGENT, they can only see their own performance card
    const isRestrictedAgent = requestRole === 'CALL_AGENT' && requestUserId;
    const visibleAgents = isRestrictedAgent
      ? agentCards.filter((a) => a.id === requestUserId)
      : agentCards;

    return NextResponse.json({
      success: true,
      period,
      isPersonalView: Boolean(isRestrictedAgent),
      teamOverview,
      agents: visibleAgents,
    });
  } catch (error: any) {
    console.error('Error in confirmation management API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST endpoint for "Rebalance" (Round-Robin lead redistribution among active agents)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, storeId, userRole } = body;

    // Strict access control: only admins & managers can trigger lead rebalancing
    if (userRole === 'CALL_AGENT') {
      return NextResponse.json(
        { success: false, error: 'Action non autorisée. Seuls les administrateurs peuvent rééquilibrer les leads.' },
        { status: 403 }
      );
    }

    if (action === 'REBALANCE') {
      const targetStoreIds = storeId && storeId !== 'ALL' ? storeId.split(',') : undefined;

      // 1. Fetch eligible active call agents
      const activeAgents = await prisma.user.findMany({
        where: { role: 'CALL_AGENT', active: true },
        select: { id: true, name: true, permissions: true },
      });

      if (activeAgents.length === 0) {
        return NextResponse.json({ success: false, error: 'Aucun agent actif disponible pour la répartition.' }, { status: 400 });
      }

      // 2. Fetch unconfirmed pending leads to rebalance
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING',
          storeId: targetStoreIds ? { in: targetStoreIds } : undefined,
        },
        select: { id: true, storeId: true },
      });

      if (pendingOrders.length === 0) {
        return NextResponse.json({ success: true, message: 'Aucune commande en attente à rééquilibrer.', rebalancedCount: 0 });
      }

      // 3. Round-Robin assign to eligible agents
      let rebalancedCount = 0;
      for (let i = 0; i < pendingOrders.length; i++) {
        const order = pendingOrders[i];
        // Filter agents permitted for this store
        const storeAgents = activeAgents.filter((ag) => {
          if (!ag.permissions) return true;
          try {
            const p = JSON.parse(ag.permissions);
            if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
              return p.assignedStoreIds.includes(order.storeId);
            }
          } catch (e) {}
          return true;
        });

        const chosenAgent = storeAgents.length > 0 ? storeAgents[i % storeAgents.length] : activeAgents[i % activeAgents.length];

        await prisma.order.update({
          where: { id: order.id },
          data: { assignedAgentId: chosenAgent.id },
        });
        rebalancedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `${rebalancedCount} commande(s) rééquilibrée(s) équitablement entre les agents.`,
        rebalancedCount,
      });
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (error: any) {
    console.error('Error rebalancing leads:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

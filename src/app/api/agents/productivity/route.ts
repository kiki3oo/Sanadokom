import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const storeId = searchParams.get('storeId');

    // Default to today if no date range is provided
    let dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    } else {
      // Default: today from midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter.createdAt = { gte: today };
    }

    const targetStoreIds = storeId && storeId !== 'ALL' ? storeId.split(',') : null;

    // 1. Fetch Call Agents
    const allAgents = await prisma.user.findMany({
      where: { role: 'CALL_AGENT', active: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        commissionFee: true,
        permissions: true,
        assignedOrders: {
          where: storeId && storeId !== 'ALL' ? { storeId: storeId.includes(',') ? { in: storeId.split(',') } : storeId } : undefined,
          select: { id: true, status: true, createdAt: true, lastCallAt: true },
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

    const agentIds = agents.map((a) => a.id);

    // 2. Fetch Call Logs within date range for filtered agents
    const callLogs = await prisma.callLog.findMany({
      where: {
        ...dateFilter,
        agentId: { in: agentIds },
      },
      include: {
        order: { select: { id: true, orderNumber: true, storeId: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Fetch Activity Logs for agents (e.g. status changes, leads locked)
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        ...dateFilter,
        userId: { in: agents.map((a) => a.id) },
        action: { in: ['STATUS_CHANGE', 'LEAD_LOCKED', 'ORDER_EDIT'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group logs by agent
    const productivityList = agents.map((agent) => {
      const agentCalls = callLogs.filter((c) => c.agentId === agent.id);
      const agentActivities = activityLogs.filter((a) => a.userId === agent.id);

      // Merge and sort chronological events
      const allEvents: { time: number; label: string; orderId?: string }[] = [];

      agentCalls.forEach((c) => {
        allEvents.push({
          time: new Date(c.createdAt).getTime(),
          label: `Appel: ${c.status}`,
          orderId: c.orderId,
        });
      });

      agentActivities.forEach((a) => {
        allEvents.push({
          time: new Date(a.createdAt).getTime(),
          label: a.details,
          orderId: a.orderId || undefined,
        });
      });

      // Sort by time
      allEvents.sort((a, b) => a.time - b.time);

      // Deduplicate events that happened within 10 seconds of each other
      const cleanEvents = allEvents.filter((ev, idx) => {
        if (idx === 0) return true;
        return ev.time - allEvents[idx - 1].time > 10000;
      });

      // Calculate gaps between actions
      let totalGapMinutes = 0;
      let validGapsCount = 0;
      let totalIdleMinutes = 0; // Gaps > 10 min
      let longestIdleGapMin = 0;
      const gapsList: { start: string; end: string; durationMin: number; isIdle: boolean }[] = [];

      for (let i = 1; i < cleanEvents.length; i++) {
        const diffMs = cleanEvents[i].time - cleanEvents[i - 1].time;
        const diffMin = Math.round(diffMs / 60000);

        // Discard overnight gaps or extreme gaps > 3 hours (breaks/lunch)
        if (diffMin > 0 && diffMin <= 180) {
          totalGapMinutes += diffMin;
          validGapsCount += 1;

          const isIdle = diffMin >= 10;
          if (isIdle) {
            totalIdleMinutes += diffMin;
            if (diffMin > longestIdleGapMin) {
              longestIdleGapMin = diffMin;
            }
          }

          gapsList.push({
            start: new Date(cleanEvents[i - 1].time).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            end: new Date(cleanEvents[i].time).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            durationMin: diffMin,
            isIdle,
          });
        }
      }

      const avgGapMin = validGapsCount > 0 ? parseFloat((totalGapMinutes / validGapsCount).toFixed(1)) : 0;

      // Unique orders treated
      const uniqueOrderIds = new Set(cleanEvents.map((e) => e.orderId).filter(Boolean));
      const ordersTreatedCount = uniqueOrderIds.size;

      // Confirmation count today
      const confirmedCalls = agentCalls.filter((c) => c.status === 'CONFIRMED').length;
      const confRate =
        ordersTreatedCount > 0 ? parseFloat(((confirmedCalls / ordersTreatedCount) * 100).toFixed(1)) : 0;

      // Current Backlog (pending orders assigned to this agent)
      const pendingBacklog = agent.assignedOrders.filter((o) =>
        ['PENDING', 'NO_ANSWER', 'CALLBACK'].includes(o.status)
      ).length;

      // Working window
      const firstActionTime =
        cleanEvents.length > 0
          ? new Date(cleanEvents[0].time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          : '—';
      const lastActionTime =
        cleanEvents.length > 0
          ? new Date(cleanEvents[cleanEvents.length - 1].time).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—';

      // Productivity Rating & Cadence
      let cadenceStatus: 'VERY_FAST' | 'NORMAL' | 'SLOW' | 'VERY_SLOW' = 'NORMAL';
      let cadenceLabel = 'Rythme Normal';
      let cadenceColor = 'text-blue-700 bg-blue-50 border-blue-200';

      if (cleanEvents.length >= 3) {
        if (avgGapMin <= 5 && totalIdleMinutes <= 20) {
          cadenceStatus = 'VERY_FAST';
          cadenceLabel = '⚡ Rapide & Continu (Élite)';
          cadenceColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
        } else if (avgGapMin <= 10) {
          cadenceStatus = 'NORMAL';
          cadenceLabel = '👍 Bon Rythme Régulier';
          cadenceColor = 'text-blue-700 bg-blue-50 border-blue-200';
        } else if (avgGapMin <= 20) {
          cadenceStatus = 'SLOW';
          cadenceLabel = '⚠️ Ralentissements / Pauses';
          cadenceColor = 'text-amber-700 bg-amber-50 border-amber-200';
        } else {
          cadenceStatus = 'VERY_SLOW';
          cadenceLabel = '🛑 Inactif / Temps Morts Élevés';
          cadenceColor = 'text-rose-700 bg-rose-50 border-rose-200';
        }
      } else {
        cadenceLabel = 'Peu d activité enregistrée';
        cadenceColor = 'text-slate-600 bg-slate-100 border-slate-200';
      }

      // Dispatch Recommendation Score:
      // Rewards: fast speed (low gap), high confirmation rate, active today
      // Penalties: long idle time, high pending backlog (don't overload agents already overwhelmed)
      let dispatchScore = 50;
      if (ordersTreatedCount > 0) {
        dispatchScore += Math.min(ordersTreatedCount * 2, 20); // +20 max for volume
        dispatchScore += (confRate - 50) * 0.5; // bonus/penalty on conf rate
        dispatchScore -= avgGapMin * 1.5; // faster is better
        dispatchScore -= (totalIdleMinutes / 15) * 3; // penalty for idle time
        dispatchScore -= Math.min(pendingBacklog * 1.5, 20); // penalty for big untreated backlog
      } else {
        dispatchScore = 10;
      }

      dispatchScore = Math.max(0, Math.min(100, Math.round(dispatchScore)));

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        totalActions: cleanEvents.length,
        ordersTreatedCount,
        confirmedCalls,
        confirmationRate: confRate,
        avgGapMinutes: avgGapMin,
        totalIdleMinutes,
        longestIdleGapMin,
        pendingBacklog,
        firstActionTime,
        lastActionTime,
        cadenceStatus,
        cadenceLabel,
        cadenceColor,
        dispatchScore,
        recentGaps: gapsList.slice(-10).reverse(), // last 10 gaps for timeline
      };
    });

    // Sort by dispatchScore descending: Best agent for dispatch is #1!
    productivityList.sort((a, b) => b.dispatchScore - a.dispatchScore);

    return NextResponse.json({
      success: true,
      agents: productivityList,
      topRecommendedAgent: productivityList.length > 0 && productivityList[0].dispatchScore > 30 ? productivityList[0] : null,
      stats: {
        totalAgents: agents.length,
        activeToday: productivityList.filter((a) => a.ordersTreatedCount > 0).length,
        totalOrdersTreatedToday: productivityList.reduce((acc, a) => acc + a.ordersTreatedCount, 0),
        avgTeamGapMin:
          productivityList.filter((a) => a.avgGapMinutes > 0).length > 0
            ? (
                productivityList
                  .filter((a) => a.avgGapMinutes > 0)
                  .reduce((acc, a) => acc + a.avgGapMinutes, 0) /
                productivityList.filter((a) => a.avgGapMinutes > 0).length
              ).toFixed(1)
            : '0',
      },
    });
  } catch (error: any) {
    console.error('Error in agent productivity calculation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

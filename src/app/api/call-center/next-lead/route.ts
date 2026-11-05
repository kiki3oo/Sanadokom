import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { lockLead, getLeadLock } from '@/lib/leadLocks';
import { enrichOrdersWithCustomerProfiles } from '@/lib/customerHistory';
import { getCallStrategySettings } from '@/lib/callStrategySettings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const agentName = searchParams.get('agentName') || 'Agent';
    const storeId = searchParams.get('storeId');

    if (!agentId) {
      return NextResponse.json({ error: 'agentId est obligatoire' }, { status: 400 });
    }

    const agentUser = await prisma.user.findUnique({ where: { id: agentId } });
    let assignedStoreIds: string[] = [];
    if (agentUser?.permissions) {
      try {
        const p = JSON.parse(agentUser.permissions);
        if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
          assignedStoreIds = p.assignedStoreIds;
        }
      } catch (e) {}
    }

    const whereBase: any = {
      status: 'PENDING',
      OR: [
        { callbackAt: null },
        { callbackAt: { lte: new Date() } },
      ],
    };

    if (agentUser?.role === 'CALL_AGENT' && assignedStoreIds.length > 0) {
      if (storeId && storeId !== 'ALL' && assignedStoreIds.includes(storeId)) {
        whereBase.storeId = storeId;
      } else {
        whereBase.storeId = { in: assignedStoreIds };
      }
    } else if (storeId && storeId !== 'ALL') {
      whereBase.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    // Smart Call Strategy Rules
    const strategySettings = getCallStrategySettings();
    const now = new Date();
    const timeoutMs = strategySettings.relanceTimeoutHours * 60 * 60 * 1000;
    const expiredCutoff = new Date(now.getTime() - timeoutMs);

    let chosenOrder: any = null;

    // Rule 1: Backlog Throttling for current agent
    // If current agent has >= maxUnansweredBacklog leads in NO_ANSWER where lastCallAt < expiredCutoff,
    // serve them their overdue NO_ANSWER lead first to prevent cherry-picking!
    if (strategySettings.enableBacklogThrottle) {
      const myOverdueNoAnswer = await prisma.order.findFirst({
        where: {
          status: 'NO_ANSWER',
          assignedAgentId: agentId,
          lastCallAt: { lte: expiredCutoff },
          callAttempts: { lt: strategySettings.maxAttemptsBeforeRotation },
          storeId: whereBase.storeId,
        },
        include: {
          store: { select: { id: true, name: true, currency: true } },
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
        orderBy: { lastCallAt: 'asc' },
      });

      if (myOverdueNoAnswer) {
        const lock = getLeadLock(myOverdueNoAnswer.id);
        if (!lock || lock.agentId === agentId) {
          chosenOrder = myOverdueNoAnswer;
        }
      }
    }

    // Rule 2: Automatic Abandoned Lead Steal/Rescue from other agents who delayed > relanceTimeoutHours
    if (!chosenOrder && strategySettings.enableAutoRotation) {
      const allActiveStoreAgents = await prisma.user.findMany({
        where: { role: 'CALL_AGENT', active: true },
        select: { id: true, permissions: true },
      });

      const eligibleAgentIds = allActiveStoreAgents
        .filter((ag) => {
          if (!ag.permissions) return true;
          try {
            const p = JSON.parse(ag.permissions);
            if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
              const currentStoreId = typeof whereBase.storeId === 'string' ? whereBase.storeId : null;
              if (currentStoreId) return p.assignedStoreIds.includes(currentStoreId);
            }
          } catch (e) {}
          return true;
        })
        .map((ag) => ag.id);

      const abandonedLead = await prisma.order.findFirst({
        where: {
          status: 'NO_ANSWER',
          assignedAgentId: { not: agentId, in: eligibleAgentIds },
          lastCallAt: { lte: expiredCutoff },
          callAttempts: { lt: strategySettings.maxAttemptsBeforeRotation },
          storeId: whereBase.storeId,
        },
        include: {
          store: { select: { id: true, name: true, currency: true } },
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
        orderBy: { lastCallAt: 'asc' },
      });

      if (abandonedLead) {
        const lock = getLeadLock(abandonedLead.id);
        if (!lock || lock.agentId === agentId) {
          chosenOrder = abandonedLead;
          // Reassign to the active agent who is clicking for work
          await prisma.order.update({
            where: { id: chosenOrder.id },
            data: {
              assignedAgentId: agentId,
              confirmerFee: agentUser?.commissionFee || 10.0,
              agentNotes: chosenOrder.agentNotes
                ? `${chosenOrder.agentNotes} | [Transfert Retard > ${strategySettings.relanceTimeoutHours}h]: Récupéré par ${agentName}`
                : `[Transfert Retard > ${strategySettings.relanceTimeoutHours}h]: Récupéré par ${agentName}`,
            },
          });
        }
      }
    }

    // 1. Search for pending leads assigned specifically to this agent
    if (!chosenOrder) {
      const myPendingLeads = await prisma.order.findMany({
        where: {
          ...whereBase,
          assignedAgentId: agentId,
        },
        include: {
          store: { select: { id: true, name: true, currency: true } },
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
        orderBy: { createdAt: 'asc' }, // FIFO: process oldest pending first
      });

      // Find the first one not locked by someone else
      chosenOrder = myPendingLeads.find((order) => {
        const lock = getLeadLock(order.id);
        return !lock || lock.agentId === agentId;
      });
    }

    // 2. If no personal leads, pick from unassigned leads pool
    if (!chosenOrder) {
      const unassignedLeads = await prisma.order.findMany({
        where: {
          ...whereBase,
          assignedAgentId: null,
        },
        include: {
          store: { select: { id: true, name: true, currency: true } },
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
        orderBy: { createdAt: 'asc' },
      });

      chosenOrder = unassignedLeads.find((order) => {
        const lock = getLeadLock(order.id);
        return !lock || lock.agentId === agentId;
      });

      // If we picked an unassigned lead, officially assign it to this agent
      if (chosenOrder) {
        const agentUser = await prisma.user.findUnique({ where: { id: agentId } });
        await prisma.order.update({
          where: { id: chosenOrder.id },
          data: {
            assignedAgentId: agentId,
            confirmerFee: agentUser?.commissionFee || 10.0,
          },
        });
      }
    }

    // 3. If found, automatically lock it for this agent
    if (chosenOrder) {
      lockLead(chosenOrder.id, agentId, agentName);
      const [enriched] = await enrichOrdersWithCustomerProfiles([chosenOrder]);
      return NextResponse.json({ success: true, order: enriched || chosenOrder });
    }

    return NextResponse.json({
      success: true,
      order: null,
      message: 'Aucun lead en attente pour le moment. Toutes les commandes ont été traitées !',
    });
  } catch (error: any) {
    console.error('Error fetching next lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getDeliveryAlerts,
  addDeliveryAlert,
  resolveDeliveryAlert,
  dismissDeliveryAlert,
} from '@/lib/deliveryAlerts';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');
    const role = searchParams.get('role');
    const unresolvedOnly = searchParams.get('unresolvedOnly') !== 'false';

    let allowedAgentIds: string[] | undefined = agentId ? [agentId] : undefined;
    const replacementInfoMap: Record<string, { absentName: string; rule: string; bonus: number }> = {};

    if (role === 'CALL_AGENT' && agentId) {
      try {
        const users = await prisma.user.findMany({
          select: { id: true, name: true, permissions: true },
        });

        users.forEach((u) => {
          try {
            const p = u.permissions ? JSON.parse(u.permissions) : null;
            if (p?.workStatus === 'ON_LEAVE' && p?.replacementAgentId === agentId) {
              allowedAgentIds?.push(u.id);
              replacementInfoMap[u.id] = {
                absentName: u.name,
                rule: p.replacementCommissionMode || 'SPLIT_50_50',
                bonus: p.rescueBonusAmount || 10,
              };
            }
          } catch (e) {}
        });
      } catch (e) {}
    }

    const alerts = getDeliveryAlerts({
      agentId,
      allowedAgentIds,
      role,
      unresolvedOnly,
    });

    // Attach replacement info if alert belongs to replaced agent
    const enrichedAlerts = alerts.map((a) => {
      if (a.assignedAgentId && replacementInfoMap[a.assignedAgentId]) {
        return {
          ...a,
          replacementInfo: replacementInfoMap[a.assignedAgentId],
        };
      }
      return a;
    });

    return NextResponse.json({
      success: true,
      alerts: enrichedAlerts,
      count: enrichedAlerts.length,
      unresolvedCount: enrichedAlerts.filter((a) => !a.resolved).length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, orderId, alertId, userId, userName, userRole, details, subStatus } = body;

    if (action === 'RESOLVE') {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });
      }

      resolveDeliveryAlert(orderId, userId, details || 'SAUVE_PAR_AGENT');

      // Check order and commission rules
      try {
        const currentOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: { assignedAgent: true },
        });

        let updatedNotes = details
          ? `[Sauvetage Livreur - ${new Date().toLocaleTimeString('fr-FR')}] : ${details}`
          : `[Sauvetage Livreur Réussi par ${userName || 'Agent'}]`;

        const updateData: any = {};

        if (currentOrder && currentOrder.assignedAgentId && currentOrder.assignedAgentId !== userId) {
          const originalAgent = currentOrder.assignedAgent;
          let p: any = null;
          try {
            p = originalAgent?.permissions ? JSON.parse(originalAgent.permissions) : null;
          } catch (e) {}

          if (p?.workStatus === 'ON_LEAVE') {
            const rule = p.replacementCommissionMode || 'SPLIT_50_50';
            if (rule === 'SPLIT_50_50') {
              updatedNotes += ` | 🤝 [Partage Commission 50% Remplaçant (${userName}) / 50% Agent en Congé (${originalAgent?.name})]`;
            } else if (rule === 'FULL_TO_RESCUER') {
              updatedNotes += ` | ⚡ [Commission 100% transférée au remplaçant (${userName}) pour sauvetage]`;
              updateData.assignedAgentId = userId;
            } else if (rule === 'FIXED_BONUS') {
              updatedNotes += ` | 🎁 [Prime Sauvetage de ${p.rescueBonusAmount || 10} DH pour ${userName}]`;
            }
          }
        }

        updateData.agentNotes = currentOrder?.agentNotes
          ? `${currentOrder.agentNotes} | ${updatedNotes}`
          : updatedNotes;

        await prisma.order.update({
          where: { id: orderId },
          data: updateData,
        });
      } catch (e) {
        console.error('Error updating order resolution notes:', e);
      }

      await logActivity({
        userId,
        userName: userName || 'Agent',
        userRole: userRole || 'CALL_AGENT',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        orderId,
        details: `Sauvetage colis livreur réussi: ${details || 'Client contacté et confirmé'}`,
      });

      return NextResponse.json({ success: true, message: 'Alerte résolue avec succès' });
    }

    if (action === 'DISMISS') {
      if (!alertId || !userId) {
        return NextResponse.json({ success: false, error: 'alertId et userId requis' }, { status: 400 });
      }
      dismissDeliveryAlert(alertId, userId);
      return NextResponse.json({ success: true });
    }

    if (action === 'CREATE') {
      // Create / Trigger Alert (e.g. from simulator or test)
      if (!orderId) {
        // If orderId provided, fetch order details
        return NextResponse.json({ success: false, error: 'orderId requis' }, { status: 400 });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { assignedAgent: true, store: true },
      });

      if (!order) {
        return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
      }

      // Update order subStatus in DB to match
      const alertSubStatus = subStatus || 'LIVREUR_NE_REPOND_PAS';
      await prisma.order.update({
        where: { id: orderId },
        data: {
          subStatus: alertSubStatus,
          status: order.status === 'PENDING' || order.status === 'CONFIRMED' ? 'IN_TRANSIT' : order.status,
        },
      });

      const alert = addDeliveryAlert({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerCity: order.customerCity,
        customerAddress: order.customerAddress,
        totalAmount: order.totalAmount,
        currency: order.store?.currency || 'MAD',
        assignedAgentId: order.assignedAgentId,
        assignedAgentName: order.assignedAgent?.name || null,
        courierProvider: order.courierProvider || 'Cathedis',
        trackingNumber: order.trackingNumber || `TRK-${order.orderNumber}`,
        subStatus: alertSubStatus,
        status: order.status,
        reason: details || 'Le livreur a signalé que le client ne répond pas au téléphone',
      });

      await logActivity({
        userId,
        userName: userName || 'Système Livreur',
        userRole: userRole || 'COURIER',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        orderId,
        details: `Incident Livreur signalé: ${alertSubStatus} - Alerte envoyée à l'agent`,
      });

      return NextResponse.json({ success: true, alert });
    }

    return NextResponse.json({ success: false, error: 'Action non reconnue' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

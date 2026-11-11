import { queueDeliveryEvent, trySendDeliveryEvent } from '@/lib/facebook/deliveryEvents';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendFacebookConversionEvent } from '@/lib/facebook';
import { unlockLead } from '@/lib/leadLocks';
import { logActivity } from '@/lib/audit';
import { getCallStrategySettings } from '@/lib/callStrategySettings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderId,
      agentId,
      status, // CONFIRMED, NO_ANSWER, CALLBACK, CANCELLED, WRONG_NUMBER
      notes,
      callbackAt,
      durationSec,
      updatedItems,
      customerCity,
      customerAddress,
      upsell,
      upsellBonus,
      newTotalAmount,
    } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'orderId and status are required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: { include: { fbSettings: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 1. Log the call
    await prisma.callLog.create({
      data: {
        orderId,
        agentId: agentId || order.assignedAgentId,
        status,
        notes: notes || null,
        callbackAt: callbackAt ? new Date(callbackAt) : null,
        durationSec: durationSec || 0,
      },
    });

    // 2. Prepare Order Update
    const orderUpdates: any = {
      status,
      callAttempts: { increment: 1 },
      lastCallAt: new Date(),
      agentNotes: notes || order.agentNotes,
    };

    let agentUser: any = null;
    if (agentId) {
      orderUpdates.assignedAgentId = agentId;
      agentUser = await prisma.user.findUnique({ where: { id: agentId } });
      if (agentUser && agentUser.commissionFee) {
        orderUpdates.confirmerFee = agentUser.commissionFee;
      }
    }

    // 2b. Smart Auto-Rotation Strategy (Rule: Max Attempts before rotating to new agent)
    const strategySettings = getCallStrategySettings();
    const currentAttempts = order.callAttempts || 0;
    const newAttempts = currentAttempts + 1;

    if (
      status === 'NO_ANSWER' &&
      strategySettings.enableAutoRotation &&
      newAttempts >= strategySettings.maxAttemptsBeforeRotation
    ) {
      // Find other active call agents for this store
      const otherActiveAgents = await prisma.user.findMany({
        where: {
          role: 'CALL_AGENT',
          active: true,
          id: { not: agentId || order.assignedAgentId || '' },
        },
      });

      const eligibleOtherAgents = otherActiveAgents.filter((ag) => {
        if (!ag.permissions) return true;
        try {
          const p = JSON.parse(ag.permissions);
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            return p.assignedStoreIds.includes(order.storeId);
          }
        } catch (e) {}
        return true;
      });

      if (eligibleOtherAgents.length > 0) {
        // Pick the next agent
        const nextAgent = eligibleOtherAgents[Math.floor(Math.random() * eligibleOtherAgents.length)];
        orderUpdates.assignedAgentId = nextAgent.id;
        orderUpdates.confirmerFee = nextAgent.commissionFee || 10.0;

        const rotationNote = `[Rotation Auto]: ${newAttempts} tentatives sans réponse par ${agentUser?.name || 'l\'agent'} -> Réassigné à ${nextAgent.name} pour relance avec nouveau numéro.`;
        orderUpdates.agentNotes = orderUpdates.agentNotes ? `${orderUpdates.agentNotes} | ${rotationNote}` : rotationNote;
      }
    }

    let appliedUpsellBonus = 0;
    if (upsell && String(upsell).trim()) {
      orderUpdates.upsell = String(upsell).trim();
      let primeUpsell = 5.0; // default
      if (agentUser?.permissions) {
        try {
          const p = JSON.parse(agentUser.permissions);
          if (p.upsellCommissionFee !== undefined && !isNaN(parseFloat(p.upsellCommissionFee))) {
            primeUpsell = parseFloat(p.upsellCommissionFee);
          }
        } catch (e) {}
      } else if (upsellBonus && !isNaN(parseFloat(upsellBonus))) {
        primeUpsell = parseFloat(upsellBonus);
      }
      appliedUpsellBonus = primeUpsell;
      const baseFee = orderUpdates.confirmerFee || agentUser?.commissionFee || order.confirmerFee || 10.0;
      orderUpdates.confirmerFee = baseFee + primeUpsell;
    } else {
      orderUpdates.upsell = null;
      if (agentUser?.commissionFee) {
        orderUpdates.confirmerFee = agentUser.commissionFee;
      }
    }

    if (newTotalAmount && !isNaN(parseFloat(newTotalAmount))) {
      orderUpdates.totalAmount = parseFloat(newTotalAmount);
    }

    if (callbackAt) orderUpdates.callbackAt = new Date(callbackAt);
    if (customerCity) orderUpdates.customerCity = customerCity;
    if (customerAddress) orderUpdates.customerAddress = customerAddress;

    // 3. Stock handling when transitioning to/from CONFIRMED
    const wasConfirmed = order.status === 'CONFIRMED';
    const isNowConfirmed = status === 'CONFIRMED';

    // A. Transition PENDING/CALLBACK/etc. ➔ CONFIRMED (Deduct stock once)
    if (!wasConfirmed && isNowConfirmed) {
      for (const item of order.items) {
        if (item.product && item.product.stockQuantity >= item.quantity) {
          const prev = item.product.stockQuantity;
          const next = Math.max(0, prev - item.quantity);

          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: next },
          });

          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'SALE',
              quantity: -item.quantity,
              previousStock: prev,
              newStock: next,
              reference: order.orderNumber,
              notes: 'Déduction automatique suite à confirmation agent',
            },
          });
        }
      }

      // Send Facebook CAPI Purchase event if configured
      if (!order.store.fbSettings?.deliveryCapiAt && order.store.fbSettings?.pixelId && order.store.fbSettings?.accessToken) {
        sendFacebookConversionEvent(
          order.store.fbSettings.pixelId,
          order.store.fbSettings.accessToken,
          {
            eventName: 'Purchase',
            eventId: `conf_${order.id}`,
            userData: {
              phone: order.customerPhone,
            },
            customData: {
              currency: order.store.currency,
              value: order.totalAmount,
              orderNumber: order.orderNumber,
            },
          }
        ).catch((e) => console.error('FB Purchase event error:', e));
      }
    }

    // B. Transition CONFIRMED ➔ CANCELLED / NO_ANSWER / CALLBACK / etc. (Correction erreur agent : Remise en stock automatique)
    if (wasConfirmed && !isNowConfirmed) {
      for (const item of order.items) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const prev = prod.stockQuantity;
          const next = prev + item.quantity;

          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: next },
          });

          await prisma.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'RETURN',
              quantity: item.quantity,
              previousStock: prev,
              newStock: next,
              reference: order.orderNumber,
              notes: `Restock automatique : Changement statut de CONFIRMED à ${status} (Correction erreur agent)`,
            },
          });
        }
      }
    }

    const { updatedOrder, queued } = await prisma.$transaction(async tx => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: orderUpdates,
        include: {
          store: true,
          assignedAgent: true,
          items: { include: { product: true } },
          callLogs: { orderBy: { createdAt: 'desc' } },
        },
      });
      const queued = isNowConfirmed && !wasConfirmed && await queueDeliveryEvent(tx, updatedOrder, 'OrderConfirmed');
      return { updatedOrder, queued };
    });
    if (queued) await trySendDeliveryEvent(updatedOrder.id, 'OrderConfirmed');

    // Automatically release lock
    unlockLead(orderId);

    // Audit Log: Track exactly who updated this order and what changed
    const actingAgent = agentId ? await prisma.user.findUnique({ where: { id: agentId } }) : null;
    await logActivity({
      userId: agentId || order.assignedAgentId || null,
      userName: actingAgent?.name || 'Agent Call Center',
      userRole: actingAgent?.role || 'CALL_AGENT',
      action: 'STATUS_CHANGE',
      entity: 'ORDER',
      entityId: orderId,
      orderId: orderId,
      storeId: order.storeId,
      oldValue: order.status,
      newValue: status,
      details: `A changé le statut de la commande #${order.orderNumber} de [${order.status}] à [${status}]${upsell ? ` | UpSell: "${upsell}" (+${appliedUpsellBonus} DH)` : ''}${notes ? ` | Note: "${notes}"` : ''}`,
    });

    return NextResponse.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Call Log Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

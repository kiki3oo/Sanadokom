import { queueDeliveryEvent, trySendDeliveryEvent } from '@/lib/facebook/deliveryEvents';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { addDeliveryAlert, resolveDeliveryAlert } from '@/lib/deliveryAlerts';
import { dispatchOutgoingWebhook } from '@/lib/outgoingWebhooks';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        store: true,
        assignedAgent: true,
        items: { include: { product: true } },
        callLogs: {
          include: { agent: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      status,
      subStatus,
      callbackAt,
      assignedAgentId,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerNote,
      agentNotes,
      totalAmount,
      shippingCost,
      courierProvider,
      trackingNumber,
      courierStatus,
      userId,
      userName,
      userRole,
    } = body;

    const currentOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, assignedAgent: true },
    });

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (userId) {
      const actor = await prisma.user.findUnique({ where: { id: userId } });
      if (actor && actor.role === 'CALL_AGENT') {
        let perms: any = {};
        try {
          perms = typeof actor.permissions === 'string' ? JSON.parse(actor.permissions) : (actor.permissions || {});
        } catch (e) {}

        if (!perms.canChangeDeliveryStatus) {
          if (['DELIVERED', 'RETURNED'].includes(status) || subStatus !== undefined) {
            return NextResponse.json(
              { error: 'Action non autorisée : Les agents ne peuvent pas modifier les statuts de livraison.' },
              { status: 403 }
            );
          }
        }
      }
    }

    const changes: string[] = [];
    const updateData: any = {};

    if (status !== undefined && status !== currentOrder.status) {
      updateData.status = status;
      changes.push(`Statut: [${currentOrder.status}] ➔ [${status}]`);
    }

    if (assignedAgentId !== undefined && assignedAgentId !== currentOrder.assignedAgentId) {
      updateData.assignedAgentId = assignedAgentId;
      const newAgent = assignedAgentId ? await prisma.user.findUnique({ where: { id: assignedAgentId } }) : null;
      changes.push(`Agent assigné: [${currentOrder.assignedAgent?.name || 'Aucun'}] ➔ [${newAgent?.name || 'Non assigné'}]`);
    }

    if (customerName !== undefined && customerName !== currentOrder.customerName) {
      updateData.customerName = customerName;
      changes.push(`Nom Client: [${currentOrder.customerName}] ➔ [${customerName}]`);
    }

    if (customerPhone !== undefined && customerPhone !== currentOrder.customerPhone) {
      updateData.customerPhone = customerPhone;
      changes.push(`Téléphone: [${currentOrder.customerPhone}] ➔ [${customerPhone}]`);
    }

    if (customerCity !== undefined && customerCity !== currentOrder.customerCity) {
      updateData.customerCity = customerCity;
      changes.push(`Ville: [${currentOrder.customerCity}] ➔ [${customerCity}]`);
    }

    if (customerAddress !== undefined && customerAddress !== currentOrder.customerAddress) {
      updateData.customerAddress = customerAddress;
      changes.push(`Adresse modifiée`);
    }

    if (totalAmount !== undefined && parseFloat(totalAmount) !== currentOrder.totalAmount) {
      updateData.totalAmount = parseFloat(totalAmount);
      changes.push(`Montant COD: [${currentOrder.totalAmount} DH] ➔ [${totalAmount} DH]`);
    }

    if (courierProvider !== undefined && courierProvider !== currentOrder.courierProvider) {
      updateData.courierProvider = courierProvider;
      changes.push(`Transporteur: [${currentOrder.courierProvider || 'Aucun'}] ➔ [${courierProvider}]`);
    }

    if (trackingNumber !== undefined && trackingNumber !== currentOrder.trackingNumber) {
      updateData.trackingNumber = trackingNumber;
      changes.push(`Tracking: [${currentOrder.trackingNumber || 'Aucun'}] ➔ [${trackingNumber}]`);
    }

    if (customerNote !== undefined) updateData.customerNote = customerNote;
    if (agentNotes !== undefined) updateData.agentNotes = agentNotes;
    if (shippingCost !== undefined) updateData.shippingCost = parseFloat(shippingCost);
    if (courierStatus !== undefined && courierStatus !== currentOrder.courierStatus) {
      updateData.courierStatus = courierStatus;
      changes.push(`Paiement / Versement Transporteur: [${currentOrder.courierStatus || 'Non versé'}] ➔ [${courierStatus}]`);
    }

    if (subStatus !== undefined && subStatus !== currentOrder.subStatus) {
      updateData.subStatus = subStatus;
      changes.push(`Sous-statut / Suivi: [${currentOrder.subStatus || 'Aucun'}] ➔ [${subStatus}]`);
    }

    if (callbackAt !== undefined) {
      updateData.callbackAt = callbackAt ? new Date(callbackAt) : null;
      if (callbackAt) {
        changes.push(`Programmé pour relivraison le: [${new Date(callbackAt).toLocaleString('fr-FR')}]`);
      }
    }

    // Handle delivered status calculation
    if (status === 'DELIVERED') {
      if (status !== currentOrder.status) {
        updateData.deliveredAt = new Date();
      }
      updateData.subStatus = null;
      updateData.callbackAt = null;
      if (!updateData.courierStatus && !currentOrder.courierStatus) {
        updateData.courierStatus = 'EN_ATTENTE_VERSEMENT';
      }
      const costAmount = currentOrder.costAmount;
      const shipCost = shippingCost !== undefined ? parseFloat(shippingCost) : currentOrder.shippingCost;
      const orderTotal = totalAmount !== undefined ? parseFloat(totalAmount) : currentOrder.totalAmount;
      updateData.netProfit = orderTotal - costAmount - shipCost;
    } else if (status === 'CONFIRMED' && currentOrder.status !== 'CONFIRMED') {
      // Deduct stock upon confirmation
      for (const item of currentOrder.items) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const prev = prod.stockQuantity;
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
              reference: currentOrder.orderNumber,
              notes: 'Déduction automatique suite à confirmation',
            },
          });
        }
      }
    } else if (
      currentOrder.status === 'CONFIRMED' &&
      status !== undefined &&
      status !== 'CONFIRMED' &&
      !['SHIPPED', 'DELIVERED', 'RETURNED'].includes(status)
    ) {
      // Restock items if a CONFIRMED order is cancelled/reversed before shipping
      for (const item of currentOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            previousStock: (prod?.stockQuantity || 0) - item.quantity,
            newStock: prod?.stockQuantity || 0,
            reference: currentOrder.orderNumber,
            notes: `Restock automatique : Changement de statut de CONFIRMED à ${status} (Annulation / Correction)`,
          },
        });
      }
    } else if (status === 'RETURNED') {
      updateData.returnedAt = new Date();
      updateData.courierStatus = 'RETURNED';
      updateData.subStatus = null;
      updateData.callbackAt = null;
      const shipCost = shippingCost !== undefined ? parseFloat(shippingCost) : (currentOrder.shippingCost || 20);
      updateData.netProfit = -shipCost;

      // Restock items upon return
      for (const item of currentOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'RETURN',
            quantity: item.quantity,
            previousStock: (prod?.stockQuantity || 0) - item.quantity,
            newStock: prod?.stockQuantity || 0,
            reference: currentOrder.orderNumber,
            notes: 'Retour colis non livré',
          },
        });
      }
    } else if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
      updateData.courierStatus = updateData.courierStatus || 'IN_TRANSIT';
    }

    const event = status === 'DELIVERED' ? 'Purchase' : status === 'CONFIRMED' ? 'OrderConfirmed' : null;
    const { updatedOrder, queued } = await prisma.$transaction(async tx => {
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: updateData,
        include: {
          store: true,
          assignedAgent: true,
          items: { include: { product: true } },
        },
      });
      const queued = event && status !== currentOrder.status && await queueDeliveryEvent(tx, updatedOrder, event);
      return { updatedOrder, queued };
    });
    if (event && queued) await trySendDeliveryEvent(updatedOrder.id, event);

    // Trigger Real-Time Delivery Rescue Alert if courier/substatus indicates an issue
    const alertSubStatuses = [
      'LIVREUR_NE_REPOND_PAS',
      'NE_REPOND_PAS',
      'INJOIGNABLE',
      'CLIENT_INJOIGNABLE',
      'LIVREUR_REPORTE',
      'REPORTE',
      'CLIENT_REFUSE',
      'REFUS_CLIENT',
      'REFUS',
    ];

    if (
      updatedOrder.subStatus &&
      alertSubStatuses.some((s) => updatedOrder.subStatus?.toUpperCase().includes(s))
    ) {
      addDeliveryAlert({
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        customerPhone: updatedOrder.customerPhone,
        customerCity: updatedOrder.customerCity,
        customerAddress: updatedOrder.customerAddress,
        totalAmount: updatedOrder.totalAmount,
        currency: updatedOrder.store?.currency || 'MAD',
        assignedAgentId: updatedOrder.assignedAgentId,
        assignedAgentName: updatedOrder.assignedAgent?.name || null,
        courierProvider: updatedOrder.courierProvider || 'Transporteur',
        trackingNumber: updatedOrder.trackingNumber,
        subStatus: updatedOrder.subStatus,
        status: updatedOrder.status,
      });
    } else if (
      ['DELIVERED', 'SAUVE_A_RELIVRER'].includes(updatedOrder.status) ||
      updatedOrder.subStatus === 'SAUVE_A_RELIVRER'
    ) {
      resolveDeliveryAlert(updatedOrder.id, userId, 'Sauvetage confirmé');
    }

    // Write audit log if changes were made
    if (changes.length > 0) {
      await logActivity({
        userId: userId || null,
        userName: userName || 'Utilisateur',
        userRole: userRole || null,
        action: status !== undefined && status !== currentOrder.status ? 'STATUS_CHANGE' : 'ORDER_EDIT',
        entity: 'ORDER',
        entityId: params.id,
        orderId: params.id,
        storeId: currentOrder.storeId,
        oldValue: currentOrder.status,
        newValue: status || currentOrder.status,
        details: `Commande #${currentOrder.orderNumber} modifiée : ${changes.join(' | ')}`,
      });
    }

    // Trigger Outgoing Webhook on status changes
    if (status && status !== currentOrder.status) {
      const eventName =
        status === 'CONFIRMED'
          ? 'order.confirmed'
          : status === 'DELIVERED'
          ? 'order.delivered'
          : status === 'CANCELLED'
          ? 'order.cancelled'
          : null;
      if (eventName) {
        dispatchOutgoingWebhook(eventName as any, updatedOrder, updatedOrder.store).catch((e) =>
          console.error('Outgoing webhook status dispatch error:', e)
        );
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userName = searchParams.get('userName') || 'Admin';

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await prisma.order.delete({ where: { id: params.id } });

    await logActivity({
      userId: userId || null,
      userName: userName,
      userRole: 'ADMIN',
      action: 'ORDER_DELETE',
      entity: 'ORDER',
      entityId: params.id,
      orderId: params.id,
      storeId: order.storeId,
      details: `A supprimé définitivement la commande #${order.orderNumber} (Client: ${order.customerName}, Montant: ${order.totalAmount} MAD)`,
    });

    return NextResponse.json({ success: true, message: 'Commande supprimée' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

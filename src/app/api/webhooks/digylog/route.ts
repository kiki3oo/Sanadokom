import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/audit';
import { dispatchOutgoingWebhook } from '@/lib/outgoingWebhooks';
import { queueDeliveryEvent, sendQueuedDeliveryEvent } from '@/lib/facebook/deliveryEvents';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    provider: 'DIGYLOG',
    description: 'Digylog Logistics Webhook Receiver for real-time parcel and delivery tracking synchronization.',
    handshakeSupported: true,
  });
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 1. Digylog Handshake Verification Protocol
    // Digylog tests the endpoint by sending: { type: "subscribe", key: "<hex-key>" }
    // It expects a 200 response with: { key: "<same-hex-key>" }
    if (body.type === 'subscribe' && body.key) {
      console.log('✅ [Digylog Webhook] Handshake verified with key:', body.key);
      return NextResponse.json({ key: body.key }, { status: 200 });
    }

    // 2. Extract Event & Tracking Info
    const tracking = body.trackingNumber || body.tracking || body.code || body.tracking_code || body.order?.trackingNumber || body.parcel?.trackingNumber;
    const clientRef = body.clientRef || body.client_ref || body.orderNumber || body.order_number || body.order?.orderNumber || body.ref;
    const incomingStatus = (body.status || body.event || body.new_status || body.order?.status || '').toUpperCase();

    if (!tracking && !clientRef) {
      // Return 200 so Digylog doesn't consider it a server crash
      return NextResponse.json({ success: true, message: 'Webhook received but no order/tracking identifier provided.' });
    }

    // Find order by trackingNumber or orderNumber
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(tracking ? [{ trackingNumber: tracking }] : []),
          ...(clientRef ? [{ orderNumber: clientRef }] : []),
        ],
      },
      include: {
        items: true,
        store: true,
      },
    });

    if (!order) {
      console.warn(`[Digylog Webhook] No matching order found for tracking=${tracking}, ref=${clientRef}`);
      return NextResponse.json({ success: true, message: 'Order not found in database.' });
    }

    // 3. Map Digylog Status to Internal Order Statuses
    let newStatus: string | null = null;
    let newSubStatus: string | null = null;
    let newCourierStatus = incomingStatus;

    if (incomingStatus.includes('LIVRE') || incomingStatus.includes('DELIVER') || incomingStatus === 'EXPEDITION_LIVREE') {
      newStatus = 'DELIVERED';
      newSubStatus = 'LIVRE';
      newCourierStatus = 'LIVRE';
    } else if (incomingStatus.includes('RETOUR') || incomingStatus.includes('RETURN') || incomingStatus === 'EXPEDITION_RETOURNEE') {
      newStatus = 'RETURNED';
      newSubStatus = 'RETOUR_RECU';
      newCourierStatus = 'RETOURNE';
    } else if (incomingStatus.includes('ANNUL') || incomingStatus.includes('REFUS') || incomingStatus.includes('CANCEL')) {
      newStatus = 'CANCELLED';
      newSubStatus = 'REFUSE';
      newCourierStatus = 'REFUSE';
    } else if (incomingStatus.includes('RAMASS') || incomingStatus.includes('PICK')) {
      newStatus = 'SHIPPED';
      newSubStatus = 'RAMASSE';
      newCourierStatus = 'RAMASSE';
    } else if (incomingStatus.includes('COURS') || incomingStatus.includes('TRANSIT') || incomingStatus.includes('DISPATCH')) {
      newStatus = 'SHIPPED';
      newSubStatus = 'EN_COURS_DE_LIVRAISON';
      newCourierStatus = 'EN_COURS';
    } else if (incomingStatus.includes('PAS_DE_REPONSE') || incomingStatus.includes('INJOIGNABLE') || incomingStatus.includes('NO_ANSWER')) {
      newSubStatus = 'PAS_DE_REPONSE';
      newCourierStatus = 'PAS_DE_REPONSE';
    } else if (incomingStatus.includes('REPORT') || incomingStatus.includes('POSTPONE')) {
      newSubStatus = 'REPORTE';
      newCourierStatus = 'REPORTE';
    }

    // Build update object
    const updateData: any = {
      courierStatus: newCourierStatus,
    };
    if (newStatus && order.status !== 'DELIVERED') {
      updateData.status = newStatus;
    }
    if (newSubStatus) {
      updateData.subStatus = newSubStatus;
    }
    if (tracking && !order.trackingNumber) {
      updateData.trackingNumber = tracking;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    // 4. Audit Log
    try {
      await logActivity({
        userName: 'Digylog Webhook',
        userRole: 'INTEGRATION',
        action: 'STATUS_CHANGE',
        entity: 'ORDER',
        entityId: order.id,
        orderId: order.id,
        storeId: order.storeId,
        details: `Digylog webhook: statut mis à jour vers ${newCourierStatus} (Interne: ${newStatus || order.status})`,
        oldValue: order.courierStatus || order.status,
        newValue: newCourierStatus,
      });
    } catch (e) {
      console.error('[Digylog Webhook] Error writing audit log:', e);
    }

    // 5. Facebook CAPI Delivery Event
    if (newStatus === 'DELIVERED' && order.storeId) {
      try {
        const queued = await queueDeliveryEvent(prisma, updatedOrder, 'Purchase');
        if (queued) {
          await sendQueuedDeliveryEvent(order.id, 'Purchase');
        }
      } catch (capiErr) {
        console.error('[Digylog Webhook] Facebook CAPI delivery sync error:', capiErr);
      }
    }

    // 6. Outgoing Automation Webhook (n8n / custom)
    try {
      if (newStatus === 'DELIVERED') {
        dispatchOutgoingWebhook('order.delivered', updatedOrder, order.store);
      } else if (newStatus === 'CANCELLED' || newStatus === 'RETURNED') {
        dispatchOutgoingWebhook('order.cancelled', updatedOrder, order.store);
      }
    } catch (whErr) {
      console.error('[Digylog Webhook] Outgoing webhook dispatch error:', whErr);
    }

    console.log(`✅ [Digylog Webhook] Order #${order.orderNumber} successfully updated to ${newCourierStatus}`);
    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      trackingNumber: tracking,
      status: newStatus || order.status,
      courierStatus: newCourierStatus,
    });
  } catch (error: any) {
    console.error('❌ [Digylog Webhook Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

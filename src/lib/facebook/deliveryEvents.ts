import type { Order, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { sendFacebookConversionEvent } from './index';

export type DeliveryEvent = 'Lead' | 'OrderConfirmed' | 'Purchase';

export function metaMatchCookie(value: unknown, kind: 'fbc' | 'fbp') {
  const suffix = kind === 'fbp' ? '[0-9]+' : '[A-Za-z0-9_-]+';
  return typeof value === 'string' && value.length <= 512 &&
    new RegExp(`^fb\\.[0-9]+\\.[0-9]+\\.${suffix}$`).test(value) ? value : null;
}

export async function queueDeliveryEvent(tx: Prisma.TransactionClient, order: Order, name: DeliveryEvent) {
  if (order.isDuplicate || (name === 'Purchase' && !(order.totalAmount > 0))) return false;
  const config = await tx.facebookSetting.findUnique({
    where: { storeId: order.storeId },
    select: { deliveryCapiAt: true, pixelId: true, accessToken: true, store: { select: { currency: true } } },
  });
  if (!config?.deliveryCapiAt || order.createdAt < config.deliveryCapiAt || !config.pixelId || !config.accessToken) return false;
  await tx.metaConversionEvent.upsert({
    where: { orderId_name: { orderId: order.id, name } },
    create: {
      orderId: order.id, name, datasetId: config.pixelId, currency: config.store.currency,
      value: order.totalAmount, occurredAt: name === 'Purchase' ? order.deliveredAt ?? new Date() : new Date(),
    },
    update: {},
  });
  return true;
}

export async function sendQueuedDeliveryEvent(orderId: string, name: DeliveryEvent) {
  const key = { orderId, name };
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + 60_000);
  const claim = await prisma.metaConversionEvent.updateMany({
    where: { ...key, acceptedAt: null, OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] },
    data: { leaseUntil, attempts: { increment: 1 } },
  });
  if (!claim.count) return;
  const event = await prisma.metaConversionEvent.findUniqueOrThrow({
    where: { orderId_name: key },
    include: { order: { include: { metaAttribution: true, store: { include: { fbSettings: true } } } } },
  });
  const { order } = event;
  const config = order.store.fbSettings;
  let lastError: string | null = null;
  if (!config?.deliveryCapiAt || !config.accessToken || config.pixelId !== event.datasetId) {
    lastError = 'Vérifiez le dataset et le jeton CAPI de la boutique.';
  } else if (name === 'Purchase' && !['DELIVERED', 'PAID_TO_SELLER'].includes(order.status)) {
    lastError = 'La commande n’est plus livrée.';
  } else {
    const result = await sendFacebookConversionEvent(event.datasetId, config.accessToken, {
      eventName: name,
      eventId: `sanadokom_${orderId}_${name}`,
      eventTime: event.occurredAt,
      actionSource: 'other',
      userData: {
        phone: order.customerPhone, country: event.currency === 'MAD' ? 'MA' : event.currency === 'XOF' ? 'SN' : undefined,
        fbc: order.metaAttribution?.fbc ?? undefined, fbp: order.metaAttribution?.fbp ?? undefined,
      },
      customData: { currency: event.currency, value: event.value, orderNumber: order.orderNumber },
    });
    if (!result.success) lastError = result.error ?? 'Événement refusé par Meta.';
  }
  await prisma.metaConversionEvent.updateMany({
    where: { ...key, leaseUntil },
    data: { leaseUntil: null, lastError, acceptedAt: lastError ? null : new Date() },
  });
}

export async function trySendDeliveryEvent(orderId: string, name: DeliveryEvent) {
  try {
    await sendQueuedDeliveryEvent(orderId, name);
  } catch {
    console.error('Unable to process queued Meta conversion', name);
  }
}

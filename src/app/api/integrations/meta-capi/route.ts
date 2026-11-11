import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import { sendQueuedDeliveryEvent, type DeliveryEvent } from '@/lib/facebook/deliveryEvents';

export const dynamic = 'force-dynamic';

async function admin(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  return session && await prisma.user.findFirst({
    where: { id: session.userId, role: 'ADMIN', active: true }, select: { id: true },
  });
}

export async function GET(req: NextRequest) {
  if (!await admin(req)) return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
  const storeId = req.nextUrl.searchParams.get('storeId') ?? '';
  const settings = await prisma.facebookSetting.findUnique({ where: { storeId } });
  const events = await prisma.metaConversionEvent.findMany({
    where: { order: { storeId } }, orderBy: { occurredAt: 'desc' }, take: 30,
    select: { orderId: true, name: true, occurredAt: true, acceptedAt: true, attempts: true, lastError: true,
      order: { select: { orderNumber: true } } },
  });
  return NextResponse.json({
    configured: Boolean(settings?.pixelId && /^\d+$/.test(settings.pixelId) && settings.accessToken), enabledAt: settings?.deliveryCapiAt ?? null, events,
  });
}

export async function POST(req: NextRequest) {
  if (!await admin(req)) return NextResponse.json({ error: 'Accès administrateur requis.' }, { status: 403 });
  try {
    const { storeId, action, orderId, name } = await req.json();
    if (typeof storeId !== 'string' || !storeId) return NextResponse.json({ error: 'Sélectionnez une boutique.' }, { status: 400 });
    if (action === 'enable') {
      const config = await prisma.facebookSetting.findUnique({ where: { storeId } });
      if (!config?.pixelId || !/^\d+$/.test(config.pixelId) || !config.accessToken) {
        return NextResponse.json({ error: 'Renseignez un ID de dataset numérique et un jeton CAPI.' }, { status: 400 });
      }
      const activated = await prisma.facebookSetting.updateMany({
        where: { storeId, pixelId: config.pixelId, accessToken: config.accessToken, deliveryCapiAt: null },
        data: { deliveryCapiAt: new Date() },
      });
      if (!activated.count) return NextResponse.json({ error: 'Configuration CAPI manquante ou mode livraison déjà activé.' }, { status: 409 });
    } else if (action === 'retry' && typeof orderId === 'string' && ['Lead', 'OrderConfirmed', 'Purchase'].includes(name)) {
      const event = await prisma.metaConversionEvent.findFirst({
        where: { orderId, name, acceptedAt: null, order: { storeId } }, select: { orderId: true },
      });
      if (!event) return NextResponse.json({ error: 'Événement en attente introuvable.' }, { status: 404 });
      await sendQueuedDeliveryEvent(orderId, name as DeliveryEvent);
    } else {
      return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Impossible de traiter l’action CAPI.' }, { status: 500 });
  }
}

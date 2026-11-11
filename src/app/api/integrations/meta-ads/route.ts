import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import { metaAccountId, metaSyncError, sharedMetaConnectionId, syncMetaCampaignSpend } from '@/lib/facebook/campaignSpend';

export const dynamic = 'force-dynamic';
const connectionKey = { id: sharedMetaConnectionId };

async function isAdmin(req: NextRequest) {
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  return session && await prisma.user.findFirst({
    where: { id: session.userId, active: true, role: 'ADMIN' }, select: { id: true },
  });
}

export async function GET(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
  const [connection, stores] = await Promise.all([
    prisma.metaAdsConnection.findUnique({ where: connectionKey }),
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return NextResponse.json({ connection, stores, tokenConfigured: Boolean(process.env.META_ADS_READ_TOKEN?.trim()) });
}

export async function POST(req: NextRequest) {
  if (!await isAdmin(req)) return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 });
  try {
    const body = await req.json();
    const accountId = typeof body.accountId === 'string' ? metaAccountId(body.accountId) : null;
    if (!accountId) return NextResponse.json({ error: 'ID de compte Meta invalide.' }, { status: 400 });
    if (body.action === 'assign') {
      const { campaignId, storeId } = body;
      if (typeof campaignId !== 'string' || !/^\d{1,32}$/.test(campaignId) ||
          (storeId !== null && typeof storeId !== 'string')) {
        return NextResponse.json({ error: 'Affectation invalide.' }, { status: 400 });
      }
      const assigned = await prisma.$transaction(async tx => {
        const connection = await tx.metaAdsConnection.findUnique({ where: connectionKey });
        if (connection?.accountId !== accountId || !await tx.metaCampaignSpend.findFirst({
          where: { accountId, campaignId }, select: { campaignId: true },
        })) return false;
        if (storeId === null) {
          await tx.metaCampaignAssignment.deleteMany({ where: { accountId, campaignId } });
        } else {
          if (!await tx.store.findUnique({ where: { id: storeId }, select: { id: true } })) return false;
          await tx.metaCampaignAssignment.upsert({
            where: { accountId_campaignId: { accountId, campaignId } },
            create: { accountId, campaignId, storeId }, update: { storeId },
          });
        }
        return true;
      });
      return assigned ? NextResponse.json({ success: true }) :
        NextResponse.json({ error: 'Campagne ou boutique indisponible.' }, { status: 404 });
    }
    if (body.action !== 'sync') return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
    const token = process.env.META_ADS_READ_TOKEN?.trim();
    if (!token) return NextResponse.json({ error: 'Jeton de lecture Meta absent sur le serveur.' }, { status: 400 });
    const connection = await prisma.metaAdsConnection.findUnique({ where: connectionKey });
    if (connection && connection.accountId !== accountId) {
      return NextResponse.json({ error: 'Ce Copilote utilise déjà un autre compte Meta partagé.' }, { status: 409 });
    }
    const result = await syncMetaCampaignSpend(null, accountId, token);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: metaSyncError(error) }, { status: 502 });
  }
}

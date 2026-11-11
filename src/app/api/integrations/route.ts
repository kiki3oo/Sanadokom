import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { metaAccountId, metaSyncError, syncMetaCampaignSpend } from '@/lib/facebook/campaignSpend';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import {
  loadWebhookConfig,
  saveWebhookConfig,
  loadWebhookLogs,
  testOutgoingWebhook,
} from '@/lib/outgoingWebhooks';

export const dynamic = 'force-dynamic';

const facebookFields = {
  storeId: true, adAccountId: true, pixelId: true, autoSyncSpend: true, lastSyncAt: true,
} as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    const storeCondition = storeId && storeId !== 'ALL' ? (storeId.includes(',') ? { in: storeId.split(',') } : storeId) : undefined;
    const where = storeCondition ? { storeId: storeCondition } : {};

    const fbSettings = await prisma.facebookSetting.findMany({
      where: storeCondition ? { storeId: storeCondition } : undefined,
      select: facebookFields,
    });

    const courierConfigs = await prisma.courierConfig.findMany({
      where,
      include: { store: true },
    });

    const n8nWebhookConfig = loadWebhookConfig();
    const n8nWebhookLogs = loadWebhookLogs();

    return NextResponse.json({
      success: true,
      fbSettings,
      metaReadConfigured: Boolean(process.env.META_ADS_READ_TOKEN?.trim()),
      courierConfigs,
      n8nWebhookConfig,
      n8nWebhookLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    if (type === 'FACEBOOK') {
      const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
      const admin = session && await prisma.user.findFirst({
        where: { id: session.userId, role: 'ADMIN', active: true }, select: { id: true },
      });
      if (!admin) return NextResponse.json({ error: 'Configuration Meta réservée aux administrateurs.' }, { status: 403 });
      const { adAccountId, accessToken, pixelId, autoSyncSpend, triggerSync } = body;
      if (typeof storeId !== 'string' || storeId === 'ALL' || storeId.includes(',') ||
          typeof adAccountId !== 'string' || typeof pixelId !== 'string' ||
          (accessToken !== undefined && typeof accessToken !== 'string')) {
        return NextResponse.json({ error: 'Sélectionnez une boutique et vérifiez les paramètres Meta.' }, { status: 400 });
      }
      const account = metaAccountId(adAccountId);
      if (adAccountId.trim() && !account) {
        return NextResponse.json({ error: 'Identifiant de compte publicitaire invalide.' }, { status: 400 });
      }
      const token = process.env.META_ADS_READ_TOKEN?.trim();
      if (triggerSync && (!account || !token)) {
        return NextResponse.json({ error: 'Renseignez le compte et META_ADS_READ_TOKEN sur le serveur.' }, { status: 400 });
      }
      const normalized = account ? 'act_' + account : null;
      const settings = await prisma.$transaction(async tx => {
        if (account && await tx.facebookSetting.findFirst({
          where: { storeId: { not: storeId }, adAccountId: { in: [account, 'act_' + account] } },
          select: { storeId: true },
        })) return null;
        const previous = await tx.facebookSetting.findUnique({ where: { storeId }, select: { adAccountId: true } });
        const data = {
          adAccountId: normalized,
          pixelId: pixelId.trim() || null,
          accessToken: accessToken?.trim() || undefined,
          autoSyncSpend: autoSyncSpend === true,
        };
        return tx.facebookSetting.upsert({
          where: { storeId },
          update: {
            ...data,
            ...(metaAccountId(previous?.adAccountId) !== account ? { lastSyncAt: null, metaTimeZone: null } : {}),
          },
          create: { storeId, ...data },
          select: facebookFields,
        });
      });
      if (!settings) return NextResponse.json({ error: 'Ce compte Meta est déjà associé à une autre boutique.' }, { status: 409 });
      if (triggerSync && account && token) {
        try {
          const syncResult = await syncMetaCampaignSpend(storeId, account, token);
          return NextResponse.json({ success: true, settings, syncResult });
        } catch (error) {
          return NextResponse.json({ error: metaSyncError(error) }, { status: 502 });
        }
      }
      return NextResponse.json({ success: true, settings });
    }

    // 2. Courier Configuration Save
    if (type === 'COURIER') {
      const { provider, apiKey, apiSecret, accountNumber, apiUrl, isActive } = body;

      if (!provider) {
        return NextResponse.json({ error: 'provider is required' }, { status: 400 });
      }

      const updated = await prisma.courierConfig.upsert({
        where: {
          storeId_provider: {
            storeId,
            provider,
          },
        },
        update: {
          apiKey,
          apiSecret,
          accountNumber,
          apiUrl,
          isActive: isActive ?? true,
        },
        create: {
          storeId,
          provider,
          apiKey,
          apiSecret,
          accountNumber,
          apiUrl,
          isActive: isActive ?? true,
        },
      });

      return NextResponse.json({ success: true, courierConfig: updated });
    }

    // 3. n8n / Outgoing Webhook Configuration Save
    if (type === 'N8N_WEBHOOK') {
      const { config } = body;
      const updated = saveWebhookConfig(config);
      return NextResponse.json({ success: true, n8nWebhookConfig: updated });
    }

    // 4. Test n8n Webhook Node
    if (type === 'TEST_N8N_WEBHOOK') {
      const { url, secret } = body;
      if (!url) {
        return NextResponse.json({ error: 'URL Webhook requise pour le test' }, { status: 400 });
      }
      let storeObj = null;
      if (storeId && storeId !== 'ALL') {
        storeObj = await prisma.store.findUnique({ where: { id: storeId } });
      }
      const testResult = await testOutgoingWebhook(url, secret, storeObj);
      return NextResponse.json({ success: true, testResult });
    }

    return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
  } catch (error: any) {
    console.error('Integrations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

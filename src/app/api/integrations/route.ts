import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFacebookAdSpend } from '@/lib/facebook';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    const storeCondition = storeId && storeId !== 'ALL' ? (storeId.includes(',') ? { in: storeId.split(',') } : storeId) : undefined;
    const where = storeCondition ? { storeId: storeCondition } : {};

    const fbSettings = await prisma.facebookSetting.findMany({
      where: storeCondition ? { storeId: storeCondition } : undefined,
      include: { store: true },
    });

    const courierConfigs = await prisma.courierConfig.findMany({
      where,
      include: { store: true },
    });

    return NextResponse.json({ success: true, fbSettings, courierConfigs });
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

    // 1. Facebook Integration Save / Sync
    if (type === 'FACEBOOK') {
      const { adAccountId, accessToken, pixelId, autoSyncSpend, triggerSync } = body;

      const updated = await prisma.facebookSetting.upsert({
        where: { storeId },
        update: {
          adAccountId,
          accessToken,
          pixelId,
          autoSyncSpend: autoSyncSpend ?? false,
          lastSyncAt: triggerSync ? new Date() : undefined,
        },
        create: {
          storeId,
          adAccountId,
          accessToken,
          pixelId,
          autoSyncSpend: autoSyncSpend ?? false,
          lastSyncAt: triggerSync ? new Date() : undefined,
        },
      });

      // If triggerSync is requested, fetch today's ad spend and create/update an Expense entry
      let syncResult = null;
      if (triggerSync && adAccountId && accessToken) {
        syncResult = await fetchFacebookAdSpend(adAccountId, accessToken);
        if (syncResult.success && syncResult.spend > 0) {
          await prisma.expense.create({
            data: {
              storeId,
              category: 'FACEBOOK_ADS',
              amount: syncResult.spend,
              description: `Facebook Ads Sync Automatique (${new Date().toLocaleDateString('fr-FR')})`,
              date: new Date(),
            },
          });
        }
      }

      return NextResponse.json({ success: true, settings: updated, syncResult });
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

    return NextResponse.json({ error: 'Invalid integration type' }, { status: 400 });
  } catch (error: any) {
    console.error('Integrations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getWinningProducts,
  generateAiProductIdeas,
  analyzeProductDetails,
  getLiveCampaignAudits,
  scanProductImage,
  ProductAnalysisInput,
} from '@/lib/marketingAi';

import { researchMarkets } from '@/lib/marketResearch';
import { isCampaignPeriod } from '@/lib/campaignSummary';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';

async function campaignResponse(req: NextRequest, storeId: unknown, period: unknown) {
  if ((storeId !== undefined && typeof storeId !== 'string') || !isCampaignPeriod(period)) {
    return NextResponse.json({ success: false, error: 'Filtres de campagne invalides.' }, { status: 400 });
  }
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const user = session && await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, active: true, permissions: true },
  });
  let permissions: { viewDashboard?: boolean; assignedStoreIds?: string[] } = {};
  try {
    permissions = JSON.parse(user?.permissions || '{}') ?? {};
  } catch {
    // Invalid stored permissions grant no extra access.
  }
  if (!user?.active || (user.role !== 'ADMIN' && user.role !== 'LOGISTICS_MANAGER' && !permissions.viewDashboard)) {
    return NextResponse.json({ success: false, error: 'Accès au copilote refusé.' }, { status: 403 });
  }
  const allowedStores = user.role === 'CALL_AGENT' && Array.isArray(permissions.assignedStoreIds) && permissions.assignedStoreIds.length
    ? permissions.assignedStoreIds
    : undefined;
  return NextResponse.json(await getLiveCampaignAudits(storeId, period, allowedStores));
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'WINNING_PRODUCTS';
    const niche = searchParams.get('niche') || undefined;
    const country = searchParams.get('country') || undefined;
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const storeId = searchParams.get('storeId') || undefined;

    if (tab === 'CAMPAIGN_AUDIT') {
      return await campaignResponse(req, storeId, searchParams.get('period') ?? 'all');
    }

    const products = getWinningProducts({
      niche,
      country,
      status,
      type,
      search,
    });

    return NextResponse.json({
      success: true,
      products,
      totalCount: products.length,
    });
  } catch (error: any) {
    console.error('Marketing AI GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'RESEARCH_MARKETS') {
      const { mode, target, source, product, language, category } = body;
      if (
        (mode !== 'scout' && mode !== 'audit') ||
        typeof target !== 'string' || !target.trim() || target.length > 120 ||
        typeof source !== 'string' || source.length > 180 ||
        typeof product !== 'string' || product.length > 1600 ||
        (mode === 'audit' && !product.trim()) ||
        (category !== undefined && !['COSMETICS', 'SUPPLEMENTS', 'BOTH'].includes(category))
      ) {
        return NextResponse.json({ success: false, error: 'MARKET_RESEARCH_INPUT' }, { status: 400 });
      }

      try {
        const report = await researchMarkets({
          mode, target: target.trim(), source: source.trim(), product: product.trim(), category,
          language: language === 'ar' ? 'ar' : 'fr',
        });
        return NextResponse.json({ success: true, report });
      } catch (error) {
        const unconfigured = error instanceof Error && error.message === 'unconfigured';
        return NextResponse.json({
          success: false,
          error: unconfigured ? 'MARKET_RESEARCH_UNCONFIGURED' : 'MARKET_RESEARCH_UNAVAILABLE',
        }, { status: unconfigured ? 503 : 502 });
      }
    }

    if (action === 'ANALYZE_PRODUCT') {
      const input: ProductAnalysisInput = body.input;
      if (!input || !input.title) {
        return NextResponse.json(
          { success: false, error: 'Product title is required' },
          { status: 400 }
        );
      }

      const analysis = analyzeProductDetails(input);
      return NextResponse.json({
        success: true,
        analysis,
      });
    }

    if (action === 'GENERATE_IDEAS') {
      const niche = body.niche || 'BEAUTY';
      const prompt = body.prompt || '';
      const country = body.country || 'ALL';
      const ideas = generateAiProductIdeas(niche, prompt, country);
      return NextResponse.json({
        success: true,
        ideas,
      });
    }

    if (action === 'AUDIT_CAMPAIGNS') {
      return await campaignResponse(req, body.storeId, body.period ?? 'all');
    }

    if (action === 'TOGGLE_CAMPAIGN') {
      return NextResponse.json({
        success: false,
        error: 'Les actions sur les campagnes publicitaires sont indisponibles.',
      }, { status: 501 });
    }

    if (action === 'SCAN_IMAGE') {
      const { imageBase64, filename, targetCountry } = body;
      const scanResult = scanProductImage(imageBase64, filename, targetCountry);
      return NextResponse.json({
        success: true,
        data: scanResult,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Marketing AI POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

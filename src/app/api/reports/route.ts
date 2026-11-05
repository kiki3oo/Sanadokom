import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const country = searchParams.get('country') || 'MA'; // 'MA' | 'SN'
    const period = searchParams.get('period') || '30DAYS'; // TODAY, YESTERDAY, 7DAYS, 30DAYS, THIS_MONTH, LAST_MONTH, ALL, CUSTOM
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const orderWhere: any = {};
    const expenseWhere: any = {};

    // Filter by Country (through Store currency)
    if (country) {
      const curr = country === 'SN' ? 'XOF' : 'MAD';
      orderWhere.store = { currency: curr };
      expenseWhere.store = { currency: curr };
    }

    // Filter by Store
    if (storeId && storeId !== 'ALL') {
      const storeCondition = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
      orderWhere.storeId = storeCondition;
      expenseWhere.storeId = storeCondition;
    }

    // Date Range Filtering
    const now = new Date();
    if (period === 'TODAY') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      orderWhere.createdAt = { gte: startOfDay };
      expenseWhere.date = { gte: startOfDay };
    } else if (period === 'YESTERDAY') {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      orderWhere.createdAt = { gte: yesterdayStart, lte: yesterdayEnd };
      expenseWhere.date = { gte: yesterdayStart, lte: yesterdayEnd };
    } else if (period === '7DAYS') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      orderWhere.createdAt = { gte: sevenDaysAgo };
      expenseWhere.date = { gte: sevenDaysAgo };
    } else if (period === '30DAYS') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      orderWhere.createdAt = { gte: thirtyDaysAgo };
      expenseWhere.date = { gte: thirtyDaysAgo };
    } else if (period === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      orderWhere.createdAt = { gte: startOfMonth };
      expenseWhere.date = { gte: startOfMonth };
    } else if (period === 'LAST_MONTH') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      orderWhere.createdAt = { gte: startOfLastMonth, lte: endOfLastMonth };
      expenseWhere.date = { gte: startOfLastMonth, lte: endOfLastMonth };
    } else if (period === 'CUSTOM' && startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      orderWhere.createdAt = { gte: start, lte: end };
      expenseWhere.date = { gte: start, lte: end };
    }

    // 1. Fetch Orders with Items & Store
    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        store: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Fetch Expenses in the same period
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
    });

    // Currencies
    const currency = country === 'SN' ? 'XOF' : 'MAD';
    const defaultReturnFee = country === 'SN' ? 1500 : 20.0; // frais de retour facturé par transporteur

    // ==========================================
    // 3. Financial & P&L Statement
    // ==========================================
    let grossRevenue = 0;
    let deliveredRevenue = 0;
    let cogsDelivered = 0;
    let shippingDelivered = 0;
    let shippingReturns = 0;
    let confirmerCommissions = 0;
    let packagingFees = 0;

    let confirmedCount = 0;
    let deliveredCount = 0;
    let returnedCount = 0;
    let inTransitCount = 0;
    let cancelledCount = 0;

    orders.forEach((o) => {
      grossRevenue += o.totalAmount || 0;
      const status = (o.status || '').toUpperCase();

      if (['CONFIRMED', 'SHIPPED', 'DELIVERED', 'IN_TRANSIT'].includes(status)) {
        confirmedCount++;
      }

      if (status === 'DELIVERED') {
        deliveredCount++;
        deliveredRevenue += o.totalAmount || 0;
        cogsDelivered += o.costAmount || 0;
        shippingDelivered += o.shippingCost || (country === 'SN' ? 2500 : 35.0);
        confirmerCommissions += o.confirmerFee || (country === 'SN' ? 600 : 10.0);
        packagingFees += o.packagingFee || 0;
      } else if (['RETURNED', 'REFUSED'].includes(status)) {
        returnedCount++;
        shippingReturns += defaultReturnFee;
      } else if (['SHIPPED', 'IN_TRANSIT'].includes(status)) {
        inTransitCount++;
      } else if (['CANCELLED', 'CANCELED'].includes(status)) {
        cancelledCount++;
      }
    });

    // Ad Spend Breakdown from Expenses
    let facebookSpend = 0;
    let tiktokSpend = 0;
    let snapchatSpend = 0;
    let googleSpend = 0;
    let otherMarketingSpend = 0;
    let salariesSpend = 0;
    let generalExpenses = 0;

    expenses.forEach((e) => {
      const cat = (e.category || '').toUpperCase();
      const desc = (e.description || '').toUpperCase();
      if (cat === 'FACEBOOK_ADS' || desc.includes('FACEBOOK') || desc.includes('FB')) {
        facebookSpend += e.amount || 0;
      } else if (cat === 'TIKTOK_ADS' || desc.includes('TIKTOK')) {
        tiktokSpend += e.amount || 0;
      } else if (desc.includes('SNAP') || desc.includes('SNAPCHAT')) {
        snapchatSpend += e.amount || 0;
      } else if (desc.includes('GOOGLE')) {
        googleSpend += e.amount || 0;
      } else if (cat === 'MARKETING' || desc.includes('AD')) {
        otherMarketingSpend += e.amount || 0;
      } else if (cat === 'SALARIES' || desc.includes('SALAIRE')) {
        salariesSpend += e.amount || 0;
      } else {
        generalExpenses += e.amount || 0;
      }
    });

    const totalAdSpend = facebookSpend + tiktokSpend + snapchatSpend + googleSpend + otherMarketingSpend;
    const totalShippingCost = shippingDelivered + shippingReturns;
    const totalExpenses = cogsDelivered + totalShippingCost + confirmerCommissions + packagingFees + totalAdSpend + salariesSpend + generalExpenses;
    const netProfit = deliveredRevenue - totalExpenses;
    const netMargin = deliveredRevenue > 0 ? (netProfit / deliveredRevenue) * 100 : 0;
    const grossMargin = deliveredRevenue > 0 ? ((deliveredRevenue - cogsDelivered) / deliveredRevenue) * 100 : 0;
    const roas = totalAdSpend > 0 ? deliveredRevenue / totalAdSpend : 0;

    const deliveryRate = (deliveredCount + returnedCount) > 0 
      ? (deliveredCount / (deliveredCount + returnedCount)) * 100 
      : (orders.length > 0 ? (deliveredCount / orders.length) * 100 : 0);
    const confirmationRate = orders.length > 0 ? (confirmedCount / orders.length) * 100 : 0;

    const pnlStatement = {
      deliveredRevenue,
      grossRevenue,
      cogsDelivered,
      shippingDelivered,
      shippingReturns,
      totalShippingCost,
      confirmerCommissions,
      packagingFees,
      totalAdSpend,
      adSpendBreakdown: {
        facebook: facebookSpend,
        tiktok: tiktokSpend,
        snapchat: snapchatSpend,
        google: googleSpend,
        other: otherMarketingSpend,
      },
      salariesSpend,
      generalExpenses,
      totalExpenses,
      netProfit,
      netMargin: Math.round(netMargin * 10) / 10,
      grossMargin: Math.round(grossMargin * 10) / 10,
      roas: Math.round(roas * 100) / 100,
      currency,
      counts: {
        totalOrders: orders.length,
        confirmed: confirmedCount,
        delivered: deliveredCount,
        returned: returnedCount,
        inTransit: inTransitCount,
        cancelled: cancelledCount,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        confirmationRate: Math.round(confirmationRate * 10) / 10,
      },
    };

    // ==========================================
    // 4. Product-Level Performance Breakdown
    // ==========================================
    const productStatsMap = new Map<string, any>();

    orders.forEach((order) => {
      const status = (order.status || '').toUpperCase();
      const isDelivered = status === 'DELIVERED';
      const isReturned = ['RETURNED', 'REFUSED'].includes(status);
      const isConfirmed = ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'IN_TRANSIT'].includes(status);

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const prodId = item.productId || item.product?.id || 'unknown';
          const prodName = item.product?.name || 'Produit Inconnu';
          const prodSku = item.product?.sku || 'SKU-N/A';
          const unitCost = item.unitCost || item.product?.costPrice || 0;
          const qty = item.quantity || 1;
          const itemPrice = item.unitPrice || (order.items.length > 0 ? (order.totalAmount / order.items.length) : 0);

          if (!productStatsMap.has(prodId)) {
            productStatsMap.set(prodId, {
              id: prodId,
              name: prodName,
              sku: prodSku,
              unitCost,
              unitPrice: itemPrice,
              totalOrders: 0,
              totalUnits: 0,
              confirmedUnits: 0,
              deliveredUnits: 0,
              returnedUnits: 0,
              deliveredRevenue: 0,
              cogs: 0,
            });
          }

          const pStat = productStatsMap.get(prodId);
          pStat.totalOrders++;
          pStat.totalUnits += qty;

          if (isConfirmed) pStat.confirmedUnits += qty;
          if (isDelivered) {
            pStat.deliveredUnits += qty;
            pStat.deliveredRevenue += itemPrice * qty;
            pStat.cogs += unitCost * qty;
          }
          if (isReturned) {
            pStat.returnedUnits += qty;
          }
        });
      }
    });

    const productReports = Array.from(productStatsMap.values()).map((p) => {
      const deliveredOrReturned = p.deliveredUnits + p.returnedUnits;
      const deliveryRate = deliveredOrReturned > 0 ? (p.deliveredUnits / deliveredOrReturned) * 100 : 0;
      const returnRate = deliveredOrReturned > 0 ? (p.returnedUnits / deliveredOrReturned) * 100 : 0;
      const grossProfit = p.deliveredRevenue - p.cogs;
      const grossMargin = p.deliveredRevenue > 0 ? (grossProfit / p.deliveredRevenue) * 100 : 0;

      let verdict: 'WINNER' | 'STABLE' | 'RISK_RETURNS' | 'LOW_VOLUME' = 'LOW_VOLUME';
      if (p.totalUnits >= 5) {
        if (deliveryRate >= 75 && grossProfit > 0) verdict = 'WINNER';
        else if (returnRate >= 35) verdict = 'RISK_RETURNS';
        else verdict = 'STABLE';
      }

      return {
        ...p,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        returnRate: Math.round(returnRate * 10) / 10,
        grossProfit,
        grossMargin: Math.round(grossMargin * 10) / 10,
        verdict,
      };
    }).sort((a, b) => b.deliveredRevenue - a.deliveredRevenue);

    // ==========================================
    // 5. Geographic & City Breakdown
    // ==========================================
    const cityMap = new Map<string, any>();

    orders.forEach((o) => {
      let rawCity = (o.cityApi || o.customerCity || 'Autre').trim();
      if (!rawCity) rawCity = 'Inconnue';
      const cityKey = rawCity.toUpperCase();
      const status = (o.status || '').toUpperCase();
      const isDelivered = status === 'DELIVERED';
      const isReturned = ['RETURNED', 'REFUSED'].includes(status);
      const isInTransit = ['SHIPPED', 'IN_TRANSIT'].includes(status);

      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          city: rawCity,
          total: 0,
          delivered: 0,
          returned: 0,
          inTransit: isInTransit ? 1 : 0,
          deliveredRevenue: 0,
        });
      }

      const cStat = cityMap.get(cityKey);
      cStat.total++;
      if (isDelivered) {
        cStat.delivered++;
        cStat.deliveredRevenue += o.totalAmount || 0;
      }
      if (isReturned) {
        cStat.returned++;
      }
      if (isInTransit) {
        cStat.inTransit++;
      }
    });

    const cityReports = Array.from(cityMap.values()).map((c) => {
      const deliveredOrReturned = c.delivered + c.returned;
      const deliveryRate = deliveredOrReturned > 0 ? (c.delivered / deliveredOrReturned) * 100 : (c.total > 0 ? (c.delivered / c.total) * 100 : 0);
      const returnRate = deliveredOrReturned > 0 ? (c.returned / deliveredOrReturned) * 100 : 0;

      let tier: 'SCALE_ADS' | 'NEUTRAL' | 'EXCLUDE_OR_CONFIRM' = 'NEUTRAL';
      if (c.total >= 3) {
        if (deliveryRate >= 75) tier = 'SCALE_ADS';
        else if (returnRate >= 35 || deliveryRate < 55) tier = 'EXCLUDE_OR_CONFIRM';
        else tier = 'NEUTRAL';
      }

      return {
        ...c,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        returnRate: Math.round(returnRate * 10) / 10,
        tier,
      };
    }).sort((a, b) => b.total - a.total);

    // ==========================================
    // 6. Logistics & Carriers Breakdown
    // ==========================================
    const courierMap = new Map<string, any>();

    orders.forEach((o) => {
      const courier = o.courierProvider || 'Transporteur Local / Interne';
      const status = (o.status || '').toUpperCase();
      const isDelivered = status === 'DELIVERED';
      const isReturned = ['RETURNED', 'REFUSED'].includes(status);
      const isShipped = Boolean(o.shippedAt) || ['SHIPPED', 'DELIVERED', 'RETURNED', 'REFUSED', 'IN_TRANSIT'].includes(status);

      if (!courierMap.has(courier)) {
        courierMap.set(courier, {
          name: courier,
          shipped: 0,
          delivered: 0,
          returned: 0,
          inTransit: 0,
          totalDeliveryDays: 0,
          deliveryCountWithDates: 0,
        });
      }

      const crStat = courierMap.get(courier);
      if (isShipped) crStat.shipped++;
      if (isDelivered) {
        crStat.delivered++;
        if (o.shippedAt && o.deliveredAt) {
          const diffDays = Math.max(0.5, (new Date(o.deliveredAt).getTime() - new Date(o.shippedAt).getTime()) / (1000 * 3600 * 24));
          crStat.totalDeliveryDays += diffDays;
          crStat.deliveryCountWithDates++;
        }
      }
      if (isReturned) crStat.returned++;
      if (['SHIPPED', 'IN_TRANSIT'].includes(status)) crStat.inTransit++;
    });

    const courierReports = Array.from(courierMap.values()).map((cr) => {
      const deliveredOrReturned = cr.delivered + cr.returned;
      const deliveryRate = deliveredOrReturned > 0 ? (cr.delivered / deliveredOrReturned) * 100 : 0;
      const avgDays = cr.deliveryCountWithDates > 0 ? cr.totalDeliveryDays / cr.deliveryCountWithDates : 1.8; // default 1.8 days if no exact timestamps

      return {
        name: cr.name,
        shipped: cr.shipped,
        delivered: cr.delivered,
        returned: cr.returned,
        inTransit: cr.inTransit,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        avgDays: Math.round(avgDays * 10) / 10,
      };
    }).sort((a, b) => b.shipped - a.shipped);

    // ==========================================
    // 7. Daily Trend Series (for chart / trends)
    // ==========================================
    const trendMap = new Map<string, { date: string; deliveredRevenue: number; ordersCount: number; deliveredCount: number }>();

    orders.forEach((o) => {
      const d = new Date(o.createdAt).toISOString().split('T')[0];
      if (!trendMap.has(d)) {
        trendMap.set(d, { date: d, deliveredRevenue: 0, ordersCount: 0, deliveredCount: 0 });
      }
      const tStat = trendMap.get(d)!;
      tStat.ordersCount++;
      if ((o.status || '').toUpperCase() === 'DELIVERED') {
        tStat.deliveredCount++;
        tStat.deliveredRevenue += o.totalAmount || 0;
      }
    });

    const dailyTrends = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      success: true,
      pnlStatement,
      productReports,
      cityReports,
      courierReports,
      dailyTrends,
      period,
      currency,
    });
  } catch (error: any) {
    console.error('Error generating reports:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

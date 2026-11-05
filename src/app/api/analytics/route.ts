import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const period = searchParams.get('period') || 'ALL'; // TODAY, YESTERDAY, 7DAYS, 30DAYS, CUSTOM, ALL
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const agentId = searchParams.get('agentId');
    const productId = searchParams.get('productId');

    const orderWhere: any = {};
    const expenseWhere: any = {};

    if (storeId && storeId !== 'ALL') {
      const storeCondition = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
      orderWhere.storeId = storeCondition;
      expenseWhere.storeId = storeCondition;
    }

    if (agentId && agentId !== 'ALL') {
      orderWhere.assignedAgentId = agentId;
    }

    if (productId && productId !== 'ALL') {
      orderWhere.items = {
        some: { productId },
      };
    }

    // Date / Period Filtering
    const now = new Date();
    if (period === 'TODAY') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      orderWhere.createdAt = { gte: startOfDay };
      expenseWhere.date = { gte: startOfDay };
    } else if (period === 'YESTERDAY') {
      const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
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
    } else if (period === 'CUSTOM' && startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      orderWhere.createdAt = { gte: start, lte: end };
      expenseWhere.date = { gte: start, lte: end };
    }

    // 1. Fetch Orders with relations
    const orders = await prisma.order.findMany({
      where: orderWhere,
      include: {
        store: true,
        assignedAgent: true,
        items: { include: { product: true } },
      },
    });

    // 2. Fetch Expenses
    const expenses = await prisma.expense.findMany({
      where: expenseWhere,
    });

    const targetStoreIds = storeId && storeId !== 'ALL'
      ? storeId.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    // 3. Fetch Agents (Call Center) with orders matching date/store/product filters
    const allDbAgents = await prisma.user.findMany({
      where: { role: 'CALL_AGENT', active: true },
      include: {
        assignedOrders: {
          where: orderWhere,
          include: { items: true },
        },
      },
    });

    // Strictly filter agents according to selected country/stores
    const agents = allDbAgents.filter((agent) => {
      if (!targetStoreIds || targetStoreIds.length === 0) return true;
      if (agent.assignedOrders.length > 0) return true;
      if (agent.permissions) {
        try {
          const perms = typeof agent.permissions === 'string' ? JSON.parse(agent.permissions) : agent.permissions;
          if (Array.isArray(perms.assignedStoreIds) && perms.assignedStoreIds.length > 0) {
            return perms.assignedStoreIds.some((sId: string) => targetStoreIds.includes(sId));
          }
        } catch (e) {}
      }
      return false;
    });

    // Also fetch all available products and agents for filter dropdowns
    const availableProducts = await prisma.product.findMany({
      where: storeId && storeId !== 'ALL' ? { storeId: storeId.includes(',') ? { in: storeId.split(',') } : storeId } : undefined,
      select: { id: true, name: true, sku: true },
    });

    const availableAgents = agents.map((a) => ({ id: a.id, name: a.name }));

    // 4. Overall Counts & Workflow Metrics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
    const confirmedOrders = orders.filter((o) =>
      ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
    ).length;
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length;
    const noAnswerOrders = orders.filter((o) => o.status === 'NO_ANSWER').length;

    const shippedOrders = orders.filter((o) =>
      ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
    ).length;
    const inTransitOrders = orders.filter((o) => ['SHIPPED', 'IN_TRANSIT'].includes(o.status)).length;
    const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED').length;
    const returnedOrders = orders.filter((o) => o.status === 'RETURNED').length;

    // Rates
    const confirmationRate = totalOrders > 0 ? (confirmedOrders / totalOrders) * 100 : 0;
    const deliveryRate = shippedOrders > 0 ? (deliveredOrders / shippedOrders) * 100 : 0;
    const returnRate = shippedOrders > 0 ? (returnedOrders / shippedOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

    // 5. Financial Calculations ("Le Calcul")
    const grossDeliveredRevenue = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + o.totalAmount, 0);

    const deliveredCogs = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + o.costAmount, 0);

    const deliveredPackaging = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + (o.packagingFee || 5), 0);

    const deliveredShippingFees = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + (o.shippingCost || 35), 0);

    const returnedShippingFees = orders
      .filter((o) => o.status === 'RETURNED')
      .reduce((acc, o) => acc + (o.shippingCost || 20), 0);

    const totalShippingFees = deliveredShippingFees + returnedShippingFees;

    const confirmerCommissions = orders
      .filter((o) => o.status === 'DELIVERED')
      .reduce((acc, o) => acc + (o.confirmerFee || 10), 0);

    const adSpend = expenses
      .filter((e) => ['FACEBOOK_ADS', 'TIKTOK_ADS', 'SNAPCHAT_ADS', 'GOOGLE_ADS'].includes(e.category) || e.category.toLowerCase().includes('ads'))
      .reduce((acc, e) => acc + e.amount, 0);

    const otherExpenses = expenses
      .filter((e) => !['FACEBOOK_ADS', 'TIKTOK_ADS', 'SNAPCHAT_ADS', 'GOOGLE_ADS'].includes(e.category) && !e.category.toLowerCase().includes('ads'))
      .reduce((acc, e) => acc + e.amount, 0);

    const totalCostOfBusiness =
      deliveredCogs + deliveredPackaging + totalShippingFees + confirmerCommissions + adSpend + otherExpenses;

    const netProfit = grossDeliveredRevenue - totalCostOfBusiness;
    const realRoas = adSpend > 0 ? (grossDeliveredRevenue / adSpend).toFixed(2) : 'N/A';
    const profitMargin =
      grossDeliveredRevenue > 0 ? ((netProfit / grossDeliveredRevenue) * 100).toFixed(1) : '0';

    // 6. Agents Performance Ranking & Deep Analysis
    const agentsRanking = agents
      .map((agent) => {
        const agOrders = agent.assignedOrders;
        const total = agOrders.length;
        const conf = agOrders.filter((o) =>
          ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
        ).length;
        const deliv = agOrders.filter((o) => o.status === 'DELIVERED').length;
        const ret = agOrders.filter((o) => o.status === 'RETURNED').length;
        const canc = agOrders.filter((o) => o.status === 'CANCELLED').length;
        const noAns = agOrders.filter((o) => o.status === 'NO_ANSWER').length;
        const upsells = agOrders.filter((o) => o.upsell && o.upsell.trim() !== '').length;

        const confRateNum = total > 0 ? (conf / total) * 100 : 0;
        const delivRateNum = conf > 0 ? (deliv / conf) * 100 : 0;
        const retRateNum = conf > 0 ? (ret / conf) * 100 : 0;
        const rev = agOrders
          .filter((o) => o.status === 'DELIVERED')
          .reduce((acc, o) => acc + o.totalAmount, 0);

        const earned = agOrders
          .filter((o) => o.status === 'DELIVERED')
          .reduce((sum, o) => sum + (o.confirmerFee || agent.commissionFee || 10), 0);

        // Quality score: Delivered volume + Confirmation rate
        let performanceLevel = 'MOYEN'; // TOP, BON, MOYEN, FAIBLE
        if (deliv >= 2 || (deliv >= 1 && confRateNum >= 50 && delivRateNum >= 50)) {
          performanceLevel = 'TOP';
        } else if (conf >= 1 || confRateNum >= 35) {
          performanceLevel = 'BON';
        } else if (total > 0 && conf === 0) {
          performanceLevel = 'FAIBLE';
        }

        // Comprehensive COD Performance Score:
        // - 100 points per Delivered Order (the ultimate goal in COD)
        // - 30 points per Confirmed Order
        // - 20 points per Upsell Order
        // - 2 points per % of Delivery Rate
        // - 1 point per % of Confirmation Rate
        const codScore =
          deliv * 100 +
          conf * 30 +
          upsells * 20 +
          Math.round(delivRateNum * 2) +
          Math.round(confRateNum);

        return {
          id: agent.id,
          name: agent.name,
          email: agent.email,
          phone: agent.phone || 'Non renseigné',
          commissionFee: agent.commissionFee,
          totalAssigned: total,
          confirmed: conf,
          delivered: deliv,
          returned: ret,
          cancelled: canc,
          noAnswer: noAns,
          upsellCount: upsells,
          confirmationRate: confRateNum.toFixed(1),
          confirmationRateNum: confRateNum,
          deliveryRate: delivRateNum.toFixed(1),
          deliveryRateNum: delivRateNum,
          returnRate: retRateNum.toFixed(1),
          revenueGenerated: rev,
          commissionsEarned: earned,
          performanceLevel,
          codScore,
        };
      })
      .sort((a, b) => {
        // 1. Primary: COD Performance Score
        if (b.codScore !== a.codScore) return b.codScore - a.codScore;
        // 2. Highest Delivered count
        if (b.delivered !== a.delivered) return b.delivered - a.delivered;
        // 3. Highest Confirmed count
        if (b.confirmed !== a.confirmed) return b.confirmed - a.confirmed;
        // 4. Highest Delivery Rate
        if (b.deliveryRateNum !== a.deliveryRateNum) return b.deliveryRateNum - a.deliveryRateNum;
        // 5. Highest Confirmation Rate
        if (b.confirmationRateNum !== a.confirmationRateNum) return b.confirmationRateNum - a.confirmationRateNum;
        // 6. Highest Revenue
        return b.revenueGenerated - a.revenueGenerated;
      });

    // 7. Product Profitability Analysis
    const productStatsMap: Record<string, any> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const pName = item.product?.name || 'Produit';
        if (!productStatsMap[pName]) {
          productStatsMap[pName] = {
            name: pName,
            sku: item.product?.sku || 'SKU',
            currentStock: item.product?.stockQuantity || 0,
            totalOrdered: 0,
            totalDelivered: 0,
            totalReturned: 0,
            deliveredRevenue: 0,
            deliveredCost: 0,
            profit: 0,
          };
        }
        productStatsMap[pName].totalOrdered += item.quantity;
        const shipCost = o.shippingCost || (o.store?.currency === 'XOF' ? 2000 : 35);
        const returnCost = o.shippingCost ? Math.round(o.shippingCost * 0.6) : (o.store?.currency === 'XOF' ? 1200 : 20);
        const packFee = o.packagingFee !== undefined ? o.packagingFee : (o.store?.currency === 'XOF' ? 300 : 5);

        if (o.status === 'DELIVERED') {
          productStatsMap[pName].totalDelivered += item.quantity;
          const rev = item.unitPrice * item.quantity;
          const cost = (item.unitCost + packFee) * item.quantity;
          productStatsMap[pName].deliveredRevenue += rev;
          productStatsMap[pName].deliveredCost += cost;
          productStatsMap[pName].profit += rev - cost - shipCost;
        } else if (o.status === 'RETURNED') {
          productStatsMap[pName].totalReturned += item.quantity;
          productStatsMap[pName].profit -= returnCost;
        }
      });
    });

    const productsProfitability = Object.values(productStatsMap).sort((a, b) => b.profit - a.profit);
    const mostProfitableProducts = productsProfitability.slice(0, 5);
    const leastProfitableProducts = [...productsProfitability].reverse().slice(0, 5);

    // 8. Call Center Detailed Stats & Sub-Status Breakdown
    const subStatusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.subStatus && o.subStatus.trim() !== '') {
        subStatusCounts[o.subStatus] = (subStatusCounts[o.subStatus] || 0) + 1;
      }
    });

    const upsellOrders = orders.filter((o) => o.upsell && o.upsell.trim() !== '');
    const upsellTotalCount = upsellOrders.length;
    const upsellDeliveredCount = upsellOrders.filter((o) => o.status === 'DELIVERED').length;
    const upsellTotalRevenue = upsellOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const upsellRate = confirmedOrders > 0 ? ((upsellTotalCount / confirmedOrders) * 100).toFixed(1) : '0.0';
    const duplicateCount = orders.filter((o) => o.isDuplicate).length;

    const callCenterStats = {
      totalLeads: totalOrders,
      pendingLeads: pendingOrders,
      confirmedLeads: confirmedOrders,
      cancelledLeads: cancelledOrders,
      noAnswerLeads: noAnswerOrders,
      duplicateLeads: duplicateCount,
      confirmationRate: confirmationRate.toFixed(1),
      cancellationRate: cancellationRate.toFixed(1),
      upsellCount: upsellTotalCount,
      upsellDeliveredCount,
      upsellRate,
      upsellTotalRevenue,
      subStatusCounts,
    };

    // 9. Logistics / Courier Detailed Breakdown (OzonExpress, Sendit, Ameex, Cathedis, etc.)
    const courierMap: Record<string, { total: number; delivered: number; returned: number; inTransit: number; shippingCost: number; deliveredRevenue: number }> = {};
    orders
      .filter((o) => o.courierProvider)
      .forEach((o) => {
        const c = o.courierProvider || 'Autre';
        if (!courierMap[c]) {
          courierMap[c] = { total: 0, delivered: 0, returned: 0, inTransit: 0, shippingCost: 0, deliveredRevenue: 0 };
        }
        courierMap[c].total += 1;
        courierMap[c].shippingCost += (o.shippingCost || 35);
        if (o.status === 'DELIVERED') {
          courierMap[c].delivered += 1;
          courierMap[c].deliveredRevenue += o.totalAmount;
        } else if (o.status === 'RETURNED') {
          courierMap[c].returned += 1;
        } else {
          courierMap[c].inTransit += 1;
        }
      });

    const couriersPerformance = Object.entries(courierMap).map(([courier, stats]) => ({
      courier,
      total: stats.total,
      delivered: stats.delivered,
      returned: stats.returned,
      inTransit: stats.inTransit,
      shippingCost: stats.shippingCost,
      deliveredRevenue: stats.deliveredRevenue,
      deliveryRate: stats.total > 0 ? ((stats.delivered / stats.total) * 100).toFixed(1) : '0.0',
      returnRate: stats.total > 0 ? ((stats.returned / stats.total) * 100).toFixed(1) : '0.0',
    })).sort((a, b) => b.total - a.total);

    // 10. City Breakdown with Delivery Rate
    const cityMap: Record<string, { total: number; delivered: number; returned: number; inTransit: number; revenue: number }> = {};
    orders.forEach((o) => {
      const city = o.customerCity || 'Autre';
      if (!cityMap[city]) {
        cityMap[city] = { total: 0, delivered: 0, returned: 0, inTransit: 0, revenue: 0 };
      }
      cityMap[city].total += 1;
      if (o.status === 'DELIVERED') {
        cityMap[city].delivered += 1;
        cityMap[city].revenue += o.totalAmount;
      } else if (o.status === 'RETURNED') {
        cityMap[city].returned += 1;
      } else if (['SHIPPED', 'IN_TRANSIT'].includes(o.status)) {
        cityMap[city].inTransit += 1;
      }
    });

    const cityPerformance = Object.entries(cityMap).map(([city, stats]) => {
      const closed = stats.delivered + stats.returned;
      const rate = closed > 0 ? ((stats.delivered / closed) * 100).toFixed(1) : (stats.delivered > 0 ? '100.0' : '0.0');
      return {
        city,
        total: stats.total,
        delivered: stats.delivered,
        returned: stats.returned,
        inTransit: stats.inTransit,
        revenue: stats.revenue,
        deliveryRate: rate,
      };
    }).sort((a, b) => b.total - a.total);

    const logisticsStats = {
      shippedTotal: shippedOrders,
      inTransitTotal: inTransitOrders,
      deliveredTotal: deliveredOrders,
      returnedTotal: returnedOrders,
      deliveryRate: deliveryRate.toFixed(1),
      returnRate: returnRate.toFixed(1),
      inTransitRate: shippedOrders > 0 ? ((inTransitOrders / shippedOrders) * 100).toFixed(1) : '0.0',
      grossDeliveredRevenue,
      deliveredShippingFees,
      returnedShippingFees,
      totalShippingFees,
    };

    // Marketing & Ad Attribution Breakdown
    const attributionMap: Record<
      string,
      {
        source: string;
        leads: number;
        confirmed: number;
        delivered: number;
        cancelled: number;
        deliveredRevenue: number;
      }
    > = {};

    orders.forEach((o: any) => {
      let rawSource = (o.utmSource || o.source || 'Organique / Direct').trim();
      const lower = rawSource.toLowerCase();
      let cleanSource = rawSource;
      if (lower.includes('fb') || lower.includes('facebook') || lower.includes('ig') || lower.includes('instagram')) {
        cleanSource = 'Facebook & Instagram Ads';
      } else if (lower.includes('tiktok') || lower.includes('tt')) {
        cleanSource = 'TikTok Ads';
      } else if (lower.includes('snap') || lower.includes('snapchat')) {
        cleanSource = 'Snapchat Ads';
      } else if (lower.includes('google') || lower.includes('youtube')) {
        cleanSource = 'Google Ads';
      } else if (lower === 'landing page' || lower.includes('direct') || lower === 'organic') {
        cleanSource = 'Organique / Direct';
      }

      if (!attributionMap[cleanSource]) {
        attributionMap[cleanSource] = {
          source: cleanSource,
          leads: 0,
          confirmed: 0,
          delivered: 0,
          cancelled: 0,
          deliveredRevenue: 0,
        };
      }

      attributionMap[cleanSource].leads += 1;
      if (['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(o.status)) {
        attributionMap[cleanSource].confirmed += 1;
      }
      if (o.status === 'DELIVERED') {
        attributionMap[cleanSource].delivered += 1;
        attributionMap[cleanSource].deliveredRevenue += o.totalAmount;
      } else if (o.status === 'CANCELLED') {
        attributionMap[cleanSource].cancelled += 1;
      }
    });

    const adAttribution = Object.values(attributionMap)
      .map((item) => {
        const confRate = item.leads > 0 ? ((item.confirmed / item.leads) * 100).toFixed(1) : '0.0';
        const delivRate = item.confirmed > 0 ? ((item.delivered / item.confirmed) * 100).toFixed(1) : '0.0';
        return {
          ...item,
          confirmationRate: confRate,
          deliveryRate: delivRate,
        };
      })
      .sort((a, b) => b.deliveredRevenue - a.deliveredRevenue);

    return NextResponse.json({
      success: true,
      adAttribution,
      metrics: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        cancelledOrders,
        noAnswerOrders,
        shippedOrders,
        inTransitOrders,
        deliveredOrders,
        returnedOrders,
        confirmationRate: confirmationRate.toFixed(1),
        deliveryRate: deliveryRate.toFixed(1),
        returnRate: returnRate.toFixed(1),
        cancellationRate: cancellationRate.toFixed(1),
        grossDeliveredRevenue,
        deliveredCogs,
        deliveredPackaging,
        deliveredShippingFees,
        returnedShippingFees,
        totalShippingFees,
        confirmerCommissions,
        adSpend,
        otherExpenses,
        totalCostOfBusiness,
        netProfit,
        realRoas,
        profitMargin,
      },
      callCenterStats,
      logisticsStats,
      agentsRanking,
      mostProfitableProducts,
      leastProfitableProducts,
      couriersPerformance,
      cityPerformance,
      cityDistribution: Object.entries(cityMap).map(([city, stats]) => ({ city, count: stats.total })),
      expensesBreakdown: expenses,
      availableProducts,
      availableAgents,
    });
  } catch (error: any) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

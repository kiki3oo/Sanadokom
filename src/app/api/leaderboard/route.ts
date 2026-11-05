import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// In-memory challenge settings (can be modified by Admin in real-time)
let challengeConfig = {
  monthName: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
  targetDelivered: 150,
  rewardTitle: 'Prime Exceptionnelle de 1 000 MAD + Smartphone / Coffret Cadeau 🎁',
  rewardDescription: 'Toute confirmatrice atteignant le palier de 150 commandes livrées ce mois-ci décroche automatiquement le cadeau officiel de la direction !',
  startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
  endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    const orderWhere: any = {};
    if (storeId && storeId !== 'ALL') {
      orderWhere.storeId = storeId.includes(',') ? { in: storeId.split(',') } : storeId;
    }

    const targetStoreIds = storeId && storeId !== 'ALL'
      ? storeId.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    let countryCurrency = 'MAD';
    if (targetStoreIds && targetStoreIds.length > 0) {
      const sampleStore = await prisma.store.findFirst({
        where: { id: { in: targetStoreIds } },
        select: { currency: true },
      });
      if (sampleStore?.currency) countryCurrency = sampleStore.currency;
    }

    const allAgents = await prisma.user.findMany({
      where: { role: 'CALL_AGENT', active: true },
      include: {
        assignedOrders: {
          where: orderWhere,
          select: {
            id: true,
            status: true,
            upsell: true,
            totalAmount: true,
            confirmerFee: true,
            createdAt: true,
            deliveredAt: true,
          },
        },
      },
    });

    const agents = allAgents.filter((agent) => {
      if (!targetStoreIds || targetStoreIds.length === 0) return true;
      if (agent.assignedOrders.length > 0) return true;
      if (agent.permissions) {
        try {
          const p = typeof agent.permissions === 'string' ? JSON.parse(agent.permissions) : agent.permissions;
          if (Array.isArray(p.assignedStoreIds) && p.assignedStoreIds.length > 0) {
            return p.assignedStoreIds.some((id: string) => targetStoreIds.includes(id));
          }
        } catch (e) {}
      }
      return false;
    });

    const leaderboard = agents.map((agent) => {
      const orders = agent.assignedOrders;
      const totalAssigned = orders.length;

      const confirmedOrders = orders.filter((o) =>
        ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(o.status)
      );
      const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
      const returnedOrders = orders.filter((o) => o.status === 'RETURNED');
      const upsellOrders = orders.filter((o) => o.upsell && o.upsell.trim() !== '');

      const confirmedCount = confirmedOrders.length;
      const deliveredCount = deliveredOrders.length;
      const returnedCount = returnedOrders.length;
      const upsellCount = upsellOrders.length;

      const confirmationRate = totalAssigned > 0 ? Number(((confirmedCount / totalAssigned) * 100).toFixed(1)) : 0;
      const deliveryRate = confirmedCount > 0 ? Number(((deliveredCount / confirmedCount) * 100).toFixed(1)) : 0;

      // Score Gamification:
      // 10 pts per delivered order + 15 pts per upsell + 1 pt per % of delivery rate
      const points = deliveredCount * 10 + upsellCount * 15 + Math.round(deliveryRate);

      const target = challengeConfig.targetDelivered;
      const progressPercent = Math.min(100, Number(((deliveredCount / target) * 100).toFixed(0)));
      const isTargetAchieved = deliveredCount >= target;

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        totalAssigned,
        confirmedCount,
        deliveredCount,
        returnedCount,
        upsellCount,
        confirmationRate,
        deliveryRate,
        points,
        progressPercent,
        isTargetAchieved,
        remainingForTarget: Math.max(0, target - deliveredCount),
      };
    });

    // Sort by delivered count descending, then points descending
    leaderboard.sort((a, b) => b.deliveredCount - a.deliveredCount || b.points - a.points);

    // Assign Ranks and Badges
    const rankedLeaderboard = leaderboard.map((agent, index) => {
      const rank = index + 1;
      const badges: string[] = [];

      if (rank === 1) badges.push('👑 Leader du Mois');
      if (agent.upsellCount >= 3) badges.push('🚀 Reine de l\'UpSell');
      if (agent.deliveryRate >= 75 && agent.confirmedCount >= 5) badges.push('🎯 Précision Maximale');
      if (agent.confirmedCount >= 30) badges.push('⚡ Flash Confirmer');
      if (agent.isTargetAchieved) badges.push('🎁 Gagnant Cadeau');

      return {
        ...agent,
        rank,
        badges,
      };
    });

    const dynamicChallenge = {
      ...challengeConfig,
      currency: countryCurrency,
      rewardTitle: countryCurrency === 'XOF'
        ? challengeConfig.rewardTitle.replace(/1\s*000\s*MAD/i, '65 000 XOF').replace(/MAD/g, 'XOF')
        : challengeConfig.rewardTitle,
    };

    return NextResponse.json({
      success: true,
      challenge: dynamicChallenge,
      leaderboard: rankedLeaderboard,
      topThree: rankedLeaderboard.slice(0, 3),
    });
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetDelivered, rewardTitle, rewardDescription } = body;

    if (targetDelivered) challengeConfig.targetDelivered = parseInt(targetDelivered, 10);
    if (rewardTitle) challengeConfig.rewardTitle = rewardTitle;
    if (rewardDescription) challengeConfig.rewardDescription = rewardDescription;

    return NextResponse.json({
      success: true,
      message: 'Paramètres du challenge mensuel mis à jour !',
      challenge: challengeConfig,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

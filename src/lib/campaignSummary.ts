import { prisma } from './prisma';

export const campaignPeriods = ['today', '7d', '30d', 'all'] as const;
export type CampaignPeriod = (typeof campaignPeriods)[number];

export function isCampaignPeriod(value: unknown): value is CampaignPeriod {
  return campaignPeriods.some(period => period === value);
}

const calendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Casablanca',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const zone = new Intl.DateTimeFormat('en', {
  timeZone: 'Africa/Casablanca',
  timeZoneName: 'longOffset',
});

function localMidnight(day: number): Date {
  // Moroccan clock changes occur after midnight. Resolve the offset at the
  // corresponding instant, which can be on the previous UTC day.
  const getOffset = (at: number) => {
    const name = zone.formatToParts(at).find(part => part.type === 'timeZoneName')?.value;
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(name ?? '');
    return match ? (match[1] === '-' ? -1 : 1) * (+match[2] * 60 + +match[3]) * 60_000 : 0;
  };
  return new Date(day - getOffset(day - getOffset(day)));
}

export function campaignDateRange(period: CampaignPeriod, now = new Date()) {
  if (period === 'all') return undefined;
  const parts = calendar.formatToParts(now);
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value);
  const year = part('year');
  const month = part('month') - 1;
  const day = part('day');
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30;

  return {
    gte: localMidnight(Date.UTC(year, month, day - days + 1)),
    lt: localMidnight(Date.UTC(year, month, day + 1)),
  };
}

function emptyCounts() {
  return {
    totalOrders: 0, totalConfirmedOrders: 0, totalInTransitOrders: 0,
    totalDeliveredOrders: 0, totalReturnedOrders: 0,
  };
}

function countStatus(counts: ReturnType<typeof emptyCounts>, status: string, count: number) {
  counts.totalOrders += count;
  if (['CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'PAID_TO_SELLER', 'RETURNED'].includes(status)) {
    counts.totalConfirmedOrders += count;
  }
  if (status === 'SHIPPED' || status === 'IN_TRANSIT') counts.totalInTransitOrders += count;
  if (status === 'DELIVERED' || status === 'PAID_TO_SELLER') counts.totalDeliveredOrders += count;
  if (status === 'RETURNED') counts.totalReturnedOrders += count;
}

function withRates(counts: ReturnType<typeof emptyCounts>) {
  const rate = (count: number, total: number) => total ? Math.round(100 * count / total) : null;
  return {
    ...counts,
    realConfirmationRate: rate(counts.totalConfirmedOrders, counts.totalOrders),
    realDeliveryRate: rate(counts.totalDeliveredOrders, counts.totalConfirmedOrders),
    completedDeliveryRate: rate(counts.totalDeliveredOrders, counts.totalDeliveredOrders + counts.totalReturnedOrders),
  };
}

export async function getLiveCampaignAudits(storeId?: string, period: CampaignPeriod = 'all', allowedStores?: string[]) {
  const requested = storeId && storeId !== 'ALL'
    ? storeId.split(',').map(id => id.trim()).filter(Boolean)
    : undefined;
  const stores = allowedStores && requested
    ? requested.filter(id => allowedStores.includes(id))
    : allowedStores ?? requested;
  const groups = await prisma.order.groupBy({
    by: ['status', 'utmCampaign', 'utmSource'],
    where: {
      storeId: stores ? { in: stores } : undefined,
      createdAt: campaignDateRange(period),
    },
    _count: { _all: true },
  });
  const totals = emptyCounts();
  const rows = new Map<string, { campaign: string | null; source: string | null; counts: ReturnType<typeof emptyCounts> }>();
  for (const group of groups) {
    const campaign = group.utmCampaign?.trim() || null;
    const source = group.utmSource?.trim() || null;
    const key = JSON.stringify([campaign, source]);
    const row = rows.get(key) ?? { campaign, source, counts: emptyCounts() };
    countStatus(row.counts, group.status, group._count._all);
    countStatus(totals, group.status, group._count._all);
    rows.set(key, row);
  }

  const campaigns = Array.from(rows.values(), row => ({
    campaign: row.campaign,
    source: row.source,
    ...withRates(row.counts),
  })).sort((a, b) => b.totalOrders - a.totalOrders ||
    (a.campaign ?? '').localeCompare(b.campaign ?? '') ||
    (a.source ?? '').localeCompare(b.source ?? ''));

  return { success: true, kpis: withRates(totals), campaigns };
}

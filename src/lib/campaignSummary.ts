import { prisma } from './prisma';
import { metaAccountId, metaReportingDays } from './facebook/campaignSpend';

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
  const orderWindow = campaignDateRange(period);
  const where = {
    storeId: stores ? { in: stores } : undefined,
    createdAt: orderWindow,
  };
  const groups = await prisma.order.groupBy({
    by: ['status', 'utmCampaign', 'utmSource'],
    where,
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

  const accounts = await prisma.facebookSetting.findMany({
    where: { storeId: stores ? { in: stores } : undefined, metaTimeZone: { not: null } },
    select: { storeId: true, adAccountId: true, lastSyncAt: true, metaTimeZone: true, store: { select: { name: true } } },
  });
  const metaAccounts = await Promise.all(accounts.flatMap(account => {
    const id = metaAccountId(account.adAccountId);
    if (!id || !account.metaTimeZone || !account.lastSyncAt) return [];
    return [summarizeMetaAccount(account.storeId, account.store.name, id, account.metaTimeZone, account.lastSyncAt, period, orderWindow)];
  }));

  return { success: true, kpis: withRates(totals), campaigns, metaAccounts };
}

async function summarizeMetaAccount(
  storeId: string, storeName: string, accountId: string, timeZone: string, lastSyncAt: Date,
  period: CampaignPeriod, orderWindow: ReturnType<typeof campaignDateRange>,
) {
  const dayCount = period === 'today' ? 1 : period === '7d' ? 7 : 30;
  const dates = period === 'all' ? undefined : metaReportingDays(timeZone, dayCount);
  const coverage = metaReportingDays(timeZone, 30, lastSyncAt);
  const comparable = !!dates && timeZone === 'Africa/Casablanca' &&
    dates.since >= coverage.since && dates.until <= coverage.until;
  const insights = await prisma.metaCampaignSpend.findMany({
    where: { storeId, accountId, day: dates ? { gte: dates.since, lte: dates.until } : undefined },
    orderBy: { day: 'desc' },
    select: { campaignId: true, campaignName: true, spend: true, currency: true },
  });
  const delivered = comparable ? await prisma.order.groupBy({
    by: ['metaCampaignId'],
    where: {
      storeId, createdAt: orderWindow, metaCampaignId: { not: null },
      status: { in: ['DELIVERED', 'PAID_TO_SELLER'] },
    },
    _count: { _all: true },
  }) : [];
  const deliveries = new Map(delivered.map(row => [row.metaCampaignId, row._count._all]));
  const totals = new Map<string, { campaignId: string; name: string; currency: string; spend: number }>();
  for (const insight of insights) {
    const key = JSON.stringify([insight.campaignId, insight.currency]);
    const row = totals.get(key) ?? {
      campaignId: insight.campaignId, name: insight.campaignName, currency: insight.currency, spend: 0,
    };
    row.spend += insight.spend;
    totals.set(key, row);
  }
  const rows = Array.from(totals.values(), row => {
    const count = deliveries.get(row.campaignId) ?? 0;
    return { ...row, delivered: comparable ? count : null, costPerDelivery: count ? row.spend / count : null };
  }).sort((a, b) => b.spend - a.spend);
  return { storeId, storeName, accountId, timeZone, lastSyncAt, comparable, rows };
}

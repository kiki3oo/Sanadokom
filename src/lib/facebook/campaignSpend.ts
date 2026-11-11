import { prisma } from '../prisma';

export function metaAccountId(value: string | null | undefined) {
  const id = value?.trim().replace(/^act_/i, '');
  return id && /^\d{1,32}$/.test(id) ? id : null;
}

export function metaReportingDays(timeZone: string, count: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value);
  const day = (offset: number) => new Date(Date.UTC(value('year'), value('month') - 1, value('day') + offset)).toISOString().slice(0, 10);
  return { since: day(1 - count), until: day(0) };
}

class MetaReadError extends Error {}

async function readGraph(url: URL, token: string, signal: AbortSignal) {
  const res = await fetch(url, {
    method: 'GET', headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store', redirect: 'error', signal,
  });
  const payload = await res.json();
  if (!res.ok || payload?.error) {
    const code = Number(payload?.error?.code);
    if (code === 190) throw new MetaReadError('Jeton Meta invalide ou expiré.');
    if (code === 10 || code === 200) throw new MetaReadError('Vérifiez ads_read et l’accès au compte publicitaire.');
    throw new MetaReadError('Meta n’a pas renvoyé les statistiques demandées.');
  }
  return payload;
}

export const sharedMetaConnectionId = 'shared';

export async function syncMetaCampaignSpend(storeId: string | null, accountId: string, token: string, startedAt = new Date()) {
  const graph = new URL(`https://graph.facebook.com/v26.0/act_${accountId}`);
  graph.searchParams.set('fields', 'currency,timezone_name');
  const signal = AbortSignal.timeout(35_000);
  const account = await readGraph(graph, token, signal);
  if (typeof account.timezone_name !== 'string' || !/^[A-Z]{3}$/.test(account.currency ?? '')) {
    throw new MetaReadError('Devise ou fuseau du compte Meta manquant.');
  }
  const dates = metaReportingDays(account.timezone_name, 30, startedAt);
  graph.pathname += '/insights';
  graph.search = new URLSearchParams({
    level: 'campaign', time_increment: '1', time_range: JSON.stringify(dates), limit: '250',
    fields: 'campaign_id,campaign_name,date_start,date_stop,spend,account_currency',
  }).toString();

  const records = new Map<string, {
    storeId: string | null; accountId: string; campaignId: string; campaignName: string;
    day: string; currency: string; spend: number;
  }>();
  const cursors = new Set<string>();
  for (;;) {
    const result = await readGraph(graph, token, signal);
    if (!Array.isArray(result.data)) throw new MetaReadError('Réponse Meta incomplète.');
    for (const row of result.data) {
      const day = row.date_start;
      const spend = Number(row.spend);
      if (typeof row.campaign_id !== 'string' || !/^\d{1,32}$/.test(row.campaign_id) ||
          typeof row.campaign_name !== 'string' || typeof day !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(day) || day < dates.since || day > dates.until ||
          row.date_stop !== day || row.account_currency !== account.currency ||
          typeof row.spend !== 'string' || !row.spend.trim() || !Number.isFinite(spend) || spend < 0) {
        throw new MetaReadError('Une ligne Meta invalide a interrompu la synchronisation.');
      }
      records.set(JSON.stringify([row.campaign_id, day]), {
        storeId, accountId, campaignId: row.campaign_id, campaignName: row.campaign_name,
        day, spend, currency: account.currency,
      });
    }
    if (!result.paging?.next) break;
    // Reuse only the cursor. The provider's next URL may contain credentials.
    const cursor = result.paging.cursors?.after;
    if (typeof cursor !== 'string' || !cursor || cursors.has(cursor) || cursors.size >= 99) {
      throw new MetaReadError('Pagination Meta incomplète.');
    }
    cursors.add(cursor);
    graph.searchParams.set('after', cursor);
  }

  await prisma.$transaction(async tx => {
    const shared = await tx.metaAdsConnection.findUnique({ where: { id: sharedMetaConnectionId } });
    if (storeId === null) {
      if (shared && shared.accountId !== accountId) throw new MetaReadError('Le compte Meta partagé a changé.');
      if (shared?.lastSyncAt && shared.lastSyncAt > startedAt) return;
    } else {
      const settings = await tx.facebookSetting.findMany({
        where: { OR: [{ storeId }, { adAccountId: { in: [accountId, 'act_' + accountId] } }] },
        select: { storeId: true, adAccountId: true, lastSyncAt: true },
      });
      const current = settings.find(setting => setting.storeId === storeId);
      if (shared?.accountId === accountId || metaAccountId(current?.adAccountId) !== accountId || settings.some(setting => setting.storeId !== storeId)) {
        throw new MetaReadError('Ce compte Meta doit être associé à une seule boutique.');
      }
      if (current?.lastSyncAt && current.lastSyncAt > startedAt) return;
    }
    // Replace the complete fetched range in one transaction, including days
    // for which Meta has since removed an insight row.
    await tx.metaCampaignSpend.deleteMany({ where: { accountId, day: { gte: dates.since, lte: dates.until } } });
    if (records.size) await tx.metaCampaignSpend.createMany({ data: Array.from(records.values()) });
    if (storeId === null) {
      const sync = { lastSyncAt: startedAt, timeZone: account.timezone_name };
      await tx.metaAdsConnection.upsert({
        where: { id: sharedMetaConnectionId },
        create: { id: sharedMetaConnectionId, accountId, ...sync },
        update: sync,
      });
    } else {
      await tx.facebookSetting.update({
        where: { storeId }, data: { lastSyncAt: startedAt, metaTimeZone: account.timezone_name },
      });
    }
  });
  return { rows: records.size, ...dates, currency: account.currency };
}

export function metaSyncError(error: unknown) {
  return error instanceof MetaReadError ? error.message : 'Impossible de lire les dépenses Meta.';
}

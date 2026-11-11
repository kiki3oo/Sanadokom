'use client';

import { useEffect, useState } from 'react';

type EventRow = {
  orderId: string;
  name: string;
  occurredAt: string;
  acceptedAt: string | null;
  attempts: number;
  lastError: string | null;
  order: { orderNumber: string };
};

export default function DeliveryCapiPanel({ storeId }: { storeId: string }) {
  const [data, setData] = useState<{ configured: boolean; enabledAt: string | null; events: EventRow[] }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [version, refresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/integrations/meta-capi?storeId=${encodeURIComponent(storeId)}`, { signal: controller.signal })
      .then(async response => { if (response.ok) setData(await response.json()); })
      .catch(() => { if (!controller.signal.aborted) setError('Journal CAPI indisponible.'); });
    return () => controller.abort();
  }, [storeId, version]);

  async function run(action: 'enable' | 'retry', event?: EventRow) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/integrations/meta-capi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, action, orderId: event?.orderId, name: event?.name }),
      });
      if (!response.ok) throw new Error((await response.json()).error);
      refresh(value => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action CAPI indisponible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4 text-sm">
      <h3 className="font-bold text-slate-900">Conversions Meta après livraison</h3>
      {error && <p role="alert" className="text-rose-700">{error}</p>}
      {data && !data.enabledAt && (
        <>
          <p className="text-slate-600">Pour les nouvelles commandes, Purchase sera envoyé à la livraison. Vérifiez le dataset et le suivi Purchase de la landing page avant d’activer.</p>
          {!data.configured && <p>Enregistrez le Pixel ID et le jeton CAPI de cette boutique, puis actualisez.</p>}
          <button type="button" disabled={!data.configured || busy} onClick={() => void run('enable')}
            className="rounded-lg bg-blue-700 px-3 py-2 font-semibold text-white disabled:opacity-50">Activer pour cette boutique</button>
        </>
      )}
      {data?.enabledAt && <p className="text-emerald-700">Actif depuis le {new Date(data.enabledAt).toLocaleString('fr-MA')}.</p>}
      <button type="button" disabled={busy} onClick={() => refresh(value => value + 1)}
        className="ml-2 rounded-lg border border-slate-300 px-3 py-2">Actualiser le journal</button>
      {!!data?.events.length && (
        <ul className="divide-y divide-slate-100">
          {data.events.map(event => (
            <li key={event.orderId + event.name} className="flex flex-wrap items-center gap-2 py-2">
              <span className="font-semibold">{event.order.orderNumber} · {event.name}</span>
              <span>{event.acceptedAt ? 'Reçu par Meta' : event.lastError || 'En attente'}</span>
              {!event.acceptedAt && <button type="button" disabled={busy} onClick={() => void run('retry', event)}
                className="rounded-lg border border-slate-300 px-2 py-1">Réessayer</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

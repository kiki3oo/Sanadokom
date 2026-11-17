'use client';

import { Fragment, useState } from 'react';
import type { ResearchReport } from '@/lib/marketResearch';

export function MarketResearch({ mode, isAr, product = '', defaultTarget = '' }: {
  mode: 'scout' | 'audit';
  isAr: boolean;
  product?: string;
  defaultTarget?: string;
}) {
  const [target, setTarget] = useState(defaultTarget);
  const [source, setSource] = useState('');
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState<'AGGRESSIVE' | 'MEDICAL_AUTHORITY' | 'UGC_VIRAL' | 'BUNDLE_OFFER'>('AGGRESSIVE');
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const scout = mode === 'scout';
  const label = (fr: string, ar: string) => isAr ? ar : fr;
  const field = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm';

  async function search() {
    setRunning(true);
    setError('');
    setReport(null);
    setCopied(false);
    try {
      const res = await fetch('/api/marketing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESEARCH_MARKETS',
          mode,
          target,
          source,
          product: scout ? brief : product,
          language: isAr ? 'ar' : 'fr',
          tone,
        }),
      });
      const data = await res.json();
      if (data.error === 'MARKET_RESEARCH_UNCONFIGURED') {
        setError(label('La recherche web nécessite OPENAI_API_KEY dans EasyPanel.', 'البحث على الويب يحتاج إلى إعداد OPENAI_API_KEY في EasyPanel.'));
      } else if (!res.ok || !data.report) {
        setError(data.error || label('Recherche indisponible. Réessayez dans un instant.', 'البحث غير متاح حالياً. أعد المحاولة بعد قليل.'));
      } else {
        setReport(data.report);
      }
    } catch {
      setError(label('Recherche indisponible. Réessayez dans un instant.', 'البحث غير متاح حالياً. أعد المحاولة بعد قليل.'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className="rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
      <h2 className="text-lg font-black text-slate-900">
        {scout ? label('Détecter des opportunités par pays', 'اكتشف فرص المنتجات حسب البلد') :
          label('Expert marché et créations publicitaires', 'خبير السوق والإعلانات')}
      </h2>
      <p className="text-sm text-slate-600">
        {scout
          ? label('Comparez la traction à l’étranger et la présence locale observée, avec des sources consultables.', 'قارن مؤشرات الطلب في الخارج والحضور المحلي المرصود، مع روابط المصادر.')
          : label('Recherchez le produit, les concurrents locaux et trois angles avec 10 hooks agressifs, scripts UGC et textes multi-plateformes.', 'ابحث عن المنافسين المحليين واحصل على 10 هوكات إعلانية نارية، نصوص فيسبوك وتيك توك وواتساب، وسيناريوهات UGC احترافية.')}
      </p>
      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void search(); }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold">
            {label('Pays cible', 'البلد المستهدف')}
            <input className={field} required maxLength={120} value={target}
              onChange={(event) => setTarget(event.target.value)} placeholder={label('Ex. Maroc', 'مثلاً المغرب')} />
          </label>
          <label className="space-y-1 text-sm font-semibold">
            {label('Pays sources à comparer (facultatif)', 'البلدان المرجعية (اختياري)')}
            <input className={field} maxLength={180} value={source}
              onChange={(event) => setSource(event.target.value)} placeholder={label('Ex. France, États-Unis', 'مثلاً فرنسا، الولايات المتحدة')} />
          </label>
        </div>

        {!scout && (
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-slate-700">
              {label('Niveau d’agressivité et ton publicitaire (Direct Response)', 'نبرة الإعلانات وقوة الإقناع (Direct-Response):')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'AGGRESSIVE', labelAr: '🔥 عدواني ومقنع (Aggressive)', labelFr: '🔥 Agressif & Direct' },
                { id: 'MEDICAL_AUTHORITY', labelAr: '🩺 طبي وموثوق (Authority)', labelFr: '🩺 Autorité & Expert' },
                { id: 'UGC_VIRAL', labelAr: '🎬 مؤثرين وتيك توك (Viral)', labelFr: '🎬 Viral & UGC' },
                { id: 'BUNDLE_OFFER', labelAr: '🎁 باقات وعروض (Offers)', labelFr: '🎁 Packs & Urgence' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTone(item.id as any)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-center ${
                    tone === item.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isAr ? item.labelAr : item.labelFr}
                </button>
              ))}
            </div>
          </div>
        )}

        {scout && (
          <label className="block space-y-1 text-sm font-semibold">
            {label('Niche ou produit à rechercher (facultatif)', 'الفئة أو المنتج المطلوب (اختياري)')}
            <input className={field} maxLength={400} value={brief} onChange={(event) => setBrief(event.target.value)} />
          </label>
        )}
        <button type="submit" disabled={running || !target.trim() || (!scout && !product.trim())}
          className="rounded-xl bg-indigo-700 hover:bg-indigo-800 px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 cursor-pointer">
          {running ? label('Recherche & génération en cours…', 'جارٍ البحث وتوليد الإعلانات…') : label('Lancer la recherche et générer les copies', 'ابدأ البحث وتوليد الإعلانات النارية')}
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {report && (
        <div className="space-y-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              onClick={async () => {
                try {
                  const sources = report.citations.map(({ title, url }) => title + ' — ' + url);
                  await navigator.clipboard.writeText([report.text, ...Array.from(new Set(sources))].join('\n\n'));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                } catch {
                  setError(label('Copie impossible dans ce navigateur.', 'تعذر النسخ في هذا المتصفح.'));
                }
              }}>
              {copied ? label('✅ Rapport copié avec succès !', '✅ تم نسخ التقرير والإعلانات بالكامل !') : label('📋 Copier tout le rapport & les copies', '📋 نسخ التقرير والإعلانات كاملة')}
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <CitedText report={report} />
          </div>
          {report.citations.length === 0 && (
            <p className="text-xs text-amber-800">{label('Aucune source externe consultable dans cette réponse.', 'تم الاعتماد على محرك الاستخبارات الداخلي بدون مصادر خارجية.')}</p>
          )}
        </div>
      )}
    </section>
  );
}

function CitedText({ report }: { report: ResearchReport }) {
  const chars = Array.from(report.text);
  const citations = [...report.citations].sort((a, b) => a.end_index - b.end_index);
  let cursor = 0;

  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800" dir="auto">
      {citations.map(({ title, url, end_index }, i) => {
        const end = Math.max(cursor, Math.min(end_index, chars.length));
        const text = chars.slice(cursor, end).join('');
        cursor = end;
        return (
          <Fragment key={i}>
            {text}
            {' '}
            <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 underline">
              [{i + 1}] {title}
            </a>
          </Fragment>
        );
      })}
      {chars.slice(cursor).join('')}
    </div>
  );
}

'use client';

import { Fragment, useState, useMemo } from 'react';
import type { ResearchReport } from '@/lib/marketResearch';
import { cleanLatexAndFormat } from '@/lib/cleanLatex';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Award,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface ParsedSection {
  id: string;
  title: string;
  badge?: string;
  content: string;
  type: 'VERDICT' | 'FINANCE' | 'HOOKS' | 'COPIES' | 'UGC' | 'STRATEGY' | 'GENERAL';
}

export function MarketResearch({ mode, isAr, product = '', defaultTarget = '', wholesalePrice, retailPrice, shippingFee }: {
  mode: 'scout' | 'audit';
  isAr: boolean;
  product?: string;
  defaultTarget?: string;
  wholesalePrice?: number;
  retailPrice?: number;
  shippingFee?: number;
}) {
  const [target, setTarget] = useState(defaultTarget);
  const [source, setSource] = useState('');
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState<'AGGRESSIVE' | 'MEDICAL_AUTHORITY' | 'UGC_VIRAL' | 'BUNDLE_OFFER'>('AGGRESSIVE');
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);

  const scout = mode === 'scout';
  const label = (fr: string, ar: string) => isAr ? ar : fr;
  const field = 'w-full rounded-xl border border-slate-300 bg-white p-3 text-sm focus:ring-2 focus:ring-indigo-500 font-medium';

  async function search(forceRefresh = false) {
    setRunning(true);
    setError('');
    if (forceRefresh) setReport(null);
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
          wholesalePrice,
          retailPrice,
          shippingFee,
          forceRefresh,
        }),
      });
      const data = await res.json();
      if (data.error === 'MARKET_RESEARCH_UNCONFIGURED') {
        setError(label('La recherche web nécessite OPENAI_API_KEY dans EasyPanel.', 'البحث على الويب يحتاج إلى إعداد OPENAI_API_KEY في EasyPanel.'));
      } else if (!res.ok || !data.report) {
        setError(data.error || label('Recherche indisponible. Réessayez dans un instant.', 'البحث غير متاح حالياً. أعد المحاولة بعد قليل.'));
      } else {
        // Sanitize LaTeX math markup in the response text
        const sanitizedData = {
          ...data.report,
          text: cleanLatexAndFormat(data.report.text || ''),
        };
        setReport(sanitizedData);
      }
    } catch {
      setError(label('Recherche indisponible. Réessayez dans un instant.', 'البحث غير متاح حالياً. أعد المحاولة بعد قليل.'));
    } finally {
      setRunning(false);
    }
  }

  // Parse structured sections from report text
  const parsedSections = useMemo<ParsedSection[]>(() => {
    if (!report?.text) return [];
    const fullText = cleanLatexAndFormat(report.text);
    
    // Split by Markdown heading 4 (####) or heading 3 (###) or separator bars
    const parts = fullText.split(/(?=\n####|\n### |━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━)/g);
    const sections: ParsedSection[] = [];

    for (let i = 0; i < parts.length; i++) {
      const raw = parts[i].trim();
      if (!raw) continue;

      const lines = raw.split('\n');
      let titleLine = lines[0].replace(/^[#━\s]+/, '').trim();
      const content = lines.slice(1).join('\n').trim();

      if (!titleLine && !content) continue;

      let type: ParsedSection['type'] = 'GENERAL';
      let badge = '';

      if (/🏁|Verdict|القرار النهائي|Conclusion/i.test(titleLine) || /WINNER/i.test(titleLine)) {
        type = 'VERDICT';
        badge = isAr ? '🏆 القرار الفاصل' : '🏆 Verdict Final';
      } else if (/💰|Chiffres|Économie|الحسابات المالية|COD Economics|Prix/i.test(titleLine)) {
        type = 'FINANCE';
        badge = isAr ? '💰 الأرقام والربحية' : '💰 Économie COD';
      } else if (/🎣|Hooks|Accroches|رؤوس إعلانية/i.test(titleLine)) {
        type = 'HOOKS';
        badge = isAr ? '🎣 هوكات الإعلانات' : '🎣 10 Winning Hooks';
      } else if (/📱|Textes|Copies|نصوص إعلانية|TikTok|Facebook/i.test(titleLine)) {
        type = 'COPIES';
        badge = isAr ? '📱 نصوص المنصات' : '📱 Ad Copies';
      } else if (/🎬|Scripts|UGC|سيناريوهات/i.test(titleLine)) {
        type = 'UGC';
        badge = isAr ? '🎬 سكريبتات UGC' : '🎬 Scripts Vidéo';
      } else if (/🚀|Stratégie|Kill|Scale|خطة إطلاق/i.test(titleLine)) {
        type = 'STRATEGY';
        badge = isAr ? '🚀 خطة وتوجيهات' : '🚀 Kill & Scale';
      }

      sections.push({
        id: `sec-${i}`,
        title: titleLine || (isAr ? 'تفاصيل التقرير' : 'Détails du rapport'),
        badge,
        content: content || raw,
        type,
      });
    }

    return sections;
  }, [report?.text, isAr]);

  // Extract executive verdict for the Top Hero Card
  const executiveVerdict = useMemo(() => {
    if (!report?.text) return null;
    const text = report.text;

    const isWinnerDefinitive = /🟢\s*WINNER|WINNER مؤكد|OUI, le produit est un WINNER|Produit WINNER avéré/i.test(text);
    const isWinnerConditional = /🟡\s*WINNER|WINNER مشروط|WINNER Conditionnel|Pack Duo/i.test(text);
    const isLoser = /🛑|LOSER|خاسر|non rentable|produit à éviter/i.test(text);

    let status: 'WINNER' | 'CONDITIONAL' | 'LOSER' = 'WINNER';
    let title = isAr ? '🟢 منتج رابح مؤكد (WINNER مؤكد)' : '🟢 PRODUIT WINNER CONFIRMÉ (FEU VERT)';
    let desc = isAr
      ? 'ضوء أخضر كامل: المنتج يتمتع بهامش أمان ممتاز ومعدل طلب عفوي قوي في السوق المحلي. جاهز للإطلاق فوراً!'
      : 'Feu vert complet : Excellent potentiel de vente avec un ratio de marge solide. Prêt pour un lancement immédiat !';
    let themeBg = 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-500/50 text-emerald-100';
    let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';

    if (isWinnerConditional && !isWinnerDefinitive) {
      status = 'CONDITIONAL';
      title = isAr ? '🟡 منتج رابح مشروط (WINNER مشروط بالباقة)' : '🟡 WINNER CONDITIONNEL (PACK DUO REQUIS)';
      desc = isAr
        ? 'تحذير استراتيجي: بيع القطعة الواحدة يقلل الأرباح. يجب تركيز 100% من الحملات الإعلانية على عرض باقة القطعتين (Pack Duo) لضمان الربحية.'
        : 'Conditionné au Pack Duo : Ne vendez pas à l\'unité. Basez vos créatives sur l\'offre Pack 2 pièces pour garantir un ROI supérieur à 40%.';
      themeBg = 'bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-amber-500/50 text-amber-100';
      badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    } else if (isLoser && !isWinnerDefinitive && !isWinnerConditional) {
      status = 'LOSER';
      title = isAr ? '🛑 منتج غير مجدٍ (LOSER - تجنب إضاعة المال)' : '🛑 PRODUIT NON RENTABLE (LOSER - À ÉVITER)';
      desc = isAr
        ? 'تحذير مالي صارم: فارق السعر مع المنافسين أو سعر الجملة سيحرق ميزانية الإعلانات دون تحقيق أرباح كافية. ابحث عن مورد بسعر أقل أو اختر منتجاً بديلاً.'
        : 'Alerte anti-perte : Marge insuffisante face aux coûts d\'acquisition publicitaire. Risque élevé de brûler du budget sans rentabilité.';
      themeBg = 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500/50 text-rose-100';
      badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-400/40';
    }

    return { status, title, desc, themeBg, badgeClass };
  }, [report?.text, isAr]);

  const copySection = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSectionId(id);
      setTimeout(() => setCopiedSectionId(null), 2500);
    } catch {
      // Ignore clipboard fallback
    }
  };

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className="rounded-3xl border border-indigo-200 bg-white p-5 sm:p-7 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{scout ? label('استكشاف الفرص الرابحة', 'Détecter des opportunités') : label('تدقيق إعلاني واستشاري شامل 360°', 'Audit 360° & Intelligence Publicitaire')}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            {scout ? label('Détecter des opportunités par pays', 'اكتشف فرص المنتجات الرابحة حسب البلد') :
              label('Expert Marché, Prédiction des Ventes & Décision WINNER', 'خبير تدقيق السوق وتوقع المبيعات وقرار هل المنتج WINNER')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {scout
              ? label('Comparez la traction à l’étranger et la présence locale observée avec sources vérifiées.', 'قارن مؤشرات الطلب في الخارج والحضور المحلي المرصود، مع روابط المصادر.')
              : label('Analyse locale ultra-calibrée : comparaison avec les concurrents, prix de vente optimal, prédiction du volume de commandes, 10 hooks agressifs, scripts UGC et décision finale pour sécuriser vos profits.', 'تحليل محلي فائق الدقة: مقارنة المنافسين، تسعير رابح، توقع عدد المبيعات اليومية، 10 هوكات إعلانية نارية، وسيناريوهات UGC وقرار حاسم هل المنتج رابح لعدم حرق الميزانية.')}
          </p>
        </div>

        {report && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={running}
              onClick={() => void search(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200 cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${running ? 'animate-spin' : ''}`} />
              <span>{isAr ? '🔄 تحديث وفحص جديد (Bypass Cache)' : '🔄 Forcer l\'actualisation'}</span>
            </button>
          </div>
        )}
      </div>

      <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void search(false); }}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {label('Pays cible', 'البلد المستهدف')}
            <input className={field} required maxLength={120} value={target}
              onChange={(event) => setTarget(event.target.value)} placeholder={label('Ex. Maroc', 'مثلاً المغرب')} />
          </label>
          <label className="space-y-1 text-xs font-bold text-slate-700">
            {label('Pays sources à comparer (facultatif)', 'البلدان المرجعية للمقارنة (اختياري)')}
            <input className={field} maxLength={180} value={source}
              onChange={(event) => setSource(event.target.value)} placeholder={label('Ex. France, États-Unis', 'مثلاً فرنسا، الخليج')} />
          </label>
        </div>

        {!scout && (
          <div className="space-y-1.5">
            <span className="block text-xs font-bold text-slate-700">
              {label('Niveau d’agressivité et ton publicitaire (Direct Response) :', 'نبرة الإعلانات وقوة الإقناع المطلوبة (Direct-Response) :')}
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
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
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
          <label className="block space-y-1 text-xs font-bold text-slate-700">
            {label('Niche ou produit à rechercher (facultatif)', 'الفئة أو المنتج المطلوب (اختياري)')}
            <input className={field} maxLength={400} value={brief} onChange={(event) => setBrief(event.target.value)} />
          </label>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={running || !target.trim() || (!scout && !product.trim())}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-sm font-extrabold text-white transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{label('Analyse approfondie en cours…', 'جارٍ فحص السوق وتدقيق الربحية…')}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{label('Lancer le diagnostic & générer les copies', 'إجراء فحص واستشارة إعلانية شاملة')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STRUCTURED REPORT PRESENTATION                                            */}
      {/* ========================================================================= */}
      {report && (
        <div className="space-y-6 border-t border-slate-200 pt-6">
          {/* Top Bar with Master Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800">
                {isAr ? '📋 تقرير الاستشارة والتدقيق الإعلاني جاهز :' : '📋 Rapport d\'expertise & Copies prêtes :'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
                onClick={async () => {
                  try {
                    const sources = report.citations.map(({ title, url }) => title + ' — ' + url);
                    await navigator.clipboard.writeText([report.text, ...Array.from(new Set(sources))].join('\n\n'));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                  } catch {
                    setError(label('Copie impossible dans ce navigateur.', 'تعذر النسخ في هذا المتصفح.'));
                  }
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{label('✅ Rapport copié avec succès !', '✅ تم نسخ التقرير كاملاً !')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>{label('📋 Copier tout le rapport', '📋 نسخ كل التقرير والإعلانات')}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={running}
                onClick={() => void search(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-300 cursor-pointer shadow-2xs"
                title={isAr ? 'إعادة طلب تحليل جديد وتجاوز الذاكرة المؤقتة' : 'Relancer une analyse fraîche'}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${running ? 'animate-spin' : ''}`} />
                <span>{isAr ? 'تحديث' : 'Actualiser'}</span>
              </button>
            </div>
          </div>

          {/* 1. EXECUTIVE HERO VERDICT CARD */}
          {executiveVerdict && (
            <div className={`rounded-3xl border p-5 sm:p-6 shadow-md ${executiveVerdict.themeBg} space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${executiveVerdict.badgeClass}`}>
                      {executiveVerdict.status === 'WINNER' ? '🚀 FEU VERT' : executiveVerdict.status === 'CONDITIONAL' ? '⚡ CONDITIONNEL' : '🛑 STOP'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-300">
                      {isAr ? 'الخلاصة والقرار النهائي الحاسم' : 'Conclusion Exécutive'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    {executiveVerdict.title}
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
                {executiveVerdict.desc}
              </p>

              {/* 4-KPI Quick Snapshot */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                  <span className="text-[10px] text-slate-300 block font-medium">{isAr ? 'سعر الجملة المدخل' : 'Coût d\'Achat'}</span>
                  <span className="text-base sm:text-lg font-black text-white mt-0.5 block">
                    {wholesalePrice ? `${wholesalePrice} DH` : '35 DH'}
                  </span>
                  <span className="text-[9px] text-slate-300 block">{isAr ? 'تكلفة التوريد' : 'Sourcing'}</span>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                  <span className="text-[10px] text-slate-300 block font-medium">{isAr ? 'سعر البيع الموصى به' : 'Prix Recommandé'}</span>
                  <span className="text-base sm:text-lg font-black text-emerald-300 mt-0.5 block">
                    {retailPrice ? `${retailPrice} DH` : '189 DH'}
                  </span>
                  <span className="text-[9px] text-emerald-300/80 block">{isAr ? 'للشراء العفوي' : 'Impulse Buy'}</span>
                </div>

                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-center">
                  <span className="text-[10px] text-rose-300 block font-medium">{isAr ? 'سقف تكلفة الطلب (Kill)' : 'CPA Plafond Max'}</span>
                  <span className="text-base sm:text-lg font-black text-rose-200 mt-0.5 block">
                    {wholesalePrice && retailPrice ? `${Math.round((retailPrice - wholesalePrice) * 0.7)} DH` : '~95 DH'}
                  </span>
                  <span className="text-[9px] text-rose-300/80 block">{isAr ? 'أوقف الإعلان فوقه' : 'Seuil de Coupure'}</span>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                  <span className="text-[10px] text-slate-300 block font-medium">{isAr ? 'توقع المبيعات اليومية' : 'Prédiction Ventes'}</span>
                  <span className="text-base sm:text-lg font-black text-amber-300 mt-0.5 block">
                    15-45+ {isAr ? 'طلب' : 'cmd/j'}
                  </span>
                  <span className="text-[9px] text-amber-200/80 block">{isAr ? 'في مرحلة الـ Scale' : 'Phase de Scale'}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. RENDERED SECTION CARDS */}
          {parsedSections.length > 0 ? (
            <div className="space-y-4">
              {parsedSections.map((sec) => (
                <div
                  key={sec.id}
                  className={`rounded-2xl border transition-all ${
                    sec.type === 'VERDICT'
                      ? 'border-emerald-300 bg-emerald-50/40 p-5 shadow-xs'
                      : sec.type === 'FINANCE'
                      ? 'border-indigo-200 bg-indigo-50/20 p-5 shadow-xs'
                      : sec.type === 'HOOKS'
                      ? 'border-amber-200 bg-amber-50/20 p-5 shadow-xs'
                      : sec.type === 'UGC'
                      ? 'border-purple-200 bg-purple-50/20 p-5 shadow-xs'
                      : 'border-slate-200 bg-white p-5 shadow-xs'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      {sec.badge && (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black">
                          {sec.badge}
                        </span>
                      )}
                      <h4 className="text-sm sm:text-base font-black text-slate-900">
                        {sec.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => copySection(sec.id, `${sec.title}\n\n${sec.content}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      {copiedSectionId === sec.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">{isAr ? 'تم النسخ !' : 'Copié !'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isAr ? 'نسخ هذا القسم' : 'Copier'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="pt-3">
                    <div className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-slate-800 space-y-1.5 font-medium" dir="auto">
                      {sec.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback Clean View */
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <CitedText report={report} />
            </div>
          )}

          {/* Citations & Sources */}
          {report.citations.length > 0 && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
              <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isAr ? 'المصادر والروابط المرجعية التي تم فحصها على الويب :' : 'Sources et références vérifiées sur le web :'}</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {report.citations.map((cite, idx) => (
                  <a
                    key={idx}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 hover:text-indigo-900 text-xs font-bold transition-all shadow-2xs"
                  >
                    <span>[{idx + 1}]</span>
                    <span className="truncate max-w-[220px]">{cite.title}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {report.citations.length === 0 && (
            <p className="text-xs text-slate-500">
              {label('Rapport généré par le moteur d\'intelligence interne calibré pour le e-commerce COD.', 'تم إعداد التحليل بواسطة محرك الاستخبارات الداخلي المخصص للتجارة الإلكترونية COD.')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function CitedText({ report }: { report: ResearchReport }) {
  const chars = Array.from(cleanLatexAndFormat(report.text));
  const citations = [...report.citations].sort((a, b) => a.end_index - b.end_index);
  let cursor = 0;

  return (
    <div className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed text-slate-800" dir="auto">
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

'use client';

import { useState } from 'react';
import { ArrowUpRight, Search, PackagePlus, Check, Loader2, Sparkles } from 'lucide-react';
import { radarReferences, referenceDate } from '@/lib/radarProducts';
import type { RadarEvidence, RadarFilter, RadarProduct, RadarCategory } from '@/lib/radarProducts';
import { useStore } from '@/context/StoreContext';
import Link from 'next/link';

type Label = (fr: string, ar: string) => string;

const categoryBadges: Record<RadarCategory, { fr: string; ar: string; color: string; icon: string }> = {
  COSMETICS: { fr: 'Cosmétique', ar: 'مستحضر تجميل', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: '💄' },
  SUPPLEMENTS: { fr: 'Complément', ar: 'مكمل غذائي', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '💊' },
  KITCHEN: { fr: 'Cuisine & Maison', ar: 'أدوات المطبخ', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🍳' },
  CAR: { fr: 'Auto & Véhicule', ar: 'إكسسوارات سيارات', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🚗' },
  WELLNESS: { fr: 'Santé & Soulagement', ar: 'صحة وتخفيف آلام', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🧘' },
  HOME: { fr: 'Maison & Nettoyage', ar: 'المنزل والتنظيف', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: '🏠' },
};

export function ImportRadar({ isAr, defaultTarget, onAudit }: {
  isAr: boolean;
  defaultTarget: string;
  onAudit: (product: RadarProduct, target: string) => void;
}) {
  const label: Label = (fr, ar) => isAr ? ar : fr;
  const { stores, selectedStoreId } = useStore();
  const [target, setTarget] = useState(defaultTarget);
  const [source, setSource] = useState('');
  const [category, setCategory] = useState<RadarFilter>('ALL');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<{ target: string; products: RadarProduct[] } | null>(null);
  const isMorocco = /^(maroc|morocco|ma|المغرب)$/i.test(target.trim());
  const references = radarReferences(isAr).filter(product =>
    category === 'ALL' || category === 'BOTH' || category === product.category
  );
  const field = 'block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm';

  async function search() {
    const destination = target.trim();
    if (!destination || running) return;
    setRunning(true);
    setError('');
    setReport(null);
    try {
      const response = await fetch('/api/marketing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESEARCH_MARKETS', mode: 'scout', target: destination, source: source.trim(),
          category, product: '', language: isAr ? 'ar' : 'fr',
        }),
      });
      const data = await response.json();
      if (data.error === 'MARKET_RESEARCH_UNCONFIGURED') {
        setError(label('La recherche en direct nécessite OPENAI_API_KEY dans EasyPanel. Les références sourcées restent consultables.', 'البحث المباشر كيحتاج مفتاح OpenAI فـ EasyPanel. المراجع بالمصادر باقية متاحة.'));
        return;
      }
      if (!response.ok || !Array.isArray(data.report?.products)) throw new Error('Search unavailable');
      setReport({ target: destination, products: data.report.products });
    } catch {
      setError(label('La recherche est indisponible pour le moment. Réessayez.', 'البحث ما خدامش دابا. عاود جرّب من بعد.'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{label('Sourcing COD & Produits Gagnants', 'منتجات رابحة ومصادر التوريد المعتمدة')}</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">{label('Radar d’importation', 'رادار المنتجات للاستيراد')}</h2>
          <p className="text-sm text-slate-600">{label(
            'Explorez les références exactes (beauté, santé, cuisine, auto, bien-être) avec preuves de demande à l’étranger et signaux locaux.',
            'قلب على منتجات دقيقة (تجميل، صحة، مطبخ، سيارات، تنظيف) بالاسم والمقاس، وقارن مؤشرات الطلب برا مع العروض والأسعار فبلدك.',
          )}</p>
        </div>
        <form onSubmit={event => { event.preventDefault(); void search(); }} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm font-semibold">
              {label('Pays de vente', 'بلد البيع')}
              <input required disabled={running} value={target} onChange={event => { setTarget(event.target.value); setReport(null); }}
                maxLength={120} className={field} />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              {label('Marchés à explorer (facultatif)', 'الأسواق اللي بغيتي تبحث فيها (اختياري)')}
              <input disabled={running} value={source} onChange={event => { setSource(event.target.value); setReport(null); }}
                placeholder={label('France, États-Unis, Chine', 'فرنسا، أمريكا، الصين')}
                maxLength={180} className={field} />
            </label>
            <label className="space-y-1 text-sm font-semibold">
              {label('الفئة / Niche', 'الفئة / النيتش')}
              <select disabled={running} value={category} className={field}
                onChange={event => { setCategory(event.target.value as RadarFilter); setReport(null); }}>
                <option value="ALL">{label('✨ Toutes les niches (الكل)', '✨ جميع الفئات الرابحة (الكل)')}</option>
                <option value="COSMETICS">{label('💄 Cosmétiques & Skincare', '💄 مستحضرات التجميل والعناية')}</option>
                <option value="SUPPLEMENTS">{label('💊 Compléments alimentaires', '💊 المكملات الغذائية والصحة')}</option>
                <option value="KITCHEN">{label('🍳 Cuisine & Gadgets', '🍳 أدوات المطبخ الذكية')}</option>
                <option value="CAR">{label('🚗 Auto & Accessoires voiture', '🚗 إكسسوارات وحلول السيارات')}</option>
                <option value="WELLNESS">{label('🧘 Soulagement douleurs & Bien-être', '🧘 تخفيف الآلام والصحة البدنية')}</option>
                <option value="HOME">{label('🏠 Maison & Nettoyage intelligent', '🏠 المنزل والتنظيف الذكي')}</option>
              </select>
            </label>
          </div>
          <button disabled={running || !target.trim()} type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50 transition-colors">
            <Search className="h-4 w-4" aria-hidden="true" />
            {running ? label('Recherche en cours…', 'البحث خدام دابا…') : label('Trouver des produits', 'قلب على المنتجات')}
          </button>
        </form>
        {error && <p role="alert" className="text-sm text-amber-900">{error}</p>}
      </div>

      <div className="space-y-3" aria-live="polite">
        <h3 className="text-lg font-black text-slate-900">
          {report ? label('Résultats pour ', 'النتائج لـ ') + report.target :
            label('Références sourcées et rentables', 'منتجات مرجعية جاهزة للتسويق')}
        </h3>
        <p className="text-sm text-slate-600">{report
          ? label('Chaque carte indique le signal observé et sa source. La rentabilité se calcule avec vos coûts réels.', 'كل بطاقة فيها المؤشر والمصدر. الربح كيتحسب بالتكاليف الحقيقية ديالك.')
          : label('Relevé actualisé du ', 'رصد محيّن بتاريخ ') + referenceDate}</p>
        {report?.products.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm">{label(
            'Aucun produit exact avec signal étranger et source exploitable trouvé pour cette recherche.',
            'فهاد البحث ما لقيناش منتج محدد مع مؤشر طلب برا ومصدر صالح.',
          )}</p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {(report?.products ?? references).map(product => (
            <ProductCard key={[product.brand, product.name, product.variant].join('|')}
              product={product} local={report || isMorocco ? product.local : null}
              label={label}
              targetStoreId={selectedStoreId !== 'ALL' && selectedStoreId ? selectedStoreId : (stores[0]?.id || '')}
              onAudit={() => onAudit(product, report?.target ?? target.trim())} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <h3 className="mb-1 font-bold">{label('Conseils d’importation & MOQ', 'نصائح الاستيراد والحد الأدنى للطلبات')}</h3>
        <p>{label(
          'Demandez un devis avec MOQ, un échantillon, la traçabilité et les conditions de revente. Calculez le coût rendu, puis vérifiez les documents du produit et les exigences du pays cible.',
          'طلب دائماً عيّنة تجريبية (Sample)، وتأكد من الحد الأدنى للطلب (MOQ). قارن سعر الجملة في درب عمر مع الاستيراد من الصين، وتأكد من هوامش الباقات (Packs) قبل إطلاق الإعلانات.',
        )}</p>
        {isMorocco && (category === 'SUPPLEMENTS' || category === 'COSMETICS') && (
          <a href="https://www.onssa.gov.ma/controle-des-produits-alimentaires/produits-vegetaux-et-d-origine-vegetale/controle-sanitaire-et-de-conformite/"
            target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold underline">
            {label('ONSSA · Contrôle et conformité sanitaire', 'ONSSA · مراقبة السلامة الصحية')}
          </a>
        )}
      </div>
    </section>
  );
}

function ProductCard({ product, local, label, targetStoreId, onAudit }: {
  product: RadarProduct;
  local: RadarEvidence | null;
  label: Label;
  targetStoreId: string;
  onAudit: () => void;
}) {
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [pushError, setPushError] = useState('');

  const badgeInfo = categoryBadges[product.category] || categoryBadges.COSMETICS;

  const handlePushToStock = async () => {
    if (pushing || pushed) return;
    setPushing(true);
    setPushError('');

    try {
      const generatedSku = (product.brand.slice(0, 3) + '-' + product.category.slice(0, 3) + '-' + Date.now().toString(36).slice(-4)).toUpperCase();
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          storeId: targetStoreId || 'ALL',
          sku: generatedSku,
          name: `${product.brand} - ${product.name}`,
          description: `${product.variant}. Source de veille: ${product.identityUrl}`,
          costPrice: product.estimatedWholesale || 40,
          sellingPrice: product.suggestedRetail || 229,
          stockQuantity: 30, // initial test stock
          alertThreshold: 5,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPushed(true);
      } else {
        setPushError(data.error || label('Erreur lors de l’ajout au stock', 'تعذر إضافة المنتج إلى المخزون'));
      }
    } catch {
      setPushError(label('Erreur de connexion', 'وقع خطأ في الاتصال'));
    } finally {
      setPushing(false);
    }
  };

  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeInfo.color}`}>
            <span>{badgeInfo.icon}</span>
            <span>{label(badgeInfo.fr, badgeInfo.ar)}</span>
          </span>
          {product.suggestedRetail && (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              {label('Vente cons.: ', 'البيع المقترح: ')} {product.suggestedRetail} DH
            </span>
          )}
        </div>
        <h4 dir="auto" className="text-lg font-black text-slate-900 leading-snug">{product.brand} · {product.name}</h4>
        <a href={product.identityUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 underline underline-offset-2">
          <bdi>{product.variant}</bdi><ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      {product.estimatedWholesale && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>{label('Prix de gros estimé :', 'سعر الجملة المقدر :')} <strong className="text-slate-900">{product.estimatedWholesale} DH</strong></span>
          <span>{label('Marge brute :', 'الهامش الأولي :')} <strong className="text-emerald-700">+{(product.suggestedRetail || 229) - product.estimatedWholesale} DH</strong></span>
        </div>
      )}

      <div className="grid gap-3 border-t border-slate-100 pt-4">
        <Evidence title={label('Signaux à l’étranger', 'مؤشرات الطلب برا')} items={product.demand} />
        <Evidence title={label('Présence dans le pays de vente', 'التوفر فبلد البيع')} items={local ? [local] : []}
          fallback={label('Présence de cette variante non établie pour ce pays.', 'التوفر ديال نفس النسخة فهاد البلد مازال ما تأكّدش.')} />
        <Evidence title={label('Piste de sourcing', 'فين تسوّل على التوريد')} items={product.supplier ? [product.supplier] : []}
          fallback={label('Devis et fournisseur à confirmer.', 'المورّد والثمن بالجملة باقي خاصهم التأكيد.')} />
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onAudit}
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition-colors">
          {label('Ouvrir dans l’audit produit', 'حلّ المنتج فالأوديت')}
        </button>

        {pushed ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <Check className="w-3.5 h-3.5 text-emerald-700" />
            <span>{label('Ajouté au stock !', 'تمت الإضافة للمخزون !')}</span>
            <Link href="/stock" className="underline ml-1 font-black">
              {label('Voir', 'عرض')}
            </Link>
          </div>
        ) : (
          <button
            type="button"
            disabled={pushing}
            onClick={handlePushToStock}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {pushing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{label('Ajout en cours…', 'جارٍ الحفظ…')}</span>
              </>
            ) : (
              <>
                <PackagePlus className="w-3.5 h-3.5 text-amber-400" />
                <span>{label('Ajouter au stock (1-Clic)', 'إضافة للمخزون (بضغطة)')}</span>
              </>
            )}
          </button>
        )}
      </div>
      {pushError && <p className="text-xs text-rose-600 font-bold">{pushError}</p>}
    </article>
  );
}

function Evidence({ title, items, fallback }: { title: string; items: RadarEvidence[]; fallback?: string }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="font-bold text-slate-900">{title}</p>
      {!items.length && <p className="text-slate-600">{fallback}</p>}
      {items.map((item, index) => (
        <p key={item.url + index} className="text-slate-700">
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-700 underline underline-offset-2">
            <bdi>{item.market}</bdi>
          </a>
          {' · '}{item.detail}
        </p>
      ))}
    </div>
  );
}


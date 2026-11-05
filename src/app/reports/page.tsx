'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AccessDenied from '@/components/AccessDenied';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  MapPin,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Boxes,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export default function ReportsPage() {
  const { currentCountry, selectedStoreId, stores } = useStore();
  const { currentUser, isAdmin, isManager, canViewPage } = useAuth();
  const { t, isRtl } = useLanguage();
  const currency = currentCountry.currency;

  const [period, setPeriod] = useState<string>('30DAYS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PNL' | 'PRODUCTS' | 'CITIES' | 'COURIERS'>('PNL');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('country', currentCountry.code);
      params.append('period', period);
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (period === 'CUSTOM' && startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      }

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching reports:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || isManager || canViewPage('/reports')) {
      fetchReports();
    }
  }, [currentCountry.code, selectedStoreId, period]);

  // Auth Guard: Admin & Manager Only
  if (!isAdmin && !isManager && !canViewPage('/reports')) {
    return <AccessDenied moduleName="les Rapports et Analyses Avancées (P&L)" />;
  }

  const pnl = data?.pnlStatement || null;
  const products = data?.productReports || [];
  const cities = data?.cityReports || [];
  const couriers = data?.courierReports || [];

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!data) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM for Excel

    if (activeTab === 'PNL' && pnl) {
      csvContent += 'Bilan Financier & Rentabilite COD (P&L)\n';
      csvContent += `Pays,${currentCountry.name} (${currency})\n`;
      csvContent += `Periode,${period}\n\n`;
      csvContent += 'Indicateur,Montant (' + currency + '),Remarque\n';
      csvContent += `Chiffre d'Affaires Encaisse (Delivered),${pnl.deliveredRevenue},Commandes Livrees\n`;
      csvContent += `Cout d'Achat Sel3a (COGS),${pnl.cogsDelivered},Cout fournisseur des livrees\n`;
      csvContent += `Frais de Livraison Colis Livres,${pnl.shippingDelivered},Frais transporteurs\n`;
      csvContent += `Frais de Retour Colis Refuses,${pnl.shippingReturns},Penalites retours\n`;
      csvContent += `Commissions Confirmateurs,${pnl.confirmerCommissions},Primes de confirmation\n`;
      csvContent += `Frais Emballage Packaging,${pnl.packagingFees},Cartons et flyers\n`;
      csvContent += `Budget Publicitaire (Ads),${pnl.totalAdSpend},Facebook / TikTok / Snap / Google\n`;
      csvContent += `Salaires & Charges Generales,${pnl.salariesSpend + pnl.generalExpenses},Charges fixes\n`;
      csvContent += `TOTAL DEPENSES REELLES,${pnl.totalExpenses},Toutes charges incluses\n`;
      csvContent += `BENEFICE NET REEL (Net Profit),${pnl.netProfit},Arbah Safiya li dkhlat l-jib\n`;
      csvContent += `Marge Nette (%),${pnl.netMargin}%,Rentabilite finale\n`;
    } else if (activeTab === 'PRODUCTS') {
      csvContent += 'Rapport Performance & Rentabilite par Produit\n';
      csvContent += 'SKU,Nom Produit,Total Commandes,Taux Livraison (%),Taux Retour (%),CA Encaisse,COGS Sel3a,Marge Brute,Verdict\n';
      products.forEach((p: any) => {
        csvContent += `"${p.sku}","${p.name}",${p.totalUnits},${p.deliveryRate}%,${p.returnRate}%,${p.deliveredRevenue},${p.cogs},${p.grossProfit},${p.verdict}\n`;
      });
    } else if (activeTab === 'CITIES') {
      csvContent += 'Rapport Performance Geographique par Ville\n';
      csvContent += 'Ville,Total Commandes,Livres,Retours,En Cours,Taux Livraison (%),Taux Retour (%),Recommandation Ads\n';
      cities.forEach((c: any) => {
        csvContent += `"${c.city}",${c.total},${c.delivered},${c.returned},${c.inTransit},${c.deliveryRate}%,${c.returnRate}%,${c.tier}\n`;
      });
    } else if (activeTab === 'COURIERS') {
      csvContent += 'Rapport Performance Transporteurs & Delais\n';
      csvContent += 'Societe Livraison,Expedies,Livres,Retours,En Cours,Taux Livraison (%),Delai Moyen (Jours)\n';
      couriers.forEach((cr: any) => {
        csvContent += `"${cr.name}",${cr.shipped},${cr.delivered},${cr.returned},${cr.inTransit},${cr.deliveryRate}%,${cr.avgDays} jours\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rapport_COD_${activeTab}_${currentCountry.code}_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMoney = (amount: number) => {
    return `${Math.round(amount || 0).toLocaleString()} ${currency}`;
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{isRtl ? 'التقارير والأرباح الصافية (P&L)' : 'Rapports Financiers & Bilan P&L'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Vue Réelle 360°
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {isRtl
                  ? 'حساب الأرباح الصافية الحقيقية بعد خصم السلعة، الإعلانات، الشحن، والرواتب، مع تحليل المدن والمنتجات.'
                  : 'Bilan de rentabilité nette réelle, analyse par produit Winner/Risk, taux de livraison par ville et performance des transporteurs.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تحميل Excel / CSV' : 'Export Excel / CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isRtl ? 'طباعة / PDF' : 'Imprimer / PDF'}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'TODAY', label: isRtl ? 'اليوم' : 'Aujourd\'hui' },
            { id: 'YESTERDAY', label: isRtl ? 'أمس' : 'Hier' },
            { id: '7DAYS', label: isRtl ? '7 أيام' : '7 Jours' },
            { id: '30DAYS', label: isRtl ? '30 يوم' : '30 Jours' },
            { id: 'THIS_MONTH', label: isRtl ? 'هذا الشهر' : 'Ce Mois-ci' },
            { id: 'LAST_MONTH', label: isRtl ? 'الشهر الماضي' : 'Mois Dernier' },
            { id: 'ALL', label: isRtl ? 'الكل' : 'Tout l\'historique' },
            { id: 'CUSTOM', label: isRtl ? 'تاريخ مخصص' : 'Personnalisé' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                period === item.id
                  ? 'bg-white text-indigo-600 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs if CUSTOM selected */}
        {period === 'CUSTOM' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
            <span className="text-xs text-slate-400">à</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
            />
            <button
              onClick={fetchReports}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              OK
            </button>
          </div>
        )}

        {/* Country & Store Indicator */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-white flex items-center gap-1.5">
            <span>{currentCountry.flag}</span>
            <span>{currentCountry.name}</span>
            <span className="text-indigo-300">({currency})</span>
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6 print:hidden">
        {[
          { id: 'PNL', label: isRtl ? '💰 جدول الأرباح والخسائر (P&L)' : '💰 Bilan P&L & Rentabilité Nette' },
          { id: 'PRODUCTS', label: isRtl ? '📦 المنتجات الرابحة والخاسرة' : '📦 Rentabilité par Produit' },
          { id: 'CITIES', label: isRtl ? '🗺️ أداء المدن والمناطق' : '🗺️ Performance par Ville' },
          { id: 'COURIERS', label: isRtl ? '🚚 شركات الشحن ومواعيد التوصيل' : '🚚 Transporteurs & Délais' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-bold transition border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: P&L Statement */}
      {activeTab === 'PNL' && pnl && (
        <div className="space-y-6">
          {/* Top Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Delivered Cash */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isRtl ? 'المدخول المحصّل فعلياً' : 'Chiffre d\'Affaires Encaissé'}
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {formatMoney(pnl.deliveredRevenue)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>{pnl.counts.delivered} {isRtl ? 'طلبية مستلمة' : 'commandes livrées'}</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-700">{pnl.counts.deliveryRate}% {isRtl ? 'نسبة التسليم' : 'livraison'}</span>
              </div>
            </div>

            {/* Card 2: Total Operating & Product Costs */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isRtl ? 'مجموع التكاليف الحقيقية' : 'Total Charges & Coûts'}
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-amber-700 tracking-tight">
                  {formatMoney(pnl.totalExpenses)}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                <span>Sel3a + Ads + Livraison + Salaires</span>
              </div>
            </div>

            {/* Card 3: Net Profit (Glowing Highlight) */}
            <div className={`p-5 rounded-2xl border shadow-md relative overflow-hidden ${
              pnl.netProfit >= 0
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-emerald-500/10'
                : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-500 shadow-rose-500/10'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                  {isRtl ? 'الربح الصافي الحقيقي' : 'Bénéfice Net Réel (El-Arbah)'}
                </span>
                <Sparkles className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black tracking-tight text-white">
                  {formatMoney(pnl.netProfit)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-100">
                <span>{isRtl ? 'هامش الربح الصافي:' : 'Marge Nette:'}</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-black">
                  {pnl.netMargin}%
                </span>
              </div>
            </div>

            {/* Card 4: Marketing ROAS */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isRtl ? 'عائد الإعلانات (ROAS Réel)' : 'ROAS Réel Encaissé'}
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 tracking-tight">
                  {pnl.roas}x
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 font-medium">
                <span>Budget Ads: {formatMoney(pnl.totalAdSpend)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Waterfall P&L Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span>{isRtl ? 'تفصيل الميزانية والأرباح (P&L Breakdown)' : 'Décomposition Analytique du Résultat (P&L)'}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isRtl
                    ? 'الحساب الدقيق لكل سنتيم: من المدخول إلى الربح النهائي بعد خصم جميع المصاريف.'
                    : 'Suivi centime par centime de la création de valeur jusqu\'au bénéfice net final en caisse.'}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Delivered Revenue (+) */}
              <div className="p-4 flex items-center justify-between bg-emerald-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    +
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      {isRtl ? 'المداخيل الصافية المحصلة (Chiffre d\'Affaires Livré)' : 'Chiffre d\'Affaires Encaissé (Colis Livrés)'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {pnl.counts.delivered} commandes livrées à terme
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-emerald-700">
                    +{formatMoney(pnl.deliveredRevenue)}
                  </span>
                </div>
              </div>

              {/* Row 2: COGS (-) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'تكلفة شراء السلعة (COGS Fournisseurs)' : 'Coût d\'Achat des Produits Livrés (COGS Sel3a)'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Prix d'achat unitaire fournisseur × quantités livrées
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 text-sm">
                    -{formatMoney(pnl.cogsDelivered)}
                  </span>
                </div>
              </div>

              {/* Row 3: Shipping Fees Delivered (-) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'مصاريف توصيل الطلبيات المستلمة' : 'Frais de Livraison (Colis Livrés)'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Tarif transporteur par colis livré
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 text-sm">
                    -{formatMoney(pnl.shippingDelivered)}
                  </span>
                </div>
              </div>

              {/* Row 4: Shipping Return Penalties (-) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'تكاليف إرجاع الطلبيات المرفوضة (Frais de Retour)' : 'Pénalités & Frais de Retour (Colis Refusés/Retournés)'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {pnl.counts.returned} colis retournés facturés par les livreurs
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 text-sm">
                    -{formatMoney(pnl.shippingReturns)}
                  </span>
                </div>
              </div>

              {/* Row 5: Call Center Commissions (-) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'عمولات المؤكدين ومركز الاتصال' : 'Commissions Confirmateurs & Call Center'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Commissions fixes et primes UpSell sur commandes livrées
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 text-sm">
                    -{formatMoney(pnl.confirmerCommissions)}
                  </span>
                </div>
              </div>

              {/* Row 6: Packaging (-) */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">
                      {isRtl ? 'مصاريف التغليف والكرتون (Packaging)' : 'Frais de Packaging & Emballage'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      Cartons, flyers, ruban adhésif
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800 text-sm">
                    -{formatMoney(pnl.packagingFees)}
                  </span>
                </div>
              </div>

              {/* Row 7: Ad Spend (-) */}
              <div className="p-4 flex items-center justify-between bg-indigo-50/30">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    -
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {isRtl ? 'ميزانية الإعلانات الممولة (Ad Spend)' : 'Budget Publicitaire Total (Facebook, TikTok, Snap, Google)'}
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      FB: {formatMoney(pnl.adSpendBreakdown.facebook)} • TikTok: {formatMoney(pnl.adSpendBreakdown.tiktok)} • Snap: {formatMoney(pnl.adSpendBreakdown.snapchat)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-indigo-900 text-sm">
                    -{formatMoney(pnl.totalAdSpend)}
                  </span>
                </div>
              </div>

              {/* Row 8: General Expenses & Salaries (-) */}
              {(pnl.salariesSpend > 0 || pnl.generalExpenses > 0) && (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      -
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">
                        {isRtl ? 'المصاريف العامة والرواتب' : 'Salaires & Charges d\'Exploitation Fixes'}
                      </span>
                      <p className="text-slate-500 text-[11px]">
                        Loyer, outils SaaS, abonnements
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-sm">
                      -{formatMoney(pnl.salariesSpend + pnl.generalExpenses)}
                    </span>
                  </div>
                </div>
              )}

              {/* Final Summary Row: NET PROFIT (=) */}
              <div className={`p-5 flex items-center justify-between ${
                pnl.netProfit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                    =
                  </div>
                  <div>
                    <span className="font-black text-base uppercase tracking-tight">
                      {isRtl ? 'صافي الربح الحقيقي في الجيب (BÉNÉFICE NET RÉEL)' : 'BÉNÉFICE NET RÉEL EN POCHE (NET PROFIT)'}
                    </span>
                    <p className="text-emerald-100 text-xs">
                      Marge Nette Finale : {pnl.netMargin}% • Marge Brute : {pnl.grossMargin}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black tracking-tight">
                    {formatMoney(pnl.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Product Performance Breakdown */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>{isRtl ? 'تحليل أداء وربحية المنتجات (Winners vs Losers)' : 'Performance & Rentabilité par Produit'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'أي منتج يحقق أعلى نسبة تسليم وأعلى هامش ربح، وأي منتج يسبب خسارة في الشحن بسبب المرتجعات.'
                  : 'Identifiez les produits rentables (Winners à scaler) et ceux qui détruisent votre marge (Taux de retour élevé).'}
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
              {products.length} {isRtl ? 'منتج مسجل' : 'produits'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Produit & SKU</th>
                  <th className="py-3 px-4">Commandes</th>
                  <th className="py-3 px-4 text-center">Taux Livraison</th>
                  <th className="py-3 px-4 text-center">Taux Retour</th>
                  <th className="py-3 px-4 text-right">CA Encaissé</th>
                  <th className="py-3 px-4 text-right">Coût Sel3a</th>
                  <th className="py-3 px-4 text-right">Marge Brute</th>
                  <th className="py-3 px-4 text-center">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucune donnée de produit trouvée sur cette période.
                    </td>
                  </tr>
                ) : (
                  products.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">{p.totalUnits} pcs</span>
                        <div className="text-[10px] text-slate-400">{p.deliveredUnits} livrées</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                          p.deliveryRate >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.deliveryRate >= 60
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.deliveryRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-xs ${
                          p.returnRate >= 35
                            ? 'bg-rose-100 text-rose-700 font-black'
                            : 'text-slate-500'
                        }`}>
                          {p.returnRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatMoney(p.deliveredRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatMoney(p.cogs)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-black text-emerald-600">
                          {formatMoney(p.grossProfit)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          {p.grossMargin}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.verdict === 'WINNER' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🚀 Winner à Scaler
                          </span>
                        ) : p.verdict === 'RISK_RETURNS' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                            ⚠️ Risque Retours
                          </span>
                        ) : p.verdict === 'STABLE' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                            ⚖️ Stable
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] text-slate-400">
                            Volume faible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Geographic & Cities Performance */}
      {activeTab === 'CITIES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>{isRtl ? 'تحليل أداء المدن والمناطق الجغرافية' : 'Performance par Ville & Zone Géographique'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'تعرف على المدن ذات نسبة التسليم المرتفعة لزيادة الإعلانات فيها، والمدن ذات المرتجعات لعزلها من الـ Ads.'
                  : 'Optimisez vos campagnes Facebook/TikTok : scaliez les villes à fort taux de livraison et excluez les zones à retours chroniques.'}
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
              {cities.length} {isRtl ? 'مدينة' : 'villes'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Ville</th>
                  <th className="py-3 px-4">Total Commandes</th>
                  <th className="py-3 px-4">Livrées</th>
                  <th className="py-3 px-4">Retours / Refus</th>
                  <th className="py-3 px-4">En Cours</th>
                  <th className="py-3 px-4 text-center">Taux Livraison</th>
                  <th className="py-3 px-4 text-right">CA Encaissé</th>
                  <th className="py-3 px-4 text-center">Recommandation Ads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {cities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucune commande avec information de ville sur cette période.
                    </td>
                  </tr>
                ) : (
                  cities.map((c: any) => (
                    <tr key={c.city} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.city}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{c.total}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{c.delivered}</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">{c.returned}</td>
                      <td className="py-3 px-4 text-amber-600 font-medium">{c.inTransit}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                          c.deliveryRate >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.deliveryRate >= 60
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.deliveryRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatMoney(c.deliveredRevenue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.tier === 'SCALE_ADS' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            🎯 Scaler les Ads
                          </span>
                        ) : c.tier === 'EXCLUDE_OR_CONFIRM' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                            🛑 À Exclure des Ads
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                            ⚖️ Zone Neutre
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Courier & Logistics Breakdown */}
      {activeTab === 'COURIERS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" />
                <span>{isRtl ? 'أداء شركات التوصيل ومواعيد التسليم' : 'Performance des Transporteurs & Délais de Livraison'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isRtl
                  ? 'مقارنة نسبة التسليم والسرعة (بالمتوسط بالأيام) بين شركات الشحن المختلفة.'
                  : 'Comparez l\'efficacité réelle de vos partenaires logistiques et les délais moyens de remise aux clients.'}
              </p>
            </div>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
              {couriers.length} {isRtl ? 'شركة شحن' : 'transporteurs'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Transporteur</th>
                  <th className="py-3 px-4">Total Expédiés</th>
                  <th className="py-3 px-4">Livrées</th>
                  <th className="py-3 px-4">Retours</th>
                  <th className="py-3 px-4">En Cours</th>
                  <th className="py-3 px-4 text-center">Taux Livraison</th>
                  <th className="py-3 px-4 text-center">Délai Moyen de Livraison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {couriers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Aucune expédition trouvée pour cette période.
                    </td>
                  </tr>
                ) : (
                  couriers.map((cr: any) => (
                    <tr key={cr.name} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-black text-slate-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        <span>{cr.name}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{cr.shipped}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{cr.delivered}</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">{cr.returned}</td>
                      <td className="py-3 px-4 text-amber-600 font-medium">{cr.inTransit}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs ${
                          cr.deliveryRate >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : cr.deliveryRate >= 60
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {cr.deliveryRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg text-xs">
                          ⏱️ ~{cr.avgDays} {isRtl ? 'أيام' : 'jours'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

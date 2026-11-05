'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/context/StoreContext';
import {
  Wallet,
  TrendingUp,
  PackageCheck,
  RotateCcw,
  PhoneCall,
  Megaphone,
  Boxes,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  Building2,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Target,
  BarChart3,
  Filter,
  Calendar,
  X,
  Sparkles,
  Receipt,
  Gift,
  PhoneForwarded,
  MapPin,
  ShieldAlert,
  Network,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePresence } from '@/context/PresenceContext';
import AccessDenied from '@/components/AccessDenied';

export default function DashboardPage() {
  const { selectedStoreId, currentStore, currentCountry } = useStore();
  const currency = currentStore?.currency || currentCountry?.currency || 'MAD';
  const { canViewPage, isManager } = useAuth();
  const { t, language } = useLanguage();
  const isAr = language === 'ar';
  const { agents: presenceAgents } = usePresence();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [period, setPeriod] = useState<string>('ALL'); // ALL, TODAY, YESTERDAY, 7DAYS, 30DAYS, CUSTOM
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [agentId, setAgentId] = useState<string>('ALL');
  const [productId, setProductId] = useState<string>('ALL');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      let url = `/api/analytics?storeId=${selectedStoreId}&period=${period}`;
      if (agentId !== 'ALL') url += `&agentId=${agentId}`;
      if (productId !== 'ALL') url += `&productId=${productId}`;
      if (period === 'CUSTOM' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedStoreId, currentCountry.code, period, startDate, endDate, agentId, productId]);

  const resetFilters = () => {
    setPeriod('ALL');
    setStartDate('');
    setEndDate('');
    setAgentId('ALL');
    setProductId('ALL');
  };

  const hasActiveFilters =
    period !== 'ALL' || agentId !== 'ALL' || productId !== 'ALL' || (startDate && endDate);

  const metrics = data?.metrics || {
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    returnedOrders: 0,
    cancelledOrders: 0,
    confirmationRate: '0.0',
    deliveryRate: '0.0',
    returnRate: '0.0',
    cancellationRate: '0.0',
    grossDeliveredRevenue: 0,
    deliveredCogs: 0,
    deliveredPackaging: 0,
    deliveredShippingFees: 0,
    returnedShippingFees: 0,
    totalShippingFees: 0,
    confirmerCommissions: 0,
    adSpend: 0,
    otherExpenses: 0,
    totalCostOfBusiness: 0,
    netProfit: 0,
    realRoas: '0',
    profitMargin: '0',
  };

  const agents = data?.agentsRanking || [];
  const mostProfitable = data?.mostProfitableProducts || [];
  const leastProfitable = data?.leastProfitableProducts || [];
  const couriers = data?.couriersPerformance || [];
  const cityPerformance = data?.cityPerformance || [];
  const availableProducts = data?.availableProducts || [];
  const availableAgents = data?.availableAgents || [];

  const callCenterStats = data?.callCenterStats || {
    totalLeads: metrics.totalOrders || 0,
    pendingLeads: metrics.pendingOrders || 0,
    confirmedLeads: metrics.confirmedOrders || 0,
    cancelledLeads: metrics.cancelledOrders || 0,
    noAnswerLeads: metrics.noAnswerOrders || 0,
    duplicateLeads: 0,
    confirmationRate: metrics.confirmationRate || '0.0',
    cancellationRate: metrics.cancellationRate || '0.0',
    upsellCount: 0,
    upsellDeliveredCount: 0,
    upsellRate: '0.0',
    upsellTotalRevenue: 0,
    subStatusCounts: {},
  };

  const logisticsStats = data?.logisticsStats || {
    shippedTotal: metrics.shippedOrders || 0,
    inTransitTotal: metrics.inTransitOrders || 0,
    deliveredTotal: metrics.deliveredOrders || 0,
    returnedTotal: metrics.returnedOrders || 0,
    deliveryRate: metrics.deliveryRate || '0.0',
    returnRate: metrics.returnRate || '0.0',
    inTransitRate: '0.0',
    grossDeliveredRevenue: metrics.grossDeliveredRevenue || 0,
    deliveredShippingFees: metrics.deliveredShippingFees || 0,
    returnedShippingFees: metrics.returnedShippingFees || 0,
    totalShippingFees: metrics.totalShippingFees || 0,
  };

  const adAttribution = data?.adAttribution || [];

  const costDrivers = [
    {
      id: 'ads',
      name: t('dash.adSpend'),
      amount: metrics.adSpend || 0,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      advice: t('advice.ads'),
    },
    {
      id: 'shipping',
      name: t('dash.shippingCost'),
      amount: metrics.totalShippingFees || 0,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      advice: t('advice.shipping'),
    },
    {
      id: 'cogs',
      name: t('dash.productCost'),
      amount: metrics.deliveredCogs || 0,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      advice: t('advice.cogs'),
    },
    {
      id: 'packaging',
      name: t('dash.packaging'),
      amount: metrics.deliveredPackaging || 0,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
      advice: t('advice.packaging'),
    },
    {
      id: 'commissions',
      name: t('dash.commissionsCost'),
      amount: metrics.confirmerCommissions || 0,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      advice: t('advice.commissions'),
    },
    {
      id: 'phone_other',
      name: t('advice.phone_other'),
      amount: metrics.otherExpenses || 0,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      advice: t('advice.phone_other'),
    },
  ].sort((a, b) => b.amount - a.amount);

  const topCostDriver = costDrivers[0];
  const topCostPct =
    metrics.totalCostOfBusiness > 0
      ? ((topCostDriver.amount / metrics.totalCostOfBusiness) * 100).toFixed(0)
      : '0';

  if (!canViewPage('/')) {
    return <AccessDenied moduleName="le Dashboard Financier & Calcul de Rentabilité" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Luxury Banner & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-amber-500/5 via-indigo-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {t('dash.title')}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-yellow-500/10 text-amber-900 border border-amber-300 shadow-2xs flex items-center gap-1.5">
              <span>{currentCountry?.flag || '🇲🇦'}</span>
              <span>{currentCountry?.name || 'Maroc'} Prestige</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-amber-300 border border-slate-800 shadow-2xs">
              ⚡ LIVE ERP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-2xl">
            {t('dash.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-200 shadow-2xs cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('btn.resetFilters')}</span>
            </button>
          )}

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-600'}`} />
            <span>{t('btn.refresh')}</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR MODULE */}
      <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider font-heading">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <span>{t('filter.advanced')}</span>
          </div>
          {hasActiveFilters && (
            <span className="text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs animate-pulse">
              {t('filter.active')}
            </span>
          )}
        </div>

        {/* Period Pills & Filter Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {/* 1. Period Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('period.title')}</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="ALL">🗓️ {t('period.all')}</option>
              <option value="TODAY">⚡ {t('period.today')}</option>
              <option value="YESTERDAY">⏳ {t('period.yesterday')}</option>
              <option value="7DAYS">📅 {t('period.7days')}</option>
              <option value="30DAYS">📆 {t('period.30days')}</option>
              <option value="CUSTOM">🎯 {t('period.custom')}</option>
            </select>
          </div>

          {/* 2. Confirmer / Agent Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('filter.byAgent')}</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition-all cursor-pointer"
            >
              <option value="ALL">👥 {t('filter.allAgents')}</option>
              {availableAgents.map((ag: any) => (
                <option key={ag.id} value={ag.id}>
                  👤 {ag.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Product Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">{t('filter.byProduct')}</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs transition-all cursor-pointer truncate"
            >
              <option value="ALL">📦 {t('filter.allProducts')}</option>
              {availableProducts.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Custom Date Range Pickers (if CUSTOM selected) or Quick info */}
          {period === 'CUSTOM' ? (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Du</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2 font-semibold shadow-2xs"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Au</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl p-2 font-semibold shadow-2xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-end">
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-full flex items-center justify-between shadow-2xs">
                <span className="font-medium">Commandes auditées :</span>
                <span className="font-black text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200">{metrics.totalOrders} lead(s)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hero Financial Banner - "Le Calcul du Profit Net Ultra-Luxe" */}
      <div className="bg-gradient-to-br from-[#070A12] via-[#0B0F19] to-[#0D1527] text-white rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden border border-amber-500/20">
        {/* Subtle Luxury Ambient Radial Lights */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider mb-2 font-heading">
              <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-xs">
                <Wallet className="w-4 h-4 text-amber-300" />
              </div>
              <span>{t('dash.netProfit')}</span>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                AUDIT FINANCIER EN TEMPS RÉEL
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3.5">
              <span
                className={`text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-heading ${
                  metrics.netProfit >= 0 ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.35)]' : 'text-rose-400'
                }`}
              >
                {metrics.netProfit >= 0 ? '+' : ''}
                {metrics.netProfit.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {currency}
              </span>

              <span
                className={`text-xs px-3.5 py-1.5 rounded-full font-black border tracking-wide shadow-md ${
                  metrics.netProfit >= 0
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-950/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                Marge Nette : {metrics.profitMargin}%
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-2.5 max-w-2xl font-medium leading-relaxed">
              CA Livré (<strong className="text-emerald-400 font-extrabold">+{metrics.grossDeliveredRevenue} {currency}</strong>) - Achats (<strong className="text-rose-300 font-bold">-{metrics.deliveredCogs} {currency}</strong>) - Emballage (<strong className="text-rose-300 font-bold">-{metrics.deliveredPackaging} {currency}</strong>) - Livraison (<strong className="text-rose-300 font-bold">-{metrics.totalShippingFees} {currency}</strong>) - Commissions (<strong className="text-rose-300 font-bold">-{metrics.confirmerCommissions} {currency}</strong>) - Ads (<strong className="text-rose-300 font-bold">-{metrics.adSpend} {currency}</strong>)
            </p>
          </div>

          <div className="flex items-center gap-5 bg-slate-900/90 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-xl shrink-0">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">ROAS Réel (Sur Livré)</div>
              <div className="text-3xl font-black text-amber-400 mt-0.5 font-heading">{metrics.realRoas}x</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Ads Spend : <strong className="text-white">{metrics.adSpend} {currency}</strong>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-700/80"></div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t('dash.deliveredRate')}</div>
              <div className="text-3xl font-black text-indigo-400 mt-0.5 font-heading">{metrics.deliveryRate}%</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                <strong className="text-white">{metrics.deliveredOrders}</strong> livrées / {metrics.shippedOrders} expédiées
              </div>
            </div>
          </div>
        </div>

        {/* Financial Flow Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold">1. {t('dash.revenue')}</span>
            <span className="text-base font-black text-emerald-400">+{metrics.grossDeliveredRevenue.toFixed(0)} {currency}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-sm hover:border-rose-500/40 transition-colors">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold">2. {t('dash.productCost')}</span>
            <span className="text-base font-black text-rose-400">-{metrics.deliveredCogs.toFixed(0)} {currency}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-sm hover:border-rose-500/40 transition-colors">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold">3. {t('dash.shippingCost')}</span>
            <span className="text-base font-black text-rose-400">-{metrics.totalShippingFees.toFixed(0)} {currency}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-sm hover:border-rose-500/40 transition-colors">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold">4. {t('dash.adSpend')}</span>
            <span className="text-base font-black text-rose-400">-{metrics.adSpend.toFixed(0)} {currency}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-sm hover:border-rose-500/40 transition-colors">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold">5. Emballage</span>
            <span className="text-base font-black text-rose-400">-{metrics.deliveredPackaging.toFixed(0)} {currency}</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-sm hover:border-rose-500/40 transition-colors">
            <span className="text-slate-400 block mb-1 text-[11px] font-semibold">6. {t('dash.commissionsCost')}</span>
            <span className="text-base font-black text-rose-400">-{metrics.confirmerCommissions.toFixed(0)} {currency}</span>
          </div>
        </div>
      </div>

      {/* Smart Diagnostic Widget: Impact des Charges sur le Profit */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                {t('dash.diagnosticTitle')}
              </span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${topCostDriver.badgeColor}`}>
                {t('dash.topCostItem')} {topCostDriver.name} ({topCostPct}%)
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed max-w-3xl">
              💡 <span className="text-slate-800 font-bold">{t('dash.adviceHeader')} </span>
              {topCostDriver.advice}
            </p>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <Link
            href="/expenses"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('dash.manageExpenses')}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎧 SECTION 1: STATISTIQUES & ANALYSE DU CENTRE D'APPEL (CALL CENTER) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Statistiques & Performance du Centre d'Appel</span>
                <span className="text-[11px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  Confirmation & UpSell
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Suivi en temps réel des leads, taux de conversion des appels, répartition des relances et ventes additionnelles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/call-center"
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <span>Accéder au Call Center</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Call Center Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Taux Confirmation */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taux de Confirmation</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2">{callCenterStats.confirmationRate}%</div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Confirmées : <strong className="text-emerald-700">{callCenterStats.confirmedLeads}</strong></span>
              <span className="text-slate-400 font-medium">Total : <strong>{callCenterStats.totalLeads}</strong> leads</span>
            </div>
          </div>

          {/* UpSell Performance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performance UpSell</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-indigo-600 mt-2">{callCenterStats.upsellCount} <span className="text-sm font-bold text-slate-500">UpSells</span></div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-indigo-700 font-bold">Taux: {callCenterStats.upsellRate}%</span>
              <span className="text-emerald-600 font-extrabold">+{callCenterStats.upsellTotalRevenue} {currency} CA</span>
            </div>
          </div>

          {/* Injoignables & Boîte Vocale */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relances & Pas de Réponse</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <PhoneForwarded className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-amber-600 mt-2">{callCenterStats.noAnswerLeads} <span className="text-sm font-bold text-slate-500">leads</span></div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-amber-700 font-semibold">{callCenterStats.pendingLeads} En Attente</span>
              <span className="text-rose-600 font-bold">{callCenterStats.cancelledLeads} Annulées</span>
            </div>
          </div>

          {/* Doublons Détectés */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doublons Évités</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-600 mt-2">{callCenterStats.duplicateLeads} <span className="text-sm font-bold text-slate-500">suspects</span></div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-rose-700 font-semibold">Détection automatique</span>
              <span className="text-emerald-700 font-bold">Économie de stock</span>
            </div>
          </div>
        </div>

        {/* Détail des Statuts d'Appels & Tentatives (Appel 1, Appel 2, Boite vocale, etc.) */}
        {Object.keys(callCenterStats.subStatusCounts || {}).length > 0 && (
          <div className="bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                <span>Répartition des Tentatives d'Appel & Motifs Call Center</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-700">
                {(Object.values(callCenterStats.subStatusCounts) as number[]).reduce((a: number, b: number) => a + Number(b), 0)} appels tracés
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(callCenterStats.subStatusCounts).map(([statusName, count]: [string, any]) => (
                <div
                  key={statusName}
                  className="bg-white px-3 py-1.5 rounded-xl border border-indigo-200 text-xs flex items-center gap-2 shadow-2xs"
                >
                  <span className="font-semibold text-slate-700">{statusName} :</span>
                  <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tableau Classement des Confirmateurs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Classement & Performance Individuelle des Agents
                </h3>
                {currentCountry && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200">
                    {currentCountry.flag} {currentCountry.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Taux de confirmation, UpSells concrétisés, suivi de présence et commissions méritées.
              </p>
            </div>

            <Link
              href="/confirmers"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-200 transition-colors"
            >
              <span>Gestion & Facturation Agents</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">{t('lead.rank')} & {t('lead.agent')}</th>
                  <th className="py-3.5 px-4 text-center">{t('dash.kpi.leads')}</th>
                  <th className="py-3.5 px-4 text-center">{t('dash.kpi.confirmed')}</th>
                  <th className="py-3.5 px-4 text-center">{t('lead.confirmRate')}</th>
                  <th className="py-3.5 px-4 text-center">{t('lead.upsellSales')}</th>
                  <th className="py-3.5 px-4 text-center">{t('dash.kpi.delivered')}</th>
                  <th className="py-3.5 px-4 text-center">{t('lead.deliveryRate')}</th>
                  <th className="py-3.5 px-4 text-center">{t('dash.revenue')}</th>
                  <th className="py-3.5 px-4 text-center">{t('admin.colCommissions')}</th>
                  <th className="py-3.5 px-4 text-center">{t('common.evaluation', 'Évaluation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {agents.map((agent: any, idx: number) => {
                  const confRate = parseFloat(agent.confirmationRate);
                  const delivRate = parseFloat(agent.deliveryRate);

                  return (
                    <tr key={agent.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                              idx === 0
                                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 border border-yellow-200 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/20'
                                : idx === 1
                                ? 'bg-gradient-to-tr from-slate-200 to-slate-100 text-slate-800 border border-slate-300'
                                : idx === 2
                                ? 'bg-gradient-to-tr from-amber-100 to-orange-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {idx === 0 ? '👑' : idx + 1}
                          </span>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{agent.name}</span>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-900 border border-amber-400/50 shadow-2xs">
                                  👑 STAR
                                </span>
                              )}
                              {isManager && (() => {
                                const p = presenceAgents.find((x) => x.id === agent.id);
                                if (p?.status === 'ONLINE') {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>{t('presence.online')}</span>
                                    </span>
                                  );
                                }
                                if (p?.status === 'BUSY') {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                      <span>{t('presence.busy')}</span>
                                    </span>
                                  );
                                }
                                if (p?.status === 'PAUSED') {
                                  return (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                                      <span>{t('presence.paused')}</span>
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="text-[11px] text-slate-400">{agent.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">{agent.totalAssigned}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-emerald-600">{agent.confirmed}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                            confRate >= 50
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : confRate >= 35
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {agent.confirmationRate}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                          {agent.upsellCount || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-blue-600">{agent.delivered}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{agent.deliveryRate}%</td>
                      <td className="py-3.5 px-4 text-center font-black text-slate-900">{agent.revenueGenerated} {currency}</td>
                      <td className="py-3.5 px-4 text-center font-black text-emerald-600">{agent.commissionsEarned} {currency}</td>

                      <td className="py-3.5 px-4 text-center">
                        {agent.performanceLevel === 'TOP' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Flame className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Top</span>
                          </span>
                        ) : agent.performanceLevel === 'BON' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Bon</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Faible</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚚 SECTION 2: STATISTIQUES & ANALYSE DE LA LIVRAISON (LOGISTIQUE) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Statistiques & Performance de la Livraison & Expéditions</span>
                <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Logistique & Transporteurs
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Taux de livraison réel, retours encaissés, performance par transporteur et rentabilité géographique par ville.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors flex items-center gap-1.5"
            >
              <span>Gestion des Expéditions</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Logistics Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Taux Livraison */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taux de Livraison (Delivery Rate)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-2">{logisticsStats.deliveryRate}%</div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-bold">{logisticsStats.deliveredTotal} Livrées</span>
              <span className="text-slate-500">sur {logisticsStats.shippedTotal} expédiées</span>
            </div>
          </div>

          {/* Taux Retour */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taux de Retour (Return Rate)</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-600 mt-2">{logisticsStats.returnRate}%</div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-rose-700 font-bold">{logisticsStats.returnedTotal} Colis Retournés</span>
              <span className="text-rose-600 font-semibold">Perte: -{logisticsStats.returnedShippingFees} {currency}</span>
            </div>
          </div>

          {/* Colis en Transit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">En cours de distribution</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-600 mt-2">{logisticsStats.inTransitTotal} <span className="text-sm font-bold text-slate-500">colis</span></div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-blue-700 font-semibold">{logisticsStats.inTransitRate}% du volume</span>
              <span className="text-slate-400">Chez les livreurs</span>
            </div>
          </div>

          {/* Impact Financier Transport */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Frais de Port Totaux</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">-{logisticsStats.totalShippingFees} <span className="text-sm font-bold text-slate-500">{currency}</span></div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-medium">Livrées: -{logisticsStats.deliveredShippingFees} {currency}</span>
              <span className="text-rose-600 font-semibold">Retours: -{logisticsStats.returnedShippingFees} {currency}</span>
            </div>
          </div>
        </div>

        {/* 2 Colonnes : Transporteurs vs Villes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance des Sociétés de Transport */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Performance par Société de Livraison
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">Comparatif direct</span>
            </div>

            <div className="space-y-3">
              {couriers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Aucun colis assigné à un transporteur pour l'instant.
                </div>
              ) : (
                couriers.map((c: any) => {
                  const delivRate = parseFloat(c.deliveryRate || '0');
                  const retRate = parseFloat(c.returnRate || '0');
                  return (
                    <div
                      key={c.courier}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            🚚
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-900 text-sm">{c.courier}</span>
                            <span className="text-[11px] text-slate-400 block">
                              {c.total} colis confiés • {c.inTransit} en cours
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-black text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {c.deliveryRate}% Livré
                            </span>
                            <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200">
                              {c.returnRate}% Retour
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            CA : {c.deliveredRevenue || 0} {currency}
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-2 transition-all duration-300"
                          style={{ width: `${Math.min(100, delivRate)}%` }}
                          title={`Livré: ${c.deliveryRate}%`}
                        ></div>
                        <div
                          className="bg-rose-500 h-2 transition-all duration-300"
                          style={{ width: `${Math.min(100 - delivRate, retRate)}%` }}
                          title={`Retour: ${c.returnRate}%`}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Top Villes & Taux de Livraison */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                  <span>
                    {isAr
                      ? `أفضل المدن (${currentCountry?.name || 'الدولة'}) ونسبة التوصيل`
                      : `Top Villes (${currentCountry?.name || 'Pays'}) & Taux de Livraison`}
                  </span>
                  {currentCountry?.flag && (
                    <span className="text-sm">
                      {currentCountry.flag}
                    </span>
                  )}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-semibold">
                {isAr ? 'المردودية الجغرافية' : 'Rentabilité géographique'}
              </span>
            </div>

            <div className="overflow-x-auto">
              {cityPerformance.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Aucune donnée géographique pour le moment.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ville</th>
                      <th className="py-2.5 px-3 text-center">Commandes</th>
                      <th className="py-2.5 px-3 text-center">Livrées</th>
                      <th className="py-2.5 px-3 text-center">Retours</th>
                      <th className="py-2.5 px-3 text-right">Taux Livraison</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {cityPerformance.slice(0, 8).map((item: any) => {
                      const rate = parseFloat(item.deliveryRate || '0');
                      return (
                        <tr key={item.city} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="text-slate-400">📍</span>
                            <span>{item.city}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-600">{item.total}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{item.delivered}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-rose-500">{item.returned}</td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-black text-xs ${
                                rate >= 75
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : rate >= 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {item.deliveryRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📦 SECTION 3: RENTABILITÉ DES PRODUITS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Produits les Plus Rentables (Bénéfice Réel Net)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">Classement par profit généré</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mostProfitable.map((prod: any, idx: number) => (
            <div
              key={prod.name}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                  {idx + 1}
                </span>
                <div>
                  <span className="font-bold text-slate-900 block truncate max-w-[150px]">{prod.name}</span>
                  <span className="text-[11px] text-slate-400">
                    {prod.totalDelivered} livrées • Stock: {prod.currentStock}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-emerald-600 text-sm block">
                  +{prod.profit.toFixed(0)} {currency}
                </span>
                <span className="text-[10px] text-slate-400">
                  CA: {prod.deliveredRevenue} {currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎯 SECTION 4: ATTRIBUTION MARKETING & ROI RÉEL (LIVRAISONS VS ADS) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>Attribution Marketing & Rentabilité des Canaux (Delivered ROI)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Lead2Door Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Découvrez quelles plateformes génèrent du VRAI chiffre d'affaires encaissé (commandes livrées), et pas seulement des clics.
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Basé sur {metrics.totalOrders || 0} commandes analysées
          </span>
        </div>

        {adAttribution.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Aucune donnée de campagne ou source publicitaire pour cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Canal d'Acquisition</th>
                  <th className="py-3 px-4 text-center">Leads Reçus</th>
                  <th className="py-3 px-4 text-center">Confirmées (%)</th>
                  <th className="py-3 px-4 text-center">Livrées (%)</th>
                  <th className="py-3 px-4">CA Livré Encaissé</th>
                  <th className="py-3 px-4 text-center">Rentabilité Réelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {adAttribution.map((attr: any) => {
                  const isFb = attr.source.toLowerCase().includes('facebook');
                  const isTt = attr.source.toLowerCase().includes('tiktok');
                  const isSnap = attr.source.toLowerCase().includes('snap');
                  const isGoogle = attr.source.toLowerCase().includes('google');

                  return (
                    <tr key={attr.source} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {isFb ? '🔵' : isTt ? '🟣' : isSnap ? '🟡' : isGoogle ? '🔴' : '⚪'}
                          </span>
                          <span className="font-extrabold text-slate-900">{attr.source}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {attr.leads} leads
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-200">
                          {attr.confirmed} ({attr.confirmationRate}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-extrabold text-[11px] border border-blue-200">
                          {attr.delivered} ({attr.deliveryRate}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-600 text-sm">
                        {attr.deliveredRevenue.toLocaleString('fr-FR')} {currency}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {Number(attr.deliveryRate) >= 70 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            🔥 Très Rentable
                          </span>
                        ) : Number(attr.deliveryRate) >= 50 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[10px]">
                            ✅ Rentable
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold text-[10px]">
                            ⚠️ À optimiser
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

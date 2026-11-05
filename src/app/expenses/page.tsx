'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Receipt,
  Plus,
  Megaphone,
  Box,
  Users,
  DollarSign,
  Calendar,
  Tag,
  Trash2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Filter,
  ArrowUpRight,
  Truck,
  Building2,
  X,
  Sparkles,
  PieChart,
  PhoneCall,
  ShoppingBag,
  Smartphone,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  storeId: string;
  store?: { id: string; name: string; currency: string };
  date: string;
  category: string;
  amount: number;
  description: string | null;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string; border: string }
> = {
  PRODUCT_PURCHASE: {
    label: "Prix d'Achat Produit (Stock)",
    icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  SHIPPING: {
    label: 'Frais de Livraison & Transporteurs',
    icon: <Truck className="w-3.5 h-3.5 text-cyan-600" />,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  PHONE_SUBSCRIPTION: {
    label: 'Abonnement Téléphonique & SIM',
    icon: <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  FACEBOOK_ADS: {
    label: 'Facebook / Meta Ads',
    icon: <Megaphone className="w-3.5 h-3.5 text-blue-600" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  TIKTOK_ADS: {
    label: 'TikTok Ads',
    icon: <Megaphone className="w-3.5 h-3.5 text-rose-600" />,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  SNAPCHAT_ADS: {
    label: 'Snapchat Ads',
    icon: <Megaphone className="w-3.5 h-3.5 text-amber-600" />,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  GOOGLE_ADS: {
    label: 'Google Ads',
    icon: <Megaphone className="w-3.5 h-3.5 text-emerald-600" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  PACKAGING: {
    label: 'Packaging & Cartons',
    icon: <Box className="w-3.5 h-3.5 text-amber-600" />,
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  SALARIES: {
    label: 'Salaires & Équipe',
    icon: <Users className="w-3.5 h-3.5 text-purple-600" />,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  RENT_OFFICE: {
    label: 'Loyer & Charges Fixes',
    icon: <Building2 className="w-3.5 h-3.5 text-slate-600" />,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
  },
  OTHER: {
    label: 'Autres Charges',
    icon: <Tag className="w-3.5 h-3.5 text-slate-600" />,
    color: 'text-slate-700',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

export default function ExpensesPage() {
  const { selectedStoreId, stores, currentStore } = useStore();
  const currency = currentStore?.currency || 'MAD';
  const { canViewPage } = useAuth();
  const { t } = useLanguage();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [stats, setStats] = useState<any>({
    totalAmount: 0,
    adsTotal: 0,
    productPurchaseTotal: 0,
    shippingTotal: 0,
    phoneTotal: 0,
    packagingTotal: 0,
    salariesTotal: 0,
    otherTotal: 0,
  });
  const [analyticsMetrics, setAnalyticsMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State
  const [storeId, setStoreId] = useState('');
  const [category, setCategory] = useState('PHONE_SUBSCRIPTION');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchExpensesData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (filterCategory && filterCategory !== 'ALL') {
        params.append('category', filterCategory);
      }
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const [resExp, resAnalytics] = await Promise.all([
        fetch(`/api/expenses?${params.toString()}`),
        fetch(`/api/analytics?storeId=${selectedStoreId}`),
      ]);

      const jsonExp = await resExp.json();
      if (jsonExp.success) {
        setExpenses(jsonExp.expenses || []);
        setStats(jsonExp.stats || {});
      }

      const jsonAnalytics = await resAnalytics.json();
      if (jsonAnalytics.success) {
        setAnalyticsMetrics(jsonAnalytics.metrics || null);
      }
    } catch (e) {
      console.error('Error fetching expenses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesData();
    if (stores.length > 0 && !storeId) {
      const defaultStoreId = (selectedStoreId !== 'ALL' && !selectedStoreId.includes(',') && stores.some((s) => s.id === selectedStoreId))
        ? selectedStoreId
        : (stores[0]?.id || '');
      setStoreId(defaultStoreId);
    }
  }, [selectedStoreId, filterCategory, startDate, endDate, stores]);

  const handleOpenAddModal = (presetCategory?: string) => {
    if (presetCategory) {
      setCategory(presetCategory);
    }
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!storeId) {
      setErrorMsg('Veuillez sélectionner une boutique.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Veuillez entrer un montant valide supérieur à 0.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          category,
          amount: numAmount,
          description: description.trim() || undefined,
          date,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || 'Erreur lors de l ajout de la dépense.');
      } else {
        setShowAddModal(false);
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        fetchExpensesData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;

    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchExpensesData();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  if (!canViewPage('/expenses')) {
    return <AccessDenied moduleName="la Gestion des Dépenses & Charges Publicitaires" />;
  }

  // Cost Diagnostics & Insights calculations
  const totalLoggedExpenses = stats.totalAmount || 0;
  const adsSpend = stats.adsTotal || 0;
  const productPurchaseTotal = stats.productPurchaseTotal || 0;
  const shippingTotal = stats.shippingTotal || 0;
  const phoneTotal = stats.phoneTotal || 0;
  const packagingTotal = stats.packagingTotal || 0;
  const salariesTotal = stats.salariesTotal || 0;
  const otherTotal = stats.otherTotal || 0;

  const deliveredRev = analyticsMetrics?.grossDeliveredRevenue || 0;
  const netProfit = analyticsMetrics?.netProfit || 0;
  const returnRate = parseFloat(analyticsMetrics?.returnRate || '0');

  // Ad spend ratio on delivered revenue
  const adsRatioOnRev = deliveredRev > 0 ? (adsSpend / deliveredRev) * 100 : 0;

  // Biggest expense bucket
  const buckets = [
    { name: "Prix d'Achat Produit (Stock)", amount: productPurchaseTotal, pct: totalLoggedExpenses > 0 ? (productPurchaseTotal / totalLoggedExpenses) * 100 : 0 },
    { name: 'Publicité (Facebook & TikTok Ads)', amount: adsSpend, pct: totalLoggedExpenses > 0 ? (adsSpend / totalLoggedExpenses) * 100 : 0 },
    { name: 'Frais de Livraison & Transport', amount: shippingTotal, pct: totalLoggedExpenses > 0 ? (shippingTotal / totalLoggedExpenses) * 100 : 0 },
    { name: 'Abonnement Téléphonique & SIM', amount: phoneTotal, pct: totalLoggedExpenses > 0 ? (phoneTotal / totalLoggedExpenses) * 100 : 0 },
    { name: 'Salaires & Équipe', amount: salariesTotal, pct: totalLoggedExpenses > 0 ? (salariesTotal / totalLoggedExpenses) * 100 : 0 },
    { name: 'Packaging & Cartons', amount: packagingTotal, pct: totalLoggedExpenses > 0 ? (packagingTotal / totalLoggedExpenses) * 100 : 0 },
  ].sort((a, b) => b.amount - a.amount);

  const biggestBucket = buckets[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {t('exp.title')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              COD P&L
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {t('exp.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleOpenAddModal()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('exp.addExpense')}</span>
          </button>
        </div>
      </div>

      {/* Quick Category Action Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-400 mr-1">{t('exp.quickAdd')}</span>
        <button
          onClick={() => handleOpenAddModal('PHONE_SUBSCRIPTION')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.phone')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('PRODUCT_PURCHASE')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.cogs')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('SHIPPING')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.shipping')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('FACEBOOK_ADS')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.fbAds')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('TIKTOK_ADS')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.tiktokAds')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('PACKAGING')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
        >
          <Box className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.packaging')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('SALARIES')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.salaries')}</span>
        </button>
        <button
          onClick={() => handleOpenAddModal('RENT_OFFICE')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>+ {t('exp.cat.rent')}</span>
        </button>
      </div>

      {/* 6 Responsive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('exp.card.total')}</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {totalLoggedExpenses.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} {currency}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">
            {expenses.length} {t('exp.card.opCount')}
          </div>
        </div>

        {/* Prix d'Achat Produit (Stock) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{t('exp.card.cogs')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-800 mt-2">
            {productPurchaseTotal.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} {currency}
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
            {totalLoggedExpenses > 0 ? ((productPurchaseTotal / totalLoggedExpenses) * 100).toFixed(0) : 0}% {t('exp.card.ofExpenses')}
          </div>
        </div>

        {/* Frais de Livraison */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-700 uppercase tracking-wider">{t('exp.card.shipping')}</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-cyan-800 mt-2">
            {shippingTotal.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} {currency}
          </div>
          <div className="text-[10px] text-cyan-600 mt-1 font-semibold">
            {t('exp.card.carrierInvoices')}
          </div>
        </div>

        {/* Abonnement Téléphonique */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">{t('exp.card.phone')}</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-800 mt-2">
            {phoneTotal.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} {currency}
          </div>
          <div className="text-[10px] text-indigo-600 mt-1 font-semibold">
            {t('exp.card.callPlans')}
          </div>
        </div>

        {/* Publicité (Ads) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{t('exp.card.ads')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-blue-700 mt-2">
            {adsSpend.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} {currency}
          </div>
          <div className="text-[10px] text-blue-500 mt-1 font-semibold">
            {totalLoggedExpenses > 0 ? ((adsSpend / totalLoggedExpenses) * 100).toFixed(0) : 0}% {t('exp.card.ofExpenses')}
          </div>
        </div>

        {/* Salaires & Packaging */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">{t('exp.card.team')}</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-800 mt-2">
            {(salariesTotal + packagingTotal).toLocaleString('fr-FR', { minimumFractionDigits: 1 })} {currency}
          </div>
          <div className="text-[10px] text-purple-600 mt-1 font-semibold">
            {t('exp.card.salariesPackaging')}
          </div>
        </div>
      </div>

      {/* Smart Diagnostic Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                {t('exp.diag.title')}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {t('exp.diag.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>{t('exp.diag.netMargin')} <strong className={netProfit >= 0 ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>{analyticsMetrics?.profitMargin || '0'}%</strong></span>
          </div>
        </div>

        {/* 4 COD Profit Leaks Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Prix d'Achat Produit (COGS) */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">{t('exp.diag.cogsTitle')}</span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Stock / COGS
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-2.5 leading-relaxed font-medium">
              {t('exp.diag.cogsDesc')}
            </p>
          </div>

          {/* Card 2: Frais de Livraison & Retours */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">{t('exp.diag.shipTitle')}</span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                returnRate > 18
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}>
                {t('exp.diag.returnRateLabel')} {returnRate}%
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-2.5 leading-relaxed font-medium">
              {returnRate > 18 ? t('exp.diag.shipAlert') : t('exp.diag.shipOk')}
            </p>
          </div>

          {/* Card 3: Abonnement Téléphonique */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">{t('exp.diag.phoneTitle')}</span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Call Center SIM
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-2.5 leading-relaxed font-medium">
              {t('exp.diag.phoneDesc')}
            </p>
          </div>

          {/* Card 4: Ad Spend Weight */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">{t('exp.diag.adsTitle')}</span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                adsRatioOnRev > 40
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {deliveredRev > 0 ? `${adsRatioOnRev.toFixed(0)}%` : 'N/A'}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-2.5 leading-relaxed font-medium">
              {adsRatioOnRev > 40 ? t('exp.diag.adsAlert') : t('exp.diag.adsOk')}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            <span>{t('exp.filter.by')}</span>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700 bg-white"
          >
            <option value="ALL">{t('exp.filter.allCategories')}</option>
            <option value="PRODUCT_PURCHASE">{t('exp.cat.cogs')}</option>
            <option value="SHIPPING">{t('exp.cat.shipping')}</option>
            <option value="PHONE_SUBSCRIPTION">{t('exp.cat.phone')}</option>
            <option value="FACEBOOK_ADS">{t('exp.cat.fbAds')}</option>
            <option value="TIKTOK_ADS">{t('exp.cat.tiktokAds')}</option>
            <option value="SNAPCHAT_ADS">Snapchat Ads</option>
            <option value="PACKAGING">{t('exp.cat.packaging')}</option>
            <option value="SALARIES">{t('exp.cat.salaries')}</option>
            <option value="RENT_OFFICE">{t('exp.cat.rent')}</option>
            <option value="OTHER">{t('exp.cat.other', 'Autres Charges')}</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700 text-xs"
            />
            <span className="text-slate-400">{t('exp.filter.to')}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-700 text-xs"
            />
          </div>

          {(filterCategory !== 'ALL' || startDate || endDate) && (
            <button
              onClick={() => {
                setFilterCategory('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              {t('exp.filter.reset')}
            </button>
          )}
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          {expenses.length} {t('exp.filter.displayed')}
        </div>
      </div>

      {/* Expenses List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">{t('exp.table.title')}</h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">{t('table.loading')}</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">{t('exp.table.emptyTitle')}</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {t('exp.table.emptyDesc')}
            </p>
            <button
              onClick={() => handleOpenAddModal()}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('exp.table.emptyAction')}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">{t('exp.table.colDate')}</th>
                  <th className="py-3.5 px-4">{t('exp.table.colStore')}</th>
                  <th className="py-3.5 px-4">{t('exp.table.colCategory')}</th>
                  <th className="py-3.5 px-4">{t('exp.table.colDesc')}</th>
                  <th className="py-3.5 px-4 text-right">{t('exp.table.colAmount')} ({currency})</th>
                  <th className="py-3.5 px-4 text-center">{t('exp.table.colAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((expense) => {
                  const conf = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 font-semibold whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-bold">
                        {expense.store?.name || t('nav.allModules')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${conf.bg} ${conf.color} ${conf.border}`}
                        >
                          {conf.icon}
                          <span>{conf.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {expense.description || <span className="text-slate-400 italic">{t('exp.table.noDesc')}</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                        {expense.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {expense.store?.currency || currency}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{t('exp.modal.title')}</h3>
                  <p className="text-[11px] text-slate-500">{t('exp.modal.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Store selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('exp.modal.selectStore')}</label>
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('exp.modal.selectCategory')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="PHONE_SUBSCRIPTION">{t('exp.cat.phone')}</option>
                  <option value="PRODUCT_PURCHASE">{t('exp.cat.cogs')}</option>
                  <option value="SHIPPING">{t('exp.cat.shipping')}</option>
                  <option value="FACEBOOK_ADS">{t('exp.cat.fbAds')}</option>
                  <option value="TIKTOK_ADS">{t('exp.cat.tiktokAds')}</option>
                  <option value="SNAPCHAT_ADS">Snapchat Ads</option>
                  <option value="GOOGLE_ADS">Google Ads</option>
                  <option value="PACKAGING">{t('exp.cat.packaging')}</option>
                  <option value="SALARIES">{t('exp.cat.salaries')}</option>
                  <option value="RENT_OFFICE">{t('exp.cat.rent')}</option>
                  <option value="OTHER">{t('exp.cat.other', 'Autres Charges')}</option>
                </select>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('exp.modal.amount')} ({currency})</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full text-sm font-extrabold border border-slate-200 rounded-xl p-2.5 pr-12 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">{currency}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('exp.modal.date')}</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Description / Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('exp.modal.desc')}
                </label>
                <input
                  type="text"
                  placeholder="Ex: Forfait Téléphonie, Achat 150 pcs Sac Cuir, Facture Transporteur..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {t('btn.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? t('header.creating') : t('exp.modal.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

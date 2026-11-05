'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import {
  Building2,
  Plus,
  Package,
  CreditCard,
  Phone,
  MessageCircle,
  MapPin,
  TrendingDown,
  TrendingUp,
  Boxes,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { Supplier, PurchaseOrder, SupplierPayment } from '@/lib/suppliers';
import AccessDenied from '@/components/AccessDenied';

export default function SuppliersPage() {
  const { currentCountry, selectedStoreId } = useStore();
  const { currentUser, isAdmin, canViewPage } = useAuth();
  const { t, isRtl } = useLanguage();
  const currency = currentCountry.currency;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalSuppliers: 0,
    totalPurchased: 0,
    totalPaid: 0,
    totalBalanceDue: 0,
    currency: 'MAD',
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'SUPPLIERS' | 'PURCHASES' | 'PAYMENTS'>('SUPPLIERS');
  const [search, setSearch] = useState('');

  // Modals state
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supplier Form
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierCity, setSupplierCity] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Purchase Form
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchaseProductId, setPurchaseProductId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('50');
  const [purchaseCost, setPurchaseCost] = useState('100');
  const [purchaseRef, setPurchaseRef] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Payment Form
  const [paySupplierId, setPaySupplierId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Virement CIH / Attijari');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const loadData = async () => {
    if (!isAdmin && !canViewPage('/suppliers')) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('country', currentCountry.code);
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      const res = await fetch(`/api/suppliers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers || []);
        setPurchaseOrders(data.purchaseOrders || []);
        setPayments(data.payments || []);
        setProducts(data.products || []);
        setMetrics(data.metrics || {});
        if (data.suppliers?.length > 0) {
          setPurchaseSupplierId(data.suppliers[0].id);
          setPaySupplierId(data.suppliers[0].id);
        }
        if (data.products?.length > 0) {
          setPurchaseProductId(data.products[0].id);
          setPurchaseCost(String(data.products[0].costPrice || 100));
        }
      }
    } catch (e) {
      console.error('Error loading suppliers data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCountry.code, selectedStoreId]);

  // Create / Edit Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_SUPPLIER',
          id: editingSupplierId,
          name: supplierName,
          contactPerson,
          phone: supplierPhone,
          city: supplierCity,
          address: supplierAddress,
          country: currentCountry.code,
          notes: supplierNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSupplierModal(false);
        resetSupplierForm();
        loadData();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Purchase / Stock Arrival
  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PURCHASE',
          supplierId: purchaseSupplierId,
          productId: purchaseProductId,
          quantity: Number(purchaseQty),
          unitCostPrice: Number(purchaseCost),
          reference: purchaseRef,
          notes: purchaseNotes,
          userName: currentUser?.name || 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Arrivage enregistré ! Le stock du produit a été automatiquement augmenté.');
        setShowPurchaseModal(false);
        loadData();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECORD_PAYMENT',
          supplierId: paySupplierId,
          amount: Number(payAmount),
          paymentMethod: payMethod,
          reference: payRef,
          notes: payNotes,
          userName: currentUser?.name || 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Règlement enregistré avec succès ! La dette du fournisseur a été réduite.');
        setShowPaymentModal(false);
        setPayAmount('');
        loadData();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSupplierForm = () => {
    setEditingSupplierId(null);
    setSupplierName('');
    setContactPerson('');
    setSupplierPhone('');
    setSupplierCity('');
    setSupplierAddress('');
    setSupplierNotes('');
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin && !canViewPage('/suppliers')) {
    return <AccessDenied moduleName="la Gestion des Fournisseurs et Achats" />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {isRtl ? 'إدارة الموردين والمشتريات' : 'Gestion des Fournisseurs & Achats'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
              {currentCountry.flag} {currentCountry.name} ({currency})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {isRtl
              ? 'تتبع فواتير المشتريات، تسجيل وصول السلع للمخزن، ومراقبة ديون ومستحقات الموردين بدقة.'
              : 'Gérez vos arrivages de stock, enregistrez les bons d\'achat et suivez les dettes fournisseurs en temps réel.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              resetSupplierForm();
              setShowSupplierModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? '+ مورد جديد' : '+ Nouveau Fournisseur'}</span>
          </button>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>{isRtl ? '📦 تسجيل وصول سلعة (Bon d\'Achat)' : '📦 Enregistrer un Arrivage Stock'}</span>
          </button>

          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>{isRtl ? '💵 دفع مستحقات مورد' : '💵 Règlement Fournisseur'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fournisseurs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{isRtl ? 'عدد الموردين' : 'Fournisseurs Actifs'}</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{metrics.totalSuppliers}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Partenaires enregistrés</div>
        </div>

        {/* Dettes Fournisseurs (Balance Due) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800">
            <span>{isRtl ? 'مجموع الديون للموردين (Dettes)' : 'Dettes Restantes Dues'}</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {metrics.totalBalanceDue.toLocaleString('fr-FR')} {currency}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Montant à régler aux fournisseurs</div>
        </div>

        {/* Total Achats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{isRtl ? 'إجمالي المشتريات' : 'Total Achats Cumulés'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.totalPurchased.toLocaleString('fr-FR')} {currency}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Marchandises commandées</div>
        </div>

        {/* Total Règlements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{isRtl ? 'مجموع المبالغ المؤداة' : 'Total Règlements Effectués'}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-teal-700">
            {metrics.totalPaid.toLocaleString('fr-FR')} {currency}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">Payé par virement / chèque</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'SUPPLIERS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 {isRtl ? 'دليل الموردين' : 'Annuaire Fournisseurs'} ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveTab('PURCHASES')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'PURCHASES' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 {isRtl ? 'سجل وصول السلع (Achats)' : 'Arrivages & Achats Stock'} ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'PAYMENTS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💵 {isRtl ? 'سجل الأداءات' : 'Historique Règlements'} ({payments.length})
          </button>
        </div>

        {activeTab === 'SUPPLIERS' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher fournisseur..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* TAB 1: SUPPLIERS DIRECTORY */}
      {activeTab === 'SUPPLIERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => {
            const hasDebt = sup.balanceDue > 0;

            return (
              <div
                key={sup.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{sup.name}</h3>
                    <div className="text-xs text-slate-500 font-semibold">{sup.contactPerson}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      hasDebt
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {hasDebt ? `Dette: ${sup.balanceDue.toLocaleString('fr-FR')} ${currency}` : 'Soldé à 100% ✅'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold text-slate-800">{sup.phone}</span>
                    <a
                      href={`https://wa.me/${sup.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1 border border-emerald-200 hover:bg-emerald-100"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {sup.city} - {sup.address}
                    </span>
                  </div>
                </div>

                {/* Balances Box */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Achats</span>
                    <span className="font-extrabold text-slate-900">
                      {sup.totalPurchased.toLocaleString('fr-FR')} {currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Total Réglé</span>
                    <span className="font-extrabold text-emerald-700">
                      {sup.totalPaid.toLocaleString('fr-FR')} {currency}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setPurchaseSupplierId(sup.id);
                      setShowPurchaseModal(true);
                    }}
                    className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer border border-emerald-200"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>Arrivage</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaySupplierId(sup.id);
                      setPayAmount(sup.balanceDue > 0 ? String(sup.balanceDue) : '');
                      setShowPaymentModal(true);
                    }}
                    className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs rounded-lg transition flex items-center justify-center gap-1 cursor-pointer border border-indigo-200"
                  >
                    <CreditCard className="w-3 h-3 text-indigo-600" />
                    <span>Régler</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PURCHASES / INBOUND HISTORY */}
      {activeTab === 'PURCHASES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <span>Historique des Arrivages de Marchandise & Bons d'Achat</span>
            </h3>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer hover:bg-emerald-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvel Arrivage</span>
            </button>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Aucun bon d'achat enregistré pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Réf. Bon</th>
                    <th className="py-3 px-4">Fournisseur</th>
                    <th className="py-3 px-4">Produit Reçu</th>
                    <th className="py-3 px-4 text-center">Quantité</th>
                    <th className="py-3 px-4">Prix Unitaire</th>
                    <th className="py-3 px-4">Montant Total</th>
                    <th className="py-3 px-4">Date Réception</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-black text-indigo-600">{po.reference}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{po.supplierName}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{po.productName}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">SKU: {po.sku}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs">
                          +{po.quantity} pcs
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {po.unitCostPrice} {currency}
                      </td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        {po.totalAmount.toLocaleString('fr-FR')} {currency}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(po.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS HISTORY */}
      {activeTab === 'PAYMENTS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Historique des Règlements et Paiements Fournisseurs</span>
            </h3>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer hover:bg-indigo-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouveau Règlement</span>
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Aucun paiement enregistré pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Réf. Virement</th>
                    <th className="py-3 px-4">Fournisseur</th>
                    <th className="py-3 px-4">Montant Réglé</th>
                    <th className="py-3 px-4">Mode de Paiement</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Date Paiement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{pay.reference}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{pay.supplierName}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        {pay.amount.toLocaleString('fr-FR')} {currency}
                      </td>
                      <td className="py-3 px-4 font-semibold text-indigo-600">{pay.paymentMethod}</td>
                      <td className="py-3 px-4 text-slate-500">{pay.notes || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(pay.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">
                {editingSupplierId ? 'Modifier Fournisseur' : 'Nouveau Fournisseur'}
              </h3>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom du Fournisseur / Société *</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ex: Atlas Import Grossiste"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom du Contact (Responsable)</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ex: Haj Abdelilah"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Téléphone / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="+2126XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ville</label>
                  <input
                    type="text"
                    value={supplierCity}
                    onChange={(e) => setSupplierCity(e.target.value)}
                    placeholder="Casablanca"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Adresse</label>
                  <input
                    type="text"
                    value={supplierAddress}
                    onChange={(e) => setSupplierAddress(e.target.value)}
                    placeholder="Derb Omar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer Fournisseur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PURCHASE / STOCK ARRIVAL */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">
                  Enregistrer un Arrivage Stock (Bon d'Achat)
                </h3>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              💡 L'enregistrement de cet arrivage augmentera automatiquement la quantité en stock du produit et mettra à jour la dette du fournisseur.
            </p>

            <form onSubmit={handleRecordPurchase} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fournisseur *</label>
                <select
                  required
                  value={purchaseSupplierId}
                  onChange={(e) => setPurchaseSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Produit à recevoir *</label>
                <select
                  required
                  value={purchaseProductId}
                  onChange={(e) => {
                    setPurchaseProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod?.costPrice) setPurchaseCost(String(prod.costPrice));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock actuel: {p.stockQuantity} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantité reçue (pcs) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-black text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix d'Achat Unitaire ({currency}) *</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between font-bold text-emerald-950">
                <span>Montant Total du Bon d'Achat :</span>
                <span className="text-base font-black">
                  {(Number(purchaseQty || 0) * Number(purchaseCost || 0)).toLocaleString('fr-FR')} {currency}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">N° Réf Bon de Livraison / Facture</label>
                <input
                  type="text"
                  value={purchaseRef}
                  onChange={(e) => setPurchaseRef(e.target.value)}
                  placeholder="Ex: BON-10948"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Traitement...' : 'Confirmer l\'Arrivage (+Stock)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-base text-slate-900">Enregistrer un Règlement Fournisseur</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Fournisseur à payer *</label>
                <select
                  required
                  value={paySupplierId}
                  onChange={(e) => {
                    setPaySupplierId(e.target.value);
                    const sup = suppliers.find((s) => s.id === e.target.value);
                    if (sup && sup.balanceDue > 0) setPayAmount(String(sup.balanceDue));
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Dette: {s.balanceDue} {currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant Payé ({currency}) *</label>
                <input
                  type="number"
                  required
                  step="0.1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mode de Règlement *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Virement CIH Bank">Virement CIH Bank</option>
                  <option value="Virement Attijariwafa Bank">Virement Attijariwafa Bank</option>
                  <option value="Espèces / Cash">Espèces / Cash</option>
                  <option value="Chèque bancaire">Chèque bancaire</option>
                  <option value="Wave / Orange Money">Wave / Orange Money (Sénégal)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Réf. Virement / Chèque</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="VIR-829103"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Traitement...' : 'Valider le Paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

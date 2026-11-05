'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Boxes,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  History,
  Search,
  CheckCircle2,
  Package,
  Lock,
  Truck,
  ShieldAlert,
  Archive,
  RefreshCw,
  XCircle,
} from 'lucide-react';

export default function StockPage() {
  const { selectedStoreId, stores, currentStore, currentCountry } = useStore();
  const { canViewPage, hasPermission, isAdmin, isCallAgent, isManager, currentUser } = useAuth();
  const { t } = useLanguage();
  const canManageStock = (isAdmin || isManager) && !isCallAgent;
  const [products, setProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalProducts: 0,
    totalWarehouseStock: 0,
    totalEnteredStock: 0,
    totalInTransitStock: 0,
    totalDamagedStock: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'AVAILABLE' | 'LOW' | 'OUT' | 'DAMAGED'>('ALL');

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // New Product Form
  const [newStoreId, setNewStoreId] = useState('');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('10');

  // Adjust Form
  const [adjustType, setAdjustType] = useState('PURCHASE');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustRef, setAdjustRef] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    try {
      let url = `/api/stock?storeId=${selectedStoreId}`;
      if (currentUser?.id) {
        url += `&agentId=${currentUser.id}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
        if (json.summary) {
          setSummary(json.summary);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
    if (stores.length > 0 && !newStoreId) {
      const defaultStoreId =
        selectedStoreId !== 'ALL' && !selectedStoreId.includes(',') && stores.some((s) => s.id === selectedStoreId)
          ? selectedStoreId
          : stores[0]?.id || '';
      setNewStoreId(defaultStoreId);
    }
  }, [selectedStoreId, stores, currentCountry?.code]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          storeId: newStoreId,
          sku,
          name,
          costPrice,
          sellingPrice,
          stockQuantity,
          alertThreshold,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProductModal(false);
        setSku('');
        setName('');
        setCostPrice('');
        setSellingPrice('');
        setStockQuantity('');
        fetchStock();
      } else {
        alert(data.error || 'Erreur lors de la création du produit');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const qtyNumber = parseInt(adjustQty);
      const isDeduction = ['SALE', 'DAMAGE'].includes(adjustType);
      const finalQty = isDeduction ? -Math.abs(qtyNumber) : Math.abs(qtyNumber);

      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST',
          productId: selectedProduct.id,
          type: adjustType,
          quantity: finalQty,
          reference: adjustRef || (adjustType === 'DAMAGE' ? 'QUARANTAINE-CASSE' : ''),
          notes: adjustNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAdjustModal(false);
        setSelectedProduct(null);
        setAdjustQty('');
        setAdjustRef('');
        setAdjustNotes('');
        fetchStock();
      } else {
        alert(data.error || 'Erreur lors de l ajustement');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAdjustModal = (product: any, defaultType: string = 'PURCHASE') => {
    setSelectedProduct(product);
    setAdjustType(defaultType);
    setAdjustQty('');
    setAdjustRef(defaultType === 'DAMAGE' ? 'CASSE-RETOUR' : '');
    setAdjustNotes(defaultType === 'DAMAGE' ? 'Article abîmé / défectueux mis en quarantaine' : '');
    setShowAdjustModal(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const warehouseQty = p.stockWarehouse ?? p.stockQuantity ?? 0;
      const isOut = warehouseQty === 0;
      const isLow = warehouseQty > 0 && warehouseQty <= (p.alertThreshold || 10);
      const isAvailable = warehouseQty > (p.alertThreshold || 10);
      const hasDamaged = (p.stockDamaged || 0) > 0;

      if (filterTab === 'AVAILABLE') return isAvailable;
      if (filterTab === 'LOW') return isLow;
      if (filterTab === 'OUT') return isOut;
      if (filterTab === 'DAMAGED') return hasDamaged;
      return true;
    });
  }, [products, searchQuery, filterTab]);

  if (!canViewPage('/stock')) {
    return <AccessDenied moduleName="la Gestion du Stock & Inventaire" />;
  }

  const hideCost = hasPermission('hideCostPrices');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('stock.title', 'Gestion du Stock & Inventaire')}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              COD Multi-États
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suivi 360° du stock : Entrées réelles, Stock physique disponible, En cours de livraison sur le terrain & Quarantaine articles endommagés.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchStock}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('stock.addProduct', 'Nouveau Produit')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 KPI Stock Luxury Vault Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* 1. Stock Total Entré */}
        <div className="bg-gradient-to-br from-blue-50/60 via-white to-white p-5 rounded-2xl border border-blue-200/90 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between min-h-[145px] relative group overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider font-heading truncate">Total Entré (Reçu)</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0 group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 font-heading tracking-tight mt-1">{summary.totalEnteredStock}</div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
            <span>📥 Initial + Arrivages</span>
          </div>
        </div>

        {/* 2. Stock en Entrepôt (Disponible) */}
        <div className="bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 rounded-2xl border border-emerald-300 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between min-h-[145px] relative group overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-emerald-800 uppercase tracking-wider font-heading truncate">En Entrepôt (Dispo)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0 group-hover:scale-105 transition-transform">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-heading tracking-tight drop-shadow-xs mt-1">{summary.totalWarehouseStock}</div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-emerald-100/80 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
            <span>🏢 Dispo vente & confirmation</span>
          </div>
        </div>

        {/* 3. Stock sur le Terrain (En Transit) */}
        <div className="bg-gradient-to-br from-sky-50/70 via-white to-white p-5 rounded-2xl border border-sky-300 shadow-xs hover:shadow-md hover:border-sky-500 transition-all flex flex-col justify-between min-h-[145px] relative group overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-sky-800 uppercase tracking-wider font-heading truncate">Sur le Terrain</span>
              <div className="w-8 h-8 rounded-xl bg-sky-100/80 text-sky-700 flex items-center justify-center border border-sky-200 shrink-0 group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-sky-600 font-heading tracking-tight mt-1">{summary.totalInTransitStock}</div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-sky-100/80 text-[11px] text-sky-700 font-bold flex items-center gap-1.5">
            <span>🛵 En livraison (Livreurs)</span>
          </div>
        </div>

        {/* 4. Stock Endommagé (Quarantaine) */}
        <div className="bg-gradient-to-br from-rose-50/70 via-white to-white p-5 rounded-2xl border border-rose-300 shadow-xs hover:shadow-md hover:border-rose-500 transition-all flex flex-col justify-between min-h-[145px] relative group overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-rose-800 uppercase tracking-wider font-heading truncate">Endommagé (Casse)</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-rose-600 font-heading tracking-tight mt-1">{summary.totalDamagedStock}</div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-rose-100/80 text-[11px] text-rose-700 font-bold flex items-center gap-1.5">
            <span>⚠️ Quarantaine isolée</span>
          </div>
        </div>

        {/* 5. Alertes Ruptures */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-white p-5 rounded-2xl border border-amber-300 shadow-xs hover:shadow-md hover:border-amber-500 transition-all flex flex-col justify-between min-h-[145px] relative group overflow-hidden">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider font-heading truncate">Alertes Rupture</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-600 font-heading tracking-tight mt-1">{summary.lowStockCount}</div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-amber-100/80 text-[11px] text-amber-700 font-bold flex items-center gap-1.5">
            <span>📦 Sur {summary.totalProducts} références</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setFilterTab('AVAILABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTab === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            En Stock ({products.filter((p) => (p.stockWarehouse ?? p.stockQuantity) > (p.alertThreshold || 10)).length})
          </button>
          <button
            onClick={() => setFilterTab('LOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTab === 'LOW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Stock Faible ({summary.lowStockCount})
          </button>
          <button
            onClick={() => setFilterTab('OUT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTab === 'OUT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Rupture ({products.filter((p) => (p.stockWarehouse ?? p.stockQuantity) === 0).length})
          </button>
          <button
            onClick={() => setFilterTab('DAMAGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterTab === 'DAMAGED'
                ? 'bg-rose-800 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Avec Casse ({products.filter((p) => (p.stockDamaged || 0) > 0).length})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">État Détaillé du Stock par Produit</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredProducts.length} référence{filteredProducts.length > 1 ? 's' : ''} affichée{filteredProducts.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Produit & SKU</th>
                <th className="py-3 px-3">Boutique</th>
                <th className="py-3 px-3">
                  {hideCost ? (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Lock className="w-3 h-3" />
                      <span>{t('stock.costPrice', 'Prix Achat')}</span>
                    </span>
                  ) : (
                    t('stock.costPrice', 'Prix Achat')
                  )}
                </th>
                <th className="py-3 px-3">{t('stock.sellingPrice', 'Prix Vente')}</th>
                <th className="py-3 px-3 text-center bg-blue-50/50 text-blue-900 font-bold border-x border-blue-100">
                  📥 Total Entré
                </th>
                <th className="py-3 px-3 text-center bg-emerald-50/50 text-emerald-900 font-bold border-r border-emerald-100">
                  🏢 En Entrepôt
                </th>
                <th className="py-3 px-3 text-center bg-sky-50/50 text-sky-900 font-bold border-r border-sky-100">
                  🛵 Sur le Terrain
                </th>
                <th className="py-3 px-3 text-center bg-rose-50/50 text-rose-900 font-bold border-r border-rose-100">
                  ⚠️ Endommagé
                </th>
                <th className="py-3 px-3 text-center">{t('table.status', 'Statut')}</th>
                {canManageStock && <th className="py-3 px-4 text-right">{t('table.actions', 'Actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={canManageStock ? 10 : 9} className="py-10 text-center text-slate-400">
                    Aucun produit trouvé pour les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const warehouseQty = product.stockWarehouse ?? product.stockQuantity ?? 0;
                  const enteredQty = product.stockTotalEntered ?? product.stockQuantity ?? 0;
                  const inTransitQty = product.stockInTransit || 0;
                  const damagedQty = product.stockDamaged || 0;
                  const threshold = product.alertThreshold || 10;

                  const isOut = warehouseQty === 0;
                  const isLow = warehouseQty > 0 && warehouseQty <= threshold;

                  const currency = product.store?.currency || currentStore?.currency || 'MAD';

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* SKU & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {product.sku}
                          </span>
                          <span className="font-bold text-slate-900">{product.name}</span>
                        </div>
                        {product.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[220px] mt-0.5">
                            {product.description}
                          </div>
                        )}
                      </td>

                      {/* Store */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {product.store?.name || 'Général'}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3">
                        {hideCost ? (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Confidentiel</span>
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-700">
                            {product.costPrice} {currency}
                          </span>
                        )}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {product.sellingPrice} {currency}
                      </td>

                      {/* 1. Total Entré */}
                      <td className="py-3 px-3 text-center bg-blue-50/20 border-x border-blue-50">
                        <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md text-xs border border-blue-200">
                          {enteredQty}
                        </span>
                      </td>

                      {/* 2. En Entrepôt (Dispo) */}
                      <td className="py-3 px-3 text-center bg-emerald-50/20 border-r border-emerald-50">
                        <span
                          className={`inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-md text-xs border ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {warehouseQty}
                        </span>
                      </td>

                      {/* 3. Sur le Terrain (En Transit) */}
                      <td className="py-3 px-3 text-center bg-sky-50/20 border-r border-sky-50">
                        {inTransitQty > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md text-xs border border-sky-200">
                            <Truck className="w-3 h-3 text-sky-600" />
                            <span>{inTransitQty}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>

                      {/* 4. Endommagé (Quarantaine) */}
                      <td className="py-3 px-3 text-center bg-rose-50/20 border-r border-rose-50">
                        {damagedQty > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-md text-xs border border-rose-300">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>{damagedQty}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                            Rupture totale
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Faible (≤ {threshold})</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                            En Stock
                          </span>
                        )}
                      </td>

                      {/* Actions (Admin & Manager only) */}
                      {canManageStock && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openAdjustModal(product, 'PURCHASE')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-[11px] border border-slate-200 transition-colors"
                              title="Entrée de stock ou ajustement d'inventaire"
                            >
                              Ajuster / Entrée
                            </button>

                            <button
                              onClick={() => openAdjustModal(product, 'DAMAGE')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] border border-rose-200 transition-colors flex items-center gap-1"
                              title="Déclarer une casse ou produit abîmé (quarantaine)"
                            >
                              <ShieldAlert className="w-3 h-3 text-rose-500" />
                              <span>Déclarer Casse</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-base font-bold text-slate-900 mb-1">Ajouter un nouveau produit</h2>
            <p className="text-xs text-slate-500 mb-4">Créez votre référence produit pour le suivi du stock multi-états et COGS.</p>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Boutique / Projet</label>
                <select
                  value={newStoreId}
                  onChange={(e) => setNewStoreId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Unique</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: SERUM-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Initial Reçu</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 100"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Produit</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Huile de Figue de Barbarie 30ml"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix Achat COGS ({currentStore?.currency || 'MAD'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 45.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prix de Vente COD ({currentStore?.currency || 'MAD'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 249.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seuil Alerte Stock Faible</label>
                <input
                  type="number"
                  required
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Enregistrer Produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adjust Stock & Declare Damage */}
      {canManageStock && showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {adjustType === 'DAMAGE' ? 'Déclarer Marchandise Endommagée' : 'Mouvement de Stock'}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  SKU: {selectedProduct.sku} • {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Quick Context Pill */}
            <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Entrepôt Dispo</span>
                <span className="text-xs font-bold text-emerald-600">
                  {selectedProduct.stockWarehouse ?? selectedProduct.stockQuantity} u
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Sur Terrain</span>
                <span className="text-xs font-bold text-sky-600">
                  {selectedProduct.stockInTransit || 0} u
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Déjà Cassé</span>
                <span className="text-xs font-bold text-rose-600">
                  {selectedProduct.stockDamaged || 0} u
                </span>
              </div>
            </div>

            {/* Quarantine alert banner when DAMAGE is selected */}
            {adjustType === 'DAMAGE' && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Quarantaine Immédiate :</span> Cette quantité sera déduite du stock vendable de l'entrepôt et isolée sous le statut &quot;Endommagé&quot;. Elle ne pourra plus être vendue ni attribuée aux agents.
                </div>
              </div>
            )}

            <form onSubmit={handleAdjustStock} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Type d opération</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="PURCHASE">📥 Arrivage Fournisseur (+) Entrée Stock</option>
                  <option value="ADJUSTMENT">➕ Ajustement Manuel / Inventaire (+)</option>
                  <option value="SALE">📤 Vente Directe / Sortie Manuelle (-)</option>
                  <option value="DAMAGE">⚠️ Article Cassé / Endommagé (Quarantaine Définitive -)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantité {adjustType === 'DAMAGE' ? 'cassée / endommagée' : 'd articles'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={adjustType === 'DAMAGE' ? (selectedProduct.stockWarehouse ?? selectedProduct.stockQuantity) : undefined}
                  placeholder="Ex: 5"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
                {adjustType === 'DAMAGE' && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Max déductible du stock entrepôt actuel : {selectedProduct.stockWarehouse ?? selectedProduct.stockQuantity} unités
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Référence {adjustType === 'DAMAGE' ? '(Colis abîmé / N° Réclamation)' : '(BL / Facture)'}
                </label>
                <input
                  type="text"
                  placeholder={adjustType === 'DAMAGE' ? 'Ex: CASSE-LIVREUR-CASABLANCA' : 'Ex: BL-FOURNISSEUR-991'}
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes explicatives</label>
                <textarea
                  rows={2}
                  placeholder={
                    adjustType === 'DAMAGE'
                      ? 'Ex: Flacon brisé lors du transport, produit inutilisable...'
                      : 'Ex: Réception nouvelle commande usine...'
                  }
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-xs transition-colors ${
                    adjustType === 'DAMAGE'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {adjustType === 'DAMAGE' ? 'Mettre en Quarantaine' : 'Valider le mouvement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

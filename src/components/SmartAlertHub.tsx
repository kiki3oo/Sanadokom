'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Bell,
  Boxes,
  AlertTriangle,
  UserX,
  Clock,
  Truck,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function SmartAlertHub() {
  const { currentCountry, selectedStoreId } = useStore();
  const { isAdmin, isManager, isCallAgent, currentUser, assignedStoreIds } = useAuth();
  const { t, isRtl } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'AGENTS' | 'CALLBACKS' | 'SHIPMENTS'>('STOCK');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showMorningToast, setShowMorningToast] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentCountry?.code) params.append('country', currentCountry.code);
      if (selectedStoreId && selectedStoreId !== 'ALL') params.append('storeId', selectedStoreId);
      if (currentUser?.id) params.append('agentId', currentUser.id);
      if (currentUser?.role) params.append('role', currentUser.role);
      if (assignedStoreIds && assignedStoreIds.length > 0) {
        params.append('assignedStoreIds', assignedStoreIds.join(','));
      }

      const res = await fetch(`/api/notifications?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json);

        // Check if morning brief was dismissed in this session
        const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem('morning_brief_dismissed') : 'false';
        if (!dismissed && json.totalAlertsCount > 0) {
          setShowMorningToast(true);
        }
      }
    } catch (e) {
      console.error('Error fetching operational alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [currentCountry?.code, selectedStoreId, currentUser?.id, currentUser?.role]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDismissMorningToast = () => {
    setShowMorningToast(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('morning_brief_dismissed', 'true');
    }
  };

  const totalAlerts = data?.totalAlertsCount || 0;
  const outOfStockCount = data?.outOfStockProducts?.length || 0;
  const lowStockCount = data?.lowStockProducts?.length || 0;
  const absentAgentsCount = data?.absentAgents?.length || 0;
  const callbacksCount = data?.overdueCallbacks?.length || 0;
  const shipmentsCount = data?.stuckShipments?.length || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 1. Header Notification Bell Button (Golden Luxury Finish) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all cursor-pointer shadow-xs ${
          totalAlerts > 0
            ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-600 hover:to-yellow-400 text-amber-950 border border-yellow-200/90 shadow-md shadow-amber-500/25 ring-2 ring-amber-400/30'
            : 'bg-gradient-to-tr from-amber-100 via-yellow-50 to-amber-50 hover:from-amber-200 hover:to-yellow-100 text-amber-800 border border-amber-300 shadow-2xs'
        }`}
        title={isRtl ? 'مركز التنبيهات الذكي' : 'Centre d\'Alertes Opérationnelles'}
      >
        <Bell className={`w-4 h-4 ${totalAlerts > 0 ? 'fill-amber-950 text-amber-950 animate-bounce' : 'fill-amber-400 text-amber-700'}`} />

        {totalAlerts > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white animate-pulse">
            {totalAlerts}
          </span>
        )}
      </button>

      {/* 2. Morning Brief Floating Toast (Top Right / Center) */}
      {showMorningToast && (
        <div className="fixed top-20 right-6 z-50 max-w-md w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <span>{isCallAgent ? (isRtl ? `موجزك اليومي (${currentUser?.name})` : `Vos Alertes (${currentUser?.name})`) : (isRtl ? 'موجز الصباح الذكي (Briefing)' : 'Briefing Opérationnel du Jour')}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {outOfStockCount > 0 && (
                    <span className="text-rose-300 font-bold block">
                      ⚠️ {outOfStockCount} {isCallAgent ? (isRtl ? 'منتجات مخصصة لك في حالة نفاد (Rupture)!' : 'produits de vos boutiques en rupture (0 pièce) !') : (isRtl ? 'منتجات في حالة نفاد كلي (Rupture)!' : 'produits en rupture de stock (0 pièce) !')}
                    </span>
                  )}
                  {!isCallAgent && absentAgentsCount > 0 && (
                    <span className="text-amber-300 font-medium block">
                      👥 {absentAgentsCount} {isRtl ? 'مؤكدين في حالة غياب/عطلة اليوم' : 'agent(s) en absence / congé aujourd\'hui'}
                    </span>
                  )}
                  {callbacksCount > 0 && (
                    <span className="text-blue-300 font-medium block">
                      📞 {callbacksCount} {isCallAgent ? (isRtl ? 'مواعيد اتصال خاصة بك تجاوزت وقتها' : 'de vos rappels ont dépassé l\'heure') : (isRtl ? 'مواعيد اتصال تجاوزت وقتها المبرمج' : 'rappels clients ont dépassé l\'heure')}
                    </span>
                  )}
                  {shipmentsCount > 0 && (
                    <span className="text-purple-300 font-medium block">
                      🚚 {shipmentsCount} {isCallAgent ? (isRtl ? 'شحنات خاصة بك في الانتظار (> 4 أيام)' : 'de vos colis en transit (> 4 jours)') : (isRtl ? 'شحنات عالقة في الطريق (> 4 أيام)' : 'colis en souffrance chez les transporteurs')}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={handleDismissMorningToast}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setShowMorningToast(false);
                setIsOpen(true);
              }}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{isRtl ? 'عرض كل التفاصيل' : 'Consulter toutes les alertes'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDismissMorningToast}
              className="text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer"
            >
              {isRtl ? 'إخفاء' : 'Masquer'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Dropdown Menu Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 shadow-2xs">
                <Bell className="w-4 h-4 fill-amber-950" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  {isCallAgent ? (isRtl ? `تنبيهاتي (${currentUser?.name})` : `Mes Alertes (${currentUser?.name})`) : (isRtl ? 'مركز التنبيهات والمراقبة' : 'Alertes Opérationnelles & Stock')}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {totalAlerts} {isCallAgent ? (isRtl ? 'تنبيه يخص عملك' : 'alertes concernant vos commandes et produits') : (isRtl ? 'تنبيه نشط يتطلب المتابعة' : 'alertes actives nécessitant votre attention')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-600">
            <button
              onClick={() => setActiveTab('STOCK')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'STOCK'
                  ? 'border-rose-600 text-rose-700 bg-white font-black'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>{isCallAgent ? (isRtl ? 'المخزون' : 'Mon Stock') : 'Stock'} ({outOfStockCount + lowStockCount})</span>
            </button>

            {/* Équipe Tab: ONLY for Admin and Manager! */}
            {!isCallAgent && (isAdmin || isManager) && (
              <button
                onClick={() => setActiveTab('AGENTS')}
                className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                  activeTab === 'AGENTS'
                    ? 'border-amber-600 text-amber-700 bg-white font-black'
                    : 'border-transparent hover:text-slate-900'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>{isRtl ? 'الفريق' : 'Équipe'} ({absentAgentsCount})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('CALLBACKS')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'CALLBACKS'
                  ? 'border-blue-600 text-blue-700 bg-white font-black'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isCallAgent ? (isRtl ? 'مواعيدي' : 'Mes Rappels') : (isRtl ? 'المواعيد' : 'Rappels')} ({callbacksCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('SHIPMENTS')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
                activeTab === 'SHIPMENTS'
                  ? 'border-purple-600 text-purple-700 bg-white font-black'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{isCallAgent ? (isRtl ? 'شحناتي' : 'Mes Colis') : (isRtl ? 'الشحنات' : 'Colis')} ({shipmentsCount})</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {/* TAB: STOCK */}
            {activeTab === 'STOCK' && (
              <div className="p-3 space-y-2">
                {outOfStockCount === 0 && lowStockCount === 0 ? (
                  <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Tous vos produits ont du stock suffisant.</span>
                  </div>
                ) : (
                  <>
                    {/* Out of Stock Items */}
                    {data?.outOfStockProducts?.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-rose-900 truncate">{p.name}</span>
                            <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-black rounded uppercase">
                              Rupture (0)
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            SKU: {p.sku} • {p.store?.name}
                          </div>
                        </div>

                        {isAdmin && (
                          <Link
                            href="/suppliers"
                            onClick={() => setIsOpen(false)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-black shrink-0 transition"
                          >
                            + Commander
                          </Link>
                        )}
                      </div>
                    ))}

                    {/* Low Stock Items */}
                    {data?.lowStockProducts?.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-amber-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Reste: <strong className="text-amber-700">{p.stockQuantity} pcs</strong> (Seuil: {p.alertThreshold})
                          </div>
                        </div>

                        <Link
                          href="/stock"
                          onClick={() => setIsOpen(false)}
                          className="text-[11px] font-bold text-amber-800 hover:underline shrink-0"
                        >
                          Voir stock
                        </Link>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* TAB: AGENTS */}
            {activeTab === 'AGENTS' && (
              <div className="p-3 space-y-2">
                {absentAgentsCount === 0 ? (
                  <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Tous les confirmateurs sont actifs et présents.</span>
                  </div>
                ) : (
                  data?.absentAgents?.map((ag: any) => (
                    <div
                      key={ag.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{ag.name}</span>
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                            {ag.workStatus === 'QUITTED' ? 'Compte Clôturé' : 'En Congé'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Motif: {ag.leaveReason}
                        </div>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="text-[11px] font-bold text-indigo-600 hover:underline shrink-0"
                        >
                          Gérer
                        </Link>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: CALLBACKS */}
            {activeTab === 'CALLBACKS' && (
              <div className="p-3 space-y-2">
                {callbacksCount === 0 ? (
                  <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Aucun rappel en retard pour le moment.</span>
                  </div>
                ) : (
                  data?.overdueCallbacks?.map((cb: any) => (
                    <div
                      key={cb.id}
                      className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>#{cb.orderNumber}</span>
                          <span className="text-slate-600">• {cb.customerName}</span>
                        </div>
                        <div className="text-[10px] text-blue-700">
                          Prévu à: {new Date(cb.callbackAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {cb.assignedAgent?.name && !isCallAgent && ` (Agent: ${cb.assignedAgent.name})`}
                        </div>
                      </div>

                      <Link
                        href="/call-center"
                        onClick={() => setIsOpen(false)}
                        className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold shrink-0"
                      >
                        Appeler
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: SHIPMENTS */}
            {activeTab === 'SHIPMENTS' && (
              <div className="p-3 space-y-2">
                {shipmentsCount === 0 ? (
                  <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>Aucun colis bloqué depuis plus de 4 jours.</span>
                  </div>
                ) : (
                  data?.stuckShipments?.map((s: any) => (
                    <div
                      key={s.id}
                      className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900">
                          #{s.orderNumber} • {s.customerName} ({s.customerCity})
                        </div>
                        <div className="text-[10px] text-purple-700">
                          {s.courierProvider || 'Transporteur'} • Expédié le {new Date(s.shippedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <Link
                        href="/orders"
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] font-bold text-purple-700 hover:underline shrink-0"
                      >
                        Suivre
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Actualisation auto (60s)</span>
            <button
              onClick={fetchAlerts}
              className="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
            >
              {loading ? 'Chargement...' : 'Rafraîchir'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

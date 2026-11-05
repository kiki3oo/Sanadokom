'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  Send,
  ExternalLink,
  ChevronRight,
  MapPin,
  Clock,
  FileSpreadsheet,
  Lock,
  History,
  X,
  User,
  Plus,
  Copy,
  MessageCircle,
  AlertTriangle,
  PhoneCall,
} from 'lucide-react';
import ManualOrderModal from '@/components/ManualOrderModal';
import BulkImportOrdersModal from '@/components/BulkImportOrdersModal';
import UtmBadge from '@/components/UtmBadge';
import { useLanguage } from '@/context/LanguageContext';

export default function OrdersPage() {
  const { selectedStoreId, currentCountry } = useStore();
  const { currentUser, hasPermission, canViewPage, isAdmin, isManager, isCallAgent, allUsers } = useAuth();
  const canMarkRemittance = (isAdmin || isManager || hasPermission('canManageRemittance')) && !isCallAgent;
  const canChangeDeliveryStatus = (isAdmin || isManager || hasPermission('canChangeDeliveryStatus')) && !isCallAgent;
  const { t } = useLanguage();

  const maskPhoneNumber = (phone?: string | null): string => {
    if (!phone) return '-';
    const clean = phone.trim();
    if (clean.length <= 6) return '••••••';
    return `${clean.slice(0, 4)} •••• ${clean.slice(-2)}`;
  };

  const REFUSAL_REASONS = [
    { id: 'TROP_CHER', label: '💸 Trop cher / Pas de budget', ar: 'جا ثمن غالي / ما كاينش ميزانية' },
    { id: 'NON_CONFORME', label: '📦 Produit non conforme / Défectueux', ar: 'المنتوج ماشي بحال لي شاف / فيه عيب' },
    { id: 'RETARD', label: '⏳ Retard de livraison / Délai trop long', ar: 'تعطلات عليه الطلبية ومبقاش باغيها' },
    { id: 'CHANGE_AVIS', label: '🔄 A changé d\'avis / Plus besoin', ar: 'بدل رأيو / مابقاش محتاج المنتوج' },
    { id: 'PAS_COMMANDE', label: '📵 Pas commandé / Faux numéro / Erreur', ar: 'ما كومونداش / رقم خاطئ' },
    { id: 'CLIENT_ABSENT', label: '✈️ Absent / Voyage / Ne répond plus', ar: 'مسافر / غائب / ما كايجاوبش' },
    { id: 'AUTRE', label: '❓ Autre motif (préciser)', ar: 'سبب آخر (توضيح فالتعليق)' },
  ];

  const extractRefusalReason = (notes?: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/\[Motif(?:\sRefus)?:\s*([^\]]+)\]/i);
    return match ? match[1].trim() : null;
  };

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [remittanceFilter, setRemittanceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [filterAgentId, setFilterAgentId] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [courierProvider, setCourierProvider] = useState('CATHEDIS');
  const [isDispatching, setIsDispatching] = useState(false);
  const [bulkAgentId, setBulkAgentId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [historyOrder, setHistoryOrder] = useState<any | null>(null);
  const [orderLogs, setOrderLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [topAgentForDispatch, setTopAgentForDispatch] = useState<any | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [postponeModalOrder, setPostponeModalOrder] = useState<any | null>(null);
  const [postponeDate, setPostponeDate] = useState('');
  const [postponeNotes, setPostponeNotes] = useState('');
  const [refusalModalOrder, setRefusalModalOrder] = useState<any | null>(null);
  const [refusalReason, setRefusalReason] = useState<string>('💸 Trop cher / Pas de budget');
  const [refusalNotes, setRefusalNotes] = useState('');

  useEffect(() => {
    if (currentCountry?.code === 'SN') {
      setCourierProvider('MANUAL');
    } else {
      setCourierProvider('CATHEDIS');
    }
  }, [currentCountry?.code]);

  const fetchTopAgent = async () => {
    try {
      const res = await fetch('/api/agents/productivity');
      const data = await res.json();
      if (data.success && data.topRecommendedAgent) {
        setTopAgentForDispatch(data.topRecommendedAgent);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenHistory = async (order: any) => {
    setHistoryOrder(order);
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/audit-logs?orderId=${order.id}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setOrderLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching order logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/api/orders?storeId=${selectedStoreId}&logisticsOnly=true`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (remittanceFilter !== 'ALL') url += `&remittance=${remittanceFilter}`;
      if (!isAdmin && hasPermission('onlyOwnOrders') && currentUser?.id) {
        url += `&agentId=${currentUser.id}`;
      } else if (isAdmin && filterAgentId !== 'ALL') {
        url += `&agentId=${filterAgentId}`;
      }
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlStatus = params.get('status') || params.get('tab');
      if (urlStatus) {
        setStatusFilter(urlStatus);
      }
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTopAgent();
    setSelectedIds([]);
  }, [selectedStoreId, currentCountry?.code, statusFilter, remittanceFilter, filterAgentId, currentUser?.id]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(orders.map((o) => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk dispatch to courier API
  const handleBulkDispatch = async () => {
    if (selectedIds.length === 0) return;
    setIsDispatching(true);

    try {
      const res = await fetch('/api/shipping/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedIds,
          courierProvider,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedIds([]);
        fetchOrders();
      } else {
        alert(data.error || 'Erreur lors de l expédition');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedIds.length === 0 || !bulkAgentId) return;
    setIsAssigning(true);
    try {
      const res = await fetch('/api/orders/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedIds,
          agentId: bulkAgentId,
          assignedByName: currentUser?.name || 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedIds([]);
        fetchOrders();
      } else {
        alert(data.error || 'Erreur lors de l attribution');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssigning(false);
    }
  };

  // Quick status update (e.g. Mark as DELIVERED or RETURNED)
  const handleQuickStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          subStatus: (newStatus === 'DELIVERED' || newStatus === 'RETURNED') ? null : undefined,
          callbackAt: (newStatus === 'DELIVERED' || newStatus === 'RETURNED') ? null : undefined,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Utilisateur',
          userRole: currentUser?.role || 'CALL_AGENT',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkIncident = async (orderId: string, incidentType: string, customDate?: string, customNotes?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_TRANSIT',
          subStatus: incidentType,
          callbackAt: customDate || null,
          agentNotes: customNotes || undefined,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Responsable Logistique',
          userRole: currentUser?.role || 'LOGISTICS_MANAGER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmPostpone = async () => {
    if (!postponeModalOrder) return;
    await handleMarkIncident(
      postponeModalOrder.id,
      'LIVREUR_REPORTE',
      postponeDate || undefined,
      postponeNotes ? `Reporté: ${postponeNotes}` : undefined
    );
    setPostponeModalOrder(null);
  };

  const handleConfirmRefusal = async () => {
    if (!refusalModalOrder) return;
    const formattedNotes = `[Motif Refus: ${refusalReason}] ${refusalNotes}`.trim();
    await handleMarkIncident(refusalModalOrder.id, 'LIVREUR_REFUSE', undefined, formattedNotes);
    setRefusalModalOrder(null);
    setRefusalNotes('');
  };

  const handleToggleRemittance = async (orderId: string, targetStatus: 'VERSE' | 'EN_ATTENTE') => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courierStatus: targetStatus,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Responsable Logistique',
          userRole: currentUser?.role || 'LOGISTICS_MANAGER',
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkRemittance = async (targetStatus: 'VERSE' | 'EN_ATTENTE') => {
    if (selectedIds.length === 0) return;
    setIsDispatching(true);
    try {
      const res = await fetch('/api/orders/bulk-remittance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedIds,
          remittanceStatus: targetStatus,
          userName: currentUser?.name || 'Responsable Logistique',
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedIds([]);
        fetchOrders();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour du versement');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleMarkSortiEnLivraison = async (orderId: string) => {
    await handleMarkIncident(orderId, 'EN_COURS_LIVRAISON', undefined, 'Colis pris par le livreur pour livraison aujourd\'hui');
  };

  const handleBulkSortiEnLivraison = async () => {
    if (selectedIds.length === 0) return;
    setIsDispatching(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subStatus: 'EN_COURS_LIVRAISON',
              status: 'IN_TRANSIT',
              agentNotes: 'Colis sorti avec le livreur aujourd\'hui',
              userId: currentUser?.id,
              userName: currentUser?.name || 'Responsable Logistique',
              userRole: currentUser?.role || 'LOGISTICS_MANAGER',
            }),
          })
        )
      );
      setSelectedIds([]);
      fetchOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleCopyRescueList = () => {
    if (orders.length === 0) return;
    const lines = orders.map((o, idx) => {
      const tracking = o.trackingNumber ? `[${o.trackingNumber}]` : '';
      const dateText = o.callbackAt
        ? `Relivraison: ${new Date(o.callbackAt).toLocaleDateString('fr-FR')} ${new Date(o.callbackAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        : 'Relivraison: Demain';
      return `${idx + 1}. #${o.orderNumber} ${tracking} | ${o.customerName} (${o.customerCity} - ${o.customerPhone}) | ${dateText} | Note: ${o.agentNotes || 'Client confirme et attend le livreur'}`;
    });
    const header = `📦 LISTE DES COLIS SAUVÉS À RELIVRER (${orders.length} colis) :\n\n`;
    navigator.clipboard.writeText(header + lines.join('\n\n'));
    alert(`✅ Liste de ${orders.length} colis copiée dans le presse-papier ! Vous pouvez la coller directement sur WhatsApp pour l'agence.`);
  };

  const getCourierWhatsAppUrl = (order: any) => {
    const tracking = order.trackingNumber || order.orderNumber;
    const client = order.customerName;
    const city = order.customerCity;
    const phone = order.customerPhone;
    const dateText = order.callbackAt ? new Date(order.callbackAt).toLocaleDateString('fr-FR') : 'غدا';
    const note = order.agentNotes || 'الكليان واجد ومأكد الطلبية';
    const msg = `سلام خويا بخصوص كولي رقم ${tracking} ديال الكليان ${client} (${city} - ${phone})، راه تواصلنا معاه وأكد باغي الكوموند وغادي يكون واجد ${dateText}. الملاحظة: ${note}. عفاك بروغرامي ليه التوصيل وشكرا بزاف.`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  if (!canViewPage('/orders')) {
    return <AccessDenied moduleName="la Gestion des Commandes & Expéditions" />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header - Luxury Logistics Command */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/5 via-sky-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">
              {t('orders.title')}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-800 border border-blue-200 shadow-2xs flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Logistique & Suivi Colis Prestige</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 font-medium max-w-2xl">
            {t('orders.subtitle')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto max-w-full shadow-2xs relative z-10">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('status.all')}
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'CONFIRMED' ? 'bg-indigo-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('orders.toShip')}
          </button>
          <button
            onClick={() => setStatusFilter('SHIPPED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'SHIPPED' ? 'bg-blue-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('orders.inDelivery')}
          </button>
          <button
            onClick={() => setStatusFilter('EN_COURS_LIVRAISON')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'EN_COURS_LIVRAISON'
                ? 'bg-cyan-600 text-white shadow-xs font-black'
                : 'text-cyan-800 bg-cyan-50/80 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{t('orders.outForDelivery')}</span>
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'DELIVERED' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('orders.deliveredTab')}
          </button>
          <button
            onClick={() => setStatusFilter('RETURNED')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'RETURNED' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('orders.returnedTab')}
          </button>
          <button
            onClick={() => setStatusFilter('INCIDENTS_LIVRAISON')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'INCIDENTS_LIVRAISON'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs font-black'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <span>{t('orders.deliveryIncidents')}</span>
          </button>
          <button
            onClick={() => setStatusFilter('SAUVE_A_RELIVRER')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
              statusFilter === 'SAUVE_A_RELIVRER'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-xs font-black'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span>{t('orders.savedToReship')}</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected) */}
      {selectedIds.length > 0 && !isCallAgent && (
        <div className="bg-indigo-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">{t('orders.selectedItems')}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canMarkRemittance && (
              <button
                onClick={() => handleBulkRemittance('VERSE')}
                disabled={isDispatching}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                title={t('orders.markRemittance')}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('orders.markRemittance')}</span>
              </button>
            )}

            {canChangeDeliveryStatus && (
              <button
                onClick={handleBulkSortiEnLivraison}
                disabled={isDispatching}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                title={t('orders.markOutForDelivery')}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{t('orders.markOutForDelivery')}</span>
              </button>
            )}

            <span className="text-xs text-indigo-200 font-medium ml-1">{t('orders.transferTo')}</span>
            {currentCountry?.code === 'SN' ? (
              <select
                value={courierProvider}
                onChange={(e) => setCourierProvider(e.target.value)}
                className="bg-indigo-800 text-white text-xs rounded-lg px-3 py-1.5 font-semibold border border-indigo-700 focus:outline-none"
              >
                <option value="">⚡ Auto-Routage (Workflow)</option>
                <option value="MANUAL">{t('orders.localCourierSn')}</option>
                <option value="AUTRE">{t('orders.otherAgencySn')}</option>
              </select>
            ) : (
              <select
                value={courierProvider}
                onChange={(e) => setCourierProvider(e.target.value)}
                className="bg-indigo-800 text-white text-xs rounded-lg px-3 py-1.5 font-semibold border border-indigo-700 focus:outline-none"
              >
                <option value="">⚡ Auto-Routage (Workflow)</option>
                <option value="Cathedis">Cathedis API</option>
                <option value="Sendit">Sendit API</option>
                <option value="Ameex">Ameex API</option>
                <option value="OzonExpress">OzonExpress API</option>
                <option value="Speedaf">Speedaf</option>
                <option value="Forcelog">Forcelog</option>
                <option value="Coliix">Coliix</option>
                <option value="Onessta">Onessta</option>
                <option value="Livo">Livo</option>
                <option value="Vitex">Vitex</option>
                <option value="Speedex">Speedex</option>
                <option value="Maberr">Maberr</option>
                <option value="Colino Express">Colino Express</option>
                <option value="Livcach">Livcach</option>
                <option value="MANUAL">Livraison Interne / Autre</option>
              </select>
            )}

            <button
              onClick={handleBulkDispatch}
              disabled={isDispatching}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isDispatching ? 'Envoi...' : 'Générer Bordereaux & Expédier'}</span>
            </button>

            {/* Admin Bulk Assign To Confirmer */}
            {isAdmin && (
              <div className="flex items-center gap-2 pl-3 border-l border-indigo-700">
                <span className="text-xs text-indigo-200 font-medium whitespace-nowrap">Assigner à :</span>
                <select
                  value={bulkAgentId}
                  onChange={(e) => setBulkAgentId(e.target.value)}
                  className="bg-indigo-800 text-white text-xs rounded-lg px-3 py-1.5 font-semibold border border-indigo-700 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Choisir Agent --</option>
                  {allUsers
                    .filter((u) => u.role === 'CALL_AGENT')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        🎧 {u.name}
                      </option>
                    ))}
                </select>

                {topAgentForDispatch && (
                  <button
                    type="button"
                    onClick={() => setBulkAgentId(topAgentForDispatch.id)}
                    className="text-[10px] font-black px-2 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center gap-1 shadow-xs whitespace-nowrap cursor-pointer"
                    title={`Agent le plus rapide: ${topAgentForDispatch.avgGapMinutes} min entre 2 commandes | ${topAgentForDispatch.confirmationRate}% confirmation`}
                  >
                    ⚡ Top: {topAgentForDispatch.name} ({topAgentForDispatch.avgGapMinutes}m)
                  </button>
                )}

                <button
                  onClick={handleBulkAssign}
                  disabled={!bulkAgentId || isAssigning}
                  className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {isAssigning ? '...' : 'Attribuer'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('orders.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs shrink-0">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">{t('filter.byAgent')}</span>
            <select
              value={filterAgentId}
              onChange={(e) => setFilterAgentId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('filter.allAgents')}</option>
              {allUsers
                .filter((u) => u.role === 'CALL_AGENT')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    🎧 {u.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Versement Filter */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs shrink-0">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">💰 Versement :</span>
          <select
            value={remittanceFilter}
            onChange={(e) => setRemittanceFilter(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tous les versements</option>
            <option value="VERSE">🟢 Versé (Encaissé)</option>
            <option value="NON_VERSE">⏳ En attente versement</option>
          </select>
        </div>

        {!isCallAgent && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
              title={t('btn.manualOrder')}
            >
              <Plus className="w-4 h-4" />
              <span>{t('btn.manualOrder')}</span>
            </button>
          </div>
        )}
      </div>

      {statusFilter === 'SAUVE_A_RELIVRER' && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              🟢
            </span>
            <div>
              <h4 className="text-xs font-black text-emerald-950">
                {orders.length} Colis Sauvé(s) par le Call Center & Prêt(s) pour Relivraison
              </h4>
              <p className="text-[11px] text-emerald-700">
                Les agents ont contacté ces clients et convenu d un créneau. Copiez la liste pour la transmettre directement aux livreurs et agences de livraison.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyRescueList}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>📋 Copier Liste Relivraisons (WhatsApp Agence)</span>
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">{t('table.loading')}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">{t('table.noData')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  {!isCallAgent && (
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === orders.length && orders.length > 0}
                        onChange={handleSelectAll}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">{t('table.order')}</th>
                  <th className="py-3 px-4">{t('table.customer')}</th>
                  <th className="py-3 px-4">{t('table.city')}</th>
                  <th className="py-3 px-4">{t('table.amount')} (COD)</th>
                  <th className="py-3 px-4">{t('table.courier')}</th>
                  <th className="py-3 px-4">{t('table.status')}</th>
                  <th className="py-3 px-4 text-center">💰 Versement Livreur</th>
                  {!isCallAgent && <th className="py-3 px-4 text-right">{t('table.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      {!isCallAgent && (
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(order.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                      )}

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center justify-between gap-1">
                          <span>{order.orderNumber}</span>
                          <button
                            onClick={() => handleOpenHistory(order)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Historique & Audit"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="mt-1">
                          <UtmBadge
                            source={order.source}
                            utmSource={order.utmSource}
                            utmCampaign={order.utmCampaign}
                            adSet={order.adSet}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{order.customerName}</div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-slate-600 font-mono font-medium text-[11px]">{order.customerPhone || '-'}</span>
                          {order.customerPhone && (
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              title={`Appeler ${order.customerPhone}`}
                            >
                              <PhoneCall className="w-3 h-3 inline" />
                            </a>
                          )}
                        </div>

                        {/* Customer History & Duplicate Badge */}
                        <div className="mt-1 flex items-center gap-1">
                          {order.customerProfile?.isDuplicate ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shadow-2xs"
                              title={order.customerProfile.duplicateReason || 'Doublon détecté'}
                            >
                              🚨 Doublon
                            </span>
                          ) : order.customerProfile?.reliabilityBadge === 'VIP' ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                              title={`Client VIP : ${order.customerProfile.deliveredCount} commande(s) livrée(s)`}
                            >
                              ⭐ VIP ({order.customerProfile.deliveredCount})
                            </span>
                          ) : order.customerProfile?.reliabilityBadge === 'RECURRING' ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs"
                              title={`Client récurrent : ${order.customerProfile.totalOrders} commandes`}
                            >
                              🔁 Récurent ({order.customerProfile.totalOrders})
                            </span>
                          ) : order.customerProfile?.reliabilityBadge === 'RISKY' ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
                              title={`Attention : ${order.customerProfile.cancelledCount} commande(s) annulée(s)/retournée(s)`}
                            >
                              ⚠️ À Risque ({order.customerProfile.cancelledCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              🆕 Nouveau
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{order.customerCity || 'N/A'}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[180px]">
                          {order.customerAddress || 'Pas d adresse'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">
                          {order.totalAmount} {order.store?.currency || 'MAD'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {order.trackingNumber ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                              <Truck className="w-3 h-3 text-indigo-600" />
                              <span>{order.courierProvider} : {order.trackingNumber}</span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Non expédié</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {order.status === 'DELIVERED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>✓ Livré</span>
                            </span>
                          ) : order.status === 'RETURNED' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                              ✕ Retour Définitif
                            </span>
                          ) : order.subStatus === 'LIVREUR_REPORTE' ? (
                            <>
                              <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-300">
                                ⏳ Reporté
                              </span>
                              {order.callbackAt && (
                                <span className="text-[10px] font-bold text-blue-900 bg-blue-100/70 px-1.5 py-0.5 rounded border border-blue-200">
                                  📅 {new Date(order.callbackAt).toLocaleDateString('fr-FR')} {new Date(order.callbackAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </>
                          ) : order.subStatus === 'SAUVE_A_RELIVRER' ? (
                            <>
                              <span className="inline-block px-2.5 py-1 rounded-full font-black text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                🟢 Sauvé à Relivrer
                              </span>
                              {order.callbackAt && (
                                <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  📅 {new Date(order.callbackAt).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </>
                          ) : order.subStatus === 'EN_COURS_LIVRAISON' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping" />
                              <span>🛵 Sorti en livraison</span>
                            </span>
                          ) : order.subStatus === 'LIVREUR_INJOIGNABLE' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-50 text-amber-800 border border-amber-300">
                              📵 Injoignable
                            </span>
                          ) : order.subStatus === 'LIVREUR_REFUSE' ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-50 text-rose-800 border border-rose-300">
                                ⛔ Refusé Livreur
                              </span>
                              {extractRefusalReason(order.agentNotes) && (
                                <span className="text-[10px] font-bold text-rose-950 bg-rose-100/90 px-2 py-0.5 rounded border border-rose-200">
                                  {extractRefusalReason(order.agentNotes)}
                                </span>
                              )}
                            </div>
                          ) : order.subStatus === 'LIVREUR_ADRESSE_INVALIDE' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                              📍 Adresse Invalide
                            </span>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                order.status === 'SHIPPED' || order.status === 'IN_TRANSIT'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : order.status === 'CONFIRMED'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.status === 'CONFIRMED'
                                ? 'Prêt à expédier'
                                : order.status === 'SHIPPED'
                                ? 'En cours'
                                : order.status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Versement Livreur / Paiement Transporteur Column */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {order.courierStatus === 'VERSE' || order.courierStatus === 'PAYE' ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>🟢 Versé (Encaissé)</span>
                              </span>
                              {canMarkRemittance && (
                                <button
                                  onClick={() => handleToggleRemittance(order.id, 'EN_ATTENTE')}
                                  className="text-[9px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                                  title="Remettre en attente de versement"
                                >
                                  Annuler
                                </button>
                              )}
                            </>
                          ) : order.status === 'DELIVERED' ? (
                            <>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>⏳ En attente</span>
                              </span>
                              {canMarkRemittance && (
                                <button
                                  onClick={() => handleToggleRemittance(order.id, 'VERSE')}
                                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Marquer que la société de livraison a versé/viré les fonds"
                                >
                                  <span>💰 Marquer Versé</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">-</span>
                          )}
                        </div>
                      </td>

                      {!isCallAgent && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                            {['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED'].includes(order.status) && (
                              <>
                                {/* All actions consolidated into single clean Statut dropdown - visible only for authorized users */}
                                {canChangeDeliveryStatus && (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val === 'DELIVERED') {
                                        handleQuickStatus(order.id, 'DELIVERED');
                                      } else if (val === 'EN_COURS_LIVRAISON') {
                                        handleMarkSortiEnLivraison(order.id);
                                      } else if (val === 'LIVREUR_REFUSE') {
                                        setRefusalModalOrder(order);
                                        setRefusalReason('💸 Trop cher / Pas de budget');
                                        setRefusalNotes('');
                                      } else if (val === 'LIVREUR_REPORTE') {
                                        setPostponeModalOrder(order);
                                        setPostponeDate('');
                                        setPostponeNotes('');
                                      } else if (val === 'RETURNED') {
                                        handleQuickStatus(order.id, 'RETURNED');
                                      } else if (val) {
                                        handleMarkIncident(order.id, val);
                                      }
                                    }}
                                    className="text-xs bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold cursor-pointer shadow-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                    title="Changer le statut de la commande"
                                  >
                                    <option value="">⚙️ Statut...</option>
                                    <option value="DELIVERED">✓ Marquer Livré</option>
                                    <option value="EN_COURS_LIVRAISON">🛵 Sorti en livraison</option>
                                    <option value="LIVREUR_REFUSE">✋ Refusé (Préciser motif)</option>
                                    <option value="LIVREUR_REPORTE">⏳ Reporté (Fixer date)</option>
                                    <option value="LIVREUR_INJOIGNABLE">📵 Injoignable</option>
                                    <option value="LIVREUR_ADRESSE_INVALIDE">📍 Adresse Invalide</option>
                                    <option value="RETURNED">✕ Retour Définitif</option>
                                  </select>
                                )}

                                {/* WhatsApp link directly to courier */}
                                <a
                                  href={getCourierWhatsAppUrl(order)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
                                  title="Envoyer consigne de livraison au livreur sur WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Livreur</span>
                                </a>
                              </>
                            )}

                            {order.status === 'CONFIRMED' && (
                              <button
                                onClick={() => {
                                  setSelectedIds([order.id]);
                                  handleBulkDispatch();
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold border border-indigo-200 flex items-center gap-1"
                              >
                                <Send className="w-3 h-3" />
                                <span>Expédier</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenHistory(order)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Historique & Audit (Qui a modifié cette commande ?)"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Audit History Modal */}
      {historyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Historique & Traçabilité : #{historyOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Client: {historyOrder.customerName} ({historyOrder.customerCity})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryOrder(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[420px] overflow-y-auto space-y-3">
              {loadingLogs ? (
                <div className="py-8 text-center text-xs text-slate-400">Chargement de l'historique...</div>
              ) : orderLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <span>Aucun log d'action enregistré pour cette commande.</span>
                </div>
              ) : (
                <div className="relative pl-4 border-l-2 border-indigo-100 space-y-4">
                  {orderLogs.map((log: any) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-indigo-600" />
                            {log.userName} ({log.userRole || 'Utilisateur'})
                          </span>
                          <span>
                            {new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800 leading-relaxed">{log.details}</p>
                        {(log.oldValue || log.newValue) && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-[10px] font-mono">
                            {log.oldValue && (
                              <span className="px-1 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                                {log.oldValue}
                              </span>
                            )}
                            {log.oldValue && log.newValue && <span className="text-slate-400">➔</span>}
                            {log.newValue && (
                              <span className="px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setHistoryOrder(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Order Creation Modal */}
      <ManualOrderModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onOrderCreated={fetchOrders}
        defaultStatus="CONFIRMED"
      />

      {/* Bulk Import Orders Modal (Excel / CSV) */}
      <BulkImportOrdersModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onImportSuccess={fetchOrders}
        defaultStatus="CONFIRMED"
      />

      {/* Postpone / Report Modal */}
      {postponeModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏳</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Programmer la date de report
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Commande #{postponeModalOrder.orderNumber} ({postponeModalOrder.customerName})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPostponeModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📅 Date & Heure souhaitée par le client :
                </label>
                <input
                  type="datetime-local"
                  value={postponeDate}
                  onChange={(e) => setPostponeDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  💡 لن يتم إزعاج الزبون بالمكالمات حتى يحين هذا الموعد المبرمج.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📝 ملاحظة أو سبب التأجيل :
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: مسافر، غادي يرجع نهار الجمعة / قال عيطولي مور العصر..."
                  value={postponeNotes}
                  onChange={(e) => setPostponeNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPostponeModalOrder(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmPostpone}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
              >
                ✓ Enregistrer le Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refusal / Motif de Refus Modal */}
      {refusalModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">⛔</span>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Motif de Refus Livreur (لماذا تم رفض الطلبية؟)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Commande #{refusalModalOrder.orderNumber} ({refusalModalOrder.customerName} - {refusalModalOrder.customerCity})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setRefusalModalOrder(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  📌 اختر سبب الرفض المصرح به من طرف الموزع :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {REFUSAL_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRefusalReason(r.label)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        refusalReason === r.label
                          ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold shadow-xs ring-1 ring-rose-400'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="font-bold">{r.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{r.ar}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📝 تفاصيل أو ملاحظة إضافية (Ex: ما قاله الزبون للموزع) :
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: الكليان قال للموزع جا غالي وبغا تخفيض / قاليه ما طلبت والو..."
                  value={refusalNotes}
                  onChange={(e) => setRefusalNotes(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-start gap-2">
                <span className="text-base shrink-0">💡</span>
                <span>
                  <strong>خلية Sauvetage :</strong> سيظهر هذا السبب لمركز الاتصال (Call Center) للاتصال بالزبون ومعالجة سبب الرفض لاقتراح حلول (تخفيض، توضيح الجودة، أو برمجة موعد جديد).
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRefusalModalOrder(null)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRefusal}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer transition-colors"
              >
                ✓ Enregistrer le Refus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

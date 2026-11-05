'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Phone,
  MessageSquare,
  ArrowRight,
  Package,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
  BadgeAlert,
  User,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { ReclamationTicket } from '@/lib/reclamations';

const TYPE_CONFIG: Record<
  string,
  { labelFr: string; labelAr: string; color: string; icon: any }
> = {
  PRODUIT_DEFECTUEUX: {
    labelFr: 'Produit Défectueux / Cassé',
    labelAr: 'منتج معيب أو مكسور',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: AlertTriangle,
  },
  ERREUR_PRODUIT: {
    labelFr: 'Erreur Produit / Mauvaise Taille',
    labelAr: 'خطأ في المقاس أو الموديل',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Package,
  },
  PIECE_MANQUANTE: {
    labelFr: 'Pièce / Accessoire Manquant',
    labelAr: 'قطعة أو إكسسوار ناقص',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertCircle,
  },
  LITIGE_TRANSPORTEUR: {
    labelFr: 'Litige Transporteur / Livreur',
    labelAr: 'نزاع مع شركة التوصيل / الموزع',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Truck,
  },
  DEMANDE_ECHANGE: {
    labelFr: "Demande d'Échange",
    labelAr: 'طلب استبدال',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: RotateCcw,
  },
  DEMANDE_REMBOURSEMENT: {
    labelFr: 'Demande Remboursement',
    labelAr: 'طلب استرجاع المبلغ',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: RotateCcw,
  },
  AUTRE: {
    labelFr: 'Autre motif',
    labelAr: 'سبب آخر',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: FileText,
  },
};

const STATUS_CONFIG: Record<
  string,
  { labelFr: string; labelAr: string; bg: string; text: string; dot: string }
> = {
  NOUVEAU: {
    labelFr: 'Nouveau',
    labelAr: 'جديدة',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
  },
  EN_COURS: {
    labelFr: 'En cours',
    labelAr: 'قيد المعالجة',
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    dot: 'bg-blue-500',
  },
  ATTENTE_CLIENT: {
    labelFr: 'Attente Client',
    labelAr: 'بانتظار العميل',
    bg: 'bg-sky-50 border-sky-200',
    text: 'text-sky-800',
    dot: 'bg-sky-500',
  },
  ATTENTE_TRANSPORTEUR: {
    labelFr: 'Attente Transporteur',
    labelAr: 'بانتظار شركة التوصيل',
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-800',
    dot: 'bg-orange-500',
  },
  ECHANGE_PROGRAMME: {
    labelFr: 'Échange Programmé',
    labelAr: 'مبرمج استبدال 🔄',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    dot: 'bg-purple-500',
  },
  RESOLU: {
    labelFr: 'Résolu',
    labelAr: 'تم الحل بنجاح ✅',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
  },
  REJETE: {
    labelFr: 'Rejeté',
    labelAr: 'مرفوضة',
    bg: 'bg-slate-100 border-slate-200',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
};

export default function ReclamationsPage() {
  const { currentUser, isAdmin, isCallAgent, canViewPage } = useAuth();
  const { selectedStoreId, currentCountry } = useStore();
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const [tickets, setTickets] = useState<ReclamationTicket[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    nouveau: 0,
    enCours: 0,
    echanges: 0,
    resolu: 0,
    rejete: 0,
    resolutionRate: 100,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ReclamationTicket | null>(null);
  const [showExchangeModal, setShowExchangeModal] = useState<ReclamationTicket | null>(null);

  // Lookup state in New Modal
  const [orderQuery, setOrderQuery] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [foundOrders, setFoundOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Form data for new ticket
  const [newFormData, setNewFormData] = useState({
    type: 'PRODUIT_DEFECTUEUX',
    priority: 'MEDIUM',
    customerName: '',
    customerPhone: '',
    customerCity: '',
    customerAddress: '',
    productName: '',
    orderNumber: '',
    description: '',
    customerDemand: '',
  });

  // Exchange form data
  const [exchangeFee, setExchangeFee] = useState<number>(0);
  const [exchangeNewVariant, setExchangeNewVariant] = useState('');
  const [exchangeNotes, setExchangeNotes] = useState('');
  const [creatingExchange, setCreatingExchange] = useState(false);

  // Fetch tickets
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedPriority !== 'ALL') params.append('priority', selectedPriority);
      if (search) params.append('search', search);

      const res = await fetch(`/api/reclamations?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to load reclamations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedStoreId, currentCountry?.code, selectedStatus, selectedType, selectedPriority]);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Lookup order by query
  const handleLookupOrder = async (query: string) => {
    setOrderQuery(query);
    if (query.trim().length < 2) {
      setFoundOrders([]);
      return;
    }
    setLookingUp(true);
    try {
      const res = await fetch(`/api/reclamations/lookup-order?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setFoundOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    const prodName = order.items?.[0]?.productName || '';
    setNewFormData((prev) => ({
      ...prev,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerCity: order.customerCity,
      customerAddress: order.customerAddress || '',
      productName: prodName,
    }));
    setFoundOrders([]);
  };

  // Submit new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormData.customerPhone || !newFormData.description) {
      alert(isAr ? 'يرجى إدخال الهاتف وتفاصيل الشكاية' : 'Veuillez saisir le téléphone et la description');
      return;
    }

    try {
      const res = await fetch('/api/reclamations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFormData,
          orderId: selectedOrder?.id || null,
          storeId: selectedOrder?.storeId || selectedStoreId || null,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
          authorRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        setSelectedOrder(null);
        setOrderQuery('');
        setNewFormData({
          type: 'PRODUIT_DEFECTUEUX',
          priority: 'MEDIUM',
          customerName: '',
          customerPhone: '',
          customerCity: '',
          customerAddress: '',
          productName: '',
          orderNumber: '',
          description: '',
          customerDemand: '',
        });
        fetchTickets();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  // Update status or notes of selected ticket
  const handleUpdateTicketStatus = async (ticketId: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/reclamations/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolutionNotes: notes,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1-Click Generate Exchange Order
  const handleExecuteExchange = async () => {
    if (!showExchangeModal) return;
    setCreatingExchange(true);
    try {
      const res = await fetch(`/api/reclamations/${showExchangeModal.id}/create-exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeFee: Number(exchangeFee) || 0,
          newVariant: exchangeNewVariant,
          exchangeNotes: exchangeNotes,
          agentId: currentUser?.id,
          agentName: currentUser?.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          isAr
            ? `✅ تم إنشاء طلب الاستبدال بنجاح #${data.order.orderNumber}!`
            : `✅ Commande d'échange #${data.order.orderNumber} créée avec succès !`
        );
        setShowExchangeModal(null);
        setExchangeFee(0);
        setExchangeNewVariant('');
        setExchangeNotes('');
        fetchTickets();
      } else {
        alert(data.error || 'Erreur création échange');
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
    } finally {
      setCreatingExchange(false);
    }
  };

  // WhatsApp quick helper
  const getWhatsAppUrl = (ticket: ReclamationTicket) => {
    const cleanPhone = ticket.customerPhone.replace(/[^0-9]/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) {
      finalPhone = (currentCountry.code === 'SN' ? '221' : '212') + finalPhone.substring(1);
    }
    const greeting = isAr
      ? `السلام عليكم أ سيدي/لالة ${ticket.customerName}، تواصلنا معاك بخصوص طلبية #${ticket.orderNumber} والشكاية رقم ${ticket.ticketNumber}. حنا هنا باش نعاونوك ونلقاو حل يرضيك في أقرب وقت.`
      : `Bonjour M/Mme ${ticket.customerName}, nous vous contactons concernant votre commande #${ticket.orderNumber} et votre réclamation ${ticket.ticketNumber}. Notre équipe SAV est à votre disposition pour résoudre votre situation immédiatement.`;
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(greeting)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Headphones className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? 'الشكايات وخدمة ما بعد البيع (SAV)' : 'Réclamations & Service Après-Vente'}
              </h1>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
                {currentCountry.flag} {currentCountry.name}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {isAr
                ? 'تتبع شكايات الزبناء، معالجة استبدال السلع، والنزاعات مع شركات التوصيل بضغطة زر'
                : 'Gestion des litiges, retours, pièces manquantes et génération automatique d\'échanges'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'تسجيل شكاية جديدة' : 'Nouvelle Réclamation'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'مجموع الشكايات' : 'Total Dossiers'}
            </span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-400 font-semibold">{isAr ? 'تذكرة' : 'tickets'}</span>
          </div>
        </div>

        {/* En Cours / Nouveaux */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              {isAr ? 'قيد المعالجة' : 'À Traiter / En Cours'}
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">
              {metrics.nouveau + metrics.enCours}
            </span>
            <span className="text-xs text-amber-700 font-semibold">
              ({metrics.nouveau} {isAr ? 'جديدة' : 'nouveaux'})
            </span>
          </div>
        </div>

        {/* Échanges Programmés */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              {isAr ? 'استبدال مبرمج 🔄' : 'Échanges Générés'}
            </span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{metrics.echanges}</span>
            <span className="text-xs text-purple-700 font-semibold">{isAr ? 'كولية' : 'colis'}</span>
          </div>
        </div>

        {/* Taux de Résolution */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {isAr ? 'نسبة الحل والرضى' : 'Taux de Résolution'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{metrics.resolutionRate}%</span>
            <span className="text-xs text-emerald-700 font-semibold">
              ({metrics.resolu} {isAr ? 'محلولة' : 'résolus'})
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Status Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-sm border-b border-slate-100">
          {[
            { id: 'ALL', labelFr: 'Toutes', labelAr: 'الكل' },
            { id: 'NOUVEAU', labelFr: 'Nouveaux', labelAr: 'جديدة' },
            { id: 'EN_COURS', labelFr: 'En Cours', labelAr: 'قيد المعالجة' },
            { id: 'ECHANGE_PROGRAMME', labelFr: 'Échanges 🔄', labelAr: 'استبدال 🔄' },
            { id: 'RESOLU', labelFr: 'Résolus ✅', labelAr: 'تم الحل ✅' },
            { id: 'REJETE', labelFr: 'Rejetés', labelAr: 'مرفوضة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                selectedStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isAr ? tab.labelAr : tab.labelFr}
            </button>
          ))}
        </div>

        {/* Search & Sub-filters */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث برقم الكوموند، الهاتف، اسم العميل، أو رقم الشكاية...'
                  : 'Rechercher par N° commande, Téléphone, Nom client, ou N° ticket...'
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Filter by Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'جميع أنواع الشكايات' : 'Tous les motifs'}</option>
              {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {isAr ? cfg.labelAr : cfg.labelFr}
                </option>
              ))}
            </select>

            {/* Filter by Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">{isAr ? 'جميع الأولويات' : 'Toutes priorités'}</option>
              <option value="URGENT">🔴 {isAr ? 'عاجل جداً' : 'Urgent'}</option>
              <option value="HIGH">🟠 {isAr ? 'أولوية عالية' : 'Haute'}</option>
              <option value="MEDIUM">🟡 {isAr ? 'متوسطة' : 'Moyenne'}</option>
              <option value="LOW">⚪ {isAr ? 'عادية' : 'Basse'}</option>
            </select>

            <button
              onClick={() => fetchTickets()}
              className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
            <p className="text-sm font-semibold text-slate-500">
              {isAr ? 'جاري تحميل الشكايات...' : 'Chargement des réclamations...'}
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {isAr ? 'لا توجد شكايات في هذا القسم' : 'Aucune réclamation trouvée'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isAr
                ? 'كل شيء يسير على ما يرام! لا توجد شكايات معلقة حالياً تطابق الفلاتر المحددة.'
                : 'Excellent travail ! Aucun dossier litigieux ne correspond à vos critères de recherche.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const typeCfg = TYPE_CONFIG[ticket.type] || TYPE_CONFIG.AUTRE;
              const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.NOUVEAU;
              const TypeIcon = typeCfg.icon;

              return (
                <div
                  key={ticket.id}
                  className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left: Ticket ID, Type & Order Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        {ticket.ticketNumber}
                      </span>

                      {/* Commande Link */}
                      <Link
                        href={`/orders?search=${encodeURIComponent(ticket.orderNumber)}`}
                        className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>#{ticket.orderNumber}</span>
                      </Link>

                      {/* Type Badge */}
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${typeCfg.color}`}
                      >
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span>{isAr ? typeCfg.labelAr : typeCfg.labelFr}</span>
                      </span>

                      {/* Priority */}
                      {ticket.priority === 'URGENT' && (
                        <span className="text-[11px] font-black bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                          🚨 {isAr ? 'عاجل جداً' : 'Urgent'}
                        </span>
                      )}

                      {/* Store */}
                      <span className="text-xs text-slate-500 font-semibold">
                        🏪 {ticket.storeName || 'Boutique'}
                      </span>
                    </div>

                    {/* Customer & Description */}
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <span>{ticket.customerName}</span>
                        <span className="text-xs font-medium text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">{ticket.customerCity}</span>
                        {ticket.productName && (
                          <>
                            <span className="text-xs font-medium text-slate-400">•</span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              📦 {ticket.productName}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        💬 <span className="font-semibold text-slate-800">{ticket.description}</span>
                        {ticket.customerDemand && (
                          <span className="text-indigo-600 font-medium ml-2">
                            [طلب العميل: {ticket.customerDemand}]
                          </span>
                        )}
                      </p>
                    </div>

                    {/* If Exchange already generated */}
                    {ticket.exchangeOrderNumber && (
                      <div className="flex items-center gap-2 text-xs bg-purple-50 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-xl font-bold w-fit">
                        <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          {isAr ? 'تم إنشاء كولية استبدال:' : 'Commande d\'Échange générée:'}{' '}
                          <Link
                            href={`/orders?search=${encodeURIComponent(ticket.exchangeOrderNumber)}`}
                            className="underline font-black text-purple-700 ml-1"
                          >
                            #{ticket.exchangeOrderNumber}
                          </Link>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-col md:items-end gap-3 shrink-0 w-full md:w-auto">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <select
                        value={ticket.status}
                        onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
                          <option key={k} value={k}>
                            {isAr ? cfg.labelAr : cfg.labelFr}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* WhatsApp Call / Message */}
                      <a
                        href={getWhatsAppUrl(ticket)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
                        title="Contacter sur WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${ticket.customerPhone}`}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                        title="Appeler le client"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      {/* 1-Click Generate Exchange */}
                      {!ticket.exchangeOrderNumber && ticket.status !== 'RESOLU' && (
                        <button
                          onClick={() => {
                            setShowExchangeModal(ticket);
                            setExchangeNotes(ticket.description);
                          }}
                          className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إنشاء استبدال 🔄' : 'Créer Échange 🔄'}</span>
                        </button>
                      )}

                      {/* Details button */}
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                      >
                        {isAr ? 'تفاصيل' : 'Détails'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Nouvelle Réclamation */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {isAr ? 'تسجيل شكاية / ملف جديد' : 'Enregistrer une Réclamation SAV'}
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Order Lookup Input */}
            <div className="space-y-1.5 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
              <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  {isAr
                    ? 'بحث سريع برقم الكوموند أو هاتف العميل (اختياري لجلب المعلومات أوتوماتيك)'
                    : 'Recherche rapide par N° Commande ou Téléphone (Remplit tout auto)'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={orderQuery}
                  onChange={(e) => handleLookupOrder(e.target.value)}
                  placeholder="Tapez le N° de commande (ex: 1359) ou Téléphone..."
                  className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                {lookingUp && (
                  <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Suggestions */}
              {foundOrders.length > 0 && (
                <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-md divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {foundOrders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord)}
                      className="p-2.5 hover:bg-indigo-50/80 cursor-pointer transition text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-black text-slate-900">
                          #{ord.orderNumber} - {ord.customerName} ({ord.customerCity})
                        </div>
                        <div className="text-slate-500 font-medium">
                          📞 {ord.customerPhone} • 💰 {ord.totalAmount} {ord.currency} • 📦{' '}
                          {ord.items?.[0]?.productName || 'Article'}
                        </div>
                      </div>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                        Sélectionner
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedOrder && (
                <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-100/70 p-2 rounded-xl flex items-center justify-between">
                  <span>
                    ✅ Commande liée : #{selectedOrder.orderNumber} ({selectedOrder.customerName})
                  </span>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-emerald-900 underline text-[11px] cursor-pointer"
                  >
                    Changer
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'نوع المشكل / الشكاية' : 'Motif de réclamation'}
                  </label>
                  <select
                    value={newFormData.type}
                    onChange={(e) => setNewFormData({ ...newFormData, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
                      <option key={k} value={k}>
                        {isAr ? cfg.labelAr : cfg.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'درجة الأولوية' : 'Priorité'}
                  </label>
                  <select
                    value={newFormData.priority}
                    onChange={(e) => setNewFormData({ ...newFormData, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="URGENT">🔴 {isAr ? 'عاجل جداً' : 'Urgent'}</option>
                    <option value="HIGH">🟠 {isAr ? 'أولوية عالية' : 'Haute'}</option>
                    <option value="MEDIUM">🟡 {isAr ? 'متوسطة' : 'Moyenne'}</option>
                    <option value="LOW">⚪ {isAr ? 'عادية' : 'Basse'}</option>
                  </select>
                </div>
              </div>

              {/* Customer Phone & Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'هاتف العميل' : 'Téléphone Client'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFormData.customerPhone}
                    onChange={(e) => setNewFormData({ ...newFormData, customerPhone: e.target.value })}
                    placeholder="06XXXXXXXX"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'اسم العميل' : 'Nom Client'}
                  </label>
                  <input
                    type="text"
                    value={newFormData.customerName}
                    onChange={(e) => setNewFormData({ ...newFormData, customerName: e.target.value })}
                    placeholder="Nom complet"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* City & Address */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'المدينة' : 'Ville'}
                  </label>
                  <input
                    type="text"
                    value={newFormData.customerCity}
                    onChange={(e) => setNewFormData({ ...newFormData, customerCity: e.target.value })}
                    placeholder="Ex: Casablanca"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    {isAr ? 'السلعة المعنية' : 'Produit'}
                  </label>
                  <input
                    type="text"
                    value={newFormData.productName}
                    onChange={(e) => setNewFormData({ ...newFormData, productName: e.target.value })}
                    placeholder="Nom du produit"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'تفاصيل المشكل أو الشكاية' : 'Description du problème'} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newFormData.description}
                  onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                  placeholder={
                    isAr
                      ? 'اشرح المشكل: البرودوي ميت، جا مقاس صغير، الليفرور رفض يخليه يحل الكولية...'
                      : 'Expliquez en détail le litige constaté...'
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Customer Demand */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'طلب العميل (الحل المرغوب)' : 'Demande du client'}
                </label>
                <input
                  type="text"
                  value={newFormData.customerDemand}
                  onChange={(e) => setNewFormData({ ...newFormData, customerDemand: e.target.value })}
                  placeholder="Ex: Échange pointure 42, renvoi d'une pièce manquante, geste commercial..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
                >
                  {isAr ? 'حفظ الشكاية' : 'Enregistrer le ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: 1-Click Generate Exchange Order */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-700 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isAr ? 'إنشاء طلب استبدال فوري' : 'Générer une Commande d\'Échange'}
                  </h3>
                  <span className="text-xs text-purple-700 font-bold">
                    {showExchangeModal.ticketNumber} • #{showExchangeModal.orderNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowExchangeModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1 font-medium">
              <div className="font-extrabold flex items-center gap-1.5 text-purple-900">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>
                  {isAr
                    ? 'سيتم إنشاء طلب جديد في قسم الشحن مع تعليمات واضحة للموزع'
                    : 'Une nouvelle commande sera créée avec reprise obligatoire de l\'ancien colis.'}
                </span>
              </div>
              <p className="text-[11px] text-purple-800">
                Client : <strong className="text-slate-900">{showExchangeModal.customerName}</strong> (
                {showExchangeModal.customerCity}) - 📞 {showExchangeModal.customerPhone}
              </p>
            </div>

            <div className="space-y-3">
              {/* New Variant / Size */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'المقاس / اللون الجديد المراد إرساله' : 'Nouvelle taille / variante à envoyer'}
                </label>
                <input
                  type="text"
                  value={exchangeNewVariant}
                  onChange={(e) => setExchangeNewVariant(e.target.value)}
                  placeholder="Ex: Taille 42 au lieu de 40 / Couleur Noire"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Exchange Fee */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr
                    ? 'المبلغ المراد تحصيله من الزبون (0 إذا كان الاستبدال مجاني ضمن الضمان)'
                    : 'Montant à encaisser (0 si échange gratuit sous garantie)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={exchangeFee}
                    onChange={(e) => setExchangeFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <span className="text-xs font-extrabold text-slate-500 absolute right-3 top-1/2 -translate-y-1/2">
                    {showExchangeModal.currency || 'MAD'}
                  </span>
                </div>
              </div>

              {/* Instructions for courier */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'ملاحظة للموزع بخصوص استرجاع القديم' : 'Instruction pour le livreur (Reprise colis)'}
                </label>
                <textarea
                  rows={2}
                  value={exchangeNotes}
                  onChange={(e) => setExchangeNotes(e.target.value)}
                  placeholder="Reprendre impérativement l'ancien colis non endommagé..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExchangeModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                disabled={creatingExchange}
                onClick={handleExecuteExchange}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${creatingExchange ? 'animate-spin' : ''}`} />
                <span>
                  {creatingExchange
                    ? isAr
                      ? 'جاري الإنشاء...'
                      : 'Création en cours...'
                    : isAr
                    ? 'تأكيد وإنشاء الطلب 🚀'
                    : 'Confirmer et Créer la Commande 🚀'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ticket Details & Action */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                  {selectedTicket.ticketNumber}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {isAr ? 'تفاصيل ملف الشكاية' : 'Détails de la réclamation'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold block">{isAr ? 'العميل' : 'Client'}</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedTicket.customerName}
                  </span>
                  <div className="text-slate-600 mt-0.5">
                    📞 {selectedTicket.customerPhone} ({selectedTicket.customerCity})
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block">
                    {isAr ? 'الطلبية الأصلية' : 'Commande Originale'}
                  </span>
                  <Link
                    href={`/orders?search=${encodeURIComponent(selectedTicket.orderNumber)}`}
                    className="font-black text-indigo-600 hover:underline text-sm inline-flex items-center gap-1 mt-0.5"
                  >
                    #{selectedTicket.orderNumber}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <div className="text-slate-600">
                    💰 {selectedTicket.totalAmount} {selectedTicket.currency || 'MAD'}
                  </div>
                </div>
              </div>

              {/* Motif & Details */}
              <div className="space-y-1">
                <span className="text-slate-500 font-bold block">{isAr ? 'المشكل' : 'Problème'}</span>
                <p className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 font-semibold text-slate-800">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.customerDemand && (
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold block">
                    {isAr ? 'طلب العميل' : 'Demande du client'}
                  </span>
                  <p className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/60 font-semibold text-indigo-900">
                    {selectedTicket.customerDemand}
                  </p>
                </div>
              )}

              {/* Resolution Notes */}
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {isAr ? 'ملاحظات الحل / الاتفاق مع العميل' : 'Solution apportée / Accord trouvé'}
                </label>
                <textarea
                  rows={2}
                  defaultValue={selectedTicket.resolutionNotes || ''}
                  onBlur={(e) =>
                    handleUpdateTicketStatus(selectedTicket.id, selectedTicket.status, e.target.value)
                  }
                  placeholder={
                    isAr
                      ? 'سجل هنا ما تم الاتفاق عليه مع الزبون أو شركة التوصيل...'
                      : 'Notez ici la solution convenue...'
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Status Update Quick Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'RESOLU')}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد الحل (Résolu) ✅' : 'Marquer comme Résolu ✅'}</span>
                  </button>

                  <button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'REJETE')}
                    className="flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    <span>{isAr ? 'رفض الشكاية' : 'Rejeter'}</span>
                  </button>
                </div>

                <a
                  href={getWhatsAppUrl(selectedTicket)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

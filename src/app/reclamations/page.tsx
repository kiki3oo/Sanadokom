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
  EN_ATTENTE_VALIDATION: {
    labelFr: 'En attente validation',
    labelAr: 'في انتظار موافقة الإدارة ⏳',
    bg: 'bg-amber-100 text-amber-950 border-amber-300 ring-1 ring-amber-300',
    text: 'text-amber-950 font-black',
    dot: 'bg-amber-500 animate-pulse',
  },
  APPROUVE: {
    labelFr: 'Approuvé (Validé)',
    labelAr: 'معتمد من الإدارة ✅',
    bg: 'bg-teal-50 text-teal-900 border-teal-300',
    text: 'text-teal-900 font-black',
    dot: 'bg-teal-500',
  },
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
    labelAr: 'مرفوضة ✕',
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
};

export default function ReclamationsPage() {
  const { currentUser, isAdmin, isCallAgent, canViewPage } = useAuth();
  const isManager = currentUser?.role === 'LOGISTICS_MANAGER' || isAdmin;
  const { selectedStoreId, currentCountry } = useStore();
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const [tickets, setTickets] = useState<ReclamationTicket[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    enAttenteValidation: 0,
    approuve: 0,
    nouveau: 0,
    enCours: 0,
    echanges: 0,
    remboursements: 0,
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
  const [showRefundModal, setShowRefundModal] = useState<ReclamationTicket | null>(null);
  const [refundData, setRefundData] = useState({
    customerRib: '',
    customerBankName: 'CIH Bank',
    returnShippingFee: 30,
    refundMethod: 'PAR_LIVREUR',
    courierDriverPhone: '',
    processing: false,
    completedResult: null as any,
  });

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
    customerRib: '',
    customerBankName: 'CIH Bank',
    returnShippingFee: 30,
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
          totalAmount: selectedOrder?.totalAmount || 0,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
          authorRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(
          !isAdmin && !isManager
            ? (isAr ? '⏳ تم تسجيل الشكاية وهي الآن في انتظار موافقة الإدارة (Manager/Admin).' : '⏳ Réclamation enregistrée et en attente de validation par la direction.')
            : (isAr ? '✅ تم تسجيل الشكاية بنجاح.' : '✅ Réclamation créée avec succès.')
        );
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
          customerRib: '',
          customerBankName: 'CIH Bank',
          returnShippingFee: 30,
        });
        fetchTickets();
      } else {
        alert(data.error || 'Erreur lors de la création');
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  // Approve ticket (Admin / Manager)
  const handleApproveTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/reclamations/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          authorId: currentUser?.id,
          authorName: currentUser?.name,
          authorRole: currentUser?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(isAr ? '✅ تمت الموافقة على الشكاية واعتمادها بنجاح !' : '✅ Réclamation validée et approuvée avec succès !');
        fetchTickets();
      } else {
        alert(data.error || 'Erreur lors de la validation');
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  // Reject ticket (Admin / Manager)
  const handleRejectTicket = async (ticketId: string) => {
    const reason = prompt(isAr ? 'أدخل سبب رفض هذه الشكاية :' : 'Préciser le motif de rejet :');
    if (!reason) return;
    try {
      const res = await fetch(`/api/reclamations/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: reason,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
          authorRole: currentUser?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(isAr ? 'تم رفض الشكاية.' : 'Réclamation rejetée.');
        fetchTickets();
      } else {
        alert(data.error || 'Erreur lors du rejet');
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
    }
  };

  // Execute Financial Refund
  const handleConfirmRefund = async () => {
    if (!showRefundModal) return;
    setRefundData((prev) => ({ ...prev, processing: true }));
    try {
      const totalAmount = showRefundModal.totalAmount || 0;
      const fee = Number(refundData.returnShippingFee) || 0;
      const netAmount = Math.max(0, totalAmount - fee);

      const res = await fetch(`/api/reclamations/${showRefundModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EXECUTE_REFUND',
          executeRefund: true,
          netRefundAmount: netAmount,
          customerRib: refundData.customerRib,
          customerBankName: refundData.customerBankName,
          refundMethod: refundData.refundMethod,
          authorId: currentUser?.id,
          authorName: currentUser?.name,
          authorRole: currentUser?.role,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const cleanPhone = showRefundModal.customerPhone.replace(/[^0-9]/g, '');
        let finalPhone = cleanPhone;
        if (finalPhone.startsWith('0')) {
          finalPhone = (currentCountry.code === 'SN' ? '221' : '212') + finalPhone.substring(1);
        }

        // WhatsApp message for customer
        let waMsg = '';
        if (refundData.refundMethod === 'PAR_LIVREUR') {
          waMsg = isAr
            ? `السلام عليكم أ سيدي/لالة ${showRefundModal.customerName}، راه تواصلنا مع موزع شركة التوصيل باش يدوز عندك ياخد الكولية ويرجع ليك مبلغ ${netAmount} درهم كاش فـ يديك بخصوص طلبية #${showRefundModal.orderNumber}. عفاك وجد المنتوج فـ الكرتونة ديالو وشكرا.`
            : `Bonjour ${showRefundModal.customerName}, notre livreur passera récupérer le colis et vous remettre ${netAmount} DH en espèces en main propre pour la commande #${showRefundModal.orderNumber}. Merci de préparer l'article dans son emballage.`;
        } else {
          waMsg = isAr
            ? `السلام عليكم أ سيدي/لالة ${showRefundModal.customerName}، تم بنجاح تحويل مبلغ ${netAmount} درهم لحسابكم البنكي (${refundData.customerBankName} - RIB: ${refundData.customerRib}) بخصوص طلبية #${showRefundModal.orderNumber}. شكرا لثقتكم وتفهمكم.`
            : `Bonjour ${showRefundModal.customerName}, nous vous confirmons le virement de ${netAmount} DH sur votre compte (${refundData.customerBankName} - RIB: ${refundData.customerRib}) pour la commande #${showRefundModal.orderNumber}. Merci de votre confiance.`;
        }
        const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(waMsg)}`;

        // WhatsApp message for courier driver (if PAR_LIVREUR)
        let whatsappDriverUrl = '';
        if (refundData.refundMethod === 'PAR_LIVREUR') {
          const tracking = showRefundModal.trackingNumber || showRefundModal.orderNumber;
          const driverMsg = `سلام خويا عفاك بخصوص كولي رقم ${tracking} ديال الكليان ${showRefundModal.customerName} (${showRefundModal.customerCity} - ${showRefundModal.customerPhone})، عفاك دوز عندو خوذ من عندو الكولية ورجع ليه مبلغ ${netAmount} درهم كاش، وغادي تخصم فـ الفيرمون (Versement) مع الوكالة وشكرا بزاف.`;
          const cleanDriverPhone = refundData.courierDriverPhone ? refundData.courierDriverPhone.replace(/[^0-9]/g, '') : '';
          const finalDriverPhone = cleanDriverPhone.startsWith('0') ? '212' + cleanDriverPhone.substring(1) : cleanDriverPhone;
          whatsappDriverUrl = finalDriverPhone 
            ? `https://wa.me/${finalDriverPhone}?text=${encodeURIComponent(driverMsg)}`
            : `https://wa.me/?text=${encodeURIComponent(driverMsg)}`;
        }

        setRefundData((prev) => ({
          ...prev,
          processing: false,
          completedResult: {
            netAmount,
            refundMethod: refundData.refundMethod,
            whatsappUrl,
            whatsappDriverUrl,
          },
        }));
        fetchTickets();
      } else {
        alert(data.error || 'Erreur remboursement');
        setRefundData((prev) => ({ ...prev, processing: false }));
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
      setRefundData((prev) => ({ ...prev, processing: false }));
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
          authorRole: currentUser?.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? data.ticket : t)));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(data.ticket);
        }
        fetchTickets();
      } else {
        alert(data.error || 'Erreur mise à jour');
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* En Attente de Validation */}
        <div className={`p-4 rounded-2xl border transition-all shadow-2xs ${
          metrics.enAttenteValidation > 0
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 ring-2 ring-amber-200'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
              {isAr ? 'في انتظار الموافقة' : 'À Valider (Manager)'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950">{metrics.enAttenteValidation}</span>
            <span className="text-xs text-amber-700 font-bold">{isAr ? 'ملف' : 'dossiers'}</span>
          </div>
        </div>

        {/* Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              {isAr ? 'قيد المعالجة' : 'En Cours'}
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">
              {metrics.nouveau + metrics.enCours}
            </span>
            <span className="text-xs text-blue-700 font-semibold">
              ({metrics.approuve} {isAr ? 'معتمدة' : 'validés'})
            </span>
          </div>
        </div>

        {/* Échanges Programmés */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              {isAr ? 'استبدال 🔄' : 'Échanges'}
            </span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{metrics.echanges}</span>
            <span className="text-xs text-purple-700 font-semibold">{isAr ? 'كولية' : 'colis'}</span>
          </div>
        </div>

        {/* Remboursements */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
              {isAr ? 'استرجاع مالي 💰' : 'Remboursements'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-900">{metrics.remboursements}</span>
            <span className="text-xs text-teal-700 font-semibold">
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
            { id: 'EN_ATTENTE_VALIDATION', labelFr: `À Valider (${metrics.enAttenteValidation}) ⏳`, labelAr: `في انتظار الموافقة (${metrics.enAttenteValidation}) ⏳` },
            { id: 'APPROUVE', labelFr: 'Approuvés ✅', labelAr: 'معتمدة من الإدارة ✅' },
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
                  ? (tab.id === 'EN_ATTENTE_VALIDATION' ? 'bg-amber-600 text-white shadow-xs font-black' : 'bg-slate-900 text-white shadow-xs')
                  : (tab.id === 'EN_ATTENTE_VALIDATION' && metrics.enAttenteValidation > 0 ? 'bg-amber-100 text-amber-900 font-black border border-amber-300' : 'text-slate-600 hover:bg-slate-100')
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

                      {/* Approval badge if approved */}
                      {ticket.approvedByName && (
                        <span className="text-[10px] bg-teal-100 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-md font-bold">
                          ✓ معتمد: {ticket.approvedByName}
                        </span>
                      )}
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
                        {ticket.totalAmount && (
                          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {ticket.totalAmount} DH
                          </span>
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

                    {/* Pending Approval Alert Banner */}
                    {ticket.status === 'EN_ATTENTE_VALIDATION' && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                          <span>
                            {isAr
                              ? `⚠️ في انتظار موافقة الإدارة | فتحها الوكيل: ${ticket.createdByName || ticket.assignedAgentName || 'Agent'}`
                              : `⚠️ En attente de validation | Agent: ${ticket.createdByName || ticket.assignedAgentName || 'Agent'}`}
                          </span>
                        </div>
                        {(isAdmin || isManager) ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleApproveTicket(ticket.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isAr ? 'موافقة وتفعيل ✅' : 'Valider ✅'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectTicket(ticket.id)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{isAr ? 'رفض' : 'Rejeter'}</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-800 bg-white/80 px-2 py-0.5 rounded border border-amber-200">
                            🔒 قيد مراجعة الإدارة (غير معتمد بعد)
                          </span>
                        )}
                      </div>
                    )}

                    {/* If Refund already paid */}
                    {ticket.refundPaidAt && (
                      <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold w-fit">
                        <span>💰 تم تحويل {ticket.refundAmount} DH للزبون ({ticket.customerBankName || 'Virement'})</span>
                      </div>
                    )}

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
                        disabled={ticket.status === 'EN_ATTENTE_VALIDATION' && !isAdmin && !isManager}
                        onChange={(e) => handleUpdateTicketStatus(ticket.id, e.target.value)}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${statusCfg.bg} ${statusCfg.text}`}
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
                    <div className="flex items-center gap-2 flex-wrap">
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

                      {/* Remboursement Execution Button (for approved tickets of type DEMANDE_REMBOURSEMENT) */}
                      {ticket.type === 'DEMANDE_REMBOURSEMENT' && !ticket.refundPaidAt && ticket.status !== 'REJETE' && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowRefundModal(ticket);
                            setRefundData({
                              customerRib: ticket.customerRib || '',
                              customerBankName: ticket.customerBankName || 'CIH Bank',
                              returnShippingFee: ticket.returnShippingFee !== undefined ? ticket.returnShippingFee : 30,
                              refundMethod: 'PAR_LIVREUR',
                              courierDriverPhone: '',
                              processing: false,
                              completedResult: null,
                            });
                          }}
                          className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
                          title="Exécuter le remboursement financier"
                        >
                          <span>💰 {isAr ? 'إرجاع الفلوس' : 'Rembourser'}</span>
                        </button>
                      )}

                      {/* 1-Click Generate Exchange */}
                      {!ticket.exchangeOrderNumber && ticket.type !== 'DEMANDE_REMBOURSEMENT' && ticket.status !== 'RESOLU' && ticket.status !== 'EN_ATTENTE_VALIDATION' && (
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

              {/* Remboursement specific fields */}
              {newFormData.type === 'DEMANDE_REMBOURSEMENT' && (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-blue-900">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isAr ? 'معلومات الاسترجاع المالي (Remboursement)' : 'Coordonnées de Remboursement'}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-900">
                        {isAr ? 'اسم البنك / وسيلة التحويل' : 'Banque ou Moyen'}
                      </label>
                      <select
                        value={newFormData.customerBankName}
                        onChange={(e) => setNewFormData({ ...newFormData, customerBankName: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-xl font-bold text-slate-800"
                      >
                        <option value="CIH Bank">CIH Bank</option>
                        <option value="Attijariwafa Bank">Attijariwafa Bank</option>
                        <option value="Bank of Africa (BMCE)">Bank of Africa</option>
                        <option value="Banque Populaire (BCP)">Banque Populaire</option>
                        <option value="Barid Bank">Al Barid Bank</option>
                        <option value="CFG Bank">CFG Bank</option>
                        <option value="CashPlus / Wafacash">CashPlus / Wafacash</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-900">
                        {isAr ? 'مصاريف الروتور المقتطعة' : 'Frais de retour déduits'}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={newFormData.returnShippingFee}
                          onChange={(e) => setNewFormData({ ...newFormData, returnShippingFee: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-xl font-bold text-slate-800"
                        />
                        <span className="text-xs font-bold text-blue-900">DH</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-blue-900">
                      {isAr ? 'رقم الحساب البنكي للزبون (RIB - 24 رقم) أو هاتف CashPlus' : 'RIB Bancaire (24 chiffres) ou Tél CashPlus'}
                    </label>
                    <input
                      type="text"
                      value={newFormData.customerRib}
                      onChange={(e) => setNewFormData({ ...newFormData, customerRib: e.target.value })}
                      placeholder="Ex: 230 780 0000000000000000 00"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-200 rounded-xl font-mono text-slate-800"
                    />
                  </div>

                  {selectedOrder?.totalAmount && (
                    <div className="p-2 bg-white/80 rounded-xl text-[11px] text-blue-950 font-medium flex items-center justify-between">
                      <span>المبلغ الصافي للزبون:</span>
                      <strong className="text-emerald-700 font-black">
                        {Math.max(0, selectedOrder.totalAmount - (newFormData.returnShippingFee || 0))} DH
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* Agent workflow disclaimer */}
              {!isAdmin && !isManager && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                  <span className="text-base shrink-0">⏳</span>
                  <span>
                    {isAr
                      ? 'بصفتك وكيلاً (Agent)، سيتم إرسال هذا الملف في حالة "في انتظار الموافقة" للمدير أو الأدمن لمراجعته والموافقة عليه قبل تنفيذ أي عملية.'
                      : 'En tant qu\'agent, ce dossier sera créé au statut "En attente de validation" pour approbation par la direction avant exécution.'}
                  </span>
                </div>
              )}

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
                  {!isAdmin && !isManager
                    ? (isAr ? 'إرسال للموافقة (En attente)' : 'Soumettre pour validation')
                    : (isAr ? 'حفظ واعتماد الشكاية' : 'Enregistrer le ticket')}
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

      {/* MODAL: Exécution du Remboursement Financier */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-teal-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-teal-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-600/10 text-teal-700 flex items-center justify-center font-bold text-lg">
                  💰
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isAr ? 'تنفيذ الإرجاع المالي (Remboursement)' : 'Exécuter le Remboursement Client'}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {showRefundModal.ticketNumber} • Commande #{showRefundModal.orderNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRefundModal(null);
                  setRefundData({ customerRib: '', customerBankName: 'CIH Bank', returnShippingFee: 30, refundMethod: 'PAR_LIVREUR', courierDriverPhone: '', processing: false, completedResult: null });
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {refundData.completedResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      {refundData.completedResult.refundMethod === 'PAR_LIVREUR'
                        ? (isAr ? 'تم تسجيل الاسترجاع كاش عبر الموزع بنجاح !' : 'Remboursement sur place par livreur enregistré !')
                        : (isAr ? 'تم تسجيل الإرجاع المالي وإغلاق الملف بنجاح !' : 'Remboursement exécuté avec succès !')}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    {refundData.completedResult.refundMethod === 'PAR_LIVREUR'
                      ? (isAr
                          ? `الموزع غيدوز يستلم الكولية ويرجع ${refundData.completedResult.netAmount} درهم كاش للزبون. والمبلغ تم قفله وتحديث حالة الكولي (Versement Déduit) لضبط الحسابات.`
                          : `Le livreur reprend le colis et remet ${refundData.completedResult.netAmount} DH en espèces au client. Retenue enregistrée sur le versement transporteur.`)
                      : (isAr
                          ? `تم خصم مبلغ ${refundData.completedResult.netAmount} درهم وتسجيله كـ (Sortie de Caisse / Dépense) لحفظ توازن الأرباح المحاسبية بدقة.`
                          : `Montant net de ${refundData.completedResult.netAmount} DH enregistré en charge (Dépense SAV) pour préserver l'exactitude de la trésorerie.`)}
                  </p>
                </div>

                {/* WhatsApp Dispatch Buttons */}
                <div className="space-y-2">
                  {refundData.completedResult.whatsappDriverUrl && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                      <span className="text-[11px] font-bold text-amber-900 block">
                        🛵 {isAr ? 'إرسال التعليمات للموزع / الوكالة عبر WhatsApp :' : 'Envoyer la consigne au livreur sur WhatsApp :'}
                      </span>
                      <a
                        href={refundData.completedResult.whatsappDriverUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{isAr ? 'توجيه الموزع لاسترجاع الكولية وأداء الكاش' : 'Consigne Livreur (Reprise + Cash)'}</span>
                      </a>
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-900 block">
                      👤 {isAr ? 'إشعار الزبون عبر WhatsApp :' : 'Notifier le client sur WhatsApp :'}
                    </span>
                    <a
                      href={refundData.completedResult.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-2 transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isAr ? 'إرسال التأكيد للزبون عبر WhatsApp' : 'Notifier le client sur WhatsApp'}</span>
                    </a>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setShowRefundModal(null);
                      setRefundData({ customerRib: '', customerBankName: 'CIH Bank', returnShippingFee: 30, refundMethod: 'PAR_LIVREUR', courierDriverPhone: '', processing: false, completedResult: null });
                    }}
                    className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Fermer'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Client & Order details */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{showRefundModal.customerName}</span>
                    <span className="font-mono text-slate-500">{showRefundModal.customerPhone}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                    <span>{isAr ? 'المبلغ الإجمالي المدفوع (COD) :' : 'Montant total encaissé :'}</span>
                    <strong className="text-slate-900 font-black">{showRefundModal.totalAmount || 0} DH</strong>
                  </div>
                </div>

                {/* Qui effectue le remboursement */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">
                    {isAr ? 'طريقة ومصدر الاسترجاع المالي :' : 'Mode et source de remboursement :'}
                  </label>
                  <select
                    value={refundData.refundMethod}
                    onChange={(e) => setRefundData({ ...refundData, refundMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-teal-500 text-xs"
                  >
                    <option value="PAR_LIVREUR">🛵 موزع شركة التوصيل (استرجاع كاش عند استلام الكولي / يخصم من Versement)</option>
                    <option value="VIREMENT_BANCAIRE">🏛️ تحويل بنكي مباشر من الشركة (Virement RIB)</option>
                    <option value="CASHPLUS">💸 عبر وكالة تحويل أموال (CashPlus / Wafacash)</option>
                    <option value="ESPECE">💵 نقداً بالوكالة / المقر (Espèces)</option>
                  </select>
                </div>

                {/* Return fee deduction */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      {isAr ? 'مصاريف الاسترجاع المقتطعة' : 'Frais de retour à déduire'}
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={refundData.returnShippingFee}
                        onChange={(e) => setRefundData({ ...refundData, returnShippingFee: Number(e.target.value) })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                      <span className="font-bold text-slate-600">DH</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">
                      {isAr ? 'الصافي للزبون' : 'Net client'}
                    </label>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl font-black text-emerald-800 text-sm">
                      {Math.max(0, (showRefundModal.totalAmount || 0) - Number(refundData.returnShippingFee))} DH
                    </div>
                  </div>
                </div>

                {/* PAR_LIVREUR specific fields */}
                {refundData.refundMethod === 'PAR_LIVREUR' ? (
                  <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2.5 text-xs text-amber-950">
                    <div className="flex items-center gap-1.5 font-black text-amber-900">
                      <Truck className="w-4 h-4 text-amber-600" />
                      <span>{isAr ? 'استرجاع كاش فـ البلاصة بواسطة الموزع' : 'Reprise & Remboursement sur Place'}</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      {isAr
                        ? 'الموزع كيدوز عند الزبون ياخد الكولية ويرجع ليه المبلغ كاش فـ البلاصة. والمبلغ كيتخصم أوتوماتيكياً من مستحقات الشحن (Versement Transporteur).'
                        : 'Le livreur repasse chez le client, récupère le colis et lui remet le montant cash sur place. La société de livraison déduit le montant du versement.'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="font-bold block text-[11px] text-slate-700 mb-0.5">
                          📱 هاتف الموزع / الوكالة (WhatsApp) :
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 0612345678"
                          value={refundData.courierDriverPhone}
                          onChange={(e) => setRefundData({ ...refundData, courierDriverPhone: e.target.value })}
                          className="w-full p-2 bg-white border border-amber-300 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="font-bold block text-[11px] text-slate-700 mb-0.5">
                          📦 رقم التتبع (Tracking) :
                        </label>
                        <input
                          type="text"
                          disabled
                          value={showRefundModal.trackingNumber || showRefundModal.orderNumber}
                          className="w-full p-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Bank / RIB fields */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">
                        {isAr ? 'اسم البنك' : 'Banque'}
                      </label>
                      <input
                        type="text"
                        value={refundData.customerBankName}
                        onChange={(e) => setRefundData({ ...refundData, customerBankName: e.target.value })}
                        placeholder="Ex: CIH Bank"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">
                        {isAr ? 'رقم الحساب (RIB - 24 رقم)' : 'RIB Client (24 chiffres)'}
                      </label>
                      <input
                        type="text"
                        value={refundData.customerRib}
                        onChange={(e) => setRefundData({ ...refundData, customerRib: e.target.value })}
                        placeholder="24 chiffres"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Net refund summary */}
                <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl flex items-center justify-between text-teal-950">
                  <span className="font-bold">
                    {isAr ? 'المبلغ الصافي المراد إرجاعه للزبون :' : 'Montant net à rembourser au client :'}
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {Math.max(0, (showRefundModal.totalAmount || 0) - Number(refundData.returnShippingFee))} DH
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(null)}
                    disabled={refundData.processing}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Annuler'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRefund}
                    disabled={refundData.processing}
                    className="px-5 py-2 text-xs font-black bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {refundData.processing ? (
                      <span>{isAr ? 'جاري التسجيل...' : 'Traitement...'}</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{isAr ? '✓ تأكيد العملية وتسجيل الاسترجاع' : '✓ Confirmer & Enregistrer'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

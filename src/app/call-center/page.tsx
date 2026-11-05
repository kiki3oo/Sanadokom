'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import {
  PhoneCall,
  PhoneForwarded,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  User,
  MapPin,
  Package,
  AlertCircle,
  Filter,
  Search,
  ExternalLink,
  History,
  Check,
  Zap,
  Lock,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Send,
  Navigation,
  Trophy,
  Gift,
  TrendingUp,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Plus,
  Truck,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import ManualOrderModal from '@/components/ManualOrderModal';
import BulkImportOrdersModal from '@/components/BulkImportOrdersModal';
import UtmBadge from '@/components/UtmBadge';
import CallCenterLivePresenceBar from '@/components/CallCenterLivePresenceBar';
import { useLanguage } from '@/context/LanguageContext';
import { usePresence } from '@/context/PresenceContext';

export default function CallCenterPage() {
  const { selectedStoreId } = useStore();
  const { currentUser, isCallAgent, isManager, isAdmin, canViewPage } = useAuth();
  const canManageStrategy = (isAdmin || isManager) && !isCallAgent;
  const { t, isRtl } = useLanguage();
  const { reportActivity } = usePresence();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, NO_ANSWER, CALLBACK, ALL
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [onlyMine, setOnlyMine] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Locking and Anti-Collision State
  const [locks, setLocks] = useState<Record<string, { agentId: string; agentName: string; lockedAt: number }>>({});
  const [isLockedByOther, setIsLockedByOther] = useState<{ agentName: string; lockedAt: number } | null>(null);
  const [collisionAlert, setCollisionAlert] = useState<{ orderNumber: string; agentName: string } | null>(null);
  const [lockingOrderId, setLockingOrderId] = useState<string | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);

  // Call Action Form State
  const [callNotes, setCallNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [cancelReason, setCancelReason] = useState('Trop cher');
  const [customCity, setCustomCity] = useState('');
  const [customAddress, setCustomAddress] = useState('');

  // UpSell & Vente Additionnelle State
  const [hasUpSell, setHasUpSell] = useState(false);
  const [upsellDetails, setUpsellDetails] = useState('');
  const [upsellNewTotal, setUpsellNewTotal] = useState('');
  const [upsellBonusFee, setUpsellBonusFee] = useState('5'); // Default +5 MAD bonus

  const agentUpsellFee = React.useMemo(() => {
    if (!currentUser?.permissions) return 5.0;
    try {
      const p = typeof currentUser.permissions === 'string' ? JSON.parse(currentUser.permissions) : currentUser.permissions;
      if (p.upsellCommissionFee !== undefined && !isNaN(parseFloat(p.upsellCommissionFee))) {
        return parseFloat(p.upsellCommissionFee);
      }
    } catch (e) {}
    return 5.0;
  }, [currentUser]);

  React.useEffect(() => {
    setUpsellBonusFee(String(agentUpsellFee));
  }, [agentUpsellFee]);

  // Quick Callback Presets Helpers
  const setQuickCallback = (minutesFromNow: number) => {
    const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setCallbackDate(localISOTime);
  };

  const setCallbackSpecificTime = (targetHour: number, daysFromNow = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(targetHour, 0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    setCallbackDate(localISOTime);
  };

  // Callback Intelligence
  const callbacksList = React.useMemo(() => {
    return orders.filter((o) => (o.status === 'CALLBACK' || o.subStatus === 'CALLBACK') && o.callbackAt);
  }, [orders]);

  const dueCallbacksCount = React.useMemo(() => {
    const now = new Date().getTime();
    return callbacksList.filter((o) => new Date(o.callbackAt).getTime() <= now).length;
  }, [callbacksList]);

  // Stock Availability Filtering & Detection
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'>('ALL');

  const displayedOrders = React.useMemo(() => {
    return orders.filter((order) => {
      if (stockFilter === 'ALL') return true;
      const isStockAvailable = (order.items || []).every(
        (i: any) => !i.product || i.product.stockQuantity >= (i.quantity || 1)
      );
      if (stockFilter === 'IN_STOCK') return isStockAvailable;
      if (stockFilter === 'OUT_OF_STOCK') return !isStockAvailable;
      return true;
    });
  }, [orders, stockFilter]);

  const outOfStockOrdersCount = React.useMemo(() => {
    return orders.filter((order) => {
      return (order.items || []).some(
        (i: any) => i.product && i.product.stockQuantity < (i.quantity || 1)
      );
    }).length;
  }, [orders]);

  const selectedOrderOutOfStock = React.useMemo(() => {
    if (!selectedOrder) return false;
    return (selectedOrder.items || []).some(
      (i: any) => i.product && i.product.stockQuantity < (i.quantity || 1)
    );
  }, [selectedOrder]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);
  const knownOrderIdsRef = React.useRef<Set<string>>(new Set());
  const isFirstLoadRef = React.useRef<boolean>(true);

  // Crystal Clear Bell Chime Synthesizer (Works 100% offline via Web Audio API)
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Bell Tone 1: E5 (659.25Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Bell Tone 2: G5 (783.99Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.12);
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.8);

      // Bell Tone 3: C6 (1046.50Hz) Shimmer
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1046.50, now + 0.25);
      gain3.gain.setValueAtTime(0.3, now + 0.25);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.25);
      osc3.stop(now + 1.2);
    } catch (e) {
      console.error('Audio chime error:', e);
    }
  };

  const fetchLocks = async () => {
    try {
      const res = await fetch('/api/call-center/lock');
      const data = await res.json();
      if (data.success && data.locks) {
        setLocks(data.locks);
      }
    } catch (e) {
      console.error('Error fetching locks:', e);
    }
  };

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let url = `/api/orders?storeId=${selectedStoreId}`;
      if (currentUser?.id) {
        url += `&requestAgentId=${currentUser.id}`;
      }
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      if (onlyMine && currentUser?.id) {
        url += `&agentId=${currentUser.id}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        const fetchedOrders: any[] = json.orders || [];

        // Detect brand-new incoming orders
        if (!isFirstLoadRef.current && statusFilter === 'PENDING') {
          const freshOrder = fetchedOrders.find(
            (o) => !knownOrderIdsRef.current.has(o.id) && o.status === 'PENDING'
          );

          if (freshOrder) {
            setNewOrderAlert(freshOrder);
            if (soundEnabled) {
              playNotificationSound();
            }
          }
        }

        fetchedOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        isFirstLoadRef.current = false;
        setOrders(fetchedOrders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchLocks();

    // 1. Ultra-Fast Sub-50ms Lock Synchronization via SSE
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/call-center/lock/stream');
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.locks) {
            setLocks(data.locks);
          }
        } catch (e) {
          console.error('SSE lock parse error:', e);
        }
      };
      eventSource.onerror = () => {
        // Fallback polling handles it seamlessly
      };
    } catch (e) {
      console.error('SSE initialization error:', e);
    }

    // 2. High-Frequency Fast Polling (2.5s) for instant sync & new order detection
    const interval = setInterval(() => {
      fetchOrders(true);
      fetchLocks();
    }, 2500);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, [selectedStoreId, statusFilter, search, onlyMine, currentUser?.id, soundEnabled]);

  // Keep lock alive while order is being treated & release on window close
  useEffect(() => {
    if (!selectedOrder?.id || !currentUser?.id || isLockedByOther) return;

    // Renew lock every 25s
    const renewInterval = setInterval(() => {
      fetch('/api/call-center/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOCK',
          orderId: selectedOrder.id,
          agentId: currentUser.id,
          agentName: currentUser.name,
        }),
      }).catch(console.error);
    }, 25000);

    const handleBeforeUnload = () => {
      if (selectedOrder?.id && currentUser?.id) {
        navigator.sendBeacon(
          '/api/call-center/lock',
          JSON.stringify({
            action: 'UNLOCK',
            orderId: selectedOrder.id,
            agentId: currentUser.id,
          })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(renewInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedOrder?.id, currentUser?.id, isLockedByOther]);

  const handleOpenOrder = async (order: any) => {
    if (!currentUser?.id) return;

    // 1. Instant Client-Side Check: if already locked by someone else, block immediately!
    const existingLock = locks[order.id];
    if (existingLock && existingLock.agentId !== currentUser.id) {
      setCollisionAlert({
        orderNumber: order.orderNumber,
        agentName: existingLock.agentName,
      });
      return;
    }

    setLockingOrderId(order.id);

    try {
      // 2. Atomic Server-Side Verification BEFORE opening the order drawer
      const res = await fetch('/api/call-center/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOCK',
          orderId: order.id,
          agentId: currentUser.id,
          agentName: currentUser.name,
        }),
      });
      const data = await res.json();

      if (!data.success && data.lockedBy) {
        // COLLISION DETECTED: Another agent grabbed it at the same moment!
        setLocks((prev) => ({ ...prev, [order.id]: data.lockedBy }));
        setCollisionAlert({
          orderNumber: order.orderNumber,
          agentName: data.lockedBy.agentName || 'un autre agent',
        });
        setLockingOrderId(null);
        return;
      }

      // Lock granted! Safe to open order now
      setSelectedOrder(order);
      setCallNotes(order.agentNotes || '');
      setCallbackDate(order.callbackAt ? new Date(order.callbackAt).toISOString().slice(0, 16) : '');
      setCustomCity(order.customerCity || '');
      setCustomAddress(order.customerAddress || '');

      setHasUpSell(!!order.upsell);
      setUpsellDetails(order.upsell || '');
      setUpsellNewTotal(order.totalAmount ? String(order.totalAmount) : '');
      setUpsellBonusFee(String(agentUpsellFee));
      setIsLockedByOther(null);

      reportActivity(`En appel avec #${order.orderNumber}`, order.id, order.orderNumber);
      fetchLocks();
    } catch (e) {
      console.error('Lock acquisition error:', e);
      alert('Erreur lors de la prise en charge de la commande');
    } finally {
      setLockingOrderId(null);
    }
  };

  const handleCloseOrder = async () => {
    reportActivity('Sur le Centre d\'Appel');
    if (selectedOrder && currentUser?.id && !isLockedByOther) {
      try {
        await fetch('/api/call-center/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'UNLOCK',
            orderId: selectedOrder.id,
            agentId: currentUser.id,
          }),
        });
        fetchLocks();
      } catch (e) {
        console.error('Unlock error:', e);
      }
    }
    setSelectedOrder(null);
    setIsLockedByOther(null);
  };

  const handleTakeNextLead = async () => {
    if (!currentUser?.id) return;
    setLoadingNext(true);
    try {
      let url = `/api/call-center/next-lead?agentId=${currentUser.id}&agentName=${encodeURIComponent(currentUser.name)}`;
      if (selectedStoreId !== 'ALL') {
        url += `&storeId=${selectedStoreId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
        setCallNotes(data.order.agentNotes || '');
        setCallbackDate(data.order.callbackAt ? new Date(data.order.callbackAt).toISOString().slice(0, 16) : '');
        setCustomCity(data.order.customerCity || '');
        setCustomAddress(data.order.customerAddress || '');
        setHasUpSell(!!data.order.upsell);
        setUpsellDetails(data.order.upsell || '');
        setUpsellNewTotal(data.order.totalAmount ? String(data.order.totalAmount) : '');
        setUpsellBonusFee(String(agentUpsellFee));
        setIsLockedByOther(null);
        fetchOrders();
        fetchLocks();
      } else {
        alert(data.message || 'Aucun lead en attente pour le moment.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNext(false);
    }
  };

  const handleCallAction = async (status: string) => {
    if (!selectedOrder) return;

    if (status === 'CONFIRMED' && selectedOrderOutOfStock) {
      const confirmPreorder = window.confirm(
        "⚠️ ALERTE RUPTURE DE STOCK :\n\n" +
        "Ce produit est actuellement en Rupture de Stock (0 pièce disponible) dans votre magasin.\n\n" +
        "Voulez-vous vraiment confirmer cette commande en tant que Précommande (en attente d'arrivage fournisseur) ?"
      );
      if (!confirmPreorder) {
        return;
      }
    }

    setIsProcessing(true);

    try {
      const payload: any = {
        orderId: selectedOrder.id,
        agentId: currentUser?.id,
        status,
        notes: status === 'CANCELLED' ? `Annulé: ${cancelReason}. ${callNotes}` : callNotes,
        customerCity: customCity,
        customerAddress: customAddress,
        durationSec: 60, // recorded call session
      };

      if (status === 'CONFIRMED' && hasUpSell) {
        payload.upsell = upsellDetails || 'Offre Pack UpSell';
        payload.upsellBonus = parseFloat(upsellBonusFee) || 5;
        if (upsellNewTotal) {
          payload.newTotalAmount = parseFloat(upsellNewTotal);
        }
      }

      if (status === 'CALLBACK' && callbackDate) {
        payload.callbackAt = callbackDate;
      }

      const res = await fetch('/api/call-center/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        reportActivity('Sur le Centre d\'Appel');
        setSelectedOrder(null);
        setIsLockedByOther(null);
        fetchOrders();
        fetchLocks();
      } else {
        alert(data.error || 'Erreur lors de l enregistrement');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Phone Masking Helper (Protects customer data from being bypassed/stolen from table)
  const maskPhoneNumber = (phone?: string | null): string => {
    if (!phone) return '-';
    const clean = String(phone).trim();
    if (clean.length <= 6) return '••••••';
    const start = clean.slice(0, 4);
    const end = clean.slice(-2);
    return `${start} •••• ${end}`;
  };

  // WhatsApp click handler
  const getWhatsAppLink = (phone: string, customerName: string, orderNumber: string) => {
    let clean = String(phone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '212' + clean.slice(1);
    if (!clean.startsWith('212')) clean = '212' + clean;
    const msg = encodeURIComponent(
      `Bonjour ${customerName || ''}, nous vous contactons concernant votre commande #${orderNumber || ''}. Merci de confirmer vos coordonnées de livraison.`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  };

  const extractRefusalReason = (notes?: string | null): string | null => {
    if (!notes) return null;
    const match = notes.match(/\[Motif(?:\sRefus)?:\s*([^\]]+)\]/i);
    return match ? match[1].trim() : null;
  };

  const extractNotesWithoutMotif = (notes?: string | null): string => {
    if (!notes) return '';
    return notes.replace(/\[Motif(?:\sRefus)?:\s*[^\]]+\]/i, '').trim();
  };

  // WhatsApp 1-Click Quick Templates in Moroccan Dialect / Standard
  const sendWhatsAppTemplate = (
    templateType: 'NO_ANSWER' | 'ADDRESS' | 'SHIPPED' | 'UPSELL' | 'RESCUE_CLIENT' | 'RESCUE_REFUS'
  ) => {
    if (!selectedOrder) return;
    let clean = String(selectedOrder.customerPhone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '212' + clean.slice(1);
    if (!clean.startsWith('212')) clean = '212' + clean;

    let text = '';
    const name = selectedOrder.customerName || 'Cher client';
    const num = selectedOrder.orderNumber;

    if (templateType === 'NO_ANSWER') {
      text = `السلام عليكم ${name}، حاولنا الاتصال بكم هاتفياً بخصوص طلبيتكم رقم #${num} لكن تعذر الوصول إليكم. المرجو تأكيد موعد مناسب للاتصال أو الرد هنا لتأكيد شحن طلبيتكم. شكراً!`;
      setCallNotes((prev) => (prev ? `${prev} | [WhatsApp Pas de réponse envoyé]` : '[WhatsApp Pas de réponse envoyé]'));
    } else if (templateType === 'ADDRESS') {
      text = `مرحباً ${name}، بخصوص طلبيتكم رقم #${num}، المرجو إرسال العنوان المضبوط مع اسم الحي أو إرسال الموقع (Localisation GPS) لتسليمها لكم في أقرب وقت. شكراً!`;
      setCallNotes((prev) => (prev ? `${prev} | [WhatsApp Demande Adresse/GPS envoyée]` : '[WhatsApp Demande Adresse/GPS envoyée]'));
    } else if (templateType === 'SHIPPED') {
      text = `مرحباً ${name}، طلبيتكم رقم #${num} خرجت الآن للتسليم مع الموزع. المرجو إبقاء هاتفكم متاحاً لاستلام الشحنة اليوم. شكراً لاختياركم لنا!`;
      setCallNotes((prev) => (prev ? `${prev} | [WhatsApp Avis Expédition envoyé]` : '[WhatsApp Avis Expédition envoyé]'));
    } else if (templateType === 'UPSELL') {
      text = `مرحباً ${name}، بخصوص طلبكم #${num}، لدينا عرض حصري اليوم: احصلوا على القطعة الإضافية بنصف السعر مع شحن مجاني! هل ترغبون في الاستفادة من هذا العرض قبل الشحن؟`;
      setCallNotes((prev) => (prev ? `${prev} | [WhatsApp Offre UpSell envoyée]` : '[WhatsApp Offre UpSell envoyée]'));
    } else if (templateType === 'RESCUE_CLIENT') {
      text = `السلام عليكم ${name}، معاك مصلحة المتابعة والتوصيل بخصوص طلبيتكم رقم #${num}. الموزع حاول يتصل بكم لتسليم الطلبية ديالكم ولكن تعذر عليه الوصول إليكم. واش مازال باغين الطلبية باش نبروغراميو ليكم التوصيل ف الوقت لي يناسبكم؟ المرجو تأكيد الموعد والعنوان. شكراً!`;
      setCallNotes((prev) => (prev ? `${prev} | [WhatsApp Sauvetage Colis envoyé]` : '[WhatsApp Sauvetage Colis envoyé]'));
    } else if (templateType === 'RESCUE_REFUS') {
      const reason = extractRefusalReason(selectedOrder.agentNotes)?.toLowerCase() || '';
      if (reason.includes('cher') || reason.includes('budget')) {
        text = `السلام عليكم ${name}، معاك مصلحة المتابعة بخصوص طلبيتكم رقم #${num}. عرفنا بلي جاك الثمن غالي شوية، وبغينا نفرحوك ونديرو معاك تخفيض استثنائي يرضيك ونعاودو نصيفطوها ليك مجاناً وبدون أي مصاريف إضافية. واش نعتامدوها ليك؟`;
      } else if (reason.includes('conforme') || reason.includes('qualité') || reason.includes('défectueux')) {
        text = `السلام عليكم ${name}، معاك مصلحة المتابعة بخصوص طلبيتكم رقم #${num}. سمعنا بلي كاين شي ملاحظة على المنتوج فاش جابو ليك الموزع. بغينا نطمئنوك راه عندك كامل الحق تفتح الكولي وتفحصو قبل ما تخلص، وعندنا ضمانة الجودة 100%. واش نتواصلو معاك نلقاو حل يرضيك؟`;
      } else if (reason.includes('retard') || reason.includes('délai')) {
        text = `السلام عليكم ${name}، كنعتذروا بزاف على التعطيلة فالتوصيل ديال طلبيتكم #${num}. حنا واجدين دابا نبرمجوا ليك إرسال مستعجل وتوصلك فالموعد لي يناسبك بالضبط، واش نأكدو ليك التوصيل؟`;
      } else {
        text = `السلام عليكم ${name}، معاك مصلحة المتابعة والتوصيل بخصوص طلبيتكم رقم #${num}. لاحظنا بلي تعذر التسليم ديالها من طرف الموزع. بغينا غير نفهمو واش كاين شي ملاحظة نقدروا نعالجوها أو نبرمجوا التوصيل فوقت آخر يناسبك؟ شكراً ليك.`;
      }
      setCallNotes((prev) => (prev ? `${prev} | [WhatsApp Traitement Refus envoyé]` : '[WhatsApp Traitement Refus envoyé]'));
    }

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const getCourierWhatsAppUrl = (order: any) => {
    if (!order) return '#';
    const tracking = order.trackingNumber || order.orderNumber;
    const client = order.customerName;
    const city = customCity || order.customerCity || '';
    const phone = order.customerPhone || '';
    const address = customAddress || order.customerAddress || '';
    const dateText = callbackDate ? new Date(callbackDate).toLocaleDateString('fr-FR') : (order.callbackAt ? new Date(order.callbackAt).toLocaleDateString('fr-FR') : 'غدا');
    const note = callNotes || order.agentNotes || 'الكليان واجد ومأكد الطلبية';
    const msg = `سلام خويا الموزع 🛵، بخصوص الكولي رقم ${tracking} ديال الكليان ${client} (${city} - ${phone} ${address ? `- ${address}` : ''}): راه تواصلنا معاه هاتفياً وأكد باغي الكوموند وغادي يكون واجد ${dateText}. الملاحظة: ${note}. عفاك بروغرامي ليه التوصيل وشكرا بزاف.`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const handleRescueAction = async (rescueSubStatus: string) => {
    if (!selectedOrder) return;
    if (rescueSubStatus === 'LIVREUR_REPORTE' && !callbackDate) {
      alert('المرجو تحديد تاريخ ووقت الموعد الجديد (Date de report) أولاً لتجنب إزعاج الزبون بالمكالمات.');
      return;
    }
    setIsProcessing(true);
    try {
      let finalStatus = selectedOrder.status;
      if (rescueSubStatus === 'RETOUR_DEFINITIF') {
        finalStatus = 'CANCELLED';
      } else if (rescueSubStatus === 'EN_COURS_LIVRAISON') {
        finalStatus = 'IN_TRANSIT';
      }

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: finalStatus,
          subStatus: rescueSubStatus,
          agentNotes:
            callNotes ||
            (rescueSubStatus === 'SAUVE_A_RELIVRER'
              ? 'Client confirme et demande la relivraison'
              : rescueSubStatus === 'EN_COURS_LIVRAISON'
              ? 'Colis sorti avec le livreur aujourd\'hui'
              : rescueSubStatus === 'LIVREUR_REPORTE'
              ? 'Livraison reportée à la demande du client'
              : 'Refus définitif'),
          callbackAt: callbackDate || null,
          customerCity: customCity || selectedOrder.customerCity,
          customerAddress: customAddress || selectedOrder.customerAddress,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Agent Suivi',
          userRole: currentUser?.role || 'CALL_AGENT',
        }),
      });

      const data = await res.json();
      if (data.success) {
        reportActivity('Sur le Centre d\'Appel');
        handleCloseOrder();
        fetchOrders();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Due Callbacks High-Priority Alert Banner */}
      {dueCallbacksCount > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>{dueCallbacksCount} Rappel(s) client doivent être traités maintenant !</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  PRIORITÉ
                </span>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                Des clients ont demandé d'être rappelés à cette heure. Appelez-les avant que le prospect ne refroidisse.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('CALLBACK')}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Voir la file des Rappels ({callbacksList.length}) →
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('cc.title')}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
              {orders.length} leads
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('cc.subtitle')}
          </p>
        </div>

        {/* Speed-to-lead action, Sound Toggle & Tabs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* SPEED TO LEAD BUTTON */}
          <button
            onClick={handleTakeNextLead}
            disabled={loadingNext}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            title={t('btn.takeNextLead')}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>{loadingNext ? '...' : t('btn.takeNextLead')}</span>
          </button>

          {/* + NOUVELLE COMMANDE MANUELLE (WHATSAPP / APPEL / RECOMMANDATION) */}
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title={t('btn.manualOrder')}
          >
            <Plus className="w-4 h-4" />
            <span>{t('btn.manualOrder')}</span>
          </button>

          {/* 📁 IMPORT EXCEL / CSV EN MASSE - Admin & Manager */}
          {!isCallAgent && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title={t('btn.bulkImport', '📁 Import Excel / CSV')}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{t('btn.bulkImport', '📁 Import Excel / CSV')}</span>
            </button>
          )}

          {/* ⚙️ Stratégie & Rotation Leads (Pas de Réponse) - Visible uniquement pour Admin & Manager */}
          {canManageStrategy && (
            <Link
              href="/confirmation?tab=settings"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title={t('conf.strategyBtn', 'Régler le délai d\'heures et le nombre de tentatives')}
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>⚙️ {t('nav.strategySettings', 'Stratégie Relance')}</span>
            </Link>
          )}

          {/* Sound Notification Bell Toggle & Test */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playNotificationSound();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={soundEnabled ? t('btn.soundOn') : t('btn.soundOff')}
            >
              {soundEnabled ? (
                <>
                  <BellRing className="w-3.5 h-3.5 animate-pulse text-white" />
                  <span className="hidden sm:inline">{t('btn.soundOn')}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('btn.soundOff')}</span>
                </>
              )}
            </button>

            <button
              onClick={playNotificationSound}
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Ding-Dong"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'PENDING' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('cc.newLeads')}
            </button>
            <button
              onClick={() => setStatusFilter('NO_ANSWER')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'NO_ANSWER' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('cc.noAnswerTab')}
            </button>
            <button
              onClick={() => setStatusFilter('CALLBACK')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                statusFilter === 'CALLBACK' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{t('cc.callbackTab')}</span>
              {callbacksList.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    dueCallbacksCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {callbacksList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('SUIVI_LIVRAISON')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                statusFilter === 'SUIVI_LIVRAISON'
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{t('cc.suiviTab', '🚨 Suivi & Sauvetage Colis')}</span>
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('status.all')}
            </button>
          </div>

          {/* Stock Availability Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-md transition-all ${
                stockFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {isRtl ? 'كل المخزون' : 'Tous stocks'}
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                stockFilter === 'IN_STOCK' ? 'bg-emerald-600 text-white shadow-xs font-black' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
              title="Afficher uniquement les commandes avec stock disponible"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{isRtl ? '📦 متوفر' : '📦 En Stock'}</span>
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                stockFilter === 'OUT_OF_STOCK' ? 'bg-rose-600 text-white shadow-xs font-black' : 'text-rose-700 hover:bg-rose-50'
              }`}
              title="Commandes avec articles en rupture de stock"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{isRtl ? '🚫 نفاد المخزون' : '🚫 Ruptures'}</span>
              {outOfStockOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[9px] font-black">
                  {outOfStockOrdersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time New Order Sound Notification Banner */}
      {newOrderAlert && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300 border-2 border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center animate-bounce shrink-0">
              <BellRing className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2 flex-wrap">
                <span>🔔 {t('cc.newOrderReceived', 'Nouvelle Commande Reçue ! (Tél. a sonné)')}</span>
                <span className="bg-white text-emerald-900 text-xs font-mono px-2.5 py-0.5 rounded-md font-black shadow-xs">
                  {newOrderAlert.orderNumber}
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                {t('table.customer')} : <strong className="text-white">{newOrderAlert.customerName}</strong> • {newOrderAlert.customerCity || t('cc.cityNotSpecified', 'Ville non spécifiée')} • <strong className="text-amber-200">{newOrderAlert.totalAmount} {newOrderAlert.store?.currency || 'MAD'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                handleOpenOrder(newOrderAlert);
                setNewOrderAlert(null);
              }}
              className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>{t('cc.treatNow', '⚡ Traiter Maintenant')}</span>
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-xs font-bold"
              title={t('cc.closeAlert', 'Fermer l\'alerte')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Live Agents Presence Bar (Admin & Manager only) */}
      {isManager && <CallCenterLivePresenceBar />}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('cc.searchPlaceholder', 'Rechercher par numéro de téléphone (06...), nom du client, ville, ou réf commande...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
        />
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">{t('cc.loadingLeads', 'Chargement des leads...')}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Check className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t('cc.noLeads', 'Aucun lead en attente !')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('cc.noLeadsDesc', 'Tous les leads ont été traités ou aucun filtre ne correspond.')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{t('table.order')}</th>
                  <th className="py-3 px-4">{t('table.customer')} & {t('table.phone')}</th>
                  <th className="py-3 px-4">{t('table.products')}</th>
                  <th className="py-3 px-4">{t('table.amount')} (COD)</th>
                  <th className="py-3 px-4">{t('table.status')}</th>
                  <th className="py-3 px-4 text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedOrders.map((order) => {
                  const isStockAvailable = (order.items || []).every(
                    (i: any) => !i.product || i.product.stockQuantity >= i.quantity
                  );
                  const isOutOfStock = !isStockAvailable;
                  const lockInfo = locks[order.id];
                  const isLockedByMe = lockInfo && lockInfo.agentId === currentUser?.id;
                  const isLockedByOtherAgent = lockInfo && lockInfo.agentId !== currentUser?.id;

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isOutOfStock
                          ? 'bg-rose-50/50 border-l-4 border-l-rose-500 hover:bg-rose-100/50'
                          : isLockedByMe
                          ? 'bg-emerald-50/60 border-l-4 border-l-emerald-500 hover:bg-emerald-50/80'
                          : isLockedByOtherAgent
                          ? 'bg-amber-50/60 border-l-4 border-l-amber-500 hover:bg-amber-100/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                          {isOutOfStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              <span>{isRtl ? '🚫 نفاد المخزون' : '🚫 RUPTURE (0 en stock)'}</span>
                            </span>
                          )}
                          {lockInfo && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isLockedByMe
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              }`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>
                                {isLockedByMe
                                  ? t('cc.inCallWithYou', 'En cours avec vous')
                                  : `${t('cc.inCallWith', 'En appel par')} ${lockInfo.agentName}`}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {order.callbackAt && (
                          <div className="mt-1">
                            {new Date(order.callbackAt).getTime() <= Date.now() ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                                <Clock className="w-2.5 h-2.5 text-rose-600" />
                                <span>Rappel en retard ({new Date(order.callbackAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                <Clock className="w-2.5 h-2.5 text-blue-600" />
                                <span>Rappel: {new Date(order.callbackAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </span>
                            )}
                          </div>
                        )}
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
                        <div className="mt-0.5">
                          {currentUser?.role === 'ADMIN' ? (
                            <span className="text-slate-500 font-mono text-[11px]">{order.customerPhone}</span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-slate-600 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200"
                              title="Numéro sécurisé. Cliquez sur 'Traiter' pour ouvrir et appeler le client."
                            >
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                              <span>{maskPhoneNumber(order.customerPhone)}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{order.customerCity || t('cc.cityNotSpecified', 'Ville non spécifiée')}</span>
                        </div>

                        {/* Smart Customer Profile & Duplicate Badge */}
                        <div className="mt-1.5 flex items-center gap-1">
                          {order.customerProfile?.isDuplicate ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shadow-2xs"
                              title={order.customerProfile.duplicateReason || 'Doublon détecté'}
                            >
                              {t('cc.duplicateSuspect', '🚨 Doublon Suspect')}
                            </span>
                          ) : order.customerProfile?.reliabilityBadge === 'VIP' ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                              title={`Client VIP : ${order.customerProfile.deliveredCount} commande(s) livrée(s)`}
                            >
                              {t('cc.vipClient', '⭐ VIP')} ({order.customerProfile.deliveredCount})
                            </span>
                          ) : order.customerProfile?.reliabilityBadge === 'RECURRING' ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs"
                              title={`Client récurrent : ${order.customerProfile.totalOrders} commandes`}
                            >
                              {t('cc.recurringClient', '🔁 Récurent')} ({order.customerProfile.totalOrders})
                            </span>
                          ) : order.customerProfile?.reliabilityBadge === 'RISKY' ? (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs"
                              title={`Attention : ${order.customerProfile.cancelledCount} commande(s) annulée(s)/retournée(s)`}
                            >
                              {t('cc.riskyClient', '⚠️ À Risque')} ({order.customerProfile.cancelledCount})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              {t('cc.firstOrder', '🆕 1ère Commande')}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {(order.items || []).map((item: any) => (
                          <div key={item.id} className="flex items-center gap-1 text-[11px] text-slate-700">
                            <span className="font-semibold">{item.quantity}x</span>
                            <span className="truncate max-w-[150px]">{item.product?.name || 'Produit'}</span>
                            {item.product && item.product.stockQuantity <= 5 && (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded">
                                (Stock: {item.product.stockQuantity})
                              </span>
                            )}
                          </div>
                        ))}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {order.totalAmount} {order.store?.currency || 'MAD'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          <PhoneCall className="w-3 h-3 text-slate-500" />
                          <span>{order.callAttempts} {t('cc.callsCount', 'appel(s)')}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {order.subStatus === 'LIVREUR_REPORTE' ? (
                            <>
                              <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-300">
                                {t('cc.subStatus.postponed', '⏳ Reporté')}
                              </span>
                              {order.callbackAt && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100/70 text-blue-900 border border-blue-200">
                                  📅 {new Date(order.callbackAt).toLocaleDateString('fr-FR')} {new Date(order.callbackAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  {new Date(order.callbackAt) > new Date() && ` (${t('cc.pending', 'En attente')})`}
                                </span>
                              )}
                            </>
                          ) : order.subStatus === 'SAUVE_A_RELIVRER' ? (
                            <>
                              <span className="inline-block px-2.5 py-1 rounded-full font-black text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                {t('cc.subStatus.savedToDeliver', '🟢 Sauvé à Relivrer')}
                              </span>
                              {order.callbackAt && (
                                <span className="inline-block text-[10px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  📅 {new Date(order.callbackAt).toLocaleDateString('fr-FR')}
                                </span>
                              )}
                            </>
                          ) : order.subStatus === 'EN_COURS_LIVRAISON' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] bg-cyan-50 text-cyan-800 border border-cyan-300 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-ping" />
                              <span>{t('cc.subStatus.outForDelivery', '🛵 Sorti en livraison')}</span>
                            </span>
                          ) : order.subStatus === 'LIVREUR_INJOIGNABLE' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-300">
                              {t('cc.subStatus.unreachable', '📵 Injoignable')}
                            </span>
                          ) : order.subStatus === 'LIVREUR_REFUSE' ? (
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[11px] bg-rose-50 text-rose-800 border border-rose-300">
                                {t('cc.subStatus.courierRefusal', '⛔ Refus Livreur')}
                              </span>
                              {extractRefusalReason(order.agentNotes) && (
                                <span className="text-[10px] font-bold text-rose-950 bg-rose-100/90 px-1.5 py-0.5 rounded border border-rose-200">
                                  {extractRefusalReason(order.agentNotes)}
                                </span>
                              )}
                            </div>
                          ) : order.subStatus === 'LIVREUR_ADRESSE_INVALIDE' ? (
                            <span className="inline-block px-2.5 py-1 rounded-full font-bold text-[11px] bg-purple-50 text-purple-800 border border-purple-200">
                              {t('cc.subStatus.invalidAddress', '📍 Adresse Invalide')}
                            </span>
                          ) : (
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                                order.status === 'PENDING'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : order.status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : order.status === 'NO_ANSWER'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : order.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : order.status === 'SHIPPED' || order.status === 'IN_TRANSIT'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {order.status === 'PENDING'
                                ? t('status.pending', 'Nouveau')
                                : order.status === 'CONFIRMED'
                                ? t('status.confirmed', 'Confirmé')
                                : order.status === 'NO_ANSWER'
                                ? t('status.noAnswer', 'Pas de réponse')
                                : order.status === 'CANCELLED'
                                ? t('status.cancelled', 'Annulé')
                                : order.status === 'SHIPPED'
                                ? t('status.shipped', 'Expédié')
                                : order.status === 'IN_TRANSIT'
                                ? t('status.inTransit', 'En cours')
                                : order.status}
                            </span>
                          )}

                          {/* Fallback callback date if no substatus */}
                          {order.status === 'CALLBACK' && order.callbackAt && !order.subStatus && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                              📅 {new Date(order.callbackAt).toLocaleDateString('fr-FR')} {new Date(order.callbackAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct WhatsApp (Admin Only) */}
                          {currentUser?.role === 'ADMIN' && (
                            <a
                              href={getWhatsAppLink(order.customerPhone, order.customerName, order.orderNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Contacter sur WhatsApp (Admin)"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          {/* Action Button */}
                          {isLockedByOtherAgent ? (
                            <div className="flex items-center gap-1">
                              <button
                                disabled
                                className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-extrabold flex items-center gap-1.5 text-xs opacity-90 cursor-not-allowed shadow-2xs select-none"
                                title={`🔒 Commande en cours de traitement par ${lockInfo.agentName}. Accès bloqué pour éviter un double appel.`}
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span className="truncate max-w-[130px]">En cours ({lockInfo.agentName})</span>
                              </button>
                              {currentUser?.role === 'ADMIN' && (
                                <button
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setIsLockedByOther(lockInfo);
                                  }}
                                  className="p-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 text-xs font-semibold"
                                  title="Consulter en lecture seule (Admin)"
                                >
                                  👁️
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenOrder(order)}
                              disabled={lockingOrderId === order.id}
                              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-xs text-xs cursor-pointer ${
                                isOutOfStock && !isLockedByMe
                                  ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                                  : isLockedByMe
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                              } disabled:opacity-50`}
                            >
                              {lockingOrderId === order.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>{t('cc.verifying', 'Vérification...')}</span>
                                </>
                              ) : isLockedByMe ? (
                                <>
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>{t('cc.continue', 'Continuer')}</span>
                                </>
                              ) : isOutOfStock ? (
                                <>
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>{isRtl ? '⚠️ اتصال (نفاد)' : '⚠️ Rupture (Appeler)'}</span>
                                </>
                              ) : (
                                <>
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>{t('cc.treat', 'Traiter')}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation & Call Action Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {t('cc.orderSheet', 'Fiche de Traitement Appel')}
                </span>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{t('table.order')} #{selectedOrder.orderNumber}</span>
                  <span className="text-xs font-normal text-slate-500">
                    ({selectedOrder.store?.name || t('nav.stock', 'Boutique')})
                  </span>
                </h2>
              </div>

              <button
                onClick={handleCloseOrder}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
                title={t('common.close', 'Fermer')}
              >
                ✕
              </button>
            </div>

            {/* Lock collision warning banner */}
            {isLockedByOther && (
              <div className="mb-4 bg-amber-50 border-2 border-amber-400 p-4 rounded-xl flex items-start gap-3 text-amber-900 shadow-xs animate-pulse">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold text-sm block text-amber-900">
                    🔒 {t('cc.inCallWith', 'En appel par')} {isLockedByOther.agentName}
                  </span>
                  <p className="mt-1 text-amber-800 font-medium">
                    {t('cc.lockNoticeDesc', 'Cette commande est actuellement traitée par votre collègue pour éviter tout appel en doublon. Les actions de confirmation et de modification sont bloquées.')}
                  </p>
                </div>
              </div>
            )}

            {/* Duplicate Detection Alert Banner */}
            {selectedOrder.customerProfile?.isDuplicate && (
              <div className="mb-4 bg-amber-50 border-2 border-amber-400 p-3.5 rounded-xl flex items-start gap-3 shadow-xs animate-in fade-in">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-extrabold text-amber-950 flex items-center gap-2">
                    <span>🚨 ATTENTION : COMMANDE POTENTIELLEMENT EN DOUBLON</span>
                    <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                      Vérification requise
                    </span>
                  </div>
                  <p className="mt-1 text-amber-900 leading-relaxed font-semibold">
                    {selectedOrder.customerProfile.duplicateReason || 'Ce client a déjà passé une commande similaire récemment.'}
                  </p>
                  <p className="mt-1 text-amber-800 text-[11px]">
                    💡 <strong>Conseil pour l'appel :</strong> Demandez au client s'il souhaite regrouper ces articles dans un seul colis ou s'il s'agit d'une double validation involontaire sur le site.
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled Callback Warning Banner (Do Not Disturb Before Scheduled Date) */}
            {selectedOrder.callbackAt && new Date(selectedOrder.callbackAt) > new Date() && (
              <div className="mb-4 bg-blue-50 border-2 border-blue-400 p-3.5 rounded-xl flex items-start gap-3 shadow-xs animate-in fade-in">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-extrabold text-blue-950 flex items-center gap-2">
                    <span>⏳ موعد مبرمج لإعادة الاتصال / التسليم (Reporté)</span>
                    <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full text-[10px] font-black">
                      Ne pas déranger avant
                    </span>
                  </div>
                  <p className="mt-1 text-blue-900 leading-relaxed font-semibold">
                    هذا الزبون طلب تأجيل الاتصال / التسليم إلى يوم :{' '}
                    <strong className="text-blue-950 underline font-black">
                      {new Date(selectedOrder.callbackAt).toLocaleDateString('fr-FR')} مع{' '}
                      {new Date(selectedOrder.callbackAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                    . المرجو عدم إزعاجه قبل هذا الوقت المحدد احتراماً لرغبته.
                  </p>
                </div>
              </div>
            )}

            {/* Fiche Historique Client & Profil d'Achat */}
            <div className="mb-4 bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>Historique & Profil d'Achat Client</span>
                      {selectedOrder.customerProfile?.reliabilityBadge === 'VIP' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                          ⭐ Client VIP
                        </span>
                      )}
                      {selectedOrder.customerProfile?.reliabilityBadge === 'RECURRING' && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-300">
                          🔁 Client Récurent
                        </span>
                      )}
                      {selectedOrder.customerProfile?.reliabilityBadge === 'RISKY' && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300">
                          ⚠️ Client à Risque
                        </span>
                      )}
                      {selectedOrder.customerProfile?.reliabilityBadge === 'NEW' && (
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                          🆕 1ère Commande
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Suivi des achats précédents, confirmations et remarques
                    </span>
                  </div>
                </div>

                {/* Summary Badges */}
                <div className="flex items-center gap-1.5 text-[10px] font-bold flex-wrap justify-end">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                    Total : {selectedOrder.customerProfile?.totalOrders || 1} Cde(s)
                  </span>
                  {(selectedOrder.customerProfile?.deliveredCount || 0) > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{selectedOrder.customerProfile.deliveredCount} Livrée(s)</span>
                    </span>
                  )}
                  {(selectedOrder.customerProfile?.cancelledCount || 0) > 0 && (
                    <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>{selectedOrder.customerProfile.cancelledCount} Annulée(s)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Past Orders Details List */}
              {(!selectedOrder.customerProfile?.previousOrders || selectedOrder.customerProfile.previousOrders.length === 0) ? (
                <div className="text-center py-2 text-xs text-slate-400 italic">
                  C'est la première commande de ce client chez nous. Aucun historique antérieur enregistré.
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Commandes Antérieures Détectées ({selectedOrder.customerProfile.previousOrders.length}) :
                  </span>
                  <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto pr-1">
                    {selectedOrder.customerProfile.previousOrders.map((prevOrder: any) => {
                      const isDelivered = prevOrder.status === 'DELIVERED';
                      const isConfirmed = ['CONFIRMED', 'SHIPPED', 'IN_TRANSIT'].includes(prevOrder.status);
                      const isCancelled = ['CANCELLED', 'RETURNED'].includes(prevOrder.status);

                      return (
                        <div key={prevOrder.id} className="py-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 font-mono">#{prevOrder.orderNumber}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isDelivered ? 'bg-emerald-100 text-emerald-800' :
                                isConfirmed ? 'bg-blue-100 text-blue-800' :
                                isCancelled ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {prevOrder.status}
                              </span>
                              {prevOrder.storeName && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  🛍️ {prevOrder.storeName}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-bold text-slate-700">
                              {prevOrder.totalAmount} {prevOrder.storeCurrency || 'MAD'}
                            </div>
                          </div>

                          {/* Items in previous order */}
                          <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-1.5">
                            {(prevOrder.items || []).map((it: any, idx: number) => (
                              <span key={idx} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                                📦 {it.quantity}x {it.productName || 'Article'}
                              </span>
                            ))}
                            <span className="text-[10px] text-slate-400 self-center ml-auto">
                              Le {new Date(prevOrder.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>

                          {/* Agent notes from that previous call */}
                          {prevOrder.agentNotes && (
                            <div className="mt-1 bg-amber-50/70 p-1.5 rounded text-[11px] text-amber-900 border border-amber-200">
                              <span className="font-bold">📝 Remarque précédente ({prevOrder.agentName || 'Agent'}) :</span>{' '}
                              <span>{prevOrder.agentNotes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-4">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">{t('cc.customerName', 'Nom du client')}</span>
                <span className="text-sm font-bold text-slate-900">{selectedOrder.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">{t('cc.phone', 'Téléphone')}</span>
                {isLockedByOther && currentUser?.role !== 'ADMIN' ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg text-amber-800 font-mono text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-bold">{maskPhoneNumber(selectedOrder.customerPhone)}</span>
                    <span className="text-[10px] text-amber-600 font-semibold">({t('cc.inCallWith', 'En appel par')} {isLockedByOther.agentName})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${selectedOrder.customerPhone}`}
                      className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{selectedOrder.customerPhone}</span>
                    </a>
                    <a
                      href={getWhatsAppLink(
                        selectedOrder.customerPhone,
                        selectedOrder.customerName,
                        selectedOrder.orderNumber
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Editable City & Address */}
              <div>
                <label className="text-slate-400 block font-semibold mb-1">{t('cc.deliveryCity', 'Ville de livraison')}</label>
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block font-semibold mb-1">{t('cc.exactAddress', 'Adresse exacte')}</label>
                <input
                  type="text"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Traffic Attribution & UTM */}
              <div className="sm:col-span-2 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-500 font-semibold text-[11px]">{t('cc.attribution', 'Attribution & Campagne Marketing :')}</span>
                <UtmBadge
                  source={selectedOrder.source}
                  utmSource={selectedOrder.utmSource}
                  utmCampaign={selectedOrder.utmCampaign}
                  adSet={selectedOrder.adSet}
                />
              </div>
            </div>

            {/* Delivery Rescue & Courier Coordination Module */}
            {(statusFilter === 'SUIVI_LIVRAISON' ||
              ['SHIPPED', 'IN_TRANSIT'].includes(selectedOrder.status) ||
              selectedOrder.subStatus?.startsWith('LIVREUR_') ||
              selectedOrder.subStatus === 'SAUVE_A_RELIVRER' ||
              selectedOrder.subStatus === 'EN_COURS_LIVRAISON') && (
              <div className="mb-4 bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 border-2 border-rose-300 rounded-xl p-4 shadow-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2.5 border-b border-rose-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                        <span>{t('cc.rescueCell', '🚨 Cellule de Sauvetage de Colis (Suivi Livraison)')}</span>
                        {selectedOrder.subStatus === 'SAUVE_A_RELIVRER' && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {t('cc.subStatus.savedToDeliver', '🟢 Sauvé à Relivrer')}
                          </span>
                        )}
                        {selectedOrder.subStatus === 'EN_COURS_LIVRAISON' && (
                          <span className="bg-cyan-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>{t('cc.subStatus.outForDelivery', '🛵 Sorti en livraison')}</span>
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-rose-800 font-medium">
                        {t('cc.rescueDesc', 'Suivi des mouvements du colis avec le livreur et confirmation avec le client.')}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.trackingNumber && (
                    <span className="text-[11px] font-mono font-bold bg-white px-2 py-1 rounded border border-rose-200 text-slate-800">
                      {t('cc.trackingNum', 'N° Suivi :')} {selectedOrder.trackingNumber}
                    </span>
                  )}
                </div>

                {/* Incident details badge */}
                <div className="mt-3 p-2.5 rounded-lg bg-white/90 border border-rose-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">{t('cc.logisticState', 'État logistique :')}</span>
                    <span className="px-2 py-0.5 rounded-full font-black text-[11px] bg-rose-100 text-rose-900 border border-rose-300">
                      {selectedOrder.subStatus === 'EN_COURS_LIVRAISON' && '🛵 Colis sorti avec le livreur aujourd\'hui (En tournée)'}
                      {selectedOrder.subStatus === 'LIVREUR_INJOIGNABLE' && '📵 Client Injoignable au moment de la livraison'}
                      {selectedOrder.subStatus === 'LIVREUR_REFUSE' && '⛔ Client hésitant / Refus à la livraison'}
                      {selectedOrder.subStatus === 'LIVREUR_REPORTE' && '⏳ Livraison reportée / Client absent'}
                      {selectedOrder.subStatus === 'LIVREUR_ADRESSE_INVALIDE' && '📍 Adresse incomplète ou erronée'}
                      {selectedOrder.subStatus === 'SAUVE_A_RELIVRER' && '🟢 Sauvé par l\'agent (Attente relivraison)'}
                      {!['LIVREUR_INJOIGNABLE', 'LIVREUR_REFUSE', 'LIVREUR_REPORTE', 'LIVREUR_ADRESSE_INVALIDE', 'SAUVE_A_RELIVRER', 'EN_COURS_LIVRAISON'].includes(selectedOrder.subStatus) && (selectedOrder.subStatus || 'Incident de livraison en cours')}
                    </span>
                  </div>
                  {selectedOrder.courierStatus && (
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {t('cc.courierLabel', 'Transporteur :')} {selectedOrder.courierStatus}
                    </span>
                  )}
                </div>

                {/* Refusal Reason & Investigation Banner */}
                {(selectedOrder.subStatus === 'LIVREUR_REFUSE' || extractRefusalReason(selectedOrder.agentNotes)) && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-100/90 border border-rose-300 text-xs text-rose-950 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 font-black">
                        <span>⛔ {t('cc.refusalReasonDelivery', 'سبب الرفض عند التوصيل :')}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[11px] shadow-2xs">
                          {extractRefusalReason(selectedOrder.agentNotes) || 'Refus non précisé'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => sendWhatsAppTemplate('RESCUE_REFUS')}
                        className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Envoyer un message WhatsApp ciblé sur ce motif de refus pour convaincre le client"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{t('cc.rescueReasonWhatsapp', '💬 رسالة خاصة بهذا السبب (بالدارجة)')}</span>
                      </button>
                    </div>
                    {extractNotesWithoutMotif(selectedOrder.agentNotes) && (
                      <p className="text-[11px] text-rose-900 bg-white/80 p-2 rounded-lg border border-rose-200 font-medium">
                        📝 ملاحظة: {extractNotesWithoutMotif(selectedOrder.agentNotes)}
                      </p>
                    )}
                  </div>
                )}

                {/* Direct Sauvetage Actions for Agent */}
                <div className="mt-3 flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppTemplate('RESCUE_CLIENT')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{t('cc.rescueClientWhatsapp', '💬 WhatsApp Sauvetage Client (بالدارجة)')}</span>
                  </button>

                  <a
                    href={getCourierWhatsAppUrl(selectedOrder)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    title="Envoyer les nouvelles instructions directement au livreur sur WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('cc.courierWhatsapp', '🛵 WhatsApp au Livreur (Message Prêt)')}</span>
                  </a>
                </div>

                {/* Reschedule Date Picker for Postponed / Rescued Delivery */}
                <div className="mt-3 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{t('cc.rescheduleDateLabel', 'تاريخ الموعد الجديد (Date de Report) :')}</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={callbackDate}
                    onChange={(e) => setCallbackDate(e.target.value)}
                    className="bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Actions de Sauvetage */}
                <div className="mt-3.5 pt-3 border-t border-rose-200/60 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <button
                    type="button"
                    disabled={isProcessing || !!isLockedByOther}
                    onClick={() => handleRescueAction('SAUVE_A_RELIVRER')}
                    className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('cc.savedConfirmed', '🟢 Sauvé ! Confirme')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || !!isLockedByOther}
                    onClick={() => handleRescueAction('EN_COURS_LIVRAISON')}
                    className="py-2.5 px-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Marquer que le colis est sorti avec le livreur aujourd'hui"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t('cc.outForDelivery', '🛵 Sorti en tournée')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || !!isLockedByOther}
                    onClick={() => handleRescueAction('LIVREUR_REPORTE')}
                    className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Reporter la livraison à la date sélectionnée ci-dessus"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('cc.postponeDate', '⏳ Reporter (Date)')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || !!isLockedByOther}
                    onClick={() => handleRescueAction('LIVREUR_INJOIGNABLE')}
                    className="py-2.5 px-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PhoneForwarded className="w-3.5 h-3.5" />
                    <span>{t('cc.unreachableLivreur', '🟡 Injoignable')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing || !!isLockedByOther}
                    onClick={() => handleRescueAction('RETOUR_DEFINITIF')}
                    className="py-2.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t('cc.refusalFinal', '🔴 Refus Définitif')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick WhatsApp Templates Bar (1-Click Moroccan Dispatch) */}
            {!isLockedByOther && (
              <div className="mb-4 bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>{t('cc.quickWhatsapp', 'Modèles WhatsApp Rapides (1-Clic)')}</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                    {t('cc.sendToCustomer', 'Envoyer au client')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppTemplate('NO_ANSWER')}
                    className="p-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-left transition-all shadow-2xs group cursor-pointer"
                    title="Envoyer: Pas de réponse / Rappel"
                  >
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 group-hover:text-emerald-700">
                      <span>📞</span>
                      <span>Pas de Réponse</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">حاولنا الاتصال بكم</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => sendWhatsAppTemplate('ADDRESS')}
                    className="p-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-left transition-all shadow-2xs group cursor-pointer"
                    title="Demande d'adresse exacte ou localisation GPS"
                  >
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 group-hover:text-emerald-700">
                      <span>📍</span>
                      <span>Adresse & GPS</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">تأكيد العنوان والموقع</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => sendWhatsAppTemplate('SHIPPED')}
                    className="p-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-left transition-all shadow-2xs group cursor-pointer"
                    title="Avis: La commande est avec le livreur"
                  >
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 group-hover:text-emerald-700">
                      <span>🚚</span>
                      <span>Colis en Route</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">الطلبية مع الموزع</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => sendWhatsAppTemplate('UPSELL')}
                    className="p-2 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-100 text-left transition-all shadow-2xs group cursor-pointer"
                    title="Proposer une offre spéciale / 2ème pièce"
                  >
                    <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 group-hover:text-emerald-700">
                      <span>🎁</span>
                      <span>Offre UpSell</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">عرض القطعة الثانية</div>
                  </button>
                </div>
              </div>
            )}

            {/* Out of Stock Warning Banner inside Call Drawer */}
            {selectedOrderOutOfStock && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex items-start gap-3 shadow-2xs">
                <div className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-900">
                    {isRtl ? '⚠️ تنبيه: السلعة في حالة نفاد كلي من المخزن (Rupture) !' : '⚠️ ATTENTION : PRODUIT EN RUPTURE DE STOCK (0 pièce disponible) !'}
                  </h4>
                  <p className="text-[11px] text-rose-700 mt-1 font-medium leading-relaxed">
                    {isRtl
                      ? 'هذا المنتج غير متوفر حالياً في المخزن. لا تؤكد الطلبية للشحن الفوري إلا إذا اتفقت مع الزبون على حجزها كـ (طلب مسبق / Précommande) في انتظار وصول الشحنة من المورد.'
                      : 'Cet article n\'est pas disponible actuellement en stock. Ne confirmez pas à moins qu\'il s\'agisse d\'une précommande avec arrivage convenu avec le client.'}
                  </p>
                </div>
              </div>
            )}

            {/* Order Items & Stock Check */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                {t('cc.itemsStock', 'Articles & Vérification du Stock')}
              </h3>
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item: any) => {
                  const stockOk = !item.product || item.product.stockQuantity >= item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-slate-400" />
                        <div>
                          <span className="font-bold text-slate-900">{item.product?.name}</span>
                          <span className="text-slate-400 block text-[11px]">SKU: {item.product?.sku}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {item.quantity} x {item.unitPrice} {selectedOrder?.store?.currency || 'MAD'} = {item.quantity * item.unitPrice} {selectedOrder?.store?.currency || 'MAD'}
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          {stockOk ? (
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t('cc.inStock', 'En Stock')} ({item.product?.stockQuantity} disp.)</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                              <AlertCircle className="w-3 h-3" />
                              <span>{t('cc.outOfStock', 'Rupture de Stock')} ({item.product?.stockQuantity} disp.)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive UpSell / Vente Additionnelle Module */}
            <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasUpSell}
                    onChange={(e) => setHasUpSell(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{t('cc.upsellSuccess', 'UpSell Réussi / Vente Additionnelle')}</span>
                  </span>
                </label>

                {hasUpSell && (
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Gift className="w-3 h-3 text-indigo-600" />
                    <span>+{upsellBonusFee} MAD Prime Agent</span>
                  </span>
                )}
              </div>

              {hasUpSell && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-100 animate-in fade-in duration-150">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                      {t('cc.addedOffer', 'Offre ajoutée (Pack/Pièce)')}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pack 2 pièces (+1 offert)"
                      value={upsellDetails}
                      onChange={(e) => setUpsellDetails(e.target.value)}
                      className="w-full text-xs bg-white border border-indigo-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                      {t('cc.newTotal', 'Nouveau Montant Total')} ({selectedOrder?.store?.currency || 'MAD'})
                    </label>
                    <input
                      type="number"
                      placeholder={selectedOrder ? String(selectedOrder.totalAmount) : '399'}
                      value={upsellNewTotal}
                      onChange={(e) => setUpsellNewTotal(e.target.value)}
                      className="w-full text-xs bg-white border border-indigo-300 rounded-lg p-2 font-bold text-indigo-950 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                      {t('cc.agentBonus', 'Prime UpSell Agent')} ({selectedOrder?.store?.currency || 'MAD'})
                    </label>
                    {isAdmin ? (
                      <input
                        type="number"
                        step="0.5"
                        value={upsellBonusFee}
                        onChange={(e) => setUpsellBonusFee(e.target.value)}
                        className="w-full text-xs bg-white border border-indigo-300 rounded-lg p-2 font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-500"
                      />
                    ) : (
                      <div className="w-full text-xs bg-emerald-50 border border-emerald-300 rounded-lg p-2 font-black text-emerald-800 flex items-center justify-between">
                        <span>+{upsellBonusFee || agentUpsellFee} {selectedOrder?.store?.currency || 'MAD'}</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">
                          🔒 {t('cc.fixedPerDelivered', 'Fixe / Livré')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Agent Call Notes */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('cc.callNotesLabel', 'Notes de l agent')}</label>
              <textarea
                rows={2}
                placeholder={t('cc.notesPlaceholder', 'Ex: Le client a demandé une livraison après 16h au bureau...')}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick Status Action Buttons */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700">{t('cc.chooseOutcome', 'Choisir le résultat de l appel :')}</div>

              {/* Exact OptiTrav Status Picker */}
              <div className="mb-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('cc.preciseStatus', 'Statut d\'appel précis')}
                </label>
                <select
                  disabled={isProcessing || !!isLockedByOther}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Confirmé') handleCallAction('CONFIRMED');
                    else if (val === 'Annulé') handleCallAction('CANCELLED');
                    else if (val === 'Numéro faux') handleCallAction('WRONG_NUMBER');
                    else {
                      setCallNotes((prev) => `${prev} (${val})`);
                      handleCallAction('NO_ANSWER');
                    }
                  }}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">{t('cc.chooseQuickStatus', '-- Choisir un statut rapide --')}</option>
                  <option value="Confirmé">✅ {t('status.confirmed', 'Confirmé')}</option>
                  <option value="pas de réponse">📞 {t('status.noAnswer', 'Pas de réponse')}</option>
                  <option value="Appel 1">📞 {t('cc.callsCount', 'Appel')} 1</option>
                  <option value="Appel 2">📞 {t('cc.callsCount', 'Appel')} 2</option>
                  <option value="Appel 3">📞 {t('cc.callsCount', 'Appel')} 3</option>
                  <option value="Boîte Vocal">📼 Boîte Vocale</option>
                  <option value="Injoignable">📵 {t('cc.subStatus.unreachable', 'Injoignable')}</option>
                  <option value="Appels + Message Whatssap">💬 Appels + Message WhatsApp</option>
                  <option value="Numéro faux">🚫 {t('cc.reasons.other', 'Numéro faux')}</option>
                  <option value="Annulé">❌ {t('status.cancelled', 'Annulé par le client')}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. CONFIRM BUTTON */}
                <button
                  type="button"
                  disabled={isProcessing || !!isLockedByOther}
                  onClick={() => handleCallAction('CONFIRMED')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('btn.confirm')}</span>
                </button>

                {/* 2. NO ANSWER BUTTON */}
                <button
                  type="button"
                  disabled={isProcessing || !!isLockedByOther}
                  onClick={() => handleCallAction('NO_ANSWER')}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <PhoneForwarded className="w-4 h-4" />
                  <span>{t('status.noAnswer')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 3. CALLBACK WITH QUICK PRESETS */}
                <div className="space-y-1.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('cc.scheduleCallback', 'Programmer un Rappel')}</span>
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold">⚡ Presets 1-clic</span>
                  </div>
                  {/* 1-Click Preset Buttons */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={isProcessing || !!isLockedByOther}
                      onClick={() => setQuickCallback(30)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      +30m
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !!isLockedByOther}
                      onClick={() => setQuickCallback(60)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      +1h
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !!isLockedByOther}
                      onClick={() => setQuickCallback(120)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      +2h
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !!isLockedByOther}
                      onClick={() => setCallbackSpecificTime(17)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      Auj. 17h
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !!isLockedByOther}
                      onClick={() => setCallbackSpecificTime(10, 1)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-blue-800 hover:bg-blue-100 border border-blue-200 cursor-pointer shadow-2xs"
                    >
                      Demain 10h
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="datetime-local"
                      disabled={isProcessing || !!isLockedByOther}
                      value={callbackDate}
                      onChange={(e) => setCallbackDate(e.target.value)}
                      className="w-full text-[11px] font-semibold bg-white border border-blue-300 rounded-lg px-2 py-1.5 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      disabled={isProcessing || !!isLockedByOther}
                      onClick={() => handleCallAction('CALLBACK')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t('btn.callback')}</span>
                    </button>
                  </div>
                </div>

                {/* 4. CANCEL */}
                <div className="flex gap-2">
                  <select
                    disabled={isProcessing || !!isLockedByOther}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full text-[11px] border border-slate-300 rounded-xl px-2 py-2 disabled:opacity-40"
                  >
                    <option value="Trop cher">{t('cc.reasons.expensive')}</option>
                    <option value="A changé d avis">{t('cc.reasons.changedMind')}</option>
                    <option value="Commandé ailleurs">{t('cc.reasons.orderedElsewhere')}</option>
                    <option value="Pas de budget">{t('cc.reasons.noBudget')}</option>
                    <option value="Autre motif">{t('cc.reasons.other')}</option>
                  </select>
                  <button
                    type="button"
                    disabled={isProcessing || !!isLockedByOther}
                    onClick={() => handleCallAction('CANCELLED')}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{t('btn.cancel')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Anti-Collision Alert Modal */}
      {collisionAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
              <ShieldAlert className="w-9 h-9 animate-bounce text-amber-600" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 mb-2">
              ⚠️ نظام الحماية المضاد للتصادم (Anti-Collision System)
            </span>

            <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              الطلبية #{collisionAlert.orderNumber} قيد المعالجة الآن!
            </h3>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
              عذراً، زميلك <strong className="text-amber-700 font-black">"{collisionAlert.agentName}"</strong> دخل إلى هذه الطلبية منذ لحظات وهو في اتصال هاتفي مع الزبون الآن.
            </p>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>تم إقفال الطلبية تلقائياً لمنع الاتصال بالزبون مرتين.</span>
              </div>
              <div className="text-slate-500">
                يمكنك اختيار طلبية أخرى غير محجوزة أو الضغط على "الطلبية التالية".
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCollisionAlert(null)}
              className="mt-5 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              فهمت، اختيار طلبية أخرى (D'accord) ➔
            </button>
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
        defaultStatus="PENDING"
      />
    </div>
  );
}

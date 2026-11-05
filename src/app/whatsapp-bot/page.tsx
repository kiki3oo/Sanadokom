'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Bot,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Settings,
  Send,
  Smartphone,
  ShieldCheck,
  TrendingUp,
  Zap,
  Check,
  X,
  PhoneCall,
  Flame,
  ArrowRight,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { WhatsAppBotConfig, WhatsAppMessageLog } from '@/lib/whatsappBot';

export default function WhatsAppBotPage() {
  const { currentCountry, selectedStoreId } = useStore();
  const { isAdmin } = useAuth();
  const { t, language } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'SIMULATOR' | 'LOGS' | 'SETTINGS'>('SIMULATOR');
  const [config, setConfig] = useState<WhatsAppBotConfig | null>(null);
  const [stats, setStats] = useState({
    totalSent: 0,
    confirmed: 0,
    cancelled: 0,
    modificationReq: 0,
    upsellCount: 0,
    confirmationRate: 0,
    cancellationRate: 0,
  });
  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live Simulator State
  const [simOrders, setSimOrders] = useState<any[]>([]);
  const [selectedSimOrderId, setSelectedSimOrderId] = useState<string>('');
  const [simChatMessages, setSimChatMessages] = useState<
    { sender: 'BOT' | 'CUSTOMER'; text: string; time: string; buttons?: { id: string; label: string }[] }[]
  >([]);
  const [isSimulatingResponse, setIsSimulatingResponse] = useState(false);
  const [simOrderDetails, setSimOrderDetails] = useState<any | null>(null);

  // Real WhatsApp Test State
  const [testPhone, setTestPhone] = useState('+212662169208');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string; isSimulator?: boolean } | null>(null);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestFeedback(null);
    try {
      const res = await fetch('/api/whatsapp-bot/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setTestFeedback({ success: true, message: data.message });
      } else {
        setTestFeedback({ success: false, message: data.error, isSimulator: data.isSimulatorNotice });
      }
    } catch (e: any) {
      setTestFeedback({ success: false, message: e.message || 'Erreur réseau' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Fetch config and orders
  const loadData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStoreId && selectedStoreId !== 'ALL') {
        params.append('storeId', selectedStoreId);
      }
      if (currentCountry?.code) {
        params.append('country', currentCountry.code);
      }

      const res = await fetch(`/api/whatsapp-bot/config?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setStats(data.stats);
        setLogs(data.logs || []);
      }

      // Fetch sample orders for simulator scoped to selected country / store
      const ordersRes = await fetch(`/api/orders?status=PENDING&${params.toString()}&limit=15`);
      const ordersData = await ordersRes.json();
      if (ordersData.success && ordersData.orders?.length > 0) {
        setSimOrders(ordersData.orders);
        setSelectedSimOrderId(ordersData.orders[0].id);
        initSimulatorWithOrder(ordersData.orders[0], data.config);
      } else {
        // Fallback demo order respecting the selected country
        const isSn = currentCountry.code === 'SN';
        const demoOrder = isSn
          ? {
              id: 'demo-sn-1',
              orderNumber: 'SN-2041',
              customerName: 'Fatou Diop',
              customerPhone: '+221 77 456 78 90',
              customerCity: 'Dakar',
              customerAddress: 'Almadies, Villa 24',
              totalAmount: 18500,
              currency: 'XOF',
              items: [{ product: { name: 'Pack Beauté & Sérum Éclat' } }],
            }
          : {
              id: 'demo-ma-1',
              orderNumber: '1359',
              customerName: 'Mohammed Alami',
              customerPhone: '0661234567',
              customerCity: 'Casablanca',
              customerAddress: 'Boulevard Zerktouni, Apt 14',
              totalAmount: 299,
              currency: 'MAD',
              items: [{ product: { name: 'Montre Intelligente Ultra Pro' } }],
            };
        setSimOrders([demoOrder]);
        setSelectedSimOrderId(demoOrder.id);
        initSimulatorWithOrder(demoOrder, data.config);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId, currentCountry.code]);

  const initSimulatorWithOrder = (order: any, botConfig?: WhatsAppBotConfig) => {
    const cfg = botConfig || config;
    if (!order || !cfg) return;

    setSimOrderDetails(order);
    const isSn = currentCountry.code === 'SN' || order.currency === 'XOF';
    const tmpl = isSn ? cfg.templates.SN : cfg.templates.MA;
    const prodName = order.items?.[0]?.product?.name || order.items?.[0]?.variant || 'Pack Premium';

    const msg = tmpl.messageText
      .replace(/{customerName}/g, order.customerName)
      .replace(/{productName}/g, prodName)
      .replace(/{totalAmount}/g, String(order.totalAmount))
      .replace(/{currency}/g, order.currency || (isSn ? 'XOF' : 'MAD'))
      .replace(/{customerAddress}/g, order.customerAddress || 'Adresse enregistrée')
      .replace(/{customerCity}/g, order.customerCity || 'Ville')
      .replace(/{orderNumber}/g, order.orderNumber);

    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setSimChatMessages([
      {
        sender: 'BOT',
        text: msg,
        time,
        buttons: [
          { id: 'CONFIRM', label: tmpl.btnConfirm },
          { id: 'CANCEL', label: tmpl.btnCancel },
          { id: 'MODIFY', label: tmpl.btnModify },
        ],
      },
    ]);
  };

  const handleSimOrderChange = (orderId: string) => {
    setSelectedSimOrderId(orderId);
    const ord = simOrders.find((o) => o.id === orderId);
    if (ord) initSimulatorWithOrder(ord);
  };

  // Simulate customer clicking an interactive button
  const handleSimulateButtonClick = async (buttonId: string, buttonLabel: string) => {
    if (!simOrderDetails) return;
    setIsSimulatingResponse(true);
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // 1. Add customer message
    setSimChatMessages((prev) => [
      ...prev,
      {
        sender: 'CUSTOMER',
        text: buttonLabel,
        time,
      },
    ]);

    try {
      // 2. Call real webhook API
      const res = await fetch('/api/whatsapp-bot/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: simOrderDetails.id,
          action: buttonId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 3. Bot responds
        setTimeout(() => {
          const botTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const newBotMessages: any[] = [
            {
              sender: 'BOT',
              text: data.replyMessage,
              time: botTime,
            },
          ];

          if (data.showUpsell && data.upsellMessage) {
            const isSn = currentCountry.code === 'SN';
            const tmpl = isSn ? config!.templates.SN : config!.templates.MA;
            newBotMessages.push({
              sender: 'BOT',
              text: data.upsellMessage,
              time: botTime,
              buttons: [
                { id: 'UPSELL_YES', label: tmpl.upsellBtnYes },
                { id: 'UPSELL_NO', label: tmpl.upsellBtnNo },
              ],
            });
          }

          setSimChatMessages((prev) => [...prev, ...newBotMessages]);
          setIsSimulatingResponse(false);
          // Refresh stats and logs
          loadData();
        }, 700);
      }
    } catch (e) {
      console.error(e);
      setIsSimulatingResponse(false);
    }
  };

  // Save Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/whatsapp-bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        alert(isAr ? '✅ تم حفظ إعدادات البوت بنجاح' : '✅ Configuration enregistrée avec succès');
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (e: any) {
      alert(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {isAr ? 'بوت تأكيد الواتساب التلقائي (Auto-Bot)' : 'WhatsApp Auto-Confirmation Bot 🤖'}
              </h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{config?.enabled ? (isAr ? 'مفعل' : 'Actif') : (isAr ? 'معطل' : 'Inactif')}</span>
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 font-extrabold px-2.5 py-0.5 rounded-full border border-slate-200">
                {currentCountry.flag} {currentCountry.name}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {isAr
                ? 'تأكيد أوتوماتيكي عبر رسائل وأزرار واتساب تفاعلية، ومضاعفة الأرباح بعروض UpSell فورية'
                : 'Confirmation instantanée par boutons interactifs WhatsApp, qualification automatique et UpSell en 1 clic'}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'SIMULATOR' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{isAr ? 'المحاكي المباشر 📱' : 'Simulateur Direct 📱'}</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'LOGS' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{isAr ? 'سجل الرسائل' : 'Journal des Messages'}</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'SETTINGS' ? 'bg-white text-emerald-700 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>{isAr ? 'الإعدادات والنصوص' : 'Configuration'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sent */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'رسائل مرسلة' : 'Messages Envoyés'}
            </span>
            <Send className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalSent}</span>
            <span className="text-xs text-slate-400 font-semibold">{isAr ? 'محادثة' : 'leads'}</span>
          </div>
        </div>

        {/* Auto Confirmed Rate */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              {isAr ? 'تأكيد تلقائي عبر واتساب' : 'Taux Auto-Confirmé'}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-900">{stats.confirmationRate}%</span>
            <span className="text-xs text-emerald-700 font-semibold">
              ({stats.confirmed} {isAr ? 'مأكدة' : 'confirmées'})
            </span>
          </div>
        </div>

        {/* Auto Cancelled */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              {isAr ? 'إلغاء وفّر مصاريف الشحن' : 'Économie Frais Envoi'}
            </span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-900">{stats.cancelled}</span>
            <span className="text-xs text-rose-700 font-semibold">
              ({stats.cancellationRate}% {isAr ? 'ملغية فوراً' : 'stoppées'})
            </span>
          </div>
        </div>

        {/* UpSell Accepted */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              {isAr ? 'مبيعات UpSell فورية' : 'UpSells Concrétisés'}
            </span>
            <Flame className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-900">{stats.upsellCount}</span>
            <span className="text-xs text-purple-700 font-semibold">{isAr ? 'حبة إضافية' : 'ventes VIP'}</span>
          </div>
        </div>
      </div>

      {/* TAB 1: LIVE INTERACTIVE SMARTPHONE SIMULATOR */}
      {activeTab === 'SIMULATOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Controls & Order Picker */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? 'اختبار المحاكي بطلبية حقيقية' : 'Tester avec une Commande Réelle'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isAr
                  ? 'اختر طلبية من المتجر وشاهد كيف تصل رسالة الواتساب للزبون واضغط على الأزرار لاختبار تغيير الحالة في السيستيم مباشرة!'
                  : 'Sélectionnez une commande et testez l\'expérience client en direct. Cliquez sur les boutons dans le téléphone pour voir la commande passer à CONFIRMED !'}
              </p>

              {/* Order Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'اختر الطلبية المراد اختبارها:' : 'Sélectionner la commande test:'}
                </label>
                <select
                  value={selectedSimOrderId}
                  onChange={(e) => handleSimOrderChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {simOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.orderNumber} - {ord.customerName} ({ord.customerCity}) - {ord.totalAmount}{' '}
                      {ord.currency || 'MAD'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Summary Card */}
              {simOrderDetails && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-500">{isAr ? 'العميل:' : 'Client:'}</span>
                    <span className="text-slate-900 font-extrabold">{simOrderDetails.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-500">{isAr ? 'الهاتف:' : 'Téléphone:'}</span>
                    <span className="text-indigo-600">{simOrderDetails.customerPhone}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-500">{isAr ? 'المدينة:' : 'Ville:'}</span>
                    <span className="text-slate-800">{simOrderDetails.customerCity}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-500">{isAr ? 'الحالة الحالية:' : 'Statut actuel:'}</span>
                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black">
                      {simOrderDetails.status}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  const ord = simOrders.find((o) => o.id === selectedSimOrderId);
                  if (ord) initSimulatorWithOrder(ord);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة تشغيل المحاكي' : 'Réinitialiser la simulation'}</span>
              </button>
            </div>

            {/* How it works info card */}
            <div className="p-5 bg-emerald-50/60 rounded-3xl border border-emerald-200/70 text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-1.5 font-black text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'كيف يعمل البوت؟' : 'Comment ça marche ?'}</span>
              </div>
              <ul className="space-y-1.5 text-emerald-800 font-medium list-disc list-inside">
                <li>{isAr ? 'الزبون يضغط على زر التأكيد الأخضر في الواتساب.' : 'Le client clique sur [Confirmer] dans son WhatsApp.'}</li>
                <li>{isAr ? 'السيستيم يحول الطلبية أوتوماتيك لـ CONFIRMED.' : 'Le statut passe instantanément à CONFIRMED.'}</li>
                <li>{isAr ? 'البوت يقترح عليه الحبة الثانية بتخفيض 50%.' : 'Le bot propose automatiquement le 2ème article à -50%.'}</li>
                <li>{isAr ? 'الطلبية تمر فوراً لقسم الشحن لشركة التوصيل.' : 'La commande est prête à être expédiée.'}</li>
              </ul>
            </div>
          </div>

          {/* Right: The Interactive WhatsApp Phone Mockup */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-sm bg-slate-900 p-3 rounded-[42px] shadow-2xl border-4 border-slate-700">
              {/* Smartphone Frame */}
              <div className="bg-[#EFEAE2] rounded-[34px] overflow-hidden flex flex-col h-[580px] shadow-inner relative">
                {/* WhatsApp Top Bar */}
                <div className="bg-[#075E54] text-white px-4 py-3 flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center font-black text-white text-sm shadow-xs border border-emerald-500">
                      🛍️
                    </div>
                    <div>
                      <div className="font-bold text-xs tracking-tight">
                        {currentCountry.name} Store Support
                      </div>
                      <div className="text-[10px] text-emerald-200 flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>En ligne</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                </div>

                {/* WhatsApp Chat Conversation Body */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                  {/* Security Notice */}
                  <div className="text-center">
                    <span className="bg-[#FFF3C4] text-amber-900 text-[10px] px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1 shadow-2xs">
                      🔒 {isAr ? 'محادثة مشفرة وآمنة تماماً' : 'Messages chiffrés de bout en bout'}
                    </span>
                  </div>

                  {simChatMessages.map((msg, i) => {
                    const isBot = msg.sender === 'BOT';

                    return (
                      <div key={i} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                        {/* Bubble */}
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl shadow-xs relative text-xs leading-relaxed ${
                            isBot
                              ? 'bg-white text-slate-800 rounded-tl-xs'
                              : 'bg-[#DCF8C6] text-slate-900 rounded-tr-xs font-semibold'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <span className="text-[9px] text-slate-400 block text-right mt-1 font-medium">
                            {msg.time}
                          </span>
                        </div>

                        {/* Interactive Buttons under Bot Bubble */}
                        {isBot && msg.buttons && msg.buttons.length > 0 && (
                          <div className="w-[85%] mt-1.5 space-y-1">
                            {msg.buttons.map((btn) => (
                              <button
                                key={btn.id}
                                disabled={isSimulatingResponse}
                                onClick={() => handleSimulateButtonClick(btn.id, btn.label)}
                                className={`w-full py-2 px-3 text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                  btn.id === 'CONFIRM' || btn.id === 'UPSELL_YES'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : btn.id === 'CANCEL'
                                    ? 'bg-white hover:bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                              >
                                <span>{btn.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isSimulatingResponse && (
                    <div className="flex items-center gap-1.5 bg-white/90 p-2 rounded-xl text-slate-500 text-[11px] font-medium w-fit">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                      <span>{isAr ? 'جاري المعالجة والتحديث...' : 'Enregistrement en cours...'}</span>
                    </div>
                  )}
                </div>

                {/* WhatsApp Bottom Input Bar */}
                <div className="p-2 bg-slate-100 flex items-center gap-2 border-t border-slate-200">
                  <input
                    type="text"
                    disabled
                    placeholder="Tapez un message..."
                    className="flex-1 bg-white text-xs px-3 py-2 rounded-full border border-slate-200 focus:outline-none"
                  />
                  <button className="w-8 h-8 rounded-full bg-[#128C7E] text-white flex items-center justify-center shadow-xs">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JOURNAL DES MESSAGES / REAL-TIME LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'سجل رسائل الواتساب وتأكيدات العملاء' : 'Historique des envois et réponses clients'}</span>
            </h3>
            <button
              onClick={() => loadData()}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              {isAr ? 'لا توجد رسائل مسجلة حتى الآن' : 'Aucun message dans l\'historique pour le moment.'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Commande</th>
                    <th className="py-3 px-4">Pays</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Téléphone</th>
                    <th className="py-3 px-4">Statut WhatsApp</th>
                    <th className="py-3 px-4 text-center">UpSell VIP</th>
                    <th className="py-3 px-4">Date Envoi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-black text-indigo-600">
                        <Link href={`/orders?search=${encodeURIComponent(log.orderNumber)}`} className="hover:underline">
                          #{log.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          {log.country === 'Sénégal' ? '🇸🇳 Sénégal' : '🇲🇦 Maroc'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">{log.customerPhone}</td>
                      <td className="py-3 px-4">
                        {log.status === 'CONFIRMED' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{isAr ? 'أكد عبر واتساب ✅' : 'Confirmé WhatsApp ✅'}</span>
                          </span>
                        ) : log.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-rose-300">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{isAr ? 'ألغى الطلب ❌' : 'Annulé par Client ❌'}</span>
                          </span>
                        ) : log.status === 'MODIFICATION_REQUESTED' ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                            <span>{isAr ? 'طلب تعديل ✏️' : 'Modif demandée ✏️'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-sky-300">
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                            <span>{isAr ? 'في الانتظار' : 'En attente réponse'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {log.upsellAccepted ? (
                          <span className="text-[11px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                            🔥 {isAr ? 'مقبول (+50%)' : 'Accepté (+50%)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                        {new Date(log.sentAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
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

      {/* TAB 3: CONFIGURATION & TEMPLATES */}
      {activeTab === 'SETTINGS' && config && (
        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? 'الإعدادات العامة والربط' : 'Paramètres Généraux & Connexion'}
                </h3>
              </div>
              {/* Toggle Bot */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-black text-slate-800">
                  {isAr ? 'تفعيل التأكيد التلقائي للطلبيات الجديدة' : 'Activer le Bot WhatsApp Auto-Confirmation'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Provider */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'مزود خدمة الواتساب (Fournisseur API)' : 'Fournisseur WhatsApp API'}
                </label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="SIMULATOR_TEST">🟢 {isAr ? 'محاكي داخلي (تجربة على الشاشة فقط بدون إنترنت)' : 'Simulateur Interne (Test sans API)'}</option>
                  <option value="GREEN_API">⚡ GreenAPI (ربط سريع عبر مسح QR Code - الأسهل)</option>
                  <option value="META_CLOUD_API">Official Meta WhatsApp Cloud API (Facebook Developers)</option>
                  <option value="ULTRAMSG">UltraMsg Gateway</option>
                  <option value="WASAPI">Wasapi Gateway</option>
                </select>
              </div>

              {/* Sender Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'رقم هاتف المرسل (Expéditeur)' : 'Numéro WhatsApp Expéditeur'}
                </label>
                <input
                  type="text"
                  value={config.senderPhone}
                  onChange={(e) => setConfig({ ...config, senderPhone: e.target.value })}
                  placeholder="+2126XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Delay seconds */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {isAr ? 'تأخير الإرسال بعد الطلب (بالثواني)' : 'Délai d\'envoi après commande (sec)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={config.delaySeconds}
                  onChange={(e) => setConfig({ ...config, delaySeconds: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Provider Detailed Guide Banner */}
            {config.provider === 'SIMULATOR_TEST' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <div className="text-xl">⚠️</div>
                <div className="space-y-1">
                  <div className="font-extrabold text-amber-950">
                    {isAr ? 'تنبيه مهم بخصوص وضع المحاكي (SIMULATOR_TEST):' : 'Mode Simulateur Actif :'}
                  </div>
                  <p className="font-medium text-amber-800 leading-relaxed">
                    {isAr
                      ? 'في هذا الوضع، الرسائل تظهر فقط على الشاشة داخل الهاتف الافتراضي في التبويب الأول (محاكي الواتساب)، ولا تُرسل رسائل حقيقية لتطبيق WhatsApp في هاتفك. لإرسال رسائل حقيقية تصل إلى هاتفك الفعلي أو هواتف العملاء، اختر مزوداً حقيقياً مثل "GreenAPI" أو "Meta Cloud API" وضع بيانات الربط.'
                      : 'Dans ce mode, les messages sont simulés uniquement dans le mockup de smartphone de la plateforme (Onglet 1). Aucun message réel n\'est envoyé sur un téléphone physique. Pour envoyer des vrais messages, choisissez un fournisseur comme GreenAPI ou Meta.'}
                  </p>
                </div>
              </div>
            )}

            {config.provider === 'GREEN_API' && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-950">
                <div className="text-xl">🟢</div>
                <div className="space-y-1">
                  <div className="font-extrabold text-emerald-950">
                    {isAr ? 'طريقة الربط السريع عبر GreenAPI (مسح QR Code):' : 'Connexion WhatsApp via GreenAPI (QR Code) :'}
                  </div>
                  <ol className="list-decimal list-inside space-y-1 font-medium text-emerald-800">
                    <li>{isAr ? 'سجل حساباً مجانياً على green-api.com.' : 'Inscrivez-vous sur green-api.com.'}</li>
                    <li>{isAr ? 'امسح QR Code بتطبيق WhatsApp في هاتفك (الأجهزة المرتبطة).' : 'Scannez le QR Code avec votre WhatsApp (Appareils connectés).'}</li>
                    <li>{isAr ? 'انسخ idInstance وضعه في خانة "Instance ID" أسفله.' : 'Copiez votre idInstance dans le champ ci-dessous.'}</li>
                    <li>{isAr ? 'انسخ apiTokenInstance وضعه في خانة "API Access Token" أسفله.' : 'Copiez votre apiTokenInstance ci-dessous.'}</li>
                  </ol>
                </div>
              </div>
            )}

            {config.provider === 'META_CLOUD_API' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
                <div className="text-xl">🔵</div>
                <div className="space-y-1">
                  <div className="font-extrabold text-blue-950">
                    {isAr ? 'الربط عبر Meta WhatsApp Cloud API الرسمية:' : 'Connexion Meta Cloud API Officielle :'}
                  </div>
                  <p className="font-medium text-blue-800">
                    {isAr
                      ? 'ضع Phone Number ID و Permanent Access Token من لوحة التحكم الخاصة بك في developers.facebook.com.'
                      : 'Renseignez votre Phone Number ID et votre Access Token (Bearer) depuis le portail Facebook Developers.'}
                  </p>
                </div>
              </div>
            )}

            {/* API Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">API Access Token / Bearer</label>
                <input
                  type="password"
                  value={config.apiToken}
                  onChange={(e) => setConfig({ ...config, apiToken: e.target.value })}
                  placeholder={config.provider === 'GREEN_API' ? 'apiTokenInstance (ex: 8a9f...)' : 'EAAB...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {config.provider === 'GREEN_API' ? 'Instance ID (GreenAPI)' : 'Phone Number ID (Meta) / Instance ID'}
                </label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                  placeholder={config.provider === 'GREEN_API' ? '11018239...' : '104928472918...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* REAL WHATSAPP TEST SECTION */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧪</span>
                  <span className="font-black text-xs text-white">
                    {isAr ? 'اختبار الإرسال المباشر لهاتفك WhatsApp' : 'Tester l\'envoi réel vers votre WhatsApp'}
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                  {config.provider}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+2126XXXXXXXX"
                  className="w-full sm:w-64 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSendingTest
                      ? isAr
                        ? 'جاري الإرسال...'
                        : 'Envoi en cours...'
                      : isAr
                      ? 'إرسال رسالة تجريبية الآن 📲'
                      : 'Envoyer le message test 📲'}
                  </span>
                </button>
              </div>

              {testFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    testFeedback.success
                      ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
                      : 'bg-rose-950/80 border border-rose-500 text-rose-200'
                  }`}
                >
                  {testFeedback.success ? '✅ ' : '❌ '}
                  {testFeedback.message}
                </div>
              )}
            </div>

            {/* Options Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.upsellEnabled}
                  onChange={(e) => setConfig({ ...config, upsellEnabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    🎁 {isAr ? 'تفعيل عرض UpSell التلقائي بعد التأكيد' : 'Activer l\'UpSell Immédiat après confirmation'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'اقتراح الحبة الثانية بتخفيض 50% لمضاعفة الأرباح' : 'Propose le 2ème article à -50% pour doubler le panier'}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.deliveryRescueEnabled}
                  onChange={(e) => setConfig({ ...config, deliveryRescueEnabled: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <div>
                  <span className="text-xs font-black text-slate-900 block">
                    🚑 {isAr ? 'إنقاذ الكوليات التلقائي (Sauvetage Livraisons)' : 'Sauvetage automatique des incidents livraison'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isAr ? 'إرسال رسالة عند عدم إجابة الكليان لليفرور' : 'Envoi WhatsApp si le livreur note "Client ne répond pas"'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Templates Editor (Morocco vs Senegal) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? 'تخصيص نصوص الرسائل حسب الدولة' : 'Modèles de Messages par Pays'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                Tags : {'{customerName}'}, {'{productName}'}, {'{totalAmount}'}, {'{currency}'}, {'{orderNumber}'}
              </span>
            </div>

            {/* Template Morocco */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🇲🇦 Maroc (Darija / Arabe)</span>
              </div>
              <textarea
                rows={4}
                value={config.templates.MA.messageText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    templates: {
                      ...config.templates,
                      MA: { ...config.templates.MA, messageText: e.target.value },
                    },
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Template Senegal */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🇸🇳 Sénégal (Français)</span>
              </div>
              <textarea
                rows={4}
                value={config.templates.SN.messageText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    templates: {
                      ...config.templates,
                      SN: { ...config.templates.SN, messageText: e.target.value },
                    },
                  })
                }
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (isAr ? 'جاري الحفظ...' : 'Enregistrement...') : isAr ? 'حفظ التغييرات 💾' : 'Enregistrer les Modifications 💾'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

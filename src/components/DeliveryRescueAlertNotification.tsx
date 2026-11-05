'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  BellRing,
  PhoneCall,
  MessageCircle,
  Truck,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  MapPin,
  Clock,
} from 'lucide-react';
import type { DeliveryAlert } from '@/lib/deliveryAlerts';

export default function DeliveryRescueAlertNotification() {
  const { currentUser, isCallAgent, isAdmin, isManager } = useAuth();
  const { t } = useLanguage();
  const [activeAlerts, setActiveAlerts] = useState<DeliveryAlert[]>([]);
  const [currentAlertIndex, setCurrentAlertIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const notifiedAlertIdsRef = useRef<Set<string>>(new Set());

  // Web Audio SOS Siren: Authentic Ambulance Two-Tone (Pin-Pon / Wee-Woo 🚑)
  const playSosChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Master volume & smooth envelope
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.linearRampToValueAtTime(0.3, now + 0.04);
      masterGain.gain.setValueAtTime(0.3, now + 1.95);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 2.25);

      // Lowpass filter to give authentic pneumatic horn resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      // Primary horn oscillator (Sawtooth for siren timbre)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';

      // Harmonic sub-oscillator (Triangle to fatten the sound)
      const oscSub = ctx.createOscillator();
      oscSub.type = 'triangle';

      // Alternating Ambulance Frequencies: High (780Hz) -> Low (580Hz)
      const tonePairs = [
        { start: 0.00, freq: 780 }, // Wee
        { start: 0.36, freq: 580 }, // Woo
        { start: 0.72, freq: 780 }, // Wee
        { start: 1.08, freq: 580 }, // Woo
        { start: 1.44, freq: 780 }, // Wee
        { start: 1.80, freq: 580 }, // Woo
      ];

      tonePairs.forEach(({ start, freq }) => {
        osc.frequency.setValueAtTime(freq, now + start);
        oscSub.frequency.setValueAtTime(freq / 2, now + start);
      });

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.2, now);

      osc.connect(filter);
      oscSub.connect(subGain);
      subGain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      osc.start(now);
      oscSub.start(now);
      osc.stop(now + 2.25);
      oscSub.stop(now + 2.25);
    } catch (e) {
      console.error('Audio siren error:', e);
    }
  };

  const fetchAlerts = async () => {
    if (!currentUser?.id) return;
    try {
      const params = new URLSearchParams();
      if (isCallAgent) {
        params.append('agentId', currentUser.id);
        params.append('role', 'CALL_AGENT');
      } else {
        params.append('role', currentUser.role || 'ADMIN');
      }
      params.append('unresolvedOnly', 'true');

      const res = await fetch(`/api/delivery-alerts?${params.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.alerts)) {
        // Filter out alerts dismissed by this specific user
        const unhandled = data.alerts.filter(
          (a: DeliveryAlert) => !a.resolved && !a.dismissedBy?.includes(currentUser.id)
        );

        setActiveAlerts(unhandled);

        // Check if there is any brand new alert that hasn't made a sound yet
        let hasNew = false;
        unhandled.forEach((a: DeliveryAlert) => {
          if (!notifiedAlertIdsRef.current.has(a.id)) {
            notifiedAlertIdsRef.current.add(a.id);
            hasNew = true;
          }
        });

        if (hasNew) {
          playSosChime();
        }
      }
    } catch (e) {
      console.error('Error fetching delivery alerts:', e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Fast polling every 7 seconds for real-time delivery tracking
    const timer = setInterval(() => {
      fetchAlerts();
    }, 7000);
    return () => clearInterval(timer);
  }, [currentUser?.id, isCallAgent]);

  if (activeAlerts.length === 0) return null;

  // Selected Alert to display in floating toast
  const alert = activeAlerts[currentAlertIndex] || activeAlerts[0];
  if (!alert) return null;

  // Handler: Dismiss alert for this user
  const handleDismiss = async () => {
    try {
      await fetch('/api/delivery-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DISMISS',
          alertId: alert.id,
          userId: currentUser?.id,
        }),
      });
      setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    } catch (e) {
      console.error(e);
    }
  };

  // Handler: Mark Alert as Rescued
  const handleResolveRescue = async () => {
    setProcessingId(alert.id);
    try {
      const res = await fetch('/api/delivery-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE',
          orderId: alert.orderId,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Agent',
          userRole: currentUser?.role || 'CALL_AGENT',
          details: `Sauvetage Livreur Réussi - Client contacté et relivraison confirmée par ${currentUser?.name || 'Agent'}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingId(null);
    }
  };

  // Handler: Open WhatsApp with pre-filled message for Courier
  const handleWhatsAppCourier = () => {
    const cleanPhone = (alert.courierPhone || '').replace(/[^0-9]/g, '');
    const clientName = alert.customerName;
    const clientPhone = alert.customerPhone;
    const city = alert.customerCity;
    const address = alert.customerAddress || '';
    const tracking = alert.trackingNumber || alert.orderNumber;

    const message = `سلام خويا الموزع 🛵، بخصوص الكولي #${tracking} ديال الكليان ${clientName} (${city} - ${clientPhone} ${address ? `- ${address}` : ''}): راه تواصلنا معاه هاتفياً وأكد بلي راه واجد دابا باش يتسلمها. عفاك عاود دوز عندو تسلمها ليه وشكراً بزاف على تعاونك!`;

    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(targetUrl, '_blank');
  };

  // Handler: Direct Call / WhatsApp with Customer
  const handleWhatsAppClient = () => {
    const cleanPhone = alert.customerPhone.replace(/[^0-9]/g, '');
    const name = alert.customerName;
    const num = alert.orderNumber;
    const courier = alert.courierProvider || 'الموزع';

    const message = `السلام عليكم ${name}، معاك مصلحة المتابعة والتوصيل بخصوص طلبيتكم رقم #${num}. الموزع (${courier}) راه متواجد حالياً بالقرب منكم فالحي وحاول يصوني عليكم لتسليم الكولي. واش نخليه يرجع لعندكم دابا تسلموها؟ المرجو تأكيد ذلك وشكراً بزاف!`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-rose-500 overflow-hidden ring-4 ring-rose-500/20">
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-white shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <span className="text-sm">🚨</span>
            <span className="font-extrabold uppercase tracking-wide">
              {t('sos.bannerTitle', 'Sauvetage Colis en Temps Réel !')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {activeAlerts.length > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-black">
                {currentAlertIndex + 1} / {activeAlerts.length}
              </span>
            )}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1 rounded-lg hover:bg-black/20 text-white/90 hover:text-white transition-colors"
              title={soundEnabled ? 'Son activé' : 'Son désactivé'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-black/20 text-white/90 hover:text-white transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3 text-xs bg-slate-900">
          {/* Reason Alert Box */}
          <div className="bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-xl flex items-start gap-2.5 text-rose-200">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <span className="font-extrabold text-white block text-xs">
                {t('sos.incidentAlert', 'Le livreur a signalé : Client Ne Répond Pas !')}
              </span>
              <p className="text-[11px] text-rose-300 mt-0.5 leading-relaxed">
                {t(
                  'sos.incidentDesc',
                  'Le livreur est actuellement dans le quartier du client. Intervenez immédiatement avant qu\'il ne quitte la zone pour éviter le retour !'
                )}
              </p>
            </div>
          </div>

          {/* Replacement Tag if covering absent colleague */}
          {(alert as any).replacementInfo && (
            <div className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>🤝 Remplacement :</span>
                <strong className="text-white">{(alert as any).replacementInfo.absentName}</strong>
              </span>
              <span className="bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded text-[10px] font-black">
                {((alert as any).replacementInfo.rule === 'SPLIT_50_50' && 'Partage 50/50') ||
                 ((alert as any).replacementInfo.rule === 'FULL_TO_RESCUER' && '100% Commission') ||
                 (`Prime +${(alert as any).replacementInfo.bonus} DH`)}
              </span>
            </div>
          )}

          {/* Customer & Order Details */}
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-white text-sm">#{alert.orderNumber}</span>
                <span className="text-slate-400 text-xs ml-2 font-medium">{alert.customerName}</span>
              </div>
              <span className="font-extrabold text-emerald-400 text-xs">
                {alert.totalAmount} {alert.currency}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>{alert.customerCity}</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-300">
                <Truck className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{alert.courierProvider}</span>
                {alert.trackingNumber && <span className="text-[10px] text-slate-400">({alert.trackingNumber})</span>}
              </span>
              {alert.assignedAgentName && (
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                  Agent: {alert.assignedAgentName}
                </span>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* 1. Call or WhatsApp Customer */}
            <button
              onClick={handleWhatsAppClient}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t('sos.callClient', '📞 Appeler Client')}</span>
            </button>

            {/* 2. WhatsApp Courier */}
            <button
              onClick={handleWhatsAppCourier}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t('sos.whatsappCourier', '🛵 WhatsApp Livreur')}</span>
            </button>
          </div>

          {/* 3. Mark Rescued Button */}
          <button
            onClick={handleResolveRescue}
            disabled={processingId === alert.id}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {processingId === alert.id
                ? t('sos.saving', 'Enregistrement...')
                : t('sos.markSaved', '✅ Marquer Sauvé (Client Prévenu)')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

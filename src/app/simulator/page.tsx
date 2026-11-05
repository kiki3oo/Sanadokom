'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Zap,
  Send,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Sparkles,
  Truck,
  AlertTriangle,
  Radio,
  BellRing,
  Volume2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function SimulatorPage() {
  const {
    stores,
    currentStore,
    selectedStoreId,
    selectedCountry,
    setSelectedCountry,
    availableCountries,
    currentCountry,
  } = useStore();
  const { canViewPage, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'LEAD' | 'RESCUE'>('RESCUE');

  const [storeId, setStoreId] = useState(
    selectedStoreId !== 'ALL' && !selectedStoreId.includes(',') ? selectedStoreId : (stores[0]?.id || '')
  );
  const [customerName, setCustomerName] = useState('Salma Tazi');
  const [customerPhone, setCustomerPhone] = useState('0612987654');
  const [customerCity, setCustomerCity] = useState('Casablanca');
  const [customerAddress, setCustomerAddress] = useState('Bourgogne, Rue Jean Jaurès, Imm 12');
  const [customerNote, setCustomerNote] = useState('Merci de livrer dans la matinée svp');
  const [sku, setSku] = useState('GLOW-SERUM-01');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('249');
  const [utmSource, setUtmSource] = useState('instagram');
  const [utmCampaign, setUtmCampaign] = useState('PROMO_HIVER_2026');
  const [adSet, setAdSet] = useState('Femmes_25_45_Casablanca');
  const [source, setSource] = useState('Instagram Ads');

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  // Delivery Rescue Simulation state
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [incidentSubStatus, setIncidentSubStatus] = useState<string>('LIVREUR_NE_REPOND_PAS');
  const [incidentDetails, setIncidentDetails] = useState<string>(
    'Le livreur est devant l adresse, le client ne répond pas au téléphone après 3 tentatives.'
  );
  const [rescueLoading, setRescueLoading] = useState(false);
  const [rescueResponse, setRescueResponse] = useState<any>(null);

  // Auto-adapt sample inputs & destination store when country changes
  useEffect(() => {
    if (stores.length > 0) {
      const exists = stores.some((s) => s.id === storeId);
      if (!exists) {
        setStoreId(stores[0].id);
      }
    }

    if (selectedCountry === 'SN') {
      setCustomerName('Aminata Diallo');
      setCustomerPhone('771234567');
      setCustomerCity('Dakar');
      setCustomerAddress('Almadies, Villa 14, Dakar');
      setCustomerNote('Merci de livrer vers 14h svp');
      setSku('GLOW-SERUM-SN');
      setPrice('15000');
      setUtmCampaign('PROMO_DAKAR_2026');
      setAdSet('Femmes_25_45_Dakar');
      setIncidentDetails('Le livreur est devant l adresse à Dakar, le client ne répond pas au téléphone.');
    } else if (selectedCountry === 'CI') {
      setCustomerName('Kouassi Yao');
      setCustomerPhone('0708123456');
      setCustomerCity('Abidjan');
      setCustomerAddress('Cocody Angré, 8ème Tranche, Abidjan');
      setCustomerNote('Livraison en soirée svp');
      setSku('GLOW-SERUM-CI');
      setPrice('15000');
      setUtmCampaign('PROMO_ABIDJAN_2026');
      setAdSet('Femmes_25_45_Abidjan');
      setIncidentDetails('Le livreur est à Cocody Abidjan, le client ne répond pas.');
    } else {
      setCustomerName('Salma Tazi');
      setCustomerPhone('0612987654');
      setCustomerCity('Casablanca');
      setCustomerAddress('Bourgogne, Rue Jean Jaurès, Imm 12');
      setCustomerNote('Merci de livrer dans la matinée svp');
      setSku('GLOW-SERUM-01');
      setPrice('249');
      setUtmCampaign('PROMO_HIVER_2026');
      setAdSet('Femmes_25_45_Casablanca');
      setIncidentDetails('Le livreur est devant l adresse à Casablanca, le client ne répond pas après 3 tentatives.');
    }
  }, [selectedCountry, stores]);

  // Fetch recent orders strictly scoped to the active country's stores
  const loadRecentOrders = async () => {
    setLoadingOrders(true);
    try {
      const storeParam =
        selectedStoreId && selectedStoreId !== 'ALL' && selectedStoreId !== 'NONE'
          ? selectedStoreId
          : stores.map((s) => s.id).join(',');

      if (!storeParam || storeParam === 'NONE' || stores.length === 0) {
        setOrders([]);
        setSelectedOrderId('');
        setLoadingOrders(false);
        return;
      }

      const res = await fetch(`/api/orders?storeId=${encodeURIComponent(storeParam)}&limit=30`);
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders)) {
        setOrders(data.orders);
        if (data.orders.length > 0) {
          setSelectedOrderId(data.orders[0].id);
        } else {
          setSelectedOrderId('');
        }
      } else {
        setOrders([]);
        setSelectedOrderId('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadRecentOrders();
  }, [selectedStoreId, selectedCountry, stores]);

  // Web Audio SOS Siren: Authentic Ambulance Two-Tone (Pin-Pon / Wee-Woo 🚑)
  const playTestChime = () => {
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

      // Lowpass filter for authentic pneumatic horn resonance
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

  const handleSimulateRescue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    setRescueLoading(true);
    setRescueResponse(null);

    try {
      const res = await fetch('/api/delivery-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          orderId: selectedOrderId,
          subStatus: incidentSubStatus,
          details: incidentDetails,
          userId: currentUser?.id,
          userName: currentUser?.name || 'Simulateur Livreur',
          userRole: 'COURIER',
        }),
      });

      const data = await res.json();
      setRescueResponse(data);
      if (data.success) {
        playTestChime();
        // Refresh orders
        loadRecentOrders();
      }
    } catch (err: any) {
      setRescueResponse({ error: err.message });
    } finally {
      setRescueLoading(false);
    }
  };

  const selectedStoreObj = stores.find((s) => s.id === storeId) || stores[0];

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const payload = {
        webhookSecret: selectedStoreObj?.webhookSecret,
        customerName,
        customerPhone,
        customerCity,
        customerAddress,
        customerNote,
        items: [
          {
            sku,
            quantity: parseInt(quantity),
            unitPrice: parseFloat(price),
          },
        ],
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        adset_name: adSet,
        source: source || utmSource,
      };

      const res = await fetch('/api/webhooks/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!canViewPage('/simulator')) {
    return <AccessDenied moduleName="le Simulateur de Webhook" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Country Scoping Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Pays Actif :
          </span>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-lg">{currentCountry.flag}</span>
            <span className="text-xs font-black text-slate-900">{currentCountry.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-indigo-700 border border-slate-200 shadow-2xs">
              {currentCountry.currency}
            </span>
          </div>
          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            ({stores.length} boutique{stores.length > 1 ? 's' : ''} filtrée{stores.length > 1 ? 's' : ''})
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {availableCountries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCountry(c.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                selectedCountry === c.code
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('RESCUE')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
            activeTab === 'RESCUE'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-600/30'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <AlertTriangle className="w-4 h-4" />
          <span>🚨 Simulateur Incident Livreur ({currentCountry.flag} {currentCountry.name})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LEAD')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all ${
            activeTab === 'LEAD'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-600/30'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>⚡ Simulateur Lead Webhook ({currentCountry.flag} {currentCountry.name})</span>
        </button>
      </div>

      {activeTab === 'RESCUE' ? (
        /* ================= RESCUE INCIDENT SIMULATOR ================= */
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-900 to-slate-900 text-white p-6 rounded-2xl border border-rose-800/40 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider mb-1">
              <Radio className="w-4 h-4 animate-pulse text-rose-400" />
              <span>Système de Sauvetage de Colis en Temps Réel - {currentCountry.flag} {currentCountry.name}</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Tester l Alerte Immédiate "Livreur : Ne Répond Pas"</span>
            </h1>
            <p className="text-xs text-rose-200/80 mt-1 max-w-2xl leading-relaxed">
              Dès qu un livreur sur le terrain ({currentCountry.name}) signale qu un client ne répond pas au téléphone, le système déclenche un carillon sonore d urgence et une alerte pop-up sur le poste de l agent et du manager avec les boutons d appel direct et WhatsApp.
            </p>

            <div className="mt-4 pt-3 border-t border-rose-800/50 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={playTestChime}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 rounded-lg text-xs font-bold transition-colors border border-rose-400/30"
              >
                <Volume2 className="w-3.5 h-3.5 text-rose-300" />
                <span>Tester la Sirène d Ambulance SOS (Pin-Pon 🚑)</span>
              </button>

              <Link
                href="/orders?status=INCIDENTS_LIVRAISON"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors border border-white/20"
              >
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span>Ouvrir Commandes & Livraisons (Incidents Livreur)</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Simuler le statut envoyé par le livreur ({currentCountry.flag} {currentCountry.name})</span>
                </h2>
                <button
                  type="button"
                  onClick={loadRecentOrders}
                  disabled={loadingOrders}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold"
                  title="Actualiser la liste des commandes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
              </div>

              <form onSubmit={handleSimulateRescue} className="space-y-4">
                {/* Select Order */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Sélectionner la commande ({currentCountry.flag} {currentCountry.name})
                    </label>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {orders.length} commande{orders.length > 1 ? 's' : ''} disponible{orders.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-xs text-slate-600 p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                      <p className="font-bold text-amber-900">
                        {loadingOrders
                          ? `Chargement des commandes (${currentCountry.name})...`
                          : `Aucune commande trouvée pour ${currentCountry.flag} ${currentCountry.name}.`}
                      </p>
                      {!loadingOrders && (
                        <p className="text-[11px] text-amber-800">
                          Passez sur l onglet <strong>"⚡ Simulateur Lead Webhook"</strong> pour envoyer un lead de test pour {currentCountry.name}.
                        </p>
                      )}
                    </div>
                  ) : (
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          #{o.orderNumber} - {o.customerName} ({o.customerCity}) - {o.totalAmount} {o.store?.currency || currentCountry.currency} [{o.store?.name || 'Boutique'}]
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* SubStatus */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Motif de l incident déclaré par le livreur
                  </label>
                  <select
                    value={incidentSubStatus}
                    onChange={(e) => setIncidentSubStatus(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="LIVREUR_NE_REPOND_PAS">
                      📞 Livreur : Ne répond pas (Client Injoignable) - PRIORITÉ MAX
                    </option>
                    <option value="LIVREUR_REPORTE">
                      📅 Livreur : Client demande un report
                    </option>
                    <option value="REFUS_CLIENT">
                      ❌ Livreur : Client refuse la commande
                    </option>
                    <option value="LIVREUR_ADRESSE_INVALIDE">
                      📍 Livreur : Adresse introuvable / erronée
                    </option>
                  </select>
                </div>

                {/* Incident Details / Reason */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Commentaire / Circonstance de la tentative
                  </label>
                  <textarea
                    rows={2}
                    value={incidentDetails}
                    onChange={(e) => setIncidentDetails(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    placeholder="Ex: Le livreur a sonné 3 fois et attend 5 minutes sur place..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={rescueLoading || !selectedOrderId}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  <BellRing className="w-4 h-4 animate-bounce" />
                  <span>
                    {rescueLoading
                      ? 'Déclenchement en cours...'
                      : '🚨 Déclencher l Alerte Livreur "Ne Répond Pas" en Direct'}
                  </span>
                </button>
              </form>
            </div>

            {/* Explanation & Result Card */}
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">
                  Résultat de l Alerte
                </span>

                {rescueResponse ? (
                  <div className="space-y-3">
                    <div
                      className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        rescueResponse.success
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {rescueResponse.success ? <CheckCircle2 className="w-4 h-4" /> : null}
                      <span>
                        {rescueResponse.success
                          ? 'Alerte SOS diffusée avec succès ! Regardez le haut de l écran.'
                          : rescueResponse.error}
                      </span>
                    </div>

                    <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-52">
                      {JSON.stringify(rescueResponse, null, 2)}
                    </pre>

                    <div className="pt-2">
                      <Link
                        href="/orders?status=INCIDENTS_LIVRAISON"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Voir dans Commandes & Livraisons (Incidents Livreur)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs text-slate-400">
                    <p className="text-slate-300 font-semibold">
                      💡 Que se passe-t-il lorsque vous cliquez sur le bouton ?
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-[11px] leading-relaxed text-slate-300">
                      <li>
                        <strong className="text-white">Sirène d Ambulance SOS (Pin-Pon 🚑) :</strong> Le son d urgence à deux tons retentit immédiatement pour alerter toute l équipe en direct.
                      </li>
                      <li>
                        <strong className="text-white">Pop-up Flottant :</strong> Une notification rouge vif apparaît en haut à droite sur tous les écrans (Agents et Managers).
                      </li>
                      <li>
                        <strong className="text-white">Action Immédiate :</strong> L agent clique sur <span className="text-emerald-400 font-bold">Appeler le Client</span> ou <span className="text-emerald-400 font-bold">WhatsApp Livreur</span> avant que le livreur ne quitte le quartier.
                      </li>
                      <li>
                        <strong className="text-white">Marqué Sauvé :</strong> Dès confirmation, le colis passe en statut <span className="text-indigo-300 font-bold">Sauvé (À Relivrer)</span>.
                      </li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= LEAD WEBHOOK SIMULATOR ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span>Formulaire de commande (Client)</span>
            </h2>

            <form onSubmit={handleSimulate} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Boutique de destination ({currentCountry.flag} {currentCountry.name})
                  </label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {currentCountry.currency}
                  </span>
                </div>
                {stores.length === 0 ? (
                  <div className="text-xs text-rose-600 p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                    Aucune boutique trouvée pour {currentCountry.name}.
                  </div>
                ) : (
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        🛍️ {s.name} ({s.slug}) - {s.currency}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom & Prénom</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    required
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note du client</label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">SKU Produit</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Quantité</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prix ({currentCountry.currency})</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              {/* Marketing Attribution (UTM) */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-indigo-700 block">
                  🎯 Attribution Marketing & UTM
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">utm_source</label>
                    <select
                      value={utmSource}
                      onChange={(e) => {
                        setUtmSource(e.target.value);
                        const map: Record<string, string> = {
                          instagram: 'Instagram Ads',
                          facebook: 'Facebook Ads',
                          tiktok: 'TikTok Ads',
                          snapchat: 'Snapchat Ads',
                          google: 'Google Ads',
                          whatsapp: 'WhatsApp Direct',
                        };
                        setSource(map[e.target.value] || e.target.value);
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      <option value="instagram">📸 Instagram</option>
                      <option value="facebook">🔵 Facebook</option>
                      <option value="tiktok">🎵 TikTok</option>
                      <option value="snapchat">👻 Snapchat</option>
                      <option value="google">🔍 Google</option>
                      <option value="whatsapp">💬 WhatsApp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">utm_campaign</label>
                    <input
                      type="text"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      placeholder="PROMO_2026"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">adset_name</label>
                    <input
                      type="text"
                      value={adSet}
                      onChange={(e) => setAdSet(e.target.value)}
                      placeholder="Audience_01"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Envoi en cours...' : 'Envoyer le Lead au SaaS (POST Webhook)'}</span>
              </button>
            </form>
          </div>

          {/* Live Response Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-md">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                Réponse du Serveur SaaS
              </span>

              {response ? (
                <div className="space-y-3">
                  <div
                    className={`p-3 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      response.success
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {response.success ? <CheckCircle2 className="w-4 h-4" /> : null}
                    <span>{response.message || response.error}</span>
                  </div>

                  <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60">
                    {JSON.stringify(response, null, 2)}
                  </pre>

                  {response.success && (
                    <div className="pt-2">
                      <Link
                        href="/call-center"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Voir dans le Centre d Appel</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 py-12 text-center">
                  En attente d envoi... Cliquez sur le bouton pour simuler l arrivée du lead.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import DeliveryCapiPanel from './DeliveryCapiPanel';
import React, { useState, useEffect } from 'react';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/components/AccessDenied';
import {
  Network,
  Megaphone,
  Truck,
  Copy,
  Check,
  RefreshCw,
  Key,
  ShieldCheck,
  Code2,
  FileCode,
  Zap,
  MapPin,
  Clock,
  Printer,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  FileSpreadsheet,
  Send,
  ExternalLink,
  Play,
  Globe,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { selectedStoreId, stores, currentStore } = useStore();
  const { canViewPage, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'SHIPPING_WORKFLOW' | 'COURIER_API' | 'WEBHOOK' | 'N8N_AUTOMATION' | 'FACEBOOK'>('N8N_AUTOMATION');
  const [copied, setCopied] = useState(false);

  // n8n & Outgoing Webhook State
  const [n8nConfig, setN8nConfig] = useState<any>({
    enabled: true,
    url: '',
    secret: '',
    events: {
      orderCreated: true,
      orderConfirmed: true,
      orderDelivered: false,
      orderCancelled: false,
    },
    storeUrls: {},
  });
  const [n8nLogs, setN8nLogs] = useState<any[]>([]);
  const [n8nSaving, setN8nSaving] = useState(false);
  const [n8nTesting, setN8nTesting] = useState(false);
  const [n8nTestResult, setN8nTestResult] = useState<any | null>(null);
  const [showPayloadModal, setShowPayloadModal] = useState(false);
  const [selectedPayloadData, setSelectedPayloadData] = useState<any | null>(null);

  // Facebook Form State
  const [fbPixelId, setFbPixelId] = useState('');
  const [fbAccessToken, setFbAccessToken] = useState('');
  const [fbAdAccountId, setFbAdAccountId] = useState('');
  const [fbAutoSync, setFbAutoSync] = useState(false);
  const [fbReadConfigured, setFbReadConfigured] = useState(false);
  const [fbNotice, setFbNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [fbLoading, setFbLoading] = useState(false);

  // Courier API Form State
  const [courierProvider, setCourierProvider] = useState('CATHEDIS');
  const [courierApiKey, setCourierApiKey] = useState('');
  const [courierApiSecret, setCourierApiSecret] = useState('');
  const [courierAccountNum, setCourierAccountNum] = useState('');
  const [courierApiUrl, setCourierApiUrl] = useState('');
  const [courierLoading, setCourierLoading] = useState(false);

  // Shipping Workflow & Auto-Dispatch State
  const [workflowConfig, setWorkflowConfig] = useState<any>({
    mode: 'SINGLE_COURIER',
    singleCourier: 'CATHEDIS',
    fallbackCourier: 'CATHEDIS',
    autoDispatchEnabled: true,
    scheduledTime: '19:30',
    cityRoutingRules: [],
  });
  const [availableCouriers, setAvailableCouriers] = useState<any[]>([]);
  const [pendingConfirmedCount, setPendingConfirmedCount] = useState(0);
  const [courierBreakdown, setCourierBreakdown] = useState<any>({});
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Manifest modal after dispatch
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [manifestData, setManifestData] = useState<any[]>([]);
  const [manifestTitle, setManifestTitle] = useState('');

  // New Rule Form
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCities, setNewRuleCities] = useState('');
  const [newRuleCourier, setNewRuleCourier] = useState('AMEEX');

  // Load existing settings
  const loadSettings = async () => {
    try {
      const url =
        selectedStoreId && selectedStoreId !== 'ALL' && !selectedStoreId.includes(',')
          ? `/api/integrations?storeId=${selectedStoreId}`
          : '/api/integrations';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (data.n8nWebhookConfig) {
          setN8nConfig(data.n8nWebhookConfig);
        }
        if (data.n8nWebhookLogs) {
          setN8nLogs(data.n8nWebhookLogs);
        }
        const fb = data.fbSettings?.find((setting: { storeId: string }) => setting.storeId === selectedStoreId);
        setFbPixelId(fb?.pixelId || '');
        setFbAccessToken('');
        setFbAdAccountId(fb?.adAccountId || '');
        setFbAutoSync(fb?.autoSyncSpend ?? false);
        setFbReadConfigured(data.metaReadConfigured === true);
        setFbNotice(null);
        if (data.courierConfigs && data.courierConfigs.length > 0) {
          const cur = data.courierConfigs.find((c: any) => c.provider === courierProvider);
          if (cur) {
            setCourierApiKey(cur.apiKey || '');
            setCourierApiSecret(cur.apiSecret || '');
            setCourierAccountNum(cur.accountNumber || '');
            setCourierApiUrl(cur.apiUrl || '');
          } else {
            setCourierApiKey('');
            setCourierApiSecret('');
            setCourierAccountNum('');
            setCourierApiUrl('');
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveN8n = async () => {
    setN8nSaving(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'N8N_WEBHOOK',
          storeId: selectedStoreId || 'ALL',
          config: n8nConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setN8nConfig(data.n8nWebhookConfig);
        alert('✅ Configuration n8n enregistrée avec succès !');
      } else {
        alert(data.error || 'Erreur lors de l enregistrement');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setN8nSaving(false);
    }
  };

  const handleTestN8n = async () => {
    const targetUrl =
      selectedStoreId && selectedStoreId !== 'ALL' && n8nConfig.storeUrls?.[selectedStoreId]
        ? n8nConfig.storeUrls[selectedStoreId]
        : n8nConfig.url;

    if (!targetUrl || !targetUrl.trim().startsWith('http')) {
      alert('Veuillez renseigner une URL valide pour votre Webhook n8n (ex: https://n8n.votredomaine.com/webhook/...)');
      return;
    }

    setN8nTesting(true);
    setN8nTestResult(null);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEST_N8N_WEBHOOK',
          storeId: selectedStoreId || 'ALL',
          url: targetUrl.trim(),
          secret: n8nConfig.secret,
        }),
      });
      const data = await res.json();
      if (data.success && data.testResult) {
        setN8nTestResult(data.testResult);
        loadSettings();
      } else {
        alert(data.error || 'Échec du test');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setN8nTesting(false);
    }
  };

  const loadWorkflowData = async () => {
    setWorkflowLoading(true);
    try {
      const res = await fetch(`/api/shipping/dispatch?storeId=${selectedStoreId || 'ALL'}`);
      const data = await res.json();
      if (data.success) {
        setWorkflowConfig(data.config);
        setAvailableCouriers(data.availableCouriers || []);
        setPendingConfirmedCount(data.pendingCount || 0);
        setCourierBreakdown(data.courierBreakdown || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWorkflowLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadWorkflowData();
  }, [selectedStoreId, courierProvider]);

  const handleSaveFacebook = async (triggerSync = false) => {
    if (!selectedStoreId || ['ALL', 'NONE'].includes(selectedStoreId) || selectedStoreId.includes(',')) {
      alert('Veuillez d abord sélectionner une boutique spécifique en haut.');
      return;
    }
    setFbLoading(true);
    setFbNotice(null);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FACEBOOK',
          storeId: selectedStoreId,
          pixelId: fbPixelId,
          accessToken: fbAccessToken || undefined,
          adAccountId: fbAdAccountId,
          autoSyncSpend: fbAutoSync,
          triggerSync,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFbNotice({ error: true, text: data.error || 'Configuration Meta indisponible.' });
      } else {
        setFbAccessToken('');
        setFbNotice({
          error: false,
          text: data.syncResult
            ? `${data.syncResult.rows} lignes campagne/jour synchronisées (${data.syncResult.currency}).`
            : 'Configuration Meta enregistrée.',
        });
      }
    } catch {
      setFbNotice({ error: true, text: 'Impossible de joindre Sanadokom.' });
    } finally {
      setFbLoading(false);
    }
  };

  const handleSaveCourierApi = async () => {
    if (!selectedStoreId || selectedStoreId === 'ALL' || selectedStoreId.includes(',')) {
      alert('Veuillez d abord sélectionner une boutique spécifique en haut.');
      return;
    }
    setCourierLoading(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'COURIER',
          storeId: selectedStoreId,
          provider: courierProvider,
          apiKey: courierApiKey,
          apiSecret: courierApiSecret,
          accountNumber: courierAccountNum,
          apiUrl: courierApiUrl,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Identifiants API pour ${courierProvider} enregistrés avec succès !`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCourierLoading(false);
    }
  };

  // Save Shipping Workflow Configuration (Single Courier vs City Routing)
  const handleSaveWorkflowConfig = async (newCfg: any) => {
    try {
      const res = await fetch('/api/shipping/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_CONFIG',
          config: newCfg,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkflowConfig(data.config);
        loadWorkflowData();
      }
    } catch (err) {
      console.error('Error saving workflow config:', err);
    }
  };

  // Trigger Immediate Auto-Dispatch for all confirmed orders
  const handleExecuteAutoDispatch = async () => {
    if (pendingConfirmedCount === 0) {
      alert('Aucune commande confirmée trouvée prête pour l expédition.');
      return;
    }

    const confirmMsg =
      workflowConfig.mode === 'SINGLE_COURIER'
        ? `Confirmer l expédition automatique de ${pendingConfirmedCount} commandes vers ${workflowConfig.singleCourier} ?`
        : `Confirmer le routage et l expédition automatique de ${pendingConfirmedCount} commandes réparties selon leurs villes ?`;

    if (!confirm(confirmMsg)) return;

    setIsDispatching(true);
    try {
      const res = await fetch('/api/shipping/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUTO_DISPATCH',
          storeId: selectedStoreId,
          userName: currentUser?.name || 'Admin',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setManifestData(data.manifest || []);
        setManifestTitle(`Bordereau de Ramassage du ${new Date().toLocaleDateString('fr-FR')} (${data.count} colis)`);
        setShowManifestModal(true);
        loadWorkflowData();
      } else {
        alert(data.error || 'Erreur lors du dispatch automatique');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Add City Rule
  const handleAddCityRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleCities.trim()) return;

    const citiesArray = newRuleCities
      .split(/[,;\n]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const newRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      cities: citiesArray,
      courier: newRuleCourier,
      isActive: true,
    };

    const updatedRules = [...(workflowConfig.cityRoutingRules || []), newRule];
    const updatedConfig = { ...workflowConfig, cityRoutingRules: updatedRules };
    handleSaveWorkflowConfig(updatedConfig);

    setNewRuleName('');
    setNewRuleCities('');
    setShowAddRuleForm(false);
  };

  // Delete City Rule
  const handleDeleteCityRule = (ruleId: string) => {
    const updatedRules = workflowConfig.cityRoutingRules.filter((r: any) => r.id !== ruleId);
    handleSaveWorkflowConfig({ ...workflowConfig, cityRoutingRules: updatedRules });
  };

  // Add Custom Courier Modal State & Handlers
  const [showAddCourierModal, setShowAddCourierModal] = useState(false);
  const [customCourierName, setCustomCourierName] = useState('');
  const [customCourierCountry, setCustomCourierCountry] = useState<'MA' | 'SN' | 'ALL'>('MA');
  const [customCourierPhone, setCustomCourierPhone] = useState('');
  const [customCourierFee, setCustomCourierFee] = useState('35');

  const handleCreateCustomCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCourierName.trim()) return;

    try {
      const res = await fetch('/api/shipping/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_CUSTOM_COURIER',
          courierData: {
            name: customCourierName.trim(),
            country: customCourierCountry,
            phone: customCourierPhone,
            deliveryFee: customCourierFee,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowAddCourierModal(false);
        setCustomCourierName('');
        setCustomCourierPhone('');
        setCustomCourierFee('35');
        loadWorkflowData();
      } else {
        alert(data.error || 'Erreur lors de l ajout du transporteur');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCustomCourier = async (courierId: string, courierName: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer la société "${courierName}" ?`)) return;
    try {
      const res = await fetch('/api/shipping/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_CUSTOM_COURIER',
          courierId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadWorkflowData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const storeSecret = currentStore?.webhookSecret || 'whsec_moroccan_glow_991823';
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/orders` : 'https://votre-domaine.com/api/webhooks/orders';

  const jsSnippet = `// Code JavaScript pour vos Landing Pages / Formulaires (ex: YouCan, Webflow, Landing Page Custom)
async function submitOrderToSaaS(formData) {
  const payload = {
    webhookSecret: "${storeSecret}",
    customerName: formData.name,
    customerPhone: formData.phone,
    customerCity: formData.city,
    customerAddress: formData.address,
    items: [
      { sku: "GLOW-SERUM-01", quantity: 1, unitPrice: 249 }
    ],
    utmSource: "facebook",
    utmCampaign: "campagne_maroc_2026"
  };

  const res = await fetch("${webhookUrl}", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return await res.json();
}`;

  if (!canViewPage('/integrations')) {
    return <AccessDenied moduleName="les Intégrations, Webhooks et Clés API" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Intégrations, Logistique & Automatisation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos webhooks de commandes, la synchronisation Facebook CAPI, et le workflow d expédition automatique sans saisie manuelle.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('SHIPPING_WORKFLOW')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'SHIPPING_WORKFLOW' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Workflow Expédition & Routage</span>
          </button>
          <button
            onClick={() => setActiveTab('COURIER_API')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'COURIER_API' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Identifiants Transporteurs</span>
          </button>
          <button
            onClick={() => setActiveTab('WEBHOOK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'WEBHOOK' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Webhooks Landing Pages</span>
          </button>
          <button
            onClick={() => setActiveTab('N8N_AUTOMATION')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'N8N_AUTOMATION' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span>n8n & Automations</span>
          </button>
          <button
            onClick={() => setActiveTab('FACEBOOK')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'FACEBOOK' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Facebook Ads & CAPI</span>
          </button>
        </div>
      </div>

      {/* TAB: SHIPPING WORKFLOW & AUTO-DISPATCH (THE NEW CORE FEATURE) */}
      {activeTab === 'SHIPPING_WORKFLOW' && (
        <div className="space-y-6">
          {/* Quick Metrics & Dispatch Launcher Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Expédition sans saisie manuelle (Zéro Saisie)</span>
                </div>
                <h2 className="text-xl font-black tracking-tight">Ramassage & Transmission Automatique aux Transporteurs</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Toutes vos commandes confirmées sont automatiquement préparées, dotées d un numéro de suivi et transmises à la société de livraison appropriée. Plus besoin de copier/coller client par client.
                </p>
              </div>

              {/* Action Box */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 w-full lg:w-auto min-w-[280px] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Commandes confirmées prêtes :</span>
                  <span className="text-base font-black text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    {pendingConfirmedCount} colis
                  </span>
                </div>

                <button
                  onClick={handleExecuteAutoDispatch}
                  disabled={isDispatching || pendingConfirmedCount === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  <Zap className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
                  <span>
                    {isDispatching
                      ? 'Transmission en cours...'
                      : pendingConfirmedCount > 0
                      ? `Lancer le Dispatch Immédiat (${pendingConfirmedCount} colis)`
                      : 'Aucun colis en attente'}
                  </span>
                </button>

                <p className="text-[10px] text-slate-400 text-center">
                  Génère les numéros de suivi et le bordereau de remise pour le livreur en 1 clic.
                </p>
              </div>
            </div>

            {/* Breakdown Pills */}
            {pendingConfirmedCount > 0 && Object.keys(courierBreakdown).length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Répartition actuelle :</span>
                {Object.entries(courierBreakdown).map(([key, data]: any) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-white/10 border border-white/10 text-white"
                  >
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{data.courierName}:</span>
                    <span className="text-emerald-300">{data.count} colis</span>
                    <span className="text-[11px] text-slate-400">({data.totalCOD} DH)</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mode Selector (Single Courier vs City Routing) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Mode d Expédition & Stratégie de Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choisissez comment vos commandes sont réparties. Vous pouvez travailler avec une seule société au départ, puis activer le routage par ville quand vous grandissez.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Single Courier Mode */}
              <div
                onClick={() => {
                  const updated = { ...workflowConfig, mode: 'SINGLE_COURIER' };
                  handleSaveWorkflowConfig(updated);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  workflowConfig.mode === 'SINGLE_COURIER'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Mode 1 : Société de Livraison Unique (100% Dédié)</span>
                    </div>
                    <input
                      type="radio"
                      name="shippingMode"
                      checked={workflowConfig.mode === 'SINGLE_COURIER'}
                      onChange={() => {}}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Idéal au démarrage. <strong>100% de vos commandes confirmées</strong> sont automatiquement envoyées vers une seule société de livraison de votre choix, quelle que soit la ville.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Sélectionner votre transporteur unique :
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddCourierModal(true);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nouveau transporteur</span>
                    </button>
                  </div>
                  <select
                    value={workflowConfig.singleCourier || 'CATHEDIS'}
                    onChange={(e) => {
                      const updated = { ...workflowConfig, singleCourier: e.target.value };
                      handleSaveWorkflowConfig(updated);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {availableCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country === 'SN' ? 'Sénégal' : c.country === 'MA' ? 'Maroc' : 'Tous'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Option 2: City Routing Mode */}
              <div
                onClick={() => {
                  const updated = { ...workflowConfig, mode: 'CITY_ROUTING' };
                  handleSaveWorkflowConfig(updated);
                }}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  workflowConfig.mode === 'CITY_ROUTING'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>Mode 2 : Routage Multi-Sociétés par Ville / Région</span>
                    </div>
                    <input
                      type="radio"
                      name="shippingMode"
                      checked={workflowConfig.mode === 'CITY_ROUTING'}
                      onChange={() => {}}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pour optimiser les délais et taux de livraison. Le système analyse la ville du client et achemine le colis vers la meilleure société selon vos règles.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Transporteur par défaut (pour villes non répertoriées) :
                  </label>
                  <select
                    value={workflowConfig.fallbackCourier || 'CATHEDIS'}
                    onChange={(e) => {
                      const updated = { ...workflowConfig, fallbackCourier: e.target.value };
                      handleSaveWorkflowConfig(updated);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {availableCouriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section: City Routing Rules (Only shown or highlighted if City Routing is used or configured) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Règles de Routage par Ville</span>
                  {workflowConfig.mode !== 'CITY_ROUTING' && (
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                      En veille (Mode Société Unique activé)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Associez des groupes de villes aux transporteurs les plus rapides et les plus fiables sur ces zones.
                </p>
              </div>

              <button
                onClick={() => setShowAddRuleForm(!showAddRuleForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une règle de zone</span>
              </button>
            </div>

            {/* Add Rule Form */}
            {showAddRuleForm && (
              <form onSubmit={handleAddCityRule} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Nouvelle règle de routage régional</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nom de la Zone / Règle</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Région Nord & Tanger"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Transporteur Attribué</label>
                    <select
                      value={newRuleCourier}
                      onChange={(e) => setNewRuleCourier(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      {availableCouriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Villes incluses (séparées par une virgule)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tanger, Tétouan, Larache, Asilah"
                    value={newRuleCities}
                    onChange={(e) => setNewRuleCities(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Toute commande dont la ville correspond à l un de ces noms sera envoyée à ce transporteur.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRuleForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    Enregistrer la Règle
                  </button>
                </div>
              </form>
            )}

            {/* Rules Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Zone / Règle</th>
                    <th className="py-2.5 px-3">Villes Couvertes</th>
                    <th className="py-2.5 px-3">Société Attribuée</th>
                    <th className="py-2.5 px-3 text-center">Statut</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!workflowConfig.cityRoutingRules || workflowConfig.cityRoutingRules.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Aucune règle de routage définie. Toutes les commandes partent vers le transporteur principal.
                      </td>
                    </tr>
                  ) : (
                    workflowConfig.cityRoutingRules.map((rule: any) => {
                      const courierObj = availableCouriers.find((c) => c.id === rule.courier);
                      return (
                        <tr key={rule.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-3 font-bold text-slate-900">{rule.name}</td>
                          <td className="py-3 px-3">
                            <div className="flex flex-wrap gap-1 max-w-md">
                              {rule.cities.map((city: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium border border-slate-200"
                                >
                                  {city}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-[11px] border border-slate-200">
                              <Truck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{courierObj?.name || rule.courier}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Actif
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteCityRule(rule.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Supprimer la règle"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Planification & Heure du Ramassage */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Planification Quotidienne du Ramassage (Automatisme du Soir)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Heure d envoi automatique</span>
                  <span className="text-[11px] text-slate-500">Heure habituelle de passage des livreurs pour ramasser les colis</span>
                </div>
                <input
                  type="time"
                  value={workflowConfig.scheduledTime || '19:30'}
                  onChange={(e) => {
                    handleSaveWorkflowConfig({ ...workflowConfig, scheduledTime: e.target.value });
                  }}
                  className="px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Dernier dispatch effectué</span>
                  <span className="text-[11px] text-slate-500">
                    {workflowConfig.lastAutoDispatchAt
                      ? new Date(workflowConfig.lastAutoDispatchAt).toLocaleString('fr-FR')
                      : 'Aucun dispatch récent'}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {workflowConfig.lastDispatchedCount || 0} colis traités
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: COURIER API CREDENTIALS */}
      {activeTab === 'COURIER_API' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Comptes & Clés API des Sociétés de Livraison</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Renseignez vos clés API fournies par vos transporteurs pour la synchronisation réelle des étiquettes et du suivi.
              </p>
            </div>

            <button
              onClick={() => setShowAddCourierModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une Société de Livraison</span>
            </button>
          </div>

          {/* Provider selector */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {availableCouriers.map((c) => {
              const isCustom = workflowConfig.customCouriers?.some((x: any) => x.id === c.id);
              return (
                <div key={c.id} className="inline-flex items-center gap-1">
                  <button
                    onClick={() => setCourierProvider(c.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      courierProvider === c.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {c.name}
                  </button>
                  {isCustom && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustomCourier(c.id, c.name);
                      }}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded text-xs transition-colors"
                      title="Supprimer ce transporteur personnalisé"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">API Key / Token {courierProvider}</label>
              <input
                type="text"
                placeholder="Ex: live_api_key_..."
                value={courierApiKey}
                onChange={(e) => setCourierApiKey(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Code Client / N° Compte</label>
              <input
                type="text"
                placeholder="Ex: ACC-10928"
                value={courierAccountNum}
                onChange={(e) => setCourierAccountNum(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">URL Base de l API (Optionnel)</label>
            <input
              type="text"
              placeholder="Ex: https://api.transporteur.ma/v1"
              value={courierApiUrl}
              onChange={(e) => setCourierApiUrl(e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vos identifiants sont chiffrés et stockés en toute sécurité.</span>
            </span>

            <button
              onClick={handleSaveCourierApi}
              disabled={courierLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              {courierLoading ? 'Enregistrement...' : `Enregistrer les accès ${courierProvider}`}
            </button>
          </div>
        </div>
      )}

      {/* TAB: WEBHOOK LANDING PAGES */}
      {activeTab === 'WEBHOOK' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Coordonnées Webhook pour vos Websites & Landing Pages</span>
            </h2>
            <p className="text-xs text-slate-500">
              Chaque prospect (lead) qui remplit un formulaire sur n importe quel site externe arrive directement dans le CRM du Centre d Appel.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block mb-1">Webhook Secret (Clé API Boutique)</span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs font-bold text-indigo-700">
                  <span className="truncate">{storeSecret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(storeSecret);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                    title="Copier"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 block mb-1">URL de Réception (Endpoint POST)</span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs font-bold text-slate-800">
                  <span className="truncate">{webhookUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(webhookUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                    title="Copier"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-slate-500" />
                  <span>Code JavaScript à intégrer sur votre page web</span>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsSnippet);
                    alert('Code copié dans le presse-papiers !');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier le code</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto">
                {jsSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB: N8N & OUTGOING WEBHOOKS */}
      {activeTab === 'N8N_AUTOMATION' && (
        <div className="space-y-6">
          {/* Top Banner Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Webhook Sortant n8n & Automations</span>
                </div>
                <h2 className="text-xl font-black tracking-tight">Déclencheur n8n Automatisé (Nouvelles Commandes)</h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Dès qu un client passe commande sur votre site web ou votre landing page, Sanadokom envoie instantanément un webhook HTTP POST complet vers votre Node <strong>Webhook n8n</strong> pour alimenter vos Google Sheets, déclencher des notifications Telegram / WhatsApp, ou synchroniser votre CRM.
                </p>
              </div>

              {/* Status Toggle Box */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 w-full lg:w-auto min-w-[260px] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Statut du Déclencheur :</span>
                  <span
                    className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                      n8nConfig.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-slate-700 text-slate-400 border-slate-600'
                    }`}
                  >
                    {n8nConfig.enabled ? '🟢 Actif' : '⚪ Inactif'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...n8nConfig, enabled: !n8nConfig.enabled };
                    setN8nConfig(updated);
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                    n8nConfig.enabled
                      ? 'bg-rose-500/90 hover:bg-rose-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {n8nConfig.enabled ? 'Désactiver le Déclencheur' : 'Activer le Déclencheur'}
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  <span>Coordonnées de Connexion du Webhook n8n</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Indiquez l URL où n8n écoute vos nouvelles commandes entrantes.
                </p>
              </div>

              {selectedStoreId && selectedStoreId !== 'ALL' && (
                <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  🛍️ Boutique sélectionnée : {currentStore?.name || selectedStoreId}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>URL Webhook n8n (Méthode POST)</span>
                    <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Node Webhook dans n8n
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://n8n.votre-serveur.com/webhook/rovanx-commandes"
                    value={
                      selectedStoreId && selectedStoreId !== 'ALL' && n8nConfig.storeUrls?.[selectedStoreId] !== undefined
                        ? n8nConfig.storeUrls[selectedStoreId]
                        : n8nConfig.url
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (selectedStoreId && selectedStoreId !== 'ALL') {
                        setN8nConfig({
                          ...n8nConfig,
                          storeUrls: { ...(n8nConfig.storeUrls || {}), [selectedStoreId]: val },
                        });
                      } else {
                        setN8nConfig({ ...n8nConfig, url: val });
                      }
                    }}
                    className="w-full text-xs font-mono border border-slate-300 rounded-xl p-3 pr-24 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip && clip.startsWith('http')) {
                          if (selectedStoreId && selectedStoreId !== 'ALL') {
                            setN8nConfig({
                              ...n8nConfig,
                              storeUrls: { ...(n8nConfig.storeUrls || {}), [selectedStoreId]: clip },
                            });
                          } else {
                            setN8nConfig({ ...n8nConfig, url: clip });
                          }
                        }
                      } catch (e) {}
                    }}
                    className="absolute right-2 top-2 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    Coller
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Collez l URL <strong>Production URL</strong> générée par le Node Webhook dans n8n (ou Test URL pendant vos essais).
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Clé Secrète / Secret Token (Optionnel)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Sécurisation du Webhook</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: n8n_secret_991823"
                  value={n8nConfig.secret || ''}
                  onChange={(e) => setN8nConfig({ ...n8nConfig, secret: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Envoyé dans les en-têtes HTTP <code>x-webhook-secret</code> et <code>Authorization: Bearer &lt;token&gt;</code> pour vérifier que la requête provient bien de Sanadokom.
                </span>
              </div>

              {/* Event Triggers Checkboxes */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Événements Déclencheurs (Quand envoyer le Webhook à n8n) :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all bg-orange-50/20 border-orange-200">
                    <input
                      type="checkbox"
                      checked={Boolean(n8nConfig.events?.orderCreated)}
                      onChange={(e) =>
                        setN8nConfig({
                          ...n8nConfig,
                          events: { ...n8nConfig.events, orderCreated: e.target.checked },
                        })
                      }
                      className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                        <span>⚡ Nouvelle commande reçue</span>
                        <span className="text-[10px] font-mono bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded font-extrabold">
                          order.created
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Dès qu un client passe commande sur votre site ou landing page.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={Boolean(n8nConfig.events?.orderConfirmed)}
                      onChange={(e) =>
                        setN8nConfig({
                          ...n8nConfig,
                          events: { ...n8nConfig.events, orderConfirmed: e.target.checked },
                        })
                      }
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                        <span>🎧 Commande confirmée</span>
                        <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-extrabold">
                          order.confirmed
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Dès qu un agent d appel valide la commande avec le client.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={Boolean(n8nConfig.events?.orderDelivered)}
                      onChange={(e) =>
                        setN8nConfig({
                          ...n8nConfig,
                          events: { ...n8nConfig.events, orderDelivered: e.target.checked },
                        })
                      }
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                        <span>🚚 Commande livrée</span>
                        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-extrabold">
                          order.delivered
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Dès que le transporteur livre le colis au client.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      checked={Boolean(n8nConfig.events?.orderCancelled)}
                      onChange={(e) =>
                        setN8nConfig({
                          ...n8nConfig,
                          events: { ...n8nConfig.events, orderCancelled: e.target.checked },
                        })
                      }
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                        <span>❌ Commande annulée</span>
                        <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded font-extrabold">
                          order.cancelled
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Dès qu une commande est annulée ou refusée.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveN8n}
                  disabled={n8nSaving}
                  className="w-full sm:w-auto px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{n8nSaving ? 'Enregistrement...' : 'Enregistrer la Configuration'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestN8n}
                  disabled={n8nTesting}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className={`w-4 h-4 text-orange-400 ${n8nTesting ? 'animate-bounce' : ''}`} />
                  <span>{n8nTesting ? 'Test en cours vers n8n...' : '⚡ Tester le Webhook n8n Maintenant'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Result Feedback Box */}
          {n8nTestResult && (
            <div
              className={`p-5 rounded-2xl border transition-all animate-in fade-in duration-150 ${
                n8nTestResult.success
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n8nTestResult.success ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {n8nTestResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-black">
                      {n8nTestResult.success
                        ? `✅ Test Réussi ! n8n a répondu HTTP ${n8nTestResult.statusCode || 200} OK en ${n8nTestResult.responseTimeMs}ms`
                        : `❌ Échec du Test vers n8n`}
                    </h4>
                    <p className="text-xs mt-0.5 opacity-90">
                      {n8nTestResult.success
                        ? 'Votre Node Webhook n8n a bien reçu la commande test avec tous les paramètres du client et des produits !'
                        : n8nTestResult.error || 'n8n n a pas répondu avec un statut 200.'}
                    </p>
                    {n8nTestResult.responseBody && (
                      <p className="text-[11px] font-mono mt-1 opacity-75">
                        Réponse de n8n : {n8nTestResult.responseBody}
                      </p>
                    )}
                  </div>
                </div>

                {n8nTestResult.payloadSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPayloadData(n8nTestResult.payloadSent);
                      setShowPayloadModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                  >
                    Inspecter le JSON envoyé
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3-Step Setup Guide */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Comment configurer votre Node Webhook dans n8n en 3 étapes simples :</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900">Ajoutez le Node Webhook</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Dans votre canvas n8n, cliquez sur <strong>+</strong> et ajoutez le trigger <strong>Webhook</strong> officiel.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900">Réglez sur POST & Immediately</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Configurez <strong>HTTP Method: POST</strong>, <strong>Path: rovanx-orders</strong>, et <strong>Respond: Immediately</strong> (sur réception).
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900">Collez l URL & Cliquez sur Tester</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Copiez la <strong>Production URL</strong> depuis n8n, collez-la ci-dessus, et cliquez sur <strong>Tester</strong>. n8n recevra tous les champs en temps réel !
                </p>
              </div>
            </div>
          </div>

          {/* Live Delivery Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Journal des Déclenchements Réents vers n8n</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Historique en direct des requêtes envoyées à votre serveur n8n.
                </p>
              </div>

              <button
                type="button"
                onClick={loadSettings}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Actualiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">Événement</th>
                    <th className="py-3 px-4">Commande & Client</th>
                    <th className="py-3 px-4">URL n8n</th>
                    <th className="py-3 px-4 text-center">Statut HTTP</th>
                    <th className="py-3 px-4 text-center">Temps</th>
                    <th className="py-3 px-4 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {n8nLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        Aucun déclenchement enregistré pour l instant. Cliquez sur "Tester le Webhook n8n" ou passez une commande test sur votre site web !
                      </td>
                    </tr>
                  ) : (
                    n8nLogs.slice(0, 15).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-orange-50 text-orange-800 border border-orange-200 font-mono">
                            {log.event}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono">{log.orderNumber}</div>
                          <div className="text-[11px] text-slate-400">{log.customerName}</div>
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate font-mono text-[11px] text-slate-600" title={log.targetUrl}>
                          {log.targetUrl}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.statusCode ? `HTTP ${log.statusCode}` : 'Échec Réseau'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                          {log.responseTimeMs}ms
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPayloadData(log.payloadSample);
                              setShowPayloadModal(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Voir JSON
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FACEBOOK ADS & CAPI */}
      {activeTab === 'FACEBOOK' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" />
              <span>Configuration Facebook Marketing API & Conversions API (CAPI)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Récupérez les dépenses par campagne. Le Pixel et le jeton CAPI servent à la configuration séparée des événements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID du Compte Publicitaire (Ad Account ID)</label>
              <input
                type="text"
                placeholder="Ex: act_18294019284"
                value={fbAdAccountId}
                onChange={(e) => setFbAdAccountId(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Trouvable dans Facebook Ads Manager.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ID Pixel Facebook (Dataset ID)</label>
              <input
                type="text"
                placeholder="Ex: 982736451029384"
                value={fbPixelId}
                onChange={(e) => setFbPixelId(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Pour l envoi des événements d achat CAPI côté serveur.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nouveau jeton CAPI (facultatif)</label>
            <input
              type="password"
              placeholder="Laisser vide pour conserver le jeton existant"
              value={fbAccessToken}
              onChange={(e) => setFbAccessToken(e.target.value)}
              className="w-full text-xs font-mono border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fbSync"
              checked={fbAutoSync}
              onChange={(e) => setFbAutoSync(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="fbSync" className="text-xs text-slate-700 font-medium cursor-pointer">
              Actualiser les dépenses à l’ouverture du Copilote (au plus toutes les 6 heures)
            </label>
          </div>

          <p className="text-xs text-slate-600">
            {fbReadConfigured ? 'Jeton de lecture Meta configuré sur le serveur.' : 'Ajoutez META_ADS_READ_TOKEN dans les variables d’environnement EasyPanel.'}
          </p>
          {fbNotice && <p role={fbNotice.error ? 'alert' : 'status'} className={`text-sm ${fbNotice.error ? 'text-rose-700' : 'text-emerald-700'}`}>{fbNotice.text}</p>}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => handleSaveFacebook(false)}
              disabled={fbLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Enregistrer Configuration
            </button>
            <button
              onClick={() => handleSaveFacebook(true)}
              disabled={fbLoading || !fbReadConfigured}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fbLoading ? 'animate-spin' : ''}`} />
              <span>Tester & Synchroniser les Dépenses Maintenant</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'FACEBOOK' && selectedStoreId && !['ALL', 'NONE'].includes(selectedStoreId) && !selectedStoreId.includes(',') && (
        <DeliveryCapiPanel key={selectedStoreId} storeId={selectedStoreId} />
      )}

      {/* MANIFEST MODAL (PRINTABLE BORDEREAU DE RAMASSAGE) */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{manifestTitle}</h3>
                  <p className="text-xs text-slate-500">
                    Transmission réussie. Voici votre bordereau de remise à faire signer par le chauffeur du transporteur.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManifestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Colis</span>
                  <div className="text-base font-black text-slate-900">{manifestData.length}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Montant COD Total</span>
                  <div className="text-base font-black text-emerald-600">
                    {manifestData.reduce((acc, m) => acc + (m.totalAmount || 0), 0).toLocaleString()} {manifestData[0]?.currency || 'MAD'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Date & Heure</span>
                  <div className="text-xs font-bold text-slate-800 mt-1">{new Date().toLocaleString('fr-FR')}</div>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">N° Commande</th>
                    <th className="py-2 px-2.5">Client</th>
                    <th className="py-2 px-2.5">Ville & Téléphone</th>
                    <th className="py-2 px-2.5">Société</th>
                    <th className="py-2 px-2.5">N° Suivi (Tracking)</th>
                    <th className="py-2 px-2.5 text-right">Montant COD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {manifestData.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-900">{m.orderNumber}</td>
                      <td className="py-2 px-2.5 font-medium text-slate-800">{m.customerName}</td>
                      <td className="py-2 px-2.5 text-slate-600">
                        {m.customerCity} • <span className="font-mono">{m.customerPhone}</span>
                      </td>
                      <td className="py-2 px-2.5 font-bold text-indigo-700">{m.courier}</td>
                      <td className="py-2 px-2.5 font-mono font-bold text-emerald-700">{m.trackingNumber}</td>
                      <td className="py-2 px-2.5 text-right font-black text-slate-900">
                        {m.totalAmount} {m.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures box */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center h-24 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Signature & Cachet de l Expéditeur</span>
                  <span className="text-[10px] text-slate-400">Remis conforme</span>
                </div>
                <div className="p-3 border border-dashed border-slate-300 rounded-xl text-center h-24 flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-600">Signature & Cachet du Transporteur / Chauffeur</span>
                  <span className="text-[10px] text-slate-400">Reçu conforme</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowManifestModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer le Bordereau</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AJOUTER UNE NOUVELLE SOCIETE DE LIVRAISON */}
      {showAddCourierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ajouter un Transporteur</h3>
                  <p className="text-xs text-slate-500">Ajoutez une société de livraison locale ou un livreur privé.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCourierModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCustomCourier} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nom de la Société / Livreur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Amana Express, ou Livreur Casa Mehdi"
                  value={customCourierName}
                  onChange={(e) => setCustomCourierName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pays d intervention</label>
                  <select
                    value={customCourierCountry}
                    onChange={(e: any) => setCustomCourierCountry(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                  >
                    <option value="MA">🇲🇦 Maroc (MAD)</option>
                    <option value="SN">🇸🇳 Sénégal (XOF)</option>
                    <option value="ALL">🌍 Tous les pays</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tarif livraison moyen (DH)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 35"
                    value={customCourierFee}
                    onChange={(e) => setCustomCourierFee(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Numéro de téléphone / Contact Chauffeur
                </label>
                <input
                  type="text"
                  placeholder="Ex: 06 12 34 56 78"
                  value={customCourierPhone}
                  onChange={(e) => setCustomCourierPhone(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                Ce transporteur apparaîtra immédiatement dans vos menus d expédition, vos règles par ville et vos bordereaux de ramassage.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourierModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                >
                  Enregistrer la Société
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* n8n Payload Inspection Modal */}
      {showPayloadModal && selectedPayloadData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Payload JSON Envoyé à n8n</h3>
                  <p className="text-xs text-slate-500">Structure exacte envoyée au Webhook Node n8n</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayloadModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 bg-slate-950 rounded-xl p-4 border border-slate-800">
              <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all select-all">
                {JSON.stringify(selectedPayloadData, null, 2)}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 shrink-0">
              <span className="text-xs text-slate-500">
                Vous pouvez copier ce JSON dans n8n pour configurer vos expressions.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedPayloadData, null, 2));
                    alert('JSON copié dans le presse-papiers !');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
                >
                  Copier le JSON
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayloadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

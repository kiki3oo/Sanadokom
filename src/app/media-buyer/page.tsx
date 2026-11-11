'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  Target,
  Brain,
  Flame,
  CheckCircle2,
  ExternalLink,
  Search,
  BarChart3,
  RefreshCw,
  Play,
  Globe,
  Camera,
  UploadCloud,
  Trash2,
  Scan,
  Factory,
} from 'lucide-react';
import type { CampaignPeriod, getLiveCampaignAudits } from '@/lib/campaignSummary';
import { calculateCod, codFees, validCodInputs } from '@/lib/codEconomics';
import { MarketResearch } from './MarketResearch';
import { ImportRadar } from './ImportRadar';
import type { RadarProduct } from '@/lib/radarProducts';
import { mediaBuyerTranslations } from '@/lib/mediaBuyerTranslations';

export default function MediaBuyerPage() {
  const { selectedStoreId, selectedCountry } = useStore();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const isRtl = isAr;
  const t = mediaBuyerTranslations[language === 'ar' ? 'ar' : 'fr'] || mediaBuyerTranslations.fr;

  // Navigation Tabs: 'WINNING_PRODUCTS' | 'PRODUCT_VALIDATOR' | 'MEDIA_BUYER_COPILOT'
  const [activeTab, setActiveTab] = useState<'WINNING_PRODUCTS' | 'PRODUCT_VALIDATOR' | 'MEDIA_BUYER_COPILOT'>(
    'WINNING_PRODUCTS'
  );

  // --- Tab 2: Product Validator State ---
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [selectedStockId, setSelectedStockId] = useState('');
  const [auditMarket, setAuditMarket] = useState('');
  const [analysisInput, setAnalysisInput] = useState({
    title: '',
    niche: 'COSMETICS',
    targetCountry: 'MA',
    wholesalePrice: 35,
    retailPrice: 229,
    shippingFee: 35,
    estConfirmationRate: 85,
    estDeliveryRate: 80,
    productUrl: '',
    description: '',
    ingredientsOrDetails: '',
    imageUrl: '',
  });

  // Visual Product Scanner State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageScanning, setImageScanning] = useState(false);
  const [imageScanSuccess, setImageScanSuccess] = useState(false);
  const [imageFeatures, setImageFeatures] = useState<string[]>([]);
  const [reverseSearchUrls, setReverseSearchUrls] = useState<{
    googleLens?: string;
    aliExpress?: string;
    alibaba1688?: string;
    metaAds?: string;
    tikTokAds?: string;
  } | null>(null);
  const [imageConfidence, setImageConfidence] = useState<number | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCountryChange = (country: string) => {
    setAuditMarket('');
    let defaultShip = 35;
    let defaultWholesale = 35;
    let defaultRetail = 229;
    let defaultCr = 85;
    let defaultDr = 80;

    if (country === 'GCC') {
      defaultShip = 25;
      defaultWholesale = 30;
      defaultRetail = 199;
      defaultCr = 87;
      defaultDr = 82;
    } else if (country === 'SN') {
      defaultShip = 2500;
      defaultWholesale = 3500;
      defaultRetail = 16500;
      defaultCr = 86;
      defaultDr = 82;
    } else if (country === 'US' || country === 'FR' || country === 'EU') {
      defaultShip = 5;
      defaultWholesale = 6;
      defaultRetail = 29.99;
      defaultCr = 96;
      defaultDr = 95;
    } else if (country === 'UK') {
      defaultShip = 4;
      defaultWholesale = 5;
      defaultRetail = 24.99;
      defaultCr = 97;
      defaultDr = 95;
    }

    setAdditionalCosts({});
    setAnalysisInput((prev) => ({
      ...prev,
      targetCountry: country,
      shippingFee: defaultShip,
      wholesalePrice: defaultWholesale,
      retailPrice: defaultRetail,
      estConfirmationRate: defaultCr,
      estDeliveryRate: defaultDr,
    }));
  };

  const handleTitleChange = (newTitle: string) => {
    const lower = newTitle.toLowerCase();
    let autoNiche = analysisInput.niche;

    if (
      lower.includes('magne') ||
      lower.includes('step') ||
      lower.includes('semelle') ||
      lower.includes('insole') ||
      lower.includes('genou') ||
      lower.includes('postur') ||
      lower.includes('massage') ||
      lower.includes('cervic') ||
      lower.includes('arthrose') ||
      lower.includes('lombair') ||
      lower.includes('talon') ||
      lower.includes('acupress') ||
      lower.includes('سميل') ||
      lower.includes('ركبة') ||
      lower.includes('ظهر')
    ) {
      autoNiche = 'HEALTH';
      if (lower.includes('magne') || lower.includes('step') || lower.includes('semelle') || lower.includes('insole')) {
      }
    } else if (
      lower.includes('matcha') ||
      lower.includes('ashwa') ||
      lower.includes('zinc') ||
      lower.includes('magnesium') ||
      lower.includes('omega') ||
      lower.includes('spiruline') ||
      lower.includes('gelule') ||
      lower.includes('the') ||
      lower.includes('minceur') ||
      lower.includes('ماتشا') ||
      lower.includes('مكمل')
    ) {
      autoNiche = 'SUPPLEMENTS';
    } else if (
      lower.includes('serum') ||
      lower.includes('creme') ||
      lower.includes('visage') ||
      lower.includes('peau') ||
      lower.includes('tache') ||
      lower.includes('eclairciss') ||
      lower.includes('سيروم') ||
      lower.includes('كريم') ||
      lower.includes('بشرة')
    ) {
      autoNiche = 'COSMETICS';
    } else if (
      lower.includes('brosse') ||
      lower.includes('hair') ||
      lower.includes('cheveux') ||
      lower.includes('epilat') ||
      lower.includes('شعر')
    ) {
      autoNiche = 'BEAUTY';
    } else if (
      lower.includes('hachoir') ||
      lower.includes('mixeur') ||
      lower.includes('cuisin') ||
      lower.includes('kitchen') ||
      lower.includes('مطبخ')
    ) {
      autoNiche = 'KITCHEN';
    } else if (
      lower.includes('car') ||
      lower.includes('voitur') ||
      lower.includes('auto') ||
      lower.includes('سيارة')
    ) {
      autoNiche = 'CAR';
    }

    setAnalysisInput((prev) => ({
      ...prev,
      title: newTitle,
      niche: autoNiche,
    }));
  };

  const getCurrencySymbol = (countryCode?: string) => {
    const c = countryCode || analysisInput.targetCountry;
    if (c === 'GCC') return 'SAR';
    if (c === 'SN') return 'FCFA';
    if (c === 'US' || c === 'GLOBAL') return '$';
    if (c === 'FR' || c === 'EU') return '€';
    if (c === 'UK') return '£';
    if (c === 'CA') return 'CAD';
    return 'DH';
  };
  const [additionalCosts, setAdditionalCosts] = useState<Partial<Record<(typeof codFees)[number], number>>>({});
  const codInput = { ...analysisInput, ...additionalCosts };
  const economics = validCodInputs(codInput) ? calculateCod(codInput) : null;
  const deliveryStress = economics && calculateCod({
    ...codInput,
    estDeliveryRate: Math.max(0, codInput.estDeliveryRate - 10),
    adCostPerLead: economics.assumedCpa,
  });
  const countryNames: Record<string, string> = {
    MA: 'Maroc', GCC: 'Arabie saoudite', SN: 'Sénégal', US: 'États-Unis',
    FR: 'France', UK: 'Royaume-Uni', CA: 'Canada',
  };

  // --- Tab 3: Media Buyer Copilot State ---
  const [campaignData, setCampaignData] = useState<(Awaited<ReturnType<typeof getLiveCampaignAudits>> & { metaSyncWarning?: string }) | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState(false);
  const [campaignRefresh, setCampaignRefresh] = useState(0);
  const [campaignPeriod, setCampaignPeriod] = useState<CampaignPeriod>('7d');

  const [metaAdmin, setMetaAdmin] = useState<{ stores: { id: string; name: string }[]; tokenConfigured: boolean } | null>(null);
  const [metaAccountInput, setMetaAccountInput] = useState('');
  const [metaBusy, setMetaBusy] = useState(false);
  const [metaNotice, setMetaNotice] = useState<{ error: boolean; text: string } | null>(null);

  useEffect(() => {
    if (activeTab !== 'MEDIA_BUYER_COPILOT') return;
    const controller = new AbortController();
    async function loadMetaControls() {
      try {
        const response = await fetch('/api/integrations/meta-ads', { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        setMetaAdmin({ stores: data.stores, tokenConfigured: data.tokenConfigured });
        setMetaAccountInput(data.connection?.accountId ?? '');
      } catch {
        // Campaign reports can still load independently of the admin controls.
      }
    }
    void loadMetaControls();
    return () => controller.abort();
  }, [activeTab]);

  async function updateMetaCampaign(payload: { action: 'sync'; accountId: string } |
    { action: 'assign'; accountId: string; campaignId: string; storeId: string | null }) {
    setMetaBusy(true);
    setMetaNotice(null);
    try {
      const response = await fetch('/api/integrations/meta-ads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMetaNotice({ error: false, text: payload.action === 'assign'
        ? (isAr ? 'تسجّل المتجر ديال الحملة.' : 'Affectation enregistrée.')
        : (isAr ? `تزامنو ${data.rows} سطر ديال المصاريف حسب الحملة والنهار.` : `${data.rows} lignes campagne/jour synchronisées.`) });
      setCampaignRefresh(value => value + 1);
    } catch (error) {
      setMetaNotice({ error: true, text: error instanceof Error ? error.message : 'Synchronisation indisponible.' });
    } finally {
      setMetaBusy(false);
    }
  }

  // 2. Fetch Stock Items for easy selection
  const fetchStock = async () => {
    try {
      const res = await fetch('/api/stock');
      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        setStockItems(data.products);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStock();
  }, []);

  useEffect(() => {
    if (activeTab !== 'MEDIA_BUYER_COPILOT') return;
    const controller = new AbortController();
    const query = new URLSearchParams({ tab: 'CAMPAIGN_AUDIT', period: campaignPeriod });
    if (selectedStoreId) query.set('storeId', selectedStoreId);
    setCampaignData(null);
    setCampaignError(false);
    setCampaignLoading(true);

    async function fetchCampaignSummary() {
      try {
        const response = await fetch(`/api/marketing-ai?${query}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Campaign summary unavailable');
        const data = await response.json();
        if (!controller.signal.aborted) setCampaignData(data);
      } catch {
        if (!controller.signal.aborted) setCampaignError(true);
      } finally {
        if (!controller.signal.aborted) setCampaignLoading(false);
      }
    }

    void fetchCampaignSummary();
    return () => controller.abort();
  }, [activeTab, selectedStoreId, campaignPeriod, campaignRefresh]);

  // Handle selecting product from stock
  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
    setAuditMarket('');
    if (!stockId) return;
    const found = stockItems.find((s) => s.id === stockId);
    if (found) {
      setAnalysisInput({
        title: found.name || '',
        niche: 'COSMETICS',
        targetCountry: 'MA',
        wholesalePrice: Number(found.costPrice) || 45,
        retailPrice: Number(found.sellingPrice) || 249,
        shippingFee: 35,
        estConfirmationRate: 80,
        estDeliveryRate: 75,
        productUrl: '',
        description: found.description || '',
        ingredientsOrDetails: '',
        imageUrl: found.imageUrl || '',
      });
    }
  };

  const openRadarProduct = (product: RadarProduct, destination: string) => {
    const normalized = destination.trim().toLowerCase();
    const targetCountry = Object.keys(countryNames).find(code =>
      code.toLowerCase() === normalized || countryNames[code].toLowerCase() === normalized,
    ) || (/^(morocco|المغرب)$/.test(normalized) ? 'MA' : 'GLOBAL');
    setAuditMarket(destination);
    setSelectedStockId('');
    handleRemoveImage();
    setAdditionalCosts({});
    setAnalysisInput({
      title: product.brand + ' ' + product.name,
      niche: product.category,
      targetCountry,
      wholesalePrice: 0,
      retailPrice: 0,
      shippingFee: 0,
      estConfirmationRate: 0,
      estDeliveryRate: 0,
      productUrl: product.identityUrl,
      description: product.variant,
      ingredientsOrDetails: '',
      imageUrl: '',
    });
    setActiveTab('PRODUCT_VALIDATOR');
  };

  // Image Upload & Visual AI Scanner Handlers
  const handleImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageScanning(true);
    setImageScanSuccess(false);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedImage(dataUrl);

      try {
        const res = await fetch('/api/marketing-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SCAN_IMAGE',
            imageBase64: dataUrl,
            filename: file.name,
            targetCountry: analysisInput.targetCountry,
          }),
        });

        const data = await res.json();
        if (data.success && data.scan) {
          const scan = data.scan;
          setImageScanSuccess(true);
          setImageFeatures(scan.detectedFeatures || []);
          setReverseSearchUrls(scan.reverseSearchUrls || null);
          setImageConfidence(scan.confidence || 95);

          setAnalysisInput((prev) => ({
            ...prev,
            title: scan.detectedTitle || prev.title,
            niche: scan.detectedNiche || prev.niche,
            wholesalePrice: scan.estimatedWholesale || prev.wholesalePrice,
            retailPrice: scan.suggestedRetail || prev.retailPrice,
            ingredientsOrDetails: scan.suggestedDescription || prev.ingredientsOrDetails,
            productUrl: scan.reverseSearchUrls?.aliExpress || prev.productUrl,
            imageUrl: dataUrl,
          }));
        }
      } catch (err) {
        console.error('Failed to scan image', err);
      } finally {
        setImageScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropImage = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteImage = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files[0]) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      }
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImageScanSuccess(false);
    setImageFeatures([]);
    setReverseSearchUrls(null);
    setImageConfidence(null);
    setAnalysisInput((prev) => ({ ...prev, imageUrl: '' }));
    if (imageFileInputRef.current) {
      imageFileInputRef.current.value = '';
    }
  };

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto space-y-6 ${isRtl ? 'font-sans' : ''}`}>
      {/* Top Banner & Header - Clean Prestige Theme */}
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm relative overflow-hidden space-y-5">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black tracking-wide">
              <Brain className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span>{t.topBadge}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3 font-heading">
              <span>{t.pageTitle}</span>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed font-medium">
              {isAr ? 'اكتشف منتجات للاستيراد، دقّق العرض واحسب ربحية الدفع عند الاستلام.' : 'Repérez des produits à importer, auditez votre offre et calculez sa rentabilité COD.'}
            </p>
          </div>

        </div>

        {/* Global Navigation Tabs */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/90 shadow-2xs">
            <button
              onClick={() => setActiveTab('WINNING_PRODUCTS')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'WINNING_PRODUCTS'
                  ? 'bg-white text-slate-900 shadow-sm font-black border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>{isAr ? 'رادار الاستيراد' : 'Radar d’importation'}</span>
            </button>

            <button
              onClick={() => setActiveTab('PRODUCT_VALIDATOR')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'PRODUCT_VALIDATOR'
                  ? 'bg-white text-slate-900 shadow-sm font-black border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Target className="w-4 h-4 text-indigo-600" />
              <span>{t.tabValidator}</span>
            </button>

            <button
              onClick={() => setActiveTab('MEDIA_BUYER_COPILOT')}
              className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'MEDIA_BUYER_COPILOT'
                  ? 'bg-white text-slate-900 shadow-sm font-black border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>{t.tabCopilot}</span>
            </button>
          </div>
        </div>
      </div>

      <div hidden={activeTab !== 'WINNING_PRODUCTS'}>
        <ImportRadar key={selectedCountry} isAr={isAr}
          defaultTarget={countryNames[selectedCountry] || 'Maroc'} onAudit={openRadarProduct} />
      </div>

      {/* ========================================================================= */}
      {/* TAB 2: محلل المنتج والسكريبتات (PRODUCT VALIDATOR & SCRIPTS)               */}
      {/* ========================================================================= */}
      {activeTab === 'PRODUCT_VALIDATOR' && (
        <div className="space-y-6">
          {/* Product Input Card - Prestige Studio Form */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-black text-2xl shadow-xs">
                  🎯
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-black text-slate-900 font-heading flex items-center gap-2">
                    <span>{t.valHeaderTitle}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                      {t.valBadgeDirect}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {t.valHeaderDesc}
                  </p>
                </div>
              </div>

              {/* Quick Select from existing Sanadokom Stock */}
              {stockItems.length > 0 && (
                <div className="w-full sm:w-auto shrink-0">
                  <select
                    value={selectedStockId}
                    onChange={(e) => handleStockSelect(e.target.value)}
                    className="w-full sm:w-64 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 cursor-pointer focus:bg-white shadow-2xs"
                  >
                    <option value="">{t.valChooseStock}</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        📦 {item.name} ({item.sellingPrice || 199} DH)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Visual Image Scanner & Reverse Image Search Zone */}
            <div
              className={`rounded-3xl p-5 md:p-6 transition-all border ${
                isDraggingImage
                  ? 'bg-indigo-50 border-indigo-500 ring-4 ring-indigo-500/20'
                  : uploadedImage
                  ? 'bg-gradient-to-br from-indigo-50/50 via-purple-50/25 to-slate-50 border-indigo-200'
                  : 'bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 border-slate-200 hover:border-indigo-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingImage(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDraggingImage(false);
              }}
              onDrop={handleDropImage}
              onPaste={handlePasteImage}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900 font-heading">
                        {t.visualScanTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200">
                        {t.visualScanBadge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {t.visualScanSubtitle}
                    </p>
                  </div>
                </div>

                {uploadedImage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => imageFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{t.visualScanChange}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.visualScanRemove}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              {/* Body: Upload state OR Scanned Preview State */}
              {!uploadedImage ? (
                <div
                  onClick={() => imageFileInputRef.current?.click()}
                  className="mt-4 p-8 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-2xl bg-white/80 hover:bg-white text-center cursor-pointer transition-all group flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <UploadCloud className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs md:text-sm font-black text-slate-800">
                      {t.visualScanDropTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {t.visualScanDropSub}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-indigo-600 font-extrabold">
                    <span>⚡ AI Visual Recognition • Google Lens • 1688 / AliExpress</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Left: Image Thumbnail Preview */}
                  <div className="md:col-span-4 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md h-52 group">
                    <img
                      src={uploadedImage}
                      alt="Scanned Product"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {imageConfidence && (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-xs text-emerald-400 text-[10px] font-black border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{t.visualScanConfidence} {imageConfidence}%</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white p-2 rounded-xl text-[11px] font-bold text-center truncate">
                      {analysisInput.title || 'Product Visual Subject'}
                    </div>
                  </div>

                  {/* Right: Scan Results, Status, and Reverse Search Actions */}
                  <div className="md:col-span-8 space-y-4">
                    {imageScanning ? (
                      <div className="p-5 rounded-2xl bg-white border border-indigo-200 flex items-center gap-4 shadow-xs">
                        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin shrink-0" />
                        <div className="space-y-1">
                          <div className="text-xs font-black text-slate-900">
                            {t.visualScanAnalyzing}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            استخراج الميزات البصرية، فحص النيتش، وتقدير أسعار الجملة والبيع
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {imageScanSuccess && (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-900">
                              {t.visualScanSuccess}
                            </span>
                          </div>
                        )}

                        {imageFeatures.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-extrabold text-slate-500">
                              الميزات البصرية المكتشفة بالذكاء الاصطناعي :
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {imageFeatures.map((feat, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-bold shadow-2xs"
                                >
                                  ✨ {feat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reverse Search Action Buttons */}
                        <div className="space-y-2 pt-1">
                          <div className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-indigo-600" />
                            <span>البحث العكسي المباشر وتتبع الموردين والمنافسين :</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Google Lens */}
                            <a
                              href={reverseSearchUrls?.googleLens || `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(uploadedImage)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span className="truncate">{t.visualScanGoogleLens}</span>
                            </a>

                            {/* AliExpress / 1688 Factory */}
                            <a
                              href={reverseSearchUrls?.aliExpress || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(analysisInput.title || 'trending product')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Factory className="w-3.5 h-3.5" />
                              <span className="truncate">{t.visualScanFactorySearch}</span>
                            </a>

                            {/* Meta & TikTok Active Ads */}
                            <a
                              href={reverseSearchUrls?.metaAds || `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(analysisInput.title || 'viral product')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                              <span className="truncate">{t.visualScanAdsSearch}</span>
                            </a>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Input Form Fields */}
            <div className="space-y-4">
              {/* Row 1: Title, Target Country, Niche */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldTitle} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t.valFieldTitlePlaceholder}
                    value={analysisInput.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldCountry} <span className="text-indigo-600 font-extrabold">({getCurrencySymbol()})</span>
                  </label>
                  <select
                    value={analysisInput.targetCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full text-xs border border-indigo-200 rounded-xl p-3 bg-indigo-50/50 font-black text-slate-900 cursor-pointer focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MA">🇲🇦 المغرب (Morocco - DH)</option>
                    <option value="GCC">🇸🇦 دول الخليج والسعودية (GCC - SAR)</option>
                    <option value="SN">🇸🇳 السنغال وغرب إفريقيا (Senegal - FCFA)</option>
                    <option value="US">🇺🇸 الولايات المتحدة (USA - $)</option>
                    <option value="FR">🇫🇷 فرنسا وأوروبا (France & EU - €)</option>
                    <option value="UK">🇬🇧 بريطانيا (UK - £)</option>
                    <option value="CA">🇨🇦 كندا (Canada - CAD$)</option>
                    <option value="GLOBAL">🌍 السوق العالمي الشامل (Global - $)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.valFieldNiche}</label>
                  <select
                    value={analysisInput.niche}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, niche: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 bg-white font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="COSMETICS">{t.nicheCosmetics}</option>
                    <option value="SUPPLEMENTS">{t.nicheSupplements}</option>
                    <option value="BEAUTY">{t.nicheBeauty}</option>
                    <option value="KITCHEN">{t.nicheKitchen}</option>
                    <option value="CAR">{t.nicheCar}</option>
                    <option value="HEALTH">{t.nicheHealth}</option>
                    <option value="GADGETS">{t.nicheGadgets}</option>
                    <option value="HOME">{t.nicheHome}</option>
                    <option value="PETS">{t.nichePets}</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Financials & COD Economics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldWholesale} ({getCurrencySymbol()})
                  </label>
                  <input
                    type="number"
                    placeholder="45"
                    value={analysisInput.wholesalePrice}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, wholesalePrice: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldRetail} ({getCurrencySymbol()})
                  </label>
                  <input
                    type="number"
                    placeholder="249"
                    value={analysisInput.retailPrice}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, retailPrice: Number(e.target.value) })}
                    className="w-full text-xs border border-indigo-300 rounded-xl p-3 font-black text-indigo-700 bg-indigo-50/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldShipping} ({getCurrencySymbol()})
                  </label>
                  <input
                    type="number"
                    placeholder="35"
                    value={analysisInput.shippingFee}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, shippingFee: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.valFieldConfRate}</label>
                  <input
                    type="number"
                    placeholder="85"
                    value={analysisInput.estConfirmationRate}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, estConfirmationRate: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.valFieldDelivRate}</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={analysisInput.estDeliveryRate}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, estDeliveryRate: Number(e.target.value) })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Row 3: Description, Ingredients, and Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldIngredients}
                  </label>
                  <input
                    type="text"
                    placeholder={t.valFieldIngredientsPlaceholder}
                    value={analysisInput.ingredientsOrDetails || analysisInput.description}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, ingredientsOrDetails: e.target.value, description: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 font-medium text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t.valFieldUrl}
                  </label>
                  <input
                    type="text"
                    placeholder={t.valFieldUrlPlaceholder}
                    value={analysisInput.productUrl}
                    onChange={(e) => setAnalysisInput({ ...analysisInput, productUrl: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 font-medium text-slate-800 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {([
                ['Emballage / expédition', 'التغليف لكل شحنة'],
                ['Supplément par échec de livraison', 'تكلفة إضافية لكل فشل توصيل'],
                ['Frais COD et taxes / livré', 'رسوم الدفع والضرائب لكل طلب مستلم'],
                ['Traitement / lead', 'معالجة كل طلب وارد'],
                ['Coût pub / lead (facultatif)', 'تكلفة الإعلان لكل طلب وارد (اختياري)'],
              ] as const).map(([fr, ar], index) => {
                const key = codFees[index];
                return (
                  <label key={key} className="space-y-1 text-xs font-bold text-slate-700">
                    {isAr ? ar : fr} ({getCurrencySymbol()})
                    <input type="number" min="0" step="any" placeholder={key === 'adCostPerLead' ? '—' : '0'}
                      className="w-full rounded-xl border border-slate-300 p-3"
                      value={additionalCosts[key] ?? ''}
                      onChange={(event) => setAdditionalCosts((prev) => ({
                        ...prev, [key]: event.target.value === '' ? undefined : Number(event.target.value),
                      }))} />
                  </label>
                );
              })}
            </div>
          </div>

          <section className="rounded-3xl bg-slate-900 p-6 text-white space-y-4">
            <h2 className="text-lg font-black">{isAr ? 'ربحية الدفع عند الاستلام' : 'Rentabilité COD'} ({getCurrencySymbol()})</h2>
            <p className="text-sm text-slate-300">
              {isAr
                ? 'كل الأرقام فرضيات قابلة للتعديل. معدل التسليم من الطلبات المؤكدة. يفترض الحساب شحن كل طلب مؤكد واسترجاع البضاعة القابلة للبيع عند فشل التسليم.'
                : 'Les valeurs saisies sont des hypothèses. Le taux de livraison s’applique aux commandes confirmées, supposées expédiées. Le modèle suppose que les articles non livrés restent revendables. Ajoutez toute perte de stock au coût d’échec.'}
            </p>
            {economics ? (
              <>
                <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {([
                    [isAr ? 'أقصى تكلفة إعلان لكل طلب وارد' : 'CPA max par lead', economics.breakEvenCpa],
                    [isAr ? 'تكلفة الإعلان المعتمدة لكل طلب وارد' : 'Coût pub retenu par lead', economics.assumedCpa],
                    [isAr ? 'صافي الربح لكل طلب مستلم' : 'Bénéfice par commande livrée', economics.netProfitPerDelivered],
                    [isAr ? 'صافي الربح لكل 100 طلب وارد' : 'Bénéfice pour 100 leads', economics.expectedNetProfitPer100Leads],
                  ] as const).map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-white/10 p-4">
                      <dt className="text-xs font-medium text-slate-300">{label}</dt>
                      <dd className="mt-1 text-xl font-black">{value === null ? '—' : value + ' ' + getCurrencySymbol()}</dd>
                    </div>
                  ))}
                </dl>
                <p className="text-sm text-slate-300">
                  {isAr
                    ? `لكل 100 طلب وارد: ${economics.deliveredPer100} مستلمة و${economics.failedPer100} تعذر تسليمها. المداخيل ${economics.revenuePer100}، التكاليف دون الإعلان ${economics.nonAdCostPer100}، الإعلان ${economics.adSpendPer100} ${getCurrencySymbol()}.`
                    : `Sur 100 leads, ${economics.deliveredPer100} livrés et ${economics.failedPer100} échecs. CA encaissé ${economics.revenuePer100}, coûts hors pub ${economics.nonAdCostPer100}, dépenses pub ${economics.adSpendPer100} ${getCurrencySymbol()}.`}
                </p>
                <p className="text-sm text-slate-300">
                  {isAr ? 'فرضية تكلفة اختبار لكل طلب وارد' : 'Fourchette de test indicative par lead'} {economics.targetCpaMin}–{economics.targetCpaMax} {getCurrencySymbol()} · ROAS {economics.roasTarget === null ? '—' : economics.roasTarget + '×'}
                </p>
                {deliveryStress && (
                  <p className="text-sm text-slate-300">
                    {isAr ? 'مع انخفاض التسليم حتى 10 نقاط، الربح لكل 100 طلب وارد' : 'Avec jusqu’à 10 points de livraison en moins, bénéfice pour 100 leads'} {deliveryStress.expectedNetProfitPer100Leads} {getCurrencySymbol()}
                  </p>
                )}
              </>
            ) : (
              <p role="alert" className="text-sm text-amber-200">
                {isAr ? 'راجع الأسعار والتكاليف ومعدلات التأكيد والتسليم.' : 'Vérifiez le prix de vente, les coûts positifs et les taux compris entre 0 et 100 %.'}
              </p>
            )}
          </section>

          <MarketResearch mode="audit" isAr={isAr} key={auditMarket || analysisInput.targetCountry}
            defaultTarget={auditMarket || countryNames[analysisInput.targetCountry]}
            product={analysisInput.title.trim()
              ? [analysisInput.title, analysisInput.ingredientsOrDetails || analysisInput.description, analysisInput.productUrl].filter(Boolean).join('\n').slice(0, 1600)
              : ''} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: خبير الميديا باير اليومي (DAILY MEDIA BUYER COPILOT)                */}
      {/* ========================================================================= */}
      {activeTab === 'MEDIA_BUYER_COPILOT' && (
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black">{isAr ? 'متابعة الطلبات والتسليم' : 'Suivi des commandes et livraisons'}</h2>
              <p className="text-sm text-slate-600">
                {isAr ? 'الفلتر كيعتمد على تاريخ دخول الطلب بتوقيت المغرب. الأرقام كتعكس الحالة الحالية ديالو.' : 'Période selon la date de création des commandes, heure du Maroc. Les chiffres reflètent leur statut actuel.'}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="grid gap-1 text-xs font-semibold text-slate-700">
                {isAr ? 'الفترة' : 'Période'}
                <select value={campaignPeriod} onChange={event => setCampaignPeriod(event.target.value as CampaignPeriod)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="today">{isAr ? 'اليوم' : 'Aujourd’hui'}</option>
                  <option value="7d">{isAr ? 'آخر 7 أيام' : '7 derniers jours'}</option>
                  <option value="30d">{isAr ? 'آخر 30 يوم' : '30 derniers jours'}</option>
                  <option value="all">{isAr ? 'كامل التاريخ' : 'Tout l’historique'}</option>
                </select>
              </label>
              <button type="button" disabled={campaignLoading} onClick={() => setCampaignRefresh(value => value + 1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">
                <RefreshCw className={`h-4 w-4 ${campaignLoading ? 'animate-spin' : ''}`} />
                {isAr ? 'تحديث' : 'Actualiser'}
              </button>
            </div>
          </div>

          {campaignLoading && <p role="status" className="text-sm text-slate-600">{isAr ? 'جارٍ التحميل…' : 'Chargement…'}</p>}
          {campaignError && <p role="alert" className="text-sm text-red-700">{isAr ? 'تعذر تحميل الطلبات.' : 'Impossible de charger les commandes.'}</p>}
          {campaignData && (
            <>
              <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {([
                  [isAr ? 'الطلبات الواردة' : 'Commandes reçues', campaignData.kpis.totalOrders, null],
                  [isAr ? 'مؤكدة' : 'Confirmées', campaignData.kpis.totalConfirmedOrders, campaignData.kpis.realConfirmationRate],
                  [isAr ? 'فالطريق' : 'En cours de livraison', campaignData.kpis.totalInTransitOrders, null],
                  [isAr ? 'مسلّمة' : 'Livrées', campaignData.kpis.totalDeliveredOrders, null],
                  [isAr ? 'مرتجعة' : 'Retournées', campaignData.kpis.totalReturnedOrders, null],
                ] as const).map(([label, count, rate]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                    <dd className="mt-1 text-2xl font-black tabular-nums">
                      {count} {rate !== null && <span className="text-sm font-semibold text-slate-600">({rate} %)</span>}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="text-sm text-slate-700">
                <strong>{isAr ? 'نسبة التسليم للشحنات اللي تسالات' : 'Taux de livraison des expéditions clôturées'}</strong>{' '}
                {campaignData.kpis.completedDeliveryRate === null ? '—' : `${campaignData.kpis.completedDeliveryRate} %`}
                {' · '}{isAr ? 'المسلّمة ÷ (المسلّمة + المرتجعة)' : 'Livrées ÷ (livrées + retournées)'}
              </p>

              <h3 className="font-bold text-slate-900">{isAr ? 'النتائج حسب الحملة والمصدر' : 'Résultats par campagne et source'}</h3>
              {campaignData.campaigns.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-max w-full text-start text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        {(isAr
                          ? ['الحملة', 'المصدر', 'واردة', 'مؤكدة', 'فالطريق', 'مسلّمة', 'مرتجعة', 'نسبة التسليم بعد الإغلاق']
                          : ['Campagne', 'Source', 'Reçues', 'Confirmées', 'En cours', 'Livrées', 'Retournées', 'Livraison après clôture']
                        ).map(label => <th key={label} scope="col" className="px-3 py-2.5 text-start font-semibold">{label}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 tabular-nums">
                      {campaignData.campaigns.map(row => (
                        <tr key={JSON.stringify([row.campaign, row.source])}>
                          <th scope="row" className="max-w-64 break-words px-3 py-2.5 text-start font-semibold">
                            <bdi>{row.campaign ?? (isAr ? 'حملة غير مسجّلة' : 'Campagne non renseignée')}</bdi>
                          </th>
                          <td className="max-w-44 break-words px-3 py-2.5"><bdi>{row.source ?? (isAr ? 'مصدر غير مسجّل' : 'Source non renseignée')}</bdi></td>
                          <td className="px-3 py-2.5">{row.totalOrders}</td>
                          <td className="px-3 py-2.5">{row.totalConfirmedOrders}</td>
                          <td className="px-3 py-2.5">{row.totalInTransitOrders}</td>
                          <td className="px-3 py-2.5">{row.totalDeliveredOrders}</td>
                          <td className="px-3 py-2.5">{row.totalReturnedOrders}</td>
                          <td className="px-3 py-2.5">{row.completedDeliveryRate === null ? '—' : `${row.completedDeliveryRate} %`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {isAr ? 'ما كايناش طلبيات فهاد الفترة للمتاجر المختارة.' : 'Aucune commande sur cette période pour les boutiques sélectionnées.'}
                </p>
              )}
            </>
          )}

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="font-bold">{isAr ? 'مصاريف حملات Meta' : 'Dépenses des campagnes Meta'}</h3>
            {metaAdmin && (
              <form className="flex flex-wrap items-end gap-3" onSubmit={event => {
                event.preventDefault();
                void updateMetaCampaign({ action: 'sync', accountId: metaAccountInput });
              }}>
                <label className="grid gap-1 text-sm text-slate-700">
                  {isAr ? 'رقم الحساب الإعلاني المشترك' : 'ID du compte Meta partagé'}
                  <input className="rounded-lg border border-slate-300 p-2" dir="ltr" value={metaAccountInput}
                    onChange={event => setMetaAccountInput(event.target.value)} placeholder="act_…" required />
                </label>
                <button type="submit" disabled={metaBusy || !metaAdmin.tokenConfigured}
                  className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  {isAr ? 'زامن مصاريف Meta' : 'Synchroniser les dépenses Meta'}
                </button>
                {!metaAdmin.tokenConfigured && <p className="text-sm text-slate-600">META_ADS_READ_TOKEN</p>}
              </form>
            )}
            {metaNotice && <p role={metaNotice.error ? 'alert' : 'status'}
              className={metaNotice.error ? 'text-sm text-rose-700' : 'text-sm text-emerald-700'}>{metaNotice.text}</p>}
            {campaignData?.metaSyncWarning && (
              <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                {isAr ? 'تعذّر تحديث Meta. الأرقام المعروضة من آخر مزامنة ناجحة.' : campaignData.metaSyncWarning}
              </p>
            )}
            {campaignData && !campaignData.metaAccounts.length && (
              <p className="text-sm text-slate-600">
                {isAr ? 'ما كايناش مصاريف Meta لهاد المتاجر فالفترة المختارة.' : 'Aucune dépense Meta pour les boutiques et la période sélectionnées.'}
              </p>
            )}
            {campaignData?.metaAccounts.map(account => (
              <div key={JSON.stringify([account.accountId, account.storeId])} className="space-y-2 rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold">{account.storeName || (isAr ? 'حملات بلا متجر' : 'Campagnes non affectées')} · <bdi>act_{account.accountId}</bdi></h4>
                <p className="text-xs text-slate-600">
                  {isAr ? 'آخر مزامنة' : 'Dernière synchronisation'}{' '}
                  {new Date(account.lastSyncAt).toLocaleString(isAr ? 'ar-MA' : 'fr-MA', { timeZone: 'Africa/Casablanca' })}
                  {' · '}{account.timeZone}
                </p>
                {account.storeId && !account.comparable && (
                  <p className="text-xs text-slate-600">
                    {isAr ? 'المصاريف بتوقيت حساب Meta. تكلفة الطلب كتظهر ملي الفترة متزامنة والتوقيت مطابق للمغرب.' :
                      'Dépenses dans le fuseau Meta. Le coût par livraison nécessite une période synchronisée et le même fuseau que les commandes.'}
                  </p>
                )}
                {!account.rows.length ? <p className="text-sm text-slate-600">{isAr ? 'ما كايناش مصاريف مسجّلة لهاد الفترة.' : 'Aucune dépense enregistrée sur cette période.'}</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm tabular-nums">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>{(isAr ? ['الحملة', 'الصرف', 'طلبات مسلّمة مرتبطة', 'تكلفة الطلب المسلّم'] :
                          ['Campagne', 'Dépenses', 'Livraisons attribuées', 'Coût / livraison']).map(label =>
                          <th key={label} scope="col" className="px-3 py-2 text-start">{label}</th>)}
                          {metaAdmin && account.shared && <th scope="col" className="px-3 py-2 text-start">{isAr ? 'المتجر' : 'Boutique'}</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {account.rows.map(row => (
                          <tr key={row.campaignId + row.currency}>
                            <th scope="row" className="px-3 py-2 text-start"><bdi>{row.name || row.campaignId}</bdi></th>
                            <td className="whitespace-nowrap px-3 py-2">{row.spend.toFixed(2)} {row.currency}</td>
                            <td className="px-3 py-2">{row.delivered ?? '—'}</td>
                            <td className="whitespace-nowrap px-3 py-2">{row.costPerDelivery === null ? '—' : row.costPerDelivery.toFixed(2) + ' ' + row.currency}</td>
                            {metaAdmin && account.shared && (
                              <td className="px-3 py-2">
                                <select className="rounded-lg border border-slate-300 p-2" value={account.storeId ?? ''}
                                  aria-label={`${isAr ? 'المتجر ديال' : 'Boutique pour'} ${row.name || row.campaignId}`}
                                  disabled={metaBusy} onChange={event => void updateMetaCampaign({
                                    action: 'assign', accountId: account.accountId, campaignId: row.campaignId,
                                    storeId: event.target.value || null,
                                  })}>
                                  <option value="">{isAr ? 'بلا متجر' : 'Non affectée'}</option>
                                  {metaAdmin.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                                </select>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}

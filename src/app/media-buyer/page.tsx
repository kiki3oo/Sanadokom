'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  Flame,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  Layers,
  DollarSign,
  Search,
  Filter,
  ArrowUpRight,
  Zap,
  BarChart3,
  Lightbulb,
  Percent,
  ShoppingBag,
  RefreshCw,
  Sliders,
  ChevronRight,
  Play,
  Eye,
  Check,
  Send,
  HelpCircle,
  Globe,
  Package,
  Video,
  ShieldAlert,
  MapPin,
  Clock,
  Camera,
  UploadCloud,
  ImageIcon,
  Trash2,
  Scan,
  Factory,
} from 'lucide-react';
import type { WinningProduct, getLiveCampaignAudits } from '@/lib/marketingAi';
import { calculateCod, codFees, validCodInputs } from '@/lib/codEconomics';
import { MarketResearch } from './MarketResearch';
import { mediaBuyerTranslations } from '@/lib/mediaBuyerTranslations';

export default function MediaBuyerPage() {
  const { currentUser, isAdmin, isManager } = useAuth();
  const { selectedStoreId } = useStore();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const isRtl = isAr;
  const t = mediaBuyerTranslations[language === 'ar' ? 'ar' : 'fr'] || mediaBuyerTranslations.fr;

  // Navigation Tabs: 'WINNING_PRODUCTS' | 'PRODUCT_VALIDATOR' | 'MEDIA_BUYER_COPILOT'
  const [activeTab, setActiveTab] = useState<'WINNING_PRODUCTS' | 'PRODUCT_VALIDATOR' | 'MEDIA_BUYER_COPILOT'>(
    'WINNING_PRODUCTS'
  );

  // --- Tab 1: Winning Products State ---
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Product Details Modal
  const [selectedProductDetails, setSelectedProductDetails] = useState<WinningProduct | null>(null);

  // AI Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiNiche, setAiNiche] = useState('BEAUTY');
  const [aiCountry, setAiCountry] = useState('ALL');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // --- Tab 2: Product Validator State ---
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [selectedStockId, setSelectedStockId] = useState('');
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
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof getLiveCampaignAudits>> | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState(false);
  const [campaignRefresh, setCampaignRefresh] = useState(0);

  // 1. Fetch Winning Products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedNiche !== 'ALL') params.append('niche', selectedNiche);
      if (selectedCountry !== 'ALL') params.append('country', selectedCountry);
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/marketing-ai?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

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
    fetchProducts();
  }, [selectedNiche, selectedCountry, selectedStatus, selectedType]);

  useEffect(() => {
    if (activeTab !== 'MEDIA_BUYER_COPILOT') return;
    const controller = new AbortController();
    const query = new URLSearchParams({ tab: 'CAMPAIGN_AUDIT' });
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
  }, [activeTab, selectedStoreId, campaignRefresh]);

  // Handle selecting product from stock
  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
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

  // Transfer winning product to validator
  const handleSendToValidator = (wp: WinningProduct) => {
    const targetCountry = wp.country === 'GLOBAL' ? 'US' : wp.country;
    const payload = {
      title: wp.title,
      niche: wp.niche,
      targetCountry,
      wholesalePrice: wp.wholesalePrice,
      retailPrice: wp.retailPrice,
      shippingFee: wp.estShippingFee,
      estConfirmationRate: wp.estConfirmationRate,
      estDeliveryRate: wp.estDeliveryRate,
      productUrl: '',
      description: wp.descriptionAr || wp.description,
      ingredientsOrDetails: '',
      imageUrl: wp.imageUrl || '',
    };
    setAnalysisInput(payload);
    if (wp.imageUrl) {
      setUploadedImage(wp.imageUrl);
      setImageScanSuccess(true);
      setImageConfidence(98);
      setImageFeatures([wp.title, wp.niche, 'Winning Product Radar']);
      setReverseSearchUrls({
        googleLens: `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(wp.imageUrl)}`,
        aliExpress: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(wp.title)}`,
        metaAds: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(wp.title)}`,
        tikTokAds: `https://www.tiktok.com/search?q=${encodeURIComponent(wp.title)}`,
      });
    }
    setSelectedProductDetails(null);
    setActiveTab('PRODUCT_VALIDATOR');
    setAdditionalCosts({});
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

  // Generate new AI winning product ideas
  const handleGenerateIdeas = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/marketing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GENERATE_IDEAS',
          niche: aiNiche,
          country: aiCountry,
          prompt: aiCustomPrompt,
        }),
      });
      const data = await res.json();
      if (data.success && data.ideas) {
        setShowAiModal(false);
        fetchProducts();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  // URL Helpers
  const getMetaAdLibraryUrl = (p: WinningProduct, countryCode: string = 'ALL') => {
    const query = encodeURIComponent(p.metaAdLibraryKeyword || p.title);
    return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${countryCode}&q=${query}&search_type=keyword_unordered&media_type=all`;
  };

  const getTikTokTagUrl = (p: WinningProduct) => {
    if (p.tikTokTag) {
      return `https://www.tiktok.com/tag/${encodeURIComponent(p.tikTokTag)}`;
    }
    const raw = (p.tikTokSearchKeyword || p.metaAdLibraryKeyword || p.title)
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]/gi, '');
    return `https://www.tiktok.com/tag/${encodeURIComponent(raw || 'viral')}`;
  };

  const getTikTokSearchUrl = (p: WinningProduct) => {
    // Direct /search?q= on TikTok web throws "Une erreur est survenue" for non-logged-in desktop users.
    // TikTok hashtag pages (/tag/...) are public SSR pages that load 100% reliably.
    return getTikTokTagUrl(p);
  };

  const getTikTokGoogleSearchUrl = (p: WinningProduct) => {
    const query = encodeURIComponent((p.tikTokSearchKeyword || p.metaAdLibraryKeyword || p.title) + ' site:tiktok.com');
    return `https://www.google.com/search?tbm=vid&q=${query}`;
  };

  const getAliExpressUrl = (p: WinningProduct) => {
    const query = encodeURIComponent(p.aliExpressSearchKeyword || p.metaAdLibraryKeyword || p.title);
    return `https://www.aliexpress.com/wholesale?SearchText=${query}`;
  };

  const getGoogleVideoAdsUrl = (p: WinningProduct) => {
    const query = encodeURIComponent((p.metaAdLibraryKeyword || p.title) + ' video ads');
    return `https://www.google.com/search?tbm=vid&q=${query}`;
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
              {t.pageSubtitle}
            </p>
          </div>

          {/* Quick CTA to AI Idea Generator */}
          <button
            onClick={() => setShowAiModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs md:text-sm shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 border border-amber-300/40"
          >
            <Lightbulb className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>{t.aiGenBtn}</span>
          </button>
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
              <span>{t.tabWinning}</span>
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

      {/* ========================================================================= */}
      {/* TAB 1: صائد المنتجات الرابحة الدقيقة (PRECISE WINNING PRODUCTS RADAR)      */}
      {/* ========================================================================= */}
      {activeTab === 'WINNING_PRODUCTS' && (
        <div className="space-y-6">
          <MarketResearch mode="scout" isAr={isAr} />
          <p className="text-sm text-slate-600">
            {isAr ? 'الكتالوج أدناه يعرض أفكاراً وتقديرات مرجعية.' : 'Le catalogue ci-dessous présente des idées et des estimations indicatives.'}
          </p>
          {/* AI Precise Winning Product Scout Hero Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-900/50 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 via-purple-500/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.scoutBadge}</span>
                </div>
                <h2 className="text-base md:text-lg font-black text-white font-heading">
                  {t.scoutTitle}
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  {t.scoutSubtitle}
                </p>
              </div>

              {/* Instant Hunter Quick Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNiche('COSMETICS');
                    setSelectedCountry('MA');
                  }}
                  className="px-3 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>{t.pillCosmetics}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNiche('SUPPLEMENTS');
                    setSelectedCountry('ALL');
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>{t.pillSupplements}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCountry('GCC');
                    setSelectedNiche('ALL');
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>{t.pillGcc}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                  className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold text-slate-800"
                />
              </div>

              {/* Quick Selectors: Niches & Worldwide Markets */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Niche */}
                <select
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 cursor-pointer focus:bg-white"
                >
                  <option value="ALL">{t.allNiches}</option>
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

                {/* Country / Market - All Worldwide Markets */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 cursor-pointer focus:bg-white"
                >
                  <option value="ALL">{t.allCountries}</option>
                  <option value="MA">{t.countryMA}</option>
                  <option value="US">{t.countryUS}</option>
                  <option value="FR">{t.countryFR}</option>
                  <option value="GCC">{t.countryGCC}</option>
                  <option value="SN">{t.countrySN}</option>
                  <option value="GLOBAL">{t.countryGLOBAL}</option>
                </select>

                {/* Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 cursor-pointer focus:bg-white"
                >
                  <option value="ALL">{t.allStatuses}</option>
                  <option value="HOT">{t.statusHot}</option>
                  <option value="EMERGING">{t.statusEmerging}</option>
                  <option value="EVERGREEN">{t.statusEvergreen}</option>
                </select>

                <button
                  onClick={fetchProducts}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="تحديث القائمة"
                >
                  <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Micro Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span className="font-extrabold flex items-center gap-1 text-slate-700">
                <Filter className="w-3.5 h-3.5" />
                <span>{t.quickFilterLabel}</span>
              </span>
              <button
                onClick={() => setSelectedType(selectedType === 'PROBLEM_SOLVER' ? 'ALL' : 'PROBLEM_SOLVER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  selectedType === 'PROBLEM_SOLVER'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.filterProblemSolver}
              </button>
              <button
                onClick={() => setSelectedType(selectedType === 'WOW_FACTOR' ? 'ALL' : 'WOW_FACTOR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  selectedType === 'WOW_FACTOR'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.filterWowFactor}
              </button>
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'EMERGING' ? 'ALL' : 'EMERGING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  selectedStatus === 'EMERGING'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {t.filterHighOpportunity}
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-bold">{t.loadingProducts}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">{t.noProductsTitle}</h3>
              <p className="text-xs text-slate-500 font-medium">{t.noProductsDesc}</p>
              <button
                onClick={() => {
                  setSelectedNiche('ALL');
                  setSelectedCountry('ALL');
                  setSelectedStatus('ALL');
                  setSelectedType('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer"
              >
                {t.resetFiltersBtn}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const statusBadge =
                  p.status === 'HOT'
                    ? { text: t.statusHot, bg: 'bg-rose-500 text-white' }
                    : p.status === 'EMERGING'
                    ? { text: t.statusEmerging, bg: 'bg-emerald-600 text-white' }
                    : { text: t.statusEvergreen, bg: 'bg-blue-600 text-white' };

                const globalMetaUrl = getMetaAdLibraryUrl(p, 'ALL');
                const localMetaUrl = getMetaAdLibraryUrl(p, p.country === 'GLOBAL' ? 'ALL' : p.country);
                const tikTokUrl = getTikTokSearchUrl(p);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col overflow-hidden group cursor-pointer"
                    onClick={() => setSelectedProductDetails(p)}
                  >
                    {/* Image Thumbnail with Strong Contrast Overlay */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e: any) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
                        }}
                      />
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black shadow-md ${statusBadge.bg}`}>
                          {statusBadge.text}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-950/85 text-white shadow-md">
                          {p.niche}
                        </span>
                      </div>
                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-white text-slate-900 shadow-md border border-slate-200">
                          {p.countryFlag || '🌍'} {p.countryNameAr || p.country}
                        </span>
                      </div>

                      {/* Bottom Image Gradient Overlay for 100% Readability */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-3 pt-8 text-white flex items-center justify-between text-xs z-10">
                        <span className="font-extrabold text-emerald-400 text-xs flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{t.estProfitPerOrder}{p.netProfitPerUnit} {p.currency || 'DH'} / {isAr ? 'طلب' : 'cmd'}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-200 bg-white/20 px-2 py-0.5 rounded-md">
                          {t.confirmationBadge}: {p.estConfirmationRate}%
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2 cursor-pointer" onClick={() => setSelectedProductDetails(p)}>
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors" title={isAr ? (p.titleAr || p.title) : (p.title || p.titleAr)}>
                          {isAr ? (p.titleAr || p.title) : (p.title || p.titleAr)}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {isAr ? (p.descriptionAr || p.description) : (p.description || p.descriptionAr)}
                        </p>
                      </div>

                      {/* Precise Technical & Commercial Specification */}
                      {p.exactSpecificationAr && (
                        <div className="p-2.5 rounded-2xl bg-indigo-50/90 border border-indigo-200/80 text-xs text-indigo-950 space-y-1">
                          <div className="text-[10px] font-black text-indigo-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span>{t.exactSpecsLabel}</span>
                          </div>
                          <p className="text-[11px] leading-snug font-bold text-indigo-900">{isAr ? (p.exactSpecificationAr || p.exactSpecificationFr) : (p.exactSpecificationFr || p.exactSpecificationAr)}</p>
                        </div>
                      )}

                      {/* Wholesale Sourcing Location */}
                      {p.sourcingLocationAr && (
                        <div className="p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                          <div className="text-[10px] font-black text-amber-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>{t.sourcingLocationLabel}</span>
                          </div>
                          <p className="text-[11px] leading-snug font-bold text-amber-900">{isAr ? (p.sourcingLocationAr || p.sourcingLocationFr) : (p.sourcingLocationFr || p.sourcingLocationAr)}</p>
                        </div>
                      )}

                      {/* Live Ad Longevity & Top Platform */}
                      {(p.adLongevityDays || p.topPlatformAr) && (
                        <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold">
                          {p.adLongevityDays && (
                            <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{t.activeAdsForDays} {p.adLongevityDays}+ {isAr ? 'يوماً' : 'jours'}</span>
                            </span>
                          )}
                          {p.topPlatformAr && (
                            <span className="text-slate-700 font-extrabold text-[10px]">
                              🔥 {t.topChannelLabel} {isAr ? (p.topPlatformAr || 'Meta + TikTok') : (p.topPlatformFr || p.topPlatformAr || 'Meta + TikTok')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Economics Bar - High Contrast */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">{t.wholesalePriceLabel}</div>
                          <div className="text-xs font-black text-slate-900">{p.wholesalePrice} {p.currency || 'DH'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">{t.retailPriceLabel}</div>
                          <div className="text-sm font-black text-indigo-600">{p.retailPrice} {p.currency || 'DH'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">{t.competitorsLabel}</div>
                          <div className="text-xs font-black text-slate-900">{p.activeCompetitors || 5}+ {t.competitorsActive}</div>
                        </div>
                      </div>

                      {/* Why winning highlights */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.whyWinningLabel}</span>
                          </span>
                          {p.targetDemographicAr && (
                            <span className="text-[10px] text-slate-500 font-bold max-w-[170px] truncate" title={p.targetDemographicAr}>
                              🎯 {p.targetDemographicAr}
                            </span>
                          )}
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside font-medium">
                          {(p.whyWinningAr || p.whyWinning || []).slice(0, 2).map((item, i) => (
                            <li key={i} className="line-clamp-1">{item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* External Search Links: Guaranteed Global Results */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <a
                          href={globalMetaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                          title="شاهد جميع إعلانات فيسبوك الشغالة حالياً حول العالم"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{t.facebookAdsGlobal}</span>
                        </a>
                        <a
                          href={tikTokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          title="شاهد فيديوهات وتريندات تيك توك"
                        >
                          <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                          <span>{t.tikTokVideos}</span>
                        </a>
                      </div>

                      {/* Action Buttons: View Details & Launch */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedProductDetails(p)}
                          className="col-span-1 py-3 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="عرض ملف المنتج بالكامل والموردين"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{t.detailsBtn}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendToValidator(p)}
                          className="col-span-2 py-3 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-xs font-black shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                        >
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                          <span className="truncate">{t.prepCampaignBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: تفاصيل المنتج الكاملة (PRODUCT DOSSIER 360°)                      */}
      {/* ========================================================================= */}
      {selectedProductDetails && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col space-y-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedProductDetails.countryFlag || '🌍'} {selectedProductDetails.countryNameAr || selectedProductDetails.country}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-200">
                    {selectedProductDetails.niche}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedProductDetails.status}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 font-heading leading-snug">
                  {selectedProductDetails.titleAr || selectedProductDetails.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductDetails(null)}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center text-2xl font-bold cursor-pointer shrink-0"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar">
              {/* Product Visual & Economics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Image */}
                <div className="rounded-2xl overflow-hidden bg-slate-100 h-56 border border-slate-200 shadow-xs relative">
                  <img
                    src={selectedProductDetails.imageUrl}
                    alt={selectedProductDetails.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white p-2 rounded-xl text-xs font-extrabold text-center text-emerald-400">
                    ربح متوقع: +{selectedProductDetails.netProfitPerUnit} {selectedProductDetails.currency || 'DH'}
                  </div>
                </div>

                {/* Economics Specs */}
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[11px] font-bold text-slate-500">{t.dossierWholesaleTitle}</span>
                    <div className="text-xl font-black text-slate-900">
                      {selectedProductDetails.wholesalePrice} {selectedProductDetails.currency || 'DH'}
                    </div>
                    <span className="text-[10px] text-slate-400">{t.dossierWholesaleSub}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                    <span className="text-[11px] font-bold text-indigo-700">{t.dossierRetailTitle}</span>
                    <div className="text-xl font-black text-indigo-600">
                      {selectedProductDetails.retailPrice} {selectedProductDetails.currency || 'DH'}
                    </div>
                    <span className="text-[10px] text-indigo-500 font-semibold">{t.dossierRetailSub}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700">{t.dossierDeliveryConfirmationTitle}</span>
                    <div className="text-lg font-black text-emerald-800">
                      {selectedProductDetails.estConfirmationRate}% {isAr ? 'تأكيد' : 'Conf'} | {selectedProductDetails.estDeliveryRate}% {isAr ? 'توصيل' : 'Livr'}
                    </div>
                    <span className="text-[10px] text-emerald-600">{t.dossierDeliveryConfirmationSub}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <span className="text-[11px] font-bold text-amber-700">{t.dossierCompetitionTitle}</span>
                    <div className="text-lg font-black text-amber-900">
                      {selectedProductDetails.saturationScore < 35 ? (isAr ? '🟢 فرصة صعود ممتازة' : '🟢 Forte opportunité') : (isAr ? '🟡 منافسة متوسطة' : '🟡 Concurrence modérée')}
                    </div>
                    <span className="text-[10px] text-amber-700">{selectedProductDetails.activeCompetitors || 10}+ {t.dossierCompetitionSub}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-black text-slate-800">{t.dossierDescTitle}</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedProductDetails.descriptionAr || selectedProductDetails.description}
                </p>
                {selectedProductDetails.description && (
                  <p className="text-[11px] text-slate-500 font-sans italic pt-1 border-t border-slate-200/60">
                    {selectedProductDetails.description}
                  </p>
                )}
              </div>

              {/* Exact Technical Specifications & Wholesale Sourcing Dossier */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Exact Specs */}
                <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>{t.dossierExactSpecsTitle}</span>
                  </div>
                  <p className="text-xs text-indigo-950 font-bold leading-relaxed">
                    {selectedProductDetails.exactSpecificationAr || 'عبوة ومواصفات تجارية قياسية للتجارة الإلكترونية والـ COD.'}
                  </p>
                </div>

                {/* Sourcing Location */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>{t.dossierSourcingTitle}</span>
                  </div>
                  <p className="text-xs text-amber-950 font-bold leading-relaxed">
                    {selectedProductDetails.sourcingLocationAr || 'أسواق الجملة المحلية (درب عمر، كراج علال) وموردي علي إكسبريس.'}
                  </p>
                </div>

                {/* Live Ad Longevity */}
                <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>{t.dossierAdLongevityTitle}</span>
                  </div>
                  <p className="text-xs text-emerald-950 font-bold leading-relaxed">
                    {isAr ? `نشط منذ ${selectedProductDetails.adLongevityDays || 30}+ يوماً | المنصة الأقوى: ${selectedProductDetails.topPlatformAr || 'Meta + TikTok Ads'}` : `Actif depuis ${selectedProductDetails.adLongevityDays || 30}+ jours | Top canal : ${selectedProductDetails.topPlatformFr || selectedProductDetails.topPlatformAr || 'Meta + TikTok Ads'}`}
                  </p>
                </div>

                {/* Demographics */}
                <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-black text-xs">
                    <Target className="w-4 h-4 text-purple-600" />
                    <span>{t.dossierDemographicTitle}</span>
                  </div>
                  <p className="text-xs text-purple-950 font-bold leading-relaxed">
                    {selectedProductDetails.targetDemographicAr || 'المتسوقون عبر الإنترنت المهتمون بحل المشاكل الفورية.'}
                  </p>
                </div>
              </div>

              {/* Why Winning Points */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t.dossierWhyWinningTitle}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(selectedProductDetails.whyWinningAr || selectedProductDetails.whyWinning || []).map((point, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Marketing Angles */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{t.dossierAnglesTitle}</span>
                </h4>
                <div className="space-y-2">
                  {(selectedProductDetails.suggestedAnglesAr || []).map((angle, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/90 text-xs text-amber-950 font-bold flex items-center gap-2">
                      <span className="text-amber-600">🎯</span>
                      <span>{angle}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Intelligence & Search Links (All Verified & Working) */}
              <div className="p-5 rounded-3xl bg-slate-900 text-white space-y-3.5 shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black">أدوات التجسس والبحث المباشر عن هذا المنتج</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{t.dossierSpySub}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Global Meta Ad Library */}
                  <a
                    href={getMetaAdLibraryUrl(selectedProductDetails, 'ALL')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{t.dossierFbGlobal}</span>
                  </a>

                  {/* Local Meta Ad Library */}
                  <a
                    href={getMetaAdLibraryUrl(selectedProductDetails, selectedProductDetails.country === 'GLOBAL' ? 'ALL' : selectedProductDetails.country)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t.dossierFbLocal} ({selectedProductDetails.countryFlag || (isAr ? 'المحلي' : 'Local')})</span>
                  </a>

                  {/* TikTok Hashtag Videos (Direct & 100% Reliable) */}
                  <a
                    href={getTikTokTagUrl(selectedProductDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    title="مشاهدة فيديوهات وتريندات تيك توك بدون أي خطأ في السيرفر"
                  >
                    <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                    <span>{t.dossierTikTokHashtag}</span>
                  </a>

                  {/* TikTok Google Videos (Fallback 100% Garanti) */}
                  <a
                    href={getTikTokGoogleSearchUrl(selectedProductDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                    title="تصفح جميع فيديوهات تيك توك لهذا المنتج عبر Google"
                  >
                    <Video className="w-3.5 h-3.5 text-pink-400" />
                    <span>{t.dossierTikTokGoogle}</span>
                  </a>

                  {/* TikTok Creative Center Top Ads */}
                  <a
                    href="https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t.dossierTikTokCenter}</span>
                  </a>

                  {/* AliExpress Supplier Search */}
                  <a
                    href={getAliExpressUrl(selectedProductDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>الموردين (AliExpress 📦)</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedProductDetails(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => handleSendToValidator(selectedProductDetails)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-black shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{t.dossierSendToAudit}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

          <MarketResearch mode="audit" isAr={isAr} key={analysisInput.targetCountry}
            defaultTarget={countryNames[analysisInput.targetCountry]}
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
                {isAr ? 'كل الطلبات للمتاجر المحددة، حسب حالتها الحالية.' : 'Toutes les commandes des boutiques sélectionnées, selon leur statut actuel.'}
              </p>
            </div>
            <button type="button" disabled={campaignLoading} onClick={() => setCampaignRefresh(value => value + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${campaignLoading ? 'animate-spin' : ''}`} />
              {isAr ? 'تحديث' : 'Actualiser'}
            </button>
          </div>

          {campaignLoading && <p role="status" className="text-sm text-slate-600">{isAr ? 'جارٍ التحميل…' : 'Chargement…'}</p>}
          {campaignError && <p role="alert" className="text-sm text-red-700">{isAr ? 'تعذر تحميل الطلبات.' : 'Impossible de charger les commandes.'}</p>}
          {campaignData && (
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                [isAr ? 'الطلبات' : 'Commandes', campaignData.kpis.totalOrders, null],
                [isAr ? 'مؤكدة' : 'Confirmées', campaignData.kpis.totalConfirmedOrders, campaignData.kpis.realConfirmationRate],
                [isAr ? 'مسلّمة' : 'Livrées', campaignData.kpis.totalDeliveredOrders, campaignData.kpis.realDeliveryRate],
              ] as const).map(([label, count, rate]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-sm font-semibold text-slate-600">{label}</dt>
                  <dd className="mt-1 text-2xl font-black tabular-nums">
                    {count} {rate !== null && <span className="text-sm font-semibold text-slate-600">({rate} %)</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            {isAr
              ? 'الإنفاق والعائد وإدارة الحملات غير متاحة. تتطلب هذه الميزات ربط منصة إعلانية مع بيانات الحملات.'
              : 'Dépenses, ROAS et pilotage des campagnes indisponibles. Ces fonctions nécessitent une intégration publicitaire qui remonte les données de campagne.'}
          </p>
        </section>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AI WINNING PRODUCT GENERATOR                                       */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">{t.aiModalTitle}</h3>
                  <p className="text-xs text-slate-500 font-medium">{t.aiModalSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.aiModalNiche}</label>
                <select
                  value={aiNiche}
                  onChange={(e) => setAiNiche(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold bg-white text-slate-800"
                >
                  <option value="COSMETICS">💄 مستحضرات التجميل والعناية (Cosmetics & Skincare)</option>
                  <option value="SUPPLEMENTS">🌿 مكملات غذائية وأعشاب طبيعية (Supplements & Wellness)</option>
                  <option value="BEAUTY">✨ أدوات الجمال والعناية الشخصية (Beauty Tools)</option>
                  <option value="KITCHEN">🍳 أدوات المطبخ والمنزل (Kitchen & Home Hacks)</option>
                  <option value="CAR">🚗 إكسسوارات السيارات الذكية (Car Accessories)</option>
                  <option value="HEALTH">🏋️ الصحة والعلاج الطبيعي (Health & Pain Relief)</option>
                  <option value="PETS">🐾 الحيوانات الأليفة (Pet Supplies)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.aiModalCountry}</label>
                <select
                  value={aiCountry}
                  onChange={(e) => setAiCountry(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold bg-white text-slate-800"
                >
                  <option value="ALL">🌍 السوق العالمي الشامل (Worldwide)</option>
                  <option value="MA">🇲🇦 المغرب (Morocco)</option>
                  <option value="US">🇺🇸 الولايات المتحدة (USA)</option>
                  <option value="FR">🇫🇷 فرنسا وأوروبا (France & Europe)</option>
                  <option value="GCC">🇸🇦 دول الخليج والسعودية (GCC)</option>
                  <option value="SN">🇸🇳 السنغال وغرب إفريقيا (Senegal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.aiModalPrompt}</label>
                <input
                  type="text"
                  placeholder={t.aiModalPromptPlaceholder}
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-semibold text-slate-800"
                />
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-950 text-xs leading-relaxed font-medium">
                💡 سيتم توليد منتجات تريند مع أسعار الشراء بالجملة، أسعار البيع المقترحة، زوايا التسويق، وإضافتها مباشرة إلى رادار المنتجات الرابحة.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t.aiModalCancel}
              </button>
              <button
                type="button"
                onClick={handleGenerateIdeas}
                disabled={aiGenerating}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
              >
                {aiGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التوليد...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>توليد وإضافة المنتجات الآن ⚡</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

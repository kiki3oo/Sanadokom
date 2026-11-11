'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { WinningProduct, ProductAnalysisResult } from '@/lib/marketingAi';

export default function MediaBuyerPage() {
  const { currentUser, isAdmin, isManager } = useAuth();
  const { selectedStoreId } = useStore();
  const { language } = useLanguage();

  const isRtl = language === 'ar';

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
    niche: 'BEAUTY',
    wholesalePrice: 45,
    retailPrice: 229,
    shippingFee: 35,
    estConfirmationRate: 80,
    estDeliveryRate: 75,
    productUrl: '',
    description: '',
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);
  const [activeScriptAngle, setActiveScriptAngle] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- Tab 3: Media Buyer Copilot State ---
  const [campaignData, setCampaignData] = useState<any | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

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

  // 3. Fetch Live Campaign Audit
  const fetchCampaigns = async () => {
    setCampaignLoading(true);
    try {
      const url =
        selectedStoreId && selectedStoreId !== 'ALL'
          ? `/api/marketing-ai?tab=CAMPAIGN_AUDIT&storeId=${selectedStoreId}`
          : `/api/marketing-ai?tab=CAMPAIGN_AUDIT`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCampaignData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCampaignLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStock();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedNiche, selectedCountry, selectedStatus, selectedType]);

  // Handle selecting product from stock
  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
    if (!stockId) return;
    const found = stockItems.find((s) => s.id === stockId);
    if (found) {
      setAnalysisInput({
        title: found.name || '',
        niche: 'BEAUTY',
        wholesalePrice: Number(found.costPrice) || 45,
        retailPrice: Number(found.sellingPrice) || 249,
        shippingFee: 35,
        estConfirmationRate: 80,
        estDeliveryRate: 75,
        productUrl: '',
        description: found.description || '',
      });
    }
  };

  // Transfer winning product to validator
  const handleSendToValidator = (wp: WinningProduct) => {
    setAnalysisInput({
      title: wp.titleAr || wp.title,
      niche: wp.niche,
      wholesalePrice: wp.wholesalePrice,
      retailPrice: wp.retailPrice,
      shippingFee: wp.estShippingFee || 35,
      estConfirmationRate: wp.estConfirmationRate || 80,
      estDeliveryRate: wp.estDeliveryRate || 75,
      productUrl: '',
      description: wp.descriptionAr || wp.description,
    });
    setSelectedProductDetails(null);
    setActiveTab('PRODUCT_VALIDATOR');
    // Auto-trigger analysis
    triggerAnalysis({
      title: wp.titleAr || wp.title,
      niche: wp.niche,
      wholesalePrice: wp.wholesalePrice,
      retailPrice: wp.retailPrice,
      shippingFee: wp.estShippingFee || 35,
      estConfirmationRate: wp.estConfirmationRate || 80,
      estDeliveryRate: wp.estDeliveryRate || 75,
    });
  };

  // Trigger analysis
  const triggerAnalysis = async (customPayload?: any) => {
    setAnalyzing(true);
    try {
      const payload = customPayload || analysisInput;
      const res = await fetch('/api/marketing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ANALYZE_PRODUCT',
          input: payload,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
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

  // Copy to clipboard helper
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Quick Action execution (Pause or Scale)
  const handleCampaignAction = async (campaignId: string, actionType: 'KILL' | 'SCALE') => {
    try {
      const res = await fetch('/api/marketing-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_CAMPAIGN',
          campaignId,
          newStatus: actionType === 'KILL' ? 'PAUSED' : 'SCALED_+20%',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(
          actionType === 'KILL'
            ? '✅ تم إيقاف الحملة بنجاح في فيسبوك وحماية الميزانية من الهدر!'
            : '🚀 تم تطبيق زيادة الميزانية بنسبة +20% بنجاح دون إرباك خوارزمية التعلم!'
        );
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (e) {}
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
              <span>MARKETING & MEDIA BUYER IA 2.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3 font-heading">
              <span>خبير الإعلانات واقتناص المنتجات الرابحة</span>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl leading-relaxed font-medium">
              محرك ذكي متكامل: يكتشف المنتجات الأكثر مبيعاً وتريند في المغرب وكافة أسواق العالم، يحلل أرباح الـ COD وهامش الـ Break-even CPA، ويراقب حملاتك الإعلانية يومياً لإيقاف الخاسر وتكبير الرابح.
            </p>
          </div>

          {/* Quick CTA to AI Idea Generator */}
          <button
            onClick={() => setShowAiModal(true)}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs md:text-sm shadow-md shadow-amber-500/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 border border-amber-300/40"
          >
            <Lightbulb className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>توليد أفكار رابحة بالذكاء الاصطناعي ⚡</span>
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
              <span>صائد المنتجات الرابحة (Winning Radar 🏆)</span>
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
              <span>محلل المنتج والسكريبتات (Validator & Scripts 🎯)</span>
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
              <span>خبير الميديا باير اليومي (Daily Copilot 📊)</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-bold text-sm flex items-center gap-3 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: صائد المنتجات الرابحة (WINNING PRODUCTS RADAR)                     */}
      {/* ========================================================================= */}
      {activeTab === 'WINNING_PRODUCTS' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Search */}
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الكلمة الدلالية، أو المشكلة..."
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
                  <option value="ALL">جميع المجالات (All Niches)</option>
                  <option value="BEAUTY">💄 الجمال والعناية (Beauty)</option>
                  <option value="KITCHEN">🍳 المطبخ والمنزل (Kitchen)</option>
                  <option value="CAR">🚗 إكسسوارات السيارات (Car)</option>
                  <option value="HEALTH">🏋️ الصحة والمفاصل (Health)</option>
                  <option value="GADGETS">⚡ الأدوات الذكية (Gadgets)</option>
                  <option value="HOME">🏠 المنزل والديكور (Home)</option>
                  <option value="PETS">🐾 الحيوانات الأليفة (Pets)</option>
                </select>

                {/* Country / Market - All Worldwide Markets */}
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 cursor-pointer focus:bg-white"
                >
                  <option value="ALL">🌍 جميع أسواق العالم (Worldwide)</option>
                  <option value="MA">🇲🇦 المغرب (Morocco)</option>
                  <option value="US">🇺🇸 الولايات المتحدة (USA)</option>
                  <option value="FR">🇫🇷 فرنسا وأوروبا (France & EU)</option>
                  <option value="GCC">🇸🇦 دول الخليج والسعودية (GCC)</option>
                  <option value="SN">🇸🇳 السنغال وغرب إفريقيا (Senegal)</option>
                  <option value="GLOBAL">🌐 التريندات العالمية (Global Trends)</option>
                </select>

                {/* Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-bold text-slate-800 cursor-pointer focus:bg-white"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="HOT">🔥 مبيعات مشتعلة (Hot Seller)</option>
                  <option value="EMERGING">🟢 تريند صاعد (Emerging)</option>
                  <option value="EVERGREEN">🌲 منتج دائم (Evergreen)</option>
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
                <span>تصنيف سريع:</span>
              </span>
              <button
                onClick={() => setSelectedType(selectedType === 'PROBLEM_SOLVER' ? 'ALL' : 'PROBLEM_SOLVER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  selectedType === 'PROBLEM_SOLVER'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                🛠️ يحل مشكلة يومية (Problem Solver)
              </button>
              <button
                onClick={() => setSelectedType(selectedType === 'WOW_FACTOR' ? 'ALL' : 'WOW_FACTOR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  selectedType === 'WOW_FACTOR'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                ✨ إبهار بصري فايرل (Wow Factor)
              </button>
              <button
                onClick={() => setSelectedStatus(selectedStatus === 'EMERGING' ? 'ALL' : 'EMERGING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  selectedStatus === 'EMERGING'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                🟢 منافسة قليلة وفرصة صعود (High Opportunity)
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-bold">جاري مسح الأسواق وتحديث المنتجات الرابحة...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-16 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-800">لا توجد منتجات مطابقة لهذا الفلتر</h3>
              <p className="text-xs text-slate-500 font-medium">جرب تغيير معايير البحث أو اضغط على زر توليد أفكار ذكية بالذكاء الاصطناعي.</p>
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
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const statusBadge =
                  p.status === 'HOT'
                    ? { text: '🔥 مشتعل ومطلوب', bg: 'bg-rose-500 text-white' }
                    : p.status === 'EMERGING'
                    ? { text: '🟢 صاعد بقوة', bg: 'bg-emerald-600 text-white' }
                    : { text: '🌲 مبيعات مستقرة', bg: 'bg-blue-600 text-white' };

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
                          <span>ربح متوقع: +{p.netProfitPerUnit} {p.currency || 'DH'} / طلب</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-200 bg-white/20 px-2 py-0.5 rounded-md">
                          تأكيد: {p.estConfirmationRate}%
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2 cursor-pointer" onClick={() => setSelectedProductDetails(p)}>
                        <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors" title={p.titleAr || p.title}>
                          {p.titleAr || p.title}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                          {p.descriptionAr || p.description}
                        </p>
                      </div>

                      {/* Economics Bar - High Contrast */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/90 text-center">
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">سعر الجملة</div>
                          <div className="text-xs font-black text-slate-900">{p.wholesalePrice} {p.currency || 'DH'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">سعر البيع المقترح</div>
                          <div className="text-sm font-black text-indigo-600">{p.retailPrice} {p.currency || 'DH'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-500">المنافسون</div>
                          <div className="text-xs font-black text-slate-900">{p.activeCompetitors || 5}+ نشط</div>
                        </div>
                      </div>

                      {/* Why winning highlights */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>لماذا هذا المنتج رابح؟</span>
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
                          <span>إعلانات فيسبوك (عالمي)</span>
                        </a>
                        <a
                          href={tikTokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                          title="شاهد فيديوهات وتريندات تيك توك"
                        >
                          <Play className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                          <span>فيديوهات تيك توك</span>
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
                          <span>التفاصيل 👁️</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendToValidator(p)}
                          className="col-span-2 py-3 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-xs font-black shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98"
                        >
                          <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" />
                          <span className="truncate">تجهيز الإعلانات والسكريبت 🚀</span>
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
                    <span className="text-[11px] font-bold text-slate-500">سعر الشراء بالجملة</span>
                    <div className="text-xl font-black text-slate-900">
                      {selectedProductDetails.wholesalePrice} {selectedProductDetails.currency || 'DH'}
                    </div>
                    <span className="text-[10px] text-slate-400">سعر التوريد التقديري</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                    <span className="text-[11px] font-bold text-indigo-700">سعر البيع المقترح</span>
                    <div className="text-xl font-black text-indigo-600">
                      {selectedProductDetails.retailPrice} {selectedProductDetails.currency || 'DH'}
                    </div>
                    <span className="text-[10px] text-indigo-500 font-semibold">سعر المستهلك في السوق</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700">نسبة التأكيد والتوصيل</span>
                    <div className="text-lg font-black text-emerald-800">
                      {selectedProductDetails.estConfirmationRate}% تأكيد | {selectedProductDetails.estDeliveryRate}% توصيل
                    </div>
                    <span className="text-[10px] text-emerald-600">تقدير واقعي للـ COD</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <span className="text-[11px] font-bold text-amber-700">مؤشر المنافسة والتشبع</span>
                    <div className="text-lg font-black text-amber-900">
                      {selectedProductDetails.saturationScore < 35 ? '🟢 فرصة صعود ممتازة' : '🟡 منافسة متوسطة'}
                    </div>
                    <span className="text-[10px] text-amber-700">{selectedProductDetails.activeCompetitors || 10}+ معلنين نشطين</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-black text-slate-800">وصف وفكرة المنتج:</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedProductDetails.descriptionAr || selectedProductDetails.description}
                </p>
                {selectedProductDetails.description && (
                  <p className="text-[11px] text-slate-500 font-sans italic pt-1 border-t border-slate-200/60">
                    {selectedProductDetails.description}
                  </p>
                )}
              </div>

              {/* Why Winning Points */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>لماذا هذا المنتج رابح ويحقق مبيعات قوية؟</span>
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
                  <span>الزوايا التسويقية المقترحة لتصوير الفيديوهات:</span>
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
                  <span className="text-[10px] text-slate-400">تفتح في نافذة جديدة</span>
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
                    <span>إعلانات فيسبوك (عالمي 🌍)</span>
                  </a>

                  {/* Local Meta Ad Library */}
                  <a
                    href={getMetaAdLibraryUrl(selectedProductDetails, selectedProductDetails.country === 'GLOBAL' ? 'ALL' : selectedProductDetails.country)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>إعلانات فيسبوك ({selectedProductDetails.countryFlag || 'المحلي'})</span>
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
                    <span>فيديوهات تيك توك (هاشتاغ 🎵)</span>
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
                    <span>فيديوهات تيك توك (Google 🎬)</span>
                  </a>

                  {/* TikTok Creative Center Top Ads */}
                  <a
                    href="https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>TikTok Top Ads Center 🔥</span>
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
                <span>نقل لمحلل الحملات وتجهيز السكريبتات فوراً 🚀</span>
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
          {/* Product Input Card */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                  🎯
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 font-heading">فحص المنتج وتصميم الحملة الإعلانية (Campaign Architect)</h2>
                  <p className="text-xs text-slate-500 font-medium">أدخل معلومات أي منتج لحساب الـ Break-even CPA، سكريبتات الدارجة، والاستهداف الدقيق.</p>
                </div>
              </div>

              {/* Quick Select from existing Sanadokom Stock */}
              {stockItems.length > 0 && (
                <div className="w-full sm:w-auto">
                  <select
                    value={selectedStockId}
                    onChange={(e) => handleStockSelect(e.target.value)}
                    className="w-full sm:w-64 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 cursor-pointer focus:bg-white"
                  >
                    <option value="">⚡ اختر منتجاً من مخزونك (Stock)...</option>
                    {stockItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        📦 {item.name} ({item.sellingPrice || 199} DH)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم أو رابط المنتج <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: جهاز تنظيف الوجه بالبخار أو رابط المنتج"
                  value={analysisInput.title}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, title: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">المجال / النيتش</label>
                <select
                  value={analysisInput.niche}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, niche: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 bg-white font-bold text-slate-800"
                >
                  <option value="BEAUTY">💄 تجميل وعناية بالبشرة</option>
                  <option value="KITCHEN">🍳 أدوات المطبخ والمنزل</option>
                  <option value="CAR">🚗 إكسسوارات السيارات</option>
                  <option value="HEALTH">🏋️ الصحة والعلاج الطبيعي</option>
                  <option value="GADGETS">⚡ إلكترونيات وأدوات ذكية</option>
                  <option value="HOME">🏠 المنزل والديكور</option>
                  <option value="PETS">🐾 مستلزمات الحيوانات الأليفة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر الشراء بالجملة (DH)</label>
                <input
                  type="number"
                  placeholder="مثال: 45"
                  value={analysisInput.wholesalePrice}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, wholesalePrice: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">سعر البيع المقترح (DH)</label>
                <input
                  type="number"
                  placeholder="مثال: 249"
                  value={analysisInput.retailPrice}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, retailPrice: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-black text-indigo-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تكلفة التوصيل التقديرية (DH)</label>
                <input
                  type="number"
                  placeholder="35"
                  value={analysisInput.shippingFee}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, shippingFee: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة التأكيد المتوقعة %</label>
                <input
                  type="number"
                  placeholder="80"
                  value={analysisInput.estConfirmationRate}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, estConfirmationRate: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة التوصيل المتوقعة %</label>
                <input
                  type="number"
                  placeholder="75"
                  value={analysisInput.estDeliveryRate}
                  onChange={(e) => setAnalysisInput({ ...analysisInput, estDeliveryRate: Number(e.target.value) })}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3">
              <button
                onClick={() => triggerAnalysis()}
                disabled={analyzing || !analysisInput.title.trim()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 disabled:opacity-50 text-white font-black text-xs md:text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>الذكاء الاصطناعي يقوم بالفحص والتحليل الآن...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>تشغيل الفحص والتحليل الذكي للمنتج 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results Display */}
          {analysisResult && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Verdict & Score Banner */}
              <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                        نتيجة فحص المنتج (Product Dossier)
                      </span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs font-bold text-slate-700">{analysisResult.productTitle}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 font-heading leading-snug">
                      {analysisResult.verdictAr}
                    </h3>
                  </div>

                  {/* Circular Score Badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/30">
                      <span className="text-2xl font-black">{analysisResult.overallScore}</span>
                      <span className="text-[10px] font-bold opacity-80">من 100</span>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">{analysisResult.scoreLabel}</div>
                      <div className="text-[11px] text-slate-500 font-medium">تقييم الجدوى والربحية</div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600">حل المشكلة</div>
                    <div className="text-sm font-black text-indigo-600">{analysisResult.breakdown.problemSolving}%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${analysisResult.breakdown.problemSolving}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600">الإبهار البصري</div>
                    <div className="text-sm font-black text-purple-600">{analysisResult.breakdown.wowFactor}%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${analysisResult.breakdown.wowFactor}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600">صحة هامش الربح</div>
                    <div className="text-sm font-black text-emerald-600">{analysisResult.breakdown.marginHealth}%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${analysisResult.breakdown.marginHealth}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600">سلامة الشحن والتوصيل</div>
                    <div className="text-sm font-black text-blue-600">{analysisResult.breakdown.shippingFeasibility}%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${analysisResult.breakdown.shippingFeasibility}%` }} />
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 col-span-2 md:col-span-1">
                    <div className="text-[11px] font-bold text-slate-600">حجم الطلب المتوقع</div>
                    <div className="text-sm font-black text-amber-600">{analysisResult.breakdown.marketDemand}%</div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-600 h-full rounded-full" style={{ width: `${analysisResult.breakdown.marketDemand}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* COD Economics Matrix - Crisp Dark Slate Card */}
              <div className="bg-slate-900 rounded-3xl p-6 md:p-7 text-white shadow-xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
                    💰
                  </div>
                  <div>
                    <h3 className="text-base font-black">حاسبة الأرباح الدقيقة وهامش الأمان الإعلاني (COD Economics)</h3>
                    <p className="text-xs text-slate-300 font-medium">
                      معادلة واقعية تأخذ بعين الاعتبار نسبة التأكيد والتوصيل وتكلفة الإعلانات الحقيقية.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Break-even CPA */}
                  <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-400/40 space-y-1">
                    <div className="text-[11px] font-bold text-rose-300">أقصى CPA مسموح (Break-even)</div>
                    <div className="text-2xl font-black text-rose-400">
                      {analysisResult.economics.breakEvenCpa} DH
                    </div>
                    <div className="text-[10px] text-rose-200/80 font-medium">إذا تجاوزته تصبح في خسارة</div>
                  </div>

                  {/* Target CPA Range */}
                  <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 space-y-1">
                    <div className="text-[11px] font-bold text-emerald-300">سعر الطلب المستهدف (Target CPA)</div>
                    <div className="text-2xl font-black text-emerald-400">
                      {analysisResult.economics.targetCpaMin} - {analysisResult.economics.targetCpaMax} DH
                    </div>
                    <div className="text-[10px] text-emerald-200/80 font-medium">المنطقة الذهبية لتحقيق ربح مرتفع</div>
                  </div>

                  {/* Net Profit per delivered */}
                  <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-1">
                    <div className="text-[11px] font-bold text-indigo-200">الربح الصافي لكل طلب مستلم</div>
                    <div className="text-2xl font-black text-white">
                      +{analysisResult.economics.netProfitPerDelivered} DH
                    </div>
                    <div className="text-[10px] text-slate-300 font-medium">بعد خصم الإعلانات والشحن وتكلفة المنتج</div>
                  </div>

                  {/* Profit per 100 leads */}
                  <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-400/40 space-y-1">
                    <div className="text-[11px] font-bold text-amber-300">الربح المتوقع لكل 100 ليد</div>
                    <div className="text-2xl font-black text-amber-400">
                      +{analysisResult.economics.expectedNetProfitPer100Leads} DH
                    </div>
                    <div className="text-[10px] text-amber-200/80 font-medium">عائد مستهدف (ROAS): {analysisResult.economics.roasTarget}x</div>
                  </div>
                </div>
              </div>

              {/* Marketing Angles & Scripts (The Golden Sauce) */}
              <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-lg">
                    🎬
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-heading">زوايا التسويق وسيناريوهات الفيديو بالدارجة المغربية</h3>
                    <p className="text-xs text-slate-500 font-medium">سكريبتات جاهزة لتصوير الـ UGC ونصوص الإعلانات (Ad Copies) لنسخها في فيسبوك وتيك توك.</p>
                  </div>
                </div>

                {/* Angle Selector Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                  {analysisResult.marketingAngles.map((angle, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveScriptAngle(idx)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeScriptAngle === idx
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {angle.angleNameAr}
                    </button>
                  ))}
                </div>

                {/* Active Angle Details */}
                {analysisResult.marketingAngles[activeScriptAngle] && (
                  <div className="space-y-4">
                    {/* Hook 3s Alert */}
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span>خطف الانتباه في أول 3 ثوانٍ (The 3-Second Hook):</span>
                        </div>
                        <p className="text-xs text-amber-950 font-bold leading-relaxed">
                          "{analysisResult.marketingAngles[activeScriptAngle].hook3sAr}"
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          copyText(analysisResult.marketingAngles[activeScriptAngle].hook3sAr, 'hook')
                        }
                        className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'hook' ? 'تم النسخ' : 'نسخ'}</span>
                      </button>
                    </div>

                    {/* UGC Full Script */}
                    <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 space-y-3 font-mono text-xs shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <span className="font-sans font-bold text-slate-300">سكريبت تصوير الفيديو (UGC Script بالدارجة)</span>
                        <button
                          onClick={() =>
                            copyText(analysisResult.marketingAngles[activeScriptAngle].fullScriptAr, 'script')
                          }
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-sans font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                        >
                          {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'script' ? 'تم النسخ' : 'نسخ السكريبت'}</span>
                        </button>
                      </div>
                      <div className="whitespace-pre-line leading-relaxed text-slate-200 font-sans text-xs">
                        {analysisResult.marketingAngles[activeScriptAngle].fullScriptAr}
                      </div>
                    </div>

                    {/* Ready-to-use Ad Copy */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Arabic Ad Copy */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800">نص الإعلان بالدارجة (Ad Copy)</span>
                          <button
                            onClick={() =>
                              copyText(analysisResult.marketingAngles[activeScriptAngle].adCopyTextAr, 'copyAr')
                            }
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
                            title="نسخ"
                          >
                            {copiedKey === 'copyAr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-medium">
                          {analysisResult.marketingAngles[activeScriptAngle].adCopyTextAr}
                        </p>
                      </div>

                      {/* French Ad Copy */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800">نص الإعلان بالفرنسية (Version FR)</span>
                          <button
                            onClick={() =>
                              copyText(analysisResult.marketingAngles[activeScriptAngle].adCopyTextFr, 'copyFr')
                            }
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 cursor-pointer"
                            title="نسخ"
                          >
                            {copiedKey === 'copyFr' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-sans font-medium">
                          {analysisResult.marketingAngles[activeScriptAngle].adCopyTextFr}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Targeting & Campaign Launch Blueprint */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Targeting & AdSets */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <span>خطة الاستهداف والجمهور (Targeting Blueprint)</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <span className="font-bold text-slate-600">الجنس والفئة العمرية:</span>
                      <span className="font-extrabold text-slate-900">
                        {analysisResult.targeting.recommendedGender === 'WOMEN'
                          ? 'نساء فقط'
                          : analysisResult.targeting.recommendedGender === 'MEN'
                          ? 'رجال فقط'
                          : 'الجميع (رجال ونساء)'}{' '}
                        | {analysisResult.targeting.ageRange}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                      <div className="font-bold text-slate-600">المدن ذات الأولوية في المغرب:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.targeting.priorityCities.map((city, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs">
                            {city}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="font-extrabold text-slate-800">هيكلة المجموعات الإعلانية (3 AdSets المقترحة):</div>
                      {analysisResult.targeting.adsetStrategies.map((adset, idx) => (
                        <div key={idx} className="p-3 rounded-xl border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between font-bold text-indigo-700">
                            <span>{adset.nameAr}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-50 rounded-full font-black">{adset.budgetShare}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{adset.descriptionAr}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Kill & Scale Rules Blueprint */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Sliders className="w-5 h-5 text-purple-600" />
                    <span>خطة الاختبار وقواعد الإيقاف والتكبير (Kill & Scale)</span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                      <div className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>قاعدة الإيقاف الفوري (Kill Rule):</span>
                      </div>
                      <p className="text-xs text-rose-950 leading-relaxed font-semibold">
                        {analysisResult.launchStrategy.killRuleDescriptionAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>قاعدة التكبير وزيادة الميزانية (Scaling Rule):</span>
                      </div>
                      <p className="text-xs text-emerald-950 leading-relaxed font-semibold">
                        {analysisResult.launchStrategy.scaleRuleDescriptionAr}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span>نصائح الخبير لرفع نسبة التأكيد والتوصيل:</span>
                      </div>
                      <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside font-medium leading-relaxed">
                        {analysisResult.launchStrategy.keyTipsAr.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: خبير الميديا باير اليومي (DAILY MEDIA BUYER COPILOT)                */}
      {/* ========================================================================= */}
      {activeTab === 'MEDIA_BUYER_COPILOT' && (
        <div className="space-y-6">
          {/* Top Real COD KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-500">إجمالي الصرف الإعلاني اليوم</div>
              <div className="text-2xl font-black text-slate-900">
                {campaignData?.kpis?.totalAdSpendToday || 690} DH
              </div>
              <div className="text-[11px] text-slate-500 font-medium">متزامن مع حساب فيسبوك</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-500">الطلبيات المؤكدة الحقيقية</div>
              <div className="text-2xl font-black text-emerald-600">
                {campaignData?.kpis?.totalConfirmedOrders || 21} طلب
              </div>
              <div className="text-[11px] text-emerald-700 font-bold">تأكيد: {campaignData?.kpis?.realConfirmationRate || 84}%</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-500">تكلفة الطلب المؤكد (Real CPR)</div>
              <div className="text-2xl font-black text-indigo-600">
                {campaignData?.kpis?.realCprAvg || 32.8} DH
              </div>
              <div className="text-[11px] text-indigo-700 font-bold">تحت الحد الأقصى (Break-even)</div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <div className="text-xs font-bold text-slate-500">العائد الحقيقي الصافي (Real ROAS)</div>
              <div className="text-2xl font-black text-purple-600">
                {campaignData?.kpis?.realCodRoasAvg || 2.85}x
              </div>
              <div className="text-[11px] text-purple-700 font-bold">توصيل فعلي: {campaignData?.kpis?.realDeliveryRate || 79}%</div>
            </div>
          </div>

          {/* Urgent Daily Actions (Kill / Scale / Alerts) */}
          <div className="bg-white rounded-3xl p-6 md:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                  ⚡
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-heading">خطة العمل والتوصيات اليومية (Daily Action Plan)</h3>
                  <p className="text-xs text-slate-500 font-medium">توجيهات الذكاء الاصطناعي بناءً على أداء الحملات ونسبة تأكيد الكول سنتر.</p>
                </div>
              </div>

              <button
                onClick={fetchCampaigns}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${campaignLoading ? 'animate-spin' : ''}`} />
                <span>تحديث التوصيات</span>
              </button>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(campaignData?.campaigns || []).map((camp: any) => {
                const isKill = camp.recommendationType === 'KILL';
                const isScale = camp.recommendationType === 'SCALE';
                const isWarning = camp.recommendationType === 'FIX_FUNNEL';

                return (
                  <div
                    key={camp.id}
                    className={`p-5 rounded-2xl border transition-all space-y-3 ${
                      isKill
                        ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                        : isScale
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : isWarning
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black tracking-wide">{camp.actionTitleAr}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 font-bold">{camp.name}</div>
                      </div>

                      {/* Action Button */}
                      {isKill && (
                        <button
                          onClick={() => handleCampaignAction(camp.id, 'KILL')}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs cursor-pointer shrink-0"
                        >
                          إيقاف الإعلان الآن 🛑
                        </button>
                      )}
                      {isScale && (
                        <button
                          onClick={() => handleCampaignAction(camp.id, 'SCALE')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer shrink-0"
                        >
                          زيادة الميزانية +20% 🚀
                        </button>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed font-medium">{camp.actionDescAr}</p>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-black/5 text-center text-xs">
                      <div>
                        <div className="opacity-70 text-[10px] font-bold">الصرف</div>
                        <div className="font-black text-slate-900">{camp.spendToday} DH</div>
                      </div>
                      <div>
                        <div className="opacity-70 text-[10px] font-bold">المؤكد</div>
                        <div className="font-black text-emerald-700">{camp.confirmedLeads}</div>
                      </div>
                      <div>
                        <div className="opacity-70 text-[10px] font-bold">سعر الطلب</div>
                        <div className="font-black text-indigo-700">{camp.realCprMad} DH</div>
                      </div>
                      <div>
                        <div className="opacity-70 text-[10px] font-bold">الـ CTR</div>
                        <div className="font-black text-slate-900">{camp.ctr}%</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Monitored Campaigns Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 font-heading">جدول الحملات الإعلانية ومؤشرات الـ COD الحقيقية</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">اسم الحملة / AdSet</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">الميزانية اليومية</th>
                    <th className="py-3 px-4">الصرف اليوم</th>
                    <th className="py-3 px-4">النقرات & CTR</th>
                    <th className="py-3 px-4">الطلبات المؤكدة</th>
                    <th className="py-3 px-4">سعر الطلب (CPR)</th>
                    <th className="py-3 px-4">العائد (Real ROAS)</th>
                    <th className="py-3 px-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(campaignData?.campaigns || []).map((camp: any) => (
                    <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors font-semibold">
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-[11px]">{camp.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-bold">{camp.budgetDaily} DH</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">{camp.spendToday} DH</td>
                      <td className="py-3.5 px-4 text-slate-700 font-bold">
                        {camp.clicks} نقرة ({camp.ctr}%)
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600">{camp.confirmedLeads} طلب</td>
                      <td className="py-3.5 px-4 font-black text-indigo-600">{camp.realCprMad} DH</td>
                      <td className="py-3.5 px-4 font-black text-purple-600">{camp.realRoas}x</td>
                      <td className="py-3.5 px-4">
                        {camp.recommendationType === 'KILL' ? (
                          <button
                            onClick={() => handleCampaignAction(camp.id, 'KILL')}
                            className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 font-black text-[10px] cursor-pointer"
                          >
                            إيقاف 🛑
                          </button>
                        ) : camp.recommendationType === 'SCALE' ? (
                          <button
                            onClick={() => handleCampaignAction(camp.id, 'SCALE')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-black text-[10px] cursor-pointer"
                          >
                            تكبير +20% 🚀
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-normal">مستقر</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
                  <h3 className="text-base font-black text-slate-900 font-heading">توليد أفكار منتجات رابحة بالذكاء الاصطناعي</h3>
                  <p className="text-xs text-slate-500 font-medium">اختر المجال والسوق المستهدف وسيقوم الذكاء الاصطناعي بابتكار أفكار جديدة فوراً.</p>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">المجال / النيتش المستهدف</label>
                <select
                  value={aiNiche}
                  onChange={(e) => setAiNiche(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-3 font-bold bg-white text-slate-800"
                >
                  <option value="BEAUTY">💄 الجمال والعناية الشخصية (Beauty & Skincare)</option>
                  <option value="KITCHEN">🍳 أدوات المطبخ والمنزل (Kitchen & Home Hacks)</option>
                  <option value="CAR">🚗 إكسسوارات السيارات الذكية (Car Accessories)</option>
                  <option value="HEALTH">🏋️ الصحة والعلاج الطبيعي (Health & Pain Relief)</option>
                  <option value="PETS">🐾 الحيوانات الأليفة (Pet Supplies)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">السوق المستهدف (الدولة)</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظة أو ميزانية خاصة (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: منتجات سهلة التوصيل بهامش ربح عالي لا تنكسر أثناء الشحن"
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
                إلغاء
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

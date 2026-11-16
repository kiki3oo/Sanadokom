'use client';

import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  ExternalLink,
  Flame,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Percent,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  PackagePlus,
  Play,
  Layers,
  ChevronRight,
  Calculator,
  Compass,
  AlertCircle,
  Target,
  Filter,
  Tag,
  Zap,
  Gift,
  Clock,
} from 'lucide-react';
import { useStore } from '@/context/StoreContext';

interface SourceCountry {
  code: string;
  nameAr: string;
  nameFr: string;
  flag: string;
  currency: string;
  symbol: string;
  fxToMad: number;
  fxToXof: number;
  fxToSar: number;
}

interface TargetMarket {
  code: string;
  nameAr: string;
  nameFr: string;
  flag: string;
  currency: string;
  symbol: string;
  defaultShipping: number;
  typicalRetail: number;
  defaultWholesale: number;
  confirmationRate: number;
  deliveryRate: number;
  localeNotesAr: string;
  localeNotesFr: string;
}

const SOURCE_COUNTRIES: SourceCountry[] = [
  {
    code: 'ALL',
    nameAr: 'العالم كامل (Global)',
    nameFr: 'Tous les pays (Global)',
    flag: '🌍',
    currency: 'USD',
    symbol: '$',
    fxToMad: 10.0,
    fxToXof: 615,
    fxToSar: 3.75,
  },
  {
    code: 'US',
    nameAr: 'الولايات المتحدة الأمريكية',
    nameFr: 'États-Unis',
    flag: '🇺🇸',
    currency: 'USD',
    symbol: '$',
    fxToMad: 10.0,
    fxToXof: 615,
    fxToSar: 3.75,
  },
  {
    code: 'FR',
    nameAr: 'فرنسا وأوروبا',
    nameFr: 'France & Europe',
    flag: '🇫🇷',
    currency: 'EUR',
    symbol: '€',
    fxToMad: 10.8,
    fxToXof: 655.957,
    fxToSar: 4.05,
  },
  {
    code: 'SA',
    nameAr: 'المملكة العربية السعودية',
    nameFr: 'Arabie Saoudite',
    flag: '🇸🇦',
    currency: 'SAR',
    symbol: 'SAR',
    fxToMad: 2.67,
    fxToXof: 164,
    fxToSar: 1.0,
  },
  {
    code: 'AE',
    nameAr: 'الإمارات العربية المتحدة',
    nameFr: 'Émirats Arabes Unis',
    flag: '🇦🇪',
    currency: 'AED',
    symbol: 'AED',
    fxToMad: 2.72,
    fxToXof: 167,
    fxToSar: 1.02,
  },
  {
    code: 'GB',
    nameAr: 'المملكة المتحدة',
    nameFr: 'Royaume-Uni',
    flag: '🇬🇧',
    currency: 'GBP',
    symbol: '£',
    fxToMad: 12.6,
    fxToXof: 775,
    fxToSar: 4.75,
  },
  {
    code: 'ES',
    nameAr: 'إسبانيا',
    nameFr: 'Espagne',
    flag: '🇪🇸',
    currency: 'EUR',
    symbol: '€',
    fxToMad: 10.8,
    fxToXof: 655.957,
    fxToSar: 4.05,
  },
  {
    code: 'CN',
    nameAr: 'الصين (1688 / المصانع)',
    nameFr: 'Chine (1688 / Usines)',
    flag: '🇨🇳',
    currency: 'CNY',
    symbol: '¥',
    fxToMad: 1.38,
    fxToXof: 85,
    fxToSar: 0.52,
  },
];

const TARGET_MARKETS: TargetMarket[] = [
  {
    code: 'MA',
    nameAr: 'المغرب (Maroc)',
    nameFr: 'Maroc (MAD)',
    flag: '🇲🇦',
    currency: 'MAD',
    symbol: 'د.م',
    defaultShipping: 35,
    typicalRetail: 249,
    defaultWholesale: 45,
    confirmationRate: 85,
    deliveryRate: 80,
    localeNotesAr: 'سوق COD ضخم، التركيز على الدار البيضاء، الرباط، طنجة، فاس ومراكش. الدفع نقداً عند الاستلام.',
    localeNotesFr: 'Grand marché COD mature. Forte traction à Casablanca, Rabat, Tanger et Marrakech.',
  },
  {
    code: 'SN',
    nameAr: 'السنغال (Sénégal - Dakar)',
    nameFr: 'Sénégal (FCFA)',
    flag: '🇸🇳',
    currency: 'XOF',
    symbol: 'FCFA',
    defaultShipping: 2500,
    typicalRetail: 16500,
    defaultWholesale: 3500,
    confirmationRate: 86,
    deliveryRate: 82,
    localeNotesAr: 'سوق سريع النمو جداً في غرب أفريقيا. دكار تستقبل أكثر من 70% من الطلبيات، السكريبتات بالفرنسية أو الولوف.',
    localeNotesFr: 'Marché COD en plein essor en Afrique de l’Ouest. Dakar absorbe 70%+ des volumes.',
  },
  {
    code: 'CI',
    nameAr: "ساحل العاج (Côte d'Ivoire - Abidjan)",
    nameFr: "Côte d'Ivoire (Abidjan)",
    flag: '🇨🇮',
    currency: 'XOF',
    symbol: 'FCFA',
    defaultShipping: 2500,
    typicalRetail: 17500,
    defaultWholesale: 3800,
    confirmationRate: 83,
    deliveryRate: 78,
    localeNotesAr: 'أبيدجان وسوق الإكواس، طلب قوي على منتجات التجميل والمكملات والمنزل، الدفع نقداً أو عبر Wave.',
    localeNotesFr: 'Hub commercial ouest-africain. Abidjan très réceptif aux formats démo TikTok/Meta.',
  },
  {
    code: 'GCC',
    nameAr: 'دول الخليج (KSA / UAE)',
    nameFr: 'Pays du Golfe (KSA / UAE)',
    flag: '🇸🇦',
    currency: 'SAR',
    symbol: 'SAR',
    defaultShipping: 25,
    typicalRetail: 199,
    defaultWholesale: 32,
    confirmationRate: 88,
    deliveryRate: 82,
    localeNotesAr: 'قوة شرائية مرتفعة جداً، AOV عالي، يحتاج شحن محلي سريع وواتساب بوت للتأكيد الفوري.',
    localeNotesFr: 'Pouvoir d’achat élevé, AOV fort. Nécessite confirmation WhatsApp rapide et livraison en 48h.',
  },
];

export type NicheId = 'ALL' | 'SUPPLEMENTS' | 'COSMETICS' | 'WELLNESS' | 'KITCHEN' | 'CAR' | 'HOME' | 'MINCEUR';

interface NicheChip {
  id: NicheId;
  nameAr: string;
  nameFr: string;
  icon: string;
  color: string;
}

const NICHE_CHIPS: NicheChip[] = [
  { id: 'ALL', nameAr: '✨ جميع الفئات (الكل)', nameFr: '✨ Toutes les niches (Tout)', icon: '🌟', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'SUPPLEMENTS', nameAr: '💊 المكملات الغذائية والصحة', nameFr: '💊 Compléments & Suppléments', icon: '💊', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { id: 'COSMETICS', nameAr: '💄 مستحضرات التجميل والعناية', nameFr: '💄 Cosmétiques & Skincare', icon: '💄', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { id: 'WELLNESS', nameAr: '🧘 آلام الظهر والمفاصل', nameFr: '🧘 Soulagement & Douleurs', icon: '🧘', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'KITCHEN', nameAr: '🍳 أدوات المطبخ والمنزل', nameFr: '🍳 Cuisine & Maison', icon: '🍳', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'CAR', nameAr: '🚗 إكسسوارات السيارات', nameFr: '🚗 Auto & Accessoires', icon: '🚗', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'HOME', nameAr: '🏠 التنظيف الذكي وحلول البيت', nameFr: '🏠 Nettoyage & Gadgets', icon: '🏠', color: 'bg-teal-50 text-teal-800 border-teal-200' },
  { id: 'MINCEUR', nameAr: '🏃 التنحيف والرشاقة', nameFr: '🏃 Minceur & Silhouette', icon: '🏃', color: 'bg-rose-50 text-rose-800 border-rose-200' },
];

export type AdTriggerType = 'NONE' | 'COD' | 'OFFER' | 'DISCOUNT' | 'VIRAL';

interface AdTrigger {
  id: AdTriggerType;
  labelAr: string;
  labelFr: string;
  queryFr: string;
  queryAr: string;
  queryEn: string;
  icon: string;
}

const AD_TRIGGERS: AdTrigger[] = [
  { id: 'NONE', labelAr: 'بدون فلتر خاص', labelFr: 'Sans déclencheur', queryFr: '', queryAr: '', queryEn: '', icon: '🔍' },
  { id: 'COD', labelAr: 'الدفع عند الاستلام فقط', labelFr: 'Paiement à la livraison (COD)', queryFr: '"paiement à la livraison"', queryAr: '"الدفع عند الاستلام"', queryEn: '"cash on delivery"', icon: '🚚' },
  { id: 'OFFER', labelAr: 'عروض 1 مجاناً (BOGO)', labelFr: '1 Acheté = 1 Offert / BOGO', queryFr: '"acheté" "offert"', queryAr: '"احصل على الثاني مجانا"', queryEn: '"buy 1 get 1"', icon: '🎁' },
  { id: 'DISCOUNT', labelAr: 'تخفيض 50% فما فوق', labelFr: 'Remise 50% OFF', queryFr: '"-50%" OR "50% de réduction"', queryAr: '"خصم 50%"', queryEn: '"50% off"', icon: '🔥' },
  { id: 'VIRAL', labelAr: 'إعلانات الـ UGC والتجارب', labelFr: 'UGC & Témoignages Clients', queryFr: '"mon avis" OR "testé"', queryAr: '"تجربتي" OR "نتائج"', queryEn: '"review" OR "honest review"', icon: '⭐' },
];

interface WinningPreset {
  id: string;
  nameAr: string;
  nameFr: string;
  keyword: string;
  niche: NicheId;
  nicheAr: string;
  nicheFr: string;
  sourceWholesale: number; // in USD
  badge: string;
  trendVelocity: number; // 0-100
  momentumLabelAr: string;
  momentumLabelFr: string;
  whyWinningAr: string;
  whyWinningFr: string;
}

const PRESET_WINNING_PRODUCTS: WinningPreset[] = [
  // --- SUPPLEMENTS NICHE (HIGH MARGIN & RETENTION) ---
  {
    id: 'collagen-peptides',
    nameAr: 'بودرة الكولاجين البحري وفيتامين سي لنضارة البشرة والمفاصل',
    nameFr: 'Collagène Marin Hydrolysé & Vitamine C Pure',
    keyword: 'Marine Collagen Peptides Powder Skin Joints',
    niche: 'SUPPLEMENTS',
    nicheAr: 'مكملات غذائية وتجميل',
    nicheFr: 'Compléments & Beauté',
    sourceWholesale: 4.5,
    badge: '👑 Royal Winner COD',
    trendVelocity: 96,
    momentumLabelAr: 'طلب متفجر ومستمر من النساء 25-55 سنة',
    momentumLabelFr: 'Forte récurrence d’achat auprès des femmes 25-55 ans',
    whyWinningAr: 'أقوى مكمل مبيعاً، هامش ربح خيالي، الزبونة تعود للشراء شهرياً (Repeat Purchase)، عروض 2 علب ترفع السلة.',
    whyWinningFr: 'Produit star à très forte récurrence mensuelle. Idéal pour des offres pack cure 2 ou 3 mois.',
  },
  {
    id: 'ashwagandha-ksm66',
    nameAr: 'كبسولات الأشواغاندا KSM-66 للنوم العميق والتوتر والطاقة',
    nameFr: 'Ashwagandha KSM-66 Pure & Magnésium Anti-Stress',
    keyword: 'Ashwagandha KSM 66 Stress Sleep Energy',
    niche: 'SUPPLEMENTS',
    nicheAr: 'مكملات صحة ونوم',
    nicheFr: 'Compléments & Sommeil',
    sourceWholesale: 3.2,
    badge: '⚡ Viral TikTok Hit',
    trendVelocity: 93,
    momentumLabelAr: 'أكثر مكمل رائج على تيك توك فالعالم',
    momentumLabelFr: 'Explosion sur TikTok et Meta dans le monde entier',
    whyWinningAr: 'حل سريع للضغط النفسي ومشاكل النوم، زاوية إعلانية تناسب الموظفين والشباب، سعر جملة جد منخفض.',
    whyWinningFr: 'Résout l’insomnie et le stress professionnel. Coût de fabrication très bas et marge nette > 65%.',
  },
  {
    id: 'maca-black-ginseng',
    nameAr: 'مكمل الماكا السوداء والجنسنج الأحمر للنشاط البدني والحيوية',
    nameFr: 'Maca Noire du Pérou & Ginseng Rouge Vitalité Homme',
    keyword: 'Black Maca Root Extract Red Ginseng Vitality',
    niche: 'SUPPLEMENTS',
    nicheAr: 'طاقة ومكملات حيوية',
    nicheFr: 'Énergie & Vitalité Homme',
    sourceWholesale: 2.8,
    badge: '💰 High Volume Men Niche',
    trendVelocity: 92,
    momentumLabelAr: 'حجم مبيعات كاش خيالي فالمغرب والسنغال',
    momentumLabelFr: 'Volumes COD massifs au Maroc et en Afrique de l’Ouest',
    whyWinningAr: 'طلب دائم لدى الرجال، سرية التوصيل ترفع نسبة التأكيد، هامش ربح يتجاوز 150 درهم فالمغرب و12,000 فرنك بالسنغال.',
    whyWinningFr: 'Cible masculine captive, taux de confirmation élevé avec livraison discrète.',
  },
  {
    id: 'acv-gummies-detox',
    nameAr: 'حلويات خل التفاح (ACV Gummies) للتنحيف والهضم بدون طعم مر',
    nameFr: 'Gummies Vinaigre de Cidre de Pomme Détox & Digestion',
    keyword: 'Apple Cider Vinegar ACV Gummies Belly Bloat',
    niche: 'SUPPLEMENTS',
    nicheAr: 'مكملات هضم وتنحيف',
    nicheFr: 'Gummies Détox & Minceur',
    sourceWholesale: 2.2,
    badge: '🍬 Impulse Buy Winner',
    trendVelocity: 90,
    momentumLabelAr: 'مبيعات فورية دون تردد بسبب المذاق اللذيذ',
    momentumLabelFr: 'Achat d’impulsion immédiat grâce au format bonbon',
    whyWinningAr: 'حل سهل لانتفاخ البطن وسوء الهضم، طعم حلو يقضي على حموضة الخل، الفيديوهات تحقق تفاعل استثنائي.',
    whyWinningFr: 'Remplace le vinaigre liquide indigeste par des gummies savoureux. Forte viralité UGC.',
  },
  {
    id: 'matcha-ceremonial-tea',
    nameAr: 'شاي الماتشا الياباني الأخضر العضوي للتخسيس والتركيز الذهني',
    nameFr: 'Thé Matcha Cérémonial Bio Brûleur de Graisses',
    keyword: 'Ceremonial Organic Matcha Green Tea Powder Metabolism',
    niche: 'SUPPLEMENTS',
    nicheAr: 'شاي صحي وتخسيس',
    nicheFr: 'Minceur & Bien-être',
    sourceWholesale: 3.8,
    badge: '🍵 Evergreen Lifestyle',
    trendVelocity: 89,
    momentumLabelAr: 'ترند الـ Lifestyle الصحي الصاعد بقوة',
    momentumLabelFr: 'Tendance bien-être et énergie propre sans crash',
    whyWinningAr: 'بديل صحي للقهوة، حرق الدهون، جمالية التحضير تعطي فيديوهات تيك توك ممتعة بنسبة نقر خيالية.',
    whyWinningFr: 'Alternative saine au café, détox naturelle. Vidéos de préparation visuellement addictives.',
  },

  // --- HEALTH & WELLNESS ---
  {
    id: 'magne-steps',
    nameAr: 'فرشات MagneSteps المغناطيسية لآلام الظهر والمفاصل',
    nameFr: 'Semelles Magnétiques Acupression MagneSteps',
    keyword: 'Magnetic Acupressure Insoles Pain Relief',
    niche: 'WELLNESS',
    nicheAr: 'صحة وتخفيف آلام',
    nicheFr: 'Santé & Soulagement',
    sourceWholesale: 3.5,
    badge: '🔥 Hot Viral',
    trendVelocity: 94,
    momentumLabelAr: 'طلب متفجر في فرنسا وميريكان',
    momentumLabelFr: 'Traction massive aux USA & France',
    whyWinningAr: 'حل فوري لألم القدمين والظهر، سهلة الشحن، تكلفة الجملة منخفضة وهوامش ربح تتجاوز 70%.',
    whyWinningFr: 'Résout une douleur aiguë (dos/pieds), très léger, marge brute > 70% en COD.',
  },
  {
    id: 'shiatsu-massager',
    nameAr: 'جهاز مساج الرقبة والكتفين الشياتسو مع تسخين حراري',
    nameFr: 'Masseur Cervical Shiatsu Chauffant 3D',
    keyword: 'Shiatsu Neck and Shoulder Massager Heated',
    niche: 'WELLNESS',
    nicheAr: 'صحة وعلاج طبيعي',
    nicheFr: 'Santé & Bien-être',
    sourceWholesale: 8.5,
    badge: '⭐ Evergreen COD',
    trendVelocity: 84,
    momentumLabelAr: 'منتج مستمر طوال السنة لكبار السن والموظفين',
    momentumLabelFr: 'Produit intemporel à forte audience adulte',
    whyWinningAr: 'منتج غير موسمي (Evergreen)، زاوية إعلانية تناسب الموظفين وأصحاب الأعمال الشاقة وكبار السن.',
    whyWinningFr: 'Produit stable toute l’année. Cible très large (employés de bureau, chauffeurs, personnes âgées).',
  },

  // --- HOME & CLEANING ---
  {
    id: 'steam-cleaner',
    nameAr: 'ممسحة البخار اللاسلكية للتنظيف العميق للمنازل والسيارات',
    nameFr: 'Nettoyeur Vapeur Haute Pression Sans Fil',
    keyword: 'Portable High Pressure Steam Cleaner',
    niche: 'HOME',
    nicheAr: 'المنزل والتنظيف الذكي',
    nicheFr: 'Maison & Nettoyage',
    sourceWholesale: 9.8,
    badge: '⚡ High Perceived Value',
    trendVelocity: 88,
    momentumLabelAr: 'ترند مشاهدات تيك توك خيالي',
    momentumLabelFr: 'Vidéos avant/après virales sur TikTok',
    whyWinningAr: 'فيديوهات قبل وبعد (Before/After) تحقق مبيعات فورية دون الحاجة لشرح معقد، قيمة مدركة عالية.',
    whyWinningFr: 'Effet visuel avant/après spectaculaire, idéal pour les vidéos TikTok à fort taux de clic.',
  },
  {
    id: 'solar-4g-cam',
    nameAr: 'كاميرا المراقبة الذكية بالطاقة الشمسية مع شريحة 4G',
    nameFr: 'Caméra de Sécurité 4G Solaire Extérieure',
    keyword: 'Solar 4G Outdoor Security Camera',
    niche: 'HOME',
    nicheAr: 'إلكترونيات وحلول أمنية',
    nicheFr: 'Sécurité & High-Tech',
    sourceWholesale: 21.0,
    badge: '💎 High-Ticket Winner',
    trendVelocity: 86,
    momentumLabelAr: 'طلب مرتفع في الضيعات والمناطق غير المغطاة بالواي فاي',
    momentumLabelFr: 'Fort intérêt pour fermes et chantiers isolés',
    whyWinningAr: 'تعمل بدون كهرباء ولا واي فاي، منتج تذكرة مرتفعة (High Ticket) مع ربح صافي يتجاوز 150 درهم للطلبية.',
    whyWinningFr: 'Fonctionne sans wifi ni électricité filaire. Panier moyen élevé avec marge nette supérieure à 15€/commande.',
  },

  // --- MINCEUR & SILHOUETTE ---
  {
    id: 'slimming-patches',
    nameAr: 'لاصقات التنحيف العشبية للبطن وإزالة السموم',
    nameFr: 'Patchs Minceur Détox Brûleur de Graisse',
    keyword: 'Herbal Slimming Belly Detox Patches',
    niche: 'MINCEUR',
    nicheAr: 'مستحضرات وتخسيس',
    nicheFr: 'Minceur & Silhouette',
    sourceWholesale: 1.8,
    badge: '💰 Extreme Margin',
    trendVelocity: 91,
    momentumLabelAr: 'مبيعات يومية مستمرة في الخليج وأوروبا',
    momentumLabelFr: 'Volume continu et récurrent dans le Golfe',
    whyWinningAr: 'سعر جملة رخيص جداً، طلب موسمي دائم، إمكانية بيع باقات عروض (Pack 2 + 1 مجاناً).',
    whyWinningFr: 'Coût unitaire infime, parfait pour des offres bundles (Pack 2 boîtes + 1 offerte).',
  },

  // --- CAR ACCESSORIES ---
  {
    id: 'car-dent-repair',
    nameAr: 'طقم إزالة صدمات وانبعاجات السيارات بنفسك (Dent Repair)',
    nameFr: 'Kit Débosselage Carrosserie Sans Peinture',
    keyword: 'Paintless Car Dent Repair Kit Puller',
    niche: 'CAR',
    nicheAr: 'إكسسوارات وحلول سيارات',
    nicheFr: 'Auto & Bricolage',
    sourceWholesale: 5.2,
    badge: '🚗 Men Niche Goldmine',
    trendVelocity: 82,
    momentumLabelAr: 'يوفر آلاف الدراهم عند الميكانيكي',
    momentumLabelFr: 'Économise des centaines d’euros de carrossier',
    whyWinningAr: 'استهداف مباشر للرجال وأصحاب السيارات، حجة بيع قوية "وفر فلوس الميكانيكي وأصلحها فـ 5 دقائق".',
    whyWinningFr: 'Argumentaire choc pour propriétaires de véhicules : économie immédiate par rapport au garagiste.',
  },
];

export function CrossBorderSpyHub({
  isAr,
  onAuditProduct,
  onPushToStock,
}: {
  isAr: boolean;
  onAuditProduct: (productData: {
    title: string;
    niche: string;
    targetCountry: string;
    wholesalePrice: number;
    retailPrice: number;
    description?: string;
  }) => void;
  onPushToStock?: (productData: { title: string; wholesalePrice: number; retailPrice: number }) => void;
}) {
  const { selectedStoreId } = useStore();
  const label = (fr: string, ar: string) => (isAr ? ar : fr);

  // Selections
  const [sourceCode, setSourceCode] = useState<string>('ALL'); // Default to ALL (Global) as user requested!
  const [targetCode, setTargetCode] = useState<string>('MA');
  const [selectedNiche, setSelectedNiche] = useState<NicheId>('ALL');
  const [adTrigger, setAdTrigger] = useState<AdTriggerType>('NONE');

  // Search keyword input
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string>('collagen-peptides');

  // Economics inputs for Arbitrage simulator
  const [wholesalePriceSource, setWholesalePriceSource] = useState<number>(4.5);
  const [intlCargoPerUnit, setIntlCargoPerUnit] = useState<number>(1.8);
  const [retailPriceTarget, setRetailPriceTarget] = useState<number>(249);
  const [localShippingTarget, setLocalShippingTarget] = useState<number>(35);
  const [confirmationRate, setConfirmationRate] = useState<number>(85);
  const [deliveryRate, setDeliveryRate] = useState<number>(80);

  // Push state feedback
  const [pushedSuccess, setPushedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const selectedSource = useMemo(
    () => SOURCE_COUNTRIES.find((s) => s.code === sourceCode) || SOURCE_COUNTRIES[0],
    [sourceCode]
  );
  const selectedTarget = useMemo(
    () => TARGET_MARKETS.find((t) => t.code === targetCode) || TARGET_MARKETS[0],
    [targetCode]
  );

  // Filtered winning presets based on Niche and Search Keyword
  const filteredPresets = useMemo(() => {
    let list = PRESET_WINNING_PRODUCTS;
    if (selectedNiche !== 'ALL') {
      list = list.filter((p) => p.niche === selectedNiche);
    }
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameFr.toLowerCase().includes(q) ||
          p.keyword.toLowerCase().includes(q) ||
          p.nicheAr.toLowerCase().includes(q) ||
          p.nicheFr.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedNiche, searchKeyword]);

  // Handle preset click
  const selectPreset = (preset: WinningPreset) => {
    setActivePresetId(preset.id);
    setWholesalePriceSource(preset.sourceWholesale);

    // Adjust typical retail price for target market
    if (selectedTarget.code === 'SN' || selectedTarget.code === 'CI') {
      setRetailPriceTarget(16500);
      setLocalShippingTarget(2500);
    } else if (selectedTarget.code === 'GCC') {
      setRetailPriceTarget(199);
      setLocalShippingTarget(25);
    } else {
      setRetailPriceTarget(249);
      setLocalShippingTarget(35);
    }
  };

  // Switch Target Market
  const handleTargetChange = (code: string) => {
    setTargetCode(code);
    const tm = TARGET_MARKETS.find((t) => t.code === code);
    if (tm) {
      setLocalShippingTarget(tm.defaultShipping);
      setRetailPriceTarget(tm.typicalRetail);
      setConfirmationRate(tm.confirmationRate);
      setDeliveryRate(tm.deliveryRate);
    }
  };

  // Active query keyword: either user search keyword or selected preset keyword
  const effectiveBaseKeyword = useMemo(() => {
    if (searchKeyword.trim()) return searchKeyword.trim();
    const active = PRESET_WINNING_PRODUCTS.find((p) => p.id === activePresetId);
    return active ? active.keyword : 'Collagen Peptides';
  }, [searchKeyword, activePresetId]);

  // Combine with Ad Trigger if active
  const triggerData = useMemo(() => AD_TRIGGERS.find((t) => t.id === adTrigger) || AD_TRIGGERS[0], [adTrigger]);

  const effectiveAdQuery = useMemo(() => {
    if (adTrigger === 'NONE' || !triggerData.queryFr) {
      return effectiveBaseKeyword;
    }
    // If French / Arab / English
    const triggerWord = isAr ? triggerData.queryAr || triggerData.queryFr : triggerData.queryFr;
    return `${effectiveBaseKeyword} ${triggerWord}`;
  }, [effectiveBaseKeyword, adTrigger, triggerData, isAr]);

  // Conversion of wholesale into target currency
  const landedCostInTargetCurrency = useMemo(() => {
    const totalUnitCostInSource = wholesalePriceSource + intlCargoPerUnit;
    let factor = 1;
    if (selectedTarget.code === 'MA') {
      factor = selectedSource.fxToMad;
    } else if (selectedTarget.code === 'SN' || selectedTarget.code === 'CI') {
      factor = selectedSource.fxToXof;
    } else if (selectedTarget.code === 'GCC') {
      factor = selectedSource.fxToSar;
    }
    return Math.round(totalUnitCostInSource * factor * 10) / 10;
  }, [wholesalePriceSource, intlCargoPerUnit, selectedSource, selectedTarget]);

  // Arbitrage and margin calculations
  const economics = useMemo(() => {
    const cRate = Math.max(1, confirmationRate) / 100;
    const dRate = Math.max(1, deliveryRate) / 100;

    // Delivery fee impact: non delivered packages also incur return shipping (approx 40% of shipping)
    const effectiveDeliveryCost = localShippingTarget + (1 - dRate) * (localShippingTarget * 0.4);

    // Net cash collected per delivered order = Retail - Landed Product Cost - Effective Shipping
    const netProfitPerDelivered = retailPriceTarget - landedCostInTargetCurrency - effectiveDeliveryCost;
    const marginPercent = retailPriceTarget > 0 ? Math.round((netProfitPerDelivered / retailPriceTarget) * 100) : 0;

    const breakEvenCpaPerLead = Math.max(0, Math.round(netProfitPerDelivered * dRate));
    const targetCpaPerLead = Math.max(0, Math.round(breakEvenCpaPerLead * 0.6));

    const breakEvenRoas =
      netProfitPerDelivered > 0 && breakEvenCpaPerLead > 0
        ? Math.round((retailPriceTarget / (retailPriceTarget - netProfitPerDelivered)) * 10) / 10
        : 1.0;

    return {
      landedCost: landedCostInTargetCurrency,
      netProfitPerDelivered: Math.round(netProfitPerDelivered),
      marginPercent,
      breakEvenCpaPerLead,
      targetCpaPerLead,
      breakEvenRoas,
    };
  }, [
    retailPriceTarget,
    landedCostInTargetCurrency,
    localShippingTarget,
    confirmationRate,
    deliveryRate,
  ]);

  // Deep-Link Generators
  const metaAdLibraryUrl = useMemo(() => {
    const countryParam = selectedSource.code; // 'ALL', 'US', 'FR', 'SA', etc.
    return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${countryParam}&q=${encodeURIComponent(
      effectiveAdQuery
    )}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped`;
  }, [selectedSource.code, effectiveAdQuery]);

  const tikTokCreativeCenterUrl = useMemo(() => {
    const countryParam = selectedSource.code === 'ALL' || selectedSource.code === 'CN' ? 'US' : selectedSource.code;
    return `https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en?keyword=${encodeURIComponent(
      effectiveBaseKeyword
    )}&countryCode=${countryParam}`;
  }, [selectedSource.code, effectiveBaseKeyword]);

  const tikTokViralSearchUrl = useMemo(() => {
    return `https://www.tiktok.com/search?q=${encodeURIComponent(effectiveBaseKeyword + ' viral')}`;
  }, [effectiveBaseKeyword]);

  const googleTrendsCompareUrl = useMemo(() => {
    const sourceGeo = selectedSource.code === 'ALL' || selectedSource.code === 'CN' ? 'US' : selectedSource.code;
    const targetGeo = selectedTarget.code === 'GCC' ? 'SA' : selectedTarget.code;
    return `https://trends.google.com/trends/explore?q=${encodeURIComponent(
      effectiveBaseKeyword
    )}&geo=${sourceGeo}&compare=${targetGeo}`;
  }, [selectedSource.code, selectedTarget.code, effectiveBaseKeyword]);

  const aliExpressSourcingUrl = useMemo(() => {
    return `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(effectiveBaseKeyword)}`;
  }, [effectiveBaseKeyword]);

  const s1688SourcingUrl = useMemo(() => {
    return `https://s.1688.com/youyuan/index.htm?tab=all&keywords=${encodeURIComponent(effectiveBaseKeyword)}`;
  }, [effectiveBaseKeyword]);

  // Push to validator action
  const handlePushToValidator = () => {
    onAuditProduct({
      title: effectiveBaseKeyword,
      niche: selectedNiche === 'ALL' ? 'GENERAL' : selectedNiche,
      targetCountry: selectedTarget.code,
      wholesalePrice: landedCostInTargetCurrency,
      retailPrice: retailPriceTarget,
      description: `Sourced from ${selectedSource.nameFr} (${selectedSource.flag}) for destination ${selectedTarget.nameFr} (${selectedTarget.flag}). Target CPA: ${economics.targetCpaPerLead} ${selectedTarget.symbol}. Net Profit: ${economics.netProfitPerDelivered} ${selectedTarget.symbol}.`,
    });
  };

  // Push to stock action
  const handlePushStock = async () => {
    if (onPushToStock) {
      onPushToStock({
        title: effectiveBaseKeyword,
        wholesalePrice: landedCostInTargetCurrency,
        retailPrice: retailPriceTarget,
      });
      setPushedSuccess(true);
      setTimeout(() => setPushedSuccess(false), 3000);
      return;
    }

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          name: effectiveBaseKeyword,
          sku: `SPY-${selectedSource.code}-${selectedTarget.code}-${Date.now().toString().slice(-4)}`,
          quantity: 50,
          buyingPrice: landedCostInTargetCurrency,
          sellingPrice: retailPriceTarget,
          category: selectedNiche === 'ALL' ? 'CROSS_BORDER_WINNER' : selectedNiche,
          storeId: selectedStoreId || undefined,
        }),
      });
      if (res.ok) {
        setPushedSuccess(true);
        setTimeout(() => setPushedSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Push to stock failed', e);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <section dir={isAr ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-black backdrop-blur-sm">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>{label('Arbitrage COD & Sourcing International', 'استراتيجية استيراد المنتجات الرابحة والتجسس العالمي')}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-heading">
              {label(
                'Cross-Border Spy & Trends Hub : Meta, TikTok, Google Trends & Sourcing',
                'مركز التجسس وترندات الإعلانات العالمية: Meta و TikTok و Google Trends'
              )}
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {label(
                'Explorez les niches rentables (Compléments & Suppléments, Skincare, Maison, Auto) dans le monde entier (Global 🌍) ou par pays, débusquez les pubs actives avec les déclencheurs COD et calculez votre marge nette au Maroc (MAD) ou au Sénégal (FCFA).',
                'اكتشف النيتشات الأكثر ربحية (المكملات الغذائية، التجميل، الصحة، المنزل، السيارات) في العالم كاملاً (Global 🌍) أو باختيار بلد معين، وتجسس على إعلانات فيسبوك وتيك توك النشطة، واحسب ربحك الصافي نقداً عند الاستلام.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2.5 w-full lg:w-auto">
            <button
              onClick={handlePushToValidator}
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{label('Valider & Générer les Scripts UGC', 'فحص المنتج وتوليد سكريبتات الدارجة')}</span>
            </button>
            <button
              onClick={handlePushStock}
              disabled={pushedSuccess}
              className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-sm transition-all cursor-pointer disabled:bg-emerald-600 disabled:border-emerald-500"
            >
              {pushedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{label('Ajouté au Stock avec succès !', 'تمت الإضافة للمخزون بنجاح!')}</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4 text-indigo-300" />
                  <span>{label('Ajouter au Stock / Sourcing', 'إضافة كمسودة في المخزون')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Source Country & Destination Market */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          {/* 1. Source Country */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                {label('Marché Source à Espionner (Défaut : Global 🌍)', 'السوق المصدر للتجسس (الافتراضي : العالم كامل 🌍)')}
              </span>
              <span className="text-indigo-600 font-bold">{selectedSource.flag} {selectedSource.currency}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOURCE_COUNTRIES.map((src) => {
                const active = src.code === sourceCode;
                return (
                  <button
                    key={src.code}
                    type="button"
                    onClick={() => setSourceCode(src.code)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      active
                        ? 'border-indigo-600 bg-indigo-50/90 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{src.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {isAr ? src.nameAr : src.nameFr}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">{src.currency}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Target Market */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" />
                {label('Marché Destination COD (Où vous vendez)', 'سوق البيع والدفع عند الاستلام (أين تبيع)')}
              </span>
              <span className="text-emerald-700 font-bold">{selectedTarget.flag} {selectedTarget.currency}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TARGET_MARKETS.map((tgt) => {
                const active = tgt.code === targetCode;
                return (
                  <button
                    key={tgt.code}
                    type="button"
                    onClick={() => handleTargetChange(tgt.code)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-600 bg-emerald-50/90 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{tgt.flag}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {isAr ? tgt.nameAr : tgt.nameFr}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">{tgt.currency} (COD)</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Note locale */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{isAr ? selectedTarget.localeNotesAr : selectedTarget.localeNotesFr}</span>
        </div>
      </div>

      {/* NICHE SEARCH & FILTER BAR */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>{label('Recherche par Niche & Mots-Clés E-commerce', 'البحث حسب النيتش والكلمات المفتاحية')}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {label(
                'Tapez un produit ou une niche (ex: "Collagen", "Ashwagandha", "Nettoyeur vapeur", "Semelles").',
                'اكتب اسم أي نيتش أو منتج ترغب في التجسس عليه (مثال: مكملات كولاجين، أشواغاندا، تنظيف، مفاصل).'
              )}
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={label('Rechercher un produit ou niche...', 'ابحث عن أي منتج أو نيتش...')}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-bold rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            />
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Niche Chips Carousel */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            {label('Niches Fortes en COD (Rentabilité Prouvée) :', 'أقوى نيتشات الكاش أون ديليفري :')}
          </span>
          <div className="flex flex-wrap gap-2">
            {NICHE_CHIPS.map((niche) => {
              const active = selectedNiche === niche.id;
              return (
                <button
                  key={niche.id}
                  type="button"
                  onClick={() => setSelectedNiche(niche.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : `${niche.color} hover:opacity-90`
                  }`}
                >
                  <span>{niche.icon}</span>
                  <span>{isAr ? niche.nameAr : niche.nameFr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ad Spy Trigger Chips */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{label('Filtres d’Espionnage Publicitaire (Déclencheurs COD & Offres) :', 'فلاتر التجسس الذكية (كلمات إعلانات التحويل والـ COD) :')}</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {AD_TRIGGERS.map((trig) => {
              const active = adTrigger === trig.id;
              return (
                <button
                  key={trig.id}
                  type="button"
                  onClick={() => setAdTrigger(trig.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    active
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm font-black'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>{trig.icon}</span>
                  <span>{isAr ? trig.labelAr : trig.labelFr}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Preset Winners Grid (Dynamically filtered by Niche & Search) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>
              {label(
                `Produits Gagnants Référents (${filteredPresets.length} trouvés)`,
                `المنتجات الرابحة المعتمدة (${filteredPresets.length} منتج متطابق)`
              )}
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            {label('Cliquez sur une fiche pour charger ses paramètres', 'اضغط على المنتج لتحميل إعداداته وأرباحه')}
          </span>
        </div>

        {filteredPresets.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {label(
              'Aucun produit prédéfini pour ce filtre, mais vous pouvez lancer l’espionnage direct avec votre mot-clé ci-dessus !',
              'لا توجد منتجات مسجلة مسبقاً لهذا البحث، ولكن يمكنك التجسس المباشر على هذا النيتش عبر الأزرار أسفله!'
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {filteredPresets.map((p) => {
              const isSelected = activePresetId === p.id && !searchKeyword;
              return (
                <div
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                        {p.badge}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {isAr ? p.nicheAr : p.nicheFr}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-2">
                      {isAr ? p.nameAr : p.nameFr}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {isAr ? p.whyWinningAr : p.whyWinningFr}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 font-black">
                      {label('Achat Usine :', 'سعر المصنع :')} ${p.sourceWholesale}
                    </span>
                    <div className="flex items-center gap-1 font-black text-indigo-700">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{p.trendVelocity}% {label('Momentum', 'قوة الترند')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Action Hub: 4 Interactive Spy Panels */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* PANEL 1: Meta Ad Library & TikTok Creative Center */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black text-lg">
                  🎯
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {label('Espionnage Publicitaire Direct (Meta & TikTok)', 'التجسس المباشر على الإعلانات (Meta و TikTok)')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {label('Recherche filtrée en temps réel avec statut ACTIF', 'بحث مباشر مفلتر على الإعلانات النشطة حالياً')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-black bg-slate-100 text-slate-700">
                {selectedSource.flag} {selectedSource.code}
              </span>
            </div>

            {/* Keyword tag and Ad trigger tag */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400 font-semibold">{label('Requête analysée :', 'الكلمة المفتاحية :')}</span>{' '}
                  <strong className="text-indigo-900">{effectiveAdQuery}</strong>
                </div>
                <button
                  onClick={() => copyToClipboard(effectiveAdQuery, 'kw')}
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink === 'kw' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'kw' ? label('Copié', 'تم النسخ') : label('Copier', 'نسخ')}</span>
                </button>
              </div>
              {adTrigger !== 'NONE' && (
                <div className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                  ⚡ {label('Filtre actif :', 'الفلتر المفعل :')} {isAr ? triggerData.labelAr : triggerData.labelFr}
                </div>
              )}
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-3">
              {/* Meta Ad Library */}
              <a
                href={metaAdLibraryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 flex items-center justify-between text-blue-900 font-bold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    f
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>{label('Meta Ad Library (Facebook & Instagram)', 'مكتبة إعلانات Meta (فيسبوك وإنستغرام)')}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-black">
                        Active Ads
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-700/80 font-normal">
                      {label(
                        `Voir toutes les annonces actives (${selectedSource.nameFr})`,
                        `مشاهدة الإعلانات النشطة حالياً (${selectedSource.nameAr})`
                      )}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* TikTok Creative Center Top Ads */}
              <a
                href={tikTokCreativeCenterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl border border-slate-900/10 bg-gradient-to-r from-slate-900/5 to-slate-800/10 hover:bg-slate-900/15 flex items-center justify-between text-slate-900 font-bold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    🎵
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>{label('TikTok Creative Center (Top Ads & CTR)', 'تيك توك كرييتف سنتر (Top Ads ومعدل النقر)')}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-100 text-pink-800 font-black">
                        High Converting
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-normal">
                      {label(
                        `Meilleurs créatives et vidéos virales par pays`,
                        `أفضل الفيديوهات الإعلانية المحققة لأعلى تحويل`
                      )}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* TikTok Viral Search */}
              <a
                href={tikTokViralSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3.5 rounded-2xl border border-pink-200 bg-pink-50/50 hover:bg-pink-100/60 flex items-center justify-between text-pink-950 font-semibold transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 text-pink-600 fill-pink-600" />
                  <span className="text-xs font-bold">
                    {label('Explorer les vidéos organiques TikTok (#Viral #Review)', 'استكشاف الفيديوهات الأكثر مشاهدة (#Viral)')}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-pink-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
            💡 {label(
              'Conseil Pro : Repérez les publicités actives depuis plus de 14 jours, cela prouve que le media buyer est rentable et scale son budget !',
              'نصيحة محترف: الإعلان الذي تراه شغالاً منذ أكثر من 14 يوماً يعني بالضرورة أنه رابح ويسحب مبيعات كبيرة يومياً!'
            )}
          </div>
        </div>

        {/* PANEL 2: Google Trends & Sourcing 1688 / AliExpress */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-black text-lg">
                  📈
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {label('Google Trends & Sourcing Usines (1688 / AliExpress)', 'ترندات جوجل ومصادر التوريد (1688 / AliExpress)')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {label('Validation de la demande et recherche des fournisseurs au meilleur prix', 'تأكيد حجم الطلب ومقارنة الأسعار مع المصانع')}
                  </p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-black bg-amber-50 text-amber-800 border border-amber-200">
                {label('Arbitrage', 'مقارنة الأسواق')}
              </span>
            </div>

            {/* Google Trends Dual Compare */}
            <div className="space-y-2">
              <a
                href={googleTrendsCompareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 to-slate-50 hover:bg-indigo-100/60 flex items-center justify-between text-indigo-950 font-bold transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    G
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>{label('Google Trends : Comparaison Bilatérale', 'مقارنة Google Trends بين البلدين')}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-black">
                        {selectedSource.code} vs {selectedTarget.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-normal">
                      {label(
                        `Vérifier si la tendance commence à décoller au ${selectedTarget.nameFr}`,
                        `معرفة هل بدأ الطلب يتصاعد في ${selectedTarget.nameAr}`
                      )}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Sourcing Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* AliExpress */}
              <a
                href={aliExpressSourcingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 flex items-center justify-between text-orange-950 font-bold transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛒</span>
                  <div>
                    <div className="text-xs font-black">{label('AliExpress Express', 'علي إكسبريس بالجملة')}</div>
                    <div className="text-[10px] text-orange-700">{label('Échantillons rapides', 'عينات سريعة وتوصيل فردي')}</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-orange-600 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* 1688 */}
              <a
                href={s1688SourcingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl border border-red-200 bg-red-50/60 hover:bg-red-100/70 flex items-center justify-between text-red-950 font-bold transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏭</span>
                  <div>
                    <div className="text-xs font-black">{label('1688 Usines Directes', 'مصانع 1688 الصينية')}</div>
                    <div className="text-[10px] text-red-700">{label('Prix d’usine 50% moins cher', 'سعر الجملة الحقيقي')}</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-red-600 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>🎯</span>
              <span>{label('Plan d’action Recommandé :', 'خطة التنفيذ الموصى بها :')}</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {label(
                `1. Téléchargez la vidéo TikTok la plus virale. 2. Créez un doublage en Darija ou Français local. 3. Lancez 3 créatives avec budget test de 15$ sur Meta/TikTok.`,
                `1. حمّل أفضل فيديو من تيك توك. 2. دير عليه صوت (Voiceover) بالدارجة المغربية أو الفرنسية البسيطة. 3. أطلق 3 نسخ إعلانية بميزانية تجربة 15 دولار للمغرب أو السنغال.`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Cross-Border COD Margin & Profit Simulator */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 p-6 md:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
              <Calculator className="w-3.5 h-3.5" />
              <span>{label('Simulateur de Rentabilité COD & Arbitrage', 'حاسبة أرباح التجارة العابرة للحدود (Arbitrage COD)')}</span>
            </div>
            <h3 className="text-lg font-black text-slate-900 font-heading">
              {label(
                `Rentabilité prévisionnelle pour vendre au ${selectedTarget.nameFr} (${selectedTarget.currency})`,
                `الأرباح الصافية المتوقعة للبيع في ${selectedTarget.nameAr} (${selectedTarget.currency})`
              )}
            </h3>
            <p className="text-xs text-slate-500">
              {label(
                'Calcul automatique intégrant coût usine, fret international, livraison COD et confirmation des commandes.',
                'حساب أوتوماتيكي دقيق يشمل سعر المصنع، الشحن الدولي، التوصيل المحلي ونسبة التأكيد.'
              )}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white border border-emerald-200 shadow-2xs text-right">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">
              {label('Coût d’Achat Arrivé Estimé', 'تكلفة الاستيراد واصل لبلدك')}
            </span>
            <span className="text-xl font-black text-slate-900">
              {economics.landedCost} {selectedTarget.symbol}
            </span>
            <span className="text-[10px] text-slate-500 block">
              (${wholesalePriceSource} + ${intlCargoPerUnit} fret)
            </span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Wholesale USD */}
          <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block">
              {label('Achat Usine ($)', 'سعر الشراء ($)')}
            </label>
            <input
              type="number"
              step="0.1"
              value={wholesalePriceSource}
              onChange={(e) => setWholesalePriceSource(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
            />
          </div>

          {/* Cargo Fret USD */}
          <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block">
              {label('Fret/Pièce ($)', 'شحن القطعة ($)')}
            </label>
            <input
              type="number"
              step="0.1"
              value={intlCargoPerUnit}
              onChange={(e) => setIntlCargoPerUnit(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
            />
          </div>

          {/* Selling Price Target */}
          <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block">
              {label(`Prix Vente (${selectedTarget.symbol})`, `سعر البيع (${selectedTarget.symbol})`)}
            </label>
            <input
              type="number"
              value={retailPriceTarget}
              onChange={(e) => setRetailPriceTarget(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
            />
          </div>

          {/* Local Shipping Target */}
          <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block">
              {label(`Livraison (${selectedTarget.symbol})`, `التوصيل (${selectedTarget.symbol})`)}
            </label>
            <input
              type="number"
              value={localShippingTarget}
              onChange={(e) => setLocalShippingTarget(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
            />
          </div>

          {/* Confirmation Rate */}
          <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block">
              {label('Confirmation (%)', 'نسبة التأكيد (%)')}
            </label>
            <input
              type="number"
              value={confirmationRate}
              onChange={(e) => setConfirmationRate(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
            />
          </div>

          {/* Delivery Rate */}
          <div className="space-y-1 bg-white p-3 rounded-2xl border border-slate-200">
            <label className="text-[11px] font-bold text-slate-500 block">
              {label('Livraison (%)', 'نسبة التسليم (%)')}
            </label>
            <input
              type="number"
              value={deliveryRate}
              onChange={(e) => setDeliveryRate(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
            />
          </div>
        </div>

        {/* Results Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* 1. Net Profit per Delivered Order */}
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{label('Bénéfice Net / Commande Livrée', 'الربح الصافي لكل طلب مستلم')}</span>
            </div>
            <div className="text-2xl font-black text-emerald-700">
              +{economics.netProfitPerDelivered} {selectedTarget.symbol}
            </div>
            <div className="text-[11px] font-bold text-emerald-600">
              {economics.marginPercent}% {label('de marge nette', 'هامش ربح صافي')}
            </div>
          </div>

          {/* 2. Target CPA (Cost per Lead) */}
          <div className="p-4 rounded-2xl bg-white border border-indigo-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>{label('CPA Cible Recommandé', 'تكلفة الليد المستهدفة (Target CPA)')}</span>
            </div>
            <div className="text-2xl font-black text-indigo-700">
              ≤ {economics.targetCpaPerLead} {selectedTarget.symbol}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              {label('Pour 40% de marge nette sécurisée', 'لضمان 40% هامش ربح محمي')}
            </div>
          </div>

          {/* 3. Break-Even CPA */}
          <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{label('CPA Max Seuil de Rentabilité', 'أقصى تكلفة ليد قبل الخسارة (Kill Rule)')}</span>
            </div>
            <div className="text-2xl font-black text-amber-800">
              {economics.breakEvenCpaPerLead} {selectedTarget.symbol}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold">
              {label('Couper la pub si CPA dépasse ce seuil', 'أوقف الإعلان إذا تجاوز هذا الرقم')}
            </div>
          </div>

          {/* 4. Break-Even ROAS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
              <span>{label('ROAS Minimum Requis', 'أدنى عائد إعلاني مطلوب (Min ROAS)')}</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {economics.breakEvenRoas}x
            </div>
            <div className="text-[11px] text-slate-500 font-semibold">
              {label('Sur le chiffre d’affaires encaissé', 'على المدخول المحصل نقداً')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

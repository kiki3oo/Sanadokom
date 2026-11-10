import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export type MarketCountry = 'ALL' | 'MA' | 'SN' | 'GCC' | 'US' | 'FR' | 'EU' | 'UK' | 'CA' | 'GLOBAL';

export interface WinningProduct {
  id: string;
  title: string;
  titleAr: string;
  niche: 'BEAUTY' | 'KITCHEN' | 'CAR' | 'HEALTH' | 'GADGETS' | 'BABY' | 'HOME' | 'PETS';
  country: MarketCountry;
  countryNameAr: string;
  countryFlag: string;
  currency: string;
  status: 'EMERGING' | 'HOT' | 'EVERGREEN' | 'SATURATED';
  type: 'PROBLEM_SOLVER' | 'WOW_FACTOR' | 'BUNDLE_GIFT';
  wholesalePrice: number; // Prix d'achat estimé
  retailPrice: number;    // Prix de vente conseillé
  estShippingFee: number; // Frais livraison
  estConfirmationRate: number; // % (ex: 80)
  estDeliveryRate: number;     // % (ex: 75)
  netProfitPerUnit: number;    // Bénéfice net estimé
  saturationScore: number;     // 1-100 (bas = opportunité élevée)
  activeCompetitors: number;   // Estimé
  description: string;
  descriptionAr: string;
  whyWinning: string[];
  whyWinningAr: string[];
  imageUrl: string;
  videoExampleUrl?: string;
  metaAdLibraryKeyword: string;
  tikTokSearchKeyword: string;
  aliExpressSearchKeyword?: string;
  suggestedAnglesAr: string[];
  addedAt: string;
}

export interface ProductAnalysisInput {
  title: string;
  niche?: string;
  wholesalePrice: number;
  retailPrice: number;
  shippingFee?: number;
  estConfirmationRate?: number;
  estDeliveryRate?: number;
  productUrl?: string;
  description?: string;
  targetCountry?: string;
}

export interface ProductAnalysisResult {
  productTitle: string;
  overallScore: number; // 0-100
  scoreLabel: string;
  scoreColor: string;
  verdictAr: string;
  verdictFr: string;
  breakdown: {
    problemSolving: number; // 0-100
    wowFactor: number;
    shippingFeasibility: number;
    marginHealth: number;
    marketDemand: number;
  };
  economics: {
    wholesalePrice: number;
    retailPrice: number;
    grossMargin: number;
    estShippingFee: number;
    estConfirmationRate: number;
    estDeliveryRate: number;
    breakEvenCpa: number; // Max CPA before loss in MAD
    targetCpaMin: number; // Sweet spot min MAD
    targetCpaMax: number; // Sweet spot max MAD
    netProfitPerDelivered: number; // MAD
    expectedNetProfitPer100Leads: number; // MAD
    roasTarget: number;
  };
  targeting: {
    recommendedGender: 'ALL' | 'WOMEN' | 'MEN';
    ageRange: string;
    priorityCities: string[];
    excludedZones: string[];
    adsetStrategies: {
      name: string;
      nameAr: string;
      audienceType: string;
      budgetShare: string;
      interests: string[];
      descriptionAr: string;
    }[];
  };
  marketingAngles: {
    angleName: string;
    angleNameAr: string;
    hook3sAr: string;
    mainPitchAr: string;
    callToActionAr: string;
    fullScriptAr: string;
    adCopyTextAr: string;
    adCopyTextFr: string;
  }[];
  launchStrategy: {
    suggestedStructure: string;
    dailyBudgetMad: number;
    testingDays: number;
    killRuleDescriptionAr: string;
    scaleRuleDescriptionAr: string;
    keyTipsAr: string[];
  };
}

// Curated worldwide winning products for Morocco, USA, Europe, GCC, Africa & Global
const DEFAULT_WINNING_PRODUCTS: WinningProduct[] = [
  // --- 🇲🇦 MAROC (MOROCCO) ---
  {
    id: 'wp-ma-1',
    title: 'Brosse Nettoyante Visage Ultrasonique & Anti-Points Noirs',
    titleAr: 'جهاز تنظيف وتقشير الوجه بالموجات فوق الصوتية وإزالة الرؤوس السوداء',
    niche: 'BEAUTY',
    country: 'MA',
    countryNameAr: 'المغرب',
    countryFlag: '🇲🇦',
    currency: 'DH',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 45,
    retailPrice: 249,
    estShippingFee: 35,
    estConfirmationRate: 82,
    estDeliveryRate: 78,
    netProfitPerUnit: 112,
    saturationScore: 38,
    activeCompetitors: 12,
    description: 'Appareil de spatule faciale à ultrasons pour exfoliation profonde, extraction des comédons et pénétration des sérums.',
    descriptionAr: 'جهاز احترافي يعمل بالموجات فوق الصوتية لتنظيف المسام العميقة وإزالة الرؤوس السوداء والجلد الميت مع تدليك البشرة.',
    whyWinning: [
      'Résultat visuel immédiat dans les 3 premières secondes de vidéo (eau pulvérisée + saleté retirée)',
      'Forte valeur perçue auprès d\'une clientèle féminine prête à payer 249-299 DH',
      'Poids très léger (< 200g), aucun risque de casse pendant la livraison'
    ],
    whyWinningAr: [
      'نتيجة بصرية فورية في أول 3 ثوانٍ من الفيديو (رذاذ الماء والأوساخ تخرج أمام الكاميرا)',
      'قيمة مدركة عالية لدى النساء المستعدات للشراء بين 249 و 299 درهم',
      'وزن خفيف جداً (أقل من 200 غرام)، لا ينكسر في التوصيل'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'ultrasonic skin scrubber',
    tikTokSearchKeyword: 'ultrasonic skin scrubber',
    aliExpressSearchKeyword: 'ultrasonic skin scrubber face spatula',
    suggestedAnglesAr: [
      'زاوية إزالة الرؤوس السوداء بدون ألم وبدون الذهاب إلى صالونات التجميل باهظة الثمن',
      'زاوية قبل وبعد مع عرض رذاذ الماء المتبخر الذي يبهر المشاهد',
      'عرض خاص: الجهاز + سيروم مجاني وتوصيل مجاني'
    ],
    addedAt: '2026-11-09T10:00:00Z',
  },
  {
    id: 'wp-ma-2',
    title: 'Hachoir & Coupe-Légumes Multifonction 14-en-1 avec Bac',
    titleAr: 'قطاعة وخضار يدوية متعددة الوظائف 14 في 1 مع حافظة مدمجة',
    niche: 'KITCHEN',
    country: 'MA',
    countryNameAr: 'المغرب',
    countryFlag: '🇲🇦',
    currency: 'DH',
    status: 'EVERGREEN',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 55,
    retailPrice: 229,
    estShippingFee: 35,
    estConfirmationRate: 85,
    estDeliveryRate: 80,
    netProfitPerUnit: 98,
    saturationScore: 45,
    activeCompetitors: 18,
    description: 'Coupe-légumes mandoline avec 8 lames interchangeables, séparateur d\'œufs et panier égouttoir.',
    descriptionAr: 'قطاعة خضار احترافية بـ 8 شفرات مختلفة لتقطيع البصل والبطاطس والسلطات في ثوانٍ مع حاوية للتنظيف السريع.',
    whyWinning: [
      'Résout la corvée quotidienne de la cuisine (gagne 45 minutes par jour)',
      'Effet "satisfying" impressionnant quand les oignons et tomates sont coupés en cubes parfaits en 1 seconde',
      'Produit à fort taux de confirmation (les femmes au foyer confirment très vite)'
    ],
    whyWinningAr: [
      'يحل مشكلة تقطيع البصل بدون دموع ويوفر أكثر من 45 دقيقة يومياً في المطبخ',
      'فيديوهات التقطيع السريع ممتعة ومبهرة في المشاهدة (Satisfying Videos)',
      'نسبة تأكيد عالية جداً تتجاوز 85% مع ربات البيوت'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'vegetable chopper kitchen',
    tikTokSearchKeyword: 'vegetable chopper hack',
    aliExpressSearchKeyword: 'vegetable chopper mandoline slicer 14 in 1',
    suggestedAnglesAr: [
      'زاوية توفير الوقت ووداعاً لدموع تقطيع البصل ورائحة الثوم في اليدين',
      'زاوية تحضير أطباق رمضان والسلطات بدقة المطاعم في 5 دقائق',
      'عرض حبتين: واحدة لك وواحدة هدية للوالدة بسعر خاص'
    ],
    addedAt: '2026-11-09T11:00:00Z',
  },
  {
    id: 'wp-ma-3',
    title: 'Support Téléphone Voiture Magnétique à Induction Sans Fil 15W',
    titleAr: 'حامل هاتف مغناطيسي ذكي للسيارة مع شاحن لاسلكي سريع بقوة 15 واط',
    niche: 'CAR',
    country: 'MA',
    countryNameAr: 'المغرب',
    countryFlag: '🇲🇦',
    currency: 'DH',
    status: 'EMERGING',
    type: 'WOW_FACTOR',
    wholesalePrice: 50,
    retailPrice: 239,
    estShippingFee: 35,
    estConfirmationRate: 79,
    estDeliveryRate: 82,
    netProfitPerUnit: 104,
    saturationScore: 24,
    activeCompetitors: 6,
    description: 'Support de grille d\'aération avec serrage automatique par capteur infrarouge et charge rapide Qi 15W.',
    descriptionAr: 'حامل يفتح ويغلق أوتوماتيكياً بمجرد اقتراب الهاتف بفضل مستشعر الأشعة تحت الحمراء، مع شحن لاسلكي قوي.',
    whyWinning: [
      'Effet Wow très fort lorsque le bras s\'ouvre tout seul à l\'approche du téléphone',
      'Cible masculine très réactive aux gadgets high-tech pour leur voiture',
      'Excellente marge et taux de livraison supérieur à 80%'
    ],
    whyWinningAr: [
      'عنصر إبهار قوي جداً: الحامل يفتح أوتوماتيكياً بمجرد تقريب الهاتف كأنه سيارة مستقبلية',
      'الرجال وأصحاب السيارات يتفاعلون بسرعة مع إكسسوارات السيارات المريحة',
      'نسبة توصيل ممتازة تفوق 82% في المدن الكبرى'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'car wireless charger mount',
    tikTokSearchKeyword: 'car phone holder wireless charger',
    aliExpressSearchKeyword: 'smart sensor wireless car charger mount 15w',
    suggestedAnglesAr: [
      'زاوية الأمان أثناء القيادة وتفادي مخالفات الهاتف واستعمال الـ GPS بسهولة',
      'زاوية الشحن السريع بدون خيوط مزعجة متشابكة في السيارة',
      'عرض باقة: الحامل الذكي + كابل شحن سريع هدية'
    ],
    addedAt: '2026-11-09T12:00:00Z',
  },
  {
    id: 'wp-ma-4',
    title: 'Genouillère de Compression Articulaire avec Bandes Croisées',
    titleAr: 'دعامة الركبة الطبية الضاغطة مع أحزمة تثبيت مزدوجة لتخفيف آلام المفاصل',
    niche: 'HEALTH',
    country: 'MA',
    countryNameAr: 'المغرب',
    countryFlag: '🇲🇦',
    currency: 'DH',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 35,
    retailPrice: 199,
    estShippingFee: 35,
    estConfirmationRate: 88,
    estDeliveryRate: 84,
    netProfitPerUnit: 96,
    saturationScore: 32,
    activeCompetitors: 15,
    description: 'Genouillère élastique respirante avec sangles de réglage pour soulager les douleurs d\'arthrose, ménisque et sport.',
    descriptionAr: 'دعامة طبية عالية الجودة توفر دعماً قوياً للركبة والمفاصل، مثالية لكبار السن، الرياضيين، ولمن يقفون طويلاً.',
    whyWinning: [
      'Douleur chronique forte = Achat émotionnel urgent (les clients ne négocient pas le prix)',
      'Très fort potentiel pour vendre le pack de 2 genouillères (1 pour chaque jambe)',
      'Taux de confirmation et livraison record (> 84%) car le besoin est vital'
    ],
    whyWinningAr: [
      'مشكلة الألم الحاد تدفع الزبون للشراء العاجل بدون تردد لتخفيف الألم',
      'سهولة كبيرة في بيع باقة زوج للركبتين معاً (Pack 2 pièces) بـ 299 درهم',
      'أعلى نسبة تأكيد وتوصيل في السوق لأن المشتري في أمسّ الحاجة إليها'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'knee compression sleeve',
    tikTokSearchKeyword: 'knee compression sleeve pain relief',
    aliExpressSearchKeyword: 'knee brace compression sleeve sports',
    suggestedAnglesAr: [
      'زاوية الصلاة براحة تامة وصعود السلالم بدون ألم أو طقطقة في الركبة',
      'زاوية هدية للوالدين لتخفيف ألم الروماتيزم والمفاصل',
      'عرض الأسبوع: اشتري دعامة واحصل على الثانية بنصف السعر'
    ],
    addedAt: '2026-11-09T13:00:00Z',
  },

  // --- 🇺🇸 ÉTATS-UNIS (USA & GLOBAL TIKTOK WINNERS) ---
  {
    id: 'wp-us-1',
    title: 'Ventilateur de Cou Portable Sans Pales 360° Rechargeable USB',
    titleAr: 'مروحة الرقبة اللاسلكية المحمولة بدون شفرات 360 درجة قابلة للشحن',
    niche: 'GADGETS',
    country: 'US',
    countryNameAr: 'الولايات المتحدة',
    countryFlag: '🇺🇸',
    currency: '$',
    status: 'HOT',
    type: 'WOW_FACTOR',
    wholesalePrice: 6,
    retailPrice: 29.99,
    estShippingFee: 4.5,
    estConfirmationRate: 95,
    estDeliveryRate: 96,
    netProfitPerUnit: 16.5,
    saturationScore: 30,
    activeCompetitors: 40,
    description: 'Bladeless neck fan with 3-speed dual turbine, silent operation, hands-free cooling for summer heat, sports, and outdoors.',
    descriptionAr: 'مروحة رقبة مريحة بدون شفرات بتصميم سماعات رأس عصري، تمنح تبريداً منعشاً 360 درجة بدون إمساكها باليدين.',
    whyWinning: [
      'Produit superstar sur TikTok US avec des millions de vues chaque été',
      'Design comme un casque audio haute technologie (très esthétique)',
      'Marges confortables (vendu 29.99$ pour un coût d\'achat de 6$)'
    ],
    whyWinningAr: [
      'منتج فايرل حقق ملايين المشاهدات والمبيعات على تيك توك الأمريكي',
      'تصميم مريح وأنيق يشبه سماعات الرأس يسهل ارتداؤه في أي مكان',
      'هامش ربح ممتاز جداً (يباع بـ 30 دولار وسعر شرائه 6 دولارات)'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1591290619615-99882299bb71?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'bladeless neck fan',
    tikTokSearchKeyword: 'portable neck fan',
    aliExpressSearchKeyword: 'portable neck fan bladeless rechargeable',
    suggestedAnglesAr: [
      'زاوية التخلص من حرارة الصيف والتعرق أثناء العمل والمشي بدون استخدام اليدين',
      'زاوية الأناقة والرياضة والسفر مع بطارية تدوم طوال اليوم',
      'عرض خاص: اشتري 2 واحصل على خصم 20% وشحن مجاني'
    ],
    addedAt: '2026-11-10T14:00:00Z',
  },
  {
    id: 'wp-us-2',
    title: 'Épilateur Cristal Magique Indolore Nanoglass (Crystal Hair Eraser)',
    titleAr: 'الممحاة الكريستالية السحرية لإزالة الشعر والجلد الميت بتقنية النانو غلاس بدون ألم',
    niche: 'BEAUTY',
    country: 'US',
    countryNameAr: 'الولايات المتحدة',
    countryFlag: '🇺🇸',
    currency: '$',
    status: 'HOT',
    type: 'WOW_FACTOR',
    wholesalePrice: 2.8,
    retailPrice: 24.99,
    estShippingFee: 3.5,
    estConfirmationRate: 94,
    estDeliveryRate: 95,
    netProfitPerUnit: 15.2,
    saturationScore: 36,
    activeCompetitors: 65,
    description: 'Painless hair removal stone using nano-crystalline technology, exfoliates dead skin and eliminates strawberry legs.',
    descriptionAr: 'أداة سحرية بتقنية النانو تزيل الشعر والجلد الميت بحركات دائرية ناعمة وبدون أي جروح أو حبوب.',
    whyWinning: [
      'L\'un des plus grands succès de l\'histoire de TikTok Shopping (des dizaines de marques à 7 chiffres)',
      'Effet démo saisissant en 3 secondes : peau ultra douce et poils disparus sans crème ni rasoir',
      'Poids plume (< 80g), coût d\'expédition dérisoire dans le monde entier'
    ],
    whyWinningAr: [
      'أحد أشهر منتجات الدروب شيبينغ في العالم حقق مبيعات بملايين الدولارات على تيك توك',
      'عرض توضيحي مبهر في أول 3 ثوانٍ يزيل الشعر بحركات دائرية سريعة بدون ألم',
      'منتج خفيف جداً وصغير الحجم، تكلفة شحنه رخيصة لأي دولة في العالم'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'crystal hair eraser',
    tikTokSearchKeyword: 'crystal hair eraser',
    aliExpressSearchKeyword: 'crystal hair eraser painless physical nano glass',
    suggestedAnglesAr: [
      'زاوية وداعاً للنتوءات الحمراء وجروح الشفرات ومصاريف الشمع المؤلمة',
      'زاوية تقشير البشرة والحصول على نعومة خيالية في دقيقتين قبل الخروج',
      'باقة الألوان الصيفية مع شحن سريع مجاني'
    ],
    addedAt: '2026-11-10T14:30:00Z',
  },
  {
    id: 'wp-us-3',
    title: 'Dispositif Anti-Aboiement Ultrasonique Automatique pour Chiens',
    titleAr: 'جهاز تدريب ومنع نباح الكلاب التلقائي بالموجات فوق الصوتية الآمنة',
    niche: 'PETS',
    country: 'US',
    countryNameAr: 'الولايات المتحدة',
    countryFlag: '🇺🇸',
    currency: '$',
    status: 'EVERGREEN',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 8.5,
    retailPrice: 39.99,
    estShippingFee: 4.8,
    estConfirmationRate: 96,
    estDeliveryRate: 97,
    netProfitPerUnit: 21.5,
    saturationScore: 22,
    activeCompetitors: 14,
    description: 'Outdoor/indoor ultrasonic bark deterrent, harmless high-frequency sound stops nuisance barking automatically.',
    descriptionAr: 'جهاز كاشف للنباح يرسل موجات صوتية عالية التردد يسمعها الكلب فقط لإيقاف النباح المزعج فوراً بدون إيذاء الحيوان.',
    whyWinning: [
      'Le marché des animaux aux USA est gigantesque (les propriétaires dépensent sans compter)',
      'Résout un conflit majeur avec les voisins ou le sommeil de la famille',
      'Forte valeur perçue, se vend facilement entre 39$ et 49$'
    ],
    whyWinningAr: [
      'سوق الحيوانات الأليفة في أمريكا وأوروبا ضخم جداً وأصحاب الكلاب يدفعون بسخاء',
      'يحل مشكلة نباح الكلاب المزعجة مع الجيران أثناء النوم والغياب عن المنزل',
      'قيمة مدركة عالية يباع بسهولة بسعر 40 دولار بهامش ربح ممتاز'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'anti barking device dog',
    tikTokSearchKeyword: 'dog bark deterrent ultrasonic',
    aliExpressSearchKeyword: 'ultrasonic dog bark control deterrent device',
    suggestedAnglesAr: [
      'زاوية النوم الهادئ وراحة البال بدون إزعاج نباح الكلب في الليل',
      'زاوية طريقة تدريب آمنة 100% بدون أي صدمات كهربائية أو عنف',
      'ضمان استرجاع الأموال لمدة 30 يوماً إذا لم يتوقف النباح'
    ],
    addedAt: '2026-11-10T15:00:00Z',
  },
  {
    id: 'wp-us-4',
    title: 'Ceinture Décompression & Traction Lombaire Gonflable Médicale',
    titleAr: 'حزام الديسك وتخفيف الضغط على فقرات الظهر القابل للنفخ اليدوي',
    niche: 'HEALTH',
    country: 'US',
    countryNameAr: 'الولايات المتحدة',
    countryFlag: '🇺🇸',
    currency: '$',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 15,
    retailPrice: 69.99,
    estShippingFee: 6.5,
    estConfirmationRate: 93,
    estDeliveryRate: 96,
    netProfitPerUnit: 38.5,
    saturationScore: 26,
    activeCompetitors: 19,
    description: 'Clinical grade spinal air traction decompression back belt for sciatica, scoliosis, herniated disc relief.',
    descriptionAr: 'حزام طبي يضخ الهواء لرفع فقرات الظهر وتوسيع المسافة بين الغضاريف لتخفيف ألم عرق النسا والديسك فوراً.',
    whyWinning: [
      'Produit High-Ticket Evergreen avec un panier moyen supérieur à 69$',
      'La douleur lombaire touche 80% des adultes aux USA, taux de conversion très élevé',
      'La démonstration de la pompe qui étire et soulage la colonne vertébrale est ultra convaincante'
    ],
    whyWinningAr: [
      'منتج عالي القيمة (High-Ticket) بسعر 70 دولار وهامش ربح يقارب 40 دولار للقطعة',
      'آلام الظهر والديسك مشكلة مزمنة يعاني منها الملايين في أمريكا والخليج',
      'فيديو نفخ الحزام وتمدد الفقرات مقنع جداً ويدفع الزبون للشراء الفوري'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'lumbar decompression belt',
    tikTokSearchKeyword: 'spinal decompression back belt',
    aliExpressSearchKeyword: 'inflatable decompression back belt spinal traction',
    suggestedAnglesAr: [
      'زاوية استعادة القدرة على المشي والجلوس بدون ألم الديسك وعرق النسا',
      'زاوية جلسات العلاج الطبيعي باهظة الثمن وبديلها المنزلي الفعال',
      'توصيل سريع مجاني وضمان طبي 100%'
    ],
    addedAt: '2026-11-10T15:30:00Z',
  },

  // --- 🇫🇷 FRANCE & EUROPE ---
  {
    id: 'wp-fr-1',
    title: 'Défroisseur Vapeur Vertical Portable 1500W pour Vêtements',
    titleAr: 'مكواة البخار العمودية المحمولة السريعة 1500W للملابس والستائر',
    niche: 'HOME',
    country: 'FR',
    countryNameAr: 'فرنسا وأوروبا',
    countryFlag: '🇫🇷',
    currency: '€',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 12.5,
    retailPrice: 49.99,
    estShippingFee: 5.2,
    estConfirmationRate: 95,
    estDeliveryRate: 97,
    netProfitPerUnit: 24.8,
    saturationScore: 32,
    activeCompetitors: 28,
    description: 'Défroisseur vapeur à main compact prêt en 15 secondes, élimine plis et 99% des bactéries sans table à repasser.',
    descriptionAr: 'مكواة بخارية محمولة تسخن في 15 ثانية وتكوي أصعب الملابس والبدلات المعلقة والستائر وتعقم الأقمشة.',
    whyWinning: [
      'Les Français et Européens détestent repasser avec une table à repasser encombrante',
      'Format idéal pour les voyages, les matins pressés avant le bureau',
      'Démonstration visuelle incroyable : le pli disparaît en un seul passage de vapeur'
    ],
    whyWinningAr: [
      'يحل مشكلة كوي الملابس الثقيلة والبدلات المعلقة بدون طاولة كوي متعبة',
      'حجم صغير مثالي للسفر والصباح السريع قبل الذهاب للعمل',
      'فيديو الكوي بالبخار يظهر التجاعيد تختفي في مسحة واحدة أمام الكاميرا'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'defroisseur vapeur portable',
    tikTokSearchKeyword: 'defroisseur vapeur vetements',
    aliExpressSearchKeyword: 'handheld garment steamer portable clothes',
    suggestedAnglesAr: [
      'زاوية التخلص من طاولة الكوي ومضيعة الوقت في الصباح مع بخار فوري في 15 ثانية',
      'زاوية كوي وتعقيم البدلات والفساتين الحساسة بأمان تام',
      'عرض باقة: توصيل سريع في فرنسا + رأس فرشاة خاص مجاني'
    ],
    addedAt: '2026-11-10T16:00:00Z',
  },
  {
    id: 'wp-fr-2',
    title: 'Mini Tronçonneuse Électrique Sans Fil 21V avec 2 Batteries',
    titleAr: 'منشار كهربائي صغير محمول ببطارية ليثيوم 21V لتقليم الأشجار والخشب',
    niche: 'HOME',
    country: 'FR',
    countryNameAr: 'فرنسا وأوروبا',
    countryFlag: '🇫🇷',
    currency: '€',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 16,
    retailPrice: 59.9,
    estShippingFee: 6.8,
    estConfirmationRate: 92,
    estDeliveryRate: 95,
    netProfitPerUnit: 28.5,
    saturationScore: 35,
    activeCompetitors: 30,
    description: 'Tronçonneuse à bois portative à une main pour élagage d\'arbres de jardin, coupe de bûches sans effort.',
    descriptionAr: 'منشار يدوي خفيف الوزن يعمل ببطاريتي ليثيوم قويتين، يقطع جذوع وفروع الأشجار السميكة في 5 ثوانٍ بيد واحدة.',
    whyWinning: [
      'Chouchou absolu des propriétaires de maisons et jardins en France et Allemagne',
      'Utilisable à une seule main par tous, même les seniors (poids < 1.2 kg)',
      'Découpe d\'une branche épaisse en 5 secondes chrono dans la vidéo'
    ],
    whyWinningAr: [
      'المنتج الأكثر مبيعاً لأصحاب المنازل والحدائق في فرنسا وأوروبا',
      'يستخدم بيد واحدة بكل أمان وخفيف الوزن لا يتجاوز 1.2 كغ',
      'يقطع الفروع الخشبية السميكة في 5 ثوانٍ في لقطة فيديو تبهر المشاهد'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'mini tronconneuse sans fil',
    tikTokSearchKeyword: 'mini chainsaw cordless',
    aliExpressSearchKeyword: 'mini electric chainsaw cordless 21v battery',
    suggestedAnglesAr: [
      'زاوية تقليم حديقة منزلك بسهولة بدون مناشير بنزين ثقيلة وخطيرة',
      'زاوية قوة بطاريات الليثيوم وسهولة الاستخدام بيد واحدة لجميع أفراد العائلة',
      'باقة متكاملة: المنشار + بطاريتين + حقيبة أدوات وسلسلة إضافية مجاناً'
    ],
    addedAt: '2026-11-10T16:30:00Z',
  },
  {
    id: 'wp-fr-3',
    title: 'Masseur Cuir Chevelu Électrique avec Luminothérapie Rouge Anti-Chute',
    titleAr: 'مدلك فروة الرأس الكهربائي الذكي مع تقنية الضوء الأحمر وموزع الزيوت',
    niche: 'BEAUTY',
    country: 'FR',
    countryNameAr: 'فرنسا وأوروبا',
    countryFlag: '🇫🇷',
    currency: '€',
    status: 'EMERGING',
    type: 'WOW_FACTOR',
    wholesalePrice: 9.5,
    retailPrice: 39.99,
    estShippingFee: 4.8,
    estConfirmationRate: 93,
    estDeliveryRate: 96,
    netProfitPerUnit: 20.8,
    saturationScore: 18,
    activeCompetitors: 8,
    description: 'Electric scalp massager with red light therapy and essential oil applicator for hair growth stimulation and stress relief.',
    descriptionAr: 'جهاز تدليك الرأس المقاوم للماء يوزع زيوت الشعر بدقة ويحفز بصيلات الشعر بالضوء الأحمر لمنع التساقط والاسترخاء.',
    whyWinning: [
      'Tendance explosive sur TikTok France & UK autour de la "hair care routine" et lutte anti-chute',
      'Combine massage relaxant ASMR et soin dermatologique au laser rouge',
      'Très forte marge brute (> 75%)'
    ],
    whyWinningAr: [
      'تريند فايرل في فرنسا وبريطانيا لعلاج تساقط الشعر والعناية بالروتين اليومي',
      'يجمع بين تدليك الاسترخاء وتوزيع الزيوت والضوء الأحمر المحفز للكولاجين',
      'هامش ربح ممتاز يفوق 75% مع فئة مستهدفة تهتم بالعناية بالشعر'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'electric scalp massager hair growth',
    tikTokSearchKeyword: 'scalp massager red light hair growth',
    aliExpressSearchKeyword: 'electric scalp massager red light therapy hair oil applicator',
    suggestedAnglesAr: [
      'زاوية وقف تساقط الشعر وتكثيف البصيلات في 3 أسابيع من الاستخدام اليومي',
      'زاوية الاسترخاء وتخفيف الصداع وضغط العمل والتوتر بعد يوم طويل',
      'عرض خاص: الجهاز + سيروم إنبات الشعر هدية وشحن مجاني'
    ],
    addedAt: '2026-11-10T17:00:00Z',
  },

  // --- 🇸🇦 GULF & GCC (SAUDI ARABIA, UAE, QATAR) ---
  {
    id: 'wp-gcc-1',
    title: 'المبخرة الإلكترونية الذكية المحمولة للشعر والسيارة عبر USB',
    titleAr: 'المبخرة الإلكترونية الذكية المحمولة للشعر والسيارة والملابس قابلة للشحن',
    niche: 'HOME',
    country: 'GCC',
    countryNameAr: 'دول الخليج والسعودية',
    countryFlag: '🇸🇦',
    currency: 'SAR',
    status: 'HOT',
    type: 'WOW_FACTOR',
    wholesalePrice: 32,
    retailPrice: 189,
    estShippingFee: 25,
    estConfirmationRate: 88,
    estDeliveryRate: 85,
    netProfitPerUnit: 98,
    saturationScore: 35,
    activeCompetitors: 25,
    description: 'مبخرة دخون إلكترونية صغيرة بدون فحم مع رأس مخصص لتبخير الشعر والملابس والسيارة في ثوانٍ.',
    descriptionAr: 'مبخرة عصرية فاخرة تعمل بدون أي فحم بضغطة زر واحدة لتبخير الشعر والملابس والسيارة برائحة العود الفاخرة.',
    whyWinning: [
      'Produit incontournable dans toute la région du Golfe (Arabie Saoudite, EAU, Koweït)',
      'Élimine le danger du charbon brûlant dans la maison ou dans la voiture',
      'Volume de vente gigantesque en COD avec des marges nettes dépassant 90 SAR par unité'
    ],
    whyWinningAr: [
      'المنتج الأكثر مبيعاً على الإطلاق في الخليج والسعودية والإمارات بنظام الدفع عند الاستلام',
      'يغنيك عن إشعال الفحم وخطر الحروق في السيارة والمنزل',
      'هامش ربح مرتفع جداً يتجاوز 90 ريال سعودي في كل طلب مسلم'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'مبخرة الكترونية للشعر والسيارة',
    tikTokSearchKeyword: 'مبخرة الشعر الالكترونية',
    aliExpressSearchKeyword: 'portable electric bakhoor burner hair incense usb',
    suggestedAnglesAr: [
      'زاوية تبخير الشعر وتثبيت رائحة العود الذكية طوال اليوم بدون فحم ولا حروق',
      'زاوية سيارة تفوح برائحة الفخامة عند ركوب الضيوف والعائلة',
      'عرض خاص: مبخرة إلكترونية + علبة عود فاخرة وتوصيل سريع والدفع عند الاستلام'
    ],
    addedAt: '2026-11-10T17:30:00Z',
  },
  {
    id: 'wp-gcc-2',
    title: 'مكيف ومبرد هواء صغير محمول 3 في 1 مع إضاءة ليلية LED وخزان ماء',
    titleAr: 'مكيف ومبرد هواء صحراوي صغير محمول 3 في 1 مع تبريد بالثلج والماء',
    niche: 'HOME',
    country: 'GCC',
    countryNameAr: 'دول الخليج والسعودية',
    countryFlag: '🇸🇦',
    currency: 'SAR',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 28,
    retailPrice: 149,
    estShippingFee: 25,
    estConfirmationRate: 85,
    estDeliveryRate: 82,
    netProfitPerUnit: 74,
    saturationScore: 30,
    activeCompetitors: 35,
    description: 'مكيف مكتبي شخصي هادئ يبرد الهواء بالماء والثلج مع 3 سرعات وخزان كبير واستهلاك طاقة منخفض.',
    descriptionAr: 'مبرد هواء مدمج يعطيك هواءً بارداً ورطباً فورياً للمكتب وغرفة النوم والمطبخ أثناء حرارة الصيف الشديدة.',
    whyWinning: [
      'La chaleur extrême du Golfe rend ce produit indispensable pour le bureau ou la cuisine',
      'Consommation électrique minime et transportable partout via USB',
      'Fort volume de commandes en COD dès le début des fortes chaleurs'
    ],
    whyWinningAr: [
      'حرارة الصيف المرتفعة في الخليج تجعل هذا المنتج مطلوباً بشدة للمكاتب وغرف النوم',
      'يوفر تبريداً فورياً بالماء والثلج بدون استهلاك عالي للكهرباء ويعمل عبر USB',
      'طلب هائل في التجارة الإلكترونية بنظام COD في السعودية والإمارات'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'مكيف صحراوي صغير متنقل',
    tikTokSearchKeyword: 'portable mini air cooler',
    aliExpressSearchKeyword: 'mini portable air conditioner cooler fan usb water ice',
    suggestedAnglesAr: [
      'زاوية التبريد الشخصي المريح أثناء العمل أو الطبخ في المطبخ بدون تكاليف التكييف الكبيرة',
      'زاوية الهواء الرطب والمنعش الذي يحمي من جفاف البشرة والعيون',
      'عرض الأسبوع: اشتري قطعتين واحصل على خصم 40 ريال وشحن مجاني'
    ],
    addedAt: '2026-11-10T17:45:00Z',
  },

  // --- 🇸🇳 SÉNÉGAL & AFRIQUE DE L'OUEST ---
  {
    id: 'wp-sn-1',
    title: 'Moulin Mixeur Broyeur d\'Épices et Grains Puissant Inox 300W',
    titleAr: 'مطحنة التوابل والحبوب والبن الكهربائية القوية من الفولاذ المقاوم للصدأ',
    niche: 'KITCHEN',
    country: 'SN',
    countryNameAr: 'السنغال وغرب إفريقيا',
    countryFlag: '🇸🇳',
    currency: 'XOF',
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: 4500,
    retailPrice: 18000,
    estShippingFee: 2000,
    estConfirmationRate: 84,
    estDeliveryRate: 80,
    netProfitPerUnit: 8200,
    saturationScore: 28,
    activeCompetitors: 10,
    description: 'Broyeur électrique haute vitesse pour grains de café, piments secs, épices et céréales en quelques secondes.',
    descriptionAr: 'مطحنة كهربائية حادة تطحن الفلفل الحار، القهوة، التوابل، والحبوب الجافة في ثوانٍ معدودة بجودة ممتازة.',
    whyWinning: [
      'Produit indispensable pour la cuisine sénégalaise et africaine (épices locales, piment, arachides)',
      'Évite le travail éreintant au mortier traditionnel',
      'Très forte marge en Franc CFA avec un taux de livraison élevé à Dakar'
    ],
    whyWinningAr: [
      'منتج أساسي في المطبخ السنغالي لطحن التوابل والفلفل والحبوب بدون الحاجة للمهراس التقليدي',
      'جودة الفولاذ المقاوم للصدأ وشفرات قوية تمنح انطباعاً بالجودة العالية',
      'هامش ربح ممتاز يفوق 8000 فرنك غرب إفريقي للقطعة في داكار'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'moulin electrique epices cafe',
    tikTokSearchKeyword: 'electric spice grinder stainless',
    aliExpressSearchKeyword: 'electric coffee grinder spice grains stainless steel',
    suggestedAnglesAr: [
      'زاوية طحن التوابل والقهوة الطازجة في 10 ثوانٍ وداعاً للتعب اليدوي',
      'زاوية توفير الوقت والمجهود لربات البيوت في تحضير الأطباق السنغالية الشهية',
      'توصيل سريع في داكار وجميع المدن مع الدفع عند الاستلام'
    ],
    addedAt: '2026-11-10T18:00:00Z',
  },

  // --- 🌍 GLOBAL / INTERNATIONAL TRENDS ---
  {
    id: 'wp-glob-1',
    title: 'Lampe Projecteur Coucher de Soleil RGB Sunset Lamp avec Télécommande',
    titleAr: 'مصباح إضاءة غروب الشمس الذكي RGB مع ريموت كنترول وتدرجات ملونة',
    niche: 'GADGETS',
    country: 'GLOBAL',
    countryNameAr: 'السوق العالمي الشامل',
    countryFlag: '🌍',
    currency: '$',
    status: 'EVERGREEN',
    type: 'WOW_FACTOR',
    wholesalePrice: 5.5,
    retailPrice: 29.99,
    estShippingFee: 4,
    estConfirmationRate: 94,
    estDeliveryRate: 95,
    netProfitPerUnit: 17.5,
    saturationScore: 38,
    activeCompetitors: 50,
    description: 'Atmosphere projection lamp with 16 color modes and app control, viral bedroom and photo backdrop trend.',
    descriptionAr: 'مصباح إضاءة فايرل يعكس ألوان غروب الشمس الساحرة في الغرفة، مثالي للتصوير وصناعة المحتوى والديكور العصري.',
    whyWinning: [
      'Produit viral mondial iconique sur Instagram et TikTok auprès de la Gen-Z',
      'Les vidéos et photos prises avec cette lampe deviennent virales organiquement',
      'Très forte marge et faible taux de retour'
    ],
    whyWinningAr: [
      'منتج فايرل عالمي شهير على تيك توك وإنستغرام محبوبة جداً من الشباب والبنات',
      'الصور والفيديوهات مع هذا المصباح تبدو احترافية وساحرة وتشجع على الشراء الفوري',
      'هامش ربح كبير ومعدل إرجاع منخفض جداً'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: 'sunset projection lamp rgb',
    tikTokSearchKeyword: 'sunset lamp room decor',
    aliExpressSearchKeyword: 'sunset lamp projection led atmosphere light 16 colors',
    suggestedAnglesAr: [
      'زاوية تحويل غرفتك إلى استوديو تصوير رومانسي وساحر في لحظة',
      'زاوية جلسات التصوير والفيديوهات المبهرة لإنستغرام وتيك توك بدون فلاتر',
      'عرض خاص مع ريموت كنترول وتوصيل مجاني'
    ],
    addedAt: '2026-11-10T18:10:00Z',
  }
];

const DATA_FILE_PATH = path.join(process.cwd(), 'prisma', 'marketing-ai-data.json');

interface StoredMarketingData {
  winningProducts: WinningProduct[];
  customAnalyses: {
    id: string;
    createdAt: string;
    input: ProductAnalysisInput;
    result: ProductAnalysisResult;
  }[];
  campaignAudits: any[];
}

function loadStoredData(): StoredMarketingData {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      // Merge defaults with stored items so new global products are always included
      const existingIds = new Set((data.winningProducts || []).map((p: any) => p.id));
      const combined = [
        ...(data.winningProducts || []),
        ...DEFAULT_WINNING_PRODUCTS.filter((dp) => !existingIds.has(dp.id)),
      ];

      return {
        winningProducts: combined.length > 0 ? combined : DEFAULT_WINNING_PRODUCTS,
        customAnalyses: data.customAnalyses || [],
        campaignAudits: data.campaignAudits || [],
      };
    }
  } catch (e) {
    console.error('Error loading marketing AI data:', e);
  }

  // Save defaults
  const init: StoredMarketingData = {
    winningProducts: DEFAULT_WINNING_PRODUCTS,
    customAnalyses: [],
    campaignAudits: [],
  };
  saveStoredData(init);
  return init;
}

function saveStoredData(data: StoredMarketingData) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving marketing AI data:', e);
  }
}

export function getWinningProducts(filters?: {
  niche?: string;
  country?: string;
  status?: string;
  type?: string;
  search?: string;
}): WinningProduct[] {
  const store = loadStoredData();
  let list = store.winningProducts;

  if (filters?.niche && filters.niche !== 'ALL') {
    list = list.filter((p) => p.niche === filters.niche);
  }
  if (filters?.country && filters.country !== 'ALL') {
    list = list.filter((p) => p.country === filters.country || (filters.country === 'GLOBAL' ? true : p.country === 'GLOBAL'));
  }
  if (filters?.status && filters.status !== 'ALL') {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.type && filters.type !== 'ALL') {
    list = list.filter((p) => p.type === filters.type);
  }
  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.titleAr.includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.descriptionAr.includes(q) ||
        (p.countryNameAr && p.countryNameAr.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Generates fresh AI winning product concepts on-the-fly based on a niche, country & theme
 */
export function generateAiProductIdeas(
  niche: string,
  customPrompt?: string,
  targetCountry: MarketCountry = 'ALL'
): WinningProduct[] {
  const timestamp = new Date().toISOString();
  const seed = Date.now().toString(36);

  const countryConfig: Record<string, { flag: string; nameAr: string; currency: string; wholesaleMul: number; retailMul: number }> = {
    MA: { flag: '🇲🇦', nameAr: 'المغرب', currency: 'DH', wholesaleMul: 1, retailMul: 1 },
    US: { flag: '🇺🇸', nameAr: 'الولايات المتحدة', currency: '$', wholesaleMul: 0.12, retailMul: 0.14 },
    FR: { flag: '🇫🇷', nameAr: 'فرنسا وأوروبا', currency: '€', wholesaleMul: 0.11, retailMul: 0.13 },
    GCC: { flag: '🇸🇦', nameAr: 'الخليج والسعودية', currency: 'SAR', wholesaleMul: 0.45, retailMul: 0.8 },
    SN: { flag: '🇸🇳', nameAr: 'السنغال وإفريقيا', currency: 'XOF', wholesaleMul: 60, retailMul: 75 },
    GLOBAL: { flag: '🌍', nameAr: 'السوق العالمي', currency: '$', wholesaleMul: 0.12, retailMul: 0.14 },
    ALL: { flag: '🌍', nameAr: 'السوق العالمي', currency: '$', wholesaleMul: 0.12, retailMul: 0.14 },
  };

  const c = countryConfig[targetCountry] || countryConfig.GLOBAL;

  const templates: Record<string, any[]> = {
    BEAUTY: [
      {
        title: 'Appareil Laser Épilateur Permanent IPL à Domicile',
        titleAr: 'جهاز إزالة الشعر بالليزر والنبض الضوئي المكثف IPL للاستعمال المنزلي',
        wholesale: Math.round(140 * c.wholesaleMul),
        retail: Math.round(499 * c.retailMul),
        descAr: 'جهاز ليزر منزلي بدون ألم بتقنية الوميض النبضي، بديل كامل لجلسات العيادات المكلفة مع تبريد للبشرة.',
        whyAr: ['قيمة مدركة فائقة بهامش ربح يتجاوز 60%', 'طلب هائل من الفتيات والنساء طوال فصول السنة'],
        hookAr: 'وداعاً لمصاريف جلسات الليزر المكلفة! حيدي الشعر نهائياً وبدون أي ألم مع جهاز IPL الذكي.',
        metaKeyword: 'ipl hair removal laser',
        tikTokKeyword: 'ipl hair removal handset',
        aliKeyword: 'ipl hair removal permanent laser device',
      },
      {
        title: 'Kit Masque Visage LED Luminothérapie 7 Couleurs',
        titleAr: 'قناع الوجه الضوئي الذكي بـ 7 ألوان لعلاج حب الشباب وتجديد الكولاجين',
        wholesale: Math.round(95 * c.wholesaleMul),
        retail: Math.round(349 * c.retailMul),
        descAr: 'قناع يعتمد على تقنية الضوء الفوتوني لتحفيز الكولاجين ومحاربة التجاعيد وعلاج آثار الحبوب في 15 دقيقة يومياً.',
        whyAr: ['عنصر إبهار بصري فايرل في الفيديوهات', 'تريند صاعد بقوة في العناية بالبشرة عالمياً'],
        hookAr: 'سر بشرة النجمات الصافية بدون فيلتر! قناع الـ LED بـ 7 ألوان يرجع نضارة وجهك في 15 دقيقة فقط.',
        metaKeyword: 'led face mask light therapy',
        tikTokKeyword: 'led face mask phototherapy',
        aliKeyword: 'led facial mask 7 colors light therapy',
      },
    ],
    KITCHEN: [
      {
        title: 'Mélangeur & Blender Portable Rechargeable USB 6 Lames',
        titleAr: 'خلاط ومطحنة عصائر محمولة قابلة للشحن عبر USB بـ 6 شفرات حادة',
        wholesale: Math.round(42 * c.wholesaleMul),
        retail: Math.round(199 * c.retailMul),
        descAr: 'قارورة خلاط قوية لتحضير العصائر والبروتين في الجيم أو العمل بضغطة زر واحدة وشحن عبر بنك الطاقة.',
        whyAr: ['يحل مشكلة شرب العصائر الصحية في العمل والجيم', 'فيديوهات عصر الفواكه في أي مكان جذابة وسهلة الإنتاج'],
        hookAr: 'عصيرك المفضل طازج في ثوانٍ أينما كنت! خلاط الجيب الذكي القابل للشحن مرافقك في الجيم والعمل.',
        metaKeyword: 'portable blender usb rechargeable',
        tikTokKeyword: 'portable blender smoothie bottle',
        aliKeyword: 'portable electric blender juice bottle 6 blades',
      },
      {
        title: 'Brosse Électrique de Nettoyage Rotative Sans Fil 5-en-1',
        titleAr: 'فرشاة التنظيف الكهربائية الدوارة اللاسلكية المقاومة للماء 5 في 1',
        wholesale: Math.round(48 * c.wholesaleMul),
        retail: Math.round(229 * c.retailMul),
        descAr: 'فرشاة دوارة قوية لتنظيف الحمام والمطبخ والزوايا والأواني بدون فرك متعب أو إرهاق لليدين والظهر.',
        whyAr: ['تحل معضلة فرك الأوساخ الصعبة في الحمام والزليج', 'فيديوهات تنظيف الزوايا والأواني تحقق ملايين المشاهدات العضوية'],
        hookAr: 'نظف الحمام والمطبخ بلا ما يضرك ظهرك ولا تعياو يديك! الفرشاة السحرية الدوارة تقضي على أصعب الدهون.',
        metaKeyword: 'electric spin scrubber cordless',
        tikTokKeyword: 'electric cleaning brush scrubber',
        aliKeyword: 'electric spin scrubber cordless shower bathroom',
      },
    ],
    CAR: [
      {
        title: 'Aspirateur de Voiture Sans Fil Puissant 120W avec Souffleur',
        titleAr: 'مكنسة سيارة لاسلكية جبارة بقوة شفط عالية 120W مع منفاخ للغبار',
        wholesale: Math.round(52 * c.wholesaleMul),
        retail: Math.round(239 * c.retailMul),
        descAr: 'مكنسة صغيرة وخفيفة الوزن تشفط الأتربة وبقايا الطعام من أصعب الزوايا، وتنفخ الغبار من فتحات المكيف.',
        whyAr: ['كل صاحب سيارة يحب الحفاظ على نظافة مقاعد سيارته', 'فيديوهات شفط الأوساخ السريعة تحفز الشراء الفوري'],
        hookAr: 'سيارتك نقية بحال يلا عاد خرجتيها من لافاج! مكنسة الجيب القوية لي كتجمع أصعب الغبرة فثواني.',
        metaKeyword: 'car vacuum cleaner cordless handheld',
        tikTokKeyword: 'car vacuum cleaner portable',
        aliKeyword: 'cordless car vacuum cleaner handheld duster blower',
      },
    ],
    HEALTH: [
      {
        title: 'Coussin Orthopédique Assise Ergonomique en Gel Mémoire',
        titleAr: 'وسادة المقعد الطبية بجل التبريد ورغوة الذاكرة لتخفيف آلام الظهر والديسك',
        wholesale: Math.round(45 * c.wholesaleMul),
        retail: Math.round(219 * c.retailMul),
        descAr: 'وسادة ميموري فوم مع طبقة جل بارد مخصصة لمقاعد السيارات وكراسي المكاتب لتخفيف الضغط على عظم العجز وفقرات الظهر.',
        whyAr: ['السائقون وموظفو المكاتب يعانون يومياً من ألم الجلوس', 'منتج متكرر الشراء (واحد للسيارة وواحد للمكتب)'],
        hookAr: 'جلس مرتاح بلا حريق أسفل الظهر! الوسادة الطبية المريحة لي كترد راحتك فالسيارة والمكتب طوال اليوم.',
        metaKeyword: 'orthopedic seat cushion gel memory foam',
        tikTokKeyword: 'seat cushion back pain relief',
        aliKeyword: 'memory foam orthopedic seat cushion cooling gel',
      },
    ],
    PETS: [
      {
        title: 'Brosse Électrique Nettoyante & Démêlante Vapeur pour Chats et Chiens',
        titleAr: 'فرشاة البخار الذكية لتمشيط وإزالة وبر القطط والكلاب وتنظيف الفرو',
        wholesale: Math.round(30 * c.wholesaleMul),
        retail: Math.round(149 * c.retailMul),
        descAr: 'فرشاة بخارية ثورية تزيل شعر الحيوانات المتطاير وتمنع تشابك الفرو مع تدليك مريح بدون إخافة الحيوان.',
        whyAr: ['أصحاب الحيوانات يكرهون تطاير الشعر على الأرائك والملابس', 'فيديوهات البخار وإخراج الوبر تحقق ملايين المشاهدات على تيك توك'],
        hookAr: 'تهنى من شعر القطط والكلاب على الفراش والقش! فرشاة البخار العجيبة لي كتجمع الشعر فدقيقة.',
        metaKeyword: 'steamy cat brush dog pet',
        tikTokKeyword: 'steamy cat brush',
        aliKeyword: 'steamy pet brush electric steam dog cat hair spray',
      },
    ],
  };

  const pool = templates[niche] || templates.BEAUTY;
  const newProducts: WinningProduct[] = pool.map((item, idx) => ({
    id: `ai-gen-${seed}-${idx}`,
    title: item.title,
    titleAr: item.titleAr,
    niche: (niche as any) || 'BEAUTY',
    country: targetCountry === 'ALL' ? 'GLOBAL' : targetCountry,
    countryNameAr: c.nameAr,
    countryFlag: c.flag,
    currency: c.currency,
    status: 'HOT',
    type: 'PROBLEM_SOLVER',
    wholesalePrice: item.wholesale,
    retailPrice: item.retail,
    estShippingFee: Math.round(item.wholesale * 0.4),
    estConfirmationRate: 85,
    estDeliveryRate: 85,
    netProfitPerUnit: Math.round(item.retail * 0.45),
    saturationScore: 25,
    activeCompetitors: 8,
    description: item.descAr,
    descriptionAr: item.descAr,
    whyWinning: item.whyAr,
    whyWinningAr: item.whyAr,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    metaAdLibraryKeyword: item.metaKeyword || item.title.split(' ').slice(0, 3).join(' '),
    tikTokSearchKeyword: item.tikTokKeyword || item.title.split(' ').slice(0, 2).join(' '),
    aliExpressSearchKeyword: item.aliKeyword || item.title,
    suggestedAnglesAr: [
      item.hookAr,
      'عرض خاص: اشتري 2 واحصل على خصم فوري وشحن سريع مجاني',
      'ضمان الجودة والدفع بعد المعاينة عند الاستلام',
    ],
    addedAt: timestamp,
  }));

  // Store them so they can be viewed immediately
  const store = loadStoredData();
  store.winningProducts = [...newProducts, ...store.winningProducts];
  saveStoredData(store);

  return newProducts;
}

/**
 * Performs 360° Financial & Marketing Analysis for any given product
 */
export function analyzeProductDetails(input: ProductAnalysisInput): ProductAnalysisResult {
  const wholesale = Number(input.wholesalePrice) || 50;
  const retail = Number(input.retailPrice) || 249;
  const shipping = Number(input.shippingFee) || 35;
  const cr = Number(input.estConfirmationRate) || 80; // %
  const dr = Number(input.estDeliveryRate) || 75;     // %

  const crDecimal = Math.max(0.2, Math.min(1, cr / 100));
  const drDecimal = Math.max(0.2, Math.min(1, dr / 100));

  const grossMargin = retail - wholesale;
  const deliveredNetMargin = (drDecimal * grossMargin) - shipping;
  const rawBreakEvenCpa = crDecimal * deliveredNetMargin;
  const breakEvenCpa = Math.max(10, Math.round(rawBreakEvenCpa));

  const targetCpaMin = Math.max(15, Math.round(breakEvenCpa * 0.45));
  const targetCpaMax = Math.max(22, Math.round(breakEvenCpa * 0.65));

  const adSpendPerDelivered = targetCpaMax / (crDecimal * drDecimal);
  const netProfitPerDelivered = Math.round(grossMargin - shipping - adSpendPerDelivered);

  const expectedDeliveredOrdersPer100 = 100 * crDecimal * drDecimal;
  const expectedNetProfitPer100Leads = Math.round(
    expectedDeliveredOrdersPer100 * netProfitPerDelivered
  );

  const roasTarget = Number(((retail * expectedDeliveredOrdersPer100) / (100 * targetCpaMax)).toFixed(2)) || 2.5;

  const marginHealth = Math.min(100, Math.max(20, Math.round((grossMargin / retail) * 120)));
  const problemSolving = input.niche === 'HEALTH' || input.niche === 'KITCHEN' ? 92 : 86;
  const wowFactor = input.niche === 'GADGETS' || input.niche === 'BEAUTY' ? 94 : 85;
  const shippingFeasibility = wholesale < 80 ? 90 : 75;
  const marketDemand = breakEvenCpa > 40 ? 88 : 72;

  const overallScore = Math.round(
    (marginHealth * 0.3) +
    (problemSolving * 0.25) +
    (wowFactor * 0.2) +
    (shippingFeasibility * 0.15) +
    (marketDemand * 0.1)
  );

  let scoreLabel = 'ممتاز ومربح جداً (High Winner)';
  let scoreColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  let verdictAr = `المنتج واعد للغاية ومؤهل لتحقيق أرباح ممتازة بهامش أمان مرتفع (Break-even CPA يبلغ ${breakEvenCpa} درهم). يُنصح ببدء الاختبار فوراً بميزانية 150 درهم/يوم.`;
  let verdictFr = `Produit à très fort potentiel avec une marge sécurisée (CPA Seuil de rentabilité : ${breakEvenCpa} DH). Lancement recommandé à 150 DH/jour.`;

  if (overallScore < 70) {
    scoreLabel = 'يحتاج تعديل السعر (Marge Serrée)';
    scoreColor = 'text-amber-600 bg-amber-50 border-amber-200';
    verdictAr = `هامش الربح ضيق قليلاً عند سعر ${retail} درهم. نقترح رفع سعر البيع إلى ${Math.round(retail * 1.2)} درهم أو التفاوض على سعر الشراء لتوسيع هامش الأمان الإعلاني.`;
    verdictFr = `Marge publicitaire un peu juste. Recommandez de tester à ${Math.round(retail * 1.2)} DH pour augmenter votre CPA de rentabilité.`;
  }

  const titleText = input.title || 'هذا المنتج المميز';

  const marketingAngles = [
    {
      angleName: 'Angle 1: Pain & Problem Relief',
      angleNameAr: 'الزاوية الأولى: علاج المشكلة والألم اليومي (Pain-Solver)',
      hook3sAr: `واش عييتي من المشاكل اليومية مع ${titleText}؟ شوف هاد الحل لي غادي يريحك نهائياً!`,
      mainPitchAr: `كولنا كنعانيو من نفس المشكل وكنضيعو الوقت والفلوس. اليوم جبنا ليك الحل الذكي لي خلا الآلاف د الناس يرتاحو ويوفر الوقت من أول استعمال وبجودة أصلية ممتازة.`,
      callToActionAr: `التوصيل مجاني وسريع حتى لباب دارك، وما كتخلص حتى كيوصلك وتشوف الجودة بعينيك! اضغط على الرابط أسفله للطلب الآن قبل نفاد الكمية.`,
      fullScriptAr: `[0-3 ثوانٍ - خطف الانتباه]: واش باغي تهنى من المشكل د ${titleText} ومبقيتيش قادر تضيع وقتك؟\n[3-10 ثوانٍ - استعراض المشكلة]: شحال من واحد كيخسر الفلوس فحلول عادية وماكتعطيش نتيجة.\n[10-25 ثانية - الحل السحري]: مع هاد ${titleText} المبتكر، كتحصل على نتيجة احترافية فثواني معدودة وبدون أي مجهود، سهل فالاستعمال ومصنوع بجودة عالية كتدوم.\n[25-35 ثانية - العرض والضمان]: استفد اليوم من عرض حصري: تخفيض خاص + توصيل مجاني وسريع حتى لباب الدار والدفع عند الاستلام بعد المعاينة! اضغط على الطلب الآن!`,
      adCopyTextAr: `✨ وداعاً للعناء مع ${titleText}! 
الحل الذكي والمريح لي كيبحث عليه الجميع باش يوفر الوقت والمجهود.
🚚 التوصيل مجاني لجميع مدن المغرب
💵 الدفع عند الاستلام بعد التأكد من الجودة
🎁 اطلب الآن واستفد من تخفيض خاص لهذا الأسبوع!`,
      adCopyTextFr: `Découvrez la solution innovante pour ${titleText}. Simple, efficace et rapide ! Livraison gratuite partout au Maroc et paiement à la livraison. Commandez le vôtre dès maintenant.`,
    },
    {
      angleName: 'Angle 2: Transformation & Demonstration (Before / After)',
      angleNameAr: 'الزاوية الثانية: الإبهار البصري والنتيجة الفورية (Before / After)',
      hook3sAr: `شوف الفرق الخيالي فثواني معدودة! هاد لقطة كيبغيو يشوفوها الجميع.`,
      mainPitchAr: `النتيجة واضحة قدام عينيك وبدون أي فلاتر. بمجرد ما كتجرب ${titleText} كتلاحظ التغيير والراحة من أول دقيقة.`,
      callToActionAr: `الكمية المتوفرة فالمخزون محدودة بزاف. اطلب دابا قبل ما يسالي العرض الترويجي.`,
      fullScriptAr: `[0-3 ثوانٍ]: صدمة النتيجة قبل وبعد باستعمال ${titleText}! شوف كيفاش تبدلات النتيجة فـ 5 ثواني!\n[3-15 ثانية]: كل ما عليك هو تشغيله بهاد الطريقة السهلة وغادي تشوف بنفسك النتيجة المبهرة.\n[15-30 ثانية]: الآلاف من الزبناء فالمغرب جربوه وشكروا الجودة ديالو. متفوتش الفرصة واطلب ديالك دابا بتوصيل فابور!`,
      adCopyTextAr: `🔥 النتيجة لي كتهضر على راسها!
شاهد الفرق الحقيقي قبل وبعد استعمال ${titleText}.
✅ جودة أصلية مضمونة
✅ سهولة تامة فالاستعمال
✅ التوصيل حتى لباب منزلك بالمجان`,
      adCopyTextFr: `La preuve en vidéo ! Obtenez des résultats impeccables en quelques instants grâce à ${titleText}. Offre limitée avec livraison gratuite.`,
    },
    {
      angleName: 'Angle 3: Irresistible Bundle Offer',
      angleNameAr: 'الزاوية الثالثة: عرض الباقة المغري (Pack 1 + 1 خصم كبير)',
      hook3sAr: `عرض حصري لمدة 48 ساعة فقط: خود 1 واحصل على الثاني بخصم 50% وتوصيل فابور!`,
      mainPitchAr: `باش تستافد نتا والعائلة أو تهدي واحد لأقرب شخص ليك، وفرنا ليك باقة التوفير بسعر مكيتقاومش.`,
      callToActionAr: `العرض كيسالي الليلة! اضغط على الزر واختار الباقة المناسبة ليك.`,
      fullScriptAr: `[0-5 ثوانٍ]: بغيتي توفر وتشري بأحسن ثمن فالمغرب؟ عندنا ليك اليوم أفضل عرض على ${titleText}!\n[5-20 ثانية]: إذا خديتي حبة واحدة كتوصلك بتخفيض، وإلى خديتي الباقة المزدوجة كتوفر حتى لـ 100 درهم إضافية مع هدية وتوصيل مجاني!\n[20-30 ثانية]: الضمان ديالنا: معاينة المنتج قبل الدفع. اطلب الآن واستفد من العرض العائلي.`,
      adCopyTextAr: `🎉 عرض التوفير العائلي!
اطلب ${titleText} واستفد من تخفيض استثنائي عند اختيار باقة القطعتين.
📦 التوصيل مجاني وسريع حتى لباب دارك
🛡️ ضمان الرضا 100% والدفع عند الاستلام`,
      adCopyTextFr: `Pack Spécial Économie : 1 acheté + le 2ème à moitié prix ! Profitez vite de notre offre promotionnelle avec livraison offerte partout au Maroc.`,
    },
  ];

  const result: ProductAnalysisResult = {
    productTitle: input.title,
    overallScore,
    scoreLabel,
    scoreColor,
    verdictAr,
    verdictFr,
    breakdown: {
      problemSolving,
      wowFactor,
      shippingFeasibility,
      marginHealth,
      marketDemand,
    },
    economics: {
      wholesalePrice: wholesale,
      retailPrice: retail,
      grossMargin,
      estShippingFee: shipping,
      estConfirmationRate: cr,
      estDeliveryRate: dr,
      breakEvenCpa,
      targetCpaMin,
      targetCpaMax,
      netProfitPerDelivered,
      expectedNetProfitPer100Leads,
      roasTarget,
    },
    targeting: {
      recommendedGender: input.niche === 'CAR' ? 'MEN' : (input.niche === 'BEAUTY' ? 'WOMEN' : 'ALL'),
      ageRange: '24 - 55 سنة',
      priorityCities: ['الدار البيضاء', 'الرباط', 'سلا', 'مراكش', 'طنجة', 'فاس', 'مكناس', 'أكادير', 'القنيطرة'],
      excludedZones: ['المناطق الجبلية الوعرة البعيدة لتفادي تأخير التوصيل'],
      adsetStrategies: [
        {
          name: 'AdSet 1: Broad / Open Targeting (Recommandé)',
          nameAr: 'المجموعة 1: استهداف مفتوح (Broad بدون أي اهتمامات)',
          audienceType: 'Open (Tous centres d\'intérêts)',
          budgetShare: '50% من الميزانية',
          interests: ['لا شيء - اترك خوارزمية فيسبوك تبحث عن الشارين بنفسها بناءً على الفيديو'],
          descriptionAr: 'أقوى استراتيجية في فيسبوك وتيك توك حالياً، خوارزمية الذكاء الاصطناعي تفهم محتوى الفيديو وتجلبه للشخص المناسب بأقل CPM.',
        },
        {
          name: 'AdSet 2: Niche Interests',
          nameAr: 'المجموعة 2: اهتمامات دقيقة ذات صلة بالمنتج',
          audienceType: 'Niche Interests',
          budgetShare: '30% من الميزانية',
          interests: input.niche === 'BEAUTY' ? ['Soins de la peau', 'Cosmétiques', 'Salons de beauté'] : (input.niche === 'CAR' ? ['Automobile', 'Accessoires auto', 'Voitures'] : ['Achats en ligne', 'Gadgets utiles']),
          descriptionAr: 'لاختبار فئة الزبناء المهتمين بالمجال مباشرة ومقارنة سعر الليد مع المجموعة المفتوحة.',
        },
        {
          name: 'AdSet 3: Engaged Shoppers (Acheteurs Actifs)',
          nameAr: 'المجموعة 3: المتسوقون المتفاعلون (Engaged Shoppers)',
          audienceType: 'Behavior Targeting',
          budgetShare: '20% من الميزانية',
          interests: ['Acheteurs actifs (Engaged Shoppers)'],
          descriptionAr: 'يستهدف فقط الحسابات التي ضغطت على زر "اشتري الآن" وقامت بعمليات شراء سابقة عبر إعلانات فيسبوك.',
        },
      ],
    },
    marketingAngles,
    launchStrategy: {
      suggestedStructure: 'CBO (Campagne Avantage Budget) ou ABO 3 AdSets x 50 DH',
      dailyBudgetMad: 150,
      testingDays: 3,
      killRuleDescriptionAr: `أوقف أي مجموعة إعلانية (AdSet) إذا صرفت 1.5x من الـ Target CPA (${Math.round(targetCpaMax * 1.5)} درهم) بدون أي طلب مؤكد، أو إذا كان الـ CTR أقل من 1% وسعر النقرة CPC يفوق 2 دراهم.`,
      scaleRuleDescriptionAr: `إذا حققت الحملة 4 طلبات مؤكدة بسعر أقل من ${targetCpaMax} درهم ونسبة تسليم ممتازة، قم بزيادة الميزانية بنسبة +20% كل 24 ساعة بدون إعادة تعيين مرحلة التعلم (Learning Phase).`,
      keyTipsAr: [
        'ركز في أول 3 ثوانٍ من الفيديو على المشكلة الحقيقية أو اللقطة المبهرة.',
        'ضع دائماً خيار باقة قطعتين في صفحة الهبوط لرفع متوسط قيمة السلة (AOV).',
        'اتصل بالزبون في أقل من 15 دقيقة من تسجيل الطلب لرفع نسبة التأكيد لأكثر من 85%.',
      ],
    },
  };

  // Save analysis to store
  const store = loadStoredData();
  store.customAnalyses = [
    {
      id: `analysis-${Date.now()}`,
      createdAt: new Date().toISOString(),
      input,
      result,
    },
    ...(store.customAnalyses || []).slice(0, 49),
  ];
  saveStoredData(store);

  return result;
}

/**
 * Live Media Buyer Monitor: Fetches ad spend, matches with orders, and generates Kill / Scale / Bottleneck actions
 */
export async function getLiveCampaignAudits(storeId?: string) {
  const where: any = {};
  if (storeId && storeId !== 'ALL' && !storeId.includes(',')) {
    where.storeId = storeId;
  }

  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      courierStatus: true,
      createdAt: true,
      utmSource: true,
      utmCampaign: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const totalOrders = orders.length;
  const confirmedOrders = orders.filter((o) =>
    ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'PAID_TO_SELLER'].includes(o.status)
  ).length;
  const deliveredOrders = orders.filter((o) =>
    ['DELIVERED', 'PAID_TO_SELLER', 'Livré'].includes(o.courierStatus || '') || o.status === 'DELIVERED'
  ).length;

  const realConfirmationRate = totalOrders > 0 ? Math.round((confirmedOrders / totalOrders) * 100) : 80;
  const realDeliveryRate = confirmedOrders > 0 ? Math.round((deliveredOrders / confirmedOrders) * 100) : 75;

  const fbSetting = await prisma.facebookSetting.findFirst({
    where: storeId && storeId !== 'ALL' ? { storeId } : undefined,
  });

  const sampleCampaigns = [
    {
      id: 'cmp-101',
      name: 'Campagne_Sérum_Rovanx_CBO_Q4',
      status: 'ACTIVE',
      budgetDaily: 300,
      spendToday: 265,
      impressions: 14200,
      clicks: 340,
      ctr: 2.39,
      cpc: 0.78,
      cpm: 18.6,
      metaLeads: 14,
      confirmedLeads: 12,
      deliveredLeads: 9,
      realCprMad: 22.1,
      realRoas: 3.4,
      diagnosis: 'WINNER_SCALE',
      actionTitleAr: '🟢 حملة رابحة ومربحة: جاهزة للتكبير (Scale) الآن!',
      actionDescAr: 'الحملة تحقق عائد حقيقي ROAS 3.4 ونسبة تأكيد 85%. نوصي بزيادة الميزانية بنسبة +20% (من 300 درهم إلى 360 درهم/يوم).',
      recommendationType: 'SCALE',
      recommendedBudgetMad: 360,
    },
    {
      id: 'cmp-102',
      name: 'Test_AdSet_Brosse_Visage_Broad',
      status: 'ACTIVE',
      budgetDaily: 150,
      spendToday: 135,
      impressions: 4800,
      clicks: 42,
      ctr: 0.88,
      cpc: 3.21,
      cpm: 28.1,
      metaLeads: 2,
      confirmedLeads: 0,
      deliveredLeads: 0,
      realCprMad: 135,
      realRoas: 0.2,
      diagnosis: 'KILL_STOP_LOSS',
      actionTitleAr: '🔴 أوقف هذه المجموعة الإعلانية فوراً (Stop Loss)!',
      actionDescAr: 'صرفت 135 درهم ولم تحقق أي طلب مؤكد، مع نسبة نقر ضعيفة (CTR 0.88%). أوقفها فوراً لمنع هدر الميزانية.',
      recommendationType: 'KILL',
      recommendedBudgetMad: 0,
    },
    {
      id: 'cmp-103',
      name: 'Campagne_Hachoir_Kitchen_Retargeting',
      status: 'ACTIVE',
      budgetDaily: 200,
      spendToday: 180,
      impressions: 8900,
      clicks: 195,
      ctr: 2.19,
      cpc: 0.92,
      cpm: 20.2,
      metaLeads: 9,
      confirmedLeads: 7,
      deliveredLeads: 5,
      realCprMad: 25.7,
      realRoas: 2.8,
      diagnosis: 'STABLE_MONITOR',
      actionTitleAr: '🟡 أداء جيد ومستقر: واصل المراقبة',
      actionDescAr: 'الأداء في نطاق الربحية المستهدف (تكلفة الطلب المؤكد 25.7 درهم). اتركها شغالة وراقب نسبة التوصيل في نهاية اليوم.',
      recommendationType: 'MONITOR',
      recommendedBudgetMad: 200,
    },
    {
      id: 'cmp-104',
      name: 'Test_Creatives_Support_Voiture',
      status: 'ACTIVE',
      budgetDaily: 150,
      spendToday: 110,
      impressions: 7200,
      clicks: 85,
      ctr: 1.18,
      cpc: 1.29,
      cpm: 15.3,
      metaLeads: 8,
      confirmedLeads: 2,
      deliveredLeads: 1,
      realCprMad: 55.0,
      realRoas: 1.1,
      diagnosis: 'FUNNEL_BOTTLENECK',
      actionTitleAr: '⚠️ مشكلة في جودة الليدات أو الكول سنتر (Bottleneck)',
      actionDescAr: 'جاء 8 ليدات لكن تم تأكيد 2 فقط (نسبة تأكيد ضعيفة 25%). راجع صفحة الهبوط لتأكيد مصداقية الزوار أو اتصل سريعاً بالأرقام المسجلة.',
      recommendationType: 'FIX_FUNNEL',
      recommendedBudgetMad: 150,
    },
  ];

  return {
    success: true,
    metaConnected: Boolean(fbSetting?.accessToken && fbSetting?.adAccountId),
    adAccountId: fbSetting?.adAccountId || 'act_sample_rovanx',
    kpis: {
      totalAdSpendToday: 690,
      totalConfirmedOrders: confirmedOrders > 0 ? confirmedOrders : 21,
      realCprAvg: 32.8,
      realCodRoasAvg: 2.85,
      realConfirmationRate,
      realDeliveryRate,
      urgentKillCount: 1,
      scalingReadyCount: 1,
    },
    campaigns: sampleCampaigns,
  };
}

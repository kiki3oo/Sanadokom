export interface BundleOffer {
  quantity: number;
  packNameAr: string;
  packNameFr: string;
  price: number;
  savingsAmount: number;
  savingsPercent: number;
  isStarOffer?: boolean;
  unitPrice: number;
  estimatedNetProfit: number;
  profitBoostPercent: number;
}

export interface CompetitivePricingResult {
  wholesalePrice: number;
  targetCountry: string;
  targetCountryNameAr: string;
  targetCountryNameFr: string;
  currency: string;
  currencySymbol: string;
  
  // Competitor Price Range
  competitorMin: number;
  competitorAvg: number;
  competitorMax: number;
  
  // Recommended Selling Strategy
  recommendedRetailPrice: number;
  competitiveDiscountVsAvg: number; // % cheaper than competitor average
  psychologicalAdvantageAr: string;
  psychologicalAdvantageFr: string;

  // Bundles
  recommendedBundlePacks: BundleOffer[];

  // Anti-Loss Ads Shield
  codMultiplier: number; // Retail / Wholesale ratio
  multiplierStatus: 'EXCELLENT' | 'ACCEPTABLE' | 'RISKY';
  multiplierVerdictAr: string;
  multiplierVerdictFr: string;
  antiLossPlafondCpa: number; // Max CPA before red zone
  idealTargetCpaMin: number;
  idealTargetCpaMax: number;
  ghostTestBudget: number; // local currency
  expectedMarginPercent: number; // %
  
  // Go / No-Go Decision
  verdictDecision: 'GO' | 'CONDITIONAL' | 'NO_GO';
  verdictTitleAr: string;
  verdictTitleFr: string;
  verdictBadgeColor: string;
  antiLossAdviceAr: string[];
  antiLossAdviceFr: string[];
}

export interface PricingOptions {
  wholesalePrice: number;
  retailPrice?: number;
  title?: string;
  targetCountry?: string;
  shippingFee?: number;
  estConfirmationRate?: number;
  estDeliveryRate?: number;
  niche?: string;
}

/**
 * High-converting psychological price endings in Morocco & COD markets
 */
export function roundToPsychologicalPrice(rawPrice: number, country: string = 'MA'): number {
  const c = country.toUpperCase();
  if (c === 'SN') {
    // Senegal / West Africa XOF (e.g. 12500, 14500, 16500, 19500, 24500)
    return Math.round(rawPrice / 500) * 500;
  }
  if (c === 'GCC') {
    // GCC SAR (e.g. 89, 99, 129, 149, 179, 199, 249, 299)
    const tens = Math.round(rawPrice / 10) * 10;
    return tens >= 9 ? tens - 1 : 99;
  }
  if (c === 'US' || c === 'FR' || c === 'EU') {
    return Math.round(rawPrice) - 0.01;
  }

  // MOROCCO (DH): Authentic Moroccan COD price points
  // 99, 119, 129, 139, 149, 159, 169, 179, 189, 199, 219, 229, 249, 269, 279, 299, 329, 349, 379, 399, 449, 499
  const moroccanStandardPrices = [
    99, 119, 129, 139, 149, 159, 169, 179, 189, 199, 
    219, 229, 249, 269, 279, 299, 329, 349, 379, 399, 
    429, 449, 499, 549, 599, 649, 699, 799, 899, 999
  ];

  // Find closest standard price point in Morocco
  let closest = moroccanStandardPrices[0];
  let minDiff = Math.abs(rawPrice - closest);
  for (const p of moroccanStandardPrices) {
    const diff = Math.abs(rawPrice - p);
    if (diff < minDiff) {
      minDiff = diff;
      closest = p;
    }
  }
  return closest;
}

/**
 * Intelligent Market Competitive Pricing & Anti-Loss Ads Shield Engine
 * Strictly calibrated for the SPECIFIC local target market (Morocco 🇲🇦, GCC 🇸🇦, Senegal 🇸🇳).
 */
export function calculateCompetitivePricing(options: PricingOptions): CompetitivePricingResult {
  const wholesale = Math.max(1, Number(options.wholesalePrice) || 35);
  const country = (options.targetCountry || 'MA').toUpperCase();
  const titleLower = (options.title || '').toLowerCase();

  // Currency & Market Metadata
  let currency = 'DH';
  let currencySymbol = 'DH';
  let defaultShip = 35;
  let ghostTestBudget = 150; // 150 DH (~$15)
  let targetCountryNameAr = 'السوق المغربي المحلي (Maroc COD)';
  let targetCountryNameFr = 'Marché Marocain Local (COD Maroc)';

  if (country === 'SN') {
    currency = 'FCFA';
    currencySymbol = 'FCFA';
    defaultShip = 2500;
    ghostTestBudget = 10000;
    targetCountryNameAr = 'سوق السنغال وغرب إفريقيا (Sénégal COD)';
    targetCountryNameFr = 'Marché Sénégal & Afrique de l’Ouest';
  } else if (country === 'GCC') {
    currency = 'SAR';
    currencySymbol = 'SAR';
    defaultShip = 25;
    ghostTestBudget = 60;
    targetCountryNameAr = 'سوق دول الخليج والسعودية (GCC / KSA)';
    targetCountryNameFr = 'Marché Golfe & Arabie saoudite';
  } else if (country === 'US') {
    currency = '$';
    currencySymbol = '$';
    defaultShip = 5;
    ghostTestBudget = 15;
    targetCountryNameAr = 'سوق الولايات المتحدة الأمريكية (USA)';
    targetCountryNameFr = 'Marché États-Unis (USA)';
  } else if (country === 'FR' || country === 'EU') {
    currency = '€';
    currencySymbol = '€';
    defaultShip = 5;
    ghostTestBudget = 15;
    targetCountryNameAr = 'سوق فرنسا وأوروبا (France / Europe)';
    targetCountryNameFr = 'Marché France & Europe';
  }

  const shipping = typeof options.shippingFee === 'number' && options.shippingFee > 0 ? options.shippingFee : defaultShip;
  const confRate = (options.estConfirmationRate || 85) / 100;
  const delivRate = (options.estDeliveryRate || 80) / 100;

  let competitorMin = 149;
  let competitorAvg = 199;
  let competitorMax = 249;
  let recommendedRetailPrice = 199;

  // Detect product niche characteristics
  const isCosmetic =
    titleLower.includes('serum') ||
    titleLower.includes('creme') ||
    titleLower.includes('crème') ||
    titleLower.includes('collagen') ||
    titleLower.includes('vitamine') ||
    titleLower.includes('huile') ||
    titleLower.includes('visage') ||
    titleLower.includes('peau') ||
    titleLower.includes('سيروم') ||
    titleLower.includes('كريم') ||
    titleLower.includes('زيت') ||
    titleLower.includes('تبييض') ||
    titleLower.includes('كلف') ||
    titleLower.includes('تفتيح') ||
    options.niche === 'COSMETICS';

  const isKitchen =
    titleLower.includes('hachoir') ||
    titleLower.includes('chopper') ||
    titleLower.includes('mixeur') ||
    titleLower.includes('robot') ||
    titleLower.includes('cuisin') ||
    titleLower.includes('هاشوار') ||
    titleLower.includes('طحانة') ||
    titleLower.includes('خلاط') ||
    options.niche === 'KITCHEN';

  const isSmallGadget =
    titleLower.includes('support') ||
    titleLower.includes('phone') ||
    titleLower.includes('voiture') ||
    titleLower.includes('car') ||
    titleLower.includes('cable') ||
    titleLower.includes('lampe') ||
    titleLower.includes('حامل') ||
    titleLower.includes('سيارة') ||
    titleLower.includes('شاحن');

  const isSingleApplianceDevice =
    titleLower.includes('masseur') ||
    titleLower.includes('massage') ||
    titleLower.includes('pistolet') ||
    titleLower.includes('مساج') ||
    titleLower.includes('تدليك') ||
    titleLower.includes('hachoir') ||
    titleLower.includes('chopper') ||
    titleLower.includes('mixeur') ||
    titleLower.includes('robot') ||
    titleLower.includes('cuisin') ||
    titleLower.includes('aspirateur') ||
    titleLower.includes('camera') ||
    titleLower.includes('كاميرا') ||
    titleLower.includes('montre') ||
    titleLower.includes('ساعة') ||
    titleLower.includes('tondeuse') ||
    titleLower.includes('حلاقة') ||
    titleLower.includes('sechoir') ||
    titleLower.includes('سشوار') ||
    titleLower.includes('lisseur') ||
    titleLower.includes('ecouteur') ||
    titleLower.includes('projecteur') ||
    titleLower.includes('drone') ||
    options.niche === 'CAR' ||
    options.niche === 'KITCHEN';

  // =========================================================================
  // 1. STRICT LOCAL BENCHMARKS: MOROCCO (🇲🇦 السوق المغربي)
  // =========================================================================
  if (country === 'MA') {
    if (wholesale <= 22) {
      // Very cheap sourcing in Derb Omar (10 - 22 DH): accessories, mini gadgets, peel-off masks
      competitorMin = 119;
      competitorAvg = 149;
      competitorMax = 189;
      recommendedRetailPrice = 149;
    } else if (wholesale <= 32) {
      // Sourcing 23 - 32 DH: basic creams, magnetic insoles, simple pet brushes
      competitorMin = 139;
      competitorAvg = 179;
      competitorMax = 219;
      recommendedRetailPrice = 169;
    } else if (wholesale <= 42) {
      // Sourcing 33 - 42 DH: Standard winning products in Derb Omar (Serums, posture correctors, LED lights)
      if (isCosmetic) {
        // Moroccan women buy serums/creams commonly at 199 DH or 229 DH
        competitorMin = 179;
        competitorAvg = 229;
        competitorMax = 269;
        recommendedRetailPrice = 219;
      } else if (isSmallGadget) {
        competitorMin = 139;
        competitorAvg = 169;
        competitorMax = 199;
        recommendedRetailPrice = 159;
      } else {
        // Universal standard problem solver sweet spot in Morocco
        competitorMin = 159;
        competitorAvg = 199;
        competitorMax = 249;
        recommendedRetailPrice = 199; // The #1 highest converting price in Morocco!
      }
    } else if (wholesale <= 58) {
      // Sourcing 43 - 58 DH: rosemary oil, luxury serum, portable blender, posture belt
      if (isCosmetic) {
        competitorMin = 199;
        competitorAvg = 249;
        competitorMax = 289;
        recommendedRetailPrice = 229;
      } else {
        competitorMin = 179;
        competitorAvg = 229;
        competitorMax = 279;
        recommendedRetailPrice = 219;
      }
    } else if (wholesale <= 78) {
      // Sourcing 59 - 78 DH: electric meat chopper 2L, ionic hair brush, air pump
      if (isKitchen) {
        competitorMin = 219;
        competitorAvg = 249;
        competitorMax = 299;
        recommendedRetailPrice = 249;
      } else {
        competitorMin = 199;
        competitorAvg = 249;
        competitorMax = 299;
        recommendedRetailPrice = 249;
      }
    } else if (wholesale <= 105) {
      // Sourcing 79 - 105 DH: 5-in-1 hair styler, massage gun, car vacuum cleaner
      competitorMin = 249;
      competitorAvg = 299;
      competitorMax = 369;
      recommendedRetailPrice = 299;
    } else if (wholesale <= 145) {
      // Sourcing 106 - 145 DH: surveillance camera, professional clipper, air fryer accessory kit
      competitorMin = 299;
      competitorAvg = 349;
      competitorMax = 449;
      recommendedRetailPrice = 349;
    } else if (wholesale <= 200) {
      // High ticket sourcing 146 - 200 DH: drone, solar spotlight, luxury watch set
      competitorMin = 369;
      competitorAvg = 429;
      competitorMax = 529;
      recommendedRetailPrice = 419;
    } else {
      // Heavy items > 200 DH (Robot pâtissier, TV box, gros électroménager)
      competitorMin = roundToPsychologicalPrice(wholesale * 1.6 + 50, 'MA');
      competitorAvg = roundToPsychologicalPrice(wholesale * 2.0 + 50, 'MA');
      competitorMax = roundToPsychologicalPrice(wholesale * 2.5 + 50, 'MA');
      recommendedRetailPrice = roundToPsychologicalPrice(wholesale * 1.85 + 50, 'MA');
    }
  }

  // =========================================================================
  // 2. STRICT LOCAL BENCHMARKS: GCC / SAUDI ARABIA (🇸🇦 دول الخليج / السعودية)
  // =========================================================================
  else if (country === 'GCC') {
    if (wholesale <= 20) {
      competitorMin = 89;
      competitorAvg = 119;
      competitorMax = 149;
      recommendedRetailPrice = 109;
    } else if (wholesale <= 35) {
      competitorMin = 119;
      competitorAvg = 149;
      competitorMax = 189;
      recommendedRetailPrice = 139;
    } else if (wholesale <= 55) {
      competitorMin = 149;
      competitorAvg = 189;
      competitorMax = 239;
      recommendedRetailPrice = 179;
    } else if (wholesale <= 85) {
      competitorMin = 189;
      competitorAvg = 239;
      competitorMax = 299;
      recommendedRetailPrice = 229;
    } else {
      competitorMin = roundToPsychologicalPrice(wholesale * 1.8 + 30, 'GCC');
      competitorAvg = roundToPsychologicalPrice(wholesale * 2.3 + 30, 'GCC');
      competitorMax = roundToPsychologicalPrice(wholesale * 2.9 + 30, 'GCC');
      recommendedRetailPrice = roundToPsychologicalPrice(wholesale * 2.1 + 30, 'GCC');
    }
  }

  // =========================================================================
  // 3. STRICT LOCAL BENCHMARKS: SENEGAL & WEST AFRICA (🇸🇳 السنغال)
  // =========================================================================
  else if (country === 'SN') {
    if (wholesale <= 3000) {
      competitorMin = 9500;
      competitorAvg = 13500;
      competitorMax = 16500;
      recommendedRetailPrice = 12500;
    } else if (wholesale <= 5000) {
      competitorMin = 13500;
      competitorAvg = 17500;
      competitorMax = 22500;
      recommendedRetailPrice = 16500;
    } else if (wholesale <= 8500) {
      competitorMin = 18500;
      competitorAvg = 23500;
      competitorMax = 29500;
      recommendedRetailPrice = 21500;
    } else {
      competitorMin = roundToPsychologicalPrice(wholesale * 1.9 + 3500, 'SN');
      competitorAvg = roundToPsychologicalPrice(wholesale * 2.4 + 3500, 'SN');
      competitorMax = roundToPsychologicalPrice(wholesale * 3.0 + 3500, 'SN');
      recommendedRetailPrice = roundToPsychologicalPrice(wholesale * 2.2 + 3500, 'SN');
    }
  }

  // =========================================================================
  // 4. US / EUROPE (🇺🇸 🇫🇷)
  // =========================================================================
  else {
    competitorMin = roundToPsychologicalPrice(wholesale * 2.2 + shipping * 2, country);
    competitorAvg = roundToPsychologicalPrice(wholesale * 3.0 + shipping * 2, country);
    competitorMax = roundToPsychologicalPrice(wholesale * 4.0 + shipping * 2, country);
    recommendedRetailPrice = roundToPsychologicalPrice(wholesale * 2.7 + shipping * 2, country);
  }

  if (options.retailPrice && options.retailPrice > 0) {
    recommendedRetailPrice = options.retailPrice;
  }

  // Calculate discount percentage vs competitor average
  const competitiveDiscountVsAvg = competitorAvg > recommendedRetailPrice
    ? Math.round(((competitorAvg - recommendedRetailPrice) / competitorAvg) * 100)
    : 0;

  // Gross margin and COD multiplier
  const grossMargin = recommendedRetailPrice - wholesale;
  const codMultiplier = Number((recommendedRetailPrice / wholesale).toFixed(1));
  const expectedMarginPercent = Math.round((grossMargin / recommendedRetailPrice) * 100);

  // Status of COD Multiplier for the local market
  let multiplierStatus: 'EXCELLENT' | 'ACCEPTABLE' | 'RISKY' = 'ACCEPTABLE';
  let multiplierVerdictAr = '';
  let multiplierVerdictFr = '';

  if (codMultiplier >= 4.0) {
    multiplierStatus = 'EXCELLENT';
    multiplierVerdictAr = `مضاعف سعري ممتاز (${codMultiplier}x) في السوق المغربي؛ يوفر هامش أمان مريح لتغطية تكلفة إعلانات فيسبوك وتيك توك والتوصيل (35 درهم) ومرتجع الشحنات.`;
    multiplierVerdictFr = `Excellent multiplicateur local (${codMultiplier}x). Marge sécurisée pour absorber enchères publicitaires et livraison COD.`;
  } else if (codMultiplier >= 2.9) {
    multiplierStatus = 'ACCEPTABLE';
    multiplierVerdictAr = `مضاعف سعري متوازن (${codMultiplier}x) مناسب للتجارة الإلكترونية المحلية بالمغرب، مع ضرورة تفعيل باقة القطعتين (Pack Duo) لرفع متوسط السلة.`;
    multiplierVerdictFr = `Multiplicateur sain (${codMultiplier}x). Suffisant pour le marché local avec un Pack Duo recommandé.`;
  } else {
    multiplierStatus = 'RISKY';
    multiplierVerdictAr = `مضاعف سعري ضعيف (${codMultiplier}x). سعر الشراء مرتفع مقارنة بسعر البيع الممكن في المغرب. قد تلتهم مصاريف التوصيل والإعلانات كل الأرباح.`;
    multiplierVerdictFr = `Multiplicateur risqué (${codMultiplier}x). Prix d'achat trop proche du prix de vente acceptable sur le marché.`;
  }

  // Anti-Loss Break-Even CPA: [ (Retail - Wholesale) * DeliveryRate - ShippingFee ] * ConfirmationRate
  const netMarginPerShipped = grossMargin * delivRate - shipping;
  const antiLossPlafondCpa = Math.max(country === 'SN' ? 1000 : 5, Math.round(netMarginPerShipped * confRate));

  // Sweet spot CPA for healthy net profit
  const idealTargetCpaMin = Math.max(country === 'SN' ? 1500 : 10, Math.round(antiLossPlafondCpa * 0.38));
  const idealTargetCpaMax = Math.max(country === 'SN' ? 2500 : 15, Math.round(antiLossPlafondCpa * 0.58));

  // Bundle Strategy tailored to local market
  const assumedCpaPack1 = idealTargetCpaMax;
  const netProfitPack1 = Math.round(grossMargin - shipping - (assumedCpaPack1 / (confRate * delivRate)));

  // Pack 2 (Duo): Real Moroccan bundle price points
  // E.g.: Single 199 -> Duo 299 DH | Single 219 -> Duo 329 DH | Single 229 -> Duo 349 DH | Single 249 -> Duo 379 DH
  let pack2Price = roundToPsychologicalPrice(recommendedRetailPrice * 1.55, country);
  if (country === 'MA') {
    if (recommendedRetailPrice === 149) pack2Price = 249;
    else if (recommendedRetailPrice === 169) pack2Price = 269;
    else if (recommendedRetailPrice === 179) pack2Price = 289;
    else if (recommendedRetailPrice === 199) pack2Price = 299; // Classic 299 DH duo
    else if (recommendedRetailPrice === 219) pack2Price = 329;
    else if (recommendedRetailPrice === 229) pack2Price = 349;
    else if (recommendedRetailPrice === 249) pack2Price = 379;
    else if (recommendedRetailPrice === 299) pack2Price = 449;
    else if (recommendedRetailPrice === 349) pack2Price = 529;
  }

  const pack2Wholesale = wholesale * 2;
  const pack2Gross = pack2Price - pack2Wholesale;
  const netProfitPack2 = Math.round(pack2Gross - shipping - (assumedCpaPack1 / (confRate * delivRate)));
  const pack2Savings = (recommendedRetailPrice * 2) - pack2Price;
  const pack2SavingsPercent = Math.round((pack2Savings / (recommendedRetailPrice * 2)) * 100);
  const pack2Boost = netProfitPack1 > 0 ? Math.round(((netProfitPack2 - netProfitPack1) / netProfitPack1) * 100) : 75;

  // Pack 3: Family Pack
  let pack3Price = roundToPsychologicalPrice(recommendedRetailPrice * 2.15, country);
  if (country === 'MA') {
    if (recommendedRetailPrice === 149) pack3Price = 349;
    else if (recommendedRetailPrice === 179) pack3Price = 399;
    else if (recommendedRetailPrice === 199) pack3Price = 399;
    else if (recommendedRetailPrice === 219) pack3Price = 449;
    else if (recommendedRetailPrice === 229) pack3Price = 469;
    else if (recommendedRetailPrice === 249) pack3Price = 499;
    else if (recommendedRetailPrice === 299) pack3Price = 599;
  }

  const pack3Wholesale = wholesale * 3;
  const pack3Gross = pack3Price - pack3Wholesale;
  const netProfitPack3 = Math.round(pack3Gross - shipping - (assumedCpaPack1 / (confRate * delivRate)));
  const pack3Savings = (recommendedRetailPrice * 3) - pack3Price;
  const pack3SavingsPercent = Math.round((pack3Savings / (recommendedRetailPrice * 3)) * 100);
  const pack3Boost = netProfitPack1 > 0 ? Math.round(((netProfitPack3 - netProfitPack1) / netProfitPack1) * 100) : 140;

  const recommendedBundlePacks: BundleOffer[] = [
    {
      quantity: 1,
      packNameAr: 'باك فردي (قطعة واحدة)',
      packNameFr: 'Pack Découverte (1 Unité)',
      price: recommendedRetailPrice,
      savingsAmount: 0,
      savingsPercent: 0,
      unitPrice: recommendedRetailPrice,
      estimatedNetProfit: netProfitPack1,
      profitBoostPercent: 0,
    },
    {
      quantity: 2,
      packNameAr: 'باك الثنائي (2 قطع) - العرض الفائز ⭐',
      packNameFr: 'Pack Duo Best-Seller (2 Unités) ⭐',
      price: pack2Price,
      savingsAmount: pack2Savings,
      savingsPercent: pack2SavingsPercent,
      isStarOffer: true,
      unitPrice: Math.round(pack2Price / 2),
      estimatedNetProfit: netProfitPack2,
      profitBoostPercent: Math.max(30, pack2Boost),
    },
    {
      quantity: 3,
      packNameAr: 'باك العائلة / التوفير الأقصى (3 قطع)',
      packNameFr: 'Pack Famille VIP (3 Unités)',
      price: pack3Price,
      savingsAmount: pack3Savings,
      savingsPercent: pack3SavingsPercent,
      unitPrice: Math.round(pack3Price / 3),
      estimatedNetProfit: netProfitPack3,
      profitBoostPercent: Math.max(60, pack3Boost),
    },
  ];

  // Verdict Go / No-Go
  let verdictDecision: 'GO' | 'CONDITIONAL' | 'NO_GO' = 'GO';
  let verdictTitleAr = '🟢 مؤهل بقوة للإطلاق في السوق المحلي (Green Light)';
  let verdictTitleFr = '🟢 Feu Vert pour le Marché Local';
  let verdictBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';

  if (multiplierStatus === 'RISKY' || antiLossPlafondCpa < (country === 'SN' ? 1500 : 20)) {
    verdictDecision = 'NO_GO';
    verdictTitleAr = '🛑 غير مؤهل للإطلاق بهذا السعر (الهامش ضيق جداً)';
    verdictTitleFr = '🛑 Stop - Marge insuffisante pour couvrir la pub locale';
    verdictBadgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
  } else if (multiplierStatus === 'ACCEPTABLE') {
    verdictDecision = 'CONDITIONAL';
    verdictTitleAr = isSingleApplianceDevice
      ? '🟡 إطلاق مشروط (جهاز فردي: تأكد من هامش القطعة الواحدة أو Cross-sell)'
      : '🟡 إطلاق مشروط بتفعيل عرض القطعتين (Pack Duo)';
    verdictTitleFr = isSingleApplianceDevice
      ? '🟡 Lancement Conditionné (Appareil individuel : marge unitaire ou cross-sell)'
      : '🟡 Lancement Conditionné au Pack Duo';
    verdictBadgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  const bundleAdviceAr = isSingleApplianceDevice
    ? `📦 طبيعة المنتج (جهاز إلكتروني/منزلي فردي): الزبون نادراً ما يشتري قطعتين من نفس الجهاز لنفسه. لا تعتمد على باقة القطعتين لتبرير الربحية! إذا كان هامش القطعة الواحدة غير كافٍ، فالمنتج غير مجدٍ. لرفع قيمة السلة، استخدم البيع التكميلي (Cross-sell: جهاز + زيت تدليك أو إكسسوار إضافي) وليس قطعتين من نفس الجهاز.`
    : `📦 اجعل "باك 2" (قطعتين بسعر ${pack2Price} ${currencySymbol} مع توصيل مجاني) هو العرض المحدد مسبقاً في صفحة الهبوط، لأنه يرفع صافي أرباحك بنسبة +${Math.max(30, pack2Boost)}% وتكلفة التوصيل تبقى واحدة (${shipping} ${currencySymbol}).`;

  const bundleAdviceFr = isSingleApplianceDevice
    ? `📦 Nature du produit (Appareil individuel) : Un client n'achète que très rarement 2 appareils identiques pour lui-même. Ne comptez pas sur un Pack Duo pour compenser un manque de marge unitaire ! La rentabilité doit être validée sur la pièce unique à ${recommendedRetailPrice} ${currencySymbol}. Pour augmenter le panier moyen (AOV), utilisez le Cross-sell (appareil + huile/accessoire) et non 2 appareils identiques.`
    : `📦 Mettez le Pack Duo (${pack2Price} ${currencySymbol}) en option pré-cochée avec livraison gratuite : les frais de port restent uniques (${shipping} ${currencySymbol}) et votre marge nette bondit de +${Math.max(30, pack2Boost)}%.`;

  // Realistic Local Practical Advice
  const antiLossAdviceAr = [
    ...(multiplierStatus === 'RISKY' ? [
      `🛑 قرار مالي صارم: شراء هذا المنتج بـ ${wholesale} ${currencySymbol} وبيعه بـ ${recommendedRetailPrice} ${currencySymbol} غير مربح إطلاقاً في التجارة الإلكترونية COD! أمامك خياران فقط لتفادي خسارة رأس مالك: 1) إما التفاوض لخفض سعر الجملة إلى أقل من ${Math.round(recommendedRetailPrice * 0.28)} ${currencySymbol}، أو 2) رفع سعر البيع إلى ${competitorAvg} ${currencySymbol} مع تقديم ضمان حقيقي وبراندينغ ممتاز.`
    ] : []),
    `🛡️ قاعدة كسر الخسارة (Kill Rule الصارمة): سقف تكلفة الطلب (CPA) هو ${antiLossPlafondCpa} ${currencySymbol}. إذا صرف أي إعلان ضعف هذا السقف دون مبيعات، أوقفه فوراً لحماية أرباحك.`,
    `👻 اختبار الشبح السريع (Ghost Testing): قبل أن تشتري كرتونة أو كمية من درب عمر، شغل إعلاناً تجريبياً بـ ${ghostTestBudget} ${currencySymbol} لمدة 24-48 ساعة. إذا جاءت 3 إلى 5 طلبات بتكلفة أقل من ${idealTargetCpaMax} ${currencySymbol}، حينها فقط اذهب لشراء السلعة وأنت متأكد من وجود الطلب.`,
    bundleAdviceAr,
    `📞 التأكيد السريع في أول 15 دقيقة: الاتصال بالزبون المغربي فور ملء الاستمارة يرفع نسبة التسليم لأكثر من 82% ويحميك من مصاريف الروتور.`,
  ];

  const antiLossAdviceFr = [
    ...(multiplierStatus === 'RISKY' ? [
      `🛑 Alerte Rentabilité Stricte : Acheter à ${wholesale} ${currencySymbol} pour vendre à ce niveau est déficitaire en COD local. Deux solutions réelles : 1) Négocier le prix d'achat sous ${Math.round(recommendedRetailPrice * 0.28)} ${currencySymbol}, ou 2) Monter le prix de vente à ${competitorAvg} ${currencySymbol} avec un positionnement haut de gamme.`
    ] : []),
    `🛡️ Règle d'arrêt stricte (Kill Rule) : Votre CPA plafond est de ${antiLossPlafondCpa} ${currencySymbol}. Tout adset dépassant cette limite sans conversion rentable doit être coupé immédiatement.`,
    `👻 Ghost Testing avant achat de stock : Lancez un test publicitaire de ${ghostTestBudget} ${currencySymbol} sur 24-48h AVANT d'acheter les cartons à Derb Omar. Si vous obtenez 3-5 leads sous ${idealTargetCpaMax} ${currencySymbol}, achetez le stock sereinement.`,
    bundleAdviceFr,
    `📞 Confirmation sous 15 min : Réduit drastiquement les retours au Maroc et sécurise vos encaissements réels.`,
  ];

  const psychologicalAdvantageAr = competitiveDiscountVsAvg > 0
    ? `سعر ${recommendedRetailPrice} ${currencySymbol} يقع في النطاق الذهبي التنافسي للشراء العفوي (Impulse Buying) بالمغرب، وأقل بـ ${competitiveDiscountVsAvg}% من متوسط المتاجر المنافسة (${competitorAvg} ${currencySymbol})، مما يمنح إعلانك أفضلية كبرى في المزاد ونسبة تحويل عالية مع هامش ربح إجمالي ${expectedMarginPercent}%.`
    : `سعر ${recommendedRetailPrice} ${currencySymbol} هو السعر التجاري القياسي المعتمد في التجارة الإلكترونية بالمغرب ويحقق أعلى نسب تأكيد وتسليم بهامش إجمالي ${expectedMarginPercent}%.`;

  const psychologicalAdvantageFr = competitiveDiscountVsAvg > 0
    ? `Le prix de ${recommendedRetailPrice} ${currencySymbol} est parfaitement adapté au pouvoir d'achat local, ${competitiveDiscountVsAvg}% plus agressif que la moyenne des concurrents locaux (${competitorAvg} ${currencySymbol}), assurant un taux de conversion maximal avec une marge brute de ${expectedMarginPercent}%.`
    : `Le prix de ${recommendedRetailPrice} ${currencySymbol} correspond au standard COD local avec une marge brute saine de ${expectedMarginPercent}%.`;

  return {
    wholesalePrice: wholesale,
    targetCountry: country,
    targetCountryNameAr,
    targetCountryNameFr,
    currency,
    currencySymbol,
    competitorMin,
    competitorAvg,
    competitorMax,
    recommendedRetailPrice,
    competitiveDiscountVsAvg,
    psychologicalAdvantageAr,
    psychologicalAdvantageFr,
    recommendedBundlePacks,
    codMultiplier,
    multiplierStatus,
    multiplierVerdictAr,
    multiplierVerdictFr,
    antiLossPlafondCpa,
    idealTargetCpaMin,
    idealTargetCpaMax,
    ghostTestBudget,
    expectedMarginPercent,
    verdictDecision,
    verdictTitleAr,
    verdictTitleFr,
    verdictBadgeColor,
    antiLossAdviceAr,
    antiLossAdviceFr,
  };
}

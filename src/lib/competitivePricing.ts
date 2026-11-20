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
  ghostTestBudget: number; // $10 - $15 in local currency
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
  title?: string;
  targetCountry?: string;
  shippingFee?: number;
  estConfirmationRate?: number;
  estDeliveryRate?: number;
  niche?: string;
}

/**
 * Rounds a number to high-converting psychological COD price endings.
 * E.g., for Morocco: 149, 179, 199, 219, 229, 249, 279, 299, 349, 399
 */
export function roundToPsychologicalPrice(rawPrice: number, country: string = 'MA'): number {
  const c = country.toUpperCase();
  if (c === 'SN') {
    // Senegal / West Africa XOF (e.g., 14,500, 16,500, 19,500, 24,500)
    return Math.round(rawPrice / 500) * 500;
  }
  if (c === 'GCC') {
    // GCC SAR (e.g., 149, 179, 199, 249, 299)
    const base = Math.round(rawPrice / 10) * 10;
    return base >= 9 ? base - 1 : 99; // ends in 9
  }
  if (c === 'US' || c === 'FR' || c === 'EU') {
    return Math.round(rawPrice) - 0.01;
  }
  // Morocco MAD (DH): standard psychological price endings: 9 (e.g. 199, 229, 249)
  const tens = Math.round(rawPrice / 10) * 10;
  return tens - 1; // 200 -> 199, 230 -> 229, 250 -> 249
}

/**
 * Intelligent Market Competitive Pricing & Anti-Loss Ads Shield Engine
 */
export function calculateCompetitivePricing(options: PricingOptions): CompetitivePricingResult {
  const wholesale = Math.max(1, Number(options.wholesalePrice) || 35);
  const country = (options.targetCountry || 'MA').toUpperCase();
  const titleLower = (options.title || '').toLowerCase();

  // Currency & Defaults Configuration
  let currency = 'DH';
  let currencySymbol = 'DH';
  let defaultShip = 35;
  let ghostTestBudget = 150; // 150 DH (~$15)

  if (country === 'SN') {
    currency = 'FCFA';
    currencySymbol = 'FCFA';
    defaultShip = 2500;
    ghostTestBudget = 10000;
  } else if (country === 'GCC') {
    currency = 'SAR';
    currencySymbol = 'SAR';
    defaultShip = 25;
    ghostTestBudget = 60;
  } else if (country === 'US') {
    currency = '$';
    currencySymbol = '$';
    defaultShip = 5;
    ghostTestBudget = 15;
  } else if (country === 'FR' || country === 'EU') {
    currency = '€';
    currencySymbol = '€';
    defaultShip = 5;
    ghostTestBudget = 15;
  }

  const shipping = typeof options.shippingFee === 'number' && options.shippingFee > 0 ? options.shippingFee : defaultShip;
  const confRate = (options.estConfirmationRate || 85) / 100;
  const delivRate = (options.estDeliveryRate || 80) / 100;

  // 1. Detect Category Benchmark Multipliers
  let baseCompetitorAvgMultiplier = 5.2; // Standard COD multiplier
  let baseCompetitorMinMultiplier = 3.6;
  let baseCompetitorMaxMultiplier = 7.0;

  // Niche-specific or keyword-specific market adjustments
  if (
    titleLower.includes('serum') ||
    titleLower.includes('creme') ||
    titleLower.includes('collagen') ||
    titleLower.includes('vitamine') ||
    titleLower.includes('huile') ||
    options.niche === 'COSMETICS'
  ) {
    // Cosmetics have huge perceived value & margin
    baseCompetitorMinMultiplier = 4.2;
    baseCompetitorAvgMultiplier = 6.2;
    baseCompetitorMaxMultiplier = 8.5;
  } else if (
    titleLower.includes('electr') ||
    titleLower.includes('hachoir') ||
    titleLower.includes('robot') ||
    titleLower.includes('aspirat') ||
    options.niche === 'KITCHEN'
  ) {
    // Small appliances have higher wholesale, lower multiplier
    baseCompetitorMinMultiplier = 2.8;
    baseCompetitorAvgMultiplier = 3.8;
    baseCompetitorMaxMultiplier = 5.0;
  } else if (
    titleLower.includes('semelle') ||
    titleLower.includes('postur') ||
    titleLower.includes('genou') ||
    titleLower.includes('dos') ||
    options.niche === 'HEALTH'
  ) {
    // Health problem-solvers
    baseCompetitorMinMultiplier = 3.8;
    baseCompetitorAvgMultiplier = 5.8;
    baseCompetitorMaxMultiplier = 7.5;
  }

  // Minimum threshold floor based on shipping & market realism
  let compMinFloor = shipping * 3.5;
  let compAvgFloor = shipping * 5.5;
  let compMaxFloor = shipping * 8.0;

  if (country === 'MA') {
    compMinFloor = Math.max(149, wholesale * 3.2);
    compAvgFloor = Math.max(229, wholesale * 4.6);
    compMaxFloor = Math.max(299, wholesale * 6.5);
  } else if (country === 'GCC') {
    compMinFloor = Math.max(129, wholesale * 3.5);
    compAvgFloor = Math.max(199, wholesale * 4.8);
    compMaxFloor = Math.max(299, wholesale * 6.8);
  } else if (country === 'SN') {
    compMinFloor = Math.max(12500, wholesale * 3.2);
    compAvgFloor = Math.max(17500, wholesale * 4.5);
    compMaxFloor = Math.max(24500, wholesale * 6.0);
  }

  // 2. Compute Competitor Price Range
  const rawCompMin = Math.max(compMinFloor, wholesale * baseCompetitorMinMultiplier);
  const rawCompAvg = Math.max(compAvgFloor, wholesale * baseCompetitorAvgMultiplier);
  const rawCompMax = Math.max(compMaxFloor, wholesale * baseCompetitorMaxMultiplier);

  const competitorMin = roundToPsychologicalPrice(rawCompMin, country);
  const competitorAvg = roundToPsychologicalPrice(rawCompAvg, country);
  const competitorMax = roundToPsychologicalPrice(rawCompMax, country);

  // 3. Determine Recommended Retail Selling Price
  // Strategy: undercut the competitor average by 8% to 15% to win the CTR & conversion battle,
  // but ensure a healthy safety margin (at least 3.8x to 4.5x wholesale in MAD).
  let targetRetail = competitorAvg * 0.90; // 10% below competitor average
  const safeFloor = wholesale * 3.6 + shipping;
  if (targetRetail < safeFloor) {
    targetRetail = Math.max(safeFloor, competitorMin);
  }

  const recommendedRetailPrice = roundToPsychologicalPrice(targetRetail, country);

  const competitiveDiscountVsAvg = competitorAvg > recommendedRetailPrice
    ? Math.round(((competitorAvg - recommendedRetailPrice) / competitorAvg) * 100)
    : 0;

  // 4. COD Multiplier & Status
  const codMultiplier = Number((recommendedRetailPrice / wholesale).toFixed(1));
  let multiplierStatus: 'EXCELLENT' | 'ACCEPTABLE' | 'RISKY' = 'ACCEPTABLE';
  let multiplierVerdictAr = '';
  let multiplierVerdictFr = '';

  if (codMultiplier >= 4.2) {
    multiplierStatus = 'EXCELLENT';
    multiplierVerdictAr = `مضاعف سعري ممتاز (${codMultiplier}x) يوفر هامش أمان عريض لتحمل تكلفة مزادات الإعلانات على تيك توك وفيسبوك بدون أي قلق.`;
    multiplierVerdictFr = `Excellent multiplicateur (${codMultiplier}x). Marge confortable protégeant vos enchères publicitaires.`;
  } else if (codMultiplier >= 3.3) {
    multiplierStatus = 'ACCEPTABLE';
    multiplierVerdictAr = `مضاعف سعري متوازن (${codMultiplier}x) كافي لتحقيق أرباح جيدة، مع ضرورة التركيز على باقة القطعتين (Pack Duo) لرفع متوسط السلة.`;
    multiplierVerdictFr = `Multiplicateur sain (${codMultiplier}x). Suffisant pour la rentabilité, privilégiez le Pack Duo pour sécuriser le panier.`;
  } else {
    multiplierStatus = 'RISKY';
    multiplierVerdictAr = `مضاعف سعري ضعيف (${codMultiplier}x). خطر استنزاف الميزانية في الإعلانات بسبب مصاريف الشحن والمرتجعات. ننصح بالتفاوض على سعر الجملة أو بيع عبوتين كحد أدنى.`;
    multiplierVerdictFr = `Multiplicateur risqué (${codMultiplier}x). La marge brute risque d’être absorbée par les coûts publicitaires et retours.`;
  }

  // 5. Anti-Loss Calculations: Break-Even CPA & Target Sweet Spot
  // Break-even CPA formula: [ (Retail - Wholesale) * DeliveryRate - ShippingFee ] * ConfirmationRate
  const grossMargin = recommendedRetailPrice - wholesale;
  const netMarginPerShipped = grossMargin * delivRate - shipping;
  const antiLossPlafondCpa = Math.max(country === 'SN' ? 1000 : 5, Math.round(netMarginPerShipped * confRate));

  // Sweet spot: 38% - 58% of Break-Even CPA for 40%+ Net ROI
  const idealTargetCpaMin = Math.max(country === 'SN' ? 1500 : 10, Math.round(antiLossPlafondCpa * 0.38));
  const idealTargetCpaMax = Math.max(country === 'SN' ? 2500 : 15, Math.round(antiLossPlafondCpa * 0.58));

  const expectedMarginPercent = Math.round((grossMargin / recommendedRetailPrice) * 100);

  // 6. Bundle Strategy (Pack 1, Pack 2 Duo Star, Pack 3)
  // Pack 1 Net Profit per delivered:
  const assumedCpaPack1 = idealTargetCpaMax;
  const netProfitPack1 = Math.round(grossMargin - shipping - (assumedCpaPack1 / (confRate * delivRate)));

  // Pack 2: Price is approx 1.55x - 1.65x single retail, free shipping
  const rawPack2Price = recommendedRetailPrice * 1.60;
  const pack2Price = roundToPsychologicalPrice(rawPack2Price, country);
  const pack2Wholesale = wholesale * 2;
  const pack2Gross = pack2Price - pack2Wholesale;
  // Crucial COD fact: Shipping is still 1 package (shipping fee is identical!), CPA per lead is virtually identical
  const netProfitPack2 = Math.round(pack2Gross - shipping - (assumedCpaPack1 / (confRate * delivRate)));
  const pack2Savings = (recommendedRetailPrice * 2) - pack2Price;
  const pack2SavingsPercent = Math.round((pack2Savings / (recommendedRetailPrice * 2)) * 100);
  const pack2Boost = netProfitPack1 > 0 ? Math.round(((netProfitPack2 - netProfitPack1) / netProfitPack1) * 100) : 80;

  // Pack 3: Price is approx 2.2x single retail
  const rawPack3Price = recommendedRetailPrice * 2.20;
  const pack3Price = roundToPsychologicalPrice(rawPack3Price, country);
  const pack3Wholesale = wholesale * 3;
  const pack3Gross = pack3Price - pack3Wholesale;
  const netProfitPack3 = Math.round(pack3Gross - shipping - (assumedCpaPack1 / (confRate * delivRate)));
  const pack3Savings = (recommendedRetailPrice * 3) - pack3Price;
  const pack3SavingsPercent = Math.round((pack3Savings / (recommendedRetailPrice * 3)) * 100);
  const pack3Boost = netProfitPack1 > 0 ? Math.round(((netProfitPack3 - netProfitPack1) / netProfitPack1) * 100) : 150;

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
      packNameAr: 'باك الثنائي (2 قطع) - الأكثر طلباً ⭐',
      packNameFr: 'Pack Duo Best-Seller (2 Unités) ⭐',
      price: pack2Price,
      savingsAmount: pack2Savings,
      savingsPercent: pack2SavingsPercent,
      isStarOffer: true,
      unitPrice: Math.round(pack2Price / 2),
      estimatedNetProfit: netProfitPack2,
      profitBoostPercent: Math.max(25, pack2Boost),
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
      profitBoostPercent: Math.max(50, pack3Boost),
    },
  ];

  // 7. Overall Decision
  let verdictDecision: 'GO' | 'CONDITIONAL' | 'NO_GO' = 'GO';
  let verdictTitleAr = '🟢 مؤهل بقوة للإطلاق الإعلاني (Green Light)';
  let verdictTitleFr = '🟢 Feu Vert - Prêt pour le Lancement Ads';
  let verdictBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';

  if (multiplierStatus === 'RISKY' || antiLossPlafondCpa < (country === 'SN' ? 1500 : 25)) {
    verdictDecision = 'NO_GO';
    verdictTitleAr = '🛑 غير مؤهل للإطلاق بهذا السعر (خطر احتراق الميزانية)';
    verdictTitleFr = '🛑 Stop - Marge insuffisante pour couvrir la pub';
    verdictBadgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
  } else if (multiplierStatus === 'ACCEPTABLE') {
    verdictDecision = 'CONDITIONAL';
    verdictTitleAr = '🟡 إطلاق مشروط بالاعتماد على الباقة المزدوجة (Pack Duo)';
    verdictTitleFr = '🟡 Lancement Conditionné au Pack Duo';
    verdictBadgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
  }

  // 8. Practical Anti-Loss Actionable Advice
  const antiLossAdviceAr = [
    `🛡️ قاعدة كسر الخسارة (Kill Rule الصارمة): سقف تكلفة الطلب (CPA) هو ${antiLossPlafondCpa} ${currencySymbol}. إذا صرف أي إعلان ضعف هذا السقف دون طلبات، أوقفه فوراً لحماية أرباحك.`,
    `👻 اختبار الشبح السريع (Ghost Testing): قبل أن تشتري كرتونة أو كمية من درب عمر أو المورد، شغل إعلاناً تجريبياً بـ ${ghostTestBudget} ${currencySymbol} لمدة 24-48 ساعة. إذا جاءت 3 إلى 5 طلبات بتكلفة أقل من ${idealTargetCpaMax} ${currencySymbol}، حينها فقط اذهب لشراء السلعة مطمئناً!`,
    `📦 اجعل "باك 2" (قطعتين بسعر ${pack2Price} ${currencySymbol}) هو العرض الافتراضي المسبق التحديد في صفحة الهبوط، لأنه يرفع صافي ربحك بنسبة +${Math.max(35, pack2Boost)}% ويوفر نفس تكلفة شحنة واحدة (${shipping} ${currencySymbol}).`,
    `📞 المكالمة الأولى في أول 15 دقيقة: تأكيد الطلبات فور وصولها يرفع نسبة التسليم من 65% إلى 85% ويحمي أموالك من تكاليف الروتور.`,
  ];

  const antiLossAdviceFr = [
    `🛡️ Règle d’arrêt stricte (Kill Rule) : Votre CPA plafond est de ${antiLossPlafondCpa} ${currencySymbol}. Tout adset dépassant cette limite sans conversion rentable doit être coupé immédiatement.`,
    `👻 Ghost Testing avant achat de stock : Lancez un test publicitaire de ${ghostTestBudget} ${currencySymbol} sur 24-48h AVANT d’acheter les cartons chez le grossiste. Si vous obtenez 3-5 leads sous ${idealTargetCpaMax} ${currencySymbol}, achetez le stock sereinement.`,
    `📦 Mettez le Pack Duo (${pack2Price} ${currencySymbol}) en option pré-cochée sur la page de commande : les frais de port restent uniques (${shipping} ${currencySymbol}) et votre marge nette bondit de +${Math.max(35, pack2Boost)}%.`,
    `📞 Confirmation rapide sous 15 min : Réduit drastiquement les refus de livraison et sécurise vos encaissements réels.`,
  ];

  const psychologicalAdvantageAr = competitiveDiscountVsAvg > 0
    ? `سعر ${recommendedRetailPrice} ${currencySymbol} أقل بـ ${competitiveDiscountVsAvg}% من متوسط المنافسين (${competitorAvg} ${currencySymbol})، مما يمنح إعلانك جاذبية فورية ومعدل نقر عالي (CTR)، مع الحفاظ على هامش ربح ممتاز (${expectedMarginPercent}% هامش إجمالي).`
    : `سعر ${recommendedRetailPrice} ${currencySymbol} يقع في النطاق الذهبي التنافسي للطلب العفوي (Impulse Buy) مع هامش ربح إجمالي ${expectedMarginPercent}%.`;

  const psychologicalAdvantageFr = competitiveDiscountVsAvg > 0
    ? `Ce prix de ${recommendedRetailPrice} ${currencySymbol} est ${competitiveDiscountVsAvg}% plus compétitif que la moyenne du marché (${competitorAvg} ${currencySymbol}), assurant un CTR élevé tout en préservant une marge brute de ${expectedMarginPercent}%.`
    : `Ce prix de ${recommendedRetailPrice} ${currencySymbol} optimise la conversion d’achat impulsif avec une marge brute saine de ${expectedMarginPercent}%.`;

  return {
    wholesalePrice: wholesale,
    targetCountry: country,
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

import { parseRadarProducts, radarFormat, radarInstructions } from './radarResearch';
import { radarReferences } from './radarProducts';
import type { RadarFilter, RadarProduct } from './radarProducts';
import { analyzeProductDetails } from './marketingAi';
import { calculateCompetitivePricing } from './competitivePricing';

export interface Citation {
  title: string;
  url: string;
  start_index: number;
  end_index: number;
}

import { cleanLatexAndFormat } from './cleanLatex';
export { cleanLatexAndFormat };

export interface ResearchReport {
  text: string;
  citations: Citation[];
  products?: RadarProduct[];
}

export type CopywritingTone = 'AGGRESSIVE' | 'MEDICAL_AUTHORITY' | 'UGC_VIRAL' | 'BUNDLE_OFFER';

function generateTenWinningHooks(title: string, isAr: boolean) {
  if (isAr) {
    return [
      { type: 'صدمة وفضول 🤯', text: `هادشي علاش أكثر من 3,500 مغربي كيشريو ${title} هاد السيمانة بالذات!` },
      { type: 'صدمة وفضول 🤯', text: `شوف الفرق الخيالي بعينيك فـ 5 ثواني... بلا فلاتر وبلا كذوب!` },
      { type: 'تحريك الألم المباشر 🛑', text: `واش حتى نتا عييتي وضيعتي فلوس صحيحة فحلول ما عطاتك حتى نتيجة؟` },
      { type: 'تحريك الألم المباشر 🛑', text: `إلى كان عندك مشكل مع هاد الأمر، حبس كلشي ودقيقة من وقتك تقدر تبدل حياتك!` },
      { type: 'فضح الطرق القديمة 💥', text: `ماشي نتا لي فيك الديفو، المشكل فـ الطرق القديمة والمغشوشة لي كتروج فالسوق...` },
      { type: 'فضح الطرق القديمة 💥', text: `بلا ما تضيع 2000 درهم عند حلول مبالغ فيها، شوف البديل الذكي والأصلي!` },
      { type: 'عرض مغري واستعجال ⏳', text: `عرض 48 ساعة فقط: خود 1 بخصم خاص، أو خود 2 والتوصيل فابور حتى لباب دارك!` },
      { type: 'عرض مغري واستعجال ⏳', text: `الدفعة الأولى سالات كاملة فـ يومين! جبنا دفعة جديدة وباقي منها غير 25 حبة بهاد السعر!` },
      { type: 'ضمان صفر مخاطرة 🛡️', text: `ما غتخسر حتى ريال: السلعة كتوصلك، حل الباكية قدام اللفور وتأكد بعينيك عاد خلص!` },
      { type: 'دليل اجتماعي قوي ⭐', text: `شوفو معايا شنو قالو الزبناء لي جربو ${title} لأول مرة وعلاش كولشي كيشكرو!` },
    ];
  }
  return [
    { type: 'Curiosité / Choc 🤯', text: `Voici pourquoi plus de 3 500 personnes s'arrachent ${title} cette semaine !` },
    { type: 'Curiosité / Choc 🤯', text: `Regardez la transformation incroyable en seulement 5 secondes chrono !` },
    { type: 'Douleur / Frustration 🛑', text: `Vous en avez marre de dépenser des fortunes dans des solutions inefficaces ?` },
    { type: 'Douleur / Frustration 🛑', text: `Si vous souffrez de ce problème au quotidien, arrêtez tout et regardez ceci !` },
    { type: 'Alternatives défaillantes 💥', text: `Le problème ne vient pas de vous, mais des méthodes dépassées vendues sur le marché...` },
    { type: 'Alternatives défaillantes 💥', text: `Inutile de jeter votre argent par les fenêtres, voici enfin l'alternative durable.` },
    { type: 'Offre Irrésistible ⏳', text: `Offre Flash 48h : 1 acheté + le 2ème à moitié prix avec livraison 100% offerte !` },
    { type: 'Offre Irrésistible ⏳', text: `Rupture imminente : seulement 25 pièces encore disponibles à ce tarif promotionnel !` },
    { type: 'Zéro Risque / COD 🛡️', text: `Zéro risque : vous inspectez votre colis à la livraison avant de payer le moindre centime !` },
    { type: 'Preuve Sociale ⭐', text: `Découvrez les avis sans filtre de nos clients après avoir testé ${title} !` },
  ];
}

function generateMultiPlatformCopies(title: string, currency: string, isAr: boolean) {
  if (isAr) {
    return {
      tikTok: `🔥 النتيجة لي كيهضر عليها الجميع دابا!
وداعاً للعناء مع ${title} الأصلي.
🚚 التوصيل بالمجان لجميع المدن + الدفع بعد المعاينة عند الاستلام!
⚡ سارع بالطلب الآن، العرض الترويجي محدود جداً!
👉 اضغط على الرابط أسفله للطلب فوراً قبل نفاد الكمية!`,
      facebook: `⚠️ واش حتى نتا عييتي من المشاكل اليومية وضياع الفلوس فحلول عادية؟

إليك الحل المبتكر والنهائي لي خلا آلاف الزبناء يرتاحو ويتهناو من أول استعمال: ${title} الأصلي!

لماذا يختاره الجميع؟
✅ نتيجة فعالة وملحوظة من أول تجربة
✅ جودة أصلية ممتازة ومضمونة 100%
✅ سهل وعملي جداً في الاستخدام اليومي
✅ آمن تماماً وبدون أي تعقيدات

🎁 عرض خاص لهذا الأسبوع فقط:
خصم استثنائي عند اختيار باقة القطعتين + التوصيل مجاني وسريع حتى لباب دارك!

🛡️ ضمان الراحة والثقة الكاملة:
ما كتخلص حتى كيوصلك الكولي حتى ليدك، فتح وتأكد من الجودة بنفسك عاد خلص!

👇 اضغط على الزر أسفله للطلب الآن، الكمية المتبقية محدودة جداً!`,
      whatsApp: `مرحباً بك! 👋
بخصوص اهتمامك بـ ${title}، بغينا نعلموك بلي باقة العرض الخاص راه محجوزة باسمك دابا!
🎁 عرض اليوم الاستثنائي: إلى أكدتي دابا غادي تستافد من توصيل مجاني سريع حتى لباب الدار + هدية خاصة!
واش نرسلو ليك الطلبية ديالك اليوم؟ جاوبنا بـ "نعم" لتأكيد الإرسال فوراً 🚚`,
    };
  }
  return {
    tikTok: `🔥 Le résultat dont tout le monde parle !
Dites adieu aux tracas grâce à ${title}.
🚚 Livraison gratuite à domicile + Paiement à la réception après vérification !
👉 Cliquez sur le lien ci-dessous pour commander avant rupture !`,
    facebook: `⚠️ Vous en avez assez de perdre votre temps et votre argent dans des méthodes inefficaces ?

Découvrez la solution innovante adoptée par des milliers de clients satisfaits : ${title} !

Pourquoi tout le monde se l'arrache :
✅ Efficacité visible dès les premières utilisations
✅ Qualité premium certifiée
✅ Pratique, durable et facile à utiliser au quotidien

🎁 Offre Exclusive cette semaine :
Profitez de notre remise spéciale Pack Duo avec livraison 100% offerte chez vous !

🛡️ Garantie totale Zéro Risque :
Vous ne payez rien à l'avance ! Vous vérifiez votre colis à la livraison avant d'effectuer le paiement.

👇 Cliquez ci-dessous pour commander votre pack maintenant !`,
    whatsApp: `Bonjour ! 👋
Concernant votre commande pour ${title}, votre pack promotionnel est actuellement réservé à votre nom !
🎁 Confirmez maintenant pour bénéficier de la livraison offerte express directement à domicile.
Souhaitez-vous que nous expédions votre colis dès aujourd'hui ? Répondez OUI pour validation immédiate 🚚`,
  };
}

function generateFallbackAuditReport(input: {
  target: string;
  source: string;
  product: string;
  language: 'ar' | 'fr';
  tone?: CopywritingTone;
  wholesalePrice?: number;
  retailPrice?: number;
  shippingFee?: number;
}): ResearchReport {
  const isAr = input.language === 'ar';
  const lines = input.product.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0] || 'Produit COD';
  const details = lines.slice(1).join(' ');

  let targetCountry: string = 'MA';
  if (/saudi|ksa|gcc|الخليج|السعودية/i.test(input.target)) targetCountry = 'GCC';
  else if (/senegal|sn|السنغال/i.test(input.target)) targetCountry = 'SN';
  else if (/france|fr|europe/i.test(input.target)) targetCountry = 'FR';
  else if (/us|usa|united states|أمريكا/i.test(input.target)) targetCountry = 'US';
  else if (!/maroc|morocco|ma|المغرب/i.test(input.target)) targetCountry = 'GLOBAL';

  const wholesale = typeof input.wholesalePrice === 'number' && input.wholesalePrice > 0 ? input.wholesalePrice : 35;
  const defaultShip = targetCountry === 'SN' ? 2500 : (targetCountry === 'GCC' ? 25 : (targetCountry === 'US' || targetCountry === 'FR' ? 5 : 35));
  const shipping = typeof input.shippingFee === 'number' && input.shippingFee > 0 ? input.shippingFee : defaultShip;

  const compPricing = calculateCompetitivePricing({
    wholesalePrice: wholesale,
    retailPrice: typeof input.retailPrice === 'number' && input.retailPrice > 0 ? input.retailPrice : undefined,
    title,
    targetCountry,
    shippingFee: shipping,
  });

  const titleLower = title.toLowerCase();
  const isSingleAppliance =
    titleLower.includes('masseur') ||
    titleLower.includes('massage') ||
    titleLower.includes('pistolet') ||
    titleLower.includes('مساج') ||
    titleLower.includes('تدليك') ||
    titleLower.includes('hachoir') ||
    titleLower.includes('chopper') ||
    titleLower.includes('mixeur') ||
    titleLower.includes('robot') ||
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
    titleLower.includes('drone');

  const effectiveRetail = typeof input.retailPrice === 'number' && input.retailPrice > 0 ? input.retailPrice : compPricing.recommendedRetailPrice;

  const analysis = analyzeProductDetails({
    title,
    ingredientsOrDetails: details,
    targetCountry,
    wholesalePrice: wholesale,
    retailPrice: effectiveRetail,
    shippingFee: shipping,
  });

  const hooks = generateTenWinningHooks(analysis.productTitle, isAr);
  const platformCopies = generateMultiPlatformCopies(analysis.productTitle, analysis.currency, isAr);
  const pack2 = compPricing.recommendedBundlePacks[1];
  const pack3 = compPricing.recommendedBundlePacks[2];

  let salesPredictionAr = '';
  let salesPredictionFr = '';

  if (compPricing.verdictDecision === 'GO') {
    salesPredictionAr = `✅ نعم، مؤهل بقوة لتحقيق مبيعات ممتازة في ${compPricing.targetCountryNameAr}!
المنتج يحل مشكلة يومية واضحة وملموسة ويحفز الشراء العفوي (Impulse Buying). عند إطلاق حملة باستهداف مفتوح (Broad) مع 3 فيديوهات إعلانية بالدارجة تركز على الألم والنتيجة الفورية، يُتوقع تحقيق بين 15 إلى 45 طلبية مؤكدة يومياً في مرحلة التوسيع (Scaling) بتكلفة ليد (Target CPA) بين ${compPricing.idealTargetCpaMin} و ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}.`;
    salesPredictionFr = `✅ Oui, très fort potentiel de ventes sur le ${compPricing.targetCountryNameFr} !
Le produit résout un problème quotidien concret et déclenche l'achat impulsif. Volume estimé entre 15 et 45 commandes confirmées/jour en phase de scale avec un CPA cible entre ${compPricing.idealTargetCpaMin} et ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}.`;
  } else if (compPricing.verdictDecision === 'CONDITIONAL') {
    salesPredictionAr = `🟡 قابل لتحقيق مبيعات، ولكن بشرط الالتزام الصارم باستراتيجية الباقات!
المنتج عليه طلب في السوق، ولكن هامش ربح القطعة الواحدة (${effectiveRetail} ${compPricing.currencySymbol}) قد يكون معرضاً لضغط مصاريف الإعلانات والتوصيل. لتحقيق أرباح ممتازة وتفادي أي خسارة، يجب جعل "باك 2" بسعر ${pack2?.price} ${compPricing.currencySymbol} هو الخيار الافتراضي في صفحة الطلب لرفع سلة الشراء.`;
    salesPredictionFr = `🟡 Ventes réalisables mais conditionnées au Pack Duo !
Il y a de la demande sur le marché, mais la marge unitaire risque d'être juste. Proposez impérativement le Pack 2 (${pack2?.price} ${compPricing.currencySymbol}) pour sécuriser votre rentabilité.`;
  } else {
    salesPredictionAr = `🛑 تحذير: مخاطرة عالية بخسارة الميزانية الإعلانية!
سعر الشراء الحالي (${wholesale} ${compPricing.currencySymbol}) مرتفع جداً مقارنة بسعر البيع الممكن في ${compPricing.targetCountryNameAr}. مصاريف التوصيل (${shipping} ${compPricing.currencySymbol}) والروتور ستلتهم أي هامش ربح متبقي. لا ننصح بإطلاق إعلانات بهذا السعر قبل خفض سعر الجملة مع المورد.`;
    salesPredictionFr = `🛑 Risque élevé de perte publicitaire !
Coût d'achat trop élevé par rapport au prix de vente acceptable sur le marché. Les frais de port et retours absorberont toute votre marge.`;
  }

  let reportText = '';
  if (isAr) {
    reportText = `🔍 تقرير فحص واستشارة السوق الإعلاني الشامل: ${analysis.productTitle} (${analysis.targetCountryFlag} ${compPricing.targetCountryNameAr})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. تقييم قابلية تحقيق المبيعات في السوق المستهدف:
• هل سيحقق المنتج مبيعات حقيقية؟
${salesPredictionAr}
• تقدير حجم الطلب اليومي:
  - مرحلة الاختبار الأولي (Testing): 3 إلى 7 طلبات يومياً.
  - مرحلة التوسيع (Scaling): 15 إلى 45+ طلبية مؤكدة يومياً عند ضبط الزوايا الإعلانية.
• تحليل حركة السوق والطلب المحلي: ${analysis.marketDemandAnalysisAr}

💰 2. كشف الحسابات المالية الدقيقة وهامش الأمان الإعلاني (Économie COD):
• سعر الشراء من الجملة (Sourcing): ${compPricing.wholesalePrice} ${compPricing.currencySymbol}
• نطاق أسعار المنافسين في السوق المحلي:
  - أرخص منافس (سعر كسر السوق): ${compPricing.competitorMin} ${compPricing.currencySymbol}
  - متوسط السوق (الأكثر انتشاراً): ${compPricing.competitorAvg} ${compPricing.currencySymbol}
  - أعلى سعر (براندات فاخرة): ${compPricing.competitorMax} ${compPricing.currencySymbol}
• سعر البيع التنافسي الموصى به لكسر المنافسين: ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol} (أقل بـ ${compPricing.competitiveDiscountVsAvg}% من متوسط المنافسين لجلب أعلى نقرات ومبيعات)
• الهامش الإجمالي الأولي: ${compPricing.expectedMarginPercent}% (+${compPricing.recommendedRetailPrice - compPricing.wholesalePrice} ${compPricing.currencySymbol})
• مصاريف التوصيل التقديرية: ${shipping} ${compPricing.currencySymbol}
• سقف تكلفة الطلب الصارم (Plafond Break-Even CPA - Kill Rule): ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol} (أي سنتيم فوق هذا السقف = خسارة صافية، أوقف الإعلان فوراً!)
• النطاق الذهبي للـ Target CPA (لتحقيق ربح صافي > 40%): ${compPricing.idealTargetCpaMin} - ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}
• استراتيجية عروض البيع (Offer & Pricing Strategy):
${isSingleAppliance
  ? `  - العرض الأساسي (قطعة واحدة): ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}
  - تنبيه استراتيجي: هذا جهاز فردي، الزبون يشتري قطعة واحدة فقط لنفسه؛ لا تعتمد على باقة قطعتين لنفس الجهاز لتعويض ضعف الهامش الربحي! لرفع قيمة السلة، قدم بيعاً تكميلياً (Cross-sell: جهاز + زيت تدليك أو إكسسوار إضافي بسعر رمزي).`
  : `  - باك 1 (قطعة واحدة): ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}
  - باك 2 (قطعتين - Best Seller ⭐): ${pack2?.price || Math.round(compPricing.recommendedRetailPrice * 1.55)} ${compPricing.currencySymbol} (يوفر للزبون ${pack2?.savingsAmount || 0} ${compPricing.currencySymbol} ويرفع أرباحك الصافية بـ +${pack2?.profitBoostPercent || 50}%)
  - باك 3 (3 قطع - عائلي VIP): ${pack3?.price || Math.round(compPricing.recommendedRetailPrice * 2.15)} ${compPricing.currencySymbol}`}
• ميزانية اختبار الشبح (Ghost Test): ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} (~15$) لاختبار الإقبال 24-48 ساعة قبل شراء أي كرتونة ستوك.

💪 3. نقاط القوة والمزايا التنافسية الكبرى:
${analysis.strengthsAr.map((s) => '• ' + s).join('\n')}

⚠️ 4. مخاوف واعتراضات الزبائن والحلول لنسفها:
${analysis.challengesAr.concat(analysis.regulatoryAndSafetyTipsAr).map((c) => '• ' + c).join('\n')}

🎣 5. باقة الـ 10 رؤوس إعلانية الأكثر جذباً (10 Winning Hooks Pack):
${hooks.map((h, i) => `${i + 1}. [${h.type}] : "${h.text}"`).join('\n')}

📱 6. نصوص إعلانية عدوانية جاهزة حسب المنصة (Multi-Platform Copy):
📌 [TikTok & Reels Ads - كليكات سريعة]:
${platformCopies.tikTok}

📌 [Facebook Feed Ads - بيع مباشر وقصة مقنعة]:
${platformCopies.facebook}

📌 [WhatsApp Retargeting - استرجاع السلات المهجورة]:
${platformCopies.whatsApp}

🎬 7. زوايا تسويقية وسيناريوهات إعلانية (UGC Hooks & Scripts):
${analysis.marketingAngles.map((a, i) => `
📌 الزاوية ${i + 1}: ${a.angleNameAr}
• الـ Hook (أول 3 ثوانٍ): "${a.hook3sAr}"
• العرض والحل (Pitch): "${a.mainPitchAr}"
• الدعوة للشراء (CTA): "${a.callToActionAr}"
• السكريبت الكامل المقترح:
"${a.fullScriptAr}"
• نص الإعلان المكتوب:
${a.adCopyTextAr}
`).join('\n')}

🚀 8. خطة إطلاق الحملات وقواعد الـ Kill & Scale والاستهداف:
• الهيكل المقترح: ${analysis.launchStrategy.suggestedStructure}
• قاعدة إيقاف الإعلان الخاسر (Kill Rule): إذا وصل صرف أي إعلان إلى ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol} دون تحقيق أي مبيعة، أوقفه فوراً لحماية أرباحك.
• قاعدة مضاعفة الميزانية (Scale Rule): أي AdSet يحقق CPA أقل من ${compPricing.idealTargetCpaMin} ${compPricing.currencySymbol} مع 3 مبيعات، ارفع ميزانيته بنسبة 20% كل 48 ساعة.
• الشريحة المستهدفة: ${analysis.targeting.ageRange} (الجمهور: ${analysis.targeting.recommendedGender === 'ALL' ? 'رجال ونساء' : analysis.targeting.recommendedGender === 'WOMEN' ? 'نساء فقط' : 'رجال فقط'})
• المدن ذات الأولوية وأعلى معدل توصيل: ${analysis.targeting.priorityCities.join('، ')}
• مناطق ينصح باستثنائها في البداية: ${analysis.targeting.excludedZones.join('، ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 9. الخلاصة التنفيذية والقرار النهائي: واش المنتج WINNER تخدم عليه ولا لا؟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• قرار الخبير الفاصل:
  ${compPricing.verdictTitleAr}
• مؤشر الربحية والمنافسة: ${analysis.overallScore}/100 [${analysis.scoreLabel}]
• مؤشر مضاعف السعر المحلي: ${compPricing.codMultiplier}x (${compPricing.multiplierVerdictAr})

🎯 التوصية الصريحة للميديا باير:
${compPricing.verdictDecision === 'GO' ? '🚀 نعم، المنتج يعتبر WINNER حقيقي ومناسب جداً للبدء فوراً. هامش الأمان الإعلاني عريض ويحميك من ارتفاع أسعار المزادات.' : compPricing.verdictDecision === 'CONDITIONAL' ? (isSingleAppliance ? '⚡ المنتج WINNER مشروط: نظراً لأنه جهاز فردي، لا تعتمد على بيع قطعتين من نفس الجهاز. تأكد من أن هامش القطعة الواحدة يغطي الإعلانات أو ارفع السعر قليلاً لضمان الربح.' : '⚡ المنتج WINNER مشروط: لا تبعه كقطعة منفردة، بل ركز حملاتك على عرض "باك 2" (قطعتين وتوصيل مجاني) لضمان الربح وتفادي تضييع الميزانية.') : '🛑 المنتج خاسر (LOSER) بهذا السعر: ابتعد عنه حالياً أو ابحث عن مورد بسعر جملة أقل، لأنك ستخسر أموالك في الإعلانات بدون هامش أمان كافٍ.'}

📋 خطة العمل الفورية فـ 3 خطوات عملية (Action Plan):
1. [تصوير الإعلانات]: جهز 3 فيديوهات UGC بالدارجة تعتمد على الـ Hooks المذكورة في التقرير (زاوية حل المشكلة + زاوية الصدمة والنتيجة + زاوية ${isSingleAppliance ? 'الضمان وتجربة المنتج' : 'باقة القطعتين'}).
2. [اختبار الشبح السريع Ghost Test]: أطلق حملة اختبار بميزانية ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} (~15$) لمدة 24-48 ساعة قبل شراء أي كرتونة ستوك.
3. [قاعدة الـ Kill الصارمة]: إذا وصل صرف أي إعلان إلى ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol} بدون مبيعات، أوقفه فوراً لحماية رأس مالك.`;
  } else {
    reportText = `🔍 RAPPORT D'EXPERTISE MARCHÉ & AUDIT COMPLET DU PRODUIT : ${analysis.productTitle} (${analysis.targetCountryFlag} ${compPricing.targetCountryNameFr})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. Évaluation du Potentiel & Prédiction des Ventes :
• Le produit va-t-il générer des ventes réelles ?
${salesPredictionFr}
• Volume de commandes estimé :
  - Phase de test : 3 à 7 commandes / jour.
  - Phase de scale : 15 à 45+ commandes confirmées / jour avec les bons angles vidéos.
• Analyse du marché local : ${analysis.marketDemandAnalysisFr || analysis.marketDemandAnalysisAr}

💰 2. Économie COD Détaillée & Bouclier Anti-Perte (Chiffres Clés) :
• Coût d'achat grossiste (Sourcing) : ${compPricing.wholesalePrice} ${compPricing.currencySymbol}
• Fourchette des prix concurrents sur le marché local :
  - Prix plancher concurrent : ${compPricing.competitorMin} ${compPricing.currencySymbol}
  - Prix moyen du marché : ${compPricing.competitorAvg} ${compPricing.currencySymbol}
  - Prix max (haut de gamme) : ${compPricing.competitorMax} ${compPricing.currencySymbol}
• Prix de vente recommandé : ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol} (${compPricing.competitiveDiscountVsAvg}% plus compétitif que la moyenne pour maximiser le CTR)
• Marge brute unitaire : ${compPricing.expectedMarginPercent}% (+${compPricing.recommendedRetailPrice - compPricing.wholesalePrice} ${compPricing.currencySymbol})
• Frais de livraison estimés : ${shipping} ${compPricing.currencySymbol}
• CPA Plafond Seuil (Kill Rule stricte) : ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol} (Au-delà, perte nette immédiate)
• Fourchette CPA cible idéale (> 40% ROI net) : ${compPricing.idealTargetCpaMin} - ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}
• Stratégie des Packs & Offres Commerciales :
${isSingleAppliance
  ? `  - Offre Standard (1 Unité) : ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}
  - Alerte Stratégique : Appareil individuel, le client n'achète qu'une seule pièce pour lui-même ; ne comptez pas sur un Pack Duo identique pour compenser un manque de marge unitaire ! Privilégiez le Cross-sell (appareil + huile/accessoire).`
  : `  - Pack 1 (1 Unité) : ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}
  - Pack 2 (Duo Best-Seller ⭐) : ${pack2?.price || Math.round(compPricing.recommendedRetailPrice * 1.55)} ${compPricing.currencySymbol} (Économie client ${pack2?.savingsAmount || 0} ${compPricing.currencySymbol}, boost de marge nette +${pack2?.profitBoostPercent || 50}%)
  - Pack 3 (3 Unités VIP) : ${pack3?.price || Math.round(compPricing.recommendedRetailPrice * 2.15)} ${compPricing.currencySymbol}`}
• Budget Ghost Test recommandé : ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} (~15$) avant tout achat de stock.

💪 3. Forces & Avantages concurrentiels :
${(analysis.strengthsFr || analysis.strengthsAr).map((s) => '• ' + s).join('\n')}

⚠️ 4. Objections clients & Barrières levées :
${(analysis.challengesFr || analysis.challengesAr).concat(analysis.regulatoryAndSafetyTipsFr || analysis.regulatoryAndSafetyTipsAr).map((c) => '• ' + c).join('\n')}

🎣 5. Pack des 10 Accroches Gagnantes (10 Winning Hooks) :
${hooks.map((h, i) => `${i + 1}. [${h.type}] : "${h.text}"`).join('\n')}

📱 6. Textes Publicitaires Multi-Plateformes (Direct-Response Copies) :
📌 [TikTok & Reels Ads - Clics Rapides] :
${platformCopies.tikTok}

📌 [Facebook Feed Ads - Storytelling & Conversion] :
${platformCopies.facebook}

📌 [WhatsApp Retargeting - Relance Paniers Abandonnés] :
${platformCopies.whatsApp}

🎬 7. Angles marketing & Scripts UGC :
${analysis.marketingAngles.map((a, i) => `
📌 Angle ${i + 1} : ${a.angleNameFr || a.angleNameAr}
• Hook (0-3s) : "${a.hook3sFr || a.hook3sAr}"
• Pitch : "${a.mainPitchFr || a.mainPitchAr}"
• Appel à l'action : "${a.callToActionFr || a.callToActionAr}"
• Script UGC :
"${a.fullScriptFr || a.fullScriptAr}"
• Texte publicitaire :
${a.adCopyTextFr || a.adCopyTextAr}
`).join('\n')}

🚀 8. Stratégie de lancement et règles Kill/Scale :
• Structure recommandée : ${analysis.launchStrategy.suggestedStructureFr || analysis.launchStrategy.suggestedStructure}
• Règle de coupure (Kill) : Si les dépenses atteignent ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol} sans vente, coupez l'adset immédiatement.
• Règle de scale : Dès qu'un adset génère un CPA inférieur à ${compPricing.idealTargetCpaMin} ${compPricing.currencySymbol}, augmentez le budget de 20% toutes les 48h.
• Villes recommandées : ${analysis.targeting.priorityCities.join(', ')}
• Zones exclues : ${analysis.targeting.excludedZones.join(', ')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏁 9. Conclusion & Verdict Exécutif : Produit WINNER ou pas ?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Verdict de l'expert :
  ${compPricing.verdictTitleFr}
• Score de viabilité : ${analysis.overallScore}/100 [${analysis.scoreLabel}]
• Multiplicateur COD local : ${compPricing.codMultiplier}x (${compPricing.multiplierVerdictFr})

🎯 Recommandation finale Media Buyer :
${compPricing.verdictDecision === 'GO' ? '🚀 OUI, le produit est un WINNER avéré et prêt pour un lancement immédiat.' : compPricing.verdictDecision === 'CONDITIONAL' ? (isSingleAppliance ? '⚡ WINNER Conditionnel : Appareil individuel, validez la rentabilité sur la pièce unique avant de lancer.' : '⚡ WINNER Conditionnel : Ne vendez pas à l\'unité, basez toute votre offre sur le Pack Duo pour sécuriser la marge.') : '🛑 Produit non rentable (LOSER) à ce tarif grossiste. Négociez un prix plus bas ou passez à un autre produit.'}

📋 Plan d'action immédiat en 3 étapes :
1. Préparez 3 créatives UGC percutantes basées sur les accroches du rapport.
2. Lancez un Ghost Test avec un budget de ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} (~15$) avant tout engagement de stock.
3. Respectez strictement le CPA plafond de ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}.`;
  }

  const citations: Citation[] = [
    {
      title: isAr ? 'مكتبة إعلانات Meta النشطة (Ad Library)' : 'Bibliothèque publicitaire Meta',
      url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(title)}`,
      start_index: 0,
      end_index: 0,
    },
    {
      title: isAr ? 'إعلانات TikTok الشائعة (Creative Center)' : 'TikTok Creative Center',
      url: `https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en?keyword=${encodeURIComponent(title)}`,
      start_index: 0,
      end_index: 0,
    },
    {
      title: isAr ? 'موردي AliExpress و 1688 بالجملة' : 'Recherche grossistes AliExpress / 1688',
      url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(title)}`,
      start_index: 0,
      end_index: 0,
    },
    {
      title: isAr ? 'فحص المنتجات المنافسة عبر Google' : 'Recherche Google Concurrents',
      url: `https://www.google.com/search?q=${encodeURIComponent(title + ' achat prix maroc avis')}`,
      start_index: 0,
      end_index: 0,
    },
  ];

  return { text: reportText, citations };
}

// In-memory cache for market research to eliminate redundant OpenAI calls & token usage
const researchCache = new Map<string, { timestamp: number; data: ResearchReport }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours cache
const CACHE_VERSION = 'v8_strict_math';

export async function researchMarkets(input: {
  mode: 'scout' | 'audit';
  target: string;
  source: string;
  product: string;
  language: 'ar' | 'fr';
  category?: RadarFilter;
  tone?: CopywritingTone;
  wholesalePrice?: number;
  retailPrice?: number;
  shippingFee?: number;
  forceRefresh?: boolean;
}): Promise<ResearchReport> {
  const chosenTone = input.tone || 'AGGRESSIVE';
  // 1. Check cache first - saves 100% of tokens on repeated queries
  const cacheKey = `${CACHE_VERSION}:${input.mode}:${input.target}:${input.source}:${input.product.trim().toLowerCase()}:${input.category || 'ALL'}:${input.language}:${chosenTone}:${input.wholesalePrice || 0}:${input.retailPrice || 0}`;
  
  if (input.forceRefresh) {
    researchCache.delete(cacheKey);
  } else {
    const cached = researchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      // If Arabic was requested, ensure the cached report is actually in Arabic, otherwise invalidate
      if (input.language === 'ar' && cached.data.text && !/[\u0600-\u06FF]/.test(cached.data.text)) {
        researchCache.delete(cacheKey);
      } else {
        return cached.data;
      }
    }
  }

  const key = process.env.OPENAI_API_KEY;

  if (key) {
    try {
      const radarCategory = input.mode === 'scout' ? input.category : undefined;
      // Strictly use gpt-4o-mini for 95% cost savings; prevent any accidental expensive model usage
      const model = 'gpt-4o-mini';
      const isArabic = input.language === 'ar';

      let toneDescAr = 'نبرة الخطاب المطلوبة: عدوانية وقوية ومقنعة جداً بأسلوب البيع المباشر (Direct Response Copywriting). ركز على تحريك ألم العميل اليومي بشدة، تفكيك مخاوفه من النصب بضمان الدفع عند الاستلام بعد فتح الطرد والمعاينة، وتقديم عرض باقة مغرٍ لا يُقاوم مع استعجال حقيقي.';
      let toneDescFr = 'Ton requis : Agressif, percutant et ultra-persuasif axé Direct-Response COD. Appuyez sur la douleur client, désamorcez les craintes par le paiement à la livraison après inspection, et proposez une offre irrésistible avec urgence.';

      if (chosenTone === 'MEDICAL_AUTHORITY') {
        toneDescAr = 'نبرة الخطاب المطلوبة: طبية، موثوقة، رصينة، تبث الثقة والأمان وتشرح الآلية العلمية للمنتج بأسلوب مبسط ومقنع مع الحفاظ على القوة البيعية.';
        toneDescFr = 'Ton requis : Médical, expert, rassurant et crédible, expliquant les mécanismes avec autorité.';
      } else if (chosenTone === 'UGC_VIRAL') {
        toneDescAr = 'نبرة الخطاب المطلوبة: عفوية جداً وطبيعية لمؤثري تيك توك وريلز (UGC Creator)، كأن شخصاً عادياً يشارك تجربته الحقيقية والصادمة مع المنتج بدون أي تصنع.';
        toneDescFr = 'Ton requis : Créateur UGC TikTok/Reels authentique, naturel et spontané, axé sur l\'expérience vécue.';
      } else if (chosenTone === 'BUNDLE_OFFER') {
        toneDescAr = 'نبرة الخطاب المطلوبة: تركز 100% على الصفقات والعروض المزدوجة (1+1 مجاناً، باقة قطعتين، هدايا مجانية) لتحفيز الشراء الفوري ورفع معدل السلة.';
        toneDescFr = 'Ton requis : Axé 100% sur les offres irrésistibles de packs (1+1 offert, réduction sur le 2ème).';
      }

      // Pre-calculate authoritative competitive pricing & local benchmarks
      let targetCountry = 'MA';
      if (/gcc|saudi|ksa|السعودية|الخليج/i.test(input.target)) targetCountry = 'GCC';
      else if (/senegal|sn|السنغال/i.test(input.target)) targetCountry = 'SN';
      else if (/france|fr|europe/i.test(input.target)) targetCountry = 'FR';
      else if (/us|usa|united states|أمريكا/i.test(input.target)) targetCountry = 'US';
      else if (!/maroc|morocco|ma|المغرب/i.test(input.target)) targetCountry = 'GLOBAL';

      const wholesale = typeof input.wholesalePrice === 'number' && input.wholesalePrice > 0 ? input.wholesalePrice : 35;
      const defaultShip = targetCountry === 'SN' ? 2500 : (targetCountry === 'GCC' ? 25 : (targetCountry === 'US' || targetCountry === 'FR' ? 5 : 35));
      const shipping = typeof input.shippingFee === 'number' && input.shippingFee > 0 ? input.shippingFee : defaultShip;

      const compPricing = calculateCompetitivePricing({
        wholesalePrice: wholesale,
        retailPrice: typeof input.retailPrice === 'number' && input.retailPrice > 0 ? input.retailPrice : undefined,
        title: input.product,
        targetCountry,
        shippingFee: shipping,
      });

      const titleLower = input.product.toLowerCase();
      const isSingleAppliance =
        titleLower.includes('masseur') ||
        titleLower.includes('massage') ||
        titleLower.includes('pistolet') ||
        titleLower.includes('مساج') ||
        titleLower.includes('تدليك') ||
        titleLower.includes('hachoir') ||
        titleLower.includes('chopper') ||
        titleLower.includes('mixeur') ||
        titleLower.includes('robot') ||
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
        titleLower.includes('drone');

      const isLossRisk = compPricing.verdictDecision === 'NO_GO' || compPricing.multiplierStatus === 'RISKY';

      let promptInstructions = '';
      if (radarCategory) {
        promptInstructions = radarInstructions + (isArabic
          ? '\nقاعدة حاسمة: يجب ترجمة وتوطين كل الشروحات والمصطلحات والبيانات إلى اللغة العربية.'
          : '\nREGLE IMPORTANTE : Traduisez et adaptez toutes les descriptions et données en Français.');
      } else {
        if (isArabic) {
          promptInstructions = `أنت خبير ومحلل تسويق إلكتروني وتجارة محلية بنظام الدفع عند الاستلام (COD) ومدير إعلانات محترف.
قاعدة صارمة وإلزامية 100%: يجب كتابة كل التقارير والتحليلات والعناوين والنصوص بـ اللغة العربية الفصحى حصرياً، مع استخدام الدارجة المغربية العامية المحبوبة في سكريبتات إعلانات UGC إذا كان البلد المستهدف هو المغرب.
ممنوع منعاً باتاً استخدام اللغة الإنجليزية في العناوين أو نصوص التقرير.

${toneDescAr}

قواعد اقتصادية وحسابية إلزامية قطعية (Strict Moroccan COD Economics):
1. قرار هل المنتج WINNER أم لا:
${isLossRisk
  ? `🛑 تنبيه مالي قطعي ملزم: هذا المنتج تصنيفه [🛑 غير مؤهل للإطلاق / خاسر (LOSER)] بهذا السعر!
سعر الشراء (${compPricing.wholesalePrice} ${compPricing.currencySymbol}) وسعر البيع (${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}) يعطيان مضاعف سعر (${compPricing.codMultiplier}x) وهو ضعيف جداً ولا يكفي لتغطية تكاليف الإعلانات (CPA) والتوصيل والروتور في السوق المحلي.
ممنوع منعاً باتاً وصف المنتج بأنه WINNER في أي جزء من التقرير أو في الفقرة 8! بل صرح بوضوح قاطع في الفقرة 8 والفقرة 1 و 2 بأنه LOSER وغير صالح للإطلاق بهذا السعر، وقدم الحلول الصريحة فقط: (1) التفاوض لخفض سعر الجملة إلى أقل من ${Math.round(compPricing.recommendedRetailPrice * 0.28)} درهم، أو (2) رفع سعر البيع إلى ${compPricing.competitorAvg} درهم، أو (3) التخلي عن المنتج فوراً لحماية رأس المال.`
  : compPricing.verdictDecision === 'CONDITIONAL'
  ? `🟡 قرار مشروط: المنتج [🟡 رابح مشروط]. هامش الربح يتطلب إدارة دقيقة للـ CPA وتفادي الهدر.`
  : `🟢 قرار إيجابي: هذا المنتج [🟢 WINNER مؤكد] بهامش أمان قوي ومضاعف سعري ممتاز.`}

2. طبيعة المنتج واستراتيجية الباقات:
${isSingleAppliance
  ? `⚠️ طبيعة المنتج (${input.product}): هذا جهاز فردي (Appareil individuel). الزبون في الواقع يشتري جهازاً واحداً فقط لنفسه ونسبة من يشتري قطعتين لنفسه أقل من 5%!
ممنوع منعاً باتاً أن تقترح بيع باقة قطعتين لنفس الجهاز كحل لتعويض ضعف الهامش! يجب أن ترتكز الربحية على بيع القطعة الواحدة (${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}). ولرفع قيمة السلة يُنصح بالبيع التكميلي (Cross-sell: الجهاز + زيت تدليك أو إكسسوار إضافي) وليس قطعتين من نفس الجهاز.`
  : `📦 باقة القطعتين (Pack Duo): هذا المنتج استهلاكي أو متعدد القطع، لذا باقة القطعتين (${compPricing.recommendedBundlePacks[1]?.price || Math.round(compPricing.recommendedRetailPrice * 1.55)} ${compPricing.currencySymbol}) خيار ممتاز لرفع السلة.`}

3. ميزانية اختبار الشبح السريع (Ghost Test):
ميزانية اختبار الشبح السريع محددة بدقة وصارمة بـ ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} فقط (بين 150 و 250 درهم لمدة 24 إلى 48 ساعة) لفحص الإقبال الإعلاني قبل شراء المخزون. ممنوع منعاً باتاً ذكر أرقام وهمية أو مبالغ فيها مثل 1000 أو 5000 درهم!

4. الأرقام المالية الدقيقة الملزمة للفقرة 2:
- سعر الجملة الفعلي: ${compPricing.wholesalePrice} ${compPricing.currencySymbol}
- أسعار المنافسين في السوق المحلي: الأدنى ${compPricing.competitorMin} ${compPricing.currencySymbol} | المتوسط ${compPricing.competitorAvg} ${compPricing.currencySymbol} | الأعلى ${compPricing.competitorMax} ${compPricing.currencySymbol}
- سعر البيع التنافسي الموصى به: ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}
- مضاعف السعر المحلي: ${compPricing.codMultiplier}x
- سقف تكلفة الطلب الصارم (Plafond CPA - Kill Rule): ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}
- الـ Target CPA المثالي: ${compPricing.idealTargetCpaMin} إلى ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}
- ميزانية اختبار الشبح: ${compPricing.ghostTestBudget} ${compPricing.currencySymbol}

الهيكل الإلزامي للتقرير باللغة العربية:
### 🔍 تقرير فحص واستشارة السوق الإعلاني الشامل: ${input.product} (${input.target})

#### 📊 1. تقييم قابلية تحقيق المبيعات في السوق المستهدف
• هل سيحقق هذا المنتج مبيعات حقيقية في ${input.target}؟ نعم أو لا مع تعليل صريح ومباشر لسبب الشراء العفوي ونوع المشكلة التي يحلها.
• تقدير حجم المبيعات اليومية المتوقعة في مرحلة الاختبار الأولي ومرحلة التوسيع (Scaling).

#### 💰 2. كشف الحسابات المالية الدقيقة وهامش الأمان الإعلاني (COD Economics)
• سعر الجملة الفعلي (${compPricing.wholesalePrice} ${compPricing.currencySymbol}) وسعر البيع التنافسي الموصى به لكسر المنافسين (${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}).
• مقارنة أسعار المنافسين في السوق المحلي: أرخص منافس (${compPricing.competitorMin} ${compPricing.currencySymbol})، متوسط السوق (${compPricing.competitorAvg} ${compPricing.currencySymbol})، وأعلى سعر (${compPricing.competitorMax} ${compPricing.currencySymbol}).
• مضاعف السعر المحلي (${compPricing.codMultiplier}x) وهامش الأمان الإعلاني.
• سقف تكلفة الطلب الصارم (Plafond CPA - Kill Rule: ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}) الذي إذا تجاوزه الإعلان يجب إيقافه فوراً.
• الـ Target CPA المثالي (${compPricing.idealTargetCpaMin} - ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}) لتحقيق أرباح صافية تفوق 40%.
• ${isSingleAppliance ? 'استراتيجية البيع التكميلي (Cross-sell)' : 'استراتيجية باقة القطعتين (Pack Duo)'}.
• ميزانية اختبار الشبح السريع (Ghost Test: ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} فقط) بدون شراء المخزون مسبقاً.

#### ⚠️ 3. مخاوف واعتراضات الزبائن وكيفية نسفها
• أبرز الاعتراضات (السعر، الجودة، الشك في النصب) وكيفية تحويلها إلى نقاط قوة بيعية في الإعلان وصفحة الهبوط.

#### 🎣 4. باقة الـ 10 رؤوس إعلانية الأكثر جذباً (10 Winning Hooks Pack)
اكتب 10 Hooks عدوانية ومثيرة تخطف الانتباه في أول 3 ثوانٍ بالدارجة المغربية:
1. [صدمة وفضول]: ...
2. [صدمة وفضول]: ...
3. [تحريك الألم الشديد]: ...
4. [تحريك الألم الشديد]: ...
5. [فضح الطرق القديمة الفاشلة]: ...
6. [فضح الطرق القديمة الفاشلة]: ...
7. [عرض مغري واستعجال]: ...
8. [عرض مغري واستعجال]: ...
9. [دليل اجتماعي وضمان صفر مخاطرة]: ...
10. [دليل اجتماعي وضمان صفر مخاطرة]: ...

#### 📱 5. نصوص إعلانية عدوانية جاهزة حسب المنصة (Multi-Platform Ad Copies)
• نص إعلاني لـ TikTok & Reels (قصير، هجومي، محفز للنقر):
"..."

• نص إعلاني لـ Facebook Feed (قصة إنسانية، تفكيك اعتراضات، رصاصات الفوائد، عرض وضمان):
"..."

• نص إعلاني لـ WhatsApp Retargeting (رسالة استرجاع السلات المهجورة بعرض محفز):
"..."

#### 🎬 6. سيناريوهات UGC إعلانية مفصلة (مشهد بمشهد)
اكتب 3 سيناريوهات إعلانية مفصلة تناسب تيك توك وفيسبوك مع تفاصيل المشهد، الصوت، والنص بالشاشة.

#### 🚀 7. خطة إطلاق الحملات وقواعد الـ Kill & Scale
• الميزانية المقترحة للاختبار، متى يتم إيقاف الإعلان الخاسر، ومتى تتم مضاعفة الميزانية للإعلان الرابح.

#### 🏁 8. الخلاصة والقرار النهائي الحاسم: واش المنتج WINNER تخدم عليه ولا لا؟
• حدد قرارك الصريح والفاصل بحسب الأرقام المالية أعلاه (${isLossRisk ? 'المنتج خاسر LOSER' : compPricing.verdictDecision === 'CONDITIONAL' ? 'WINNER مشروط' : 'WINNER مؤكد'}).
• اذكر خطة العمل الفورية في 3 خطوات عملية لاختبار المنتج بأقل تكلفة وضمان الربح وعدم خسارة الميزانية.

قاعدة صارمة للتنسيق:
ممنوع منعاً باتاً استخدام رموز وصيغ LaTeX مثل \\[ \\text{...} \\] أو \\( ... \\). اكتب جميع الحسابات والمعادلات بنص عادي ومقروء للمسوق.
استشهد بروابط المواقع والمصادر الحقيقية التي وجدتها على الويب.`;
        } else {
          promptInstructions = `Vous êtes un analyste expert en e-commerce COD et stratégie publicitaire Direct-Response.
RÈGLE ABSOLUE ET OBLIGATOIRE : Rédigez l'intégralité du rapport, des titres, des explications et des scripts publicitaires en FRANÇAIS. Ne rédigez rien en anglais.

${toneDescFr}

RÈGLES FINANCIÈRES STRICTES ET IMPÉRATIVES (COD Anti-Loss Rules) :
1. Verdict Exécutif Formel (Produit WINNER ou pas) :
${isLossRisk
  ? `🛑 ALERTE FINANCIÈRE ABSOLUE : Ce produit est formellement classé comme [🛑 NON RENTABLE / DÉFICITAIRE (LOSER)] à ce niveau de prix !
Avec un prix d'achat de ${compPricing.wholesalePrice} ${compPricing.currencySymbol} et un prix de vente de ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}, le multiplicateur COD est de seulement ${compPricing.codMultiplier}x (en dessous du seuil minimal de 2.5x requis en COD local).
Il est STRICTEMENT INTERDIT de qualifier ce produit de WINNER dans le rapport ou dans la conclusion de la section 8 ! Déclarez clairement qu'il s'agit d'un produit perdant à éviter à ce prix, et proposez les solutions réelles : (1) négocier l'achat sous ${Math.round(compPricing.recommendedRetailPrice * 0.28)} ${compPricing.currencySymbol}, (2) monter le prix de vente à ${compPricing.competitorAvg} ${compPricing.currencySymbol}, ou (3) passer à un autre produit pour protéger le capital.`
  : compPricing.verdictDecision === 'CONDITIONAL'
  ? `🟡 Verdict : Produit [🟡 WINNER CONDITIONNEL] avec marges nécessitant un pilotage rigoureux.`
  : `🟢 Verdict : Produit [🟢 WINNER CONFIRMÉ] avec solide coussin de sécurité.`}

2. Nature du Produit & Stratégie d'Offres :
${isSingleAppliance
  ? `⚠️ Nature du produit (${input.product}) : C'est un appareil individuel. En pratique, un client n'achète qu'un seul appareil pour lui-même (moins de 5% de conversion sur un duo identique).
Il est STRICTEMENT INTERDIT de proposer un Pack Duo d'appareils identiques comme solution miracle pour sauver une marge unitaire déficitaire ! La rentabilité doit être viable sur la pièce unique (${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}). Pour augmenter le panier moyen, conseillez du Cross-sell (l'appareil + huile ou accessoire complémentaire).`
  : `📦 Pack Duo : Produit consommable/multi-usage adapté au Pack Duo (${compPricing.recommendedBundlePacks[1]?.price || Math.round(compPricing.recommendedRetailPrice * 1.55)} ${compPricing.currencySymbol}).`}

3. Budget Ghost Test Réel :
Le budget de Ghost Test est strictement fixé à ${compPricing.ghostTestBudget} ${compPricing.currencySymbol} (150 à 250 DH sur 24-48h). Interdiction formelle de citer des budgets extravagants comme 1000 ou 5000 DH !

4. Chiffres Financiers Exacts à intégrer dans la Section 2 :
- Prix d'achat grossiste : ${compPricing.wholesalePrice} ${compPricing.currencySymbol}
- Prix concurrents locaux : Min ${compPricing.competitorMin} ${compPricing.currencySymbol} | Moyen ${compPricing.competitorAvg} ${compPricing.currencySymbol} | Max ${compPricing.competitorMax} ${compPricing.currencySymbol}
- Prix de vente recommandé : ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}
- Multiplicateur COD : ${compPricing.codMultiplier}x
- CPA Plafond (Kill Rule) : ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}
- CPA Cible idéal : ${compPricing.idealTargetCpaMin} à ${compPricing.idealTargetCpaMax} ${compPricing.currencySymbol}
- Budget Ghost Test : ${compPricing.ghostTestBudget} ${compPricing.currencySymbol}

Structure obligatoire :
### 🔍 Audit & Analyse Complète du Produit : ${input.product} (${input.target})
#### 📊 1. Évaluation du Potentiel & Prédiction des Ventes Réelles
#### 💰 2. Chiffres Clés & Économie COD (Prix d'achat ${compPricing.wholesalePrice} ${compPricing.currencySymbol}, prix de vente ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}, CPA plafond ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}, Ghost Test ${compPricing.ghostTestBudget} ${compPricing.currencySymbol})
#### ⚠️ 3. Objections Clients & Solutions de Vente
#### 🎣 4. Pack des 10 Accroches Gagnantes (10 Winning Hooks Direct-Response)
#### 📱 5. Textes Publicitaires Multi-Plateformes (TikTok, Facebook Feed, WhatsApp Relance)
#### 🎬 6. Angles Marketing & 3 Scripts UGC Publicitaires
#### 🚀 7. Stratégie de Lancement & Règles Kill/Scale
#### 🏁 8. Conclusion & Verdict Exécutif : Produit WINNER ou pas ? (${isLossRisk ? 'Produit NON RENTABLE / LOSER' : compPricing.verdictDecision === 'CONDITIONAL' ? 'WINNER CONDITIONNEL' : 'WINNER CONFIRMÉ'}).

RÈGLE STRICTE DE FORMATAGE :
Ne JAMAIS utiliser de code LaTeX ni de balises mathématiques comme \\[ \\text{...} \\] ou \\( ... \\). Écrivez toutes les formules en texte clair et lisible pour l'humain.
Citez les sources web réelles vérifiées trouvées sur le web.`;
        }
      }

      const promptInput = isArabic
        ? `المطلوب: إجراء تدقيق تسويقي وإعلاني شامل بنبرة (${chosenTone}) باللغة العربية حصرياً مع إبراز كل الحسابات المالية وقرار هل المنتج WINNER أم لا.
- اسم المنتج: ${input.product}
- سعر الجملة المقدر: ${input.wholesalePrice || 35}
- سعر البيع التنافسي: ${input.retailPrice || 'محسوب تلقائياً'}
- البلد المستهدف: ${input.target}
- الأسواق المقارنة: ${input.source || 'السوق العام'}
- وضع البحث: ${input.mode === 'audit' ? 'تدقيق تسويقي وإعلاني' : 'استكشاف الفرص الرابحة'}

تنبيه حاسم: اكتب كل الحسابات بنص عادي مقروء بدون أي كود LaTeX، ويجب أن يختم التقرير بخلاصة فاصلة تجيب: هل المنتج WINNER تخدم عليه ولا لا؟`
        : `Veuillez analyser et auditer ce produit exclusivement en FRANÇAIS avec le ton (${chosenTone}) sans aucun code LaTeX, incluant les calculs financiers détaillés et la décision finale WINNER ou pas :
- Produit : ${input.product}
- Prix d'achat : ${input.wholesalePrice || 35}
- Prix de vente : ${input.retailPrice || 'calculé'}
- Pays cible : ${input.target}
- Sources : ${input.source || 'Général'}
- Mode : ${input.mode}`;

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          model,
          tools: [{ type: 'web_search' }],
          tool_choice: 'auto',
          max_output_tokens: 3500, // Generous limit to ensure all 8 sections and conclusion are fully rendered
          store: false,
          ...(radarCategory && {
            include: ['web_search_call.action.sources'],
            text: { format: radarFormat },
          }),
          instructions: promptInstructions,
          input: promptInput,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const part = result.output?.find((item: { type: string }) => item.type === 'message')
          ?.content?.find((content: { type: string }) => content.type === 'output_text');
        if (result.status === 'completed' && part?.text) {
          const citations = (part.annotations ?? []).filter(
            (item: Citation & { type: string }) => item.type === 'url_citation' && Number.isInteger(item.end_index) && /^https?:\/\//i.test(item.url),
          );
          let report: ResearchReport;
          if (radarCategory) {
            const sourceUrls: string[] = result.output
              .filter((item: { type: string }) => item.type === 'web_search_call')
              .flatMap((item: { action?: { sources?: { url: string }[] } }) =>
                (item.action?.sources ?? []).map(source => source.url));
            sourceUrls.push(...citations.map((citation: Citation) => citation.url));
            report = { text: '', citations: [], products: parseRadarProducts(part.text, sourceUrls, radarCategory) };
          } else {
            let sanitizedText = cleanLatexAndFormat(part.text);

            // 1. Sanitize any hallucinated ghost test budget (> 450 DH) with the realistic budget
            sanitizedText = sanitizedText.replace(/(?:Ghost\s*Test|اختبار\s*الشبح)[^:\n]*:\s*(?:[5-9]\d{2,}|[1-9]\d{3,})\s*(?:درهم|DH)/gi, `اختبار الشبح: ${compPricing.ghostTestBudget} ${compPricing.currencySymbol}`);

            // 2. Strict mathematical consistency guardrail: if product economics fail, NEVER allow hallucinated WINNER in conclusion
            if (isLossRisk) {
              const replacementConclusion = isArabic
                ? `\n\n### 🏁 8. الخلاصة والقرار النهائي الحاسم: واش المنتج WINNER تخدم عليه ولا لا؟\n• **القرار النهائي الصارم**: 🛑 **المنتج غير مؤهل للإطلاق بهذا السعر (LOSER)!**\n• **التعليل المالي الدقيق**: بسعر جملة ${compPricing.wholesalePrice} ${compPricing.currencySymbol} وسعر بيع ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}، مضاعف السعر هو ${compPricing.codMultiplier}x فقط (أقل بكثير من مضاعف الأمان 2.5x المطلوب في التجارة الإلكترونية COD بالمغرب). سقف تكلفة الإعلان (CPA) المتبقي بعد مصاريف الشحن ونسبة الروتور هو ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}، بينما متوسط تكلفة الطلب في إعلانات فيسبوك وتيك توك بالمغرب تتراوح بين 65 و 85 درهم. أي إطلاق لهذا المنتج بهذا السعر سيؤدي لخسارة مالية مؤكدة في كل طلب!\n• **خطة الإنقاذ للميديا باير (الحلول المتاحة)**:\n  1. **التفاوض على سعر الجملة**: خفض سعر الشراء إلى أقل من ${Math.round(compPricing.recommendedRetailPrice * 0.28)} ${compPricing.currencySymbol} (من درب عمر أو 1688).\n  2. **رفع سعر البيع**: إعادة التموضع وبيعه بـ ${compPricing.competitorAvg} ${compPricing.currencySymbol} مع ضمان حقيقي وفيديو UGC احترافي.\n  3. **التخلي عن المنتج**: إذا لم تتمكن من خفض تكلفة الشراء أو رفع السعر، أوقف العمل على هذا المنتج فوراً لحماية رأس مالك.`
                : `\n\n### 🏁 8. Conclusion & Verdict Exécutif : Produit WINNER ou pas ?\n• **Verdict Exécutif Stricte** : 🛑 **Produit NON RENTABLE (LOSER à ce niveau de prix) !**\n• **Justification Financière** : Avec un coût d'achat de ${compPricing.wholesalePrice} ${compPricing.currencySymbol} et un prix de vente de ${compPricing.recommendedRetailPrice} ${compPricing.currencySymbol}, le multiplicateur COD est de seulement ${compPricing.codMultiplier}x (inférieur au seuil de sécurité 2.5x). Le CPA plafond n'est que de ${compPricing.antiLossPlafondCpa} ${compPricing.currencySymbol}, alors que le CPA moyen sur Meta/TikTok au Maroc oscille entre 65 et 85 DH. Lancer ce produit en l'état vous garantit une perte nette sur chaque commande livrée !\n• **Plan d'action correctif** :\n  1. **Renégocier le sourcing** sous ${Math.round(compPricing.recommendedRetailPrice * 0.28)} ${compPricing.currencySymbol}.\n  2. **Monter le prix de vente** à ${compPricing.competitorAvg} ${compPricing.currencySymbol} avec un positionnement haut de gamme.\n  3. **Tuer le produit** et préserver votre budget publicitaire si les deux premières options sont impossibles.`;

              if (/(?:###\s*🏁?\s*8\.|####\s*🏁?\s*8\.|🏁\s*8\.|🏁\s*9\.)/i.test(sanitizedText)) {
                sanitizedText = sanitizedText.replace(/(?:###\s*🏁?\s*8\.|####\s*🏁?\s*8\.|🏁\s*8\.|🏁\s*9\.)[\s\S]*$/, replacementConclusion.trim());
              } else {
                sanitizedText += replacementConclusion;
              }
            } else {
              // Verify if conclusion section exists; if truncated or omitted by LLM, automatically append authoritative verdict
              const hasConclusion = /(?:🏁|8\.\s*Conclusion|9\.\s*Conclusion|8\.\s*الخلاصة|9\.\s*الخلاصة|Verdict|القرار النهائي)/i.test(sanitizedText);
              if (!hasConclusion && input.mode === 'audit') {
                const fallback = generateFallbackAuditReport(input);
                const conclusionMatch = fallback.text.match(/(?:━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\s*🏁[\s\S]*|🏁[\s\S]*)/);
                if (conclusionMatch) {
                  sanitizedText += '\n\n' + conclusionMatch[0];
                }
              }
            }
            report = { text: sanitizedText, citations };
          }
          // Save to cache
          researchCache.set(cacheKey, { timestamp: Date.now(), data: report });
          return report;
        }
      }
    } catch (e) {
      console.warn('Live web search call failed, falling back to expert engine:', e);
    }
  }

  // Fallback in Audit Mode: Generate 360° expert audit directly from product intelligence engine (0$ cost)
  if (input.mode === 'audit') {
    const report = generateFallbackAuditReport(input);
    researchCache.set(cacheKey, { timestamp: Date.now(), data: report });
    return report;
  }

  // Fallback in Scout Mode: Return sourced winning radar products (0$ cost)
  const isAr = input.language === 'ar';
  const filter = input.category || 'ALL';
  const refs = radarReferences(isAr).filter(p => filter === 'ALL' || filter === 'BOTH' || filter === p.category);
  const report = { text: '', citations: [], products: refs };
  researchCache.set(cacheKey, { timestamp: Date.now(), data: report });
  return report;
}

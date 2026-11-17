import { parseRadarProducts, radarFormat, radarInstructions } from './radarResearch';
import { radarReferences } from './radarProducts';
import type { RadarFilter, RadarProduct } from './radarProducts';
import { analyzeProductDetails } from './marketingAi';

export interface Citation {
  title: string;
  url: string;
  start_index: number;
  end_index: number;
}

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
}): ResearchReport {
  const isAr = input.language === 'ar';
  const lines = input.product.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0] || 'Produit COD';
  const details = lines.slice(1).join(' ');

  const targetCountry = /maroc|morocco|ma/i.test(input.target)
    ? 'MA'
    : (/saudi|ksa|gcc|الخليج|السعودية/i.test(input.target)
      ? 'GCC'
      : (/senegal|sn|السنغال/i.test(input.target) ? 'SN' : 'GLOBAL'));

  const analysis = analyzeProductDetails({
    title,
    ingredientsOrDetails: details,
    targetCountry,
    wholesalePrice: 35,
    retailPrice: 229,
  });

  const hooks = generateTenWinningHooks(analysis.productTitle, isAr);
  const platformCopies = generateMultiPlatformCopies(analysis.productTitle, analysis.currency, isAr);

  let reportText = '';
  if (isAr) {
    reportText = `🔍 تقرير فحص واستشارة السوق الإعلاني: ${analysis.productTitle} (${analysis.targetCountryFlag} ${analysis.targetCountryNameAr})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. تقييم الطلب وفرص النجاح فالسوق:
• مؤشر ملاءمة المنتج: ${analysis.overallScore}/100 [${analysis.scoreLabel}]
• خلاصة الخبير: ${analysis.verdictAr}
• تحليل حركة السوق والطلب: ${analysis.marketDemandAnalysisAr}

💪 2. نقاط القوة والمزايا التنافسية:
${analysis.strengthsAr.map((s) => '• ' + s).join('\n')}

⚠️ 3. مخاوف واعتراضات الزبائن والحلول:
${analysis.challengesAr.concat(analysis.regulatoryAndSafetyTipsAr).map((c) => '• ' + c).join('\n')}

🎣 4. باقة الـ 10 رؤوس إعلانية الأكثر جذباً (10 Winning Hooks Pack):
${hooks.map((h, i) => `${i + 1}. [${h.type}] : "${h.text}"`).join('\n')}

📱 5. نصوص إعلانية عدوانية جاهزة حسب المنصة (Multi-Platform Copy):
📌 [TikTok & Reels Ads - كليكات سريعة]:
${platformCopies.tikTok}

📌 [Facebook Feed Ads - بيع مباشر وقصة مقنعة]:
${platformCopies.facebook}

📌 [WhatsApp Retargeting - استرجاع السلات المهجورة]:
${platformCopies.whatsApp}

🎬 6. زوايا تسويقية وسيناريوهات إعلانية (UGC Hooks & Scripts):
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

🚀 7. خطة إطلاق الحملات وقواعد الـ Kill & Scale:
• الهيكل المقترح: ${analysis.launchStrategy.suggestedStructure}
• قاعدة إيقاف الإعلان الخاسر (Kill Rule): ${analysis.launchStrategy.killRuleDescriptionAr}
• قاعدة مضاعفة الميزانية (Scale Rule): ${analysis.launchStrategy.scaleRuleDescriptionAr}
• أهم النصائح: ${analysis.launchStrategy.keyTipsAr.join(' | ')}

📍 8. الاستهداف الجغرافي والمدن الأولى للبدء:
• الشريحة المستهدفة: ${analysis.targeting.ageRange} (الجمهور: ${analysis.targeting.recommendedGender === 'ALL' ? 'رجال ونساء' : analysis.targeting.recommendedGender === 'WOMEN' ? 'نساء فقط' : 'رجال فقط'})
• المدن ذات الأولوية وأعلى معدل توصيل: ${analysis.targeting.priorityCities.join('، ')}
• مناطق ينصح باستثنائها في البداية: ${analysis.targeting.excludedZones.join('، ')}`;
  } else {
    reportText = `🔍 RAPPORT D'EXPERTISE MARCHÉ & AUDIT DU PRODUIT : ${analysis.productTitle}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 1. Analyse de la demande & Potentiel :
• Score d'opportunité : ${analysis.overallScore}/100 [${analysis.scoreLabel}]
• Verdict de l'expert : ${analysis.verdictFr || analysis.verdictAr}
• Analyse marché : ${analysis.marketDemandAnalysisFr || analysis.marketDemandAnalysisAr}

💪 2. Forces & Avantages concurrentiels :
${(analysis.strengthsFr || analysis.strengthsAr).map((s) => '• ' + s).join('\n')}

⚠️ 3. Défis logistiques & Réglementation :
${(analysis.challengesFr || analysis.challengesAr).concat(analysis.regulatoryAndSafetyTipsFr || analysis.regulatoryAndSafetyTipsAr).map((c) => '• ' + c).join('\n')}

🎣 4. Pack des 10 Accroches Gagnantes (10 Winning Hooks) :
${hooks.map((h, i) => `${i + 1}. [${h.type}] : "${h.text}"`).join('\n')}

📱 5. Textes Publicitaires Multi-Plateformes (Direct-Response Copies) :
📌 [TikTok & Reels Ads - Clics Rapides] :
${platformCopies.tikTok}

📌 [Facebook Feed Ads - Storytelling & Conversion] :
${platformCopies.facebook}

📌 [WhatsApp Retargeting - Relance Paniers Abandonnés] :
${platformCopies.whatsApp}

🎬 6. Angles marketing & Scripts UGC :
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

🚀 7. Stratégie de lancement et règles Kill/Scale :
• Structure recommandée : ${analysis.launchStrategy.suggestedStructureFr || analysis.launchStrategy.suggestedStructure}
• Règle de coupure (Kill) : ${analysis.launchStrategy.killRuleDescriptionFr || analysis.launchStrategy.killRuleDescriptionAr}
• Règle de passage à l'échelle (Scale) : ${analysis.launchStrategy.scaleRuleDescriptionFr || analysis.launchStrategy.scaleRuleDescriptionAr}

📍 8. Ciblage géographique & Villes prioritaires :
• Cible : ${analysis.targeting.ageRange}
• Villes recommandées : ${analysis.targeting.priorityCities.join(', ')}
• Zones exclues : ${analysis.targeting.excludedZones.join(', ')}`;
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
      url: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + (input.target || 'Maroc'))}`,
      start_index: 0,
      end_index: 0,
    },
  ];

  return { text: reportText, citations };
}

// In-memory cache for market research to eliminate redundant OpenAI calls & token usage
const researchCache = new Map<string, { timestamp: number; data: ResearchReport }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours cache

export async function researchMarkets(input: {
  mode: 'scout' | 'audit';
  target: string;
  source: string;
  product: string;
  language: 'ar' | 'fr';
  category?: RadarFilter;
  tone?: CopywritingTone;
}): Promise<ResearchReport> {
  const chosenTone = input.tone || 'AGGRESSIVE';
  // 1. Check cache first - saves 100% of tokens on repeated queries
  const cacheKey = `${input.mode}:${input.target}:${input.source}:${input.product.trim().toLowerCase()}:${input.category || 'ALL'}:${input.language}:${chosenTone}`;
  const cached = researchCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    // If Arabic was requested, ensure the cached report is actually in Arabic, otherwise invalidate
    if (input.language === 'ar' && cached.data.text && !/[\u0600-\u06FF]/.test(cached.data.text)) {
      researchCache.delete(cacheKey);
    } else {
      return cached.data;
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

الهيكل الإلزامي للتقرير باللغة العربية:
### 🔍 فحص وتدقيق المنتج: ${input.product}

#### 📊 1. تقييم حجم الطلب والمنافسة في السوق المحلي
• مؤشرات الطلب وسلوك الشراء في ${input.target}.
• نقاط القوة والمزايا التنافسية الكبرى.

#### ⚠️ 2. مخاوف واعتراضات الزبائن وكيفية نسفها
• أبرز الاعتراضات (السعر، الجودة، الشك في النصب) وكيفية تحويلها إلى نقاط قوة بيعية في الإعلان وصفحة الهبوط.

#### 🎣 3. باقة الـ 10 رؤوس إعلانية الأكثر جذباً (10 Winning Hooks Pack)
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

#### 📱 4. نصوص إعلانية عدوانية جاهزة حسب المنصة (Multi-Platform Ad Copies)
• نص إعلاني لـ TikTok & Reels (قصير، هجومي، محفز للنقر):
"..."

• نص إعلاني لـ Facebook Feed (قصة إنسانية، تفكيك اعتراضات، رصاصات الفوائد، عرض وضمان):
"..."

• نص إعلاني لـ WhatsApp Retargeting (رسالة استرجاع السلات المهجورة بعرض محفز):
"..."

#### 🎬 5. سيناريوهات UGC إعلانية مفصلة (مشهد بمشهد)
اكتب 3 سيناريوهات إعلانية مفصلة تناسب تيك توك وفيسبوك مع تفاصيل المشهد، الصوت، والنص بالشاشة.

#### 🚀 6. خطة إطلاق الحملات وقواعد الـ Kill & Scale
• الميزانية المقترحة للاختبار، متى يتم إيقاف الإعلان الخاسر، ومتى تتم مضاعفة الميزانية للإعلان الرابح.

استشهد بروابط المواقع والمصادر الحقيقية التي وجدتها على الويب.`;
        } else {
          promptInstructions = `Vous êtes un analyste expert en e-commerce COD et stratégie publicitaire Direct-Response.
RÈGLE ABSOLUE ET OBLIGATOIRE : Rédigez l'intégralité du rapport, des titres, des explications et des scripts publicitaires en FRANÇAIS. Ne rédigez rien en anglais.

${toneDescFr}

Structure obligatoire :
### 🔍 Audit & Analyse du Produit : ${input.product}
#### 📊 1. Signaux de la Demande Marché & Opportunité
#### ⚠️ 2. Objections Clients & Solutions de Vente
#### 🎣 3. Pack des 10 Accroches Gagnantes (10 Winning Hooks Direct-Response)
#### 📱 4. Textes Publicitaires Multi-Plateformes (TikTok, Facebook Feed, WhatsApp Relance)
#### 🎬 5. Angles Marketing & 3 Scripts UGC Publicitaires
#### 🚀 6. Stratégie de Lancement & Règles Kill/Scale

Citez les sources web réelles vérifiées trouvées sur le web.`;
        }
      }

      const promptInput = isArabic
        ? `المطلوب: إجراء تدقيق تسويقي وإعلاني شامل بنبرة (${chosenTone}) باللغة العربية حصرياً.
- اسم المنتج: ${input.product}
- البلد المستهدف: ${input.target}
- الأسواق المقارنة: ${input.source || 'السوق العام'}
- وضع البحث: ${input.mode === 'audit' ? 'تدقيق تسويقي وإعلاني' : 'استكشاف الفرص الرابحة'}

تنبيه حاسم: يجب أن تكون الإجابة كاملة باللغة العربية مع نصوص إعلانية عدوانية ومقنعة.`
        : `Veuillez analyser et auditer ce produit exclusivement en FRANÇAIS avec le ton (${chosenTone}) :
- Produit : ${input.product}
- Pays cible : ${input.target}
- Sources : ${input.source || 'Général'}
- Mode : ${input.mode}

Rappel obligatoire : Rédigez tout le rapport en français avec des textes publicitaires percutants.`;

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          model,
          tools: [{ type: 'web_search' }],
          tool_choice: 'auto',
          max_output_tokens: 2200, // Adjusted to allow full 10 hooks & multiplatform copies without cutoff
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
            report = { text: part.text, citations };
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


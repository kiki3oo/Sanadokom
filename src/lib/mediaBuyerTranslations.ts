export interface MediaBuyerI18n {
  topBadge: string;
  pageTitle: string;
  pageSubtitle: string;
  aiGenBtn: string;
  tabWinning: string;
  tabValidator: string;
  tabCopilot: string;

  // Tab 1: Precise Winners Radar
  scoutBadge: string;
  scoutTitle: string;
  scoutSubtitle: string;
  pillCosmetics: string;
  pillSupplements: string;
  pillGcc: string;
  searchPlaceholder: string;
  allNiches: string;
  nicheCosmetics: string;
  nicheSupplements: string;
  nicheBeauty: string;
  nicheKitchen: string;
  nicheCar: string;
  nicheHealth: string;
  nicheGadgets: string;
  nicheHome: string;
  nichePets: string;
  allCountries: string;
  countryMA: string;
  countryUS: string;
  countryFR: string;
  countryGCC: string;
  countrySN: string;
  countryGLOBAL: string;
  allStatuses: string;
  statusHot: string;
  statusEmerging: string;
  statusEvergreen: string;
  quickFilterLabel: string;
  filterProblemSolver: string;
  filterWowFactor: string;
  filterHighOpportunity: string;
  loadingProducts: string;
  noProductsTitle: string;
  noProductsDesc: string;
  resetFiltersBtn: string;
  estProfitPerOrder: string;
  confirmationBadge: string;
  exactSpecsLabel: string;
  sourcingLocationLabel: string;
  activeAdsForDays: string;
  topChannelLabel: string;
  wholesalePriceLabel: string;
  retailPriceLabel: string;
  competitorsLabel: string;
  competitorsActive: string;
  whyWinningLabel: string;
  facebookAdsGlobal: string;
  facebookAdsLocal: string;
  tikTokVideos: string;
  detailsBtn: string;
  prepCampaignBtn: string;

  // Dossier Modal 360
  dossierTitle: string;
  dossierEconomicsEstimated: string;
  dossierWholesaleTitle: string;
  dossierWholesaleSub: string;
  dossierRetailTitle: string;
  dossierRetailSub: string;
  dossierDeliveryConfirmationTitle: string;
  dossierDeliveryConfirmationSub: string;
  dossierCompetitionTitle: string;
  dossierCompetitionSub: string;
  dossierDescTitle: string;
  dossierExactSpecsTitle: string;
  dossierSourcingTitle: string;
  dossierAdLongevityTitle: string;
  dossierDemographicTitle: string;
  dossierWhyWinningTitle: string;
  dossierAnglesTitle: string;
  dossierSpyTitle: string;
  dossierSpySub: string;
  dossierFbGlobal: string;
  dossierFbLocal: string;
  dossierTikTokHashtag: string;
  dossierTikTokGoogle: string;
  dossierTikTokCenter: string;
  dossierAliExpress: string;
  dossierClose: string;
  dossierSendToAudit: string;

  // Tab 2: Product Validator
  valHeaderTitle: string;
  valBadgeDirect: string;
  valHeaderDesc: string;
  valChooseStock: string;
  valFieldTitle: string;
  valFieldTitlePlaceholder: string;
  valFieldCountry: string;
  valFieldNiche: string;
  valFieldWholesale: string;
  valFieldRetail: string;
  valFieldShipping: string;
  valFieldConfRate: string;
  valFieldDelivRate: string;
  valFieldIngredients: string;
  valFieldIngredientsPlaceholder: string;
  valFieldUrl: string;
  valFieldUrlPlaceholder: string;
  valFooterNote: string;
  valSubmitBtn: string;
  valLoadingBtn: string;

  // Tab 2: Results Display
  resMarketReport: string;
  resSuccessIndex: string;
  resOutOf100: string;
  resWillItWork: string;
  resStrengthsTitle: string;
  resChallengesTitle: string;
  resMetricProblem: string;
  resMetricWow: string;
  resMetricMargin: string;
  resMetricShipping: string;
  resMetricDemand: string;
  resPlatformsTitle: string;
  resPoliciesTitle: string;
  resPoliciesWarning: string;
  resExpertTipTitle: string;
  resExpertTipContent: string;
  resCodEconomicsTitle: string;
  resCodEconomicsSubtitle: string;
  resBreakEvenCpa: string;
  resBreakEvenSub: string;
  resTargetCpa: string;
  resTargetCpaSub: string;
  resNetProfitPerDelivered: string;
  resNetProfitSub: string;
  resProfitPer100Leads: string;
  resRoasTarget: string;
  resAnglesTitle: string;
  resAnglesSubtitle: string;
  resHookTitle: string;
  resUgcScriptTitle: string;
  resAdCopyTitle: string;
  resCopyBtn: string;
  resCopiedBtn: string;
  resTargetingTitle: string;
  resGenderLabel: string;
  resAgeLabel: string;
  resCitiesLabel: string;
  resExcludedLabel: string;
  resAdsetsTitle: string;
  resInterestsLabel: string;
  resRulesTitle: string;
  resStructureTitle: string;
  resStructureDuration: string;
  resKillRuleTitle: string;
  resScaleRuleTitle: string;
  resKeyTipsTitle: string;

  // Tab 3: Daily Copilot
  copilotSpendToday: string;
  copilotSpendSub: string;
  copilotConfirmedOrders: string;
  copilotConfRate: string;
  copilotRealCpr: string;
  copilotCprSub: string;
  copilotRealRoas: string;
  copilotRoasSub: string;
  copilotActionsTitle: string;
  copilotActionsDesc: string;
  copilotTableTitle: string;
  copilotColName: string;
  copilotColStatus: string;
  copilotColBudget: string;
  copilotColSpend: string;
  copilotColClicks: string;
  copilotColConfirmed: string;
  copilotColCpr: string;
  copilotColRoas: string;
  copilotColAction: string;
  copilotBtnKill: string;
  copilotBtnScale: string;
  copilotBtnKeep: string;

  // AI Modal
  aiModalTitle: string;
  aiModalSubtitle: string;
  aiModalNiche: string;
  aiModalCountry: string;
  aiModalPrompt: string;
  aiModalPromptPlaceholder: string;
  aiModalCancel: string;
  aiModalSubmit: string;
}

export const mediaBuyerTranslations: Record<'fr' | 'ar' | 'en', MediaBuyerI18n> = {
  fr: {
    topBadge: 'MARKETING & MEDIA BUYER IA 2.0',
    pageTitle: 'Expert Média Buyer & Chasseur de Produits Gagnants',
    pageSubtitle: 'Moteur IA complet : Détectez les produits gagnants au Maroc et dans le monde, calculez le Break-even CPA & la rentabilité COD réelle, et pilotez vos campagnes publicitaires au quotidien.',
    aiGenBtn: 'Générer des Produits Gagnants par IA ⚡',
    tabWinning: 'Radar Produits Gagnants Précis (Winning Radar 🏆)',
    tabValidator: 'Audit Produit & Scripts avec l\'Expert (Product Audit 🎯)',
    tabCopilot: 'Copilote Média Buyer Quotidien (Daily Copilot 📊)',

    // Tab 1
    scoutBadge: 'Détecteur de Produits Commerciaux Réels (Real Winners)',
    scoutTitle: 'Produits commerciaux précis avec spécifications réelles, sourcing grossiste et publicités actives',
    scoutSubtitle: 'Ce ne sont pas de simples catégories générales, mais des produits ultra-précis prêts au lancement avec spécifications détaillées, sourcing grossiste vérifié (Derb Omar, labos cosmétiques Casablanca, Dubaï) et historique publicitaire réel.',
    pillCosmetics: '💄 Cosmétiques & Soins Maroc',
    pillSupplements: '🌿 Compléments Alimentaires à Forte Rétention',
    pillGcc: '🇸🇦 Top Ventes Golfe & Arabie',
    searchPlaceholder: 'Rechercher par nom, mot-clé ou problème résolu...',
    allNiches: 'Toutes les catégories',
    nicheCosmetics: '💄 Cosmétiques & Soins (Cosmetics)',
    nicheSupplements: '🌿 Compléments Alimentaires (Supplements)',
    nicheBeauty: '✨ Appareils & Accessoires Beauté (Beauty Tools)',
    nicheKitchen: '🍳 Maison & Cuisine Intelligente (Kitchen)',
    nicheCar: '🚗 Accessoires Auto & Gadgets (Car)',
    nicheHealth: '🏋️ Santé & Bien-être (Health)',
    nicheGadgets: '⚡ Gadgets Intelligents & High-Tech (Gadgets)',
    nicheHome: '🏠 Maison & Décoration (Home)',
    nichePets: '🐾 Animaux de Compagnie (Pets)',
    allCountries: '🌍 Tous les marchés (Worldwide)',
    countryMA: '🇲🇦 Maroc (Morocco)',
    countryUS: '🇺🇸 États-Unis (USA)',
    countryFR: '🇫🇷 France & Europe (EU)',
    countryGCC: '🇸🇦 Pays du Golfe & Arabie (GCC)',
    countrySN: '🇸🇳 Sénégal & Afrique Ouest (SN)',
    countryGLOBAL: '🌐 Tendances Mondiales (Global Trends)',
    allStatuses: 'Tous les statuts',
    statusHot: '🔥 Forte Demande (Hot Seller)',
    statusEmerging: '🟢 Tendance Émergente (Emerging)',
    statusEvergreen: '🌲 Produit Permanent (Evergreen)',
    quickFilterLabel: 'Filtres rapides :',
    filterProblemSolver: '🛠️ Résout un Problème (Problem Solver)',
    filterWowFactor: '✨ Effet Wow Viral (Wow Factor)',
    filterHighOpportunity: '🟢 Faible Concurrence & Forte Opportunité',
    loadingProducts: 'Scan des marchés et détection des produits gagnants en cours...',
    noProductsTitle: 'Aucun produit ne correspond à ces critères',
    noProductsDesc: 'Essayez d\'ajuster vos filtres ou générez de nouveaux concepts avec l\'IA.',
    resetFiltersBtn: 'Réinitialiser les filtres',
    estProfitPerOrder: 'Bénéfice estimé : +',
    confirmationBadge: 'Conf',
    exactSpecsLabel: 'Spécifications Commerciales Précises :',
    sourcingLocationLabel: 'Où Trouver & Sourcer au Prix Grossiste :',
    activeAdsForDays: 'Publicités actives depuis',
    topChannelLabel: 'Top Canal :',
    wholesalePriceLabel: 'Prix Grossiste',
    retailPriceLabel: 'Prix Conseillé',
    competitorsLabel: 'Concurrents',
    competitorsActive: 'actifs',
    whyWinningLabel: 'Pourquoi ce produit est gagnant ?',
    facebookAdsGlobal: 'Ads Facebook (Monde)',
    facebookAdsLocal: 'Ads Facebook (Local)',
    tikTokVideos: 'Vidéos TikTok',
    detailsBtn: 'Dossier 360° 👁️',
    prepCampaignBtn: 'Préparer Campagne & Scripts 🚀',

    // Dossier Modal
    dossierTitle: 'Dossier Produit 360° & Intelligence Publicitaire',
    dossierEconomicsEstimated: 'Bénéfice estimé : +',
    dossierWholesaleTitle: 'Prix d\'Achat Grossiste',
    dossierWholesaleSub: 'Coût d\'approvisionnement estimé',
    dossierRetailTitle: 'Prix de Vente Conseillé',
    dossierRetailSub: 'Prix consommateur recommandé',
    dossierDeliveryConfirmationTitle: 'Taux Confirmation & Livraison',
    dossierDeliveryConfirmationSub: 'Estimation réaliste Cash on Delivery',
    dossierCompetitionTitle: 'Indice de Saturation Marché',
    dossierCompetitionSub: 'annonceurs actifs sur ce produit',
    dossierDescTitle: 'Description & Concept du Produit :',
    dossierExactSpecsTitle: 'Spécifications Techniques & Commerciales Précises :',
    dossierSourcingTitle: 'Lieux de Sourcing & Achat Grossiste Réels :',
    dossierAdLongevityTitle: 'Ancienneté Publicitaire & Canaux :',
    dossierDemographicTitle: 'Audience Cible Idéale :',
    dossierWhyWinningTitle: 'Pourquoi ce produit convertit fortement ?',
    dossierAnglesTitle: 'Angles Marketing Recommandés pour vos Vidéos :',
    dossierSpyTitle: 'Outils d\'Espionnage & Recherche Directe en Direct',
    dossierSpySub: 'S\'ouvre dans un nouvel onglet',
    dossierFbGlobal: 'Facebook Ads (Monde 🌍)',
    dossierFbLocal: 'Facebook Ads',
    dossierTikTokHashtag: 'Vidéos TikTok (Hashtag 🎵)',
    dossierTikTokGoogle: 'Vidéos TikTok (Google 🎬)',
    dossierTikTokCenter: 'TikTok Top Ads Center 🔥',
    dossierAliExpress: 'Fournisseurs AliExpress (AliExpress 📦)',
    dossierClose: 'Fermer',
    dossierSendToAudit: 'Transférer à l\'Auditeur & Générer les Scripts 🚀',

    // Tab 2
    valHeaderTitle: 'Audit Produit & Analyse Marché avec l\'Expert IA (AI Product & Market Audit)',
    valBadgeDirect: 'Direct & Personnalisé',
    valHeaderDesc: 'Saisissez les informations de votre produit et sélectionnez le marché cible (Maroc, Golfe, Sénégal, Europe, USA...) pour obtenir le calcul du Break-even CPA, rentabilité COD, conformité des politiques publicitaires et scripts vidéo.',
    valChooseStock: '⚡ Choisir depuis votre Stock interne...',
    valFieldTitle: 'Nom du Produit ou Concept',
    valFieldTitlePlaceholder: 'Ex: Sérum Vitamine C éclaircissant, Complément Magnésium sommeil, ou Masseur cervical',
    valFieldCountry: 'Marché / Pays Cible',
    valFieldNiche: 'Niche & Secteur',
    valFieldWholesale: 'Prix d\'Achat Grossiste',
    valFieldRetail: 'Prix de Vente Conseillé',
    valFieldShipping: 'Frais de Livraison / Expédition',
    valFieldConfRate: 'Taux de Confirmation Estimé %',
    valFieldDelivRate: 'Taux de Livraison Estimé %',
    valFieldIngredients: 'Description, Ingrédients & Solution apportée',
    valFieldIngredientsPlaceholder: 'Ex: Contient de l\'huile d\'argan et de la vitamine E, freine la chute de cheveux et stimule la repousse en 30 jours',
    valFieldUrl: 'Lien du Produit ou Page Concurrent (URL)',
    valFieldUrlPlaceholder: 'Ex: Lien AliExpress, boutique concurrente ou lien de pub',
    valFooterNote: 'L\'analyse comprend : vérification des politiques publicitaires TikTok & Meta, calcul du Break-even CPA max, et 3 scripts publicitaires prêts à tourner.',
    valSubmitBtn: 'Lancer l\'Audit & Conseils de l\'Expert 🚀',
    valLoadingBtn: 'L\'expert analyse le marché et calcule la rentabilité en direct...',

    // Tab 2 Results
    resMarketReport: 'Rapport de Marché :',
    resSuccessIndex: 'Score de Viabilité & Rentabilité',
    resOutOf100: 'sur 100',
    resWillItWork: 'Ce produit va-t-il fonctionner sur ce marché ?',
    resStrengthsTitle: 'Points Forts & Opportunités Rentrantes :',
    resChallengesTitle: 'Défis & Recommandations pour Éviter les Pertes :',
    resMetricProblem: 'Résolution Problème',
    resMetricWow: 'Effet Wow Visuel',
    resMetricMargin: 'Santé de la Marge',
    resMetricShipping: 'Faisabilité Livraison',
    resMetricDemand: 'Demande Marché',
    resPlatformsTitle: 'Canaux publicitaires les plus adaptés pour ce produit',
    resPoliciesTitle: 'Directives des Politiques Publicitaires & Sécurité (Ad Policy & Compliance)',
    resPoliciesWarning: 'Points de vigilance pour éviter les rejets et suspensions sur TikTok & Meta :',
    resExpertTipTitle: '💡 Conseil Expert :',
    resExpertTipContent: 'Pour les cosmétiques et compléments, les vidéos authentiques de routine quotidienne (UGC) génèrent les conversions les plus élevées tout en respectant scrupuleusement les politiques de TikTok et Meta.',
    resCodEconomicsTitle: 'Calculateur de Rentabilité Précise & Marge de Sécurité (COD Economics)',
    resCodEconomicsSubtitle: 'Formule réaliste prenant en compte les taux réels de confirmation, livraison et frais d\'expédition sur ce marché.',
    resBreakEvenCpa: 'CPA Max Autorisé (Break-even)',
    resBreakEvenSub: 'Au-delà de ce montant, vous êtes en perte',
    resTargetCpa: 'Fourchette CPA Cible (Target CPA)',
    resTargetCpaSub: 'Zone idéale pour maximiser le bénéfice net',
    resNetProfitPerDelivered: 'Bénéfice Net par Commande Livrée',
    resNetProfitSub: 'Après déduction pub, transport et coût produit',
    resProfitPer100Leads: 'Bénéfice Estimé pour 100 Leads',
    resRoasTarget: 'ROAS Cible :',
    resAnglesTitle: 'Angles Marketing & Scénarios Vidéo (UGC & Copies Publicitaires)',
    resAnglesSubtitle: 'Scripts prêts à tourner et textes de publicités (Ad Copies) à copier dans Meta & TikTok en 1 clic.',
    resHookTitle: 'Accroche des 3 premières secondes (The 3-Second Hook) :',
    resUgcScriptTitle: 'Script Vidéo UGC Complet (Voix off & Scènes)',
    resAdCopyTitle: 'Texte Publicitaire Prêt à Publier (Ad Copy Facebook / TikTok)',
    resCopyBtn: 'Copier',
    resCopiedBtn: 'Copié !',
    resTargetingTitle: 'Stratégie de Ciblage & Audiences Idéales (Audience Persona)',
    resGenderLabel: 'Genre :',
    resAgeLabel: 'Tranche d\'âge :',
    resCitiesLabel: 'Villes prioritaires :',
    resExcludedLabel: 'Zones à exclure :',
    resAdsetsTitle: 'Groupes d\'Annonces Recommandés (AdSets) :',
    resInterestsLabel: 'Intérêts :',
    resRulesTitle: 'Règles d\'Arrêt & de Scaling (Kill & Scale Rules)',
    resStructureTitle: 'Structure de Campagne pour le Test (Testing Structure) :',
    resStructureDuration: 'Durée du test : 3 jours consécutifs sans modifier les annonces',
    resKillRuleTitle: 'Règle d\'Arrêt Immédiat (Kill Rule) :',
    resScaleRuleTitle: 'Règle de Scaling (Scale Rule) :',
    resKeyTipsTitle: 'Conseils Clés pour Doubler vos Résultats :',

    // Tab 3
    copilotSpendToday: 'Dépenses Publicitaires du Jour',
    copilotSpendSub: 'Synchronisé avec votre compte publicitaire',
    copilotConfirmedOrders: 'Commandes Confirmées Réelles',
    copilotConfRate: 'Confirmation :',
    copilotRealCpr: 'Coût par Commande Confirmée (Real CPR)',
    copilotCprSub: 'En-dessous du seuil de rentabilité',
    copilotRealRoas: 'ROAS Réel Net (Real ROAS)',
    copilotRoasSub: 'Basé sur les encaissements COD réels',
    copilotActionsTitle: 'Actions Requises Immédiatement (Recommandations IA)',
    copilotActionsDesc: 'Le copilote analyse vos coûts réels et vos taux de confirmation pour couper les pertes et scaler les vainqueurs.',
    copilotTableTitle: 'Tableau des Campagnes & Métriques Réelles COD',
    copilotColName: 'Nom de la Campagne / AdSet',
    copilotColStatus: 'Statut',
    copilotColBudget: 'Budget Jour',
    copilotColSpend: 'Dépenses Jour',
    copilotColClicks: 'Clics & CTR',
    copilotColConfirmed: 'Confirmés',
    copilotColCpr: 'Coût / Commande (CPR)',
    copilotColRoas: 'ROAS Réel',
    copilotColAction: 'Action',
    copilotBtnKill: 'Couper l\'AdSet 🛑',
    copilotBtnScale: 'Scaler le Budget 🚀',
    copilotBtnKeep: 'Maintenir le Test ⏳',

    // AI Modal
    aiModalTitle: 'Génération d\'Idées de Produits Gagnants par IA',
    aiModalSubtitle: 'Sélectionnez le secteur et le marché cible pour que l\'IA détecte instantanément de nouvelles opportunités.',
    aiModalNiche: 'Secteur / Niche Cible',
    aiModalCountry: 'Marché Cible (Pays)',
    aiModalPrompt: 'Remarque ou contrainte spécifique (Optionnel)',
    aiModalPromptPlaceholder: 'Ex: Produits faciles à expédier avec forte marge qui ne cassent pas lors du transport',
    aiModalCancel: 'Annuler',
    aiModalSubmit: 'Générer avec l\'Expert IA ⚡',
  },
  ar: {
    topBadge: 'MARKETING & MEDIA BUYER IA 2.0',
    pageTitle: 'خبير الإعلانات واقتناص المنتجات الرابحة',
    pageSubtitle: 'محرك ذكي متكامل: يكتشف المنتجات الأكثر مبيعاً وتريند في المغرب وكافة أسواق العالم، يحلل أرباح الـ COD وهامش الـ Break-even CPA، ويراقب حملاتك الإعلانية يومياً لإيقاف الخاسر وتكبير الرابح.',
    aiGenBtn: 'توليد أفكار رابحة بالذكاء الاصطناعي ⚡',
    tabWinning: 'اقتناص المنتجات الرابحة الدقيقة (Precise Winners Radar 🏆)',
    tabValidator: 'فحص واستشارة منتجك مع الخبير (Product Audit & Scripts 🎯)',
    tabCopilot: 'خبير الميديا باير اليومي (Daily Copilot 📊)',

    // Tab 1
    scoutBadge: 'مقتنص المنتجات التجارية الدقيقة (Real Commercial Winners)',
    scoutTitle: 'منتجات تجارية محددة بمواصفات حقيقية، أماكن التوريد بالجملة، وإعلانات نشطة',
    scoutSubtitle: 'هذه ليست مجرد مجالات عامة (Niches)، بل منتجات دقيقة جاهزة للإطلاق الفوري بمواصفاتها التجارية الكاملة (مثل سيروم فيتامين C 10% أو كريم لبان الذكر العماني)، وأماكن توريدها بالجملة في درب عمر ومختبرات الدار البيضاء ودبي.',
    pillCosmetics: '💄 مستحضرات التجميل بالمغرب',
    pillSupplements: '🌿 مكملات غذائية عالية الشراء',
    pillGcc: '🇸🇦 أعلى المبيعات في الخليج',
    searchPlaceholder: 'ابحث بالاسم، الكلمة الدلالية، أو المشكلة...',
    allNiches: 'جميع المجالات الدقيقة (All Categories)',
    nicheCosmetics: '💄 مستحضرات التجميل والعناية (Cosmetics)',
    nicheSupplements: '🌿 مكملات غذائية وأعشاب (Supplements)',
    nicheBeauty: '✨ أدوات الجمال والعناية (Beauty Tools)',
    nicheKitchen: '🍳 المطبخ والمنزل الذكي (Kitchen)',
    nicheCar: '🚗 إكسسوارات السيارات (Car)',
    nicheHealth: '🏋️ الصحة والعلاج الطبيعي (Health)',
    nicheGadgets: '⚡ الأدوات الذكية (Gadgets)',
    nicheHome: '🏠 المنزل والديكور (Home)',
    nichePets: '🐾 الحيوانات الأليفة (Pets)',
    allCountries: '🌍 جميع أسواق العالم (Worldwide)',
    countryMA: '🇲🇦 المغرب (Morocco)',
    countryUS: '🇺🇸 الولايات المتحدة (USA)',
    countryFR: '🇫🇷 فرنسا وأوروبا (France & EU)',
    countryGCC: '🇸🇦 دول الخليج والسعودية (GCC)',
    countrySN: '🇸🇳 السنغال وغرب إفريقيا (Senegal)',
    countryGLOBAL: '🌐 التريندات العالمية (Global Trends)',
    allStatuses: 'جميع الحالات',
    statusHot: '🔥 مبيعات مشتعلة (Hot Seller)',
    statusEmerging: '🟢 تريند صاعد (Emerging)',
    statusEvergreen: '🌲 منتج دائم (Evergreen)',
    quickFilterLabel: 'تصنيف سريع:',
    filterProblemSolver: '🛠️ يحل مشكلة يومية (Problem Solver)',
    filterWowFactor: '✨ إبهار بصري فايرل (Wow Factor)',
    filterHighOpportunity: '🟢 منافسة قليلة وفرصة صعود (High Opportunity)',
    loadingProducts: 'جاري مسح الأسواق وتحديث المنتجات الرابحة...',
    noProductsTitle: 'لا توجد منتجات مطابقة لهذا الفلتر',
    noProductsDesc: 'جرب تغيير معايير البحث أو اضغط على زر توليد أفكار ذكية بالذكاء الاصطناعي.',
    resetFiltersBtn: 'إعادة ضبط الفلاتر',
    estProfitPerOrder: 'ربح متوقع: +',
    confirmationBadge: 'تأكيد',
    exactSpecsLabel: 'المواصفات التجارية الدقيقة للمنتج:',
    sourcingLocationLabel: 'أين تجده وتورده بسعر الجملة:',
    activeAdsForDays: 'إعلانات نشطة منذ',
    topChannelLabel: 'الأقوى:',
    wholesalePriceLabel: 'سعر الجملة',
    retailPriceLabel: 'سعر البيع المقترح',
    competitorsLabel: 'المنافسون',
    competitorsActive: 'نشط',
    whyWinningLabel: 'لماذا هذا المنتج رابح؟',
    facebookAdsGlobal: 'إعلانات فيسبوك (عالمي)',
    facebookAdsLocal: 'إعلانات فيسبوك (محلي)',
    tikTokVideos: 'فيديوهات تيك توك',
    detailsBtn: 'التفاصيل 👁️',
    prepCampaignBtn: 'تجهيز الإعلانات والسكريبت 🚀',

    // Dossier Modal
    dossierTitle: 'ملف المنتج الكامل 360° واستخبارات الإعلانات',
    dossierEconomicsEstimated: 'ربح متوقع: +',
    dossierWholesaleTitle: 'سعر الشراء بالجملة',
    dossierWholesaleSub: 'سعر التوريد التقديري',
    dossierRetailTitle: 'سعر البيع المقترح',
    dossierRetailSub: 'سعر المستهلك في السوق',
    dossierDeliveryConfirmationTitle: 'نسبة التأكيد والتوصيل',
    dossierDeliveryConfirmationSub: 'تقدير واقعي للـ COD',
    dossierCompetitionTitle: 'مؤشر المنافسة والتشبع',
    dossierCompetitionSub: 'معلنين نشطين على هذا المنتج',
    dossierDescTitle: 'وصف وفكرة المنتج:',
    dossierExactSpecsTitle: 'المواصفات الفنية والتجارية الدقيقة:',
    dossierSourcingTitle: 'أماكن التوريد والشراء بالجملة:',
    dossierAdLongevityTitle: 'عمر الإعلانات النشطة والمنصة:',
    dossierDemographicTitle: 'الجمهور المستهدف بدقة:',
    dossierWhyWinningTitle: 'لماذا هذا المنتج رابح ويحقق مبيعات قوية؟',
    dossierAnglesTitle: 'الزوايا التسويقية المقترحة لتصوير الفيديوهات:',
    dossierSpyTitle: 'أدوات التجسس والبحث المباشر عن هذا المنتج',
    dossierSpySub: 'تفتح في نافذة جديدة',
    dossierFbGlobal: 'إعلانات فيسبوك (عالمي 🌍)',
    dossierFbLocal: 'إعلانات فيسبوك',
    dossierTikTokHashtag: 'فيديوهات تيك توك (هاشتاغ 🎵)',
    dossierTikTokGoogle: 'فيديوهات تيك توك (Google 🎬)',
    dossierTikTokCenter: 'TikTok Top Ads Center 🔥',
    dossierAliExpress: 'موردي علي إكسبريس (AliExpress 📦)',
    dossierClose: 'إغلاق',
    dossierSendToAudit: 'نقل لمحلل الحملات وتجهيز السكريبتات فوراً 🚀',

    // Tab 2
    valHeaderTitle: 'فحص واستشارة منتجك مع الخبير الإعلاني (AI Product & Market Audit)',
    valBadgeDirect: 'مباشر ومخصص',
    valHeaderDesc: 'أدخل معلومات أي منتج لديك وحدد السوق المستهدف (المغرب، الخليج، السنغال، أوروبا...) ليقوم الخبير بدراسة فرص نجاحه، حساب الـ Break-even CPA، تقديم إرشادات السياسات، واقتراح سكريبتات الدارجة والاستهداف.',
    valChooseStock: '⚡ اختر منتجاً من مخزونك (Stock)...',
    valFieldTitle: 'اسم المنتج أو الفكرة',
    valFieldTitlePlaceholder: 'مثال: سيروم فيتامين سي للتفتيح، مكمل المغنيسيوم للنوم، أو جهاز مساج الرقبة',
    valFieldCountry: 'السوق / الدولة المستهدفة',
    valFieldNiche: 'المجال / النيتش',
    valFieldWholesale: 'سعر الشراء بالجملة',
    valFieldRetail: 'سعر البيع المقترح',
    valFieldShipping: 'تكلفة الشحن والتوصيل',
    valFieldConfRate: 'نسبة التأكيد التقديرية %',
    valFieldDelivRate: 'نسبة التسليم التقديرية %',
    valFieldIngredients: 'المكونات، المميزات، أو المشكلة التي يحلها المنتج',
    valFieldIngredientsPlaceholder: 'مثال: يحتوي على زيت الأرغان وفيتامين E، يعالج تساقط الشعر ويملأ الفراغات في 30 يوماً',
    valFieldUrl: 'رابط المنتج أو رابط صفحة المنافس',
    valFieldUrlPlaceholder: 'مثال: رابط علي إكسبريس، موقع المنافس، أو رابط الإعلان',
    valFooterNote: 'التحليل يتضمن: فحص قبول الإعلانات في تيك توك وفيسبوك، حساب أقصى CPA مسموح، و3 سكريبتات إعلانية بالدارجة والفرنسية.',
    valSubmitBtn: 'فحص واستشارة الخبير الإعلاني فوراً 🚀',
    valLoadingBtn: 'الخبير يقوم بفحص السوق وتحليل الجدوى الآن...',

    // Tab 2 Results
    resMarketReport: 'تقرير السوق :',
    resSuccessIndex: 'مؤشر النجاح والربحية',
    resOutOf100: 'من 100',
    resWillItWork: 'هل سينجح هذا المنتج في هذا السوق؟',
    resStrengthsTitle: 'نقاط القوة والفرص الرابحة :',
    resChallengesTitle: 'التحديات والتوصيات لتفادي الخسارة :',
    resMetricProblem: 'حل المشكلة',
    resMetricWow: 'الإبهار البصري',
    resMetricMargin: 'صحة هامش الربح',
    resMetricShipping: 'سلامة الشحن والتوصيل',
    resMetricDemand: 'حجم الطلب المتوقع',
    resPlatformsTitle: 'المنصات الإعلانية الأنسب لهذا المنتج',
    resPoliciesTitle: 'إرشادات السياسات الإعلانية والسلامة (Ad Policy & Compliance)',
    resPoliciesWarning: 'تنبيهات هامة لتفادي حظر الحسابات الإعلانية في تيك توك وفيسبوك :',
    resExpertTipTitle: '💡 نصيحة الخبير :',
    resExpertTipContent: 'في مستحضرات التجميل والمكملات، الفيديوهات الطبيعية العفوية (UGC) التي تتحدث عن الروتين اليومي تحقق أعلى نسبة مبيعات دون أن يعترض عليها روبوت مراجعة الإعلانات.',
    resCodEconomicsTitle: 'حاسبة الأرباح الدقيقة وهامش الأمان الإعلاني (COD Economics)',
    resCodEconomicsSubtitle: 'معادلة واقعية تأخذ بعين الاعتبار نسبة التأكيد والتسليم وتكلفة الشحن الحقيقية في هذا السوق.',
    resBreakEvenCpa: 'أقصى CPA مسموح (Break-even)',
    resBreakEvenSub: 'إذا تجاوزته تصبح في خسارة',
    resTargetCpa: 'سعر الطلب المستهدف (Target CPA)',
    resTargetCpaSub: 'المنطقة الذهبية لتحقيق ربح مرتفع',
    resNetProfitPerDelivered: 'الربح الصافي لكل طلب مستلم',
    resNetProfitSub: 'بعد خصم الإعلانات والشحن وتكلفة المنتج',
    resProfitPer100Leads: 'الربح المتوقع لكل 100 ليد',
    resRoasTarget: 'عائد مستهدف (ROAS) :',
    resAnglesTitle: 'زوايا التسويق وسيناريوهات الفيديو بالدارجة المغربية / الترويجية',
    resAnglesSubtitle: 'سكريبتات جاهزة لتصوير الـ UGC ونصوص الإعلانات (Ad Copies) لنسخها في فيسبوك وتيك توك بنقرة واحدة.',
    resHookTitle: 'خطف الانتباه في أول 3 ثوانٍ (The 3-Second Hook) :',
    resUgcScriptTitle: 'سكريبت تصوير الفيديو (UGC Script بالدارجة)',
    resAdCopyTitle: 'نص الإعلان لفيسبوك وتيك توك (Ad Copy)',
    resCopyBtn: 'نسخ',
    resCopiedBtn: 'تم النسخ',
    resTargetingTitle: 'الاستهداف والشريحة الأكثر شراءً (Audience Persona)',
    resGenderLabel: 'الجنس المستهدف :',
    resAgeLabel: 'الفئة العمرية :',
    resCitiesLabel: 'المدن الأكثر طلباً :',
    resExcludedLabel: 'المناطق المستبعدة :',
    resAdsetsTitle: 'مجموعات الإعلانات المقترحة (AdSets) :',
    resInterestsLabel: 'الاهتمامات :',
    resRulesTitle: 'قواعد إيقاف وتكبير الإعلانات (Kill & Scale Rules)',
    resStructureTitle: 'هيكل الحملة للاختبار (Testing Structure) :',
    resStructureDuration: 'مدة الاختبار: 3 أيام متتالية دون تعديل الإعلانات',
    resKillRuleTitle: 'قاعدة الإيقاف الفوري (Kill Rule) :',
    resScaleRuleTitle: 'قاعدة التكبير والتوسع (Scale Rule) :',
    resKeyTipsTitle: 'نصائح حاسمة لمضاعفة النتائج :',

    // Tab 3
    copilotSpendToday: 'إجمالي الصرف الإعلاني اليوم',
    copilotSpendSub: 'متزامن مع حساب فيسبوك',
    copilotConfirmedOrders: 'الطلبيات المؤكدة الحقيقية',
    copilotConfRate: 'تأكيد :',
    copilotRealCpr: 'تكلفة الطلب المؤكد (Real CPR)',
    copilotCprSub: 'تحت الحد الأقصى (Break-even)',
    copilotRealRoas: 'العائد الحقيقي الصافي (Real ROAS)',
    copilotRoasSub: 'مبني على أموال الـ COD المستلمة فعلياً',
    copilotActionsTitle: 'إجراءات وتوصيات مطلوبة فوراً (AI Copilot)',
    copilotActionsDesc: 'يقوم الخبير بمقارنة صرفك مع طلبياتك المؤكدة في الوقت الفعلي لإيقاف الإعلانات الخاسرة وتكبير الرابحة.',
    copilotTableTitle: 'جدول الحملات الإعلانية ومؤشرات الـ COD الحقيقية',
    copilotColName: 'اسم الحملة / AdSet',
    copilotColStatus: 'الحالة',
    copilotColBudget: 'الميزانية اليومية',
    copilotColSpend: 'الصرف اليوم',
    copilotColClicks: 'النقرات & CTR',
    copilotColConfirmed: 'الطلبات المؤكدة',
    copilotColCpr: 'سعر الطلب (CPR)',
    copilotColRoas: 'العائد (Real ROAS)',
    copilotColAction: 'الإجراء',
    copilotBtnKill: 'إيقاف AdSet 🛑',
    copilotBtnScale: 'تكبير الميزانية 🚀',
    copilotBtnKeep: 'استمرار الاختبار ⏳',

    // AI Modal
    aiModalTitle: 'توليد أفكار منتجات رابحة بالذكاء الاصطناعي',
    aiModalSubtitle: 'اختر المجال والسوق المستهدف وسيقوم الذكاء الاصطناعي بابتكار أفكار جديدة فوراً.',
    aiModalNiche: 'المجال / النيتش المستهدف',
    aiModalCountry: 'السوق المستهدف (الدولة)',
    aiModalPrompt: 'ملاحظة أو ميزانية خاصة (اختياري)',
    aiModalPromptPlaceholder: 'مثال: منتجات سهلة التوصيل بهامش ربح عالي لا تنكسر أثناء الشحن',
    aiModalCancel: 'إلغاء',
    aiModalSubmit: 'توليد واقتناص الأفكار الآن ⚡',
  },
  en: {
    // English defaults can match French
    ...({} as any),
  }
};

// Set English fallback
mediaBuyerTranslations.en = {
  ...mediaBuyerTranslations.fr,
  pageTitle: 'Media Buyer Expert & Winning Products Scout',
  aiGenBtn: 'Generate Winning Products via AI ⚡',
  tabWinning: 'Precise Winners Radar (Winning Radar 🏆)',
  tabValidator: 'Product Audit & Scripts with Expert (Product Audit 🎯)',
  tabCopilot: 'Daily Media Buyer Copilot (Daily Copilot 📊)',
};

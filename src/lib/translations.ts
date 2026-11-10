export type Language = 'ar' | 'fr' | 'en';

export interface Translations {
  [key: string]: {
    ar: string;
    fr: string;
    en: string;
  };
}

export const translations: Translations = {
  // Navigation
  'nav.dashboard': {
    ar: 'لوحة التحكم',
    fr: 'Tableau de Bord',
    en: 'Dashboard',
  },
  'nav.callCenter': {
    ar: 'مركز الاتصال',
    fr: 'Centre d\'Appel',
    en: 'Call Center',
  },
  'nav.leaderboard': {
    ar: 'المسابقة والترتيب 🏆',
    fr: 'Challenge & Classement 🏆',
    en: 'Leaderboard & Rewards 🏆',
  },
  'nav.confirmation': {
    ar: 'إدارة وتتبع المؤكدين 📊',
    fr: 'Performance Confirmations',
    en: 'Confirmation Management',
  },
  'nav.strategySettings': {
    ar: 'استراتيجية إعادة الاتصال ⚙️',
    fr: 'Stratégie Relance & Rotation',
    en: 'Lead Rotation Strategy',
  },
  'nav.whatsappBot': {
    ar: 'بوت تأكيد الواتساب التلقائي 🤖',
    fr: 'WhatsApp Auto-Bot 🤖',
    en: 'WhatsApp Auto-Bot 🤖',
  },
  'nav.reports': {
    ar: 'التقارير والأرباح الصافية (P&L) 📈',
    fr: 'Rapports & Bilan P&L 📈',
    en: 'Reports & P&L Analytics 📈',
  },
  'nav.myCommissions': {
    ar: 'عمولاتي وفواتيري 💵',
    fr: 'Mes Commissions & Facture',
    en: 'My Commissions & Invoice',
  },
  'nav.confirmers': {
    ar: 'المؤكدون والمحاسبة',
    fr: 'Confirmateurs & Facturation',
    en: 'Confirmers & Invoicing',
  },
  'nav.productivity': {
    ar: 'الإنتاجية وتتبع الوقت ⏱️',
    fr: 'Productivité & Temps ⏱️',
    en: 'Productivity & Time ⏱️',
  },
  'nav.orders': {
    ar: 'الطلبيات والشحن',
    fr: 'Commandes & Livraison',
    en: 'Orders & Shipping',
  },
  'nav.reclamations': {
    ar: 'الشكايات وخدمة ما بعد البيع (SAV)',
    fr: 'Réclamations & SAV 🎧',
    en: 'Disputes & After-Sales 🎧',
  },
  'nav.stock': {
    ar: 'إدارة المخزون',
    fr: 'Gestion du Stock',
    en: 'Stock Management',
  },
  'nav.suppliers': {
    ar: 'الموردون والمشتريات',
    fr: 'Fournisseurs & Achats',
    en: 'Suppliers & Purchases',
  },
  'nav.expenses': {
    ar: 'المصاريف والتكاليف',
    fr: 'Dépenses & Charges',
    en: 'Expenses & Costs',
  },
  'nav.integrations': {
    ar: 'الربط والتطبيقات (APIs)',
    fr: 'Intégrations & APIs',
    en: 'Integrations & APIs',
  },
  'nav.auditLogs': {
    ar: 'سجل العمليات والتتبع 🛡️',
    fr: 'Journal d\'Audit & Historique',
    en: 'Audit Logs & History',
  },
  'nav.simulator': {
    ar: 'محاكي الويب هوك',
    fr: 'Simulateur Webhook',
    en: 'Webhook Simulator',
  },
  'nav.admin': {
    ar: 'الإدارة والصلاحيات',
    fr: 'Administration & Équipes',
    en: 'Admin & Team',
  },
  'nav.allModules': {
    ar: 'جميع الأقسام',
    fr: 'Tous les Modules',
    en: 'All Modules',
  },
  'nav.group.overview': {
    ar: 'نظرة عامة',
    fr: 'Vue d\'ensemble',
    en: 'Overview',
  },
  'nav.group.callCenter': {
    ar: 'مركز الاتصال والمبيعات',
    fr: 'Centre d\'Appel & Ventes',
    en: 'Call Center & Sales',
  },
  'nav.group.logistics': {
    ar: 'الطلبيات والتوصيل',
    fr: 'Commandes & Livraison',
    en: 'Orders & Delivery',
  },
  'nav.group.finance': {
    ar: 'الحسابات والمحاسبة',
    fr: 'Comptabilité & Facturation',
    en: 'Finance & Invoicing',
  },
  'nav.group.marketing': {
    ar: 'التسويق والميديا باير الذكي 🧠',
    fr: 'Marketing & Media Buyer IA 🧠',
    en: 'Marketing & AI Media Buyer 🧠',
  },
  'nav.mediaBuyer': {
    ar: 'الميديا باير والمنتجات الرابحة 🏆',
    fr: 'Media Buyer & Winning Products 🏆',
    en: 'Media Buyer & Winning Products 🏆',
  },
  'nav.group.admin': {
    ar: 'الإدارة والفريق',
    fr: 'Administration & Équipe',
    en: 'Administration & Team',
  },
  'nav.restrictedSpace': {
    ar: 'فضاء مخصص (محدود)',
    fr: 'Espace Restreint',
    en: 'Restricted Space',
  },
  'nav.activeRole': {
    ar: 'الحساب النشط :',
    fr: 'Rôle Actif :',
    en: 'Active Role:',
  },
  'nav.roleAdmin': {
    ar: '🛡️ الإدارة (Admin)',
    fr: '🛡️ Admin',
    en: '🛡️ Admin',
  },
  'nav.roleAgent': {
    ar: '🎧 مؤكد (Agent)',
    fr: '🎧 Agent',
    en: '🎧 Agent',
  },

  // Header
  'header.allStores': {
    ar: '🌐 جميع المشاريع / المتاجر',
    fr: '🌐 Tous les Projets / Boutiques',
    en: '🌐 All Stores / Projects',
  },
  'header.newProject': {
    ar: 'مشروع جديد',
    fr: 'Nouveau Projet',
    en: 'New Project',
  },
  'header.currency': {
    ar: 'العملة : درهم (MAD)',
    fr: 'Devise : MAD',
    en: 'Currency: MAD',
  },
  'header.activeSession': {
    ar: 'الجلسة النشطة (الدور) :',
    fr: 'Session Active (Rôle) :',
    en: 'Active Session (Role):',
  },
  'header.language': {
    ar: 'اللغة',
    fr: 'Langue',
    en: 'Language',
  },

  // Common Buttons & Actions
  'btn.takeNextLead': {
    ar: '⚡ أخذ الطلبية الموالية',
    fr: '⚡ Prendre le Lead Suivant',
    en: '⚡ Take Next Lead',
  },
  'btn.manualOrder': {
    ar: '+ طلبية يدوية (واتساب / هاتف)',
    fr: '+ Commande Manuelle',
    en: '+ Manual Order',
  },
  'btn.bulkImport': {
    ar: '📁 استيراد طلبيات (Excel / CSV)',
    fr: '📁 Import Excel / CSV',
    en: '📁 Import Excel / CSV',
  },
  'btn.soundOn': {
    ar: 'الجرس مفعّل 🔔',
    fr: 'Sonnerie Active 🔔',
    en: 'Chime Active 🔔',
  },
  'btn.soundOff': {
    ar: 'الجرس صامت 🔇',
    fr: 'Sonnerie Coupée 🔇',
    en: 'Chime Muted 🔇',
  },
  'btn.save': {
    ar: 'حفظ',
    fr: 'Enregistrer',
    en: 'Save',
  },
  'btn.cancel': {
    ar: 'إلغاء',
    fr: 'Annuler',
    en: 'Cancel',
  },
  'btn.confirm': {
    ar: 'تأكيد الطلبية',
    fr: 'Confirmer la commande',
    en: 'Confirm Order',
  },
  'btn.close': {
    ar: 'إغلاق',
    fr: 'Fermer',
    en: 'Close',
  },
  'btn.search': {
    ar: 'بحث...',
    fr: 'Rechercher...',
    en: 'Search...',
  },
  'btn.export': {
    ar: 'تصدير إكسيل (Excel)',
    fr: 'Exporter Excel',
    en: 'Export Excel',
  },
  'btn.dispatch': {
    ar: 'توليد البوليصة والإرسال',
    fr: 'Générer Bordereaux & Expédier',
    en: 'Generate Labels & Ship',
  },
  'btn.filter': {
    ar: 'تصفية',
    fr: 'Filtrer',
    en: 'Filter',
  },
  'btn.resetFilters': {
    ar: 'إلغاء الفلاتر',
    fr: 'Réinitialiser filtres',
    en: 'Reset Filters',
  },
  'btn.refresh': {
    ar: 'تحديث البيانات',
    fr: 'Actualiser',
    en: 'Refresh',
  },
  'btn.callClient': {
    ar: 'اتصال بالزبون',
    fr: 'Appeler le client',
    en: 'Call Customer',
  },
  'btn.callback': {
    ar: 'إعادة الاتصال',
    fr: 'Rappeler plus tard',
    en: 'Callback Later',
  },
  'btn.assign': {
    ar: 'تعيين',
    fr: 'Attribuer',
    en: 'Assign',
  },
  'btn.viewHistory': {
    ar: 'سجل التغييرات',
    fr: 'Historique & Audit',
    en: 'Audit History',
  },

  // Statuses
  'status.all': {
    ar: 'جميع الحالات',
    fr: 'Tous les statuts',
    en: 'All Statuses',
  },
  'status.pending': {
    ar: 'قيد الانتظار',
    fr: 'En attente',
    en: 'Pending',
  },
  'status.confirmed': {
    ar: 'مؤكدة',
    fr: 'Confirmée',
    en: 'Confirmed',
  },
  'status.cancelled': {
    ar: 'ملغية',
    fr: 'Annulée',
    en: 'Cancelled',
  },
  'status.noAnswer': {
    ar: 'لا يجيب',
    fr: 'Pas de réponse',
    en: 'No Answer',
  },
  'status.callback': {
    ar: 'إعادة الاتصال',
    fr: 'À rappeler',
    en: 'Callback',
  },
  'status.shipped': {
    ar: 'خرجت للشحن',
    fr: 'Expédiée',
    en: 'Shipped',
  },
  'status.inTransit': {
    ar: 'قيد التوزيع',
    fr: 'En cours de livraison',
    en: 'In Transit',
  },
  'status.delivered': {
    ar: 'تم التسليم والتحصيل',
    fr: 'Livrée & Encaissée',
    en: 'Delivered & Paid',
  },
  'status.returned': {
    ar: 'مرتجعة (روتور)',
    fr: 'Retournée',
    en: 'Returned',
  },

  // Common Table & Form Labels
  'table.order': {
    ar: 'رقم الطلبية',
    fr: 'N° Commande',
    en: 'Order #',
  },
  'table.date': {
    ar: 'التاريخ والوقت',
    fr: 'Date & Heure',
    en: 'Date & Time',
  },
  'table.customer': {
    ar: 'الزبون',
    fr: 'Client',
    en: 'Customer',
  },
  'table.phone': {
    ar: 'الهاتف',
    fr: 'Téléphone',
    en: 'Phone',
  },
  'table.city': {
    ar: 'المدينة والعنوان',
    fr: 'Ville & Adresse',
    en: 'City & Address',
  },
  'table.products': {
    ar: 'المنتجات والمبلغ',
    fr: 'Produits & Montant',
    en: 'Products & Amount',
  },
  'table.amount': {
    ar: 'المبلغ الإجمالي',
    fr: 'Montant Total',
    en: 'Total Amount',
  },
  'table.status': {
    ar: 'الحالة',
    fr: 'Statut',
    en: 'Status',
  },
  'table.agent': {
    ar: 'المؤكد',
    fr: 'Agent',
    en: 'Agent',
  },
  'table.courier': {
    ar: 'شركة الشحن',
    fr: 'Transporteur',
    en: 'Courier',
  },
  'table.actions': {
    ar: 'الإجراءات',
    fr: 'Actions',
    en: 'Actions',
  },
  'table.loading': {
    ar: 'جاري تحميل البيانات...',
    fr: 'Chargement des données...',
    en: 'Loading data...',
  },
  'table.noData': {
    ar: 'لا توجد أي طلبيات مطابقة للبحث.',
    fr: 'Aucune commande trouvée.',
    en: 'No orders found.',
  },

  // Periods & Filters
  'period.title': {
    ar: 'الفترة الزمنية',
    fr: 'Période',
    en: 'Period',
  },
  'period.all': {
    ar: 'كل الأوقات',
    fr: 'Tout l\'historique',
    en: 'All Time',
  },
  'period.today': {
    ar: 'اليوم',
    fr: 'Aujourd\'hui',
    en: 'Today',
  },
  'period.yesterday': {
    ar: 'الأمس',
    fr: 'Hier',
    en: 'Yesterday',
  },
  'period.7days': {
    ar: 'آخر 7 أيام',
    fr: '7 derniers jours',
    en: 'Last 7 Days',
  },
  'period.30days': {
    ar: 'آخر 30 يوماً',
    fr: '30 derniers jours',
    en: 'Last 30 Days',
  },
  'period.custom': {
    ar: 'فترة مخصصة',
    fr: 'Personnalisé',
    en: 'Custom Range',
  },
  'filter.advanced': {
    ar: 'فلاتر إحصائية متقدمة',
    fr: 'Filtres Statistiques Avancés',
    en: 'Advanced Statistics Filters',
  },
  'filter.active': {
    ar: 'فلاتر مفعّلة',
    fr: 'Filtres Actifs',
    en: 'Active Filters',
  },
  'filter.byAgent': {
    ar: 'تصفية حسب المؤكد :',
    fr: 'Filtrer par Agent :',
    en: 'Filter by Agent:',
  },
  'filter.allAgents': {
    ar: 'جميع المؤكدين',
    fr: 'Tous les agents',
    en: 'All Agents',
  },
  'filter.byProduct': {
    ar: 'تصفية حسب المنتوج :',
    fr: 'Filtrer par Produit :',
    en: 'Filter by Product:',
  },
  'filter.allProducts': {
    ar: 'جميع المنتجات',
    fr: 'Tous les produits',
    en: 'All Products',
  },

  // Dashboard Page
  'dash.title': {
    ar: 'لوحة التحكم والتحليلات المالية',
    fr: 'Tableau de Bord & Analytiques',
    en: 'Dashboard & Analytics',
  },
  'dash.subtitle': {
    ar: 'تتبع شامل للطلبيات، المداخيل، مصاريف الإعلانات، الشحن والأرباح الصافية الحقيقية',
    fr: 'Indicateurs clés du projet, rentabilité en temps réel et suivi détaillé de l\'équipe',
    en: 'Key project metrics, real-time profitability, and confirmation team tracking',
  },
  'dash.badge': {
    ar: 'إحصائيات ومباشر',
    fr: 'Statistiques & Performance en Direct',
    en: 'Live Stats & Performance',
  },
  'dash.netProfit': {
    ar: 'الربح الصافي الحقيقي المحصل (P&L)',
    fr: 'Bénéfice Net Réel Encaissé (P&L)',
    en: 'Real Net Profit Collected (P&L)',
  },
  'dash.profitMargin': {
    ar: 'هامش الربح الصافي :',
    fr: 'Marge Nette :',
    en: 'Net Margin:',
  },
  'dash.realRoas': {
    ar: 'العائد الإعلاني الحقيقي (على المسلّم)',
    fr: 'ROAS Réel (Sur Livré)',
    en: 'Real ROAS (On Delivered)',
  },
  'dash.adSpendLabel': {
    ar: 'مصاريف الإعلانات :',
    fr: 'Dépenses Ads :',
    en: 'Ad Spend:',
  },
  'dash.deliveredRate': {
    ar: 'نسبة التسليم الإجمالية',
    fr: 'Taux Livraison Global',
    en: 'Overall Delivery Rate',
  },
  'dash.deliveredOfShipped': {
    ar: 'مسلّمة من أصل مشحونة',
    fr: 'livrées / expédiées',
    en: 'delivered / shipped',
  },
  'dash.revenue': {
    ar: 'رقم المعاملات المحصل',
    fr: 'CA Encaissé',
    en: 'Delivered Revenue',
  },
  'dash.productCost': {
    ar: 'تكلفة شراء المنتجات (COGS)',
    fr: 'Coût Produits (COGS)',
    en: 'Product Cost (COGS)',
  },
  'dash.shippingCost': {
    ar: 'مصاريف الشحن والتوصيل',
    fr: 'Frais de Livraison',
    en: 'Shipping Fees',
  },
  'dash.adSpend': {
    ar: 'إعلانات فيسبوك وتيك توك',
    fr: 'Facebook & TikTok Ads',
    en: 'Facebook & TikTok Ads',
  },
  'dash.packaging': {
    ar: 'التغليف والكرتون',
    fr: 'Emballage & Cartons',
    en: 'Packaging & Boxes',
  },
  'dash.commissionsCost': {
    ar: 'عمولات فريق التأكيد',
    fr: 'Commissions Agents',
    en: 'Agent Commissions',
  },
  'dash.diagnosticTitle': {
    ar: 'تشخيص المصاريف وهامش الربح :',
    fr: 'Diagnostic Charges & Profit :',
    en: 'Cost & Profit Diagnosis:',
  },
  'dash.topCostItem': {
    ar: 'المصروف الأكبر رتبة 1 :',
    fr: 'Poste N°1 :',
    en: 'Top Expense #1:',
  },
  'dash.adviceHeader': {
    ar: 'نصيحة لرفع الأرباح :',
    fr: 'Conseil pour augmenter le profit :',
    en: 'Tip to increase profit:',
  },
  'dash.manageExpenses': {
    ar: 'إدارة وإدخال المصاريف',
    fr: 'Gérer & Saisir les Charges',
    en: 'Manage & Log Expenses',
  },
  'dash.kpi.leads': {
    ar: 'الطلبيات الواردة (Leads)',
    fr: 'Leads Reçus',
    en: 'Received Leads',
  },
  'dash.kpi.confirmed': {
    ar: 'الطلبيات المؤكدة',
    fr: 'Commandes Confirmées',
    en: 'Confirmed Orders',
  },
  'dash.kpi.delivered': {
    ar: 'الطلبيات المسلّمة',
    fr: 'Commandes Livrées',
    en: 'Delivered Orders',
  },
  'dash.kpi.returnRate': {
    ar: 'نسبة المرتجع (الروتور)',
    fr: 'Taux de Retour',
    en: 'Return Rate',
  },

  // Diagnostic Advice Translations
  'advice.ads': {
    ar: 'تكلفة الإعلانات مرتفعة: قم بتفعيل عمولة البيع الإضافي (UpSell) لفريق التأكيد لرفع قيمة السلة المتوسطة وتعويض تكاليف الإشهار.',
    fr: 'Coût publicitaire élevé : activez la commission UpSell aux confirmateurs pour augmenter le panier moyen et compenser les dépenses pub.',
    en: 'High ad spend: enable UpSell commissions for confirmation agents to increase average basket size and offset advertising costs.',
  },
  'advice.shipping': {
    ar: 'مصاريف التوصيل تؤثر على الأرباح: استخدم قوالب الواتساب بنقرة واحدة لطلب الموقع الجغرافي (GPS) قبل الشحن لتقليل نسبة المرتجعات.',
    fr: 'Frais de livraison élevés : utilisez les modèles WhatsApp en 1 clic pour demander la localisation GPS avant l\'expédition afin de réduire les retours.',
    en: 'Shipping fees eating profit: use 1-click WhatsApp templates to request GPS location before dispatch to minimize returns.',
  },
  'advice.cogs': {
    ar: 'تكلفة شراء السلع مرتفعة: تفاوض مع المورد على أسعار تفضيلية بالكميات لزيادة هامش الربح الصافي.',
    fr: 'Coût d\'achat élevé : négociez avec vos fournisseurs des tarifs préférentiels par volume pour augmenter votre marge nette.',
    en: 'High product cost: negotiate bulk volume pricing with suppliers to increase your net profit margin.',
  },
  'advice.packaging': {
    ar: 'شراء الكرتون ومستلزمات التغليف بالجملة يوفر مبالغ ملموسة في كل طلبية.',
    fr: 'L\'achat de cartons et emballages en gros permet d\'économiser sur chaque commande.',
    en: 'Buying packaging and cartons in bulk generates noticeable savings on every order.',
  },
  'advice.commissions': {
    ar: 'نظام العمولات على الطلبات المسلّمة فقط يضمن ربط المكافآت بالأرباح المحصلة فعلياً.',
    fr: 'Le système de commission sur commandes livrées uniquement garantit une rémunération liée aux gains réels.',
    en: 'Commissioning only on delivered orders ensures payouts align strictly with collected profits.',
  },
  'advice.phone_other': {
    ar: 'اعتماد باقات المكالمات اللامحدودة يضمن بقاء تكلفة الاتصال في أدنى مستوياتها لكل طلبية.',
    fr: 'Opter pour des forfaits appels illimités permet de garder un coût télécom très faible par commande confirmée.',
    en: 'Opting for unlimited call packages ensures telecom costs remain minimal per confirmed order.',
  },

  // Call Center Page
  'cc.title': {
    ar: 'مركز الاتصال وتأكيد الطلبيات (Call Center)',
    fr: 'Centre d\'Appel & Confirmation Leads',
    en: 'Call Center & Lead Confirmation',
  },
  'cc.subtitle': {
    ar: 'توزيع آلي متوازن، قفل منع التكرار، اتصال فوري وقوالب واتساب بنقرة واحدة',
    fr: 'Distribution automatique en Round-Robin, verrouillage anti-doublon et appel en 1 clic.',
    en: 'Automatic Round-Robin distribution, anti-collision lock, and 1-click WhatsApp calls.',
  },
  'cc.newLeads': {
    ar: 'طلبيات جديدة',
    fr: 'Nouveaux Leads',
    en: 'New Leads',
  },
  'cc.noAnswerTab': {
    ar: 'لم يجيبوا',
    fr: 'Pas de réponse',
    en: 'No Answer',
  },
  'cc.callbackTab': {
    ar: 'إعادة الاتصال',
    fr: 'À rappeler',
    en: 'Callback',
  },
  'cc.allLeads': {
    ar: 'جميع الطلبيات',
    fr: 'Tous les Leads',
    en: 'All Leads',
  },
  'cc.modalTitle': {
    ar: 'بطاقة معالجة الطلبية :',
    fr: 'Fiche Traitement Commande :',
    en: 'Order Processing File:',
  },
  'cc.callNotes': {
    ar: 'ملاحظات الاتصال مع الزبون...',
    fr: 'Notes d\'appel et remarques client...',
    en: 'Call notes & customer remarks...',
  },
  'cc.customAddress': {
    ar: 'العنوان المضبوط / اسم الحي...',
    fr: 'Adresse exacte / Quartier...',
    en: 'Exact address / Neighborhood...',
  },
  'cc.customCity': {
    ar: 'المدينة المخصصة...',
    fr: 'Ville personnalisée...',
    en: 'Custom city...',
  },
  'cc.upsellOption': {
    ar: 'بيع إضافي (UpSell / Vente Additionnelle) مع عمولة إضافية',
    fr: 'Vente Additionnelle (UpSell) avec prime additionnelle',
    en: 'Additional Sale (UpSell) with extra commission',
  },
  'cc.newTotal': {
    ar: 'المجموع الجديد للطلبية (درهم)',
    fr: 'Nouveau total commande (MAD)',
    en: 'New order total (MAD)',
  },
  'cc.upsellPrime': {
    ar: 'عمولة البيع الإضافي (درهم)',
    fr: 'Prime UpSell (MAD)',
    en: 'UpSell Bonus (MAD)',
  },
  'cc.upsellDesc': {
    ar: 'تفاصيل العرض الإضافي (مثلاً: + قطعة ثانية بنصف السعر)...',
    fr: 'Détails de l\'offre UpSell (+1 pièce, etc.)...',
    en: 'UpSell offer details (+1 extra item, etc.)...',
  },
  'cc.lockedNotice': {
    ar: 'هذه الطلبية قيد المعالجة حالياً من طرف :',
    fr: 'Cette commande est actuellement traitée par :',
    en: 'This order is currently being processed by:',
  },
  'cc.reasons.expensive': {
    ar: 'الثمن باهظ',
    fr: 'Trop cher',
    en: 'Too expensive',
  },
  'cc.reasons.changedMind': {
    ar: 'غيّر رأيه',
    fr: 'A changé d\'avis',
    en: 'Changed mind',
  },
  'cc.reasons.orderedElsewhere': {
    ar: 'اشترى من متجر آخر',
    fr: 'Commandé ailleurs',
    en: 'Bought elsewhere',
  },
  'cc.reasons.noBudget': {
    ar: 'لا يتوفر على الميزانية',
    fr: 'Pas de budget',
    en: 'No budget',
  },
  'cc.reasons.other': {
    ar: 'سبب آخر',
    fr: 'Autre motif',
    en: 'Other reason',
  },
  'cc.searchPlaceholder': {
    ar: 'البحث برقم الهاتف، اسم الزبون، المدينة، أو رقم الطلبية...',
    fr: 'Rechercher par numéro de téléphone (06...), nom du client, ville, ou réf commande...',
    en: 'Search by phone number, customer name, city, or order ref...',
  },
  'cc.loadingLeads': {
    ar: 'جارٍ تحميل الطلبيات...',
    fr: 'Chargement des leads...',
    en: 'Loading leads...',
  },
  'cc.noLeads': {
    ar: 'لا توجد طلبيات في الانتظار !',
    fr: 'Aucun lead en attente !',
    en: 'No pending leads!',
  },
  'cc.noLeadsDesc': {
    ar: 'تمت معالجة جميع الطلبيات أو لا توجد نتائج مطابقة للفلتر.',
    fr: 'Tous les leads ont été traités ou aucun filtre ne correspond.',
    en: 'All leads have been processed or no filter matches.',
  },
  'cc.suiviTab': {
    ar: '🚨 متابعة وإنقاذ الطرود',
    fr: '🚨 Suivi & Sauvetage Colis',
    en: '🚨 Parcel Tracking & Rescue',
  },
  'cc.treatNow': {
    ar: '⚡ معالجة الآن',
    fr: '⚡ Traiter Maintenant',
    en: '⚡ Treat Now',
  },
  'cc.treat': {
    ar: 'معالجة',
    fr: 'Traiter',
    en: 'Treat',
  },
  'cc.continue': {
    ar: 'متابعة',
    fr: 'Continuer',
    en: 'Continue',
  },
  'cc.verifying': {
    ar: 'جارٍ التحقق...',
    fr: 'Vérification...',
    en: 'Verifying...',
  },
  'cc.inCallWithYou': {
    ar: 'قيد الاتصال معك',
    fr: 'En cours avec vous',
    en: 'In call with you',
  },
  'cc.inCallWith': {
    ar: 'في اتصال من طرف',
    fr: 'En appel par',
    en: 'In call by',
  },
  'cc.cityNotSpecified': {
    ar: 'مدينة غير محددة',
    fr: 'Ville non spécifiée',
    en: 'City not specified',
  },
  'cc.callsCount': {
    ar: 'اتصال',
    fr: 'appel(s)',
    en: 'call(s)',
  },
  'cc.postponed': {
    ar: 'مؤجل',
    fr: 'Reporté',
    en: 'Postponed',
  },
  'cc.pending': {
    ar: 'في الانتظار',
    fr: 'En attente',
    en: 'Pending',
  },
  'cc.orderSheet': {
    ar: 'بطاقة معالجة المكالمة',
    fr: 'Fiche de Traitement Appel',
    en: 'Call Processing Sheet',
  },
  'cc.customerName': {
    ar: 'اسم الزبون',
    fr: 'Nom du client',
    en: 'Customer Name',
  },
  'cc.phone': {
    ar: 'الهاتف',
    fr: 'Téléphone',
    en: 'Phone',
  },
  'cc.deliveryCity': {
    ar: 'مدينة التسليم',
    fr: 'Ville de livraison',
    en: 'Delivery City',
  },
  'cc.exactAddress': {
    ar: 'العنوان المضبوط',
    fr: 'Adresse exacte',
    en: 'Exact Address',
  },
  'cc.attribution': {
    ar: 'مصدر الزيارة والحملة الإعلانية :',
    fr: 'Attribution & Campagne Marketing :',
    en: 'Attribution & Marketing Campaign:',
  },
  'cc.itemsStock': {
    ar: 'المنتجات والتحقق من المخزون',
    fr: 'Articles & Vérification du Stock',
    en: 'Items & Stock Check',
  },
  'cc.inStock': {
    ar: 'متوفر بالمخزون',
    fr: 'En Stock',
    en: 'In Stock',
  },
  'cc.outOfStock': {
    ar: 'نفذ من المخزون',
    fr: 'Rupture de Stock',
    en: 'Out of Stock',
  },
  'cc.upsellSuccess': {
    ar: 'بيع إضافي ناجح (UpSell)',
    fr: 'UpSell Réussi / Vente Additionnelle',
    en: 'Successful UpSell',
  },
  'cc.agentBonus': {
    ar: 'عمولة إضافية للمؤكد',
    fr: 'Prime UpSell Agent',
    en: 'Agent UpSell Bonus',
  },
  'cc.callNotesLabel': {
    ar: 'ملاحظات المؤكد',
    fr: 'Notes de l\'agent',
    en: 'Agent call notes',
  },
  'cc.chooseOutcome': {
    ar: 'اختر نتيجة المكالمة :',
    fr: 'Choisir le résultat de l\'appel :',
    en: 'Choose call outcome:',
  },
  'cc.preciseStatus': {
    ar: 'حالة الاتصال الدقيقة',
    fr: 'Statut d\'appel précis',
    en: 'Precise call status',
  },
  'cc.chooseQuickStatus': {
    ar: '-- اختر حالة سريعة --',
    fr: '-- Choisir un statut rapide --',
    en: '-- Choose quick status --',
  },
  'cc.quickWhatsapp': {
    ar: 'قوالب واتساب سريعة (نقرة واحدة)',
    fr: 'Modèles WhatsApp Rapides (1-Clic)',
    en: 'Quick WhatsApp Templates (1-Click)',
  },
  'cc.sendToCustomer': {
    ar: 'إرسال إلى الزبون',
    fr: 'Envoyer au client',
    en: 'Send to customer',
  },
  'cc.newOrderReceived': {
    ar: 'طلب جديد وارد ! (رن الهاتف)',
    fr: 'Nouvelle Commande Reçue ! (Tél. a sonné)',
    en: 'New Order Received! (Phone rang)',
  },
  'cc.closeAlert': {
    ar: 'إغلاق التنبيه',
    fr: 'Fermer l\'alerte',
    en: 'Close alert',
  },
  'cc.duplicateSuspect': {
    ar: '🚨 اشتباه تكرار الطلب',
    fr: '🚨 Doublon Suspect',
    en: '🚨 Duplicate Suspect',
  },
  'cc.vipClient': {
    ar: '⭐ زبون VIP',
    fr: '⭐ Client VIP',
    en: '⭐ VIP Customer',
  },
  'cc.recurringClient': {
    ar: '🔁 زبون متكرر',
    fr: '🔁 Client récurrent',
    en: '🔁 Recurring Customer',
  },
  'cc.riskyClient': {
    ar: '⚠️ عالي المخاطر',
    fr: '⚠️ À Risque',
    en: '⚠️ Risky Customer',
  },
  'cc.firstOrder': {
    ar: '🆕 أول طلبية',
    fr: '🆕 1ère Commande',
    en: '🆕 1st Order',
  },
  'cc.lockNoticeDesc': {
    ar: 'هذه الطلبية قيد المعالجة حالياً من طرف زميلك لتجنب تكرار الاتصال. إجراءات التأكيد والتعديل مقفلة.',
    fr: 'Cette commande est actuellement traitée par votre collègue pour éviter tout appel en doublon. Les actions de confirmation et de modification sont bloquées.',
    en: 'This order is currently being processed by your colleague to avoid duplicate calls. Confirmation actions are locked.',
  },
  'cc.savedConfirmed': {
    ar: '🟢 تم الإنقاذ ! تأكيد',
    fr: '🟢 Sauvé ! Confirmé',
    en: '🟢 Rescued! Confirmed',
  },
  'cc.outForDelivery': {
    ar: '🛵 خرج للتوزيع اليوم',
    fr: '🛵 Sorti en tournée',
    en: '🛵 Out for Delivery',
  },
  'cc.postponeDate': {
    ar: '⏳ تأجيل الموعد',
    fr: '⏳ Reporter (Date)',
    en: '⏳ Reschedule (Date)',
  },
  'cc.unreachableLivreur': {
    ar: '🟡 لا يجيب الموزع',
    fr: '🟡 Injoignable',
    en: '🟡 Unreachable',
  },
  'cc.refusalFinal': {
    ar: '🔴 رفض نهائي',
    fr: '🔴 Refus Définitif',
    en: '🔴 Definite Refusal',
  },
  'cc.rescheduleDateLabel': {
    ar: 'تاريخ الموعد الجديد (Date de Report) :',
    fr: 'Date du nouveau rendez-vous :',
    en: 'Reschedule Date:',
  },
  'cc.courierWhatsapp': {
    ar: '🛵 واتساب للموزع (رسالة جاهزة)',
    fr: '🛵 WhatsApp au Livreur (Message Prêt)',
    en: '🛵 WhatsApp to Courier',
  },
  'cc.rescueClientWhatsapp': {
    ar: '💬 واتساب إنقاذ الزبون (بالدارجة)',
    fr: '💬 WhatsApp Sauvetage Client (بالدارجة)',
    en: '💬 Customer Rescue WhatsApp',
  },
  'cc.rescueReasonWhatsapp': {
    ar: '💬 رسالة خاصة بهذا السبب (بالدارجة)',
    fr: '💬 WhatsApp ciblé sur ce motif',
    en: '💬 Targeted Reason WhatsApp',
  },
  'cc.rescueCell': {
    ar: '🚨 خلية إنقاذ ومتابعة الطرود (تتبع الشحن)',
    fr: '🚨 Cellule de Sauvetage de Colis (Suivi Livraison)',
    en: '🚨 Parcel Rescue Cell (Delivery Follow-up)',
  },
  'cc.rescueDesc': {
    ar: 'تتبع حركة الطرد مع الموزع وتأكيد الموعد مع الزبون.',
    fr: 'Suivi des mouvements du colis avec le livreur et confirmation avec le client.',
    en: 'Tracking parcel movement with courier and confirming with customer.',
  },
  'cc.trackingNum': {
    ar: 'رقم التتبع :',
    fr: 'N° Suivi :',
    en: 'Tracking No:',
  },
  'cc.logisticState': {
    ar: 'الحالة اللوجستية :',
    fr: 'État logistique :',
    en: 'Logistics State:',
  },
  'cc.courierLabel': {
    ar: 'الموزع :',
    fr: 'Transporteur :',
    en: 'Courier:',
  },
  'cc.addedOffer': {
    ar: 'العرض المضاف (باك / قطعة)',
    fr: 'Offre ajoutée (Pack/Pièce)',
    en: 'Added Offer (Pack/Piece)',
  },
  'cc.fixedPerDelivered': {
    ar: 'ثابت / لكل تسليم',
    fr: 'Fixe / Livré',
    en: 'Fixed / Delivered',
  },
  'cc.notesPlaceholder': {
    ar: 'مثال: الزبون طلب التوصيل بعد الساعة 4 مساءً في العمل...',
    fr: 'Ex: Le client a demandé une livraison après 16h au bureau...',
    en: 'Ex: Customer requested delivery after 4pm at office...',
  },
  'cc.subStatus.postponed': {
    ar: '⏳ مؤجل',
    fr: '⏳ Reporté',
    en: '⏳ Postponed',
  },
  'cc.subStatus.savedToDeliver': {
    ar: '🟢 تم الإنقاذ لإعادة التوزيع',
    fr: '🟢 Sauvé à Relivrer',
    en: '🟢 Rescued to Redeliver',
  },
  'cc.subStatus.outForDelivery': {
    ar: '🛵 في التوزيع',
    fr: '🛵 Sorti en livraison',
    en: '🛵 Out for Delivery',
  },
  'cc.subStatus.unreachable': {
    ar: '📵 تعذر الاتصال',
    fr: '📵 Injoignable',
    en: '📵 Unreachable',
  },
  'cc.subStatus.courierRefusal': {
    ar: '⛔ رفض عند التوصيل',
    fr: '⛔ Refus Livreur',
    en: '⛔ Delivery Refusal',
  },
  'cc.subStatus.invalidAddress': {
    ar: '📍 عنوان غير دقيق',
    fr: '📍 Adresse Invalide',
    en: '📍 Invalid Address',
  },

  // Confirmation Management
  'confMgmt.title': {
    ar: 'إدارة وتتبع المؤكدين',
    fr: 'Confirmation Management',
    en: 'Confirmation Management',
  },
  'conf.myTitle': {
    ar: 'أدائي في التأكيد',
    fr: 'Mon Espace Performance (Confirmation)',
    en: 'My Confirmation Performance',
  },
  'confMgmt.subtitle': {
    ar: 'تتبع أداء المؤكدين، معدلات التحويل وتوزيع الطلبيات',
    fr: 'Configure assignment rules and track performance',
    en: 'Configure assignment rules and track performance',
  },
  'conf.mySubtitle': {
    ar: 'متابعة مؤشراتك الشخصية، نسبة التأكيد وأهدافك اليومية',
    fr: 'Suivez vos indicateurs personnels, vos taux de conversion et vos objectifs',
    en: 'Track your personal metrics, conversion rates, and goals',
  },
  'conf.agentPerf': {
    ar: '📊 إحصائيات وأداء المؤكدين',
    fr: '📊 Performance des Confirmateurs',
    en: '📊 Agent Performance',
  },
  'conf.myPerf': {
    ar: 'أدائي الشخصي',
    fr: 'Mes Performances',
    en: 'My Performance',
  },
  'conf.settings': {
    ar: '⚙️ إعدادات التدوير والمهلة (جديد)',
    fr: '⚙️ Stratégie & Rotation des Leads (Nouveau)',
    en: '⚙️ Lead Rotation & Call Strategy (New)',
  },
  'conf.today': {
    ar: 'اليوم',
    fr: 'Today',
    en: 'Today',
  },
  'conf.yesterday': {
    ar: 'البارحة',
    fr: 'Yesterday',
    en: 'Yesterday',
  },
  'conf.past7days': {
    ar: 'آخر 7 أيام',
    fr: 'Past 7 days',
    en: 'Past 7 days',
  },
  'conf.thisMonth': {
    ar: 'هذا الشهر',
    fr: 'This month',
    en: 'This month',
  },
  'conf.maximum': {
    ar: 'الكل',
    fr: 'Maximum',
    en: 'Maximum',
  },
  'conf.custom': {
    ar: 'مخصص',
    fr: 'Custom',
    en: 'Custom',
  },
  'conf.convRate': {
    ar: 'نسبة التأكيد',
    fr: 'Conv. rate',
    en: 'Conv. rate',
  },
  'conf.deliveryRate': {
    ar: 'نسبة التسليم',
    fr: 'Delivery rate',
    en: 'Delivery rate',
  },
  'conf.highToLow': {
    ar: 'من الأعلى إلى الأدنى',
    fr: 'High to low',
    en: 'High to low',
  },
  'conf.lowToHigh': {
    ar: 'من الأدنى إلى الأعلى',
    fr: 'Low to high',
    en: 'Low to high',
  },
  'conf.avgHandling': {
    ar: 'متوسط وقت المعالجة',
    fr: 'Avg handling time',
    en: 'Avg handling time',
  },
  'conf.avgSession': {
    ar: 'متوسط مدة الجلسة',
    fr: 'Avg session duration',
    en: 'Avg session duration',
  },
  'conf.contactedTeam': {
    ar: 'تم الاتصال بهم (الفريق)',
    fr: 'Contacted (team)',
    en: 'Contacted (team)',
  },
  'conf.teamConvRate': {
    ar: 'نسبة تأكيد الفريق',
    fr: 'Team conv. rate',
    en: 'Team conv. rate',
  },
  'conf.calls': {
    ar: 'اتصال',
    fr: 'Calls',
    en: 'Calls',
  },
  'conf.totalCallTime': {
    ar: 'مدة الاتصال الإجمالية',
    fr: 'Total call time',
    en: 'Total call time',
  },
  'conf.sessionDuration': {
    ar: 'مدة العمل',
    fr: 'Session duration',
    en: 'Session duration',
  },
  'conf.assigned': {
    ar: 'المخصصة',
    fr: 'Assigned',
    en: 'Assigned',
  },
  'conf.contacted': {
    ar: 'تم الاتصال',
    fr: 'Contacted',
    en: 'Contacted',
  },
  'conf.confirmed': {
    ar: 'المؤكدة',
    fr: 'Confirmed',
    en: 'Confirmed',
  },
  'conf.inProgress': {
    ar: 'قيد المعالجة',
    fr: 'In progress',
    en: 'In progress',
  },
  'conf.callbacks': {
    ar: 'مواعيد ورسائل',
    fr: 'Callbacks',
    en: 'Callbacks',
  },
  'conf.noAnswer': {
    ar: 'لم يرد',
    fr: 'No answer',
    en: 'No answer',
  },
  'conf.review': {
    ar: 'ملغاة / للمراجعة',
    fr: 'Review',
    en: 'Review',
  },
  'conf.recentActivity': {
    ar: 'عملية حديثة',
    fr: 'recent activity',
    en: 'recent activity',
  },
  'conf.viewDetails': {
    ar: 'عرض التفاصيل',
    fr: 'View details',
    en: 'View details',
  },
  'conf.save': {
    ar: 'حفظ الإعدادات',
    fr: 'Enregistrer',
    en: 'Save',
  },
  'conf.rebalance': {
    ar: 'إعادة التوزيع بالتساوي',
    fr: 'Rééquilibrer',
    en: 'Rebalance',
  },
  'conf.rebalancing': {
    ar: 'جارٍ إعادة التوزيع...',
    fr: 'Rééquilibrage...',
    en: 'Rebalancing...',
  },
  'conf.sortBy': {
    ar: 'ترتيب حسب',
    fr: 'Sort by',
    en: 'Sort by',
  },
  'conf.descending': {
    ar: 'تنازلي (من الأعلى)',
    fr: 'Descending',
    en: 'Descending',
  },
  'conf.ascending': {
    ar: 'تصاعدي (من الأدنى)',
    fr: 'Ascending',
    en: 'Ascending',
  },
  'conf.totalOrders': {
    ar: 'إجمالي الطلبيات',
    fr: 'Total orders',
    en: 'Total orders',
  },
  'conf.activeAgents': {
    ar: 'المؤكدون النشطون',
    fr: 'Active Agents',
    en: 'Active Agents',
  },
  'conf.shipped': {
    ar: 'المشحونة',
    fr: 'Shipped',
    en: 'Shipped',
  },
  'conf.delivered': {
    ar: 'المسلّمة',
    fr: 'Delivered',
    en: 'Delivered',
  },
  'conf.totalCalls': {
    ar: 'إجمالي المكالمات',
    fr: 'Total calls',
    en: 'Total calls',
  },
  'conf.sessionTime': {
    ar: 'وقت الجلسة',
    fr: 'Session time',
    en: 'Session time',
  },
  'conf.recentOrders': {
    ar: 'آخر الطلبيات المعالجة',
    fr: 'Recent orders',
    en: 'Recent orders',
  },
  'conf.viewLead': {
    ar: 'فتح في مركز الاتصال',
    fr: 'View in Call Center',
    en: 'View in Call Center',
  },
  'conf.status': {
    ar: 'الحالة',
    fr: 'Statut',
    en: 'Status',
  },
  'conf.active': {
    ar: 'نشط (متصل)',
    fr: 'Actif (En ligne)',
    en: 'Active (Online)',
  },
  'conf.inactive': {
    ar: 'غير نشط (غير متصل)',
    fr: 'Inactif (Hors ligne)',
    en: 'Inactive (Offline)',
  },
  'conf.online': {
    ar: 'متصل 🟢',
    fr: 'En ligne 🟢',
    en: 'Online 🟢',
  },
  'conf.busy': {
    ar: 'في مكالمة 📞',
    fr: 'En appel 📞',
    en: 'In Call 📞',
  },
  'conf.paused': {
    ar: 'في استراحة ☕',
    fr: 'En pause ☕',
    en: 'On Break ☕',
  },
  'conf.idle': {
    ar: 'خامل / بالانتظار 🟡',
    fr: 'Inactif / En attente 🟡',
    en: 'Idle 🟡',
  },
  'conf.offline': {
    ar: 'غير متصل ⚪',
    fr: 'Hors ligne ⚪',
    en: 'Offline ⚪',
  },
  'conf.liveSync': {
    ar: 'مباشر (تحديث فوري)',
    fr: 'En direct (Temps réel)',
    en: 'Live (Real-time)',
  },
  'conf.onlineCount': {
    ar: 'متصلون الآن',
    fr: 'En ligne maintenant',
    en: 'Online now',
  },
  'conf.heroTitle': {
    ar: 'لوحة الأداء والمتابعة الخاصة بك 🎯',
    fr: 'Votre Espace Performance & Objectifs 🎯',
    en: 'Your Personal Performance Dashboard 🎯',
  },
  'conf.heroDesc': {
    ar: 'أهلاً بك! إليك أرقامك المباشرة، نسبة التحويل وحالة الطلبيات المخصصة لك.',
    fr: 'Bienvenue ! Voici vos indicateurs en direct, taux de transformation et commandes assignées.',
    en: 'Welcome! Here are your live metrics, conversion rate, and assigned orders.',
  },

  // Logistics & Orders Page
  'orders.title': {
    ar: 'إدارة الشحن واللوجستيك',
    fr: 'Gestion des Expéditions & Logistique',
    en: 'Shipping & Logistics Management',
  },
  'orders.subtitle': {
    ar: 'مخصص حصرياً للطلبيات المؤكدة 100% للتغليف، التوزيع على شركات الشحن ومتابعة التحصيل والتسليم.',
    fr: 'Espace exclusivement réservé aux colis confirmés pour l\'emballage, transmission aux transporteurs et suivi des livraisons.',
    en: 'Exclusively for 100% confirmed orders for packaging, courier dispatch, and delivery tracking.',
  },
  'orders.badge': {
    ar: 'لوجستيك مؤكد 100%',
    fr: 'Logistique 100% Confirmé',
    en: '100% Confirmed Logistics',
  },
  'orders.toShip': {
    ar: 'جاهزة للشحن (A Expédier)',
    fr: 'À Expédier (Prêt)',
    en: 'Ready to Ship',
  },
  'orders.inDelivery': {
    ar: 'قيد التوزيع',
    fr: 'En Livraison',
    en: 'In Delivery',
  },
  'orders.deliveredTab': {
    ar: 'تم التسليم',
    fr: 'Livrées',
    en: 'Delivered',
  },
  'orders.returnedTab': {
    ar: 'المرتجعات',
    fr: 'Retours',
    en: 'Returned',
  },
  'orders.searchPlaceholder': {
    ar: 'البحث برقم الطلبية، اسم الزبون، رقم الهاتف أو رقم التتبع...',
    fr: 'Rechercher par numéro de commande, nom du client, numéro de téléphone ou tracking...',
    en: 'Search by order number, customer name, phone, or tracking...',
  },
  'orders.selectedItems': {
    ar: 'طلبية محددة',
    fr: 'commandes sélectionnées',
    en: 'orders selected',
  },
  'orders.courierSelect': {
    ar: 'شركة الشحن :',
    fr: 'Transporteur :',
    en: 'Courier:',
  },
  'orders.assignTo': {
    ar: 'تعيين إلى :',
    fr: 'Assigner à :',
    en: 'Assign to:',
  },

  // Manual Order Modal
  'manual.modalTitle': {
    ar: 'إضافة طلبية يدوية جديدة',
    fr: 'Nouvelle Commande Manuelle',
    en: 'New Manual Order',
  },
  'manual.modalSubtitle': {
    ar: 'تسجيل طلبية واردة عبر الواتساب، مكالمة هاتفية أو بتوصية من صديق',
    fr: 'Enregistrement direct d\'un lead reçu via WhatsApp, appel ou bouche-à-oreille',
    en: 'Direct entry of an order received via WhatsApp, phone call, or referral',
  },
  'manual.store': {
    ar: 'المتجر / المشروع',
    fr: 'Boutique / Projet',
    en: 'Store / Project',
  },
  'manual.source': {
    ar: 'مصدر الطلبية (Canal)',
    fr: 'Canal / Source du Lead',
    en: 'Order Source / Channel',
  },
  'manual.destination': {
    ar: 'الوجهة المباشرة للطلبية',
    fr: 'Statut Immédiat de la Commande',
    en: 'Immediate Order Destination',
  },
  'manual.destConfirmed': {
    ar: 'مؤكدة مباشرة (إلى قسم اللوجستيك والشحن)',
    fr: 'Confirmée directement (Passer à la Logistique)',
    en: 'Directly Confirmed (Go to Logistics)',
  },
  'manual.destPending': {
    ar: 'قيد الانتظار (إلى مركز الاتصال للمتابعة)',
    fr: 'En attente (Rester au Centre d\'Appel)',
    en: 'Pending (Stay in Call Center)',
  },
  'manual.clientName': {
    ar: 'اسم الزبون الكامل',
    fr: 'Nom complet du client',
    en: 'Full Customer Name',
  },
  'manual.phone': {
    ar: 'رقم الهاتف',
    fr: 'Numéro de téléphone',
    en: 'Phone Number',
  },
  'manual.city': {
    ar: 'مدينة التوصيل',
    fr: 'Ville de livraison',
    en: 'Delivery City',
  },
  'manual.address': {
    ar: 'العنوان الدقيق / الحي',
    fr: 'Adresse exacte / Quartier',
    en: 'Exact Address / Neighborhood',
  },
  'manual.product': {
    ar: 'المنتوج المطلوب',
    fr: 'Produit commandé',
    en: 'Ordered Product',
  },
  'manual.quantity': {
    ar: 'الكمية',
    fr: 'Quantité',
    en: 'Quantity',
  },
  'manual.sellingPrice': {
    ar: 'سعر البيع الإجمالي (درهم)',
    fr: 'Prix total de vente (MAD)',
    en: 'Total Selling Price (MAD)',
  },
  'manual.cogs': {
    ar: 'تكلفة شراء الوحدة (درهم)',
    fr: 'Coût unitaire d\'achat (MAD)',
    en: 'Unit Product Cost (MAD)',
  },
  'manual.upsellPrime': {
    ar: 'عمولة البيع الإضافي (UpSell MAD)',
    fr: 'Commission UpSell de l\'Agent (MAD)',
    en: 'Agent UpSell Bonus (MAD)',
  },
  'manual.deliveryNotes': {
    ar: 'تعليمات التوصيل وملاحظات الزبون',
    fr: 'Instructions de livraison / Note',
    en: 'Delivery Instructions / Notes',
  },
  'manual.submit': {
    ar: 'تسجيل وإنشاء الطلبية',
    fr: 'Enregistrer & Créer la Commande',
    en: 'Save & Create Order',
  },

  // Productivity Page
  'prod.title': {
    ar: 'إنتاجية المؤكدين وتتبع الوقت الضائع',
    fr: 'Productivité des Agents & Temps Mort',
    en: 'Agent Productivity & Idle Gap Time',
  },
  'prod.subtitle': {
    ar: 'مراقبة وتيرة العمل، كشف أوقات الفراغ غير المبررة بين الاتصالات وتحديد المؤكد الأسرع لتوزيع الطلبيات.',
    fr: 'Contrôle des cadences, détection des temps d\'inactivité et recommandation de dispatch.',
    en: 'Cadence control, idle time gap tracking, and smart agent dispatch recommendation.',
  },
  'prod.avgGap': {
    ar: 'متوسط الوقت بين الطلبيات',
    fr: 'Temps moyen entre commandes',
    en: 'Average time between orders',
  },
  'prod.dispatchTop': {
    ar: 'المؤكد الأفضل لتوزيع الطلبيات الجارية :',
    fr: 'Agent recommandé pour le prochain dispatch :',
    en: 'Recommended agent for next dispatch:',
  },
  'prod.heroTitle': {
    ar: 'توصية التوزيع الذكية (المؤكد الأكثر جاهزية)',
    fr: 'Recommandation Dispatch Intelligente (L\'Agent le plus en forme)',
    en: 'Smart Dispatch Recommendation (Top Active Agent)',
  },
  'prod.heroGiveTo': {
    ar: '⚡ قم بإعطاء الطلبيات الجديدة إلى :',
    fr: '⚡ Donnez les nouveaux leads à :',
    en: '⚡ Assign new leads to:',
  },
  'prod.heroScore': {
    ar: 'نقاط الجاهزية :',
    fr: 'Score Dispatch :',
    en: 'Dispatch Score:',
  },
  'prod.distributeOrders': {
    ar: 'توزيع الطلبيات',
    fr: 'Distribuer des Commandes',
    en: 'Dispatch Orders',
  },

  // Audit Logs Page
  'audit.title': {
    ar: 'سجل العمليات والشفافية (Audit Log)',
    fr: 'Journal d\'Audit & Historique des Actions',
    en: 'Audit Logs & Action History',
  },
  'audit.subtitle': {
    ar: 'تتبع شامل لكل عملية تعديل، إلغاء، حذف، أو تغيير حالة مع تحديد الفاعل والتاريخ بالساعة والثانية.',
    fr: 'Traçabilité complète de toutes les modifications, suppressions et changements de statut.',
    en: 'Full traceability of all modifications, deletions, and status changes with timestamps.',
  },
  'audit.oldValue': {
    ar: 'القيمة السابقة :',
    fr: 'Ancienne valeur :',
    en: 'Old value:',
  },
  'audit.newValue': {
    ar: 'القيمة الجديدة :',
    fr: 'Nouvelle valeur :',
    en: 'New value:',
  },

  // Expenses Page
  'exp.title': {
    ar: 'إدارة المصاريف والتكاليف العامة',
    fr: 'Gestion des Dépenses & Charges',
    en: 'Expenses & Operating Costs',
  },
  'exp.subtitle': {
    ar: 'تسجيل التكاليف الإعلانية، الشحن، التغليف، الاتصالات ومصاريف التسيير لحساب هامش الربح الصافي بدقة.',
    fr: 'Enregistrement des charges fixes et variables pour un calcul précis du profit net.',
    en: 'Log fixed and variable operating costs for accurate net profit calculation.',
  },
  'exp.addExpense': {
    ar: '+ إضافة مصروف جديد',
    fr: '+ Ajouter une Charge',
    en: '+ Add Expense',
  },

  // Leaderboard Page
  'lead.title': {
    ar: 'تحدي الشهر والترتيب العام 🏆',
    fr: 'Leaderboard & Challenge Mensuel 🏆',
    en: 'Monthly Challenge & Leaderboard 🏆',
  },
  'lead.subtitle': {
    ar: 'منصة المنافسة بين المؤكدين، منصة التتويج، الجوائز التحفيزية والهدف الشهري لرفع نسبة التأكيد.',
    fr: 'Podium en direct, objectifs mensuels et primes de motivation pour booster le taux de confirmation.',
    en: 'Live podium, monthly targets, and incentives to boost team confirmation rates.',
  },

  // Live Agent Presence
  'presence.title': {
    ar: 'حالة الوكلاء المباشرة',
    fr: 'Statut des Agents en Direct',
    en: 'Live Agents Status',
  },
  'presence.subtitle': {
    ar: 'مراقبة حية للمتصلين، الوكلاء الذين يجرون مكالمات، وفترات الاستراحة في الوقت الفعلي.',
    fr: 'Suivi en temps réel des agents connectés, en cours d\'appel et en pause.',
    en: 'Real-time monitoring of connected agents, active calls, and breaks.',
  },
  'presence.online': {
    ar: 'متصل ونشط',
    fr: 'En ligne & Actif',
    en: 'Online & Active',
  },
  'presence.busy': {
    ar: 'في مكالمة حالياً',
    fr: 'En cours d\'appel',
    en: 'In a call',
  },
  'presence.paused': {
    ar: 'في استراحة',
    fr: 'En pause',
    en: 'On break',
  },
  'presence.idle': {
    ar: 'خامل (بدون نشاط)',
    fr: 'Inactif / En veille',
    en: 'Idle / Inactive',
  },
  'presence.offline': {
    ar: 'غير متصل',
    fr: 'Hors ligne',
    en: 'Offline',
  },
  'presence.agentsOnline': {
    ar: 'وكلاء متصلون',
    fr: 'Agents en direct',
    en: 'Agents online',
  },
  'presence.myStatus': {
    ar: 'حالتي الحالية :',
    fr: 'Mon statut actuel :',
    en: 'My current status:',
  },
  'presence.setAvailable': {
    ar: '🟢 متاح للاتصال',
    fr: '🟢 Disponible pour appels',
    en: '🟢 Available for calls',
  },
  'presence.setPaused': {
    ar: '☕ في استراحة',
    fr: '☕ En pause',
    en: '☕ On break',
  },
  'presence.todayCalls': {
    ar: 'مكالمات اليوم',
    fr: 'Appels auj.',
    en: 'Calls today',
  },
  'presence.todayConfirmed': {
    ar: 'مؤكدة اليوم',
    fr: 'Confirmées auj.',
    en: 'Confirmed today',
  },
  'presence.lastSeen': {
    ar: 'آخر إشارة :',
    fr: 'Dernier signal :',
    en: 'Last ping:',
  },
  'presence.justNow': {
    ar: 'الآن',
    fr: 'À l\'instant',
    en: 'Just now',
  },
  'presence.viewProductivity': {
    ar: 'فتح لوحة الإنتاجية وتفاصيل الوقت ➔',
    fr: 'Ouvrir le suivi de productivité ➔',
    en: 'Open Productivity & Time Audit ➔',
  },
  'presence.liveBarTitle': {
    ar: 'فريق مركز الاتصال في المباشر :',
    fr: 'Équipe Call Center en direct :',
    en: 'Live Call Center Team:',
  },
  'presence.noAgents': {
    ar: 'لا يوجد أي وكيل متصل حالياً',
    fr: 'Aucun agent connecté actuellement',
    en: 'No agents currently online',
  },
  'presence.liveStatusCol': {
    ar: 'الحالة المباشرة',
    fr: 'Statut en direct',
    en: 'Live Status',
  },

  // Login Page
  'login.title': {
    ar: 'تسجيل الدخول إلى منصتك',
    fr: 'Connexion à votre espace COD',
    en: 'Sign in to your COD space',
  },
  'login.subtitle': {
    ar: 'أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى جلسة العمل الخاصة بك.',
    fr: 'Entrez vos identifiants pour accéder à votre session de travail.',
    en: 'Enter your credentials to access your work session.',
  },
  'login.email': {
    ar: 'البريد الإلكتروني',
    fr: 'Adresse Email',
    en: 'Email Address',
  },
  'login.emailPlaceholder': {
    ar: 'agent@exemple.com',
    fr: 'agent@exemple.com',
    en: 'agent@example.com',
  },
  'login.password': {
    ar: 'كلمة المرور',
    fr: 'Mot de passe',
    en: 'Password',
  },
  'login.signInBtn': {
    ar: 'تسجيل الدخول ➔',
    fr: 'Se connecter ➔',
    en: 'Sign In ➔',
  },
  'login.signingIn': {
    ar: 'جاري التحقق والاتصال...',
    fr: 'Connexion en cours...',
    en: 'Signing in...',
  },
  'login.quickAccess': {
    ar: 'حسابات الدخول السريع (للتجربة بنقرة واحدة) :',
    fr: 'Accès rapide (Comptes de test 1-clic) :',
    en: 'Quick Access (1-Click demo accounts):',
  },
  'login.adminHint': {
    ar: 'المدير العام (Admin)',
    fr: 'Administrateur Général',
    en: 'Administrator',
  },
  'login.agentHint': {
    ar: 'وكيلة التأكيد (Agent Salma)',
    fr: 'Agent de confirmation (Salma)',
    en: 'Call Center Agent (Salma)',
  },
  'login.logout': {
    ar: 'تسجيل الخروج',
    fr: 'Déconnexion',
    en: 'Sign Out',
  },

  // Header additional keys
  'header.currencyLabel': {
    ar: 'العملة :',
    fr: 'Devise :',
    en: 'Currency:',
  },
  'header.assigned': {
    ar: 'مُعيّنة',
    fr: 'Assignée',
    en: 'Assigned',
  },
  'header.allStoresOfCountry': {
    ar: '🛍️ جميع المتاجر والمشاريع',
    fr: '🛍️ Toutes les boutiques',
    en: '🛍️ All Stores & Projects',
  },
  'header.noStoreOfCountry': {
    ar: 'لا توجد أي متجر',
    fr: 'Aucune boutique',
    en: 'No Store',
  },
  'header.createStoreTitle': {
    ar: 'إنشاء متجر جديد',
    fr: 'Créer une nouvelle boutique',
    en: 'Create New Store',
  },
  'header.createStoreDesc': {
    ar: 'سيكون لكل متجر سر الويب هوك الخاص به لربط صفحات الهبوط وبيكسل فيسبوك.',
    fr: 'Chaque boutique aura son propre Webhook Secret pour relier vos landing pages et Facebook Pixel.',
    en: 'Each store will have its own Webhook Secret to link landing pages and Facebook Pixel.',
  },
  'header.countryAndCurrency': {
    ar: 'بلد وعملة المشروع *',
    fr: 'Pays & Devise du Projet *',
    en: 'Project Country & Currency *',
  },
  'header.storeCurrencyNotice': {
    ar: 'المخزون والطلبيات والمحاسبة لهذا البلد ستكون معزولة 100% بهذه العملة.',
    fr: 'Le stock, les commandes et la comptabilité de ce pays seront 100% isolés dans cette devise.',
    en: 'Stock, orders, and accounting for this country will be 100% isolated in this currency.',
  },
  'header.storeName': {
    ar: 'اسم المتجر *',
    fr: 'Nom de la boutique *',
    en: 'Store Name *',
  },
  'header.storeSlug': {
    ar: 'المعرف الفريد (Slug) *',
    fr: 'Identifiant Unique (Slug) *',
    en: 'Unique Slug *',
  },
  'header.createStoreBtn': {
    ar: 'إنشاء المتجر',
    fr: 'Créer la boutique',
    en: 'Create Store',
  },
  'header.creating': {
    ar: 'جاري الإنشاء...',
    fr: 'Création...',
    en: 'Creating...',
  },

  // Expenses page full keys
  'exp.quickAdd': {
    ar: 'إضافة سريعة :',
    fr: 'Ajout Rapide :',
    en: 'Quick Add:',
  },
  'exp.cat.phone': {
    ar: 'اشتراك الهاتف وبطاقات SIM',
    fr: 'Abonnement Téléphone & SIM',
    en: 'Phone Subscription & SIM',
  },
  'exp.cat.cogs': {
    ar: 'سعر شراء المنتجات (المخزون)',
    fr: "Prix d'Achat Produit (Stock)",
    en: 'Product Purchase Cost (Stock)',
  },
  'exp.cat.shipping': {
    ar: 'فواتير الشحن والتوصيل',
    fr: 'Frais de Livraison',
    en: 'Shipping & Delivery Fees',
  },
  'exp.cat.fbAds': {
    ar: 'إعلانات فيسبوك',
    fr: 'Facebook Ads',
    en: 'Facebook Ads',
  },
  'exp.cat.tiktokAds': {
    ar: 'إعلانات تيك توك',
    fr: 'TikTok Ads',
    en: 'TikTok Ads',
  },
  'exp.cat.packaging': {
    ar: 'التغليف والكرتون',
    fr: 'Packaging & Cartons',
    en: 'Packaging & Boxes',
  },
  'exp.cat.salaries': {
    ar: 'الرواتب والمكافآت',
    fr: 'Salaires & Primes',
    en: 'Salaries & Bonuses',
  },
  'exp.cat.rent': {
    ar: 'الإيجار والمصاريف الثابتة',
    fr: 'Loyer & Fixe',
    en: 'Rent & Fixed Costs',
  },
  'exp.card.total': {
    ar: 'إجمالي المصاريف',
    fr: 'Total Charges',
    en: 'Total Expenses',
  },
  'exp.card.cogs': {
    ar: 'شراء المخزون',
    fr: 'Achat Stock',
    en: 'Stock Purchases',
  },
  'exp.card.shipping': {
    ar: 'فواتير الشحن',
    fr: 'Frais Livraison',
    en: 'Delivery Fees',
  },
  'exp.card.phone': {
    ar: 'الاتصالات وبطاقات SIM',
    fr: 'Télécoms & SIM',
    en: 'Telecom & SIM',
  },
  'exp.card.ads': {
    ar: 'الإعلانات (FB/TikTok)',
    fr: 'Ads (FB/TikTok)',
    en: 'Ads (FB/TikTok)',
  },
  'exp.card.team': {
    ar: 'الفريق والتغليف',
    fr: 'Équipe & Cartons',
    en: 'Team & Boxes',
  },
  'exp.card.opCount': {
    ar: 'عملية مسجلة',
    fr: 'opération(s)',
    en: 'transaction(s)',
  },
  'exp.card.ofExpenses': {
    ar: 'من المصاريف',
    fr: 'des dépenses',
    en: 'of expenses',
  },
  'exp.card.carrierInvoices': {
    ar: 'فواتير شركات الشحن',
    fr: 'Factures transporteurs',
    en: 'Carrier invoices',
  },
  'exp.card.callPlans': {
    ar: 'باقات وتعبئات المكالمات',
    fr: 'Forfaits & recharges Call',
    en: 'Call plans & recharges',
  },
  'exp.card.salariesPackaging': {
    ar: 'رواتب + تغليف وكرتون',
    fr: 'Salaires + Packaging',
    en: 'Salaries + Packaging',
  },
  'exp.diag.title': {
    ar: 'التشخيص الذكي : تحليل تأثير التكاليف على أرباحك',
    fr: "Diagnostic Intelligent : Analyse d'Impact des Charges sur votre Profit",
    en: 'Smart Diagnosis: Expense Impact Analysis on Profit',
  },
  'exp.diag.subtitle': {
    ar: 'تحليل مفصل : تكلفة شراء السلع (COGS)، الشحن، الإعلانات والاتصالات مع نصائح لرفع هامش الربح الصافي.',
    fr: "Analyse détaillée : Coût d'achat marchandises (COGS), expéditions, publicité et téléphonie avec conseils d'optimisation de la marge nette.",
    en: 'Detailed breakdown: Goods purchase costs (COGS), shipping, ads, and telecoms with net margin optimization advice.',
  },
  'exp.diag.netMargin': {
    ar: 'هامش الربح الصافي الحالي :',
    fr: 'Marge Nette Actuelle :',
    en: 'Current Net Margin:',
  },
  'exp.diag.cogsTitle': {
    ar: '1. تكلفة شراء البضائع',
    fr: "1. Coût d'Achat Marchandises",
    en: '1. Goods Purchase Cost',
  },
  'exp.diag.cogsDesc': {
    ar: "يمثل شراء المخزون الجزء الأكبر من مصاريفك التشغيلية. نصيحة: أي تخفيض يتم التفاوض عليه مع الموردين ينعكس مباشرة كربح صافٍ في خزينتك.",
    fr: "L'achat de stock représente la part majeure de vos dépenses courantes. Conseil : Toute réduction unitaire négociée auprès de vos fournisseurs se répercute directement en profit net dans votre trésorerie.",
    en: "Stock purchasing represents the major share of your expenses. Tip: Any unit cost reduction negotiated with suppliers turns directly into net profit in your cashflow.",
  },
  'exp.diag.shipTitle': {
    ar: '2. مصاريف الشحن والمرتجعات',
    fr: "2. Frais d'Expédition & Retours",
    en: '2. Shipping & Return Fees',
  },
  'exp.diag.returnRateLabel': {
    ar: 'نسبة المرتجع :',
    fr: 'Taux Retour :',
    en: 'Return Rate:',
  },
  'exp.diag.shipAlert': {
    ar: 'تنبيه : نسبة المرتجع المرتفعة تسبب خسائر في تكاليف الشحن. الحل: تحقق بدقة من العنوان وجاهزية الزبون قبل كل إرسال.',
    fr: "Alerte : Un taux de retour élevé entraîne des coûts d'expédition à perte. Solution : Validez précisément l'adresse et la disponibilité du client avant chaque envoi.",
    en: "Alert: High return rate causes wasted shipping costs. Solution: Accurately verify address and customer availability before shipping.",
  },
  'exp.diag.shipOk': {
    ar: 'راقب بانتظام بوليصات شركات الشحن وطابق الطرود المسلّمة مع المداخيل المحصلة فعلياً.',
    fr: "Contrôlez régulièrement les bordereaux de vos transporteurs et rapprochez les colis livrés avec les encaissements effectifs.",
    en: "Regularly audit carrier manifests and reconcile delivered parcels with actual cash collections.",
  },
  'exp.diag.phoneTitle': {
    ar: '3. الاتصالات ومركز الاتصال',
    fr: "3. Téléphonie & Centre d'Appel",
    en: '3. Telecom & Call Center',
  },
  'exp.diag.phoneDesc': {
    ar: "يجب أن تظل تكاليف الاتصال محسنة. ممارسة جيدة: استخدم باقات المكالمات اللامحدودة للحفاظ على أقل تكلفة لكل تأكيد.",
    fr: "Les frais de communication doivent rester optimisés. Bonne pratique : Utilisez des forfaits d'appels illimités pour maintenir un coût par confirmation le plus bas possible.",
    en: "Communication costs must stay optimized. Best practice: Use unlimited calling plans to keep cost per confirmation as low as possible.",
  },
  'exp.diag.adsTitle': {
    ar: '4. المصاريف الإعلانية (Ads)',
    fr: '4. Dépenses Publicitaires (Ads)',
    en: '4. Ad Spend',
  },
  'exp.diag.adsAlert': {
    ar: 'تنبيه : مصاريفك الإعلانية تتجاوز 40% من رقم المعاملات. فعّل البيع الإضافي (UpSell) لرفع متوسط قيمة السلة.',
    fr: "Alerte : Vos dépenses publicitaires dépassent 40% du chiffre d'affaires. Activez l'UpSell pour augmenter le panier moyen.",
    en: "Alert: Your ad spend exceeds 40% of revenue. Activate UpSell to increase the average order value.",
  },
  'exp.diag.adsOk': {
    ar: 'المصاريف الإعلانية متوازنة ومضبوطة مقارنة بالإيرادات المحصلة. حافظ على هذا المستوى من المردودية.',
    fr: "Dépenses publicitaires équilibrées et maîtrisées par rapport aux revenus générés. Maintenez ce niveau de rentabilité.",
    en: "Ad spend is balanced and well-managed relative to revenue. Maintain this level of profitability.",
  },
  'exp.filter.by': {
    ar: 'تصفية حسب :',
    fr: 'Filtrer par :',
    en: 'Filter by:',
  },
  'exp.filter.allCategories': {
    ar: 'جميع الفئات',
    fr: 'Toutes les Catégories',
    en: 'All Categories',
  },
  'exp.filter.to': {
    ar: 'إلى',
    fr: 'à',
    en: 'to',
  },
  'exp.filter.reset': {
    ar: 'إلغاء التصفية',
    fr: 'Réinitialiser',
    en: 'Reset',
  },
  'exp.filter.displayed': {
    ar: 'مصروف معروض',
    fr: 'dépense(s) affichée(s)',
    en: 'expense(s) shown',
  },
  'exp.table.title': {
    ar: 'سجل المصاريف الأخيرة',
    fr: 'Journal des Dépenses Récentes',
    en: 'Recent Expenses Log',
  },
  'exp.table.emptyTitle': {
    ar: 'لا توجد مصاريف مسجلة حتى الآن',
    fr: 'Aucune dépense enregistrée pour le moment',
    en: 'No expenses recorded yet',
  },
  'exp.table.emptyDesc': {
    ar: 'قم بتسجيل اشتراكات الهاتف، مشتريات البضائع، فواتير الشحن أو الحملات الإعلانية.',
    fr: 'Saisissez vos forfaits téléphoniques, achats de produits (stock), factures de livraison ou dépenses publicitaires.',
    en: 'Record your phone plans, product stock purchases, courier invoices, or advertising spend.',
  },
  'exp.table.emptyAction': {
    ar: 'تسجيل مصروف الآن',
    fr: 'Ajouter une Dépense Maintenant',
    en: 'Add an Expense Now',
  },
  'exp.table.colDate': {
    ar: 'التاريخ',
    fr: 'Date',
    en: 'Date',
  },
  'exp.table.colStore': {
    ar: 'المتجر / المشروع',
    fr: 'Boutique',
    en: 'Store',
  },
  'exp.table.colCategory': {
    ar: 'الفئة',
    fr: 'Catégorie',
    en: 'Category',
  },
  'exp.table.colDesc': {
    ar: 'الوصف / البيان',
    fr: 'Description / Motif',
    en: 'Description / Purpose',
  },
  'exp.table.colAmount': {
    ar: 'المبلغ',
    fr: 'Montant',
    en: 'Amount',
  },
  'exp.table.colAction': {
    ar: 'إجراء',
    fr: 'Action',
    en: 'Action',
  },
  'exp.table.noDesc': {
    ar: 'بدون وصف',
    fr: 'Sans description',
    en: 'No description',
  },
  'exp.modal.title': {
    ar: 'تسجيل مصروف / تكلفة جديدة',
    fr: 'Enregistrer une Dépense / Charge',
    en: 'Record an Expense / Cost',
  },
  'exp.modal.subtitle': {
    ar: 'تحسب مباشرة في الحساب التلقائي لصافي الأرباح',
    fr: 'Comptabilisée immédiatement dans le calcul du profit',
    en: 'Immediately computed into net profit calculations',
  },
  'exp.modal.selectStore': {
    ar: 'المتجر المستهدف *',
    fr: 'Boutique concernée *',
    en: 'Target Store *',
  },
  'exp.modal.selectCategory': {
    ar: 'فئة المصروف *',
    fr: 'Catégorie de la dépense *',
    en: 'Expense Category *',
  },
  'exp.modal.amount': {
    ar: 'المبلغ *',
    fr: 'Montant *',
    en: 'Amount *',
  },
  'exp.modal.date': {
    ar: 'تاريخ الصرف *',
    fr: 'Date de la dépense *',
    en: 'Expense Date *',
  },
  'exp.modal.desc': {
    ar: 'الوصف أو الملاحظات',
    fr: 'Description / Détail',
    en: 'Description / Details',
  },
  'exp.modal.submit': {
    ar: 'تسجيل المصروف',
    fr: 'Enregistrer la Dépense',
    en: 'Record Expense',
  },

  // Admin page keys
  'admin.title': {
    ar: 'فضاء الإدارة وصلاحيات الفريق',
    fr: 'Espace Administrateur & Équipes',
    en: 'Admin Space & Team',
  },
  'admin.badge': {
    ar: 'إدارة الفريق والأدوار',
    fr: 'Gestion des Équipes & Rôles',
    en: 'Team & Role Management',
  },
  'admin.subtitle': {
    ar: 'أنشئ حسابات مؤكدي الطلبيات، أدر عمولاتهم، أعد تعيين كلمات المرور وحدد الصلاحيات بدقة.',
    fr: 'Créez les accès de vos agents de confirmation, gérez leurs commissions, réinitialisez les mots de passe et paramétrez les autorisations.',
    en: 'Create confirmation agent accounts, manage commissions, reset passwords, and configure permissions.',
  },
  'admin.createAccount': {
    ar: '+ إنشاء حساب وكيل / عضو',
    fr: 'Créer un Compte Agent / Membre',
    en: '+ Create Agent / Member Account',
  },
  'admin.loginLinkNotice': {
    ar: 'رابط تسجيل الدخول للمؤكدين (مركز الاتصال) :',
    fr: "Lien de connexion pour vos agents (Centre d'Appel) :",
    en: 'Agent login link (Call Center):',
  },
  'admin.loginLinkDesc': {
    ar: "أعط هذا الرابط لوكلائك مع بريدهم وكلمة مرورهم. بمجرد تسجيل الدخول يتم توجيههم لمركز الاتصال.",
    fr: "Donnez ce lien à vos agents avec leur Email et Mot de passe. Dès qu'ils se connectent, ils sont redirigés directement vers le Centre d'Appel.",
    en: "Give this link to agents with their email and password. Upon sign-in, they are redirected directly to the Call Center.",
  },
  'admin.copyLink': {
    ar: '📋 نسخ الرابط',
    fr: '📋 Copier le lien',
    en: '📋 Copy Link',
  },
  'admin.totalUsers': {
    ar: 'إجمالي المستخدمين',
    fr: 'Total Utilisateurs',
    en: 'Total Users',
  },
  'admin.usersDesc': {
    ar: 'المديرون والوكلاء المسجلون',
    fr: 'Administrateurs et agents enregistrés',
    en: 'Registered admins and agents',
  },
  'admin.activeAgents': {
    ar: 'وكلاء التأكيد النشطون',
    fr: 'Agents de Confirmation Actifs',
    en: 'Active Confirmation Agents',
  },
  'admin.agentsDesc': {
    ar: 'من أصل {total} وكيل',
    fr: 'Sur un total de {total} agents',
    en: 'Out of {total} agents',
  },
  'admin.leadDist': {
    ar: 'توزيع الطلبيات (Leads)',
    fr: 'Distribution des Leads',
    en: 'Lead Distribution',
  },
  'admin.distDesc': {
    ar: 'توزيع آلي عادل ومتوازن (Round-Robin)',
    fr: 'Round-Robin Automatique - Attribution équitable',
    en: 'Automatic Round-Robin - Fair distribution',
  },
  'admin.userList': {
    ar: 'قائمة أعضاء الفريق والحسابات',
    fr: 'Liste des Utilisateurs & Équipe',
    en: 'Team & User List',
  },
  'admin.filterCountry': {
    ar: 'تصفية حسب البلد :',
    fr: 'Filtrer par pays :',
    en: 'Filter by country:',
  },
  'admin.allCountries': {
    ar: '🌐 جميع البلدان',
    fr: '🌐 Tous les pays',
    en: '🌐 All countries',
  },
  'admin.colUser': {
    ar: 'المستخدم / الوكيل',
    fr: 'Utilisateur / Agent',
    en: 'User / Agent',
  },
  'admin.colRole': {
    ar: 'الدور والصلاحيات',
    fr: 'Rôle & Profil',
    en: 'Role & Profile',
  },
  'admin.colCountry': {
    ar: 'البلد والمشاريع المعينة',
    fr: 'Pays & Boutiques Assignées',
    en: 'Country & Assigned Stores',
  },
  'admin.colCommissions': {
    ar: 'العمولة والبنك',
    fr: 'Commission & Banque',
    en: 'Commission & Banking',
  },
  'admin.colStatus': {
    ar: 'الحالة',
    fr: 'Statut',
    en: 'Status',
  },
  'admin.colActions': {
    ar: 'الإجراءات',
    fr: 'Actions',
    en: 'Actions',
  },

  // Confirmers page keys
  'conf.title': {
    ar: 'إدارة المؤكدين والمحاسبة',
    fr: 'Confirmateurs & Facturation',
    en: 'Confirmers & Invoicing',
  },
  'conf.subtitle': {
    ar: 'متابعة أداء كل مؤكد، احتساب العمولات على الطلبيات المسلّمة فعلياً، وتسديد الفواتير والتحويلات.',
    fr: 'Suivi des performances, calcul des commissions sur livraisons réelles et règlement des honoraires.',
    en: 'Performance tracking, commission calculation on delivered orders, and fee settlements.',
  },
  'conf.badge': {
    ar: 'محاسبة العمولات',
    fr: 'Facturation & Règlements',
    en: 'Invoicing & Payouts',
  },
  'conf.pendingPayout': {
    ar: 'العمولات المستحقة (قيد الانتظار)',
    fr: 'Commissions Dues (En Attente)',
    en: 'Pending Commissions Due',
  },
  'conf.paidPayout': {
    ar: 'العمولات المسددة (تم التحويل)',
    fr: 'Commissions Déjà Réglées',
    en: 'Settled Commissions',
  },
  'conf.deliveredCount': {
    ar: 'الطلبيات المسلّمة والمحصلة',
    fr: 'Commandes Livrées Encaissées',
    en: 'Delivered & Paid Orders',
  },
  'conf.agentsCount': {
    ar: 'عدد المؤكدين في هذا البلد',
    fr: 'Nombre de Confirmateurs',
    en: 'Number of Confirmers',
  },
  'conf.payCommission': {
    ar: 'تسديد العمولات',
    fr: 'Régler Commissions',
    en: 'Pay Commissions',
  },
  'conf.viewStatement': {
    ar: 'كشف الحساب',
    fr: 'Voir Relevé',
    en: 'View Statement',
  },

  // Stock page keys
  'stock.title': {
    ar: 'إدارة المخزون والسلع',
    fr: 'Gestion du Stock & Entrepôt',
    en: 'Stock & Warehouse Management',
  },
  'stock.subtitle': {
    ar: 'مراقبة كميات السلع المتوفرة، تنبيهات نفاد المخزون، وتتبع حركات الدخول والخروج.',
    fr: 'Contrôle des stocks en temps réel, alertes de rupture et traçabilité des mouvements.',
    en: 'Real-time stock control, low stock alerts, and movement tracking.',
  },
  'stock.badge': {
    ar: 'المستودع والمخزون',
    fr: 'Entrepôt & Stocks',
    en: 'Warehouse & Stock',
  },
  'stock.addProduct': {
    ar: '+ إضافة منتج جديد',
    fr: '+ Nouveau Produit',
    en: '+ New Product',
  },
  'stock.adjustStock': {
    ar: 'تعديل / تموين المخزون',
    fr: 'Ajuster / Réapprovisionner',
    en: 'Adjust / Restock',
  },
  'stock.sku': {
    ar: 'رمز المنتج (SKU)',
    fr: 'Référence SKU',
    en: 'SKU Code',
  },
  'stock.productName': {
    ar: 'اسم المنتج',
    fr: 'Nom du Produit',
    en: 'Product Name',
  },
  'stock.available': {
    ar: 'الكمية المتوفرة',
    fr: 'Quantité Disponible',
    en: 'Available Quantity',
  },
  'stock.sellingPrice': {
    ar: 'ثمن البيع',
    fr: 'Prix de Vente',
    en: 'Selling Price',
  },
  'stock.costPrice': {
    ar: "ثمن الشراء (COGS)",
    fr: "Prix d'Achat",
    en: 'Cost Price',
  },
  'stock.lowStockAlert': {
    ar: 'تنبيه: مخزون حرج!',
    fr: 'Alerte: Stock Critique !',
    en: 'Alert: Critical Low Stock!',
  },

  // Commissions page keys
  'comm.title': {
    ar: 'عمولاتي وكشف الحساب 💵',
    fr: 'Mes Commissions & Facture 💵',
    en: 'My Commissions & Invoice 💵',
  },
  'comm.subtitle': {
    ar: 'كشف حساب شخصي بالطلبيات المسلّمة المؤكدة من طرفك، العمولات المكتسبة وحالة التحويل البنكي.',
    fr: 'Relevé personnel de vos commissions acquises sur commandes livrées et historique des règlements.',
    en: 'Personal statement of earned commissions on delivered orders and payout history.',
  },
  'comm.due': {
    ar: 'العمولات غير المدفوعة (في الانتظار)',
    fr: 'Commissions En Attente',
    en: 'Pending Commissions',
  },
  'comm.paid': {
    ar: 'العمولات المستلمة (تم التحويل)',
    fr: 'Commissions Payées',
    en: 'Paid Commissions',
  },
  'comm.totalEarned': {
    ar: 'إجمالي الأرباح المكتسبة',
    fr: 'Total Gains Cumulés',
    en: 'Total Earned',
  },
  'comm.upsellTotal': {
    ar: 'أرباح البيع الإضافي (UpSell)',
    fr: 'Gains Vente Additionnelle',
    en: 'UpSell Earnings',
  },

  // Leaderboard page keys
  'lead.heroTitle': {
    ar: 'ترتيب أفضل المؤكدين لهذا الشهر 🏆',
    fr: 'Classement des Meilleurs Confirmateurs 🏆',
    en: 'Top Confirmation Agents of the Month 🏆',
  },
  'lead.monthlyGoal': {
    ar: 'الهدف الشهري الجماعي',
    fr: 'Objectif Collectif du Mois',
    en: 'Monthly Team Target',
  },
  'lead.rank': {
    ar: 'الرتبة',
    fr: 'Rang',
    en: 'Rank',
  },
  'lead.agent': {
    ar: 'المؤكد',
    fr: 'Agent',
    en: 'Agent',
  },
  'lead.confirmed': {
    ar: 'الطلبيات المؤكدة',
    fr: 'Commandes Confirmées',
    en: 'Confirmed Orders',
  },
  'lead.delivered': {
    ar: 'الطلبيات المسلّمة',
    fr: 'Commandes Livrées',
    en: 'Delivered Orders',
  },
  'lead.confirmRate': {
    ar: 'نسبة التأكيد',
    fr: 'Taux de Confirmation',
    en: 'Confirmation Rate',
  },
  'lead.deliveryRate': {
    ar: 'نسبة التسليم',
    fr: 'Taux de Livraison',
    en: 'Delivery Rate',
  },
  'lead.upsellSales': {
    ar: 'مبيعات إضافية (UpSell)',
    fr: 'Ventes UpSell',
    en: 'UpSell Sales',
  },
  'lead.bonus': {
    ar: 'المنحة المستحقة',
    fr: 'Prime Estimée',
    en: 'Estimated Bonus',
  },

  // Orders additional keys
  'orders.outForDelivery': {
    ar: '🛵 خرجت للتوصيل اليوم',
    fr: '🛵 Sorti en livraison',
    en: '🛵 Out for Delivery',
  },
  'orders.deliveryIncidents': {
    ar: '🚨 تعثرات التوصيل (الموزع)',
    fr: '🚨 Incidents Livreur',
    en: '🚨 Delivery Incidents',
  },
  'orders.savedToReship': {
    ar: '🟢 تم إنقاذها لإعادة الإرسال',
    fr: '🟢 Sauvé à Relivrer',
    en: '🟢 Saved for Redelivery',
  },
  'orders.markRemittance': {
    ar: '💰 تسجيل تحصيل الأموال (Versé)',
    fr: '💰 Marquer Versé (Encaissé)',
    en: '💰 Mark Collected / Remitted',
  },
  'orders.markOutForDelivery': {
    ar: '🛵 تسجيل خرجت للتوصيل',
    fr: '🛵 Sortis en livraison',
    en: '🛵 Mark Out for Delivery',
  },
  'orders.transferTo': {
    ar: 'إرسال إلى :',
    fr: 'Transmettre à :',
    en: 'Forward to:',
  },
  'orders.localCourierSn': {
    ar: '🛵 توصيل داخلي / موزع خاص (السنغال)',
    fr: '🛵 Livraison Interne / Livreur Propre (Sénégal)',
    en: '🛵 Internal Delivery / Own Driver (Senegal)',
  },
  'orders.otherAgencySn': {
    ar: '📦 وكالة شحن محلية أخرى (السنغال)',
    fr: '📦 Autre Agence Locale (Sénégal)',
    en: '📦 Other Local Agency (Senegal)',
  },

  // Productivity additional keys
  'dashboard.confirmationRate': {
    ar: 'نسبة التأكيد',
    fr: 'Taux de Confirmation',
    en: 'Confirmation Rate',
  },
  'prod.activeAgents': {
    ar: 'الوكلاء النشطون',
    fr: 'Agents Actifs',
    en: 'Active Agents',
  },
  'prod.ordersTreated': {
    ar: 'الطلبيات المعالجة',
    fr: 'Commandes Traitées',
    en: 'Processed Orders',
  },
  'prod.avgWaitTime': {
    ar: "متوسط وقت الانتظار",
    fr: "Moyenne Temps d'Attente",
    en: 'Average Idle Time',
  },
  'prod.cadenceTarget': {
    ar: 'هدف وتيرة العمل',
    fr: 'Objectif de Cadence',
    en: 'Cadence Target',
  },
  'prod.rankDispatch': {
    ar: 'ترتيب التوزيع',
    fr: 'Rang Dispatch',
    en: 'Dispatch Rank',
  },
  'prod.agentCol': {
    ar: 'مؤكد الطلبيات',
    fr: 'Agent Confirmateur',
    en: 'Confirmation Agent',
  },
  'prod.cadenceCol': {
    ar: 'الوتيرة والسرعة',
    fr: 'Cadence & Rythme',
    en: 'Pace & Rhythm',
  },
  'prod.avgBetweenCol': {
    ar: 'متوسط الوقت بين طلبيتين',
    fr: 'Temps Moyen entre 2 Commandes',
    en: 'Average Time between 2 Orders',
  },
  'prod.totalDeadTimeCol': {
    ar: 'إجمالي الوقت الضائع (>10 دقائق)',
    fr: 'Total Temps Mort (>10 min)',
    en: 'Total Idle Time (>10 min)',
  },
  'prod.longestBreakCol': {
    ar: 'أطول فترة توقف',
    fr: 'Plus Longue Pause',
    en: 'Longest Break',
  },
  'prod.pendingLeadsCol': {
    ar: 'طلبيات في الانتظار',
    fr: 'Leads en Attente',
    en: 'Pending Leads',
  },
  'prod.detailsCol': {
    ar: 'التفاصيل',
    fr: 'Détail',
    en: 'Details',
  },
  'prod.analysisPeriod': {
    ar: 'فترة التحليل :',
    fr: "Période d'analyse :",
    en: 'Analysis period:',
  },

  // Bulk Import Orders keys
  'bulk.title': {
    ar: 'استيراد الطلبيات بالجملة (Excel / CSV)',
    fr: 'Importation en Masse de Commandes',
    en: 'Bulk Orders Import',
  },
  'bulk.subtitle': {
    ar: 'أضف عشرات أو مئات الطلبيات دفعة واحدة عبر رفع ملف إكسل أو النسخ واللصق',
    fr: 'Importez des dizaines ou centaines de commandes d\'un coup via fichier Excel ou Copier-Coller',
    en: 'Import dozens or hundreds of orders at once via Excel file or Copy-Paste',
  },
  'bulk.targetStore': {
    ar: 'المشروع / بلد الوجهة',
    fr: 'Boutique / Pays de destination',
    en: 'Store / Target Country',
  },
  'bulk.targetStatus': {
    ar: 'الحالة المبدئية للطلبيات',
    fr: 'Statut initial des commandes',
    en: 'Initial order status',
  },
  'bulk.assignMode': {
    ar: 'توزيع وتعيين المؤكدين',
    fr: 'Affectation des agents',
    en: 'Agent assignment mode',
  },
  'bulk.uploadFile': {
    ar: 'ملف إكسل / CSV',
    fr: 'Fichier Excel / CSV',
    en: 'Excel / CSV File',
  },
  'bulk.quickPaste': {
    ar: 'النسخ واللصق المباشر',
    fr: 'Copier-Coller Rapide',
    en: 'Quick Copy-Paste',
  },
  'bulk.downloadTemplate': {
    ar: 'تحميل نموذج Excel جاهز 📥',
    fr: 'Télécharger Modèle Excel 📥',
    en: 'Download Excel Template 📥',
  },
  'bulk.statusPending': {
    ar: '📞 في الانتظار (لمركز الاتصال)',
    fr: '📞 En attente (Pour le Call Center)',
    en: '📞 Pending (For Call Center)',
  },
  'bulk.statusConfirmed': {
    ar: '📦 مؤكد مباشرة (للشحن والتوصيل)',
    fr: '📦 Confirmé directement (Expédition)',
    en: '📦 Confirmed directly (Shipping)',
  },
  'bulk.assignRoundRobin': {
    ar: '🔄 توزيع تلقائي عادل بالتساوي',
    fr: '🔄 Distribution équitable automatique',
    en: '🔄 Automatic fair round-robin',
  },
  'bulk.assignSpecific': {
    ar: '👤 تعيين لمؤكد محدد',
    fr: '👤 Assigner à un agent spécifique',
    en: '👤 Assign to specific agent',
  },
  'bulk.assignUnassigned': {
    ar: '⚪ بدون تعيين (في الانتظار العام)',
    fr: '⚪ Laisser non assigné',
    en: '⚪ Leave unassigned',
  },

  // Call Strategy & Lead Rotation
  'strat.title': {
    ar: 'استراتيجية إعادة الاتصال وتدوير الطلبيات تلقائياً',
    fr: 'Stratégie de Relance & Rotation Automatique des Leads',
    en: 'Lead Relance & Auto-Rotation Strategy',
  },
  'strat.badge': {
    ar: 'حماية من الضياع 🛡️',
    fr: 'Anti-Gaspillage 🛡️',
    en: 'Anti-Loss 🛡️',
  },
  'strat.subtitle': {
    ar: 'تحكم في مهلة الانتظار، عدد الساعات، وعدد المحاولات لمنع المؤكدين من إهمال الطلبيات التي لم تجب.',
    fr: 'Contrôlez le délai d\'attente, le nombre d\'heures et de tentatives pour empêcher les agents d\'abandonner les commandes sans réponse.',
    en: 'Control timeout delay, hours, and attempts to prevent agents from abandoning unanswered leads.',
  },
  'strat.autoRotateTitle': {
    ar: 'تفعيل التدوير الذكي لطلبيات "لم يجب (Pas de réponse)"',
    fr: 'Activer la Rotation Intelligente des Leads "Pas de Réponse"',
    en: 'Enable Smart Rotation for "No Answer" Leads',
  },
  'strat.recommended': {
    ar: 'موصى به',
    fr: 'Recommandé',
    en: 'Recommended',
  },
  'strat.autoRotateDesc': {
    ar: 'إذا لم يجب العميل، يراقب النظام المهلة وعدد المكالمات لإعادة تعيين الطلبية تلقائياً لمؤكد آخر برقم ونبرة جديدة.',
    fr: 'Si un client ne répond pas, le système surveille les délais et le nombre d\'appels pour réattribuer automatiquement la commande à un autre agent avec un nouveau numéro.',
    en: 'If a customer does not answer, the system monitors timeouts and calls to automatically reassign the lead to another agent.',
  },
  'strat.maxAttemptsLabel': {
    ar: 'أقصى عدد محاولات قبل تغيير المؤكد',
    fr: 'Nombre max de tentatives avant changement d\'agent',
    en: 'Max attempts before rotating agent',
  },
  'strat.maxAttemptsDesc': {
    ar: 'بعد هذا العدد من المكالمات دون إجابة، تُسحب الطلبية من المؤكد وتُنقل لزميل آخر.',
    fr: 'Après ce nombre d\'appels sans réponse, la commande est retirée de l\'agent et transférée à un collègue.',
    en: 'After this number of unanswered calls, the order is reassigned to another agent.',
  },
  'strat.attempts2': {
    ar: 'محاولتان (2)',
    fr: '2 tentatives',
    en: '2 attempts',
  },
  'strat.attempts3': {
    ar: '3 محاولات (الافتراضي الموصى به)',
    fr: '3 tentatives (Standard Recommandé)',
    en: '3 attempts (Standard Recommended)',
  },
  'strat.attempts4': {
    ar: '4 محاولات',
    fr: '4 tentatives',
    en: '4 attempts',
  },
  'strat.attempts5': {
    ar: '5 محاولات',
    fr: '5 tentatives',
    en: '5 attempts',
  },
  'strat.timeoutHoursLabel': {
    ar: 'أقصى مهلة انتظار لإعادة الاتصال (بالساعات)',
    fr: 'Délai max d\'attente de relance (en heures)',
    en: 'Max callback wait delay (in hours)',
  },
  'strat.timeoutHoursDesc': {
    ar: 'إذا تأخر المؤكد ولم يعد الاتصال بالزبون قبل هذه المهلة، يتدخل النظام ويحول الطلبية لمؤكد آخر.',
    fr: 'Si l\'agent tarde et ne rappelle pas le client avant ce délai, le système intervient et réattribue la commande.',
    en: 'If the agent delays and doesn\'t call back within this time, the system steps in and reassigns the order.',
  },
  'strat.timeout30m': {
    ar: '30 دقيقة (ضغط عمل عاجل جداً)',
    fr: '30 minutes (Flux très urgent)',
    en: '30 minutes (Very urgent flux)',
  },
  'strat.timeout1h': {
    ar: 'ساعة واحدة (ضغط عمل سريع)',
    fr: '1 heure (Flux rapide)',
    en: '1 hour (Fast flux)',
  },
  'strat.timeout2h': {
    ar: 'ساعتان (متوازن وموصى به)',
    fr: '2 heures (Équilibré Recommandé)',
    en: '2 hours (Balanced Recommended)',
  },
  'strat.timeout3h': {
    ar: '3 ساعات',
    fr: '3 heures',
    en: '3 hours',
  },
  'strat.timeout4h': {
    ar: '4 ساعات',
    fr: '4 heures',
    en: '4 hours',
  },
  'strat.timeout6h': {
    ar: '6 ساعات',
    fr: '6 heures',
    en: '6 hours',
  },
  'strat.timeout12h': {
    ar: '12 ساعة',
    fr: '12 heures',
    en: '12 hours',
  },
  'strat.timeout24h': {
    ar: '24 ساعة (يوم كامل)',
    fr: '24 heures (1 jour)',
    en: '24 hours (1 day)',
  },
  'strat.backlogTitle': {
    ar: 'انضباط ضد الإهمال (سقف الطلبيات المتراكمة بدون إجابة)',
    fr: 'Discipline Anti-Abandon (Plafond de leads sans réponse)',
    en: 'Anti-Abandon Discipline (Unanswered backlog cap)',
  },
  'strat.fluxControl': {
    ar: 'ضبط التدفق',
    fr: 'Contrôle Flux',
    en: 'Flux Control',
  },
  'strat.backlogDesc': {
    ar: 'يمنع المؤكد من سحب طلبيات جديدة إذا تراكم لديه عدد كبير من الطلبيات في قائمة "لم يجب". يفرض عليه النظام إعادة الاتصال بهم أولاً.',
    fr: 'Empêche un agent de continuer à tirer des commandes fraîches s\'il a accumulé trop de commandes en retard dans son onglet "Pas de réponse". Le système lui sert sa relance en priorité.',
    en: 'Prevents an agent from drawing fresh leads if they have accumulated too many overdue unanswered orders. Serves follow-ups first.',
  },
  'strat.backlogCapLabel': {
    ar: 'الحد الأقصى المسموح به :',
    fr: 'Plafond max toléré :',
    en: 'Max allowed backlog:',
  },
  'strat.backlog3': {
    ar: '3 طلبيات متأخرة',
    fr: '3 leads en retard',
    en: '3 overdue leads',
  },
  'strat.backlog5': {
    ar: '5 طلبيات متأخرة',
    fr: '5 leads en retard',
    en: '5 overdue leads',
  },
  'strat.backlog8': {
    ar: '8 طلبيات متأخرة (موصى به)',
    fr: '8 leads en retard (Recommandé)',
    en: '8 overdue leads (Recommended)',
  },
  'strat.backlog10': {
    ar: '10 طلبيات متأخرة',
    fr: '10 leads en retard',
    en: '10 overdue leads',
  },
  'strat.backlog15': {
    ar: '15 طلبية متأخرة',
    fr: '15 leads en retard',
    en: '15 overdue leads',
  },
  'strat.collisionLockTitle': {
    ar: 'قفل الطلبية الذكي لمنع التضارب (Lock Anti-Collision)',
    fr: 'Verrouillage Intelligent de Commande (Lock Anti-Collision)',
    en: 'Smart Order Locking (Anti-Collision Lock)',
  },
  'strat.collisionLockDesc': {
    ar: 'يمنع مؤكدين اثنين من الاتصال بنفس الزبون في نفس اللحظة، مع إلغاء القفل تلقائياً بعد 10 دقائق من الخمول.',
    fr: 'Empêche deux agents d\'appeler le même client en même temps avec libération automatique après 10 minutes d\'inactivité.',
    en: 'Prevents two agents from calling the same customer at once, with auto-release after 10 minutes of inactivity.',
  },
  'strat.countryStrictTitle': {
    ar: 'توزيع حصري للمتاجر حسب الدولة',
    fr: 'Respect Strict des Boutiques par Pays',
    en: 'Strict Store Segmentation by Country',
  },
  'strat.countryStrictDesc': {
    ar: 'المؤكدون المعينون للمغرب يستلمون حصرياً طلبيات المغرب، ومؤكدو السنغال يستلمون حصرياً طلبيات السنغال.',
    fr: 'Les agents assignés au Maroc ne reçoivent que les leads du Maroc, et les agents du Sénégal ne reçoivent que le Sénégal.',
    en: 'Agents assigned to Morocco only receive Moroccan leads, and agents assigned to Senegal only receive Senegal leads.',
  },
  'strat.footerNotice': {
    ar: 'يتم تطبيق التعديلات فوراً على مركز الاتصال (Call Center) وقواعد التوزيع التلقائي.',
    fr: 'Les modifications sont appliquées immédiatement au Call Center et aux règles d\'attribution.',
    en: 'Changes are applied immediately to Call Center and dispatch rules.',
  },
  'strat.saveBtn': {
    ar: 'حفظ التعديلات',
    fr: 'Enregistrer les modifications',
    en: 'Save changes',
  },
  'strat.savingBtn': {
    ar: 'جاري الحفظ...',
    fr: 'Enregistrement...',
    en: 'Saving...',
  },
  'strat.saveSuccess': {
    ar: 'تم تحديث قواعد إعادة الاتصال والتدوير بنجاح!',
    fr: 'Règles de relance et rotation mises à jour avec succès !',
    en: 'Relance and rotation rules successfully updated!',
  },
  'strat.saveError': {
    ar: 'حدث خطأ أثناء حفظ الإعدادات.',
    fr: 'Erreur lors de la sauvegarde.',
    en: 'Error while saving settings.',
  },
  'conf.returnPerf': {
    ar: '📊 العودة إلى إحصائيات الأداء',
    fr: '📊 Retour aux Performances',
    en: '📊 Back to Performance',
  },
  'conf.strategyBtn': {
    ar: '⚙️ إعدادات التدوير والمهلة',
    fr: '⚙️ Stratégie & Rotation',
    en: '⚙️ Strategy & Rotation',
  },
  'conf.settingsBadge': {
    ar: 'تعديل الساعات والمحاولات ⚙️',
    fr: 'Gestion Délais & Tentatives ⚙️',
    en: 'Hours & Attempts Config ⚙️',
  },

  // SOS Delivery Alerts (Sauvetage en Temps Réel)
  'sos.bannerTitle': {
    ar: '🚨 إنقاذ فوري للطلبية: الموزع عند الزبون !',
    fr: '🚨 Sauvetage Colis en Temps Réel !',
    en: '🚨 Real-Time Delivery Rescue Alert!',
  },
  'sos.incidentAlert': {
    ar: 'الموزع أبلغ الآن: الزبون لا يجيب على الهاتف !',
    fr: 'Le livreur a signalé : Client Ne Répond Pas !',
    en: 'Courier reported: Customer Does Not Answer!',
  },
  'sos.incidentDesc': {
    ar: 'الموزع متواجد حالياً بحي الزبون. اتصل بالزبون فوراً قبل مغادرة الموزع لإنقاذ الشحنة ومنع الروتور!',
    fr: 'Le livreur est actuellement dans le quartier du client. Intervenez immédiatement avant qu\'il ne quitte la zone pour éviter le retour !',
    en: 'The courier is currently in the customer neighborhood. Intervene immediately before they leave the area to prevent return!',
  },
  'sos.callClient': {
    ar: '📞 الاتصال بالزبون الآن',
    fr: '📞 Appeler le Client',
    en: '📞 Call Customer',
  },
  'sos.whatsappCourier': {
    ar: '🛵 واتساب للموزع',
    fr: '🛵 WhatsApp Livreur',
    en: '🛵 WhatsApp Courier',
  },
  'sos.markSaved': {
    ar: '✅ تم الإنقاذ (الزبون جاهز)',
    fr: '✅ Marquer Sauvé (Client Prévenu)',
    en: '✅ Mark Rescued (Customer Ready)',
  },
  'sos.saving': {
    ar: 'جاري الحفظ...',
    fr: 'Enregistrement...',
    en: 'Saving...',
  },
};



export type RadarCategory = 'COSMETICS' | 'SUPPLEMENTS' | 'KITCHEN' | 'CAR' | 'WELLNESS' | 'HOME';
export type RadarFilter = RadarCategory | 'BOTH' | 'ALL';

export interface RadarEvidence {
  market: string;
  detail: string;
  url: string;
}

export interface RadarProduct {
  name: string;
  brand: string;
  variant: string;
  category: RadarCategory;
  identityUrl: string;
  suggestedRetail?: number;
  estimatedWholesale?: number;
  demand: RadarEvidence[];
  local: RadarEvidence | null;
  supplier: RadarEvidence | null;
}

export const referenceDate = '2026-11-13';

export function radarReferences(ar: boolean): RadarProduct[] {
  return [
    {
      name: 'Advanced Snail 96 Mucin Power Essence',
      brand: 'COSRX',
      variant: '100 mL · 3.38 fl oz',
      category: 'COSMETICS',
      identityUrl: 'https://www.ulta.com/p/advanced-snail-96-mucin-power-essence-xlsImpprod15641052',
      suggestedRetail: 249,
      estimatedWholesale: 65,
      demand: [{
        market: ar ? 'الولايات المتحدة' : 'États-Unis',
        detail: ar ? 'أكثر من 4,000 تقييم على Ulta لصفحة المنتج.' : 'Plus de 4 000 avis sur la fiche Ulta.',
        url: 'https://www.ulta.com/p/advanced-snail-96-mucin-power-essence-xlsImpprod15641052',
      }],
      local: {
        market: ar ? 'المغرب' : 'Maroc',
        detail: ar ? 'نفس الحجم 100 مل معروض عند Paraval بسعر 260 درهم وقت الرصد.' : 'La variante 100 mL était affichée à 260 MAD chez Paraval lors du relevé.',
        url: 'https://paraval.ma/boutique-2/soins-du-visage/hydratation-et-nutrition/cosrx-advanced-snail-96-mucin-power-essence-100ml/',
      },
      supplier: {
        market: 'COSRX',
        detail: ar ? 'اللائحة الرسمية للبائعين المعتمدين. طلب عرض مهني وحق إعادة البيع فبلدك.' :
          'Liste officielle de vendeurs agréés. Demandez un devis professionnel et les conditions de revente dans votre pays.',
        url: 'https://b2c.cosrx.com/pages/stores',
      },
    },
    {
      name: 'Collagen Peptides, Unflavored',
      brand: 'Sports Research',
      variant: '454 g · 16 oz · UPC 023249010180',
      category: 'SUPPLEMENTS',
      identityUrl: 'https://www.sportsresearch.store/products/collagen-peptides-454g-16-oz',
      suggestedRetail: 499,
      estimatedWholesale: 160,
      demand: [{
        market: 'iHerb International',
        detail: ar ? 'أكثر من 37,000 تقييم على صفحة الحجم 454 غ. التقييمات مجمّعة دولياً.' :
          'Plus de 37 000 évaluations sur la fiche 454 g. Les évaluations sont agrégées à l’international.',
        url: 'https://www.iherb.com/r/sports-research-collagen-peptides-unflavored-16-oz-454-g/71106',
      }],
      local: {
        market: ar ? 'المغرب' : 'Maroc',
        detail: ar ? 'نسخة 454 غ معروضة فالمغرب عند Vitablanca بـ 1,200 درهم وقت الرصد.' :
          'La variante 454 g était affichée à 1 200 MAD chez Vitablanca lors du relevé.',
        url: 'https://vitablanca.ma/produit/sports-research-peptides-de-collagene-non-aromatise-454-g/',
      },
      supplier: {
        market: 'Sports Research',
        detail: ar ? 'الصفحة الرسمية للمقاس. تأكد من توفر عرض بالجملة والتصدير التجاري.' :
          'Fiche officielle du format. Confirmez le tarif de gros et la possibilité d’export commercial.',
        url: 'https://www.sportsresearch.store/products/collagen-peptides-454g-16-oz',
      },
    },
    {
      name: 'Portable Electric USB Food Processor & Garlic Chopper',
      brand: 'SmartKitchen',
      variant: '250 mL · 3 Blades · Rechargeable USB-C',
      category: 'KITCHEN',
      identityUrl: 'https://www.amazon.com/dp/B08KG65XWP',
      suggestedRetail: 199,
      estimatedWholesale: 38,
      demand: [{
        market: 'TikTok & Amazon Global',
        detail: ar ? 'أكثر من 15,000 طلب شهرياً على تيك توك شوب ومبيعات قوية في الخليج.' : 'Plus de 15 000 commandes mensuelles sur TikTok Shop et fort volume dans le Golfe.',
        url: 'https://www.amazon.com/dp/B08KG65XWP',
      }],
      local: {
        market: ar ? 'المغرب' : 'Maroc',
        detail: ar ? 'يباع في المتاجر المحلية ومحلات درب عمر بسعر بين 179 و 229 درهم.' : 'Vendu sur les boutiques locales entre 179 et 229 MAD.',
        url: 'https://www.jumia.ma/catalog/?q=mini+hachoir+electrique',
      },
      supplier: {
        market: '1688 / Yiwu Wholesale',
        detail: ar ? 'متوفر بسعر الجملة في أسواق كوانزو وإيوو ودرب عمر كازا بـ 32-38 درهم.' : 'Disponible chez les grossistes de Derb Omar et Yiwu entre 32 et 38 MAD.',
        url: 'https://www.aliexpress.com/w/wholesale-electric-mini-garlic-chopper.html',
      },
    },
    {
      name: 'High-Power Cordless Handheld Car Vacuum Cleaner (120W / 9000Pa)',
      brand: 'AutoPro Elite',
      variant: 'Wireless · Dual Filter HEPA · Car & Home',
      category: 'CAR',
      identityUrl: 'https://www.amazon.com/dp/B09YRHBL9F',
      suggestedRetail: 269,
      estimatedWholesale: 58,
      demand: [{
        market: ar ? 'الخليج وأمريكا' : 'Golfe & USA',
        detail: ar ? 'أكثر من 25,000 إعلان نشط على Meta Ad Library، منتج إيفرجرين مستمر.' : 'Plus de 25 000 ventes et fort historique de publicités actives sur Meta Ad Library.',
        url: 'https://www.amazon.com/dp/B09YRHBL9F',
      }],
      local: {
        market: ar ? 'المغرب والخليج' : 'Maroc & GCC',
        detail: ar ? 'يباع في المغرب بـ 249-299 درهم، وفي السعودية بـ 129-149 ريال.' : 'Commercialisé au Maroc à 249-299 MAD et en Arabie Saoudite à 129-149 SAR.',
        url: 'https://www.jumia.ma/catalog/?q=aspirateur+voiture+sans+fil',
      },
      supplier: {
        market: 'Guangdong Tech Wholesale',
        detail: ar ? 'سعر الجملة 45-55 درهم مع ملحقات الفوهات والشاحن السريع.' : 'Tarif de gros à 45-55 MAD avec buses et kit chargeur rapide.',
        url: 'https://www.aliexpress.com/w/wholesale-car-vacuum-cleaner-wireless.html',
      },
    },
    {
      name: 'Orthopedic Ergonomic Memory Foam Seat Cushion (Sciatica & Back Relief)',
      brand: 'ErgoComfort Plus',
      variant: 'U-Cut Design · Non-Slip Bottom · Breathable Mesh',
      category: 'WELLNESS',
      identityUrl: 'https://www.amazon.com/dp/B01EBDV9BU',
      suggestedRetail: 249,
      estimatedWholesale: 52,
      demand: [{
        market: 'Amazon & Facebook Ads',
        detail: ar ? 'أكثر من 85,000 تقييم 5 نجوم لمشاكل آلام عرق النسا والجلوس الطويل.' : 'Plus de 85 000 avis 5 étoiles pour le soulagement du dos et de la sciatique.',
        url: 'https://www.amazon.com/dp/B01EBDV9BU',
      }],
      local: {
        market: ar ? 'المغرب' : 'Maroc',
        detail: ar ? 'معروض في صفحات COD المغرب بـ 229-269 درهم مع باقة 2 حبات بـ 399 درهم.' : 'Vendu sur les landing pages COD à 229-269 MAD avec pack duo à 399 MAD.',
        url: 'https://www.jumia.ma/catalog/?q=coussin+orthopedique',
      },
      supplier: {
        market: 'Shenzhen Ergonomics Direct',
        detail: ar ? 'سعر الاستيراد 48-55 درهم للقطعة مع تغليف مفرغ من الهواء لتوفير الشحن.' : 'Prix usine 48-55 MAD avec conditionnement sous vide compact.',
        url: 'https://www.aliexpress.com/w/wholesale-memory-foam-seat-cushion.html',
      },
    },
    {
      name: '360° Triangular Self-Wringing Cleaning Mop (Extendable 1.3m)',
      brand: 'CleanMaster Pro',
      variant: 'Microfiber Pads · 360 Rotation · Wall & Floor',
      category: 'HOME',
      identityUrl: 'https://www.amazon.com/dp/B0BNPYS6GB',
      suggestedRetail: 179,
      estimatedWholesale: 32,
      demand: [{
        market: 'TikTok Creative Center',
        detail: ar ? 'فيديوهات تنظيف تجاوزت 40 مليون مشاهدة على تيك توك، معدل تحويل عالي جداً.' : 'Vidéos virales de nettoyage dépassant 40M de vues sur TikTok avec fort taux de conversion.',
        url: 'https://www.amazon.com/dp/B0BNPYS6GB',
      }],
      local: {
        market: ar ? 'المغرب' : 'Maroc',
        detail: ar ? 'تباع في المغرب بـ 159-199 درهم مع فوطتين إضافيتين مجاناً.' : 'Proposée au Maroc à 159-199 MAD avec 2 lingettes microfibres offertes.',
        url: 'https://www.jumia.ma/catalog/?q=balai+triangle+360',
      },
      supplier: {
        market: 'Zhejiang Home Goods',
        detail: ar ? 'متوفرة في كراج علال ودرب عمر بـ 28-34 درهم بالجملة للكرتونة.' : 'Disponible chez les grossistes de Casablanca à 28-34 MAD par carton.',
        url: 'https://www.aliexpress.com/w/wholesale-triangle-cleaning-mop-360.html',
      },
    },
  ];
}

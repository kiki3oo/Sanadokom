export type RadarCategory = 'COSMETICS' | 'SUPPLEMENTS';
export type RadarFilter = RadarCategory | 'BOTH';

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
  demand: RadarEvidence[];
  local: RadarEvidence | null;
  supplier: RadarEvidence | null;
}

export const referenceDate = '2026-11-11';

export function radarReferences(ar: boolean): RadarProduct[] {
  return [
    {
      name: 'Advanced Snail 96 Mucin Power Essence',
      brand: 'COSRX',
      variant: '100 mL · 3.38 fl oz',
      category: 'COSMETICS',
      identityUrl: 'https://www.ulta.com/p/advanced-snail-96-mucin-power-essence-xlsImpprod15641052',
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
  ];
}

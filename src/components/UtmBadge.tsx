import React from 'react';
import { Target, Layers } from 'lucide-react';

interface UtmBadgeProps {
  source?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  adSet?: string | null;
  compact?: boolean;
}

export default function UtmBadge({
  source,
  utmSource,
  utmCampaign,
  adSet,
  compact = false,
}: UtmBadgeProps) {
  const s = (utmSource || source || '').toLowerCase();

  let brandName = source || utmSource || 'Landing Page';
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = '🌐';

  if (s.includes('insta') || s.includes('ig')) {
    brandName = 'Instagram';
    badgeStyle = 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    icon = '📸';
  } else if (s.includes('face') || s.includes('fb') || s.includes('meta')) {
    brandName = 'Facebook';
    badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = '🔵';
  } else if (s.includes('tik') || s.includes('tt')) {
    brandName = 'TikTok';
    badgeStyle = 'bg-neutral-900 text-white border-neutral-700';
    icon = '🎵';
  } else if (s.includes('snap')) {
    brandName = 'Snapchat';
    badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300';
    icon = '👻';
  } else if (s.includes('whats') || s.includes('wa')) {
    brandName = 'WhatsApp';
    badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = '💬';
  } else if (s.includes('goog') || s.includes('gads')) {
    brandName = 'Google Ads';
    badgeStyle = 'bg-red-50 text-red-700 border-red-200';
    icon = '🔍';
  } else if (s.includes('appel') || s.includes('call') || s.includes('phone')) {
    brandName = 'Appel Entrant';
    badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
    icon = '📞';
  } else if (s.includes('recommandation') || s.includes('bouche')) {
    brandName = 'Bouche-à-oreille';
    badgeStyle = 'bg-teal-50 text-teal-700 border-teal-200';
    icon = '🤝';
  } else if (s.includes('magasin') || s.includes('store') || s.includes('boutique')) {
    brandName = 'Boutique Physique';
    badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    icon = '🏪';
  }

  return (
    <div className={`inline-flex flex-wrap items-center gap-1 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
      {/* Source / Channel Badge */}
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-semibold border ${badgeStyle} shadow-2xs`}
        title={`Source: ${source || utmSource || 'Inconnue'}`}
      >
        <span>{icon}</span>
        <span>{brandName}</span>
      </span>

      {/* Campaign Badge */}
      {utmCampaign && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 max-w-[130px] truncate shadow-2xs"
          title={`Campagne: ${utmCampaign}`}
        >
          <Target className="w-2.5 h-2.5 shrink-0 text-indigo-500" />
          <span className="truncate">{utmCampaign}</span>
        </span>
      )}

      {/* AdSet Badge */}
      {adSet && (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-amber-50 text-amber-800 border border-amber-200 max-w-[120px] truncate shadow-2xs"
          title={`Adset: ${adSet}`}
        >
          <Layers className="w-2.5 h-2.5 shrink-0 text-amber-600" />
          <span className="truncate">{adSet}</span>
        </span>
      )}
    </div>
  );
}

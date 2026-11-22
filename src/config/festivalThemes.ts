import type { FestivalSurfaceTone, FestivalThemeConfig } from '../types';

export const DEFAULT_FESTIVAL_THEME: FestivalThemeConfig = {
  id: 'default',
  name: 'Classic Fresh Mandi',
  active: false,
  bannerTitle: '',
  bannerSubtitle: '',
  badgeText: '',
  accentHex: '#059669',
  surfaceTone: 'emerald',
  logoPreset: 'default',
};

export const FESTIVAL_THEME_PRESETS: FestivalThemeConfig[] = [
  {
    id: 'diwali',
    name: 'Diwali Deepavali Special',
    active: true,
    bannerTitle: 'Shubh Deepavali · Fresh Festive Harvest',
    bannerSubtitle: 'Diwali sweets fruits, dry-fruit accompaniments & morning 4 AM APMC fresh vegetables.',
    badgeText: 'Diwali Special',
    accentHex: '#d97706',
    surfaceTone: 'saffron',
    logoPreset: 'diwali',
  },
  {
    id: 'holi',
    name: 'Holi Rangotsav Theme',
    active: true,
    bannerTitle: 'Happy Holi · Colors & Farm Freshness',
    bannerSubtitle: 'Celebration thandai lemons, seasonal fruits & organic greens straight from Vashi Mandi.',
    badgeText: 'Holi Special',
    accentHex: '#db2777',
    surfaceTone: 'magenta',
    logoPreset: 'holi',
  },
  {
    id: 'ganesh',
    name: 'Ganesh Chaturthi Bappa Special',
    active: true,
    bannerTitle: 'Ganpati Bappa Morya · Modak & Puja Fresh',
    bannerSubtitle: 'Fresh coconuts, bananas, durva herbs & daily society sabzi basket before 11 PM.',
    badgeText: 'Ganesh Utsav',
    accentHex: '#ea580c',
    surfaceTone: 'saffron',
    logoPreset: 'ganesh',
  },
  {
    id: 'navratri',
    name: 'Shubh Navratri Vrat Special',
    active: true,
    bannerTitle: 'Shubh Navratri · Fasting Fruits & Greens',
    bannerSubtitle: 'Vrat-friendly sweet potatoes, pomegranates, apples, bananas & pure mandi lots.',
    badgeText: 'Navratri Special',
    accentHex: '#be185d',
    surfaceTone: 'magenta',
    logoPreset: 'navratri',
  },
  {
    id: 'patriotic',
    name: 'Independence & Republic Day',
    active: true,
    bannerTitle: 'Tiranga Pride · Jai Hind Society Harvest',
    bannerSubtitle: 'Tricolor produce baskets — saffron carrots, white radish & fresh green leafy lots.',
    badgeText: 'National Pride',
    accentHex: '#ea580c',
    surfaceTone: 'tricolor',
    logoPreset: 'patriotic',
  },
  {
    id: 'eid',
    name: 'Eid Mubarak Feast Special',
    active: true,
    bannerTitle: 'Eid Mubarak · Royal Dastarkhwan Fresh',
    bannerSubtitle: 'Dawn APMC mint, coriander, onions, pomegranates & feast vegetables at wholesale prices.',
    badgeText: 'Eid Special',
    accentHex: '#047857',
    surfaceTone: 'emerald',
    logoPreset: 'eid',
  },
  {
    id: 'sankranti',
    name: 'Makar Sankranti & Harvest',
    active: true,
    bannerTitle: 'Happy Makar Sankranti · Winter Crop Joy',
    bannerSubtitle: 'Winter green peas, red carrots, leafy greens & fresh fruits direct from APMC farms.',
    badgeText: 'Sankranti Special',
    accentHex: '#b45309',
    surfaceTone: 'gold',
    logoPreset: 'sankranti',
  },
  {
    id: 'harvest',
    name: 'Mango & Summer Harvest',
    active: true,
    bannerTitle: 'Ratnagiri Hapus & Summer Hydration',
    bannerSubtitle: 'Direct-from-orchard Alphonso mangoes, watermelons, cucumbers & cool summer greens.',
    badgeText: 'Harvest Season',
    accentHex: '#ca8a04',
    surfaceTone: 'gold',
    logoPreset: 'harvest',
  },
];

export function sanitizeSvgMarkup(rawSvg?: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  const trimmed = rawSvg.trim();
  const match = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) return '';
  let svg = match[0];
  // Strip any active content, scripts, external links, or inline event handlers
  svg = svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<(iframe|object|embed|link|meta|style)[^>]*>([\s\S]*?<\/\1>)?/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"])[\s\S]*?\1/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(?:xlink:)?href\s*=\s*(['"])\s*(?:javascript:|https?:|data:(?!image\/svg))[\s\S]*?\1/gi, '')
    .replace(/javascript:/gi, '');

  if (svg.length > 6000) {
    return '';
  }
  return svg;
}

export function getFestivalSurfaceClasses(theme?: FestivalThemeConfig): {
  bannerBg: string;
  orbRing: string;
  badgeBg: string;
  accentStrip: string;
} {
  if (!theme || !theme.active) {
    return {
      bannerBg: '',
      orbRing: 'from-emerald-950 via-teal-900 to-slate-900',
      badgeBg: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40',
      accentStrip: 'bg-emerald-700',
    };
  }

  const toneMap: Record<
    FestivalSurfaceTone,
    { bannerBg: string; orbRing: string; badgeBg: string; accentStrip: string }
  > = {
    saffron: {
      bannerBg:
        'bg-linear-to-r from-amber-900 via-orange-800 to-rose-900 border border-amber-400/40',
      orbRing: 'from-amber-600 via-orange-700 to-rose-900',
      badgeBg: 'bg-amber-300 text-slate-950 border-amber-200',
      accentStrip: 'bg-amber-700',
    },
    magenta: {
      bannerBg:
        'bg-linear-to-r from-fuchsia-900 via-pink-800 to-amber-800 border border-pink-400/40',
      orbRing: 'from-fuchsia-600 via-pink-700 to-amber-700',
      badgeBg: 'bg-pink-200 text-slate-950 border-pink-100',
      accentStrip: 'bg-fuchsia-700',
    },
    royal: {
      bannerBg:
        'bg-linear-to-r from-indigo-950 via-violet-900 to-emerald-900 border border-indigo-400/40',
      orbRing: 'from-indigo-700 via-violet-800 to-emerald-800',
      badgeBg: 'bg-indigo-200 text-slate-950 border-indigo-100',
      accentStrip: 'bg-indigo-800',
    },
    gold: {
      bannerBg:
        'bg-linear-to-r from-amber-800 via-yellow-700 to-emerald-900 border border-yellow-300/40',
      orbRing: 'from-yellow-600 via-amber-700 to-emerald-900',
      badgeBg: 'bg-yellow-300 text-slate-950 border-yellow-200',
      accentStrip: 'bg-amber-600',
    },
    tricolor: {
      bannerBg:
        'bg-linear-to-r from-orange-700 via-slate-800 to-emerald-800 border border-orange-300/40',
      orbRing: 'from-orange-500 via-slate-800 to-emerald-700',
      badgeBg: 'bg-white text-slate-950 border-orange-300',
      accentStrip: 'bg-linear-to-r from-orange-600 via-slate-700 to-emerald-700',
    },
    emerald: {
      bannerBg:
        'bg-linear-to-r from-emerald-950 via-teal-800 to-amber-900 border border-emerald-400/40',
      orbRing: 'from-emerald-700 via-teal-800 to-amber-700',
      badgeBg: 'bg-amber-300 text-slate-950 border-amber-200',
      accentStrip: 'bg-emerald-800',
    },
  };

  return toneMap[theme.surfaceTone] || toneMap.emerald;
}

export interface VerifiedRecipeVideo {
  id: string;
  videoId: string;
  url: string;
  embedUrl: string;
  thumbnailUrl: string;
  title: string;
  channel: string;
  dishKeywords: string[];
}

const makeVideo = (
  id: string,
  videoId: string,
  title: string,
  channel: string,
  dishKeywords: string[]
): VerifiedRecipeVideo => ({
  id,
  videoId,
  url: `https://www.youtube.com/watch?v=${videoId}`,
  embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
  thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  title,
  channel,
  dishKeywords,
});

export const VERIFIED_DISH_VIDEOS: Record<string, VerifiedRecipeVideo[]> = {
  aloo_gobhi: [
    makeVideo(
      'aloo_gobhi_ranveer',
      'Bvk2tr3joLA',
      'होटल जैसी आलू गोभी अदरकी | Adraki Aloo Gobhi Dhaba Style',
      'Chef Ranveer Brar',
      ['aloo gobhi', 'gobi', 'cauliflower', 'gobhi', 'potato', 'आलू गोभी', 'फूलगोभी', 'बटाटा फ्लॉवर']
    ),
    makeVideo(
      'aloo_gobhi_yfl',
      'fNdmxfdNkQc',
      'Gobi Aloo Matar Masala | हलवाई जैसी गोभी आलू मटर की सब्जी',
      'Your Food Lab',
      ['gobi aloo matar', 'aloo gobhi', 'matar', 'gobhi', 'गोभी मटर']
    ),
    makeVideo(
      'aloo_gobhi_kabita',
      'sSC8tC738DY',
      'Simple & Easy Aloo Gobhi Stir Fry (Lunch Box Style)',
      "Kabita's Kitchen",
      ['aloo gobi', 'dry aloo gobhi', 'gobhi sabzi']
    ),
  ],
  bhindi_masala: [
    makeVideo(
      'bhindi_kabita',
      'Lqa-NOSbydM',
      'Restaurant Style Bhindi Curry | होटल जैसी भिंडी की सब्ज़ी',
      "Kabita's Kitchen",
      ['bhindi', 'okra', 'lady finger', 'bhindi masala', 'भिंडी', 'भेंडी', 'मसाला भिंडी']
    ),
    makeVideo(
      'bhindi_yfl',
      '0_g_8FPr3Ag',
      'Dahi Waali Bhindi Masala | ढाबे जैसी दही वाली भिंडी',
      'Your Food Lab',
      ['dahi bhindi', 'bhindi', 'dhaba bhindi', 'दही भिंडी']
    ),
  ],
  pav_bhaji: [
    makeVideo(
      'pav_bhaji_yfl',
      'Gbuse4WX01I',
      'Mumbai Street Style Pav Bhaji | बाज़ार से भी स्वादिष्ट पाव भाजी',
      'Your Food Lab',
      ['pav bhaji', 'mix veg', 'mumbai pav bhaji', 'पाव भाजी', 'मिक्स वेज']
    ),
    makeVideo(
      'pav_bhaji_ranveer',
      'FnXzNmwtQeg',
      'Mumbai Style Pav Bhaji (Easy Cooker Method)',
      'Chef Ranveer Brar',
      ['pav bhaji', 'cooker pav bhaji', 'चौपाटी पाव भाजी']
    ),
  ],
  palak_dal: [
    makeVideo(
      'palak_dal_ranveer',
      '2-Vt4LOedH0',
      'Winter Special Palak Dal Tadka | पालक दाल तड़का',
      'Chef Ranveer Brar',
      ['dal palak', 'palak dal', 'spinach', 'palak', 'दाल पालक', 'पालक']
    ),
    makeVideo(
      'palak_paneer_ranveer',
      '5lVLxEr_qgM',
      'Restaurant Style Palak Paneer | पालक पनीर रेसिपी',
      'Chef Ranveer Brar',
      ['palak paneer', 'spinach paneer', 'पालक पनीर']
    ),
    makeVideo(
      'dal_palak_kunal',
      's7vUFPpAdWM',
      'Dhaba Style Dal Palak Pressure Cooker Recipe',
      'Kunal Kapur',
      ['dal palak', 'spinach dal', 'lasooni palak']
    ),
  ],
  baingan_bharta: [
    makeVideo(
      'baingan_ranveer',
      'yRZKfDI28Ro',
      'Dhaba Style Baingan Bharta | ढाबे जैसा स्मोकी बैंगन भरता',
      'Chef Ranveer Brar',
      ['baingan', 'bharta', 'brinjal', 'eggplant', 'बैंगन', 'वांगी', 'भरीत']
    ),
    makeVideo(
      'baingan_yfl',
      'exp-Fo1H57U',
      'Homestyle Baingan Ka Bharta | मेरे घर जैसा बैंगन का भर्ता',
      'Your Food Lab',
      ['baingan bharta', 'baingan', 'matar baingan']
    ),
  ],
  salad_raita: [
    makeVideo(
      'kachumber_ranveer',
      'IWD67_YP3XI',
      'Refreshing Indian Kachumber Salad Recipe',
      'Chef Ranveer Brar',
      ['salad', 'kachumber', 'cucumber', 'kheera', 'सलाद', 'खीरा', 'कोशिंबीर']
    ),
    makeVideo(
      'kheera_raita',
      'fdXxHRYW200',
      'Refreshing Kheera Cucumber Raita | खीरे का रायता',
      'Chatpati Rasoi',
      ['raita', 'kheera', 'cucumber', 'curd', 'रायता']
    ),
  ],
  fruit_chaat: [
    makeVideo(
      'fruit_chaat_ranveer',
      'GZz-fnFpjYA',
      'Special Masala Fruit Chaat | फ्रूट चाट रेसिपी',
      'Chef Ranveer Brar',
      ['fruit', 'chaat', 'fruit chaat', 'apple', 'banana', 'pomegranate', 'फ्रूट चाट']
    ),
    makeVideo(
      'fruit_chaat_getcurried',
      '2Zc-Tct0DmM',
      'Healthy Fresh Fruit Chaat & Salad Bowl',
      'Get Curried',
      ['fruit salad', 'fruit bowl', 'chaat']
    ),
  ],
};

export const EXTRA_PRODUCE_VIDEOS: VerifiedRecipeVideo[] = [
  makeVideo(
    'gajar_halwa_ranveer',
    'DLT7hC3oQFg',
    'Traditional Winter Gajar Ka Halwa | गाजर हलवा / गजरेला',
    'Chef Ranveer Brar',
    ['gajar', 'halwa', 'carrot', 'gajrela', 'गाजर', 'गाजर हलवा']
  ),
  makeVideo(
    'gajar_halwa_kabita',
    'jGH9o5NeVmc',
    'शादियों वाला गाजर का हलवा | Classic Gajar Ka Halwa',
    "Kabita's Kitchen",
    ['gajar halwa', 'carrot halwa', 'carrot']
  ),
  makeVideo(
    'methi_thepla_ranveer',
    'I1p9y7XbB1c',
    'Gujarati Methi Thepla & Paratha | मेथी के थेपले',
    'Chef Ranveer Brar',
    ['methi', 'thepla', 'paratha', 'fenugreek', 'मेथी', 'थेपला']
  ),
  makeVideo(
    'matar_paneer_ranveer',
    'SbOA2GcJOf0',
    'Dhaba Style Matar Paneer | ढाबा जैसा मटर पनीर',
    'Chef Ranveer Brar',
    ['matar', 'peas', 'matar paneer', 'green peas', 'मटर', 'मटर पनीर']
  ),
  makeVideo(
    'lauki_sabzi_kabita',
    'lVUM_7p3_oc',
    'Lauki Ki Masaledar Sabzi | लौकी की मसालेदार सब्ज़ी',
    "Kabita's Kitchen",
    ['lauki', 'bottle gourd', 'dudhi', 'लौकी', 'दूधी']
  ),
  makeVideo(
    'lauki_chana_dal_kabita',
    'hq0ed55i1_Y',
    'Lauki Chana Dal Sabzi | लौकी चना दाल',
    "Kabita's Kitchen",
    ['lauki chana dal', 'lauki', 'dudhi']
  ),
  makeVideo(
    'kathal_ranveer',
    'sizED3JUqkc',
    'Kathal Masala Sabji & Cutting Tips | मसालेदार कटहल',
    'Chef Ranveer Brar',
    ['kathal', 'jackfruit', 'कटहल', 'फणस']
  ),
  makeVideo(
    'aloo_tamatar_ranveer',
    'OveP45eSKYU',
    'Cooker Aloo Tamatar Sabzi | आलू टमाटर की झटपट सब्ज़ी',
    'Chef Ranveer Brar',
    ['aloo tamatar', 'potato', 'tomato', 'tamatar', 'आलू', 'टमाटर', 'बटाटा']
  ),
  makeVideo(
    'jeera_aloo_video',
    'kEaKddxE9Hw',
    'Dry Jeera Aloo Sabzi | सूखी जीरा आलू की सब्ज़ी',
    "Shruti's Cooking",
    ['jeera aloo', 'potato', 'aloo', 'जीरा आलू']
  ),
];

export const ALL_VERIFIED_RECIPE_VIDEOS: VerifiedRecipeVideo[] = [
  ...Object.values(VERIFIED_DISH_VIDEOS).flat(),
  ...EXTRA_PRODUCE_VIDEOS,
];

/**
 * Finds the best verified curated YouTube chef videos matching a recipe title or search query.
 */
export function findVerifiedRecipeVideos(query: string, limit = 3): VerifiedRecipeVideo[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const tokens = q.split(/[\s,/&+-]+/).filter((t) => t.length >= 2);
  const scored = ALL_VERIFIED_RECIPE_VIDEOS.map((vid) => {
    let score = 0;
    const haystack = `${vid.title} ${vid.dishKeywords.join(' ')}`.toLowerCase();
    if (haystack.includes(q)) score += 10;
    for (const kw of vid.dishKeywords) {
      if (q.includes(kw.toLowerCase())) score += 6;
    }
    for (const tok of tokens) {
      if (haystack.includes(tok)) score += 2;
    }
    return { vid, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const unique: VerifiedRecipeVideo[] = [];
  const seen = new Set<string>();
  for (const entry of scored) {
    if (!seen.has(entry.vid.videoId)) {
      seen.add(entry.vid.videoId);
      unique.push(entry.vid);
    }
    if (unique.length >= limit) break;
  }
  return unique;
}

export interface ProductVideoResolution {
  primaryVideo: VerifiedRecipeVideo;
  isExactMatch: boolean;
  youtubeSearchUrl: string;
}

/**
 * Always resolves a verified playable chef video + item-specific YouTube recipe search link.
 */
export function resolveProductVideo(
  itemId: string,
  category: string,
  nameEn: string,
  nameHi?: string
): ProductVideoResolution {
  const cleanEn = nameEn.replace(/\(.*?\)/g, '').trim();
  const cleanHi = (nameHi || '').replace(/\(.*?\)/g, '').trim();
  const matches = findVerifiedRecipeVideos(`${cleanEn} ${cleanHi} ${itemId.replace(/_/g, ' ')}`, 1);

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${cleanEn} ${cleanHi} Indian sabzi recipe benefits`
  )}`;

  if (matches.length > 0) {
    return {
      primaryVideo: matches[0],
      isExactMatch: true,
      youtubeSearchUrl,
    };
  }

  // Verified category-level culinary video fallback (real playable YouTube IDs only)
  const fallbackPool =
    category === 'fruits' || category === 'citrus' || category === 'other'
      ? VERIFIED_DISH_VIDEOS.fruit_chaat[0]
      : category === 'leafy' || category === 'herbs'
      ? VERIFIED_DISH_VIDEOS.palak_dal[0]
      : category === 'roots'
      ? EXTRA_PRODUCE_VIDEOS[7] // Aloo Tamatar by Ranveer Brar
      : category === 'sprouts'
      ? VERIFIED_DISH_VIDEOS.salad_raita[0]
      : VERIFIED_DISH_VIDEOS.pav_bhaji[0];

  return {
    primaryVideo: fallbackPool,
    isExactMatch: false,
    youtubeSearchUrl,
  };
}


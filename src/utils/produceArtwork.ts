/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Bulletproof Zero-Latency Local SVG Produce Artwork Generator
 * Guarantees 100% visible, vibrant produce images on all mobile networks (Jio, Airtel, Vi)
 * without depending on external CDN/Unsplash URLs that often get blocked.
 */

export interface ProduceVisualSpec {
  emoji: string;
  bgGradient: string;
  badgeColor: string;
  accentColor: string;
  tagline: string;
  svgIcon: string;
}

export function getProduceVisualSpec(id: string, category: string, name: string): ProduceVisualSpec {
  const cleanId = (id || '').toLowerCase();
  const cleanName = (name || '').toLowerCase();

  // 1. Okra / Bhindi
  if (cleanId.includes('okra') || cleanName.includes('भिंडी') || cleanName.includes('bhendi')) {
    return {
      emoji: '🌿',
      bgGradient: 'from-emerald-600 via-green-600 to-emerald-800',
      badgeColor: 'bg-emerald-900/90 text-emerald-200 border-emerald-500/50',
      accentColor: '#10b981',
      tagline: '100% कोमल देसी भिंडी · APMC लॉट',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M48 10 C52 10 54 18 52 24 L62 75 C64 85 55 92 48 95 C41 92 32 85 34 75 L44 24 C42 18 44 10 48 10 Z" fill="#22c55e" stroke="#15803d" stroke-width="2.5"/><path d="M48 24 L48 88" stroke="#16a34a" stroke-width="2" stroke-linecap="round"/><path d="M40 12 C44 8 52 8 56 12 L54 22 L42 22 Z" fill="#14532d"/></svg>`,
    };
  }

  // 2. Brinjal / Baingan
  if (cleanId.includes('brinjal') || cleanName.includes('बैंगन') || cleanName.includes('vangi') || cleanName.includes('eggplant')) {
    return {
      emoji: '🍆',
      bgGradient: 'from-purple-800 via-indigo-900 to-slate-900',
      badgeColor: 'bg-purple-950/90 text-purple-200 border-purple-500/50',
      accentColor: '#8b5cf6',
      tagline: 'मंचर ताज़ा वांगी · कम बीज वाला',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><ellipse cx="50" cy="58" rx="26" ry="32" fill="#581c87" stroke="#3b0764" stroke-width="2"/><ellipse cx="44" cy="52" rx="20" ry="24" fill="#6b21a8"/><path d="M48 18 C49 12 51 8 55 6 C53 10 51 14 50 20 Z" fill="#15803d"/><path d="M36 24 C44 28 56 28 64 24 C60 30 54 32 48 32 C42 32 38 28 36 24 Z" fill="#16a34a"/></svg>`,
    };
  }

  // 3. Cauliflower / Phool Gobhi
  if (cleanId.includes('cauliflower') || cleanName.includes('फूलगोभी') || cleanName.includes('flower')) {
    return {
      emoji: '🥦',
      bgGradient: 'from-emerald-700 via-teal-800 to-slate-900',
      badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50',
      accentColor: '#f8fafc',
      tagline: 'सफ़ेद बर्फ जैसी फूलगोभी · Grade A',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/><circle cx="42" cy="42" r="14" fill="#f1f5f9"/><circle cx="58" cy="42" r="14" fill="#f1f5f9"/><circle cx="50" cy="58" r="16" fill="#f1f5f9"/><path d="M26 62 C22 45 32 30 40 32 C34 44 32 58 36 68 Z" fill="#16a34a"/><path d="M74 62 C78 45 68 30 60 32 C66 44 68 58 64 68 Z" fill="#16a34a"/></svg>`,
    };
  }

  // 4. Bottle Gourd / Lauki / Dudhi
  if (cleanId.includes('bottle_gourd') || cleanName.includes('लौकी') || cleanName.includes('दुधी') || cleanName.includes('lauki')) {
    return {
      emoji: '🥒',
      bgGradient: 'from-emerald-500 via-green-600 to-teal-800',
      badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-400/50',
      accentColor: '#4ade80',
      tagline: 'रसदार ताज़ी हरी लौकी · 100% कड़वाहट मुक्त',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M46 12 C48 10 52 10 54 12 L54 36 C64 42 70 54 70 66 C70 82 58 92 48 92 C38 92 26 82 26 66 C26 54 32 42 42 36 Z" fill="#86efac" stroke="#16a34a" stroke-width="2"/><path d="M48 6 L52 12" stroke="#15803d" stroke-width="3" stroke-linecap="round"/></svg>`,
    };
  }

  // 5. Bitter Gourd / Karela
  if (cleanId.includes('bitter_gourd') || cleanName.includes('करेला') || cleanName.includes('karle')) {
    return {
      emoji: '🌿',
      bgGradient: 'from-emerald-800 via-teal-900 to-green-950',
      badgeColor: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50',
      accentColor: '#10b981',
      tagline: 'कंटीला हरा करेला · शुगर व सेहत के लिए उत्तम',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M48 14 C52 14 62 30 64 52 C66 74 54 88 48 92 C42 88 30 74 32 52 C34 30 44 14 48 14 Z" fill="#15803d" stroke="#14532d" stroke-width="2"/><circle cx="48" cy="35" r="3" fill="#166534"/><circle cx="42" cy="48" r="3.5" fill="#166534"/><circle cx="54" cy="52" r="3.5" fill="#166534"/><circle cx="48" cy="65" r="3" fill="#166534"/></svg>`,
    };
  }

  // 6. Peas / Matar
  if (cleanId.includes('peas') || cleanName.includes('मटर') || cleanName.includes('matar')) {
    return {
      emoji: '🌱',
      bgGradient: 'from-emerald-600 via-green-600 to-teal-800',
      badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-400/50',
      accentColor: '#86efac',
      tagline: 'ताज़ी मीठी हरी मटर · दानों से भरी फली',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M22 68 C35 30 65 24 82 28 C72 58 45 74 22 68 Z" fill="#22c55e" stroke="#15803d" stroke-width="2"/><circle cx="36" cy="54" r="5" fill="#86efac"/><circle cx="48" cy="48" r="5.5" fill="#86efac"/><circle cx="60" cy="42" r="5" fill="#86efac"/><circle cx="72" cy="36" r="4.5" fill="#86efac"/></svg>`,
    };
  }

  // 7. Sweet Corn
  if (cleanId.includes('corn') || cleanName.includes('मकई') || cleanName.includes('corn')) {
    return {
      emoji: '🌽',
      bgGradient: 'from-amber-600 via-yellow-600 to-emerald-800',
      badgeColor: 'bg-amber-950/90 text-amber-200 border-amber-400/50',
      accentColor: '#facc15',
      tagline: 'ताज़ा स्वीट कॉर्न · सुनहरे रसीले दाने',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><ellipse cx="50" cy="52" rx="18" ry="34" fill="#eab308" stroke="#ca8a04" stroke-width="2"/><path d="M34 50 C30 75 42 88 50 90 C36 82 30 64 34 50 Z" fill="#15803d"/><path d="M66 50 C70 75 58 88 50 90 C64 82 70 64 66 50 Z" fill="#15803d"/></svg>`,
    };
  }

  // 8. Citrus / Mosambi / Lemon
  if (cleanId.includes('mosambi') || cleanId.includes('lemon') || cleanName.includes('मोसंबी') || cleanName.includes('नींबू') || cleanName.includes('limbu')) {
    return {
      emoji: '🍋',
      bgGradient: 'from-yellow-500 via-amber-500 to-emerald-700',
      badgeColor: 'bg-yellow-950/90 text-yellow-200 border-yellow-400/50',
      accentColor: '#fde047',
      tagline: 'जालना की मीठी मोसंबी · रस से भरपूर',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="54" r="28" fill="#eab308" stroke="#ca8a04" stroke-width="2"/><circle cx="50" cy="54" r="24" fill="#facc15"/><path d="M50 20 C54 14 62 14 68 18 C64 24 58 26 50 24 Z" fill="#15803d"/></svg>`,
    };
  }

  // 9. Leafy Greens / Methi / Palak
  if (category === 'leafy' || cleanId.includes('leafy') || cleanName.includes('मेथी') || cleanName.includes('पालक') || cleanName.includes('saag')) {
    return {
      emoji: '🥬',
      bgGradient: 'from-emerald-700 via-green-800 to-teal-950',
      badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-400/50',
      accentColor: '#4ade80',
      tagline: 'ताज़ी खेत की तोड़ी हरी भाजी · सुबह 4 AM लॉट',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M50 88 C48 70 34 55 30 35 C28 20 40 12 50 18 C60 12 72 20 70 35 C66 55 52 70 50 88 Z" fill="#16a34a" stroke="#14532d" stroke-width="2"/><path d="M50 20 L50 85" stroke="#86efac" stroke-width="2"/></svg>`,
    };
  }

  // 10. Fruits / Mango / Banana / Papaya
  if (category === 'fruits' || cleanId.includes('mango') || cleanId.includes('banana') || cleanName.includes('आम') || cleanName.includes('केला')) {
    return {
      emoji: '🥭',
      bgGradient: 'from-amber-500 via-orange-500 to-pink-600',
      badgeColor: 'bg-amber-950/90 text-amber-200 border-amber-400/50',
      accentColor: '#fbbf24',
      tagline: '100% प्राकृतिक पका फल · बिना कार्बाइड',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M48 24 C62 20 76 34 74 54 C72 74 56 86 44 86 C32 86 26 72 30 54 C34 38 40 26 48 24 Z" fill="#f59e0b" stroke="#d97706" stroke-width="2"/><path d="M46 16 C48 10 52 8 56 6 C54 12 52 16 48 20 Z" fill="#15803d"/></svg>`,
    };
  }

  // 10b. Jackfruit / Kathal
  if (cleanId.includes('jackfruit') || cleanName.includes('कटहल') || cleanName.includes('फणस') || cleanName.includes('kathal')) {
    return {
      emoji: '🍈',
      bgGradient: 'from-lime-700 via-emerald-700 to-green-900',
      badgeColor: 'bg-emerald-950/90 text-lime-200 border-lime-400/50',
      accentColor: '#84cc16',
      tagline: 'कोमल ताज़ा कच्चा कटहल · रेशेदार व स्वाद से भरपूर',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><ellipse cx="50" cy="54" rx="28" ry="34" fill="#65a30d" stroke="#365314" stroke-width="2.5"/><path d="M48 12 L52 20" stroke="#365314" stroke-width="4" stroke-linecap="round"/><circle cx="40" cy="44" r="3" fill="#bef264"/><circle cx="54" cy="40" r="3" fill="#bef264"/><circle cx="48" cy="58" r="3.5" fill="#bef264"/><circle cx="60" cy="60" r="3" fill="#bef264"/><circle cx="38" cy="66" r="3" fill="#bef264"/></svg>`,
    };
  }

  // 10c. Raw / Ripe Papaya
  if (cleanId.includes('papaya') || cleanName.includes('पपीता') || cleanName.includes('पपई')) {
    return {
      emoji: '🥭',
      bgGradient: 'from-emerald-600 via-lime-600 to-amber-700',
      badgeColor: 'bg-emerald-950/90 text-lime-200 border-lime-400/50',
      accentColor: '#a3e635',
      tagline: 'ताज़ा फार्म पपीता · सलाद, भाजी व पराठे के लिए उत्तम',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M50 16 C64 16 74 36 72 60 C70 82 58 90 50 90 C42 90 30 82 28 60 C26 36 36 16 50 16 Z" fill="#4d7c0f" stroke="#365314" stroke-width="2.5"/><path d="M50 10 L50 18" stroke="#14532d" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="56" rx="12" ry="18" fill="#fef08a" opacity="0.35"/></svg>`,
    };
  }

  // 10d. Cucumber / Kheera / Kakdi
  if (cleanId.includes('cucumber') || cleanName.includes('खीरा') || cleanName.includes('काकडी') || cleanName.includes('kakdi')) {
    return {
      emoji: '🥒',
      bgGradient: 'from-emerald-600 via-green-600 to-lime-800',
      badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-400/50',
      accentColor: '#4ade80',
      tagline: 'रसदार कुरकुरा देसी खीरा · ताज़गी व शीतलता से भरपूर',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><rect x="38" y="12" width="24" height="76" rx="12" transform="rotate(-18 50 50)" fill="#16a34a" stroke="#14532d" stroke-width="2.5"/><circle cx="46" cy="36" r="2.2" fill="#bbf7d0"/><circle cx="52" cy="54" r="2.2" fill="#bbf7d0"/><circle cx="56" cy="68" r="2.2" fill="#bbf7d0"/></svg>`,
    };
  }

  // 10e. Pumpkin / Bhopla / Kaddu
  if (cleanId.includes('pumpkin') || cleanName.includes('कद्दू') || cleanName.includes('भोपळा') || cleanName.includes('भोपला')) {
    return {
      emoji: '🎃',
      bgGradient: 'from-amber-600 via-orange-600 to-amber-900',
      badgeColor: 'bg-amber-950/90 text-amber-200 border-amber-400/50',
      accentColor: '#fb923c',
      tagline: 'मीठा सुनहरा देसी कद्दू / भोपळा · घने गूदे वाला',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><ellipse cx="50" cy="56" rx="34" ry="26" fill="#ea580c" stroke="#9a3412" stroke-width="2.5"/><ellipse cx="50" cy="56" rx="20" ry="26" fill="#f97316" stroke="#9a3412" stroke-width="1.8"/><path d="M48 22 C49 16 54 14 57 14" stroke="#15803d" stroke-width="4" stroke-linecap="round"/></svg>`,
    };
  }

  // 10f. Mushroom
  if (cleanId.includes('mushroom') || cleanName.includes('मशरूम') || cleanName.includes('अळंबी')) {
    return {
      emoji: '🍄',
      bgGradient: 'from-stone-600 via-amber-800 to-stone-900',
      badgeColor: 'bg-stone-950/90 text-amber-200 border-amber-400/50',
      accentColor: '#fde68a',
      tagline: 'ताज़ा मखमली मशरूम · सुबह का प्रोटीन-रिच लॉट',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><path d="M22 52 C22 28 36 18 50 18 C64 18 78 28 78 52 Z" fill="#fef3c7" stroke="#d97706" stroke-width="2.5"/><rect x="40" y="52" width="20" height="28" rx="6" fill="#fde68a" stroke="#b45309" stroke-width="2"/></svg>`,
    };
  }

  // 11. Root vegetables / Ginger / Garlic / Arbi
  if (category === 'roots' || cleanId.includes('ginger') || cleanId.includes('garlic') || cleanName.includes('अदरक') || cleanName.includes('लहसुन')) {
    return {
      emoji: '🍠',
      bgGradient: 'from-amber-700 via-yellow-800 to-stone-900',
      badgeColor: 'bg-amber-950/90 text-amber-200 border-amber-500/50',
      accentColor: '#d97706',
      tagline: 'ताज़ी जड़ वाली सब्ज़ी · मिट्टी से साफ़ की हुई',
      svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><ellipse cx="50" cy="54" rx="28" ry="20" fill="#b45309" stroke="#78350f" stroke-width="2"/><path d="M30 52 C40 58 60 58 70 52" stroke="#78350f" stroke-width="2" stroke-linecap="round"/></svg>`,
    };
  }

  // Default Fallback
  return {
    emoji: '🥦',
    bgGradient: 'from-emerald-700 via-teal-800 to-slate-900',
    badgeColor: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50',
    accentColor: '#34d399',
    tagline: '100% फार्म फ्रेश थोक वाशी APMC लॉट',
    svgIcon: `<svg viewBox="0 0 100 100" class="w-full h-full"><circle cx="50" cy="50" r="30" fill="#10b981" stroke="#059669" stroke-width="2"/><circle cx="50" cy="50" r="18" fill="#34d399"/></svg>`,
  };
}

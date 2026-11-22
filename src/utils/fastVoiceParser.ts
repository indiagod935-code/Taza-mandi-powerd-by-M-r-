import { ProduceItem, MobileAccessoryItem, AppPageId, AppLanguage } from '../types';

export interface ParsedVoiceItem {
  itemId: string;
  itemType: 'produce' | 'accessory';
  qty: number;
}

export type VoiceModalTarget =
  | 'auth'
  | 'profile'
  | 'addresses'
  | 'referrals'
  | 'about'
  | 'brand'
  | 'install'
  | 'tour'
  | 'savings'
  | 'voice_chat';

export interface VoiceNavTarget {
  tab?: AppPageId;
  category?: string;
  search?: string;
  openCart?: boolean;
  closeCart?: boolean;
  openModal?: VoiceModalTarget;
  labelHi: string;
  labelEn: string;
}

export interface VoiceTuningUpdate {
  openPanel?: boolean;
  micSensitivity?: 'low_noise' | 'balanced' | 'high';
  pausePreset?: 'fast' | 'normal' | 'relaxed';
  ttsVoice?: 'Aoede' | 'Kore' | 'Puck' | 'Fenrir';
  ttsRate?: 0.9 | 1.0 | 1.15;
}

export interface FastVoiceResult {
  handledLocally: boolean;
  actionType:
    | 'NONE'
    | 'ADD_ITEMS'
    | 'REMOVE_ITEMS'
    | 'REPEAT_LAST_ORDER'
    | 'ASK_CONFIRM'
    | 'CONFIRM_ORDER'
    | 'CANCEL_ORDER'
    | 'SET_PAYMENT'
    | 'NAVIGATE'
    | 'CLEAR_CART'
    | 'SET_LANGUAGE'
    | 'SET_THEME'
    | 'TOGGLE_SOUND'
    | 'SET_VOICE_TUNING'
    | 'CHECK_WALLET'
    | 'CHECK_ORDER_STATUS'
    | 'CHECK_CART_SUMMARY'
    | 'SLEEP_WAKE';
  itemsToAdd: ParsedVoiceItem[];
  paymentMode: 'NONE' | 'upi_qr' | 'cod';
  wakeWordDetected: boolean;
  isRepeatOrSameOrder: boolean;
  navTarget?: VoiceNavTarget;
  targetLang?: AppLanguage;
  themeMode?: 'dark' | 'light' | 'toggle';
  soundEnabled?: boolean;
  voiceTuning?: VoiceTuningUpdate;
}

const HINDI_QTY_MAP: Record<string, number> = {
  'पाव': 0.25,
  'pav': 0.25,
  'paav': 0.25,
  'चौथाई': 0.25,
  'आधा': 0.5,
  'आधी': 0.5,
  'aadha': 0.5,
  'aadhi': 0.5,
  'adha': 0.5,
  'half': 0.5,
  'पौना': 0.75,
  'pauna': 0.75,
  'एक': 1,
  'ek': 1,
  'one': 1,
  'सवा': 1.25,
  'sava': 1.25,
  'डेढ़': 1.5,
  'डेढ': 1.5,
  'dedh': 1.5,
  'दो': 2,
  'do': 2,
  'two': 2,
  'ढाई': 2.5,
  'dhai': 2.5,
  'तीन': 3,
  'teen': 3,
  'three': 3,
  'चार': 4,
  'char': 4,
  'four': 4,
  'पांच': 5,
  'पाँच': 5,
  'panch': 5,
  'paanch': 5,
  'five': 5,
  'छह': 6,
  'chhah': 6,
  'six': 6,
  'सात': 7,
  'saat': 7,
  'seven': 7,
  'आठ': 8,
  'aath': 8,
  'eight': 8,
  'दस': 10,
  'das': 10,
  'ten': 10,
};

// Comprehensive spoken aliases -> produce/accessory IDs for zero-latency multi-item recognition
const SPOKEN_ALIAS_TO_ID: Record<string, string> = {
  // Roots & Daily Staples
  'लाल आलू': 'root_potato_red',
  'red potato': 'root_potato_red',
  aloo: 'root_potato',
  aalu: 'root_potato',
  आलू: 'root_potato',
  batata: 'root_potato',
  बटाटा: 'root_potato',
  potato: 'root_potato',
  pyaz: 'root_onion',
  pyaaz: 'root_onion',
  प्याज: 'root_onion',
  प्याज़: 'root_onion',
  kanda: 'root_onion',
  कांदा: 'root_onion',
  onion: 'root_onion',
  tamatar: 'veg_tomato',
  टमाटर: 'veg_tomato',
  tomato: 'veg_tomato',
  // Vegetables
  bhindi: 'veg_okra',
  भिंडी: 'veg_okra',
  okra: 'veg_okra',
  ladyfinger: 'veg_okra',
  'phool gobhi': 'veg_cauliflower',
  phoolgobhi: 'veg_cauliflower',
  फूलगोभी: 'veg_cauliflower',
  'फूल गोभी': 'veg_cauliflower',
  cauliflower: 'veg_cauliflower',
  'patta gobhi': 'veg_cabbage',
  pattagobhi: 'veg_cabbage',
  पत्तागोभी: 'veg_cabbage',
  'पत्ता गोभी': 'veg_cabbage',
  cabbage: 'veg_cabbage',
  gobhi: 'veg_cauliflower',
  गोभी: 'veg_cauliflower',
  baingan: 'veg_brinjal',
  बैंगन: 'veg_brinjal',
  brinjal: 'veg_brinjal',
  vangi: 'veg_brinjal',
  lauki: 'veg_bottle_gourd',
  लौकी: 'veg_bottle_gourd',
  dudhi: 'veg_bottle_gourd',
  दुधी: 'veg_bottle_gourd',
  'bottle gourd': 'veg_bottle_gourd',
  karela: 'veg_bitter_gourd',
  करेला: 'veg_bitter_gourd',
  'bitter gourd': 'veg_bitter_gourd',
  turai: 'veg_ridge_gourd',
  तुरई: 'veg_ridge_gourd',
  dodka: 'veg_ridge_gourd',
  gilki: 'veg_sponge_gourd',
  गिलकी: 'veg_sponge_gourd',
  nenua: 'veg_sponge_gourd',
  padwal: 'veg_snake_gourd',
  kaddu: 'veg_pumpkin',
  कद्दू: 'veg_pumpkin',
  pumpkin: 'veg_pumpkin',
  petha: 'veg_ash_gourd',
  पेठा: 'veg_ash_gourd',
  kheera: 'veg_cucumber',
  खीरा: 'veg_cucumber',
  kakdi: 'veg_cucumber',
  ककड़ी: 'veg_cucumber',
  cucumber: 'veg_cucumber',
  'लाल शिमला': 'veg_bell_pepper_red',
  'पीली शिमला': 'veg_bell_pepper_yellow',
  'shimla mirch': 'veg_capsicum',
  'शिमला मिर्च': 'veg_capsicum',
  shimla: 'veg_capsicum',
  capsicum: 'veg_capsicum',
  'hari mirch': 'veg_green_chilli',
  'हरी मिर्च': 'veg_green_chilli',
  'lal mirch': 'veg_red_chilli',
  'लाल मिर्च': 'veg_red_chilli',
  'peeli mirch': 'veg_yellow_chilli',
  'pili mirch': 'veg_yellow_chilli',
  'पीली मिर्च': 'veg_yellow_chilli',
  'yellow chilli': 'veg_yellow_chilli',
  bhavnagari: 'veg_yellow_chilli',
  'भावनगरी मिर्च': 'veg_yellow_chilli',
  mirchi: 'veg_green_chilli',
  mirch: 'veg_green_chilli',
  मिर्च: 'veg_green_chilli',
  मिर्ची: 'veg_green_chilli',
  chilli: 'veg_green_chilli',
  'surti papdi': 'veg_flat_beans',
  papdi: 'veg_flat_beans',
  'सुरती पापड़ी': 'veg_flat_beans',
  पापड़ी: 'veg_flat_beans',
  'chawli phali': 'veg_cowpea_pods',
  lobia: 'veg_cowpea_pods',
  'लोबिया फली': 'veg_cowpea_pods',
  'french beans': 'veg_french_beans',
  beans: 'veg_french_beans',
  बीन्स: 'veg_french_beans',
  gawar: 'veg_cluster_beans',
  गवार: 'veg_cluster_beans',
  sahjan: 'veg_drumstick',
  drumstick: 'veg_drumstick',
  सहजन: 'veg_drumstick',
  matar: 'veg_green_peas',
  मटर: 'veg_green_peas',
  peas: 'veg_green_peas',
  bhutta: 'veg_sweet_corn',
  भुट्टा: 'veg_sweet_corn',
  'sweet corn': 'veg_sweet_corn',
  corn: 'veg_sweet_corn',
  'baby corn': 'veg_baby_corn',
  'कच्चा पपीता': 'veg_raw_papaya',
  'कच्चा आम': 'veg_raw_mango',
  kairi: 'veg_raw_mango',
  कैरी: 'veg_raw_mango',
  kathal: 'veg_raw_jackfruit',
  कटहल: 'veg_raw_jackfruit',
  'कच्चा केला': 'veg_raw_banana',
  mushroom: 'veg_mushroom_button',
  मशरूम: 'veg_mushroom_button',
  broccoli: 'veg_broccoli',
  ब्रोकली: 'veg_broccoli',
  suran: 'veg_elephant_foot_yam',
  सूरन: 'veg_elephant_foot_yam',
  tinda: 'veg_tinda',
  टिंडा: 'veg_tinda',
  parwal: 'veg_parwal',
  परवल: 'veg_parwal',
  tindora: 'veg_ivy_gourd',
  कुंदरू: 'veg_ivy_gourd',
  // Leafy Greens & Herbs
  palak: 'leafy_palak',
  पालक: 'leafy_palak',
  spinach: 'leafy_palak',
  methi: 'leafy_methi',
  मेथी: 'leafy_methi',
  chaulai: 'leafy_green_amaranth',
  चौलाई: 'leafy_green_amaranth',
  'लाल चौलाई': 'leafy_red_amaranth',
  sarson: 'leafy_mustard_greens',
  सरसों: 'leafy_mustard_greens',
  bathua: 'leafy_bathua',
  बथुआ: 'leafy_bathua',
  shepu: 'leafy_dill',
  शेपू: 'leafy_dill',
  सोया: 'leafy_dill',
  'hara pyaz': 'leafy_spring_onion',
  'हरा प्याज': 'leafy_spring_onion',
  'spring onion': 'leafy_spring_onion',
  dhaniya: 'herb_coriander',
  धनिया: 'herb_coriander',
  coriander: 'herb_coriander',
  kothimbir: 'herb_coriander',
  कोथिंबीर: 'herb_coriander',
  pudina: 'herb_mint',
  पुदीना: 'herb_mint',
  mint: 'herb_mint',
  kadipatta: 'herb_curry_leaves',
  'कड़ी पत्ता': 'herb_curry_leaves',
  'curry leaves': 'herb_curry_leaves',
  basil: 'herb_basil',
  lemongrass: 'herb_lemongrass',
  // Roots & Spices
  gajar: 'root_carrot',
  गाजर: 'root_carrot',
  carrot: 'root_carrot',
  mooli: 'root_radish',
  मूली: 'root_radish',
  radish: 'root_radish',
  beetroot: 'root_beetroot',
  chukandar: 'root_beetroot',
  चुकंदर: 'root_beetroot',
  shakarkand: 'root_sweet_potato',
  शकरकंद: 'root_sweet_potato',
  arbi: 'root_taro',
  अरबी: 'root_taro',
  shaljam: 'root_turnip',
  शलजम: 'root_turnip',
  adrak: 'root_ginger',
  अदरक: 'root_ginger',
  ginger: 'root_ginger',
  'sukhi haldi': 'spice_dry_turmeric',
  'khadi haldi': 'spice_dry_turmeric',
  halkund: 'spice_dry_turmeric',
  हळकुंड: 'spice_dry_turmeric',
  'सूखी हल्दी': 'spice_dry_turmeric',
  'खड़ी हल्दी': 'spice_dry_turmeric',
  'kacchi haldi': 'root_turmeric',
  haldi: 'root_turmeric',
  हल्दी: 'root_turmeric',
  'हरा लहसुन': 'root_green_garlic',
  lahsun: 'root_garlic',
  लहसुन: 'root_garlic',
  garlic: 'root_garlic',
  // Fruits & Citrus
  nimbu: 'citrus_lemon',
  नींबू: 'citrus_lemon',
  lemon: 'citrus_lemon',
  mosambi: 'citrus_mosambi',
  मौसंबी: 'citrus_mosambi',
  kela: 'fruit_banana',
  केला: 'fruit_banana',
  केले: 'fruit_banana',
  banana: 'fruit_banana',
  seb: 'fruit_apple',
  सेब: 'fruit_apple',
  apple: 'fruit_apple',
  aam: 'fruit_mango',
  आम: 'fruit_mango',
  mango: 'fruit_mango',
  santra: 'fruit_orange',
  संतरा: 'fruit_orange',
  orange: 'fruit_orange',
  'काला अंगूर': 'fruit_grapes_black',
  angoor: 'fruit_grapes_green',
  अंगूर: 'fruit_grapes_green',
  grapes: 'fruit_grapes_green',
  anar: 'fruit_pomegranate',
  अनार: 'fruit_pomegranate',
  pomegranate: 'fruit_pomegranate',
  papita: 'fruit_papaya',
  पपीता: 'fruit_papaya',
  papaya: 'fruit_papaya',
  tarbooj: 'fruit_watermelon',
  तरबूज: 'fruit_watermelon',
  watermelon: 'fruit_watermelon',
  kharbooja: 'fruit_muskmelon',
  खरबूजा: 'fruit_muskmelon',
  amrood: 'fruit_guava',
  अमरूद: 'fruit_guava',
  guava: 'fruit_guava',
  ananas: 'fruit_pineapple',
  अनानास: 'fruit_pineapple',
  pineapple: 'fruit_pineapple',
  chikoo: 'fruit_chikoo',
  चीकू: 'fruit_chikoo',
  sitaphal: 'fruit_custard_apple',
  सीताफल: 'fruit_custard_apple',
  'dragon fruit': 'fruit_dragon_fruit',
  jamun: 'fruit_jamun',
  जामुन: 'fruit_jamun',
  kiwi: 'fruit_kiwi',
  कीवी: 'fruit_kiwi',
  strawberry: 'fruit_strawberry',
  स्ट्रॉबेरी: 'fruit_strawberry',
  khajoor: 'fruit_dates',
  खजूर: 'fruit_dates',
  nariyal: 'fruit_coconut',
  नारियल: 'fruit_coconut',
  coconut: 'fruit_coconut',
  // Sprouts & Essentials
  moong: 'sprout_moong',
  मूंग: 'sprout_moong',
  matki: 'sprout_matki',
  chana: 'sprout_green_chana',
  चना: 'sprout_green_chana',
  moongfali: 'sprout_peanut_pods',
  मूंगफली: 'sprout_peanut_pods',
  imli: 'other_fresh_tamarind',
  इमली: 'other_fresh_tamarind',
  kokum: 'other_fresh_kokum',
  // Tech Accessories
  charger: 'acc_fast_charger_20w',
  चार्जर: 'acc_fast_charger_20w',
  cable: 'acc_braided_cable_typec',
  केबल: 'acc_braided_cable_typec',
  earbuds: 'acc_tws_earbuds_anc',
  ईयरबड्स: 'acc_tws_earbuds_anc',
  cover: 'acc_rugged_armor_case',
  case: 'acc_rugged_armor_case',
  कवर: 'acc_rugged_armor_case',
  mount: 'acc_magnetic_car_mount',
  stand: 'acc_magnetic_car_mount',
};

function normalizeDigits(str: string): string {
  const devanagariDigits = '०१२३४५६७८९';
  return str.replace(/[०-९]/g, (d) => String(devanagariDigits.indexOf(d)));
}

const DEFAULT_WAKE_CANDIDATES = [
  'हे ताज़ा मंडी',
  'हे ताजा मंडी',
  'ओके ताज़ा मंडी',
  'ओके ताजा मंडी',
  'hey taza mandi',
  'ok taza mandi',
  'ताज़ा मंडी',
  'ताजा मंडी',
  'ताज़ामंडी',
  'ताजामंडी',
  'ताज़ा मण्डी',
  'ताजा मण्डी',
  'तज़ा मंडी',
  'तजा मंडी',
  'taza mandi',
  'taja mandi',
  'taaja mandi',
  'taaza mandi',
  'tazamandi',
  'tajamandi',
  'taajamandi',
  'taazamandi',
  'taza mandhi',
  'taaza mandhi',
].map((d) => d.normalize('NFC'));

interface WakeMatcherEntry {
  candidates: string[];
  sortedDesc: string[];
  stripRegexes: RegExp[];
}

const wakeMatcherCache = new Map<string, WakeMatcherEntry>();

function getWakeMatcher(customWakeName?: string): WakeMatcherEntry {
  const key = (customWakeName || '').normalize('NFC').trim().toLowerCase();
  const cached = wakeMatcherCache.get(key);
  if (cached) return cached;

  const customParts = key
    ? key
        .split(/[,/|]+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2)
    : [];
  const candidates = Array.from(new Set([...customParts, ...DEFAULT_WAKE_CANDIDATES]));
  const sortedDesc = [...candidates].sort((a, b) => b.length - a.length);
  const stripRegexes = sortedDesc.map(
    (cand) => new RegExp(cand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  );
  const entry = { candidates, sortedDesc, stripRegexes };
  if (wakeMatcherCache.size > 16) wakeMatcherCache.clear();
  wakeMatcherCache.set(key, entry);
  return entry;
}

export function detectWakeWord(rawText: string, customWakeName?: string): boolean {
  const t = rawText.normalize('NFC').toLowerCase().trim();
  if (!t) return false;
  const { candidates } = getWakeMatcher(customWakeName);
  for (let i = 0; i < candidates.length; i++) {
    if (t.includes(candidates[i])) return true;
  }
  return false;
}

export function stripWakeWord(rawText: string, customWakeName?: string): string {
  let out = rawText.normalize('NFC').trim();
  const { stripRegexes } = getWakeMatcher(customWakeName);
  for (let i = 0; i < stripRegexes.length; i++) {
    out = out.replace(stripRegexes[i], ' ');
  }
  return out
    .replace(/^(?:हे|अरे|सुनो|ओके|जी|ok|hey|hello|hi|ji)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isSleepCommand(rawText: string): boolean {
  const t = rawText.normalize('NFC').toLowerCase().trim();
  return (
    t === 'बस' ||
    t === 'stop' ||
    t === 'sleep' ||
    t.includes('माइक बंद') ||
    t.includes('mic band') ||
    t.includes('सुनना बंद') ||
    t.includes('thank you') ||
    t.includes('धन्यवाद') ||
    t.includes('रुक जाओ') ||
    t.includes('ruk jao')
  );
}

export function isConfirmCommand(rawText: string): boolean {
  const t = rawText.normalize('NFC').toLowerCase().trim();
  return (
    /\b(confirm|place order|book order|checkout|order done|finalize|done)\b/.test(t) ||
    t.includes('कन्फर्म') ||
    t.includes('कन्फ़र्म') ||
    t.includes('यही ऑर्डर') ||
    t.includes('ऑर्डर कन्फर्म') ||
    t.includes('ऑर्डर कन्फ़र्म') ||
    t.includes('ऑर्डर कर दो') ||
    t.includes('आर्डर कर दो') ||
    t.includes('ऑर्डर लगा दो') ||
    t.includes('ऑर्डर बुक') ||
    t.includes('ऑर्डर फाइनल') ||
    t.includes('पक्का कर दो') ||
    t.includes('पक्का करो') ||
    t.includes('हाँ कर दो') ||
    t.includes('हां कर दो') ||
    t.includes('मंगवा दो') ||
    t.includes('मँगवा दो') ||
    t.includes('भेज दो') ||
    t.includes('भेज दीजिए') ||
    t.includes('भिजवा दो') ||
    t.includes('भिजवा दीजिए') ||
    t.includes('order confirm') ||
    t.includes('order kar do') ||
    t.includes('order karo') ||
    t.includes('order lagao') ||
    t.includes('confirm kar do') ||
    t.includes('confirm karo') ||
    t.includes('pakka kar do') ||
    t.includes('pakka karo') ||
    t.includes('book kar do') ||
    t.includes('book karo') ||
    t.includes('haan kar do') ||
    t.includes('bhej do') ||
    t.includes('bhijwa do') ||
    t.includes('mangwa do') ||
    t.includes('manga do')
  );
}

export function isCancelCommand(rawText: string): boolean {
  const t = rawText.toLowerCase();
  return (
    t.includes('cancel order') ||
    t.includes('order cancel') ||
    t.includes('cancel kar') ||
    t.includes('ऑर्डर कैंसिल') ||
    t.includes('आर्डर कैंसिल') ||
    t.includes('कैंसिल कर दो') ||
    t.includes('ऑर्डर रद्द') ||
    t.includes('radd kar')
  );
}

function detectLanguageSwitch(lower: string): AppLanguage | undefined {
  const wantsLangSwitch =
    lower.includes('language') ||
    lower.includes('bhasha') ||
    lower.includes('भाषा') ||
    lower.includes('में बात') ||
    lower.includes('me baat') ||
    lower.includes('करो') ||
    lower.includes('karo') ||
    lower.includes('switch to') ||
    lower.includes('change to') ||
    lower.includes('बदलो') ||
    lower.includes('लगाओ');

  if (!wantsLangSwitch) return undefined;

  if (lower.includes('english') || lower.includes('इंग्लिश') || lower.includes('अंग्रेजी')) return 'en';
  if (lower.includes('hinglish') || lower.includes('हिंग्लिश')) return 'hinglish';
  if (lower.includes('hindi') || lower.includes('हिंदी') || lower.includes('हिन्दी')) return 'hi';
  if (lower.includes('chinese') || lower.includes('mandarin') || lower.includes('中文')) return 'zh';
  if (lower.includes('spanish') || lower.includes('español') || lower.includes('स्पेनिश')) return 'es';
  if (lower.includes('arabic') || lower.includes('العربية') || lower.includes('अरबी')) return 'ar';
  if (lower.includes('french') || lower.includes('français') || lower.includes('फ्रेंच')) return 'fr';
  if (lower.includes('portuguese') || lower.includes('português')) return 'pt';
  if (lower.includes('russian') || lower.includes('русский')) return 'ru';
  if (lower.includes('japanese') || lower.includes('日本語')) return 'ja';
  if (lower.includes('german') || lower.includes('deutsch')) return 'de';
  if (lower.includes('marathi') || lower.includes('मराठी')) return 'mr';
  if (lower.includes('gujarati') || lower.includes('गुजराती')) return 'gu';
  if (lower.includes('bengali') || lower.includes('bangla') || lower.includes('बंगाली')) return 'bn';
  if (lower.includes('tamil') || lower.includes('तमिल')) return 'ta';
  if (lower.includes('telugu') || lower.includes('तेलुगु')) return 'te';
  if (lower.includes('kannada') || lower.includes('कन्नड़')) return 'kn';
  if (lower.includes('punjabi') || lower.includes('पंजाबी')) return 'pa';
  return undefined;
}

function detectNavigationIntent(lower: string): VoiceNavTarget | undefined {
  if (
    lower.includes('close cart') ||
    lower.includes('थैली बंद') ||
    lower.includes('कार्ट बंद') ||
    lower.includes('cart band')
  ) {
    return {
      closeCart: true,
      labelHi: 'आपकी थैली बंद कर दी गई है।',
      labelEn: 'Closed your shopping bag.',
    };
  }
  if (
    lower.includes('cart') ||
    lower.includes('basket') ||
    lower.includes('thaili') ||
    lower.includes('थैली') ||
    lower.includes('टोकरी') ||
    lower.includes('कार्ट') ||
    lower.includes('बैग')
  ) {
    return {
      openCart: true,
      labelHi: 'आपकी थैली (Cart) खोल दी गई है।',
      labelEn: 'Opened your shopping bag.',
    };
  }
  if (
    lower.includes('tour') ||
    lower.includes('टूर') ||
    lower.includes('गाइड') ||
    lower.includes('कैसे चलाएं') ||
    lower.includes('kaise chalaye') ||
    lower.includes('guide me')
  ) {
    return {
      openModal: 'tour',
      labelHi: 'ऐप का इंटरैक्टिव गाइड टूर शुरू कर दिया गया है।',
      labelEn: 'Started interactive app onboarding tour.',
    };
  }
  if (
    lower.includes('login') ||
    lower.includes('sign in') ||
    lower.includes('लॉगिन') ||
    lower.includes('साइन इन')
  ) {
    return {
      openModal: 'auth',
      labelHi: 'लॉगिन / साइन-इन विंडो खोल दी गई है।',
      labelEn: 'Opened Login window.',
    };
  }
  if (
    lower.includes('address') ||
    lower.includes('पता बदल') ||
    lower.includes('पता जोड़') ||
    lower.includes('एड्रेस')
  ) {
    return {
      openModal: 'addresses',
      labelHi: 'डिलीवरी पता प्रबंधन खोल दिया गया है।',
      labelEn: 'Opened Saved Delivery Addresses.',
    };
  }
  if (
    lower.includes('edit profile') ||
    lower.includes('नाम बदलो') ||
    lower.includes('प्रोफाइल एडिट') ||
    lower.includes('नंबर बदलो')
  ) {
    return {
      openModal: 'profile',
      labelHi: 'प्रोफाइल व फोन नंबर सेटिंग्स खोल दी गई है।',
      labelEn: 'Opened Profile Editor.',
    };
  }
  if (
    lower.includes('install') ||
    lower.includes('डाउनलोड ऐप') ||
    lower.includes('ऐप इंस्टॉल') ||
    lower.includes('इंस्टॉल करो')
  ) {
    return {
      openModal: 'install',
      labelHi: 'मोबाइल ऐप इंस्टॉल गाइड खोल दिया गया है।',
      labelEn: 'Opened Mobile App Install Guide.',
    };
  }
  if (
    lower.includes('हमारे बारे') ||
    lower.includes('about us') ||
    lower.includes('about tazamandi') ||
    lower.includes('मार्को 100 क्या')
  ) {
    return {
      openModal: 'about',
      labelHi: 'ताज़ाMandi और MARCO 100 की जानकारी खोल दी गई है।',
      labelEn: 'Opened About TaazaMandi.',
    };
  }
  if (
    lower.includes('चैट बॉक्स') ||
    lower.includes('open chat') ||
    lower.includes('चैट खोलो')
  ) {
    return {
      openModal: 'voice_chat',
      labelHi: 'वॉइस व टेक्स्ट चैट बॉक्स खोल दिया गया है।',
      labelEn: 'Opened Voice & Text Chat Box.',
    };
  }
  if (
    lower.includes('batch saving') ||
    lower.includes('savings dashboard') ||
    lower.includes('daily forecast') ||
    lower.includes('बचत रिपोर्ट खोलो') ||
    lower.includes('बचत डैशबोर्ड') ||
    lower.includes('अनुमान खोलो')
  ) {
    return {
      openModal: 'savings',
      labelHi: 'बैच बचत, बाज़ार नुकसान व दैनिक अनुमान रिपोर्ट खोल दी गई है।',
      labelEn: 'Opened Batch Savings & Daily Forecast dashboard.',
    };
  }
  if (
    lower.includes('track') ||
    lower.includes('ट्रैक') ||
    lower.includes('डिलीवरी ट्रैकर')
  ) {
    return {
      tab: 'tracking',
      labelHi: 'लाइव डिलीवरी ट्रैकर खोल दिया गया है।',
      labelEn: 'Opened live delivery tracker.',
    };
  }
  if (
    lower.includes('my order') ||
    lower.includes('orders') ||
    lower.includes('मेरे ऑर्डर') ||
    lower.includes('मेरा ऑर्डर') ||
    lower.includes('ऑर्डर दिखाओ') ||
    lower.includes('order dikhao') ||
    lower.includes('bill dikhao') ||
    lower.includes('बिल दिखाओ') ||
    lower.includes('रसीद') ||
    lower.includes('invoice')
  ) {
    return {
      tab: 'orders',
      labelHi: 'आपके ऑर्डर्स व बिल सेक्शन खोल दिया गया है।',
      labelEn: 'Opened My Orders & Invoices.',
    };
  }
  if (
    lower.includes('accessory') ||
    lower.includes('accessories') ||
    lower.includes('मोबाइल एक्सेसरी') ||
    lower.includes('एक्सेसरी') ||
    lower.includes('चार्जर सेक्शन') ||
    lower.includes('ईयरबड्स दिखाओ')
  ) {
    return {
      tab: 'accessories',
      labelHi: 'मोबाइल एक्सेसरी स्टोर खोल दिया गया है।',
      labelEn: 'Opened Mobile Accessories section.',
    };
  }
  if (
    lower.includes('pool') ||
    lower.includes('पूल') ||
    lower.includes('कम्युनिटी') ||
    lower.includes('सोसायटी डिमांड')
  ) {
    return {
      tab: 'pool',
      labelHi: 'कम्युनिटी डिमांड पूल खोल दिया गया है।',
      labelEn: 'Opened Community Demand Pool.',
    };
  }
  if (
    lower.includes('map') ||
    lower.includes('मैप') ||
    lower.includes('नक्शा') ||
    lower.includes('लोकेशन')
  ) {
    return {
      tab: 'map',
      labelHi: 'लाइव Google Maps रूट खोल दिया गया है।',
      labelEn: 'Opened Live Delivery Map.',
    };
  }
  if (
    lower.includes('account') ||
    lower.includes('profile') ||
    lower.includes('अकाउंट') ||
    lower.includes('प्रोफाइल')
  ) {
    return {
      tab: 'account',
      labelHi: 'अकाउंट व सेवाएं सेक्शन खोल दिया गया है।',
      labelEn: 'Opened Account & Services.',
    };
  }
  if (
    lower.includes('referral') ||
    lower.includes('cashback') ||
    lower.includes('रेफरल') ||
    lower.includes('कैशबैक')
  ) {
    return {
      tab: 'referral',
      labelHi: 'रेफरल व कैशबैक सेक्शन खोल दिया गया है।',
      labelEn: 'Opened Referral & Cashback Hub.',
    };
  }
  if (
    lower.includes('admin') ||
    lower.includes('मंडी शीट') ||
    lower.includes('mandi sheet') ||
    lower.includes('खरीद शीट')
  ) {
    return {
      tab: 'mandi',
      labelHi: 'मंडी खरीद व एडमिन सेक्शन खोल दिया गया है।',
      labelEn: 'Opened Mandi Procurement Desk.',
    };
  }
  if (
    lower.includes('सीजनल') ||
    lower.includes('मौसमी दिखाओ') ||
    lower.includes('seasonal')
  ) {
    return {
      tab: 'catalog',
      category: 'seasonal',
      labelHi: 'सीजनल ताज़ा स्पेशल आइटम दिखा रहे हैं।',
      labelEn: 'Showing Seasonal Specials.',
    };
  }
  if (
    lower.includes('जड़') ||
    lower.includes('roots') ||
    lower.includes('कंदमूल')
  ) {
    return {
      tab: 'catalog',
      category: 'roots',
      labelHi: 'जड़ वाली सब्ज़ियाँ व मसाले दिखा रहे हैं।',
      labelEn: 'Showing Roots & Spices.',
    };
  }
  if (
    lower.includes('मसाले') ||
    lower.includes('हर्ब्स') ||
    lower.includes('herbs')
  ) {
    return {
      tab: 'catalog',
      category: 'herbs',
      labelHi: 'ताज़े हर्ब्स व धनिया-पुदीना दिखा रहे हैं।',
      labelEn: 'Showing Fresh Herbs.',
    };
  }
  if (
    lower.includes('अंकुरित') ||
    lower.includes('sprout')
  ) {
    return {
      tab: 'catalog',
      category: 'sprouts',
      labelHi: 'ताज़े स्प्राउट्स सेक्शन दिखा रहे हैं।',
      labelEn: 'Showing Fresh Sprouts.',
    };
  }
  if (
    lower.includes('फल दिखाओ') ||
    lower.includes('fruits dikhao') ||
    lower.includes('show fruits') ||
    lower.includes('सिर्फ फल')
  ) {
    return {
      tab: 'catalog',
      category: 'fruits',
      labelHi: 'ताज़े फल सेक्शन दिखा रहे हैं।',
      labelEn: 'Showing Fresh Fruits.',
    };
  }
  if (
    lower.includes('साग दिखाओ') ||
    lower.includes('पत्तेदार') ||
    lower.includes('leafy') ||
    lower.includes('saag dikhao')
  ) {
    return {
      tab: 'catalog',
      category: 'leafy',
      labelHi: 'ताज़े साग व पत्तेदार सब्ज़ियाँ दिखा रहे हैं।',
      labelEn: 'Showing Leafy Greens.',
    };
  }
  if (
    lower.includes('सब्जी दिखाओ') ||
    lower.includes('सब्ज़ी दिखाओ') ||
    lower.includes('मंडी खोलो') ||
    lower.includes('होम दिखाओ') ||
    lower.includes('sabzi dikhao') ||
    lower.includes('show vegetables') ||
    lower.includes('all items') ||
    lower.includes('सभी आइटम') ||
    lower.includes('सभी दिखाओ') ||
    lower.includes('सर्च हटाओ') ||
    lower.includes('clear search')
  ) {
    return {
      tab: 'catalog',
      category: 'all',
      search: '',
      labelHi: 'ताज़ा मंडी मुख्य बाज़ार खोल दिया गया है।',
      labelEn: 'Opened ताज़ाMandi Market Catalog.',
    };
  }
  const searchMatch = lower.match(/(?:search|find|खोजो|ढूंढो|dhoondho)\s+(.{2,30})$/);
  if (searchMatch && searchMatch[1]) {
    const q = searchMatch[1].trim();
    return {
      tab: 'catalog',
      category: 'all',
      search: q,
      labelHi: `"${q}" खोज रहे हैं।`,
      labelEn: `Searching for "${q}".`,
    };
  }
  return undefined;
}

function extractQtyBeforeMatch(segment: string): number {
  const clean = normalizeDigits(segment.toLowerCase()).trim();
  if (!clean) return 1;

  // Check gram suffix like "500g", "250 gm", "500 gram", "500 ग्राम"
  const gramMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gms|gram|grams|ग्राम)\b/);
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1]);
    if (grams > 0) return Math.max(0.25, Math.round((grams / 1000) * 100) / 100);
  }

  // Check numeric quantity like "2", "1.5", "2 kg", "3 kilo"
  const numMatch = clean.match(/(\d+(?:\.\d+)?)(?:\s*(?:kg|kilo|किलो|pcs|piece|पीस|गड्डी|gaddi|pack))?\s*$/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (val > 0 && val <= 100) return val;
  }

  // Check Hindi / Hinglish word quantities in trailing tokens
  const tokens = clean.split(/[\s,]+/).filter(Boolean);
  for (let i = tokens.length - 1; i >= Math.max(0, tokens.length - 4); i--) {
    const tok = tokens[i];
    if (HINDI_QTY_MAP[tok] !== undefined) {
      return HINDI_QTY_MAP[tok];
    }
  }

  // Fallback: any numeric value in trailing snippet
  const anyNum = clean.match(/(\d+(?:\.\d+)?)/g);
  if (anyNum && anyNum.length > 0) {
    const val = parseFloat(anyNum[anyNum.length - 1]);
    if (val > 0 && val <= 100) return val;
  }

  return 1;
}

const SORTED_SPOKEN_ALIASES: Array<[string, string]> = Object.entries(SPOKEN_ALIAS_TO_ID).sort(
  (a, b) => b[0].length - a[0].length
);

interface CatalogSearchIndex {
  produceListRef: ProduceItem[];
  accessoriesListRef: MobileAccessoryItem[];
  availableProduceById: Map<string, ProduceItem>;
  inStockAccessoryById: Map<string, MobileAccessoryItem>;
  dynamicEntries: Array<{ phrase: string; id: string; type: 'produce' | 'accessory' }>;
}

let cachedCatalogIndex: CatalogSearchIndex | null = null;

function getCatalogSearchIndex(
  produceList: ProduceItem[],
  accessoriesList: MobileAccessoryItem[]
): CatalogSearchIndex {
  if (
    cachedCatalogIndex &&
    cachedCatalogIndex.produceListRef === produceList &&
    cachedCatalogIndex.accessoriesListRef === accessoriesList
  ) {
    return cachedCatalogIndex;
  }

  const availableProduceById = new Map<string, ProduceItem>();
  const inStockAccessoryById = new Map<string, MobileAccessoryItem>();
  const dynamicEntries: Array<{ phrase: string; id: string; type: 'produce' | 'accessory' }> = [];

  for (let i = 0; i < produceList.length; i++) {
    const p = produceList[i];
    if (p.isAvailable === false) continue;
    availableProduceById.set(p.id, p);
    const rawNames = [p.name.en, p.name.hi, p.name.mr, p.name.hinglish];
    for (let j = 0; j < rawNames.length; j++) {
      const raw = rawNames[j];
      if (!raw) continue;
      const cleaned = raw.replace(/\(.*?\)/g, '').trim().toLowerCase();
      if (cleaned.length >= 3) {
        dynamicEntries.push({ phrase: cleaned, id: p.id, type: 'produce' });
      }
    }
  }

  for (let i = 0; i < accessoriesList.length; i++) {
    const a = accessoriesList[i];
    if (a.inStock === false) continue;
    inStockAccessoryById.set(a.id, a);
    const rawNames = [a.name.en, a.name.hi, a.name.hinglish];
    for (let j = 0; j < rawNames.length; j++) {
      const raw = rawNames[j];
      if (!raw) continue;
      const cleaned = raw.toLowerCase();
      if (cleaned.length >= 3) {
        dynamicEntries.push({ phrase: cleaned, id: a.id, type: 'accessory' });
      }
    }
  }

  dynamicEntries.sort((a, b) => b.phrase.length - a.phrase.length);

  cachedCatalogIndex = {
    produceListRef: produceList,
    accessoriesListRef: accessoriesList,
    availableProduceById,
    inStockAccessoryById,
    dynamicEntries,
  };
  return cachedCatalogIndex;
}

const QUESTION_REGEX =
  /\b(what|why|how|which|when|where|who|explain|tell me|recipe|season|suggest|tip|batao|bataiye|samjhao|konsa|kaun|kaisa|kaise|kyu|kyon|kya|kitna|kitne|kab|kahan|bhav|rate|price|saving|savings|bachat|nuksaan|fayda)\b|क्या|कितना|कितने|कैसे|क्यों|कब|कहाँ|कौन|बताओ|बताइए|समझाओ|भाव|दाम|बचत|फ़ायदे|फायदे|नुकसान/;
const CLAUSE_SPLIT_REGEX = /(?:,|&|\baur\b|\band\b|और|तथा|अनि|आणि)/i;

function findBoundedPhraseIndex(haystack: string, needle: string, fromIdx: number): number {
  const isWordChar = (ch: string) => /[a-z0-9\u0900-\u097f]/i.test(ch);
  let pos = haystack.indexOf(needle, fromIdx);
  while (pos !== -1) {
    const before = pos > 0 ? haystack[pos - 1] : '';
    const after = pos + needle.length < haystack.length ? haystack[pos + needle.length] : '';
    const leftOk = !before || !isWordChar(before);
    const rightOk = !after || !isWordChar(after);
    if (leftOk && rightOk) return pos;
    pos = haystack.indexOf(needle, pos + 1);
  }
  return -1;
}

export function parseVoiceCommandFast(
  rawText: string,
  produceList: ProduceItem[],
  accessoriesList: MobileAccessoryItem[],
  customWakeName?: string
): FastVoiceResult {
  const nfcRaw = rawText.normalize('NFC');
  const wakeWordDetected = detectWakeWord(nfcRaw, customWakeName);
  const cleanedText = wakeWordDetected ? stripWakeWord(nfcRaw, customWakeName) : nfcRaw.trim();
  const normalized = normalizeDigits(cleanedText);
  const lower = normalized.toLowerCase();

  // Payment mode intent
  let paymentMode: 'NONE' | 'upi_qr' | 'cod' = 'NONE';
  if (/\b(upi|qr|gpay|phonepe|paytm|online)\b/.test(lower) || lower.includes('यूपीआई') || lower.includes('क्यूआर')) {
    paymentMode = 'upi_qr';
  } else if (/\b(cod|cash|cash on delivery)\b/.test(lower) || lower.includes('कैश') || lower.includes('नकद')) {
    paymentMode = 'cod';
  }

  if (lower && isSleepCommand(lower)) {
    return {
      handledLocally: true,
      actionType: 'SLEEP_WAKE',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }

  if (
    lower.includes('थैली खाली') ||
    lower.includes('कार्ट खाली') ||
    lower.includes('clear cart') ||
    lower.includes('empty cart') ||
    lower.includes('sab hatao') ||
    lower.includes('सब हटाओ')
  ) {
    return {
      handledLocally: true,
      actionType: 'CLEAR_CART',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }

  // Instant Language Switch
  const switchedLang = detectLanguageSwitch(lower);
  if (switchedLang) {
    return {
      handledLocally: true,
      actionType: 'SET_LANGUAGE',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
      targetLang: switchedLang,
    };
  }

  // Dark / Light Theme toggle
  if (
    lower.includes('dark mode') ||
    lower.includes('night mode') ||
    lower.includes('डार्क मोड') ||
    lower.includes('नाइट मोड')
  ) {
    return {
      handledLocally: true,
      actionType: 'SET_THEME',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
      themeMode: 'dark',
    };
  }
  if (
    lower.includes('light mode') ||
    lower.includes('day mode') ||
    lower.includes('लाइट मोड') ||
    lower.includes('डे मोड')
  ) {
    return {
      handledLocally: true,
      actionType: 'SET_THEME',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
      themeMode: 'light',
    };
  }

  // Voice & Sound Control
  if (
    lower.includes('mute voice') ||
    lower.includes('चुप रहो') ||
    lower.includes('साउंड बंद') ||
    lower.includes('आवाज़ बंद') ||
    lower.includes('sound off')
  ) {
    return {
      handledLocally: true,
      actionType: 'TOGGLE_SOUND',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
      soundEnabled: false,
    };
  }
  if (
    lower.includes('unmute') ||
    lower.includes('साउंड चालू') ||
    lower.includes('आवाज़ चालू') ||
    lower.includes('sound on')
  ) {
    return {
      handledLocally: true,
      actionType: 'TOGGLE_SOUND',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
      soundEnabled: true,
    };
  }

  // Hands-Free Voice Sensitivity & Natural TTS Persona Controls
  if (
    lower.includes('sensitivity') ||
    lower.includes('सेंसिटिविटी') ||
    lower.includes('माइक सेटिंग') ||
    lower.includes('वॉइस सेटिंग') ||
    lower.includes('voice setting') ||
    lower.includes('voice tuning') ||
    lower.includes('धीमे बोलो') ||
    lower.includes('धीरे बोलो') ||
    lower.includes('dheere bolo') ||
    lower.includes('speak slowly') ||
    lower.includes('तेज़ बोलो') ||
    lower.includes('तेज बोलो') ||
    lower.includes('tez bolo') ||
    lower.includes('speak faster') ||
    lower.includes('आवाज़ बदलो') ||
    lower.includes('आवाज बदलो') ||
    lower.includes('awaaz badlo') ||
    lower.includes('change voice')
  ) {
    const tuning: VoiceTuningUpdate = {};
    if (
      lower.includes('बढ़ा') ||
      lower.includes('badha') ||
      lower.includes('high') ||
      lower.includes('ultra') ||
      lower.includes('ज्यादा') ||
      lower.includes('zyada')
    ) {
      tuning.micSensitivity = 'high';
    } else if (
      lower.includes('कम') ||
      lower.includes('kam') ||
      lower.includes('noisy') ||
      lower.includes('शोर') ||
      lower.includes('low')
    ) {
      tuning.micSensitivity = 'low_noise';
    } else if (
      lower.includes('धीमे बोलो') ||
      lower.includes('धीरे बोलो') ||
      lower.includes('dheere bolo') ||
      lower.includes('speak slowly')
    ) {
      tuning.ttsRate = 0.9;
    } else if (
      lower.includes('तेज़ बोलो') ||
      lower.includes('तेज बोलो') ||
      lower.includes('tez bolo') ||
      lower.includes('speak faster')
    ) {
      tuning.ttsRate = 1.15;
    } else if (
      lower.includes('male') ||
      lower.includes('लड़के') ||
      lower.includes('पुरुष') ||
      lower.includes('fenrir')
    ) {
      tuning.ttsVoice = 'Fenrir';
    } else if (
      lower.includes('आवाज़ बदलो') ||
      lower.includes('आवाज बदलो') ||
      lower.includes('awaaz badlo') ||
      lower.includes('change voice')
    ) {
      tuning.ttsVoice = 'Puck';
    } else {
      tuning.openPanel = true;
    }

    return {
      handledLocally: true,
      actionType: 'SET_VOICE_TUNING',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
      voiceTuning: tuning,
    };
  }

  // Wallet, Order Status & Cart Summary checks (strictly scoped so saving/price questions reach AI)
  if (
    lower.includes('wallet') ||
    lower.includes('वॉलेट') ||
    lower.includes('कैशबैक बैलेंस') ||
    lower.includes('रेफरल कोड') ||
    lower.includes('referral code')
  ) {
    return {
      handledLocally: true,
      actionType: 'CHECK_WALLET',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }
  if (
    lower.includes('कहाँ पहुंचा') ||
    lower.includes('कहां पहुंचा') ||
    lower.includes('kahan pahuncha') ||
    lower.includes('order status') ||
    lower.includes('ऑर्डर स्टेटस') ||
    lower.includes('आर्डर स्टेटस') ||
    lower.includes('मेरा ऑर्डर कब')
  ) {
    return {
      handledLocally: true,
      actionType: 'CHECK_ORDER_STATUS',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }
  if (
    lower.includes('थैली में क्या') ||
    lower.includes('कार्ट में क्या') ||
    lower.includes('cart mein kya') ||
    lower.includes('cart me kya') ||
    lower.includes('thaili mein kya') ||
    lower.includes('thaili me kya') ||
    lower.includes('कितना बिल') ||
    lower.includes('total kitna') ||
    lower.includes('kitna bill') ||
    lower.includes('what is in cart') ||
    lower.includes('cart summary')
  ) {
    return {
      handledLocally: true,
      actionType: 'CHECK_CART_SUMMARY',
      itemsToAdd: [],
      paymentMode: 'NONE',
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }

  // Open-ended questions should go to Gemini LLM for intelligent conversational answers
  const isQuestion =
    lower.includes('?') ||
    QUESTION_REGEX.test(lower) ||
    lower.includes('क्या ताज़ा') ||
    lower.includes('मौसम') ||
    lower.includes('रेसिपी') ||
    lower.includes('सुझाव');

  if (isCancelCommand(lower)) {
    return {
      handledLocally: true,
      actionType: 'CANCEL_ORDER',
      itemsToAdd: [],
      paymentMode,
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }

  const confirmIntent = isConfirmCommand(lower);
  const isRepeatOrSameOrder =
    lower.includes('यही ऑर्डर') ||
    lower.includes('यही आर्डर') ||
    lower.includes('पिछला ऑर्डर') ||
    lower.includes('दोहराओ') ||
    lower.includes('फिर से डालो') ||
    lower.includes('yahi order') ||
    lower.includes('wahi order') ||
    lower.includes('pichla order') ||
    lower.includes('same order') ||
    lower.includes('repeat order') ||
    lower.includes('repeat last order') ||
    lower.includes('last order');

  const isRemoveIntent =
    lower.includes('हटाओ') ||
    lower.includes('हटा दो') ||
    lower.includes('निकाल दो') ||
    lower.includes('निकालो') ||
    lower.includes('कम करो') ||
    lower.includes('कम कर दो') ||
    lower.includes('मत डालो') ||
    lower.includes('hatao') ||
    lower.includes('hata do') ||
    lower.includes('nikal do') ||
    lower.includes('kam karo') ||
    /\b(remove|delete|drop)\b/.test(lower);

  const catalogIdx = getCatalogSearchIndex(produceList, accessoriesList);

  // Split sentence into clauses, AND scan multiple sequential items within each clause
  const clauses = lower.split(CLAUSE_SPLIT_REGEX);
  const itemsToAdd: ParsedVoiceItem[] = [];
  const seenIds = new Set<string>();

  for (let cIdx = 0; cIdx < clauses.length; cIdx++) {
    const clause = clauses[cIdx].trim();
    if (!clause) continue;

    const hits: { idx: number; endIdx: number; id: string; type: 'produce' | 'accessory' }[] = [];

    const overlapsExisting = (start: number, end: number) => {
      for (let h = 0; h < hits.length; h++) {
        const hit = hits[h];
        if (!(end <= hit.idx || start >= hit.endIdx)) return true;
      }
      return false;
    };

    for (let aIdx = 0; aIdx < SORTED_SPOKEN_ALIASES.length; aIdx++) {
      const [alias, targetId] = SORTED_SPOKEN_ALIASES[aIdx];
      if (alias.length > clause.length) continue;
      let searchFrom = 0;
      while (searchFrom < clause.length) {
        const idx = findBoundedPhraseIndex(clause, alias, searchFrom);
        if (idx === -1) break;
        const endIdx = idx + alias.length;
        if (!overlapsExisting(idx, endIdx)) {
          if (catalogIdx.availableProduceById.has(targetId)) {
            hits.push({ idx, endIdx, id: targetId, type: 'produce' });
          } else if (catalogIdx.inStockAccessoryById.has(targetId)) {
            hits.push({ idx, endIdx, id: targetId, type: 'accessory' });
          }
        }
        searchFrom = endIdx;
      }
    }

    const dynamicEntries = catalogIdx.dynamicEntries;
    for (let dIdx = 0; dIdx < dynamicEntries.length; dIdx++) {
      const entry = dynamicEntries[dIdx];
      if (entry.phrase.length > clause.length) continue;
      let searchFrom = 0;
      while (searchFrom < clause.length) {
        const idx = findBoundedPhraseIndex(clause, entry.phrase, searchFrom);
        if (idx === -1) break;
        const endIdx = idx + entry.phrase.length;
        if (!overlapsExisting(idx, endIdx)) {
          hits.push({ idx, endIdx, id: entry.id, type: entry.type });
        }
        searchFrom = endIdx;
      }
    }

    if (hits.length > 1) {
      hits.sort((a, b) => a.idx - b.idx);
    }

    let prevBoundary = 0;
    for (let hIdx = 0; hIdx < hits.length; hIdx++) {
      const hit = hits[hIdx];
      if (!seenIds.has(hit.id)) {
        seenIds.add(hit.id);
        const precedingSlice = clause.slice(prevBoundary, hit.idx);
        const qty = extractQtyBeforeMatch(precedingSlice);
        itemsToAdd.push({
          itemId: hit.id,
          itemType: hit.type,
          qty: hit.type === 'accessory' ? Math.max(1, Math.round(qty)) : qty,
        });
      }
      prevBoundary = hit.endIdx;
    }
  }

  // Handle pure "repeat last order" refill when not confirming immediately
  if (!isQuestion && isRepeatOrSameOrder && itemsToAdd.length === 0 && !confirmIntent) {
    return {
      handledLocally: true,
      actionType: 'REPEAT_LAST_ORDER',
      itemsToAdd: [],
      paymentMode,
      wakeWordDetected,
      isRepeatOrSameOrder: true,
    };
  }

  // Handle item removal from cart ("आलू हटाओ" / "remove tomato")
  if (!isQuestion && isRemoveIntent && itemsToAdd.length > 0 && !confirmIntent) {
    return {
      handledLocally: true,
      actionType: 'REMOVE_ITEMS',
      itemsToAdd,
      paymentMode,
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }

  // If confirm phrase or items matched locally (and not an open question), handle instantaneously!
  if (!isQuestion && (confirmIntent || itemsToAdd.length > 0)) {
    return {
      handledLocally: true,
      actionType: confirmIntent ? 'CONFIRM_ORDER' : 'ADD_ITEMS',
      itemsToAdd,
      paymentMode,
      wakeWordDetected,
      isRepeatOrSameOrder,
    };
  }

  // Check Website Navigation intent (when not adding items)
  if (!isQuestion) {
    const navTarget = detectNavigationIntent(lower);
    if (navTarget) {
      return {
        handledLocally: true,
        actionType: 'NAVIGATE',
        itemsToAdd: [],
        paymentMode,
        wakeWordDetected,
        isRepeatOrSameOrder: false,
        navTarget,
      };
    }
  }

  if (!isQuestion && paymentMode !== 'NONE') {
    return {
      handledLocally: true,
      actionType: 'SET_PAYMENT',
      itemsToAdd: [],
      paymentMode,
      wakeWordDetected,
      isRepeatOrSameOrder: false,
    };
  }

  return {
    handledLocally: false,
    actionType: 'NONE',
    itemsToAdd: [],
    paymentMode,
    wakeWordDetected,
    isRepeatOrSameOrder: false,
  };
}

const ASSISTANT_ECHO_STEMS = [
  'थैली में जोड़ दिया',
  'थैली खाली है',
  'थैली खाली कर दी',
  'कोई पिछला ऑर्डर नहीं मिला',
  'ऑर्डर कन्फ़र्म हो गया',
  'ऑर्डर कन्फर्म हो गया',
  'आर्डर कन्फर्म हो गया',
  'ऑर्डर पक्का हो गया',
  'ताज़ा मंडी सुन रहा',
  'क्या मंगवाना है',
  'कैंसिल कर दिया गया',
  'स्टैंडबाय में हूँ',
  'साफ़ सुनाई नहीं दिया',
  'कृपया साफ़ बोलें',
  'added to bag',
  'added to your',
  'your cart is empty',
  'order confirmed',
  'confirm ho gaya',
  'add ho gaya',
  'please speak your order',
  'taaza mandi ready',
  'back in standby',
];

function normalizeForEchoCompare(txt: string): string {
  return normalizeDigits(txt.normalize('NFC'))
    .toLowerCase()
    .replace(/[.,!?।|"'₹#\-:/()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NORMALIZED_ECHO_STEMS = ASSISTANT_ECHO_STEMS.map(normalizeForEchoCompare).filter(Boolean);

const UNIT_FILLER_WORDS = new Set([
  'किलो',
  'ग्राम',
  'kilo',
  'kg',
  'gram',
  'gm',
  'pcs',
  'पीस',
  'गड्डी',
  'जी',
  'और',
  'है',
  'में',
  'को',
  'के',
  'का',
  'की',
  'से',
  'एक',
  'दो',
  'तीन',
  'चार',
  'पांच',
  'या',
  'add',
  'the',
  'for',
  'and',
]);

export function isSelfEchoTranscript(heardText: string, recentSpokenList: string[]): boolean {
  const heardNorm = normalizeForEchoCompare(heardText);
  if (!heardNorm || heardNorm.length < 2) return false;

  // 1. Check strict assistant-only phrasing (pre-normalized once at startup)
  for (let i = 0; i < NORMALIZED_ECHO_STEMS.length; i++) {
    if (heardNorm.includes(NORMALIZED_ECHO_STEMS[i])) {
      return true;
    }
  }

  const heardWords = heardNorm.split(' ');
  const heardContentWords: string[] = [];
  for (let i = 0; i < heardWords.length; i++) {
    const w = heardWords[i];
    if (w.length >= 2 && !/^\d+$/.test(w) && !UNIT_FILLER_WORDS.has(w)) {
      heardContentWords.push(w);
    }
  }

  // 2. Compare against recent TTS utterances (substring or content-word overlap)
  for (let i = 0; i < recentSpokenList.length; i++) {
    const spokenNorm = normalizeForEchoCompare(recentSpokenList[i]);
    if (!spokenNorm) continue;

    if (
      heardNorm.length >= 8 &&
      (spokenNorm.includes(heardNorm) || heardNorm.includes(spokenNorm))
    ) {
      return true;
    }

    if (heardContentWords.length >= 2) {
      const spokenWords = spokenNorm.split(' ');
      const spokenWordSet = new Set<string>();
      for (let j = 0; j < spokenWords.length; j++) {
        const w = spokenWords[j];
        if (w.length >= 2 && !/^\d+$/.test(w) && !UNIT_FILLER_WORDS.has(w)) {
          spokenWordSet.add(w);
        }
      }
      let overlap = 0;
      for (let k = 0; k < heardContentWords.length; k++) {
        if (spokenWordSet.has(heardContentWords[k])) overlap++;
      }
      if (overlap >= 2 && overlap / heardContentWords.length >= 0.65) {
        return true;
      }
    }
  }

  return false;
}


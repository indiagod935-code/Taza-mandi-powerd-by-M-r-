/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified 10-Language Localization Helper for ताज़ाMandi
 * Supports: Hindi, English, Hinglish, Marathi, Gujarati, Bengali, Tamil, Telugu, Kannada, Punjabi
 */
import { AppLanguage, LocalizedString } from '../types';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  shortLabel: string;
  nativeGreeting: string;
  region: 'global' | 'india';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English (Default)', shortLabel: 'EN', nativeGreeting: 'Hello', region: 'global' },
  { code: 'hi', label: 'हिंदी (Hindi)', shortLabel: 'HI', nativeGreeting: 'नमस्ते', region: 'india' },
  { code: 'hinglish', label: 'Hinglish (हिंग्लिश)', shortLabel: 'HG', nativeGreeting: 'Namaste', region: 'india' },
  { code: 'zh', label: '中文 (Mandarin Chinese)', shortLabel: 'ZH', nativeGreeting: '你好', region: 'global' },
  { code: 'es', label: 'Español (Spanish)', shortLabel: 'ES', nativeGreeting: 'Hola', region: 'global' },
  { code: 'ar', label: 'العربية (Arabic)', shortLabel: 'AR', nativeGreeting: 'مرحبا', region: 'global' },
  { code: 'fr', label: 'Français (French)', shortLabel: 'FR', nativeGreeting: 'Bonjour', region: 'global' },
  { code: 'pt', label: 'Português (Portuguese)', shortLabel: 'PT', nativeGreeting: 'Olá', region: 'global' },
  { code: 'ru', label: 'Русский (Russian)', shortLabel: 'RU', nativeGreeting: 'Привет', region: 'global' },
  { code: 'bn', label: 'বাংলা (Bengali)', shortLabel: 'BN', nativeGreeting: 'নমস্কার', region: 'india' },
  { code: 'ja', label: '日本語 (Japanese)', shortLabel: 'JA', nativeGreeting: 'こんにちは', region: 'global' },
  { code: 'de', label: 'Deutsch (German)', shortLabel: 'DE', nativeGreeting: 'Hallo', region: 'global' },
  { code: 'mr', label: 'मराठी (Marathi)', shortLabel: 'MR', nativeGreeting: 'नमस्कार', region: 'india' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', shortLabel: 'GU', nativeGreeting: 'નમસ્તે', region: 'india' },
  { code: 'ta', label: 'தமிழ் (Tamil)', shortLabel: 'TA', nativeGreeting: 'வணக்கம்', region: 'india' },
  { code: 'te', label: 'తెలుగు (Telugu)', shortLabel: 'TE', nativeGreeting: 'నమస్కారం', region: 'india' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)', shortLabel: 'KN', nativeGreeting: 'ನಮಸ್ಕಾರ', region: 'india' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)', shortLabel: 'PA', nativeGreeting: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', region: 'india' },
];

export type MultiLangMap = {
  en: string;
  hi?: string;
  mr?: string;
  hinglish?: string;
  gu?: string;
  bn?: string;
  ta?: string;
  te?: string;
  kn?: string;
  pa?: string;
  zh?: string;
  es?: string;
  ar?: string;
  fr?: string;
  pt?: string;
  ru?: string;
  ja?: string;
  de?: string;
};

/**
 * Picks the exact string for the active language.
 * Strict isolation: non-Hindi languages NEVER accidentally leak Hindi text;
 * missing regional/global strings cleanly fall back to English.
 */
export function pickLang(lang: AppLanguage, map: MultiLangMap): string {
  const direct = map[lang];
  if (direct && direct.trim().length > 0) return direct;
  if (lang === 'mr') return map.mr || map.hi || map.en;
  if (lang === 'hi') return map.hi || map.en;
  if (lang === 'hinglish') return map.hinglish || map.en;
  return map.en;
}

// Regional Produce Name Dictionary for common Indian staples across Gujarati, Bengali, Tamil, Telugu, Kannada, Punjabi
const REGIONAL_PRODUCE_NAMES: Record<
  string,
  Partial<Record<'gu' | 'bn' | 'ta' | 'te' | 'kn' | 'pa', string>>
> = {
  veg_tomato: { gu: 'તાજા ટામેટા', bn: 'টাটকা টমেটো', ta: 'தக்காளி', te: 'టమాటా', kn: 'ಟೊಮೆಟೊ', pa: 'ਤਾਜ਼ਾ ਟਮਾਟਰ' },
  root_onion: { gu: 'નાસિક લાલ ડુંગળી', bn: 'লাল পেঁয়াজ', ta: 'சின்ன/பெரிய வெங்காயம்', te: 'ఉల్లిపాయలు', kn: 'ಈರುಳ್ಳಿ', pa: 'ਲਾਲ ਪਿਆਜ਼' },
  root_potato: { gu: 'તાજા બટાકા', bn: 'টাটকা আলু', ta: 'உருளைக்கிழங்கு', te: 'బంగాళదుంప', kn: 'ಆಲೂಗಡ್ಡೆ', pa: 'ਤਾਜ਼ੇ ਆਲੂ' },
  root_potato_red: { gu: 'લાલ પહાડી બટાકા', bn: 'লাল আলু', ta: 'சிவப்பு உருளை', te: 'ఎర్ర బంగాళదుంప', kn: 'ಕೆಂಪು ಆಲೂಗಡ್ಡೆ', pa: 'ਲਾਲ ਪਹਾੜੀ ਆਲੂ' },
  root_carrot: { gu: 'લાલ દેશી ગાજર', bn: 'লাল গাজর', ta: 'கேரட்', te: 'క్యారెట్', kn: 'ಕ್ಯಾರೆಟ್', pa: 'ਦੇਸੀ ਲਾਲ ਗਾਜਰ' },
  root_radish: { gu: 'સફેદ મૂળા', bn: 'সাদা মুলো', ta: 'முள்ளங்கி', te: 'ముల్లంగి', kn: 'ಮೂಲಂಗಿ', pa: 'ਤਾਜ਼ੀ ਚਿੱਟੀ ਮੂਲੀ' },
  root_beetroot: { gu: 'બીટરૂટ', bn: 'বিট', ta: 'பீட்ரூட்', te: 'బీట్‌రూట్', kn: 'ಬೀಟ್‌ರೂಟ್', pa: 'ਚੁਕੰਦਰ' },
  leafy_palak: { gu: 'તાજી પાલક', bn: 'টাটকা পালং শাক', ta: 'பாலக்கீரை', te: 'పాలకూర', kn: 'ಪಾಲಕ್ ಸೊಪ್ಪು', pa: 'ਤਾਜ਼ਾ ਪਾਲਕ' },
  herb_coriander: { gu: 'તાજી કોથમીર', bn: 'ধনে পাতা', ta: 'கொத்தமல்லி', te: 'కొత్తిమీర', kn: 'ಕೊತ್ತಂಬರಿ ಸೊಪ್ಪು', pa: 'ਹਰਾ ਧਨੀਆ' },
  veg_brinjal: { gu: 'દેશી રીંગણ', bn: 'টাটকা বেগুন', ta: 'கத்திரிக்காய்', te: 'వంకాయ', kn: 'ಬದನೆಕಾಯಿ', pa: 'ਦੇਸੀ ਬੈਂਗਣ' },
  veg_okra: { gu: 'કોમળ ભીંડા', bn: 'ঢেঁড়স', ta: 'வெண்டைக்காய்', te: 'బెండకాయ', kn: 'ಬೆಂಡೆಕಾಯಿ', pa: 'ਤਾਜ਼ੀ ਭਿੰਡੀ' },
  veg_cabbage: { gu: 'કોબીજ', bn: 'বাঁধাকপি', ta: 'முட்டைக்கோஸ்', te: 'క్యాబేజీ', kn: 'ಎಲೆಕೋಸು', pa: 'ਪੱਤਾ ਗੋਭੀ' },
  veg_cauliflower: { gu: 'ફ્લાવર (ફૂલગોબી)', bn: 'ফুলকপি', ta: 'காலிஃபிளவர்', te: 'కాలీఫ్లవర్', kn: 'ಹೂಕೋಸು', pa: 'ਫੁੱਲ ਗੋਭੀ' },
  veg_bottle_gourd: { gu: 'દૂધી (લૌકી)', bn: 'লাউ', ta: 'சுரைக்காய்', te: 'సొరకాయ', kn: 'ಸೋರೆಕಾಯಿ', pa: 'ਘੀਆ (ਲੌਕੀ)' },
  veg_bitter_gourd: { gu: 'દેશી કારેલા', bn: 'করলা / উচ্ছে', ta: 'பாகற்காய்', te: 'కాకరకాయ', kn: 'ಹಾಗಲಕಾಯಿ', pa: 'ਦੇਸੀ ਕਰੇਲਾ' },
  veg_ridge_gourd: { gu: 'તુરીયા', bn: 'ঝিঙে', ta: 'பீர்க்கங்காய்', te: 'బీరకాయ', kn: 'ಹೀರೆಕಾಯಿ', pa: 'ਤੋਰੀ' },
  veg_pumpkin: { gu: 'મીઠું કોળું', bn: 'মিষ্টি কুমড়ো', ta: 'பூசணிக்காய்', te: 'గుమ్మడికாய்', kn: 'ಕುಂಬಳಕಾಯಿ', pa: 'ਪੀਲਾ ਕੱਦੂ' },
  veg_cucumber: { gu: 'તાજી કાકડી', bn: 'শসা', ta: 'வெள்ளரிக்காய்', te: 'దోసకాయ', kn: 'ಸೌತೆಕಾಯಿ', pa: 'ਦੇਸੀ ਖੀਰਾ' },
  veg_capsicum: { gu: 'લીલું કેપ્સિકમ', bn: 'ক্যাপসিকাম', ta: 'குடைமிளகாய்', te: 'క్యాప్సికం', kn: 'ದೊಣ್ಣಮೆಣಸಿನಕಾಯಿ', pa: 'ਸ਼ਿਮਲਾ ਮਿਰਚ' },
  veg_green_chilli: { gu: 'તીખા લીલા મરચા', bn: 'কাঁচা লঙ্কা', ta: 'பச்சை மிளகாய்', te: 'పచ్చిమిర్చి', kn: 'ಹಸಿ ಮೆಣಸಿನಕಾಯಿ', pa: 'ਹਰੀ ਮਿਰਚ' },
  veg_green_peas: { gu: 'તાજા લીલા વટાણા', bn: 'মটরশুঁটি', ta: 'பச்சை பட்டாணி', te: 'పచ్చి బఠానీ', kn: 'ಹಸಿ ಬಟಾಣಿ', pa: 'ਹਰੇ ਮਟਰ' },
  veg_raw_jackfruit: { gu: 'કાચો ફણસ', bn: 'এঁচোড় (কাঁচা কাঁঠাল)', ta: 'இளம் பலாக்காய்', te: 'పచ్చి పనస', kn: 'ಎಳೆ ಹಲಸು', pa: 'ਕੱਚਾ ਕਟਹਲ' },
  veg_raw_papaya: { gu: 'કાચું પપૈયું', bn: 'কাঁচা পেঁপে', ta: 'பச்சை பப்பாளி', te: 'పచ్చి బొప్పాయి', kn: 'ಕಾಯಿ ಪಪ್ಪಾಯಿ', pa: 'ਕੱਚਾ ਪਪੀਤਾ' },
  leafy_methi: { gu: 'તાજી મેથી ભાજી', bn: 'মেথি শাক', ta: 'வெந்தயக் கீரை', te: 'మెంతికూర', kn: 'ಮೆಂತ್ಯ ಸೊಪ್ಪು', pa: 'ਤਾਜ਼ੀ ਮੇਥੀ' },
  root_ginger: { gu: 'તાજું આદુ', bn: 'টাটকা আদা', ta: 'இஞ்சி', te: 'అల్లం', kn: 'ಶುಂಠಿ', pa: 'ਤਾਜ਼ਾ ਅਦਰਕ' },
  root_garlic: { gu: 'દેશી લસણ', bn: 'রসুন', ta: 'பூண்டு', te: 'వెల్లుల్లి', kn: 'ಬೆಳ್ಳುಳ್ಳಿ', pa: 'ਦੇਸੀ ਲਸਣ' },
  citrus_lemon: { gu: 'રસદાર લીંબુ', bn: 'পাতি লেবু', ta: 'எலுமிச்சை', te: 'నిమ్మకాయ', kn: 'ನಿಂಬೆಹಣ್ಣು', pa: 'ਤਾਜ਼ਾ ਨਿੰਬੂ' },
  citrus_mosambi: { gu: 'મીઠી મોસંબી', bn: 'মুসুম্বি লেবু', ta: 'சாத்துக்குடி', te: 'బత్తాయి', kn: 'ಮೂಸಂಬಿ', pa: 'ਮਿੱਠੀ ਮੋਸੰਮੀ' },
  fruit_mango: { gu: 'રત્નાગીરી હાફૂસ કેરી', bn: 'আলফানসো আম', ta: 'மாம்பழம்', te: 'మామిడి పండు', kn: 'ಮಾವಿನ ಹಣ್ಣು', pa: 'ਤਾਜ਼ਾ ਅੰਬ' },
  fruit_banana: { gu: 'તાજા કેળા', bn: 'পাকা কলা', ta: 'வாழைப்பழம்', te: 'అరటిపండు', kn: 'ಬಾಳೆಹಣ್ಣು', pa: 'ਤਾਜ਼ੇ ਕੇਲੇ' },
  fruit_apple: { gu: 'લાલ સફરજન', bn: 'আপেল', ta: 'ஆப்பிள்', te: 'ఆపిల్', kn: 'ಸೇಬು', pa: 'ਤਾਜ਼ਾ ਸੇਬ' },
  fruit_pomegranate: { gu: 'લાલ દાડમ', bn: 'বেদানা / ডালিম', ta: 'மாதுளை', te: 'దానిమ్మ', kn: 'ದಾಳಿಂಬೆ', pa: 'ਲਾਲ ਅਨਾਰ' },
  fruit_watermelon: { gu: 'મીઠું તરબૂચ', bn: 'তরমুজ', ta: 'தர்பூசணி', te: 'పుచ్చకాయ', kn: 'ಕಲ್ಲಂಗಡಿ', pa: 'ਮਿੱਠਾ ਤਰਬੂਜ਼' },
  fruit_papaya: { gu: 'પાકું પપૈયું', bn: 'পাকা পেঁপে', ta: 'பப்பாளி', te: 'బొప్పాయి', kn: 'ಪಪ್ಪಾಯಿ', pa: 'ਪੱਕਾ ਪਪੀਤਾ' },
  fruit_guava: { gu: 'તાજા જામફળ', bn: 'পেয়ারা', ta: 'கொய்யா', te: 'జామకాయ', kn: 'ಸೀಬೆಹಣ್ಣು', pa: 'ਅਮਰੂਦ' },
  fruit_grapes_green: { gu: 'લીલી દ્રાક્ષ', bn: 'সবুজ আঙুর', ta: 'பச்சை திராட்சை', te: 'పచ్చి ద్రాక్ష', kn: 'ಹಸಿರು ದ್ರಾಕ್ಷಿ', pa: 'ਹਰੇ ਅੰਗੂਰ' },
  fruit_orange: { gu: 'નાગપુરી સંતરા', bn: 'কমলালেবু', ta: 'ஆரஞ்சு', te: 'నారింజ', kn: 'ಕಿತ್ತಳೆ', pa: 'ਨਾਗਪੁરી ਸੰਤਰਾ' },
  fruit_coconut: { gu: 'તાજું પાણીયારું નાળિયેર', bn: 'ডাব / নারকেল', ta: 'இளநீர்', te: 'కొబ్బరి బొండం', kn: 'ಎಳನೀರು', pa: 'ਤਾਜ਼ਾ ਨਾਰੀਅਲ' },
};

/**
 * Resolves a product name cleanly for all 10 languages.
 */
export function resolveLocalizedProduceName(
  nameObj: Partial<LocalizedString> | undefined,
  lang: AppLanguage,
  productId?: string
): string {
  if (!nameObj) return '';
  if (lang === 'hi') {
    const raw = nameObj.hi || '';
    return raw.replace(/[a-zA-Z()]/g, '').trim() || nameObj.en || '';
  }
  if (lang === 'mr') {
    const raw = nameObj.mr || nameObj.hi || '';
    return raw.replace(/[a-zA-Z()]/g, '').trim() || nameObj.en || '';
  }
  if (lang === 'hinglish') {
    return nameObj.hinglish || nameObj.en || '';
  }
  if (lang === 'en') {
    const raw = nameObj.en || '';
    return raw.replace(/\(.*?\)/g, '').trim() || raw;
  }
  // Regional Indian languages (gu, bn, ta, te, kn, pa)
  const customRegional = (nameObj as any)[lang];
  if (customRegional) return customRegional;
  if (productId && REGIONAL_PRODUCE_NAMES[productId]?.[lang as 'gu' | 'bn' | 'ta' | 'te' | 'kn' | 'pa']) {
    const cleanEn = (nameObj.en || '').replace(/\(.*?\)/g, '').trim();
    return `${REGIONAL_PRODUCE_NAMES[productId]![lang as 'gu' | 'bn' | 'ta' | 'te' | 'kn' | 'pa']} (${cleanEn})`;
  }
  return (nameObj.en || '').replace(/\(.*?\)/g, '').trim() || nameObj.en || '';
}

/**
 * Resolves a generic LocalizedString cleanly across all 10 languages without leaking Hindi into non-Hindi UI.
 */
export function resolveLocalizedField(
  fieldObj: Partial<LocalizedString> | undefined,
  lang: AppLanguage
): string {
  if (!fieldObj) return '';
  const direct = (fieldObj as any)[lang];
  if (direct && typeof direct === 'string' && direct.trim().length > 0) return direct;
  if (lang === 'mr') return fieldObj.mr || fieldObj.hi || fieldObj.en || '';
  if (lang === 'hi') return fieldObj.hi || fieldObj.en || '';
  if (lang === 'hinglish') return fieldObj.hinglish || fieldObj.en || '';
  return fieldObj.en || '';
}

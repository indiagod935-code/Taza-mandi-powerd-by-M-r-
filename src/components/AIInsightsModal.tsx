import React, { useState } from 'react';
import { ProduceItem, AppLanguage } from '../types';
import { useApp } from '../context/AppContext';
import { SafeProductImg } from './SafeProductImg';
import { pickLang, resolveLocalizedProduceName, resolveLocalizedField } from '../utils/i18nHelper';
import { findVerifiedRecipeVideos } from '../data/verifiedRecipeVideos';
import { getProduceHealthBenefits } from '../utils/produceHealthBenefits';
import {
  X,
  Sparkles,
  ShieldCheck,
  Thermometer,
  Calendar,
  CheckCircle2,
  ChefHat,
  Droplets,
  HeartPulse,
  Users,
  TrendingUp,
} from 'lucide-react';

interface AIInsightsModalProps {
  item: ProduceItem | null;
  onClose: () => void;
}

// Curated storage, culinary and grading database supporting ALL selected languages cleanly
function getCuratedInsights(item: ProduceItem, lang: AppLanguage) {
  const cat = item.category;
  const nameEn = item.name.en.toLowerCase();

  let shelfLife = pickLang(lang, {
    en: '3-5 days (room temperature) / up to 7 days (refrigerated)',
    hi: '3-5 दिन (कमरे के तापमान पर) / 7 दिन (फ्रिज में)',
    mr: '३-५ दिवस (सामान्य तापमानात) / ७ दिवस (फ्रिजमध्ये)',
    hinglish: '3-5 din (normal temp) / 7 din (fridge me)',
    gu: '3-5 દિવસ (રૂમ ટેમ્પરેચર) / 7 દિવસ (ફ્રિજમાં)',
    bn: '৩-৫ দিন (স্বাভাবিক তাপমাত্রায়) / ৭ দিন (ফ্রিজে)',
    ta: '3-5 நாட்கள் (அறை வெப்பநிலை) / 7 நாட்கள் (குளிர்பதனி)',
    te: '3-5 రోజులు (సాధారణ ఉష్ణోగ్రత) / 7 రోజులు (ఫ్రిజ్‌లో)',
    kn: '3-5 ದಿನಗಳು (ಸಾಮಾನ್ಯ ತಾಪಮಾನ) / 7 ದಿನಗಳು (ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ)',
    pa: '3-5 ਦਿਨ (ਕਮਰੇ ਦੇ ਤਾਪਮਾਨ ਤੇ) / 7 ਦਿਨ (ਫਰਿੱਜ ਵਿੱਚ)',
  });

  let storageMethod = pickLang(lang, {
    en: 'Keep in a breathable mesh basket away from direct sunlight and sealed plastic bags.',
    hi: 'हवादार जालीदार टोकरी में रखें। सीधी धूप और बंद प्लास्टिक थैली से दूर रखें।',
    mr: 'हवेशीर जाळीदार टोपलीत ठेवा. थेट सूर्यप्रकाश आणि बंद प्लास्टिक पिशवीपासून दूर ठेवा.',
    hinglish: 'Hawadar basket me rakhein. Seedhi dhoop aur sealed plastic bag se door rakhein.',
    gu: 'હવાની અવરજવર વાળી બાસ્કેટમાં રાખો. સીધા તડકા અને બંધ પ્લાસ્ટિક બેગથી દૂર રાખો.',
    bn: 'বাতাস চলাচল করে এমন ঝুড়িতে রাখুন। সরাসরি রোদ ও বন্ধ প্লাস্টিক ব্যাগ থেকে দূরে রাখুন।',
    ta: 'காற்றோட்டமான கூடையில் வைக்கவும். நேரடி வெயில் மற்றும் மூடிய பிளாஸ்டிக் பைகளைத் தவிர்க்கவும்.',
    te: 'గాలి తగిలే బుట్టలో ఉంచండి. నేరుగా ఎండ మరియు ప్లాస్టిక్ కవర్లకు దూరంగా ఉంచండి.',
    kn: 'ಗಾಳಿಯಾಡುವ ಬುಟ್ಟಿಯಲ್ಲಿ ಇಡಿ. ನೇರ ಸೂರ್ಯನ ಬೆಳಕು ಮತ್ತು ಮುಚ್ಚಿದ ಪ್ಲಾಸ್ಟಿಕ್ ಚೀಲದಿಂದ ದೂರವಿಡಿ.',
    pa: 'ਹਵਾਦਾਰ ਟੋਕਰੀ ਵਿੱਚ ਰੱਖੋ। ਸਿੱਧੀ ਧੁੱਪ ਅਤੇ ਬੰਦ ਪਲਾਸਟਿਕ ਦੇ ਲਿਫਾਫਿਆਂ ਤੋਂ ਦੂਰ ਰੱਖੋ।',
  });

  let washTip = pickLang(lang, {
    en: 'Wash thoroughly in mild saltwater right before use. Pat dry completely before chopping.',
    hi: 'इस्तेमाल से ठीक पहले हल्के गुनगुने नमक के पानी से धोएं। धोने के बाद सुखाकर ही काटें।',
    mr: 'वापरण्यापूर्वी कोमट मिठाच्या पाण्याने स्वच्छ धुवा आणि कोरडे करूनच कापा.',
    hinglish: 'Use karne se pehle namak ke paani se dho kar achhe se sukha lein.',
    gu: 'વાપરતા પહેલા નવશેકા મીઠાના પાણીથી ધોઈને કોરું કરી લો.',
    bn: 'ব্যবহারের ঠিক আগে হালকা লবণ-জলে ধুয়ে শুকিয়ে তারপর কাটুন।',
    ta: 'பயன்படுத்துவதற்கு முன் மிதமான உப்பு நீரில் கழுவி உலர்த்திய பின் நறுக்கவும்.',
    te: 'వాడే ముందు గోరువెచ్చని ఉప్పు నీటితో కడిగి ఆరబెట్టి కోయండి.',
    kn: 'ಬಳಸುವ ಮೊದಲು ಉಗುರು ಬೆಚ್ಚಗಿನ ಉಪ್ಪು ನೀರಿನಲ್ಲಿ ತೊಳೆದು ಒಣಗಿಸಿ ಕತ್ತರಿಸಿ.',
    pa: 'ਵਰਤਣ ਤੋਂ ਪਹਿਲਾਂ ਹਲਕੇ ਨਮਕ ਵਾਲੇ ਪਾਣੀ ਨਾਲ ਧੋ ਕੇ ਸੁਕਾ ਕੇ ਕੱਟੋ।',
  });

  let recipes = pickLangList(lang, {
    en: ['Homestyle Dry Sabzi', 'Dal Tadka Pairing', 'Gravy & Paratha Filling'],
    hi: ['मसालेदार सूखी सब्ज़ी', 'दाल तड़का के साथ कॉम्बो', 'ताज़ा पराठा या ग्रेवी'],
    mr: ['मसालेदार सुकी भाजी', 'वरण-भातासोबत चविष्ट तोंडीलावणे', 'ताजी ग्रेव्ही किंवा पराठा'],
    hinglish: ['Masaledar Dry Sabzi', 'Dal Tadka Combo', 'Fresh Paratha / Gravy'],
    gu: ['મસાલેદાર સૂકી ભાજી', 'દાળ-ભાત સાથે કોમ્બો', 'તાજું શાક અથવા પરાઠા'],
    bn: ['ঘরোয়া শুকনো সবজি', 'ডাল ও ভাতের সাথে', 'সুস্বাদু তরকারি বা পরোটা'],
    ta: ['மசாலா பொரியல்', 'பருப்பு குழம்பு இணை', 'கிரேவி & சப்பாத்தி'],
    te: ['మసాలా వేపుడు', 'పప్పు తడ్కాతో కాంబో', 'కూర & చపాతీ'],
    kn: ['ಮಸಾಲೆ ಪಲ್ಯ', 'ಬೇಳೆ ಸಾರು ಜೊತೆ ಕಾಂಬೋ', 'ಗ್ರೇವಿ ಮತ್ತು ಚಪಾತಿ'],
    pa: ['ਮਸਾਲੇਦਾਰ ਸੁੱਕੀ ਸਬਜ਼ੀ', 'ਦਾਲ ਤੜਕਾ ਕੌਂਬੋ', 'ਤਾਜ਼ਾ ਪਰਾਂਠਾ ਜਾਂ ਗ੍ਰੇਵੀ'],
  });

  let qualityCheck = pickLang(lang, {
    en: 'Glossy unblemished skin, vibrant natural color, firm texture — zero spots or bruising.',
    hi: 'चमकदार छिलका, प्राकृतिक रंग, और सख्त बनावट। बिना किसी दाग या कीड़े के छेद के।',
    mr: 'चमकदार साल, नैसर्गिक रंग आणि घट्ट पोत. कोणताही डाग किंवा कीड नाही.',
    hinglish: 'Chamkila skin, natural color aur firm texture. Bilkul daag-dhabba free.',
    gu: 'ચમકદાર છાલ, કુદરતી રંગ અને મજબૂત બનાવટ — ડાઘ વગરનો તાજો માલ.',
    bn: 'উজ্জ্বল খোসা, প্রাকৃতিক রঙ এবং টাটকা শক্ত গঠন — কোনো দাগ নেই।',
    ta: 'பளபளப்பான தோல், இயற்கை நிறம் மற்றும் உறுதியான தரம்.',
    te: 'మెరిసే తొక్క, సహజ రంగు మరియు మచ్చలు లేని తాజా నాణ్యత.',
    kn: 'ಹೊಳೆಯುವ ಸಿಪ್ಪೆ, ನೈಸರ್ಗಿಕ ಬಣ್ಣ ಮತ್ತು ಗಟ್ಟಿಯಾದ ತಾಜಾ ಗುಣಮಟ್ಟ.',
    pa: 'ਚਮਕਦਾਰ ਛਿਲਕਾ, ਕੁਦਰਤੀ ਰੰਗ ਅਤੇ ਬਿਨਾਂ ਦਾਗ ਤੋਂ ਸਖ਼ਤ ਗੁਣਵੱਤਾ।',
  });

  if (cat === 'leafy') {
    shelfLife = pickLang(lang, {
      en: '2-3 days (wrapped in a slightly damp cotton cloth inside fridge)',
      hi: '2-3 दिन (फ्रिज में हल्के गीले सूती कपड़े में लपेटकर)',
      mr: '२-३ दिवस (ओलसर सुती कापडात गुंडाळून फ्रिजमध्ये)',
      hinglish: '2-3 din (fridge me geeli cotton kapde me lapetkar)',
      gu: '2-3 દિવસ (ફ્રિજમાં હળવા ભીના સુતરાઉ કપડામાં વીંટાળીને)',
      bn: '২-৩ দিন (ফ্রিজে হালকা ভেজা সুতির কাপড়ে মুড়িয়ে)',
      ta: '2-3 நாட்கள் (குளிர்பதனியில் ஈரமான பருத்தி துணியில் சுற்றி)',
      te: '2-3 రోజులు (ఫ్రిజ్‌లో తడి కాటన్ వస్త్రంలో చుట్టి)',
      kn: '2-3 ದಿನಗಳು (ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ ಒದ್ದೆ ಬಟ್ಟೆಯಲ್ಲಿ ಸುತ್ತಿ)',
      pa: '2-3 ਦਿਨ (ਫਰਿੱਜ ਵਿੱਚ ਹਲਕੇ ਗਿੱਲੇ ਸੂਤੀ ਕੱਪੜੇ ਵਿੱਚ ਲਪੇਟ ਕੇ)',
    });
    storageMethod = pickLang(lang, {
      en: 'Trim thick stems, shake off moisture, and wrap in paper towel or muslin cloth inside the crisper drawer.',
      hi: 'डंठल काटकर पानी झटक लें। हल्के नम सूती कपड़े या पेपर बैग में लपेटकर फ्रिज के क्रिस्पर बॉक्स में रखें।',
      mr: 'देठ कापून पाणी झटकून घ्या. ओलसर कापडात किंवा पेपर बॅगमध्ये गुंडाळून फ्रिजमध्ये ठेवा.',
      hinglish: 'Stems kaatkar paper towel ya cotton kapde me fridge drawer me rakhein.',
      gu: 'ડાંખળા કાપી ભેજ લૂછી લો. પેપર ટુવાલ કે કોટન કપડામાં ફ્રિજમાં રાખો.',
      bn: 'ডাঁটা কেটে জল ঝরিয়ে কাগজের ব্যাগ বা সুতির কাপড়ে মুড়িয়ে ফ্রিজে রাখুন।',
      ta: 'தண்டுகளை வெட்டி, துணியில் சுற்றி குளிர்பதனி பெட்டியில் வைக்கவும்.',
      te: 'కాడలు కత్తిరించి, కాగితం లేదా బట్టలో చుట్టి ఫ్రిజ్ డ్రాయర్‌లో ఉంచండి.',
      kn: 'ದಂಟು ಕತ್ತರಿಸಿ ಪೇಪರ್ ಟವೆಲ್‌ನಲ್ಲಿ ಸುತ್ತಿ ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ ಇಡಿ.',
      pa: 'ਡੰਡੀਆਂ ਕੱਟ ਕੇ ਕੱਪੜੇ ਜਾਂ ਪੇਪਰ ਬੈਗ ਵਿੱਚ ਲਪੇਟ ਕੇ ਫਰਿੱਜ ਵਿੱਚ ਰੱਖੋ।',
    });
    washTip = pickLang(lang, {
      en: 'Soak & rinse twice in a deep bowl of fresh water before cooking so every trace of farm soil settles down.',
      hi: 'पकाने से पहले खुले पानी में 2 बार अच्छी तरह डुबोकर धोएं ताकि मिट्टी पूरी निकल जाए।',
      mr: 'शिजवण्यापूर्वी मोकळ्या पाण्यात २ वेळा चांगली धुवा जेणेकरून माती पूर्ण निघून जाईल.',
      hinglish: 'Banane se pehle khule paani me 2 baar dho lein taaki mitti nikal jaye.',
      gu: 'બનાવતા પહેલા ખુલ્લા પાણીમાં 2 વખત સારી રીતે ધોઈ લો જેથી માટી નીકળી જાય.',
      bn: 'রান্নার আগে খোলা জলে ২ বার ভালো করে ডুবিয়ে ধুয়ে নিন।',
      ta: 'சமைப்பதற்கு முன் சுத்தமான நீரில் 2 முறை அலசி மண் இல்லாமல் கழுவவும்.',
      te: 'వండే ముందు నీటిలో 2 సార్లు బాగా ముంచి శుభ్రంగా కడగండి.',
      kn: 'ಅಡುಗೆಗೆ ಮುನ್ನ ನೀರಿನಲ್ಲಿ 2 ಬಾರಿ ಚೆನ್ನಾಗಿ ತೊಳೆಯಿರಿ.',
      pa: 'ਪਕਾਉਣ ਤੋਂ ਪਹਿਲਾਂ ਖੁੱਲ੍ਹੇ ਪਾਣੀ ਵਿੱਚ 2 ਵਾਰ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋਵੋ।',
    });
    recipes = pickLangList(lang, {
      en: ['Dal Methi / Palak', 'Fresh Herb Paratha', 'Stir-Fry Aloo Saag'],
      hi: ['दाल मेथी / साग', 'ताज़ी भाजी पराठा', 'आलू/पनीर मेथी सूखी भाजी'],
      mr: ['डाळ पालक / मेथी', 'ताज्या भाजीचे पराठे', 'बटाटा-भाजी सुकी'],
      hinglish: ['Dal Palak / Saag', 'Fresh Bhaji Paratha', 'Aloo Saag Fry'],
      gu: ['દાળ પાલક / મેથી', 'તાજી ભાજીના થેપલા', 'બટાકા ભાજી શાક'],
      bn: ['ডাল শাক', 'টাটকা শাক পরোটা', 'আলু দিয়ে শাক ভাজা'],
      ta: ['பருப்பு கீரை கூட்டு', 'கீரை சப்பாத்தி', 'கீரை பொரியல்'],
      te: ['పప్పు కూర', 'ఆకుకూర పరాఠా', 'ఆలూ ఆకుకూర వేపుడు'],
      kn: ['ಬೇಳೆ ಸೊಪ್ಪಿನ ಸಾರು', 'ಸೊಪ್ಪಿನ ಪರೋಟ', 'ಆಲೂ ಸೊಪ್ಪಿನ ಪಲ್ಯ'],
      pa: ['ਦਾਲ ਸਾਗ', 'ਮੇਥੀ/ਪਾਲਕ ਪਰਾਂਠਾ', 'ਆਲੂ ਸਾਗ ਸਬਜ਼ੀ'],
    });
    qualityCheck = pickLang(lang, {
      en: 'Deep green crisp leaves, tender stems, zero yellowing — morning dew freshness.',
      hi: 'गहरे हरे बिना मुरझाए ताज़े पत्ते, कोमल तना, सुबह की ओस जैसी ताज़गी।',
      mr: 'गडद हिरवी ताजी पाने, कोवळी देठे — सकाळच्या दवासारखा ताजेपणा.',
      hinglish: 'Gehre hare crisp patte, tender stems, zero murjhana.',
      gu: 'ઘેરા લીલા તાજા પાંદડા, કોમળ ડાળીઓ અને સવાર જેવી તાજગી.',
      bn: 'গাঢ় সবুজ সতেজ পাতা ও কচি ডাঁটা — সকালের টাটকা ফসল।',
      ta: 'பசுமையான புதிய இலைகள் மற்றும் மிருதுவான தண்டுகள்.',
      te: 'తాజా ఆకుపచ్చని ఆకులు, మృదువైన కాడలు.',
      kn: 'ಗಾಢ ಹಸಿರು ತಾಜಾ ಎಲೆಗಳು ಮತ್ತು ಎಳೆ ದಂಟುಗಳು.',
      pa: 'ਗੂੜ੍ਹੇ ਹਰੇ ਤਾਜ਼ੇ ਪੱਤੇ ਅਤੇ ਨਰਮ ਡੰਡੀਆਂ।',
    });
  } else if (cat === 'roots') {
    shelfLife = pickLang(lang, {
      en: '7-14 days (in an open dry ventilated rack)',
      hi: '7-14 दिन (खुली सूखी जगह पर)',
      mr: '७-१४ दिवस (मोकळ्या कोरड्या जागी)',
      hinglish: '7-14 din (khuli sukhi jagah par)',
      gu: '7-14 દિવસ (ખુલ્લી સૂકી જગ્યાએ)',
      bn: '৭-১৪ দিন (খোলা শুকনো জায়গায়)',
      ta: '7-14 நாட்கள் (உலர்ந்த காற்றோட்டமான இடத்தில்)',
      te: '7-14 రోజులు (పొడి గాలి తగిలే చోట)',
      kn: '7-14 ದಿನಗಳು (ತೆರೆದ ಒಣ ಜಾಗದಲ್ಲಿ)',
      pa: '7-14 ਦਿਨ (ਖੁੱਲ੍ਹੀ ਸੁੱਕੀ ਥਾਂ ਤੇ)',
    });
    storageMethod = pickLang(lang, {
      en: 'Store in a cool, open ventilated basket at room temperature. Avoid refrigerating whole potatoes/onions/roots so natural sweetness stays intact.',
      hi: 'कमरे के सामान्य तापमान पर खुली हवादार टोकरी में रखें। फ्रिज में न रखें ताकि स्वाद प्राकृतिक रहे।',
      mr: 'खोलीच्या सामान्य तापमानावर मोकळ्या टोपलीत ठेवा. फ्रिजमध्ये ठेवू नका.',
      hinglish: 'Normal room temp par khuli basket me rakhein. Fridge me na rakhein.',
      gu: 'સામાન્ય તાપમાને ખુલ્લી હવાવાળી ટોપલીમાં રાખો. ફ્રિજમાં ન રાખશો.',
      bn: 'ঘরের স্বাভাবিক তাপমাত্রায় খোলা ঝুড়িতে রাখুন। ফ্রিজে রাখবেন না।',
      ta: 'அறை வெப்பநிலையில் காற்றோட்டமான கூடையில் வைக்கவும்.',
      te: 'సాధారణ గది ఉష్ణోగ్రతలో గాలి తగిలే బుట్టలో ఉంచండి.',
      kn: 'ಕೋಣೆಯ ಉಷ್ಣಾಂಶದಲ್ಲಿ ಗಾಳಿಯಾಡುವ ಬುಟ್ಟಿಯಲ್ಲಿ ಇಡಿ.',
      pa: 'ਕਮਰੇ ਦੇ ਤਾਪਮਾਨ ਤੇ ਹਵਾਦਾਰ ਟੋਕਰੀ ਵਿੱਚ ਰੱਖੋ। ਫਰਿੱਜ ਵਿੱਚ ਨਾ ਰੱਖੋ।',
    });
    washTip = pickLang(lang, {
      en: 'Scrub gently under running water right before peeling to clean off all farm soil.',
      hi: 'छीलने से पहले बहते पानी में ब्रश से मिट्टी साफ करें।',
      mr: 'सोलण्यापूर्वी वाहत्या पाण्यात ब्रशने माती स्वच्छ धुवून घ्या.',
      hinglish: 'Chheelne se pehle behte paani me achhe se saaf karein.',
      gu: 'છાલ ઉતારતા પહેલા વહેતા પાણીથી માટી બરાબર સાફ કરો.',
      bn: 'খোসা ছাড়ানোর আগে চলমান জলে ভালো করে ধুয়ে মাটি পরিষ্কার করুন।',
      ta: 'தோல் உரிப்பதற்கு முன் ஓடும் நீரில் மண் போகக் கழுவவும்.',
      te: 'తొక్క తీసే ముందు నీటిలో మట్టి లేకుండా కడగండి.',
      kn: 'ಸಿಪ್ಪೆ ತೆಗೆಯುವ ಮೊದಲು ಹರಿಯುವ ನೀರಿನಲ್ಲಿ ಮಣ್ಣು ತೊಳೆಯಿರಿ.',
      pa: 'ਛਿੱਲਣ ਤੋਂ ਪਹਿਲਾਂ ਵਗਦੇ ਪਾਣੀ ਵਿੱਚ ਮਿੱਟੀ ਸਾਫ਼ ਕਰੋ।',
    });
    recipes = pickLangList(lang, {
      en: ['Spiced Roast / Bharta', 'Everyday Sabzi & Curry', 'Traditional Halwa / Paratha'],
      hi: ['उबला चाट / भरता', 'तंदूरी रोस्ट / पराठा', 'पारंपरिक सब्ज़ी व करी'],
      mr: ['भाजलेले काप / भरीत', 'रोजची रस्सा भाजी', 'पराठा व कोशिंबीर'],
      hinglish: ['Spiced Roast', 'Daily Curry / Sabzi', 'Paratha & Chaat'],
      gu: ['રોસ્ટેડ ચાટ', 'દરરોજની રસાદાર શાક', 'પરાઠા કે હલવો'],
      bn: ['ভর্তা বা রোস্ট', 'দৈনন্দিন তরকারি', 'পরোটা বা হালুয়া'],
      ta: ['மசாலா வறுவல்', 'தினசரி குழம்பு', 'பராத்தா'],
      te: ['మసాలా వేపుడు', 'రోజువారీ కూర', 'పరాఠా / చాట్'],
      kn: ['ರೋಸ್ಟ್ / ಚಾಟ್', 'ದೈನಂದಿನ ಸಾಂಬಾರ್/ಪಲ್ಯ', 'ಪರೋಟ'],
      pa: ['ਤੰਦੂਰੀ ਰੋਸਟ', 'ਰੋਜ਼ਾਨਾ ਸਬਜ਼ੀ ਤੇ ਤੜਕਾ', 'ਪਰਾਂਠਾ / ਚਾਟ'],
    });
    qualityCheck = pickLang(lang, {
      en: 'Heavy, wrinkle-free firm tubers with zero sprouting or soft spots.',
      hi: 'भारी, बिना झुर्री वाला ठोस कंद, कोई अंकुर या गलन नहीं।',
      mr: 'वजनदार, घट्ट आणि सुरकुत्या नसलेला माल — कोंब किंवा कुजकेपणा नाही.',
      hinglish: 'Wajandar aur solid tubers, bilkul fresh without sprouting.',
      gu: 'વજનદાર, કરચલી વગરના મજબૂત કંદ — કોઈ સડો કે ફણગા નહીં.',
      bn: 'ভারী ও শক্ত মূল, কোনো অঙ্কুর বা পচন নেই।',
      ta: 'கனமான மற்றும் சுருக்கமில்லாத உறுதியான கிழங்குகள்.',
      te: 'బరువైన, ముడతలు లేని గట్టి దుంపలు.',
      kn: 'ತೂಕದ, ಸುಕ್ಕುಗಳಿಲ್ಲದ ಗಟ್ಟಿಯಾದ ತಾಜಾ ಗೆಡ್ಡೆಗಳು.',
      pa: 'ਭਾਰੇ ਅਤੇ ਬਿਨਾਂ ਝੁਰੜੀਆਂ ਵਾਲੇ ਸਖ਼ਤ ਕੰਦ।',
    });
  } else if (cat === 'citrus') {
    shelfLife = pickLang(lang, {
      en: '7-10 days (room temp) / 15 days (refrigerated)',
      hi: '7-10 दिन (कमरे के तापमान पर) / 15 दिन (फ्रिज में)',
      mr: '७-१० दिवस (सामान्य तापमानात) / १५ दिवस (फ्रिजमध्ये)',
      hinglish: '7-10 din (normal) / 15 din (fridge)',
      gu: '7-10 દિવસ (સામાન્ય) / 15 દિવસ (ફ્રિજમાં)',
      bn: '৭-১০ দিন (স্বাভাবিক) / ১৫ দিন (ফ্রিজে)',
      ta: '7-10 நாட்கள் (அறை) / 15 நாட்கள் (குளிர்பதனி)',
      te: '7-10 రోజులు (గది) / 15 రోజులు (ఫ్రిజ్)',
      kn: '7-10 ದಿನಗಳು (ಸಾಮಾನ್ಯ) / 15 ದಿನಗಳು (ಫ್ರಿಡ್ಜ್)',
      pa: '7-10 ਦਿਨ (ਕਮਰੇ ਤੇ) / 15 ਦਿਨ (ਫਰਿੱਜ ਵਿੱਚ)',
    });
    storageMethod = pickLang(lang, {
      en: 'Keep in an airy dry basket away from moisture.',
      hi: 'खुली हवादार जगह पर रखें। नमी से बचाएं।',
      mr: 'हवेशीर व कोरड्या जागेवर ठेवा.',
      hinglish: 'Khuli hawadar jagah par rakhein.',
      gu: 'ખુલ્લી હવાવાળી સૂકી જગ્યાએ રાખો.',
      bn: 'বাতাস চলাচল করে এমন শুকনো জায়গায় রাখুন।',
      ta: 'காற்றோட்டமான உலர்ந்த இடத்தில் வைக்கவும்.',
      te: 'గాలి తగిలే పొడి ప్రదేశంలో ఉంచండి.',
      kn: 'ಗಾಳಿಯಾಡುವ ಒಣ ಜಾಗದಲ್ಲಿ ಇಡಿ.',
      pa: 'ਹਵਾਦਾਰ ਸੁੱਕੀ ਥਾਂ ਤੇ ਰੱਖੋ।',
    });
    washTip = pickLang(lang, {
      en: 'Rinse outer peel cleanly under plain water before slicing or juicing.',
      hi: 'काटने से पहले बाहरी छिलके को सादे पानी से अच्छी तरह धो लें।',
      mr: 'कापण्यापूर्वी बाहेरील साल स्वच्छ पाण्याने धुवा.',
      hinglish: 'Kaatne se pehle chhilka saade paani se dho lein.',
      gu: 'કાપતા પહેલા બહારની છાલ પાણીથી સારી રીતે ધોઈ લો.',
      bn: 'কাটার আগে খোসা সাধারণ জলে ভালো করে ধুয়ে নিন।',
      ta: 'வெட்டுவதற்கு முன் வெளித் தோலை சுத்தமாகக் கழுவவும்.',
      te: 'కోసే ముందు పై తొక్కను శుభ్రంగా కడగండి.',
      kn: 'ಕತ್ತರಿಸುವ ಮೊದಲು ಸಿಪ್ಪೆಯನ್ನು ಶುದ್ಧ ನೀರಿನಿಂದ ತೊಳೆಯಿರಿ.',
      pa: 'ਕੱਟਣ ਤੋਂ ਪਹਿਲਾਂ ਬਾਹਰੀ ਛਿਲਕਾ ਚੰਗੀ ਤਰ੍ਹਾਂ ਧੋ ਲਵੋ।',
    });
    recipes = pickLangList(lang, {
      en: ['Fresh Morning Juice', 'Vitamin-C Fruit Chaat', 'Zesty Salad Dressing'],
      hi: ['ताज़ा सुबह का जूस', 'फ्रूट चाट', 'नींबू-पानी और सलाद ड्रेसिंग'],
      mr: ['ताज्या फळांचा रस', 'फ्रूट चाट', 'सरबत व सॅलड ड्रेसिंग'],
      hinglish: ['Fresh Morning Juice', 'Fruit Chaat', 'Lemonade & Salad'],
      gu: ['તાજું સવારનું જ્યુસ', 'ફ્રૂટ ચાટ', 'શરબત અને સલાડ'],
      bn: ['সকালের টাটকা জুস', 'ফ্রুট চাট', 'লেবুর শরবত ও সালাদ'],
      ta: ['காலை ஃபிரெஷ் ஜூஸ்', 'பழ சாலட்', 'லெமன் ஜூஸ்'],
      te: ['తాజా జ్యూస్', 'ఫ్రూట్ చాట్', 'నిమ్మరసం & సలాడ్'],
      kn: ['ತಾಜಾ ಹಣ್ಣಿನ ರಸ', 'ಫ್ರೂಟ್ ಚಾಟ್', 'ನಿಂಬೆ ಶರಬತ್ತು'],
      pa: ['ਤਾਜ਼ਾ ਜੂਸ', 'ਫਰੂਟ ਚਾਟ', 'ਸ਼ਿਕੰਜਵੀ ਤੇ ਸਲਾਦ'],
    });
    qualityCheck = pickLang(lang, {
      en: 'Heavy juicy fruits with thin glossy rind and natural citrus aroma.',
      hi: 'वजनदार रसदार फल, पतली चिकनी त्वचा, प्राकृतिक सुगंध।',
      mr: 'वजनदार व रसाळ फळे, पातळ साल आणि नैसर्गिक सुगंध.',
      hinglish: 'Heavy juicy fruit with thin shiny peel.',
      gu: 'વજનદાર રસદાર ફળ, પાતળી ચમકદાર છાલ અને કુદરતી સુગંધ.',
      bn: 'রসালো ভারী ফল ও পাতলা চকচকে খোসা।',
      ta: 'நல்ல சாறு நிறைந்த மெல்லிய தோல் மற்றும் இயற்கை மணம்.',
      te: 'రసభరితమైన, సన్నని మెరిసే తొక్క.',
      kn: 'ರಸಭರಿತ ಹಣ್ಣುಗಳು ಮತ್ತು ತೆಳುವಾದ ಸಿಪ್ಪೆ.',
      pa: 'ਰਸੀਲੇ ਤੇ ਭਾਰ ਵਾਲੇ ਫਲ ਅਤੇ ਪਤਲਾ ਛਿਲਕਾ।',
    });
  } else if (cat === 'fruits') {
    shelfLife = pickLang(lang, {
      en: '3-6 days (refrigerate once ripe)',
      hi: '3-6 दिन (पके होने पर फ्रिज में रखें)',
      mr: '३-६ दिवस (पिकल्यावर फ्रिजमध्ये ठेवा)',
      hinglish: '3-6 din (pakne par fridge me rakhein)',
      gu: '3-6 દિવસ (પાકી ગયા પછી ફ્રિજમાં રાખો)',
      bn: '৩-৬ দিন (পাকলে ফ্রিজে রাখুন)',
      ta: '3-6 நாட்கள் (பழுத்த பின் குளிர்பதனியில்)',
      te: '3-6 రోజులు (పండిన తర్వాత ఫ్రిజ్‌లో)',
      kn: '3-6 ದಿನಗಳು (ಹಣ್ಣಾದ ನಂತರ ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ)',
      pa: '3-6 ਦਿਨ (ਪੱਕਣ ਤੇ ਫਰਿੱਜ ਵਿੱਚ ਰੱਖੋ)',
    });
    storageMethod = pickLang(lang, {
      en: 'Ripen naturally at room temperature, then transfer to fridge to preserve sweetness.',
      hi: 'जब तक कच्चा हो कमरे के तापमान पर पकाएं, पकने के बाद फ्रिज में रखें।',
      mr: 'कच्चे असताना खोलीच्या तापमानात ठेवा, पिकल्यानंतर फ्रिजमध्ये ठेवा.',
      hinglish: 'Room temp par pakayein, pakne ke baad fridge me rakhein.',
      gu: 'રૂમ ટેમ્પરેચર પર પાકવા દો અને પછી ફ્રિજમાં રાખો.',
      bn: 'ঘরের তাপমাত্রায় পাকিয়ে তারপর ফ্রিজে রাখুন।',
      ta: 'அறை வெப்பநிலையில் பழுக்க வைத்து பின் குளிர்பதனியில் வைக்கவும்.',
      te: 'గది ఉష్ణోగ్రతలో పండిన తర్వాత ఫ్రిజ్‌లో ఉంచండి.',
      kn: 'ಸಾಮಾನ್ಯ ತಾಪಮಾನದಲ್ಲಿ ಹಣ್ಣಾಗಿಸಿ ನಂತರ ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ ಇಡಿ.',
      pa: 'ਪਹਿਲਾਂ ਕਮਰੇ ਵਿੱਚ ਪਕਾਓ ਅਤੇ ਪੱਕਣ ਤੋਂ ਬਾਅਦ ਫਰਿੱਜ ਵਿੱਚ ਰੱਖੋ।',
    });
    washTip = pickLang(lang, {
      en: 'Wash gently 15 minutes before eating so the fruit reaches natural aroma.',
      hi: 'खाने से 15 मिनट पहले धोकर सामान्य तापमान पर आने दें।',
      mr: 'खाण्यापूर्वी १५ मिनिटे आधी धुवा आणि सामान्य तापमानावर येऊ द्या.',
      hinglish: 'Khaane se 15 min pehle dho kar normal temp par rakhein.',
      gu: 'ખાવાના 15 મિનિટ પહેલા ધોઈને સામાન્ય તાપમાને આવવા દો.',
      bn: 'খাওয়ার ১৫ মিনিট আগে ধুয়ে ঘরের তাপমাত্রায় আনুন।',
      ta: 'சாப்பிடுவதற்கு 15 நிமிடங்களுக்கு முன் கழுவி எடுக்கவும்.',
      te: 'తినడానికి 15 నిమిషాల ముందు కడిగి ఉంచండి.',
      kn: 'ತಿನ್ನುವ 15 ನಿಮಿಷ ಮುಂಚೆ ತೊಳೆದು ಇಡಿ.',
      pa: 'ਖਾਣ ਤੋਂ 15 ਮਿੰਟ ਪਹਿਲਾਂ ਧੋ ਕੇ ਤਿਆਰ ਕਰੋ।',
    });
    recipes = pickLangList(lang, {
      en: ['Fresh Fruit Bowl', 'Milkshake & Smoothie', 'Natural Dessert / Chaat'],
      hi: ['ताज़ा फ्रूट बाउल', 'मिल्कशेक व स्मूदी', 'नेचुरल कस्टर्ड / चाट'],
      mr: ['ताज्या फळांची डिश', 'मिल्कशेक व स्मूदी', 'कस्टर्ड व चाट'],
      hinglish: ['Fresh Fruit Bowl', 'Milkshake & Smoothie', 'Natural Chaat'],
      gu: ['તાજો ફ્રૂટ બાઉલ', 'મિલ્કશેક અને સ્મૂધી', 'કસ્ટર્ડ / ચાટ'],
      bn: ['ফ্রুট সালাদ', 'মিল্কশেক ও স্মুদি', 'ন্যাচারাল কাস্টার্ড'],
      ta: ['பிரெஷ் ஃப்ரூட் பவுல்', 'மில்க்ஷேக் & ஸ்மூத்தி', 'கஸ்டர்ட்'],
      te: ['ఫ్రూట్ బౌల్', 'మిల్క్‌షేక్ & స్మూతీ', 'కస్టర్డ్'],
      kn: ['ಫ್ರೂಟ್ ಬೌಲ್', 'ಮಿಲ್ಕ್‌ಶೇಕ್ ಮತ್ತು ಸ್ಮೂತಿ', 'ಕಸ್ಟರ್ಡ್'],
      pa: ['ਤਾਜ਼ਾ ਫਰੂਟ ਬਾਊਲ', 'ਮਿਲਕਸ਼ੇਕ ਤੇ ਸਮੂਦੀ', 'ਫਰੂਟ ਚਾਟ'],
    });
    qualityCheck = pickLang(lang, {
      en: 'Natural sweet aroma, even skin color, 100% carbide-free ripening.',
      hi: 'मीठी प्राकृतिक खुशबू, एकसमान रंग, प्राकृतिक मिठास।',
      mr: 'नैसर्गिक गोड सुगंध, एकसारखा रंग, रसायनांशिवाय पिकलेले.',
      hinglish: 'Meethi natural khushbu, zero carbide ripening.',
      gu: 'કુદરતી મીઠી સુગંધ, સરખો રંગ અને કાર્બાઈડ મુક્ત પાક.',
      bn: 'মিষ্টি প্রাকৃতিক গন্ধ এবং কার্বাইড-মুক্ত প্রাকৃতিক পাকা ফল।',
      ta: 'இயற்கையான நறுமணம் மற்றும் இரசாயனமின்றி பழுத்தது.',
      te: 'సహజమైన తియ్యని వాసన, కార్బైడ్ రహితంగా పండినది.',
      kn: 'ನೈಸರ್ಗಿಕ ಸಿಹಿ ಪರಿಮಳ ಮತ್ತು ರಾಸಾಯನಿಕ ರಹಿತ.',
      pa: 'ਕੁਦਰਤੀ ਮਿੱਠੀ ਖੁਸ਼ਬੂ ਅਤੇ ਕਾਰਬਾਈਡ-ਮੁਕਤ ਪੱਕਿਆ ਫਲ।',
    });
  } else if (cat === 'herbs') {
    shelfLife = pickLang(lang, {
      en: '4-7 days',
      hi: '4-7 दिन',
      mr: '४-७ दिवस',
      hinglish: '4-7 din',
      gu: '4-7 દિવસ',
      bn: '৪-৭ দিন',
      ta: '4-7 நாட்கள்',
      te: '4-7 రోజులు',
      kn: '4-7 ದಿನಗಳು',
      pa: '4-7 ਦਿਨ',
    });
    storageMethod = pickLang(lang, {
      en: 'Stand stems in a small glass with a little water or wrap in a damp kitchen napkin in fridge.',
      hi: 'पुदीना/तुलसी की डंडियों को थोड़े पानी के गिलास में रखें या हल्के नम कपड़े में फ्रिज में रखें।',
      mr: 'काड्या थोड्या पाण्याच्या पेल्यात ठेवा किंवा ओलसर कापडात गुंडाळून फ्रिजमध्ये ठेवा.',
      hinglish: 'Stems ko thode paani me ya geeli napkin me fridge me rakhein.',
      gu: 'ડાળીઓને થોડા પાણીવાળા ગ્લાસમાં અથવા ભીના નેપકિનમાં ફ્રિજમાં રાખો.',
      bn: 'ডাঁটাগুলো সামান্য জলসহ গ্লাসে বা ভেজা ন্যাপকিনে ফ্রিজে রাখুন।',
      ta: 'தண்டுகளைச் சிறிது தண்ணீரில் வைக்கவும் அல்லது ஈரத் துணியில் சுற்றி வைக்கவும்.',
      te: 'కాడలను కొద్దిగా నీటిలో లేదా తడి వస్త్రంలో చుట్టి ఫ్రిజ్‌లో ఉంచండి.',
      kn: 'ದಂಟುಗಳನ್ನು ಸ್ವಲ್ಪ ನೀರಿನಲ್ಲಿ ಇಡಿ ಅಥವಾ ಒದ್ದೆ ಬಟ್ಟೆಯಲ್ಲಿ ಸುತ್ತಿ ಇಡಿ.',
      pa: 'ਡੰਡੀਆਂ ਨੂੰ ਥੋੜ੍ਹੇ ਪਾਣੀ ਵਾਲੇ ਗਿਲਾਸ ਵਿੱਚ ਜਾਂ ਗਿੱਲੇ ਕੱਪੜੇ ਵਿੱਚ ਫਰਿੱਜ ਵਿੱਚ ਰੱਖੋ।',
    });
    washTip = pickLang(lang, {
      en: 'Rinse gently in cool water just before garnishing or blending.',
      hi: 'उपयोग से तुरंत पहले हल्के ठंडे पानी में धोएं।',
      mr: 'वापरण्यापूर्वी थंड पाण्याने हलक्या हाताने धुवा.',
      hinglish: 'Use se pehle thande paani me gently dho lein.',
      gu: 'વાપરતા પહેલા ઠંડા પાણીથી હળવેથી ધોઈ લો.',
      bn: 'ব্যবহারের আগে ঠান্ডা জলে আলতো করে ধুয়ে নিন।',
      ta: 'பயன்படுத்தும் முன் குளிர்ந்த நீரில் மெதுவாக அலசவும்.',
      te: 'వాడే ముందు చల్లటి నీటితో సున్నితంగా కడగండి.',
      kn: 'ಬಳಸುವ ಮೊದಲು ತಣ್ಣೀರಿನಲ್ಲಿ ತೊಳೆಯಿರಿ.',
      pa: 'ਵਰਤਣ ਤੋਂ ਪਹਿਲਾਂ ਠੰਢੇ ਪਾਣੀ ਨਾਲ ਧੋਵੋ।',
    });
    recipes = pickLangList(lang, {
      en: ['Fresh Green Chutney', 'Herbal Masala Chai', 'Aromatic Tadka & Garnish'],
      hi: ['ताज़ा हरी चटनी', 'हर्बल डिटॉक्स चाय', 'गार्निशिंग व तड़का'],
      mr: ['ताजी हिरवी चटणी', 'हर्बल चहा', 'फोडणी व सजावट'],
      hinglish: ['Fresh Green Chutney', 'Herbal Chai', 'Tadka & Garnish'],
      gu: ['તાજી લીલી ચટણી', 'હર્બલ ચા', 'વઘાર અને ગાર્નિશિંગ'],
      bn: ['টাটকা সবুজ চাটনি', 'হার্বাল চা', 'ফোড়ন ও গার্নিশ'],
      ta: ['புதிய பச்சை சட்னி', 'மூலிகை தேநீர்', 'தாளிப்பு'],
      te: ['తాజా పచ్చి చట్నీ', 'హెర్బల్ టీ', 'తాలింపు'],
      kn: ['ತಾಜಾ ಹಸಿರು ಚಟ್ನಿ', 'ಹರ್ಬಲ್ ಚಹಾ', 'ಒಗ್ಗರಣೆ'],
      pa: ['ਤਾਜ਼ੀ ਹਰੀ ਚਟਨੀ', 'ਹਰਬਲ ਚਾਹ', 'ਤੜਕਾ ਤੇ ਗਾਰਨਿਸ਼'],
    });
    qualityCheck = pickLang(lang, {
      en: 'Intense fresh essential oil aroma, perked green leaves, zero black spots.',
      hi: 'तीव्र प्राकृतिक सुगंध, खिले हुए पत्ते, बिना काले दाग के।',
      mr: 'तीव्र नैसर्गिक सुगंध, टवटवीत पाने व काळे डाग नाहीत.',
      hinglish: 'Tez natural khushbu aur khile patte.',
      gu: 'તીવ્ર કુદરતી સુગંધ અને કાળા ડાઘ વગરના તાજા પાન.',
      bn: 'তীব্র প্রাকৃতিক সুগন্ধ ও তাজা সবুজ পাতা।',
      ta: 'நல்ல இயற்கை மணம் மற்றும் கரும்புள்ளிகள் இல்லாத இலைகள்.',
      te: 'తాజా సువాసన మరియు నల్ల మచ్చలు లేని ఆకులు.',
      kn: 'ತೀವ್ರ ನೈಸರ್ಗಿಕ ಸುವಾಸನೆ ಮತ್ತು ತಾಜಾ ಎಲೆಗಳು.',
      pa: 'ਤੇਜ਼ ਕੁਦਰਤੀ ਖੁਸ਼ਬੂ ਅਤੇ ਹਰੇ ਖਿੜੇ ਪੱਤੇ।',
    });
  } else if (cat === 'sprouts') {
    shelfLife = pickLang(lang, {
      en: '3-4 days (refrigerated in airtight container)',
      hi: '3-4 दिन (फ्रिज में एयरटाइट बॉक्स में)',
      mr: '३-४ दिवस (एअरटाईट डब्यात फ्रिजमध्ये)',
      hinglish: '3-4 din (fridge me airtight box me)',
      gu: '3-4 દિવસ (ફ્રિજમાં એરટાઈટ ડબ્બામાં)',
      bn: '৩-৪ দিন (ফ্রিজে এয়ারটাইট বক্সে)',
      ta: '3-4 நாட்கள் (காற்றுப் புகாத பெட்டியில் குளிர்பதனி)',
      te: '3-4 రోజులు (ఫ్రిజ్‌లో ఎయిర్‌టైట్ డబ్బాలో)',
      kn: '3-4 ದಿನಗಳು (ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ ಗಾಳಿಯಾಡದ ಡಬ್ಬದಲ್ಲಿ)',
      pa: '3-4 ਦਿਨ (ਫਰਿੱਜ ਵਿੱਚ ਏਅਰਟਾਈਟ ਡੱਬੇ ਵਿੱਚ)',
    });
    storageMethod = pickLang(lang, {
      en: 'Line an airtight box with a paper towel to absorb excess moisture and refrigerate.',
      hi: 'एयरटाइट डिब्बे में नीचे पेपर टॉवल रखकर फ्रिज में रखें ताकि अत्यधिक नमी न बने।',
      mr: 'एअरटाईट डब्यात खाली टिश्यू पेपर ठेवून फ्रिजमध्ये ठेवा.',
      hinglish: 'Airtight box me tissue rakhkar fridge me store karein.',
      gu: 'એરટાઈટ ડબ્બામાં પેપર ટુવાલ મૂકીને ફ્રિજમાં રાખો.',
      bn: 'এয়ারটাইট বক্সে পেপার টাওয়েল দিয়ে ফ্রিজে রাখুন।',
      ta: 'காகிதத் துண்டுடன் காற்றுப் புகாத பெட்டியில் குளிர்பதனியில் வைக்கவும்.',
      te: 'టిష్యూ పేపర్ వేసి ఎయిర్‌టైట్ బాక్స్‌లో ఫ్రిజ్‌లో ఉంచండి.',
      kn: 'ಪೇಪರ್ ಟವೆಲ್ ಹಾಕಿದ ಡಬ್ಬದಲ್ಲಿ ಫ್ರಿಡ್ಜ್‌ನಲ್ಲಿ ಇಡಿ.',
      pa: 'ਏਅਰਟਾਈਟ ਡੱਬੇ ਵਿੱਚ ਪੇਪਰ ਟਾਵਲ ਰੱਖ ਕੇ ਫਰਿੱਜ ਵਿੱਚ ਰੱਖੋ।',
    });
    washTip = pickLang(lang, {
      en: 'Rinse once in warm water or steam lightly for 2 minutes before eating raw.',
      hi: 'कच्चा खाने से पहले एक बार हल्के गुनगुने पानी में धो लें या 2 मिनट भाप दें।',
      mr: 'खाण्यापूर्वी कोमट पाण्याने धुवा किंवा २ मिनिटे वाफवून घ्या.',
      hinglish: 'Kachha khaane se pehle 2 min steam ya garam paani se dho lein.',
      gu: 'કાચા ખાતા પહેલા 2 મિનિટ વરાળ આપો કે હૂંફાળા પાણીથી ધોવો.',
      bn: 'কাঁচা খাওয়ার আগে ২ মিনিট ভাপিয়ে বা হালকা গরম জলে ধুয়ে নিন।',
      ta: 'பச்சையாக சாப்பிடும் முன் வெதுவெதுப்பான நீரில் கழுவவும் அல்லது 2 நிமிடம் ஆவியில் வேகவைக்கவும்.',
      te: 'పచ్చిగా తినే ముందు గోరువెచ్చని నీటిలో కడగండి లేదా 2 నిమిషాలు ఆవిరిపై ఉడికించండి.',
      kn: 'ಹಸಿಯಾಗಿ ತಿನ್ನುವ ಮೊದಲು 2 ನಿಮಿಷ ಹಬೆಯಲ್ಲಿ ಬೇಯಿಸಿ ಅಥವಾ ತೊಳೆಯಿರಿ.',
      pa: 'ਕੱਚਾ ਖਾਣ ਤੋਂ ਪਹਿਲਾਂ 2 ਮਿੰਟ ਭਾਫ਼ ਦਿਓ ਜਾਂ ਕੋਸੇ ਪਾਣੀ ਨਾਲ ਧੋਵੋ।',
    });
    recipes = pickLangList(lang, {
      en: ['High-Protein Sprout Salad', 'Authentic Maharashtrian Usal', 'Spicy Sprout Chaat'],
      hi: ['प्रोटीन स्प्राउट्स सलाद', 'महाराष्ट्रियन उसळ (Usal)', 'स्प्राउट्स चाट'],
      mr: ['प्रोटीन उसळ (Usal)', 'मोड आलेले सॅलड', 'चटपटीत स्प्राउट्स चाट'],
      hinglish: ['Protein Sprout Salad', 'Spicy Usal', 'Sprouts Chaat'],
      gu: ['પ્રોટીન ફણગાવેલા સલાડ', 'મહારાષ્ટ્રીયન ઉસળ', 'સ્પ્રાઉટ્સ ચાટ'],
      bn: ['প্রোটিন স্প্রাউট সালাদ', 'মশলা স্প্রাউট চাট', 'উসাল কারি'],
      ta: ['புரத முளைகட்டிய சாலட்', 'உசல் கிரேவி', 'ஸ்ப்ரவுட்ஸ் சாட்'],
      te: ['ప్రోటీన్ మొలకల సలాడ్', 'మొలకల కూర', 'చాట్'],
      kn: ['ಪ್ರೋಟೀನ್ ಮೊಳಕೆ ಸಲಾಡ್', 'ಮೊಳಕೆ ಉಸಳಿ', 'ಚಾಟ್'],
      pa: ['ਪ੍ਰੋਟੀਨ ਸਪਰਾਊਟ ਸਲਾਦ', 'ਮਸਾਲਾ ਉਸਲ', 'ਚਾਟ'],
    });
    qualityCheck = pickLang(lang, {
      en: 'Crisp white tails, zero sour smell, non-sticky fresh batch.',
      hi: 'सफेद ताज़ी जड़ें, बिना किसी खट्टी गंध या चिपचिपाहट के।',
      mr: 'पांढरे शुभ्र कोंब, ताजा वास, अजिबात चिकट नाही.',
      hinglish: 'Safed crisp sprouts, zero khatti smell.',
      gu: 'સફેદ તાજા ફણગા, ખાટી ગંધ વગરનો માલ.',
      bn: 'সাদা তাজা অঙ্কুর, কোনো টক গন্ধ বা আঠালো ভাব নেই।',
      ta: 'வெள்ளை முளைகள், புளிப்பு வாசனை இல்லாதது.',
      te: 'తెల్లని తాజా మొలకలు, పులుపు వాసన లేనిది.',
      kn: 'ಬಿಳಿ ತಾಜಾ ಮೊಳಕೆಗಳು, ಹುಳಿ ವಾಸನೆ ಇಲ್ಲ.',
      pa: 'ਚਿੱਟੇ ਤਾਜ਼ੇ ਪੁੰਗਰੇ ਦਾਣੇ, ਬਿਨਾਂ ਖੱਟੀ ਬੋ ਤੋਂ।',
    });
  }

  // Specific vegetable recipe highlights
  if (nameEn.includes('okra') || nameEn.includes('bhindi')) {
    recipes = pickLangList(lang, {
      en: ['Crispy Bhindi Fry', 'Dahi Bhindi Gravy', 'Amchur Masala Bhindi'],
      hi: ['कुरकुरी भिंडी फ्राई', 'दही भिंडी ग्रेवी', 'अमचूर वाली मसाला भिंडी'],
      mr: ['कुरकुरीत भेंडी फ्राय', 'दही भेंडी', 'मसाला भेंडी'],
    });
    storageMethod = pickLang(lang, {
      en: 'Wipe dry with a clean cloth before storing — moisture makes okra slimy.',
      hi: 'धोने के बाद कपड़े से पोंछकर पूरी तरह सूखा लें, नमी से भिंडी में चिपचिपाहट आती है।',
      mr: 'धुतल्यानंतर कापडाने पूर्ण कोरडी करा, ओलसरपणामुळे भेंडी चिकट होते.',
    });
  } else if (nameEn.includes('mango')) {
    recipes = pickLangList(lang, {
      en: ['Fresh Aamras', 'Mango Lassi', 'Raw Mango Dal / Panna'],
      hi: ['आम का रस (Aamras)', 'मैंगो लस्सी', 'कच्ची कैरी की दाल / पना'],
      mr: ['ताजा आमरस', 'मँगो लस्सी', 'कैरीचे पन्हे / डाळ'],
    });
    storageMethod = pickLang(lang, {
      en: 'Ripen in hay or paper carton at room temp; refrigerate only after full ripening.',
      hi: 'घास या कार्टन में कमरे के तापमान पर रखें, पकने के बाद ही फ्रिज में ठंडा करें।',
      mr: 'गवतात किंवा बॉक्समध्ये पिकू द्या, पिकल्यावरच फ्रिजमध्ये ठेवा.',
    });
  } else if (nameEn.includes('cauliflower') || nameEn.includes('cabbage')) {
    recipes = pickLangList(lang, {
      en: ['Gobhi Matar Masala', 'Aloo Gobhi Paratha', 'Crispy Veg Manchurian'],
      hi: ['गोभी मटर मसाला', 'गोभी के पराठे', 'कोबीची भाजी / मंचूरियन'],
      mr: ['फ्लॉवर मटार रस्सा', 'फ्लॉवर पराठा', 'कोबीची भाजी / मंचुरियन'],
    });
  } else if (nameEn.includes('bottle gourd') || nameEn.includes('lauki')) {
    recipes = pickLangList(lang, {
      en: ['Lauki Halwa', 'Chana Dal Lauki', 'Fresh Detox Soup & Juice'],
      hi: ['लौकी का हलवा', 'दाल लौकी (दुधी दाल)', 'ताज़ा लौकी सूप व जूस'],
      mr: ['दुधीचा हलवा', 'चणाडाळ दुधी भोपळा', 'ताजे दुधी सूप'],
    });
  }

  return { shelfLife, storageMethod, washTip, recipes, qualityCheck };
}

function pickLangList(lang: AppLanguage, map: Partial<Record<AppLanguage, string[]>> & { en: string[] }): string[] {
  const direct = map[lang];
  if (direct && direct.length > 0) return direct;
  if (lang === 'mr') return map.mr || map.hi || map.en;
  if (lang === 'hi') return map.hi || map.en;
  if (lang === 'hinglish') return map.hinglish || map.en;
  return map.en;
}

export const AIInsightsModal: React.FC<AIInsightsModalProps> = ({ item, onClose }) => {
  const { lang, getCommunityDemandKg, featureFlags } = useApp();
  const [activeTab, setActiveTab] = useState<'benefits' | 'storage' | 'recipes' | 'pricing' | 'grading' | 'ai'>('benefits');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCustomAdvice, setAiCustomAdvice] = useState<string | null>(null);

  if (!item) return null;

  const displayName = resolveLocalizedProduceName(item.name, lang, item.id);
  const secondaryName = lang === 'en' ? item.name.hi : item.name.en;
  const guaranteeText = resolveLocalizedField(item.freshnessGuarantee, lang);
  const curated = getCuratedInsights(item, lang);
  const health = getProduceHealthBenefits(item, lang);
  const effectivePrice =
    item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.pricePerKg
      ? item.discountPrice
      : item.pricePerKg;
  const pricingUnit = item.pricingUnit || 'kg';
  const unitLabel =
    pricingUnit === 'gaddi'
      ? pickLang(lang, { en: 'Gaddi', hi: 'गड्डी', mr: 'जुडी' })
      : pricingUnit === 'piece'
      ? pickLang(lang, { en: 'Pc', hi: 'पीस', mr: 'नग' })
      : 'kg';
  const currentDemandKg = getCommunityDemandKg(item.id);
  const sackProgress = Math.min(100, Math.round((currentDemandKg / item.mandiTierBagKg) * 100));

  const handleAskAI = async () => {
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/freshness-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [`${displayName} (${item.name.en})`],
          promptType: 'storage',
          lang,
        }),
      });
      const data = await response.json();
      setAiCustomAdvice(
        data.text ||
          data.fallback ||
          pickLang(lang, {
            en: 'Verified Fresh APMC Grade-A Produce Lot.',
            hi: 'ताज़ा मंडी ग्रेड सत्यापित है।',
            mr: 'ताज्या मंडी दर्जाची खात्री.',
          })
      );
    } catch {
      setAiCustomAdvice(
        pickLang(lang, {
          en: `Store ${displayName} in a cool, airy basket. Sourced straight from the 4:00 AM APMC Vashi auction directly to your society, keeping it fresh up to 2 days longer than local retail stalls.`,
          hi: `${displayName} को हमेशा खुली सूखी जगह पर रखें। वाशी APMC की सुबह 4 AM नीलामी से सीधे आपकी सोसायटी में पहुंचाया जाता है, इसलिए यह सामान्य बाज़ार से 2 दिन अधिक ताज़ा रहता है।`,
          mr: `${displayName} नेहमी हवेशीर कोरड्या जागी ठेवा. पहाटे ४ वाजताच्या वाशी एपीएमसी लिलावातून थेट सोसायटीत येतो, त्यामुळे नेहमीच्या बाजारापेक्षा २ दिवस अधिक ताजा राहतो.`,
          hinglish: `${displayName} ko khuli hawadar jagah rakhein. Subah 4 AM APMC Vashi se seedhe aane ke kaaran 2 din zyada fresh rehta hai.`,
          gu: `${displayName} ને હંમેશા ખુલ્લી સૂકી જગ્યાએ રાખો. વાશી APMC ના સવારે 4 AM ના ઓક્શનમાંથી સીધું આવતું હોવાથી 2 દિવસ વધુ તાજું રહે છે.`,
          bn: `${displayName} খোলা শুকনো জায়গায় রাখুন। ভোর ৪টায় APMC মান্ডি থেকে সরাসরি আসে বলে ২ দিন বেশি সতেজ থাকে।`,
          ta: `${displayName} காற்றோட்டமான இடத்தில் வைக்கவும். அதிகாலை 4 மணி மண்டியிலிருந்து நேரடியாக வருவதால் கூடுதல் நாட்கள் புதியதாக இருக்கும்.`,
          te: `${displayName} గాలి తగిలే పొడి ప్రదేశంలో ఉంచండి. ఉదయం 4 గంటల మండి నుండి నేరుగా రావడం వల్ల 2 రోజులు అదనంగా తాజాగా ఉంటుంది.`,
          kn: `${displayName} ಗಾಳಿಯಾಡುವ ಒಣ ಜಾಗದಲ್ಲಿ ಇಡಿ. ಬೆಳಿಗ್ಗೆ 4 ಗಂಟೆಯ ಮಂಡಿಯಿಂದ ನೇರವಾಗಿ ಬರುವುದರಿಂದ ಹೆಚ್ಚು ದಿನ ತಾಜಾ ಇರುತ್ತದೆ.`,
          pa: `${displayName} ਨੂੰ ਹਮੇਸ਼ਾ ਹਵਾਦਾਰ ਸੁੱਕੀ ਥਾਂ ਤੇ ਰੱਖੋ। ਸਵੇਰੇ 4 ਵਜੇ ਮੰਡੀ ਤੋਂ ਸਿੱਧਾ ਆਉਣ ਕਰਕੇ 2 ਦਿਨ ਵੱਧ ਤਾਜ਼ਾ ਰਹਿੰਦਾ ਹੈ।`,
        })
      );
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <SafeProductImg
              product={item}
              alt={item.name.en}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  {pickLang(lang, {
                    en: 'Freshness & Usage Guide',
                    hi: 'ताज़गी गाइड व उपयोग',
                    mr: 'ताजेपणा आणि वापर माहिती',
                    hinglish: 'Freshness & Usage Guide',
                    gu: 'તાજગી અને ઉપયોગ માર્ગદર્શિકા',
                    bn: 'সতেজতা ও ব্যবহারের গাইড',
                    ta: 'புத்துணர்ச்சி & பயன்பாட்டு வழிகாட்டி',
                    te: 'తాజాదనం & వినియోగ గైడ్',
                    kn: 'ತಾಜಾತನ ಮತ್ತು ಬಳಕೆಯ ಮಾರ್ಗದರ್ಶಿ',
                    pa: 'ਤਾਜ਼ਗੀ ਅਤੇ ਵਰਤੋਂ ਗਾਈਡ',
                  })}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                  Grade-A
                </span>
              </div>
              <h3 className="font-display font-black text-lg text-slate-900 dark:text-slate-100">
                {displayName}{' '}
                {secondaryName && secondaryName !== displayName && (
                  <span className="text-xs font-normal text-slate-400">({secondaryName})</span>
                )}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {guaranteeText}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-1.5 my-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('benefits')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'benefits'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Health Benefits',
                hi: 'सेहत फ़ायदे',
                mr: 'आरोग्य फायदे',
                hinglish: 'Health Benefits',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Rates & Demand',
                hi: 'भाव व डिमांड',
                mr: 'दर व मागणी',
                hinglish: 'Rates & Pool',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'storage'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Storage',
                hi: 'स्टोरेज',
                mr: 'साठवणूक',
                hinglish: 'Storage',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recipes')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'recipes'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Recipes',
                hi: 'रेसिपी',
                mr: 'पाककृती',
                hinglish: 'Recipes',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grading')}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'grading'
                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Grade Check',
                hi: 'मंडी ग्रेड',
                mr: 'प्रतवारी',
                hinglish: 'Grade Check',
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ai');
              if (!aiCustomAdvice) handleAskAI();
            }}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'AI Advice',
                hi: 'AI सलाह',
                mr: 'AI सल्ला',
                hinglish: 'AI Advice',
              })}
            </span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3.5 text-xs text-slate-700 dark:text-slate-300 pr-1">
          {/* TAB 0: Health Benefits */}
          {activeTab === 'benefits' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  {health.nutrients}
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  {health.headline}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-2">
                {health.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-slate-800 dark:text-slate-200">{b}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                <span className="font-bold">
                  {pickLang(lang, { en: 'Best For:', hi: 'किसके लिए श्रेष्ठ:', mr: 'कशासाठी उत्तम:' })}{' '}
                </span>
                <span>{health.bestFor}</span>
              </div>
            </div>
          )}

          {/* TAB: Wholesale Tiers & Live Community Demand */}
          {activeTab === 'pricing' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-2">
                  {pickLang(lang, {
                    en: `Direct APMC Rate Slabs (${unitLabel})`,
                    hi: `सीधा मंडी थोक भाव स्लैब (${unitLabel} अनुसार)`,
                    mr: `थेट मंडी दर स्लॅब (${unitLabel})`,
                  })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
                  {(pricingUnit === 'gaddi' || pricingUnit === 'piece'
                    ? [1, 2, 3, 5]
                    : [0.5, 1, 2, 5]
                  ).map((qty) => (
                    <div
                      key={qty}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/70 dark:border-emerald-800 text-center"
                    >
                      <div className="text-[11px] text-slate-500">
                        {qty} {unitLabel}
                      </div>
                      <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                        ₹{Math.round(effectivePrice * qty)}
                      </div>
                    </div>
                  ))}
                </div>
                {featureFlags.rateSavingsSuggestions && (
                  <div className="mt-2.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {pickLang(lang, {
                      en: `Local retail market rate: ₹${item.localMarketPricePerKg}/${unitLabel} — You save ₹${Math.max(0, item.localMarketPricePerKg - effectivePrice)}/${unitLabel}`,
                      hi: `लोकल बाज़ार भाव: ₹${item.localMarketPricePerKg}/${unitLabel} — आपकी सीधी बचत: ₹${Math.max(0, item.localMarketPricePerKg - effectivePrice)}/${unitLabel}`,
                      mr: `स्थानिक बाजार भाव: ₹${item.localMarketPricePerKg}/${unitLabel} — तुमची थेट बचत: ₹${Math.max(0, item.localMarketPricePerKg - effectivePrice)}/${unitLabel}`,
                    })}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>
                      {pickLang(lang, {
                        en: 'Society Collective Pool Demand',
                        hi: 'सोसायटी सामूहिक मंडी डिमांड',
                        mr: 'सोसायटी एकत्रित मागणी',
                      })}
                    </span>
                  </span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 text-sm">
                    {currentDemandKg} / {item.mandiTierBagKg} {unitLabel}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${sackProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Pooling society orders unlocks wholesale auction rates without extra fees.',
                      hi: 'सोसायटी के साथ मिलकर ऑर्डर करने से सुबह 4 AM नीलामी का थोक भाव मिलता है।',
                      mr: 'सोसायटीच्या एकत्रित ऑर्डरमुळे घाऊक दराचा फायदा मिळतो.',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Storage Tips */}
          {activeTab === 'storage' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-300 text-sm mb-1">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Freshness Shelf-Life:',
                      hi: 'ताज़गी की शेल्फ-लाइफ:',
                      mr: 'ताजेपणा टिकण्याची मुदत:',
                      hinglish: 'Freshness Shelf-Life:',
                      gu: 'તાજગી સમયમર્યાદા:',
                      bn: 'সতেজ থাকার সময়কাল:',
                      ta: 'புத்துணர்ச்சி ஆயுள்:',
                      te: 'తాజాగా ఉండే కాలం:',
                      kn: 'ತಾಜಾತನದ ಅವಧಿ:',
                      pa: 'ਤਾਜ਼ਗੀ ਦੀ ਮਿਆਦ:',
                    })}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {curated.shelfLife}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Best Home Storage Instruction:',
                      hi: 'घर पर रखने का सही तरीका:',
                      mr: 'घरी साठवण्याची योग्य पद्धत:',
                      hinglish: 'Home Storage Instruction:',
                      gu: 'ઘરે સાચવવાની સાચી રીત:',
                      bn: 'বাড়িতে সংরক্ষণের সঠিক উপায়:',
                      ta: 'வீட்டில் சேமிக்கும் முறை:',
                      te: 'ఇంట్లో నిల్వ చేసే విధానం:',
                      kn: 'ಮನೆಯಲ್ಲಿ ಸಂಗ್ರಹಿಸುವ ವಿಧಾನ:',
                      pa: 'ਘਰ ਵਿੱਚ ਸਟੋਰ ਕਰਨ ਦਾ ਸਹੀ ਤਰੀਕਾ:',
                    })}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {curated.storageMethod}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-300">
                  <Droplets className="w-4 h-4 text-sky-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Washing & Cleaning Tip:',
                      hi: 'धोने व साफ करने का तरीका:',
                      mr: 'धुण्याची व स्वच्छतेची टीप:',
                      hinglish: 'Washing & Cleaning Tip:',
                      gu: 'ધોવા અને સાફ કરવાની રીત:',
                      bn: 'ধোয়া ও পরিষ্কারের টিপস:',
                      ta: 'கழுவும் & சுத்தம் செய்யும் முறை:',
                      te: 'కడిగే & శుభ్రం చేసే చిట్కా:',
                      kn: 'ತೊಳೆಯುವ ಮತ್ತು ಸ್ವಚ್ಛಗೊಳಿಸುವ ಸಲಹೆ:',
                      pa: 'ਧੋਣ ਅਤੇ ਸਾਫ਼ ਕਰਨ ਦਾ ਤਰੀਕਾ:',
                    })}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {curated.washTip}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Recipes */}
          {activeTab === 'recipes' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">
                  <ChefHat className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'Popular Indian Dishes:',
                      hi: 'लोकप्रिय भारतीय व्यंजन:',
                      mr: 'लोकप्रिय भारतीय पदार्थ:',
                      hinglish: 'Popular Indian Dishes:',
                      gu: 'લોકપ્રિય ભારતીય વાનગીઓ:',
                      bn: 'জনপ্রিয় ভারতীয় পদ:',
                      ta: 'பிரபலமான இந்திய உணவுகள்:',
                      te: 'ప్రసిద్ధ భారతీయ వంటకాలు:',
                      kn: 'ಜನಪ್ರಿಯ ಭಾರತೀಯ ಅಡುಗೆಗಳು:',
                      pa: 'ਪ੍ਰਸਿੱਧ ਭਾਰਤੀ ਪਕਵਾਨ:',
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {curated.recipes.map((r, i) => {
                    const cleanItemEn = item.name.en.replace(/\(.*?\)/g, '').trim();
                    const matchedVideo = findVerifiedRecipeVideos(`${r} ${cleanItemEn}`, 1)[0];
                    const ytUrl = matchedVideo
                      ? matchedVideo.url
                      : `https://www.youtube.com/results?search_query=${encodeURIComponent(
                          `${r} ${cleanItemEn} best Indian recipe`
                        )}`;
                    return (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{r}</span>
                          </div>
                          {featureFlags.youtubeRecipeVideos && matchedVideo && (
                            <div className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1 truncate">
                              👨‍🍳 {matchedVideo.channel}
                            </div>
                          )}
                        </div>
                        {featureFlags.youtubeRecipeVideos && (
                          <a
                            href={ytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black transition-colors"
                          >
                            <span>▶</span>
                            <span>
                              {matchedVideo
                                ? pickLang(lang, {
                                    en: 'Watch Best Video',
                                    hi: 'बेस्ट वीडियो देखें',
                                    mr: 'बेस्ट व्हिडिओ पहा',
                                    hinglish: 'Watch Best Video',
                                    gu: 'બેસ્ટ વિડિઓ જુઓ',
                                    bn: 'সেরা ভিডিও দেখুন',
                                    ta: 'சிறந்த வீடியோ பார்',
                                    te: 'బెస్ట్ వీడియో చూడండి',
                                    kn: 'ಬೆಸ್ಟ್ ವೀಡಿಯೊ ನೋಡಿ',
                                    pa: 'ਬੈਸਟ ਵੀਡੀਓ ਦੇਖੋ',
                                  })
                                : pickLang(lang, {
                                    en: 'YouTube Recipe',
                                    hi: 'YouTube वीडियो',
                                    mr: 'YouTube व्हिडिओ',
                                    hinglish: 'YouTube Video',
                                    gu: 'YouTube વિડિઓ',
                                    bn: 'YouTube ভিডিও',
                                    ta: 'YouTube வீடியோ',
                                    te: 'YouTube వీడియో',
                                    kn: 'YouTube ವೀಡಿಯೊ',
                                    pa: 'YouTube ਵੀਡੀਓ',
                                  })}
                            </span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <div className="font-bold text-amber-900 dark:text-amber-300 mb-1">
                  {pickLang(lang, {
                    en: "💡 Chef's Nutrition Tip:",
                    hi: '💡 पोषण व स्वाद रहस्य:',
                    mr: '💡 पोषण व चवीचे गुपित:',
                    hinglish: "💡 Chef's Nutrition Tip:",
                    gu: '💡 શેફની પોષણ ટિપ:',
                    bn: '💡 শেফের পুষ্টি পরামর্শ:',
                    ta: '💡 சமையல் ஊட்டச்சத்து குறிப்பு:',
                    te: '💡 పోషకాహార చిట్కా:',
                    kn: '💡 ಪೌಷ್ಟಿಕಾಂಶ ಸಲಹೆ:',
                    pa: '💡 ਸ਼ੈੱਫ ਦਾ ਪੋਸ਼ਣ ਸੁਝਾਅ:',
                  })}
                </div>
                <p className="leading-relaxed">
                  {pickLang(lang, {
                    en: `Covered slow-cooking preserves the natural vitamins and minerals in ${displayName}. Use light oil and balanced spices to enjoy authentic farm flavor.`,
                    hi: `कम आंच पर ढककर पकाने से ${displayName} के प्राकृतिक विटामिन्स और खनिज सुरक्षित रहते हैं। अत्यधिक तेल और तीखे मसालों से बचें ताकि इसका असली खेत का स्वाद बना रहे।`,
                    mr: `मंद आचेवर झाकण ठेवून शिजवल्याने ${displayName} मधील नैसर्गिक जीवनसत्त्वे टिकून राहतात.`,
                    hinglish: `Slow flame par dhak kar pakaane se ${displayName} ke natural vitamins aur flavor bacha rehta hai.`,
                    gu: `ધીમા તાપે ઢાંકીને રાંધવાથી ${displayName} ના કુદરતી વિટામિન્સ અને ખનિજો સચવાઈ રહે છે.`,
                    bn: `কম আঁচে ঢেকে রান্না করলে ${displayName}-এর প্রাকৃতিক ভিটামিন ও খনিজ বজায় থাকে।`,
                    ta: `குறைந்த தீயில் மூடி சமைப்பதால் ${displayName} சத்துக்கள் பாதுகாக்கப்படும்.`,
                    te: `తక్కువ మంటపై మూత పెట్టి వండడం వల్ల ${displayName}లోని విటమిన్లు నిలిచి ఉంటాయి.`,
                    kn: `ಕಡಿಮೆ ಉರಿಯಲ್ಲಿ ಮುಚ್ಚಿ ಬೇಯಿಸುವುದರಿಂದ ${displayName} ಪೋಷಕಾಂಶಗಳು ಉಳಿಯುತ್ತವೆ.`,
                    pa: `ਘੱਟ ਅੱਗ ਤੇ ਢੱਕ ਕੇ ਪਕਾਉਣ ਨਾਲ ${displayName} ਦੇ ਕੁਦਰਤੀ ਵਿਟਾਮਿਨ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦੇ ਹਨ।`,
                  })}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Mandi Grading Standards */}
          {activeTab === 'grading' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: 'APMC Vashi Mandi Grading Standard:',
                      hi: 'वाशी APMC मंडी ग्रेडिंग मापदंड:',
                      mr: 'वाशी एपीएमसी मंडी प्रतवारी निकष:',
                      hinglish: 'APMC Vashi Mandi Grading Standard:',
                      gu: 'વાશી APMC મંડી ગ્રેડિંગ ધોરણ:',
                      bn: 'ভাশি APMC মান্ডি গ্রেডিং মানদণ্ড:',
                      ta: 'APMC மண்டி தர அளவுகோல்:',
                      te: 'APMC మండి గ్రేడింగ్ ప్రమాణం:',
                      kn: 'APMC ಮಂಡಿ ಗುಣಮಟ್ಟ ಮಾನದಂಡ:',
                      pa: 'ਵਾਸ਼ੀ APMC ਮੰਡੀ ਗ੍ਰੇਡਿੰਗ ਮਾਪਦੰਡ:',
                    })}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {curated.qualityCheck}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: `Origin: ${item.origin} (4:00 AM Auction)`,
                      hi: `सोर्स: ${item.origin} (सुबह 4:00 AM नीलामी)`,
                      mr: `मूळ ठिकाण: ${item.origin} (पहाटे ४:०० लिलाव)`,
                      hinglish: `Origin: ${item.origin} (Subah 4:00 AM Auction)`,
                      gu: `મૂળ: ${item.origin} (સવારે 4:00 AM ઓક્શન)`,
                      bn: `উৎস: ${item.origin} (ভোর ৪:০০ নিলাম)`,
                      ta: `இருப்பிடம்: ${item.origin} (அதிகாலை 4:00 AM ஏலம்)`,
                      te: `మూలం: ${item.origin} (ఉదయం 4:00 AM వేలం)`,
                      kn: `ಮೂಲ: ${item.origin} (ಬೆಳಿಗ್ಗೆ 4:00 AM ಹರಾಜು)`,
                      pa: `ਸਰੋਤ: ${item.origin} (ਸਵੇਰੇ 4:00 AM ਬੋਲੀ)`,
                    })}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                  {pickLang(lang, {
                    en: '0% Stale Warehouse Stock Guarantee:',
                    hi: '0% बासी गोदाम माल की गारंटी:',
                    mr: '०% शिळ्या गोदाम मालाची हमी:',
                    hinglish: '0% Stale Warehouse Stock Guarantee:',
                    gu: '0% વાસી ગોડાઉન માલની ગેરંટી:',
                    bn: '০% বাসি গুদাম স্টকের গ্যারান্টি:',
                    ta: '0% பழைய கிட்டங்கி சரக்கு உத்தரவாதம்:',
                    te: '0% నిల్వ ఉన్న పాత సరుకు లేని హామీ:',
                    kn: '0% ಹಳೆಯ ಗೋದಾಮು ದಾಸ್ತಾನು ಭರವಸೆ:',
                    pa: '0% ਬੇਹਾ ਗੋਦਾਮ ਸਟਾਕ ਗਾਰੰਟੀ:',
                  })}
                </div>
                <p>
                  {pickLang(lang, {
                    en: 'Never held in cold storage or retail bins. Harvested and sourced fresh strictly against confirmed society family orders.',
                    hi: 'यह उत्पाद किसी कोल्ड स्टोरेज या दुकान में कई दिनों तक नहीं रखा जाता। केवल आपकी सोसायटी के कन्फर्म ऑर्डर्स के अनुसार ही मंडी से खरीदा जाता है।',
                    mr: 'हा शेतमाल कोणत्याही कोल्ड स्टोरेजमध्ये साठवून ठेवला जात नाही. केवळ सोसायटीच्या निश्चित ऑर्डर्सनुसार ताजा खरेदी केला जातो.',
                    hinglish: 'Koi cold-storage stock nahi. Sirf aapki society ke confirmed orders ke hisab se fresh kharida jata hai.',
                    gu: 'કોઈ કોલ્ડ સ્ટોરેજમાં રાખવામાં આવતું નથી. ફક્ત તમારી સોસાયટીના કન્ફર્મ ઓર્ડર મુજબ તાજું ખરીદાય છે.',
                    bn: 'কোনো কোল্ড স্টোরেজে রাখা হয় না। শুধুমাত্র সোসাইটির নিশ্চিত অর্ডার অনুযায়ী টাটকা কেনা হয়।',
                    ta: 'குளிர்பதனக் கிடங்கில் வைக்கப்படுவதில்லை. உறுதிப்படுத்தப்பட்ட ஆர்டர்களுக்கு ஏற்ப மண்டியிலிருந்து நேரடியாகக் கொள்முதல் செய்யப்படுகிறது.',
                    te: 'కోల్డ్ స్టోరేజ్‌లో నిల్వ చేయబడదు. మీ సొసైటీ ఆర్డర్ల ప్రకారం నేరుగా కొనుగోలు చేయబడుతుంది.',
                    kn: 'ಕೋಲ್ಡ್ ಸ್ಟೋರೇಜ್‌ನಲ್ಲಿ ಇಡುವುದಿಲ್ಲ. ನಿಮ್ಮ ಸೊಸೈಟಿ ಆರ್ಡರ್‌ಗಳಿಗೆ ಅನುಗುಣವಾಗಿ ನೇರವಾಗಿ ಖರೀದಿಸಲಾಗುತ್ತದೆ.',
                    pa: 'ਕੋਈ ਕੋਲਡ ਸਟੋਰੇਜ ਸਟਾਕ ਨਹੀਂ। ਸਿਰਫ਼ ਤੁਹਾਡੀ ਸੁਸਾਇਟੀ ਦੇ ਪੱਕੇ ਆਰਡਰਾਂ ਅਨੁਸਾਰ ਤਾਜ਼ਾ ਖਰੀਦਿਆ ਜਾਂਦਾ ਹੈ।',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: Live AI Freshness Intelligence */}
          {activeTab === 'ai' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 min-h-[140px] flex items-center justify-center">
                {aiLoading ? (
                  <div className="w-full space-y-2.5 py-2" aria-busy="true" aria-label="Loading AI freshness insights">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md skeleton-shimmer shrink-0" />
                      <div className="h-4 w-48 rounded skeleton-shimmer" />
                    </div>
                    <div className="h-3.5 w-full rounded skeleton-shimmer" />
                    <div className="h-3.5 w-11/12 rounded skeleton-shimmer" />
                    <div className="h-3.5 w-4/5 rounded skeleton-shimmer" />
                    <div className="h-3.5 w-3/5 rounded skeleton-shimmer" />
                  </div>
                ) : (
                  <div className="space-y-2 text-left w-full">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {pickLang(lang, {
                          en: 'Freshness & Storage Assistant:',
                          hi: 'ताज़गी व भंडारण सहायक:',
                          mr: 'ताजेपणा व साठवणूक सल्लागार:',
                          hinglish: 'Freshness & Storage Assistant:',
                          gu: 'તાજગી અને સ્ટોરેજ ગાઈડ:',
                          bn: 'সতেজতা ও সংরক্ষণ গাইড:',
                          ta: 'புத்துணர்ச்சி & சேமிப்பு வழிகாட்டி:',
                          te: 'తాజాదనం & నిల్వ గైడ్:',
                          kn: 'ತಾಜಾತನ ಮತ್ತು ಸಂಗ್ರಹಣೆ ಮಾರ್ಗದರ್ಶಿ:',
                          pa: 'ਤਾਜ਼ਗੀ ਤੇ ਸਟੋਰੇਜ ਗਾਈਡ:',
                        })}
                      </span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
                      {aiCustomAdvice}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleAskAI}
                disabled={aiLoading}
                className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, {
                    en: 'Regenerate Fresh Advice',
                    hi: 'पुनः ताज़ा सलाह लोड करें',
                    mr: 'पुन्हा ताजा सल्ला मिळवा',
                    hinglish: 'Refresh Advice',
                    gu: 'ફરી સલાહ લોડ કરો',
                    bn: 'আবার পরামর্শ দেখুন',
                    ta: 'மீண்டும் ஆலோசனை பெறுக',
                    te: 'మళ్ళీ సలహా పొందండి',
                    kn: 'ಮತ್ತೆ ಸಲಹೆ ಪಡೆಯಿರಿ',
                    pa: 'ਦੁਬਾਰਾ ਸਲਾਹ ਲਓ',
                  })}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            ताज़ाMandi · powered by MARCO 💯
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            {pickLang(lang, {
              en: 'Done / Close',
              hi: 'समझ गए / बंद करें',
              mr: 'बंद करा',
              hinglish: 'Done / Close',
              gu: 'સમજાઈ ગયું / બંધ કરો',
              bn: 'বন্ধ করুন',
              ta: 'மூடு',
              te: 'మూసివేయి',
              kn: 'ಮುಚ್ಚಿ',
              pa: 'ਬੰਦ ਕਰੋ',
            })}
          </button>
        </div>
      </div>
    </div>
  );
};

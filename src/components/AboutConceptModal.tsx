import React from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  X,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  TrendingDown,
  Building,
  Leaf,
  HeartHandshake,
} from 'lucide-react';

interface AboutConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutConceptModal: React.FC<AboutConceptModalProps> = ({ isOpen, onClose }) => {
  const { brand, lang } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {brand.brandName} · {brand.societyName}
              </div>
              <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Mandi Concept & About Us',
                  hi: 'मंडी कॉन्सेप्ट व हमारे बारे में',
                  mr: 'मंडी संकल्पना आणि आमच्याबद्दल',
                  hinglish: 'Mandi Concept & About Us',
                  gu: 'મંડી કોન્સેપ્ટ અને અમારા વિશે',
                  bn: 'মান্ডি কনসেপ্ট ও আমাদের সম্পর্কে',
                  ta: 'மண்டி செயல்முறை & எங்களைப் பற்றி',
                  te: 'మండి కాన్సెప్ట్ & మా గురించి',
                  kn: 'ಮಂಡಿ ಪರಿಕಲ್ಪನೆ ಮತ್ತು ನಮ್ಮ ಬಗ್ಗೆ',
                  pa: 'ਮੰਡੀ ਕਾਂਸੈਪਟ ਅਤੇ ਸਾਡੇ ਬਾਰੇ',
                })}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
          {/* Mission Box */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm sm:text-base flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: 'What is the Zero-Waste Mandi Concept?',
                  hi: 'The Zero-Waste Mandi Concept क्या है?',
                  mr: 'झिरो-वेस्ट मंडी संकल्पना काय आहे?',
                  hinglish: 'Zero-Waste Mandi Concept kya hai?',
                  gu: 'ઝીરો-વેસ્ટ મંડી કોન્સેપ્ટ શું છે?',
                  bn: 'জিরো-ওয়েস্ট মান্ডি কনসেপ্ট কী?',
                  ta: 'வீணில்லா மண்டி (Zero-Waste) என்றால் என்ன?',
                  te: 'జీరో-వేస్ట్ మండి కాన్సెప్ట్ అంటే ఏమిటి?',
                  kn: 'ಶೂನ್ಯ-ವ್ಯರ್ಥ ಮಂಡಿ ಪರಿಕಲ್ಪನೆ ಎಂದರೇನು?',
                  pa: 'ਜ਼ੀਰੋ-ਵੇਸਟ ਮੰਡੀ ਕਾਂਸੈਪਟ ਕੀ ਹੈ?',
                })}
              </span>
            </h3>
            <p>
              {pickLang(lang, {
                en: 'In traditional retail markets, up to 30% of vegetables and fruits spoil inside warehouses and shop racks, passing high prices and stale produce onto customers.',
                hi: 'पारंपरिक बाज़ारों में 30% सब्ज़ियां और फल गोदामों में पड़े-पड़े बासी हो जाते हैं, जिसका नुकसान अंततः ग्राहक को महंगी और बासी सब्ज़ियों के रूप में भुगतना पड़ता है।',
                mr: 'पारंपारिक बाजारात जवळपास ३०% भाजीपाला गोदामात खराब होतो, ज्याचा आर्थिक भार ग्राहकांवर महागाईच्या रूपात पडतो.',
                hinglish: 'Traditional markets me 30% sabzi godown me kharab hoti hai, jiska nuksan mehenge daam se customer ko uthana padta hai.',
                gu: 'પરંપરાગત બજારોમાં 30% શાકભાજી ગોડાઉનમાં બગડી જાય છે, જેનો ભાર ગ્રાહકો પર મોંઘવારી રૂપે પડે છે.',
                bn: 'প্রচলিত বাজারে প্রায় ৩০% সবজি গুদামে নষ্ট হয়, যার ক্ষতি গ্রাহকদের বেশি দামে দিতে হয়।',
                ta: 'சாதாரண சந்தைகளில் 30% காய்கறிகள் கிடங்குகளில் வீணாகி, வாடிக்கையாளர்களுக்கு அதிக விலையாக மாறுகிறது.',
                te: 'సాధారణ మార్కెట్లలో 30% కూరగాయలు గోదాముల్లో పాడవుతాయి, ఆ భారం కస్టమర్లపై పడుతుంది.',
                kn: 'ಸಾಂಪ್ರದಾಯಿಕ ಮಾರುಕಟ್ಟೆಗಳಲ್ಲಿ 30% ತರಕಾರಿಗಳು ಗೋದಾಮುಗಳಲ್ಲಿ ಹಾಳಾಗುತ್ತವೆ.',
                pa: 'ਆਮ ਬਾਜ਼ਾਰਾਂ ਵਿੱਚ 30% ਸਬਜ਼ੀਆਂ ਗੋਦਾਮਾਂ ਵਿੱਚ ਖ਼ਰਾਬ ਹੁੰਦੀਆਂ ਹਨ, ਜਿਸਦਾ ਖਰਚਾ ਗਾਹਕ ਨੂੰ ਭਰना ਪੈਂਦਾ ਹੈ।',
              })}
            </p>
            <p className="mt-2 font-semibold text-emerald-900 dark:text-emerald-200">
              {pickLang(lang, {
                en: 'Zero-Waste Direct Sourcing: we avoid long warehouse holding and source your society’s daily demand directly from APMC Vashi Mandi.',
                hi: 'ज़ीरो-वेस्ट डायरेक्ट सोर्सिंग: हम लंबे गोदाम स्टॉक से बचते हैं और आपकी सोसायटी की रोज़ाना ज़रूरत के हिसाब से सीधे वाशी APMC मंडी से माल लाते हैं।',
                mr: 'झिरो-वेस्ट डायरेक्ट सोर्सिंग: सोसायटीच्या एकत्रित मागणीनुसार थेट बाजारातून माल आणला जातो.',
                hinglish: 'Zero-Waste Direct Sourcing: society milkar daily zarurat ke hisab se mandi se maal mangwati hai.',
                gu: 'ઝીરો-વેસ્ટ ડાયરેક્ટ સોર્સિંગ: આખી સોસાયટી રોજ સીધો મંડીમાંથી માલ મંગાવે છે.',
                bn: 'জিরো-ওয়েস্ট ডাইরেক্ট সোর্সিং: সোসাইটির চাহিদা অনুযায়ী সরাসরি মান্ডি থেকে আনা হয়।',
                ta: 'நேரடி மண்டி கொள்முதல்: உங்கள் தேவைக்கு ஏற்ப தினமும் சரக்கு வருகிறது.',
                te: 'డైరెక్ట్ మండీ సోర్సింగ్: నిల్వ గోదాములు లేకుండా సరుకు వస్తుంది.',
                kn: 'ನೇರ ಮಂಡಿ ಖರೀದಿ: ಸೊಸೈಟಿಯ ಬೇಡಿಕೆಗೆ ಅನುಗುಣವಾಗಿ ಮಂಡಿಯಿಂದ ತರಲಾಗುತ್ತದೆ.',
                pa: 'ਜ਼ੀਰੋ-ਵੇਸਟ ਡਾਇਰੈਕਟ ਸੋਰਸਿੰਗ: ਸੁਸਾਇਟੀ ਦੀ ਮੰਗ ਮੁਤਾਬਕ ਸਿੱਧਾ ਮੰਡੀ ਤੋਂ ਮਾਲ ਲਿਆਂਦਾ ਜਾਂਦਾ ਹੈ।',
              })}
            </p>
          </div>

          {/* 3 Step Workflow */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
              {pickLang(lang, {
                en: 'How It Works (3 Simple Steps):',
                hi: 'यह काम कैसे करता है? (How It Works):',
                mr: 'हे कसे कार्य करते?:',
                hinglish: 'Kaise Kaam Karta Hai?:',
                gu: 'તે કેવી રીતે કામ કરે છે?:',
                bn: 'এটি কীভাবে কাজ করে?:',
                ta: 'இது எப்படி செயல்படுகிறது?:',
                te: 'ఇది ఎలా పనిచేస్తుంది?:',
                kn: 'ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?:',
                pa: 'ਇਹ ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ?:',
              })}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: '1. 24x7 Booking',
                      hi: '1. 24x7 बुकिंग',
                      mr: '१. २४x७ बुकिंग',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {pickLang(lang, {
                    en: 'Book fresh vegetables & fruits on the app before 11:00 PM.',
                    hi: 'रात 11:00 PM तक अपनी मनपसंद ताज़ी सब्ज़ियां व फल ऐप पर बुक करें।',
                    mr: 'रात्री ११:०० PM पर्यंत ताजा भाजीपाला व फळे अ‍ॅपवर बुक करा.',
                  })}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 mb-1">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: '2. 4 AM Mandi Lot',
                      hi: '2. सुबह 4 AM मंडी लॉट',
                      mr: '२. पहाटे ४ AM लिलाव',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {pickLang(lang, {
                    en: 'Hand-graded Grade-A farm produce is picked from 4 AM Vashi APMC auction.',
                    hi: 'वाशी APMC मंडी से किसानों की पहली खेप का छांटा हुआ Grade-A माल उठाया जाता है।',
                    mr: 'वाशी एपीएमसी बाजारातून पहाटेच्या ताज्या लिलावातील प्रत-अ माल घेतला जातो.',
                  })}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {pickLang(lang, {
                      en: '3. 10 AM Delivery',
                      hi: '3. सुबह 10 AM डिलीवरी',
                      mr: '३. सकाळी १० AM पोहोच',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {pickLang(lang, {
                    en: 'Hygienic flat-labeled crates are delivered straight to your doorstep.',
                    hi: 'हर फ्लैट के नाम का अलग हाइजीनिक बैग आपके दरवाज़े पर डिलीवर किया जाता है।',
                    mr: 'प्रत्येक फ्लॅटच्या नावाची स्वतंत्र पिशवी थेट दारात पोहोचवली जाते.',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {pickLang(lang, {
                en: 'Why Families Love ताज़ाMandi:',
                hi: 'आपको क्या फायदे मिलते हैं?',
                mr: 'आपल्याला कोणते फायदे मिळतात?',
              })}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    {pickLang(lang, {
                      en: 'Save 20-30% at Wholesale Rates',
                      hi: 'थोक भाव पर 20-30% बचत',
                      mr: 'घाऊक दरावर २०-३०% बचत',
                    })}
                  </strong>
                  <span>
                    {pickLang(lang, {
                      en: 'Eliminates retail shop rent and middlemen, passing APMC mandi prices straight to you.',
                      hi: 'बिचौलियों और रिटेल दुकान के भारी किराये का खर्च बचता है, जिससे आपको सीधे मंडी भाव का लाभ मिलता है।',
                      mr: 'मध्यस्थ आणि किरकोळ दुकानदारांचा खर्च वाचतो आणि थेट मंडीचा दर मिळतो.',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    {pickLang(lang, {
                      en: 'Morning Mandi Lot Sourcing',
                      hi: 'सुबह की मंडी नीलामी से खरीदारी',
                      mr: 'सकाळच्या मंडी लिलावातून खरेदी',
                    })}
                  </strong>
                  <span>
                    {pickLang(lang, {
                      en: 'Note: "100% Fresh" is a brand tagline only and not a legal guarantee.',
                      hi: 'नोट: "100% ताज़ा / 100% Fresh" केवल एक टैगलाइन शब्द है, इसकी कोई गारंटी नहीं दी जाती।',
                      mr: 'टीप: "१००% ताजे" हा केवळ एक शब्द/टॅगलाइन आहे, त्याची हमी नाही.',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <Building className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    {pickLang(lang, {
                      en: 'Collective Society Power',
                      hi: 'सामूहिक सोसायटी शक्ति',
                      mr: 'सोसायटी सामूहिक शक्ती',
                    })}
                  </strong>
                  <span>
                    {pickLang(lang, {
                      en: 'Families pool orders together to unlock bulk mandi crate rates.',
                      hi: 'पड़ोसियों के साथ मिलकर खरीदने पर पूरे बोरी व क्रेट रेट का सीधा लाभ मिलता है।',
                      mr: 'शेजाऱ्यांसोबत मिळून ऑर्डर केल्यामुळे थेट घाऊक दराचा फायदा.',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 dark:text-slate-100 block">
                    {pickLang(lang, {
                      en: 'Support Farmers Directly',
                      hi: 'सीधा किसान समर्थन',
                      mr: 'शेतकऱ्यांना थेट लाभ',
                    })}
                  </strong>
                  <span>
                    {pickLang(lang, {
                      en: 'Direct morning procurement ensures faster payouts and zero farm wastage.',
                      hi: 'सुबह की सीधी खरीदारी से किसानों को बेहतर दाम और सही समय पर भुगतान मिलता है।',
                      mr: 'सकाळच्या थेट खरेदीमुळे शेतकऱ्यांना योग्य दर मिळतो.',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Terms & Zero-Liability Disclaimer */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-xs space-y-1.5">
            <div className="font-black text-amber-900 dark:text-amber-200">
              {pickLang(lang, {
                en: 'Terms & Disclaimer (Customer Responsibility)',
                hi: 'नियम एवं अस्वीकरण (पूरी ज़िम्मेदारी ग्राहक की)',
                mr: 'अटी व जबाबदारी सूचना',
              })}
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {pickLang(lang, {
                en: '"100% ताज़ा / 100% Fresh" is strictly a marketing tagline only — ताज़ाMandi and the seller provide no guarantee. For any issue or outcome (right or wrong) in quality, weight, or delivery, neither the seller nor Mandi vendor holds any responsibility — full responsibility lies solely with the customer.',
                hi: '“100% ताज़ा / 100% Fresh” केवल एक टैगलाइन शब्द मात्र है — ताज़ाMandi या विक्रेता इसकी कोई गारंटी नहीं देते। माल की गुणवत्ता, वज़न या डिलीवरी में कुछ भी गड़बड़ हो या सही हो, इसके लिए विक्रेता (Seller) या मंडी वाला कोई ज़िम्मेदार नहीं होगा — इसकी पूरी ज़िम्मेदारी स्वयं ग्राहक की होगी।',
                mr: '“१००% ताजे / 100% Fresh” हा केवळ एक टॅगलाइन शब्द आहे — विक्रेता किंवा मंडीवाला कोणतीही हमी देत नाही. काहीही चूक किंवा बरोबर झाल्यास विक्रेता/मंडीवाला जबाबदार राहणार नाही; संपूर्ण जबाबदारी ग्राहकाची राहील.',
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
          <span className="text-xs text-slate-400">ताज़ाMandi · powered by MARCO 💯</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            {pickLang(lang, {
              en: 'Start Shopping',
              hi: 'खरीदारी शुरू करें',
              mr: 'खरेदी सुरू करा',
              gu: 'ખરીદી શરૂ કરો',
              bn: 'কেনাকাটা শুরু করুন',
              ta: 'ஷாப்பிங் தொடங்கு',
              te: 'షాపింగ్ ప్రారంభించండి',
              kn: 'ಖರೀದಿ ಪ್ರಾರಂಭಿಸಿ',
              pa: 'ਖਰੀਦਦਾਰੀ ਸ਼ੁਰੂ ਕਰੋ',
            })}
          </button>
        </div>
      </div>
    </div>
  );
};

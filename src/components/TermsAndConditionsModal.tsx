import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, FileText, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcceptAndClose?: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({
  isOpen,
  onClose,
  onAcceptAndClose,
  initialTab = 'terms',
}) => {
  const { lang, brand } = useApp();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const termsClauses = [
    {
      num: '01',
      title: pickLang(lang, {
        en: 'Registered Members Only & Account Eligibility',
        hi: 'केवल पंजीकृत सदस्य व खाता पात्रता',
        hinglish: 'Registered Members Only & Identity Rule',
      }),
      body: pickLang(lang, {
        en: 'Access to the ordering catalog, voice AI checkout, and referral rewards requires creating a registered account using a valid 10-digit Indian mobile number or verified Gmail address, complete doorstep delivery details, double-confirmed password, and explicit acceptance of these Terms and Privacy Policy.',
        hi: 'ऑर्डर करने, वॉइस AI चेकआउट और रेफ़रल लाभ लेने के लिए सही 10 अंकों का मोबाइल नंबर या सत्यापित Gmail, पूरा डिलीवरी पता, दो बार सत्यापित पासवर्ड व इन शर्तों की स्वीकृति के साथ पंजीकृत खाता होना अनिवार्य है।',
        hinglish: 'Sirf valid Mobile No. ya verified Gmail, delivery address aur double-confirmed password ke saath registered accounts hi platform use kar sakte hain.',
      }),
    },
    {
      num: '02',
      title: pickLang(lang, {
        en: 'Promotional Tagline ("100% ताज़ा") & Natural Produce Variance',
        hi: '"100% ताज़ा / 100% Fresh" टैगलाइन व प्राकृतिक उपज नियम',
        hinglish: '"100% ताज़ा" Tagline & Agricultural Quality Disclaimer',
      }),
      body: pickLang(lang, {
        en: '"100% ताज़ा / 100% Fresh" is a promotional brand slogan representing early-morning APMC sourcing intent and does not constitute a statutory warranty. Fresh fruits and vegetables naturally vary in shape, moisture weight, and ripeness; responsibility upon inspection and acceptance rests with the customer.',
        hi: '“100% ताज़ा / 100% Fresh” केवल सुबह APMC वाशी से ताज़ी खरीद दर्शाने वाली ब्रांड प्रचार टैगलाइन है और इसकी कोई विधिक गारंटी नहीं है। फल-सब्ज़ियों के प्राकृतिक आकार, नमी के वजन या पकने के स्तर में अंतर संभव है — जांच व स्वीकृति की ज़िम्मेदारी ग्राहक की होगी।',
        hinglish: '"100% Taaza / 100% Fresh" sirf ek promotional slogan hai. Fresh produce mein natural weight ya ripening variation ho sakta hai.',
      }),
    },
    {
      num: '03',
      title: pickLang(lang, {
        en: '11:00 PM Nightly Cutoff & 4:00 AM APMC Procurement Cycle',
        hi: 'रात 11:00 PM कटऑफ और सुबह 4:00 AM मंडी खरीद चक्र',
        hinglish: '11:00 PM Cutoff & Next-Morning Delivery Cycle',
      }),
      body: pickLang(lang, {
        en: 'Orders placed before 11:00 PM IST are consolidated into next morning’s 4:00 AM APMC Vashi wholesale auction procurement batch for morning doorstep dispatch (typically 8:00 AM – 12:00 PM). Orders placed after 11:00 PM automatically roll over to the following day’s morning lot to prevent wastage.',
        hi: 'रात 11:00 PM से पहले बुक किए गए सभी ऑर्डर अगली सुबह 4:00 AM वाशी APMC थोक मंडी बैच में शामिल किए जाते हैं। 11:00 PM के बाद किए गए ऑर्डर शून्य बर्बादी (Zero-Waste) नीति के तहत अगले सुबह के बैच में जुड़ते हैं।',
        hinglish: '11:00 PM se pehle ke orders next morning 4:00 AM Vashi Mandi batch mein aate hain; baad wale orders agle batch mein shift hote hain.',
      }),
    },
    {
      num: '04',
      title: pickLang(lang, {
        en: 'Pricing, Kotak UPI QR / COD Payments & Cancellations',
        hi: 'मूल्य निर्धारण, UPI QR / नकद भुगतान व ऑर्डर रद्दीकरण',
        hinglish: 'Pricing, UPI QR / COD & Order Cancellation',
      }),
      body: pickLang(lang, {
        en: 'Rates reflect daily wholesale mandi procurement and display comparative local market estimates for transparency. Payments may be made via verified UPI QR or Cash on Delivery (COD). Orders may be cancelled prior to the 4:00 AM mandi procurement Dispatch lock.',
        hi: 'दिखाए गए दाम दैनिक थोक मंडी दरों पर आधारित हैं। भुगतान सत्यापित Kotak UPI QR या डिलीवरी पर नकद (COD) द्वारा किया जा सकता है। सुबह 4:00 AM मंडी खरीद लॉक होने से पहले ऑर्डर रद्द किया जा सकता है।',
        hinglish: 'Rates daily APMC mandi bhav par based hain. Payment UPI QR ya COD se kar sakte hain; 4 AM batch lock se pehle cancel option uplabdh hai.',
      }),
    },
    {
      num: '05',
      title: pickLang(lang, {
        en: '₹50 Referral Cashback & Gamified Leaderboard Fair Play',
        hi: '₹50 रेफ़रल कैशबैक व गेमिफ़ाइड लीडरबोर्ड नियम',
        hinglish: '₹50 Referral Reward & Leaderboard Rules',
      }),
      body: pickLang(lang, {
        en: 'Referral bonuses (₹50 wallet credit + complimentary leafy bundle) credit strictly after the referred neighbor completes an eligible order of ₹150+ with verified delivered and paid status. Self-referrals, fake accounts, or automated scripts result in immediate reward forfeiture.',
        hi: 'रेफ़रल बोनस (₹50 वॉलेट क्रेडिट + उपहार) केवल तभी मिलता है जब नए पड़ोसी का ₹150+ का ऑर्डर सफलतापूर्वक डिलीवर और भुगतान-सत्यापित हो जाए। फर्जी खातों या स्वयं-रेफ़रल पर पुरस्कार रद्द कर दिया जाएगा।',
        hinglish: '₹50 referral reward tabhi unlock hota hai jab referred neighbor ka ₹150+ order deliver aur pay confirm ho jaye.',
      }),
    },
    {
      num: '06',
      title: pickLang(lang, {
        en: 'Voice AI Assistant, Standalone WebAPK & Availability',
        hi: 'वॉइस AI असिस्टेंट, ऐप इंस्टॉलेशन व सेवा उपलब्धता',
        hinglish: 'Voice AI Assistant & Standalone App Usage',
      }),
      body: pickLang(lang, {
        en: 'Users may install the platform as a standalone Progressive Web App (WebAPK) on Android, iOS, or Desktop. All runtime permissions (microphone, notifications, location) remain optional and revocable in device or in-app settings at any time.',
        hi: 'यूज़र इस प्लेटफॉर्म को Android, iOS या Desktop पर स्टैंडअलोन ऐप (WebAPK) के रूप में इंस्टॉल कर सकते हैं। माइक, नोटिफिकेशन और लोकेशन जैसी अनुमतियाँ पूरी तरह आपकी मर्ज़ी पर आधारित हैं और कभी भी बंद की जा सकती हैं।',
        hinglish: 'Aap app ko standalone mobile app ki tarah install kar sakte hain aur sabhi permissions (Mic, Alerts, Location) kisi bhi waqt control kar sakte hain.',
      }),
    },
    {
      num: '07',
      title: pickLang(lang, {
        en: 'Governing Terms, Updates & Grievance Contact',
        hi: 'सेवा अद्यतन व शिकायत/सहायता संपर्क',
        hinglish: 'Policy Updates & Official Support',
      }),
      body: pickLang(lang, {
        en: `These terms are governed by applicable Indian commercial laws (Navi Mumbai / Maharashtra jurisdiction). For order help, account queries, or formal notices, contact ${brand.brandName} Support (${brand.whatsappContact} · rp2824173@gmail.com).`,
        hi: `ये शर्तें लागू भारतीय कानूनों (नवी मुंबई / महाराष्ट्र क्षेत्राधिकार) के अधीन हैं। किसी भी सहायता, खाते की जानकारी या शिकायत हेतु संपर्क करें: ${brand.whatsappContact} · rp2824173@gmail.com।`,
        hinglish: `Support aur account queries ke liye contact karein: ${brand.whatsappContact} ya rp2824173@gmail.com.`,
      }),
    },
  ];

  const privacyClauses = [
    {
      num: '01',
      title: pickLang(lang, {
        en: 'What Personal Data We Collect',
        hi: 'हम कौन-सी व्यक्तिगत जानकारी एकत्र करते हैं',
        hinglish: 'Personal Information We Collect',
      }),
      body: pickLang(lang, {
        en: 'We collect only essential details you provide during Sign Up and checkout: Full Name, 10-digit Mobile No., optional alternate contact, Gmail address, residential society/flat address, order basket records, and voluntary family produce preferences.',
        hi: 'हम केवल वही ज़रूरी जानकारी सहेजते हैं जो आप Sign Up व ऑर्डर के समय देते हैं: आपका नाम, मोबाइल No., वैकल्पिक फ़ोन, Gmail ID, सोसायटी व फ़्लैट पता, ऑर्डर विवरण और परिवार की पसंदीदा सब्ज़ियों की सूची।',
        hinglish: 'Hum sirf zaroori details collect karte hain: Name, Mobile No., Gmail, Flat/Society address, aur aapke orders.',
      }),
    },
    {
      num: '02',
      title: pickLang(lang, {
        en: 'Microphone, Voice AI & Acoustic Sensitivity Tuning',
        hi: 'माइक्रोफोन, वॉइस AI व आवाज़ डेटा की सुरक्षा',
        hinglish: 'Microphone & Voice AI Data Privacy',
      }),
      body: pickLang(lang, {
        en: 'Your microphone is activated strictly when you grant permission or turn Voice Ordering ON. Audio captured during active voice commands is processed solely to understand items, quantities, and voice settings — never sold, shared for ads, or recorded silently when Mic is OFF.',
        hi: 'माइक्रोफोन केवल आपकी स्पष्ट अनुमति और माइक ऑन करने पर ही सक्रिय होता है। आपकी आवाज़ का उपयोग सिर्फ़ आपके बोले गए ऑर्डर, मात्रा व वॉइस सेटिंग्स को समझने के लिए किया जाता है — माइक बंद रहने पर कोई ऑडियो रिकॉर्ड नहीं होता।',
        hinglish: 'Mic sirf aapki permission aur ON toggle par hi chalta hai. Voice data sirf aapke order samajhne ke liye use hota hai, ads ke liye nahi.',
      }),
    },
    {
      num: '03',
      title: pickLang(lang, {
        en: 'Location, Push Notifications & Device Storage Permissions',
        hi: 'लोकेशन, नोटिफिकेशन व ऑफलाइन स्टोरेज अनुमतियाँ',
        hinglish: 'Location, Notifications & Storage Controls',
      }),
      body: pickLang(lang, {
        en: 'Location access (optional) assists with society delivery clustering and mandi distance visualization. Notifications alert you before the 11:00 PM cutoff, order dispatch, and badge milestones. Offline cache stores catalog assets locally so the standalone app opens rapidly even on low-network mornings.',
        hi: 'लोकेशन अनुमति (वैकल्पिक) केवल सोसायटी डिलीवरी रूटिंग के लिए, नोटिफिकेशन रात 11 PM कटऑफ व डिलीवरी अपडेट देने के लिए और लोकल कैश ऑफलाइन तेज़ ऐप लोडिंग के लिए उपयोग किए जाते हैं।',
        hinglish: 'Location delivery routing ke liye, Notifications cutoff/dispatch alerts ke liye, aur Offline Storage app ko fast open karne ke liye use hota hai.',
      }),
    },
    {
      num: '04',
      title: pickLang(lang, {
        en: 'Password Encryption, Payments & Zero Banking Credential Storage',
        hi: 'पासवर्ड एन्क्रिप्शन व UPI भुगतान सुरक्षा',
        hinglish: 'Encrypted Passwords & Payment Safety',
      }),
      body: pickLang(lang, {
        en: 'Account passwords are protected with cryptographic salted scrypt hashing and are never readable in plaintext by admins or third parties. All UPI QR payments execute directly inside your banking/UPI app — we never collect or store your UPI PIN, card CVV, or bank login credentials.',
        hi: 'आपका पासवर्ड आधुनिक एन्क्रिप्शन (salted scrypt hashing) से सुरक्षित रहता है और कभी भी किसी को साफ़ शब्दों में नहीं दिखता। UPI भुगतान सीधे आपके UPI ऐप में होता है — हम कभी आपका UPI पिन, कार्ड नंबर या बैंक पासवर्ड नहीं मांगते और न सहेजते हैं।',
        hinglish: 'Passwords salted scrypt se encrypted rehte hain. Hum kabhi aapka UPI PIN ya bank password store nahi karte.',
      }),
    },
    {
      num: '05',
      title: pickLang(lang, {
        en: 'Leaderboard Anonymization & User Activity Audit Log',
        hi: 'लीडरबोर्ड गोपनीयता व यूज़र एक्टिविटी लॉग',
        hinglish: 'Leaderboard Privacy & Activity Logger',
      }),
      body: pickLang(lang, {
        en: 'On the public Community Saver Leaderboard, your privacy is protected by masking full names to first name + initial (e.g., "Rahul P.") and keeping your mobile number and Gmail strictly hidden. Sign-ins, order actions, and terms consent events are logged privately for account security and support audits.',
        hi: 'पब्लिक लीडरबोर्ड पर आपका फ़ोन नंबर और Gmail हमेशा गोपनीय रहता है तथा नाम केवल संक्षिप्त रूप में (जैसे "Rahul P.") दिखता है। लॉगिन, ऑर्डर व शर्तों की सहमति का एक्टिविटी लॉग केवल आपकी सुरक्षा व सहायता के लिए सहेजा जाता है।',
        hinglish: 'Leaderboard par aapka mobile number aur Gmail hamesha hidden rehta hai; sirf short name dikhta hai.',
      }),
    },
    {
      num: '06',
      title: pickLang(lang, {
        en: 'Data Sharing Policy (Zero Ad Brokers)',
        hi: 'डेटा साझा न करने की गारंटी',
        hinglish: 'Zero Third-Party Ad Selling',
      }),
      body: pickLang(lang, {
        en: 'We never sell, rent, or trade your phone number, Gmail, address, or shopping history to marketing brokers or spam advertisers. Data is processed solely to fulfill APMC produce batch procurement, cloud persistence, and customer support.',
        hi: 'हम आपका मोबाइल नंबर, Gmail, घर का पता या ख़रीदारी का इतिहास कभी भी किसी विज्ञापन या स्पैम कंपनी को नहीं बेचते। डेटा केवल मंडी ऑर्डर पूर्ति और आपकी सहायता के लिए उपयोग होता है।',
        hinglish: 'Hum aapka Mobile No., Gmail ya order data kabhi kisi ad broker ya spam company ko nahi bechte.',
      }),
    },
    {
      num: '07',
      title: pickLang(lang, {
        en: 'Your Rights: Access, Correction & Account Deletion',
        hi: 'आपके अधिकार: डेटा सुधार व खाता हटाने का अनुरोध',
        hinglish: 'Access, Edit & Account Deletion Rights',
      }),
      body: pickLang(lang, {
        en: 'You can edit your delivery address, language, notifications, and voice permissions directly inside Account Settings at any time. To request a complete copy or deletion of your registered profile and activity history, write to rp2824173@gmail.com or WhatsApp +91 88288 22808.',
        hi: 'आप कभी भी Account सेक्शन में जाकर अपना पता, भाषा और वॉइस/अलर्ट अनुमतियाँ बदल सकते हैं। अपना पूरा खाता या डेटा हटवाने के लिए rp2824173@gmail.com पर ईमेल या +91 88288 22808 पर WhatsApp करें।',
        hinglish: 'Aap Account Settings mein data update kar sakte hain, ya account delete request ke liye rp2824173@gmail.com par contact karein.',
      }),
    },
  ];

  const activeClauses = activeTab === 'privacy' ? privacyClauses : termsClauses;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeTab === 'privacy' ? (
              <Lock className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="font-display font-black text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">
                {activeTab === 'privacy'
                  ? pickLang(lang, {
                      en: `${brand.brandName} — Privacy Policy & Data Safety`,
                      hi: `${brand.brandName} — गोपनीयता नीति व डेटा सुरक्षा`,
                      hinglish: `${brand.brandName} — Privacy Policy`,
                    })
                  : pickLang(lang, {
                      en: `${brand.brandName} — Terms & Conditions`,
                      hi: `${brand.brandName} — नियम व सेवा शर्तें`,
                      hinglish: `${brand.brandName} — Terms & Conditions`,
                    })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {pickLang(lang, {
                  en: 'Clear policies for standalone mobile app, voice ordering, and APMC society delivery',
                  hi: 'मोबाइल ऐप, वॉइस ऑर्डर और मंडी होम डिलीवरी के लिए स्पष्ट सुरक्षा नीति',
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal dialog"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Tab Switcher: Terms & Conditions | Privacy Policy */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'Terms & Conditions', hi: 'नियम व शर्तें' })}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'Privacy Policy', hi: 'गोपनीयता नीति (Privacy)' })}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {activeTab === 'privacy' && (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/70 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">
                  {pickLang(lang, {
                    en: 'Data Safety Summary: Zero Ad Tracking · Encrypted Credentials · Revocable Permissions',
                    hi: 'डेटा सुरक्षा सारांश: कोई विज्ञापन ट्रैकिंग नहीं · एन्क्रिप्टेड पासवर्ड · पूर्ण नियंत्रण',
                  })}
                </div>
                <p className="text-[11px] opacity-90">
                  {pickLang(lang, {
                    en: 'Only Mobile No./Gmail, delivery flat details, and active voice/order commands are processed to run your morning mandi batch.',
                    hi: 'केवल आपका मोबाइल No./Gmail, पता और ऑर्डर कमांड ही डिलीवरी व वॉइस सेवा के लिए उपयोग होते हैं।',
                  })}
                </p>
              </div>
            </div>
          )}

          {activeClauses.map((clause, index) => (
            <div
              key={`${activeTab}-${clause.num}`}
              className={
                index < activeClauses.length - 1
                  ? 'pb-4 border-b border-slate-100 dark:border-slate-800'
                  : ''
              }
            >
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
                  {clause.num}.
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {clause.title}
                  </h4>
                  <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {clause.body}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <Mail className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
            <span>
              {pickLang(lang, {
                en: 'Effective Nov 2026 · rp2824173@gmail.com',
                hi: 'प्रभावी नवम्बर 2026 · rp2824173@gmail.com',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {pickLang(lang, { en: 'Close', hi: 'बंद करें' })}
            </button>
            {onAcceptAndClose && (
              <button
                type="button"
                onClick={onAcceptAndClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {pickLang(lang, {
                    en: 'Accept Terms & Privacy Policy',
                    hi: 'शर्तें व गोपनीयता नीति स्वीकार करें',
                    hinglish: 'Terms & Privacy Accept Karein',
                  })}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;

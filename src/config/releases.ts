/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Canonical Release Catalog & Version Metadata (Shared by Client & Server)
 * Pure TypeScript module with zero browser/DOM/Vite dependencies so Node.js (server.ts)
 * and the React client always reconcile exact version IDs and structured release notes.
 */

export interface LocalizedText {
  en: string;
  hi: string;
  mr: string;
  hinglish: string;
}

export interface AppReleaseEntry {
  version: string;
  releaseId: string;
  releasedAt: string;
  headline: LocalizedText;
  summary: LocalizedText;
  features: LocalizedText[];
  fixes: LocalizedText[];
}

export const CURRENT_RELEASE_VERSION = '5.9.0';
export const CURRENT_RELEASE_ID = '5.9.0-live';
export const CURRENT_RELEASE_DATE = '2026-11-21';

export const APP_RELEASES: AppReleaseEntry[] = [
  {
    version: '5.9.0',
    releaseId: '5.9.0-live',
    releasedAt: '2026-11-21',
    headline: {
      en: 'Admin Build Lifecycle, Cache-Control: no-cache Validation & Auto Re-Publish Sync',
      hi: 'एडमिन बिल्ड लाइफसाइकिल, Cache-Control: no-cache जांच व ऑटो री-पब्लिश सिंक',
      mr: 'अ‍ॅडमिन बिल्ड लाइफसायकल, Cache-Control पडताळणी व ऑटो री-पब्लिश सिंक',
      hinglish: 'Admin Build Lifecycle, Cache-Control: no-cache Check & Auto Re-Publish Sync',
    },
    summary: {
      en: 'Added cryptographic SHA-256 build fingerprinting, HTTP Cache-Control: no-cache / no-store header validation, instant Service Worker cache purge on re-publish, auto-hiding of synced update notices, and Preview vs Production Firestore hash comparison.',
      hi: 'एडमिन कंसोल में असली SHA-256 बंडल हैश जांच, Cache-Control: no-cache हेडर सत्यापन, री-पब्लिश होते ही पुराना कैश ऑटो-साफ़ होकर नोटिफिकेशन छुपना, व Preview बनाम Published Firestore तुलना जोड़ी गई।',
      mr: 'अ‍ॅडमिन कंसोलमध्ये SHA-256 बिल्ड हॅश तपासणी, Cache-Control पडताळणी व री-पब्लिश ऑटो-सिंक जोडले.',
      hinglish: 'Admin Console me SHA-256 build hash check, Cache-Control: no-cache validation, auto cache purge & Preview vs Published Firestore tracking joda gaya.',
    },
    features: [
      {
        en: 'Admin Deployment & Build Lifecycle Inspector: Compact top header sync badge plus full header & SHA-256 hash diagnostics inside Feature Controls',
        hi: 'एडमिन डिप्लॉयमेंट व बिल्ड लाइफसाइकिल पैनल: हेडर में लाइव Sync पिल और Feature Controls में Cache-Control + SHA-256 हैश जांच',
        mr: 'अ‍ॅडमिन हेडर Sync पिल आणि Feature Controls मध्ये संपूर्ण बिल्ड हॅश व हेडर तपासणी',
        hinglish: 'Admin Header Sync Pill + Feature Controls me Cache-Control & SHA-256 Hash Lifecycle panel',
      },
      {
        en: 'Cross-Environment Preview vs Published Sync (Firestore): Securely compares Development Preview and Production Published build hashes for Admin',
        hi: 'Preview बनाम Published बिल्ड तुलना (Firestore): एडमिन दोनों वातावरण के लाइव बिल्ड हैश व समय एक जगह देख सकते हैं',
        mr: 'Preview व Published बिल्ड हॅशची Firestore मधून थेट तुलना',
        hinglish: 'Preview vs Published build hash sync in Firestore for Admin',
      },
    ],
    fixes: [
      {
        en: 'Automatic Re-Publish Cache Purge & Notice Clearing: Immediately clears old Service Worker caches on hash mismatch and hides stale update/republish notices once synced',
        hi: 'री-पब्लिश होते ही पुराना कैश ऑटो-साफ़ कर नया बिल्ड लोड होता है और सिंक होते ही पुरानी चेतावनी तुरंत छुप जाती है',
        mr: 'री-पब्लिश होताच जुना कॅश आपोआप साफ होऊन अपडेट सूचना त्वरित लपवली जाते',
        hinglish: 'Re-publish detect hote hi old cache auto-purge hota hai aur synced hote hi notice turant hide ho jata hai',
      },
    ],
  },
  {
    version: '5.8.0',
    releaseId: '5.8.0-live',
    releasedAt: '2026-11-21',
    headline: {
      en: 'Admin Buyers Analytics Charts, Batch Saving Chart, OTP/Gmail Sign-Up & 1-Shot Publish Fix',
      hi: 'एडमिन बायर्स एनालिटिक्स चार्ट, बैच सेविंग चार्ट, मोबाइल OTP + Gmail कनेक्ट व 1-क्लिक पब्लिश सुधार',
      mr: 'अ‍ॅडमिन खरेदीदार अ‍ॅनालिटिक्स चार्ट, बॅच बचत चार्ट आणि सुधारित पब्लिश प्रणाली',
      hinglish: 'Admin Buyers Analytics Chart, Batch Saving Chart, OTP + Gmail Verify & 1-Shot Publish',
    },
    summary: {
      en: 'Added visual Sales/Savings/Profit comparison charts inside Admin Buyers Analytics, added interactive Batch Saving Chart (with Feature Controls switches), ordered Sign-Up with Mobile OTP + post-signup Gmail Connect + GPS blank-field auto-fill, and isolated runtime storage from project workspace files.',
      hi: 'एडमिन बायर्स एनालिटिक्स में दैनिक-वार्षिक तुलना चार्ट, नया बैच सेविंग चार्ट फीचर, मोबाइल OTP व Gmail कनेक्ट साइन-अप, GPS ऑटो-फ़िल और पब्लिश के बाद बार-बार आने वाली अनपब्लिश्ड फ़ाइल समस्या का स्थायी समाधान।',
      mr: 'अ‍ॅडमिन खरेदीदार अ‍ॅनालिटिक्स चार्ट, बॅच बचत चार्ट, मोबाईल OTP व Gmail पडताळणी आणि स्वच्छ पब्लिश सिंक.',
      hinglish: 'Admin Buyers Analytics chart, Batch Saving Chart feature, OTP + Gmail Sign-up, GPS auto-fill aur republish loop fix.',
    },
    features: [
      {
        en: 'Admin Buyers Analytics Visual Chart + Feature Switch: Compare Daily, Weekly, Monthly & Yearly sales, customer savings & net profit alongside Top-3 revenue share and #1–#10 buyer bars',
        hi: 'एडमिन बायर्स एनालिटिक्स चार्ट व फीचर कंट्रोल: दैनिक, साप्ताहिक, मासिक व सालाना बिक्री, बचत व मुनाफे का लाइव तुलनात्मक ग्राफ',
        mr: 'अ‍ॅडमिन खरेदीदार अ‍ॅनालिटिक्स तुलनात्मक चार्ट व फीचर स्विच',
        hinglish: 'Admin Buyers Analytics visual chart (Daily-Yearly Sales, Savings & Profit) + Feature Toggle',
      },
      {
        en: 'New Batch Saving Chart Feature: Interactive multi-bar chart comparing TaazaMandi batch bills vs Local Market + 14% spoilage loss across periods & live produce categories',
        hi: 'नया बैच सेविंग चार्ट फीचर: ताज़ाMandi बिल बनाम बाज़ार + खराब माल नुकसान और कैटेगरी-अनुसार बचत का लाइव ग्राफ',
        mr: 'नवीन बॅच बचत चार्ट सुविधा: मंडी दर व बाजार नुकसानीचा थेट ग्राफ',
        hinglish: 'New Batch Saving Chart: Period & live category graph (TaazaMandi vs Market + 14% spoilage saved)',
      },
      {
        en: 'Ordered Sign-Up Flow + Mobile OTP + Gmail Connect + GPS Blank Autofill: Verify mobile OTP during registration, auto-fill empty address fields via GPS, and connect Gmail right after signup',
        hi: 'मोबाइल OTP, GPS खाली स्थान ऑटो-फ़िल और खाता बनने के तुरंत बाद Gmail कनेक्ट वेरीफिकेशन',
        mr: 'मोबाईल OTP, GPS ऑटो-फिल आणि Gmail कनेक्ट पडताळणी',
        hinglish: 'Sign-Up Mobile OTP, GPS blank-field autofill aur Gmail Connect Verification',
      },
    ],
    fixes: [
      {
        en: 'Moved server runtime storage (.admin_rbac_secret & runtime JSON files) outside workspace root so running preview never re-triggers "unpublished changes" after Republishing',
        hi: 'सर्वर की अस्थायी फ़ाइलों को प्रोजेक्ट फ़ोल्डर से बाहर किया ताकि पब्लिश करने के बाद बार-बार झूठा "Unpublished changes" अलर्ट न दिखे',
        mr: 'तात्पुरत्या सर्व्हर फायली प्रोजेक्ट फोल्डरबाहेर हलवून पब्लिश समस्या कायमची दूर केली',
        hinglish: 'Runtime storage ko workspace se bahar shift kiya taki Publish ke baad bar-bar unpublished changes alert na aaye',
      },
    ],
  },
  {
    version: '5.7.0',
    releaseId: '5.7.0-live',
    releasedAt: '2026-11-20',
    headline: {
      en: 'Instant 1-Refresh Updates, Profile DP Design, Collapsible Activity Log & App Permissions',
      hi: 'तुरंत 1-रिफ्रेश अपडेट, प्रोफाइल DP अपलोडर, View/Hide गतिविधि लॉग व ऐप परमिशन',
      mr: 'झटपट अपडेट, प्रोफाईल DP अपलोडर, View/Hide कृती नोंद व अ‍ॅप परवानग्या',
      hinglish: 'Instant 1-Refresh Update, Profile DP Design, View/Hide Activity & App Permissions',
    },
    summary: {
      en: 'Fixed stale browser cache with instant auto-update on refresh, added Profile DP Uploader (Gallery/Camera) & Founder Pick Admin toggle, collapsible View/Hide My Activity Logger, and Camera/Mic/Photo App Install setup (removed .zip clutter).',
      hi: 'पुराने कैश की समस्या हल (एक रिफ्रेश में तुरंत नया अपडेट), ग्राहक Profile DP अपलोडर व Founder Pick टॉगल, View/Hide के साथ छोटा गतिविधि लॉग और कैमरा/माइक/फोटो परमिशन वाला ऐप इंस्टॉलर।',
      mr: 'जुना कॅश काढून एक रिफ्रेशमध्ये अपडेट, प्रोफाईल DP अपलोडर व Founder Pick स्विच, View/Hide कृती नोंद आणि कॅमेरा/माईक परवानग्यांसह अ‍ॅप इन्स्टॉलेशन.',
      hinglish: 'Stale 5.4.0 cache fix (ek refresh me turant update), Profile DP uploader, Founder Pick toggle, View/Hide Activity Logger aur Camera/Mic App Permissions (useless .zip hataya).',
    },
    features: [
      {
        en: 'Instant Auto-Update Engine + Company-Style Version Inspector: Shows Installed vs Latest Server Version clearly with 1-tap Update Now, Check Updates & View/Hide history per release',
        hi: 'तुरंत अपडेट व स्पष्ट वर्ज़न कार्ड: अभी कौन-सा वर्ज़न चल रहा है और पहले कौन-से अपडेट आए — हर अपडेट पर View / Hide बटन के साथ',
        mr: 'त्वरित ऑटो-अपडेट आणि आवृत्ती इतिहास: चालू आवृत्ती व मागील सर्व अपडेट्स View / Hide बटणासह पहा',
        hinglish: 'Instant Update & Version Card: Abhi kaunsa version chal raha hai aur pichle kaunse updates aaye — View/Hide + Update button',
      },
      {
        en: 'Customer Profile DP Uploader (Gallery & Camera) inside Account Center + Admin ON/OFF Toggle for MARCO 100 Founder Pick product sticker',
        hi: 'ग्राहक के लिए Gallery/Camera से Profile DP अपलोडर डिज़ाइन और Admin के लिए MARCO 100 Founder Pick स्टिकर ON/OFF स्विच',
        mr: 'ग्राहकांसाठी Gallery/Camera वरून Profile DP अपलोडर व अ‍ॅडमिनसाठी Founder Pick स्टिकर ON/OFF स्विच',
        hinglish: 'Customer Profile DP Uploader (Gallery/Camera) + Admin MARCO 100 Founder Pick sticker ON/OFF toggle',
      },
      {
        en: 'Collapsible My Activity Logger with View / Hide button (keeps Account view clean & compact)',
        hi: 'My Activity Logger में View / Hide बटन — जरूरत पड़ने पर ही लॉग खोलें ताकि अकाउंट पेज साफ रहे',
        mr: 'My Activity Logger साठी View / Hide बटण — गरज असेल तेव्हाच इतिहास पहा',
        hinglish: 'My Activity Logger me View / Hide button — Account screen ab compact aur saaf rahegi',
      },
      {
        en: 'Full App Permissions (Camera, Photos, Microphone, Location, Alerts) + Direct Signed .APK Hosting (no confusing .zip downloads for customers)',
        hi: 'कैमरा, फोटो, माइक, लोकेशन व अलर्ट परमिशन के साथ ऐप इंस्टॉल सुविधा और ग्राहकों के लिए डायरेक्ट APK डाउनलोड (अनावश्यक .zip हटाया गया)',
        mr: 'कॅमेरा, फोटो, माईक, लोकेशन परवानग्यांसह थेट अ‍ॅप इन्स्टॉल व थेट APK डाउनलोड (.zip काढून टाकले)',
        hinglish: 'Camera, Photo, Mic, Location & Notification Permissions + Direct .APK support (.zip hata diya gaya)',
      },
    ],
    fixes: [
      {
        en: 'Switched Service Worker & PWA build to immediate skipWaiting + network no-store HTML/API fetching so one refresh always loads the latest release cleanly',
        hi: 'Service Worker कैश लॉक हटाकर नेटवर्क-फर्स्ट व तुरंत एक्टिवेशन जोड़ा ताकि 1 रिफ्रेश में हमेशा नया वर्ज़न खुले',
        mr: 'Service Worker कॅश अडथळा काढून एक रिफ्रेशमध्ये नवीनतम आवृत्ती उघडण्याची खात्री केली',
        hinglish: 'Service Worker cache bug fix — 1 refresh ya Update Now par ab hamesha latest version turant load hota hai',
      },
    ],
  },
  {
    version: '5.6.0',
    releaseId: '5.6.0-live',
    releasedAt: '2026-11-20',
    headline: {
      en: 'Account Center Consolidation, Customer DP, Privacy Top-3 Chart & Admin AI Rewards',
      hi: 'अकाउंट सेंटर अपग्रेड, कस्टमर फोटो DP, प्राइवेसी टॉप-3 चार्ट और एडमिन AI रिवॉर्ड स्टूडियो',
      mr: 'खाते केंद्र सुधारणा, कस्टमर DP फोटो, टॉप-३ चार्ट आणि अ‍ॅडमिन AI रिवॉर्ड स्टुडिओ',
      hinglish: 'Account Center Upgrade, Profile DP, Top-3 Demand Chart & Admin AI Rewards',
    },
    summary: {
      en: 'Consolidated Leaderboard, Language, Profile DP upload, Updates Changelog & Admin UI Studio inside Account & Services; added Founder Pick sticker toggle, anonymous Top-3 Demand Bar Chart, and Admin Top-10 Buyers Profit & AI Coupon Studio.',
      hi: 'लीडरबोर्ड, भाषा, कस्टमर फोटो DP, अपडेट हिस्ट्री व एडमिन UI स्टूडियो अब एक साफ अकाउंट सेंटर में; Founder Pick स्टिकर स्विच, बिना मोबाइल नंबर टॉप-3 चार्ट और एडमिन टॉप-10 प्रॉफिट व AI रिवॉर्ड सुविधा।',
      mr: 'लीडरबोर्ड, भाषा, प्रोफाईल DP, अपडेट इतिहास व अ‍ॅडमिन स्टुडिओ एकाच खाते केंद्रात; स्टिकर नियंत्रण, गोपनीय टॉप-३ चार्ट आणि अ‍ॅडमिन टॉप-१० नफा व AI कूपन स्टुडिओ.',
      hinglish: 'Leaderboard, Language, Profile DP, Updates & Admin UI Studio ab Account Center ke andar; Founder Pick switch, private Top-3 chart aur Admin Top-10 Profit & AI Reward Studio.',
    },
    features: [
      {
        en: 'Account & Services Hub: Upload your own Profile Photo DP (Gallery/Camera), switch 18 languages, open Society Leaderboard, view Version Changelog, and access Admin-locked Storefront UI & Brand controls',
        hi: 'अकाउंट व सर्विसेज़ हब: ग्राहक अपनी फोटो DP लगा सकते हैं, 18 भाषाएँ बदलें, लीडरबोर्ड व अपडेट हिस्ट्री देखें, और केवल एडमिन के लिए UI व ब्रांड कंट्रोल लॉक सुरक्षित',
        mr: 'खाते केंद्र: ग्राहकांचा DP फोटो, १८ भाषा, लीडरबोर्ड, आवृत्ती इतिहास आणि केवळ अ‍ॅडमिनसाठी लॉक केलेले UI व ब्रँड नियंत्रण',
        hinglish: 'Account & Services: Gallery/Camera se apni Profile DP lagayein, Leaderboard/Language/Updates ek jagah aur UI control sirf Admin-locked',
      },
      {
        en: 'Public Rank #1, #2 & #3 Live Group Demand Chart showing ONLY buyer first name & volume (mobile number strictly hidden) + Admin toggle for MARCO 100 Founder Pick product sticker',
        hi: 'लाइव ग्रुप डिमांड में बिना मोबाइल नंबर #1, #2, #3 सबसे ज्यादा खरीदने वालों का चार्ट और एडमिन के लिए MARCO 100 Founder Pick स्टिकर ON/OFF बटन',
        mr: 'लाइव्ह ग्रुप डिमांडमध्ये फोन नंबर लपवून फक्त पहिल्या नावासह #१, #२, #३ चार्ट आणि अ‍ॅडमिनसाठी स्टिकर ON/OFF स्विच',
        hinglish: 'Live Group Demand me #1, #2, #3 buyers chart (sirf First Name, mobile number hidden) aur Admin ko Founder Pick sticker ON/OFF button',
      },
      {
        en: 'Admin Top-10 Buyers & Profit Studio: Track Daily, Weekly, Monthly & Yearly customer volume, savings, and net profit, expand #11+ history, and send Direct Discounts or Surprise Gifts using Gemini AI',
        hi: 'एडमिन टॉप-10 खरीददार व मुनाफा चार्ट: रोज़ाना, साप्ताहिक, मासिक व सालाना खरीद, ग्राहक बचत व एडमिन प्रॉफिट देखें और Gemini AI से कूपन या सरप्राइज़ गिफ्ट तुरंत भेजें',
        mr: 'अ‍ॅडमिन टॉप-१० ग्राहक व नफा स्टुडिओ: दैनिक, साप्ताहिक, मासिक व वार्षिक खरेदी, नफा पहा आणि Gemini AI ने थेट सवलत किंवा सरप्राइज भेट पाठवा',
        hinglish: 'Admin Top-10 Buyers Chart: Daily/Weekly/Monthly/Yearly kharidari, savings & net profit dekhein aur Gemini AI se direct discount ya surprise gift bhejein',
      },
    ],
    fixes: [
      {
        en: 'Removed small green dot beside customer name in Account & Services and synced global UI/festival changes immediately across all connected devices',
        hi: 'अकाउंट में नाम के पास दिखने वाला छोटा हरा डॉट हटाया गया और सभी ग्राहकों के लिए UI व त्यौहार थीम लाइव सिंक की गई',
        mr: 'खात्यातील नावासमोरचा लहान हिरवा बिंदू काढला आणि सर्व उपकरणांवर UI थीम त्वरित सिंक केली',
        hinglish: 'Account me naam ke aage green dot hataya gaya aur Admin ki UI/festival setting sabhi customers par live sync hoti hai',
      },
    ],
  },
  {
    version: '5.5.0',
    releaseId: '5.5.0-live',
    releasedAt: '2026-11-20',
    headline: {
      en: 'Festival Themes, Dynamic Logo, Conversational AI Designer & Clean Account UI',
      hi: 'त्यौहार थीम, बदलता ऐप लोगो, बातचीत वाला AI स्टूडियो और सरल अकाउंट डिज़ाइन',
      mr: 'सण थीम, बदलणारा अ‍ॅप लोगो, AI डिझायनर व सुटसुटीत खाते दृश्य',
      hinglish: 'Festival Themes, Dynamic Logo, AI Designer & Clean Account UI',
    },
    summary: {
      en: 'Separate admin controls for UI Samples & Festival Themes with automatic Logo switching, Gemini AI conversational theme/logo studio, clean Referral/Account layouts, and 100% real-data cleanup.',
      hi: 'एडमिन के लिए अलग UI सैंपल व त्यौहार/विशेष दिन थीम कंट्रोल, त्योहार अनुसार ऐप लोगो बदलाव, AI चैट डिज़ाइनर, सही रेफ़रल भाषा सिंक और नकली टेस्ट डेटा की पूर्ण सफाई।',
      mr: 'अ‍ॅडमिनसाठी स्वतंत्र UI नमुने व सण थीम नियंत्रण, बदलणारा लोगो, AI चॅट डिझायनर आणि स्वच्छ रेफरल/खाते रचना.',
      hinglish: 'Admin ke liye alag UI Samples + Festival Themes, dynamic logo switching, conversational AI Studio, clean Account/Referral UI aur real-only data.',
    },
    features: [
      {
        en: 'Admin Storefront Studio: Switch UI Samples 1, 2 & 3 independently and activate Diwali, Holi, Ganesh, Navratri, Tiranga, Eid, Sankranti, or Harvest themes with matching vector App Logos',
        hi: 'एडमिन स्टोरफ्रंट स्टूडियो: UI सैंपल 1, 2 व 3 अलग से बदलें और दिवाली, होली, गणेश उत्सव, नवरात्रि, तिरंगा, ईद या विशेष दिन की थीम व लोगो लागू करें',
        mr: 'अ‍ॅडमिन स्टुडिओ: UI नमुने व दिवाळी, होळी, गणेशोत्सव सण थीम्स व लोगो त्वरित लागू करा',
        hinglish: 'Admin Studio: UI Samples 1-2-3 aur Festival/Special Day themes + matching App Logo 1 click me badlein',
      },
      {
        en: 'Conversational AI Theme & Logo Studio: Chat in Hindi, Hinglish, or English to design custom festive banners, surface colors & safe custom SVG logos',
        hi: 'बातचीत वाला AI थीम व लोगो स्टूडियो: हिंदी, हिंग्लिश या अंग्रेज़ी में बोलकर/लिखकर नया बैनर, रंग और कस्टम लोगो बनवाएँ',
        mr: 'AI चॅट डिझायनर: हिंदी, हिंग्लिश किंवा इंग्रजीतून संवाद साधून नवीन थीम व लोगो तयार करा',
        hinglish: 'Conversational AI Studio: Hindi/Hinglish/English me chat karke custom festival theme & SVG logo banwayein',
      },
      {
        en: 'Streamlined Account & Header Navigation: Modern vector Brand Logo, duplicate header account pill removed, and clean 2x2 quick service tiles',
        hi: 'सरल अकाउंट और साफ नेविगेशन बार: नया आधुनिक ब्रांड लोगो, ऊपर से दोहरा अकाउंट पिल हटाया गया और 2x2 मुख्य सेवा कार्ड',
        mr: 'सुटसुटीत खाते व नेव्हिगेशन: नवीन ब्रँड लोगो आणि २x२ जलद सेवा टाइल्स',
        hinglish: 'Streamlined Account & Navbar: Naya Brand Logo, duplicate top account pill hataya gaya aur clean 2x2 tiles',
      },
    ],
    fixes: [
      {
        en: 'Synchronized Referral Dashboard & Manager across Hinglish, Hindi, Marathi & English with zero hardcoded fallbacks',
        hi: 'रेफ़रल डैशबोर्ड व एडमिन रेफ़रल पेज को हिंग्लिश, हिंदी, मराठी और अंग्रेज़ी के अनुसार पूरी तरह ठीक किया गया',
        mr: 'रेफरल डॅशबोर्ड आणि अ‍ॅडमिन विभाग सर्व भाषांमध्ये अचूक सिंक केला',
        hinglish: 'Referral Dashboard & Admin Manager ko Hinglish/Hindi/English me poori tarah sync kiya gaya',
      },
      {
        en: 'Purged all demo/test records across Leaderboard & Referrals and hardened Admin Google OAuth + RBAC checks',
        hi: 'लीडरबोर्ड व रेफ़रल से सभी टेस्ट/नकली रिकॉर्ड हटाए गए और केवल एडमिन के लिए UI कंट्रोल सुरक्षा सख्त की गई',
        mr: 'लीडरबोर्ड व रेफरलमधील सर्व टेस्ट डेटा काढला आणि अ‍ॅडमिन सुरक्षा कडक केली',
        hinglish: 'Leaderboard aur Referrals se sabhi fake/test records hataye aur Admin-only UI control lock mazboot kiya',
      },
    ],
  },
  {
    version: '5.4.0',
    releaseId: '5.4.0-live',
    releasedAt: '2026-11-19',
    headline: {
      en: 'Smart Live Updates, What’s New Pop-Up & Account Changelog',
      hi: 'स्मार्ट लाइव अपडेट, व्हाट्स न्यू पॉप-अप और अकाउंट चेंजलॉग',
      mr: 'स्मार्ट थेट अपडेट, नवीन बदल पॉप-अप आणि खाते चेंजलॉग',
      hinglish: 'Smart Live Updates, What’s New Pop-Up aur Account Changelog',
    },
    summary: {
      en: 'Reliable release pop-up alerts, automatic clearing of update badges after updating, compact account header, and protected order records.',
      hi: 'नए वर्ज़न पर तुरंत अपडेट पॉप-अप, अपडेट के बाद अपडेट बटन हटना, छोटा अकाउंट हेडर और सुरक्षित ऑर्डर रिकॉर्ड।',
      mr: 'नवीन आवृत्तीवर त्वरित अपडेट पॉप-अप, अपडेटनंतर हायलाइट काढणे आणि सुरक्षित ऑर्डर इतिहास.',
      hinglish: 'New version par turant What’s New pop-up, update ke baad highlight clear aur safe order records.',
    },
    features: [
      {
        en: 'Automatic Update Pop-Up showing full "What’s New" notes with one-tap Update Now',
        hi: 'नया अपडेट आने पर पूरा "क्या बदला है" पॉप-अप और एक-टैप Update Now बटन',
        mr: 'नवीन अपडेट आल्यावर संपूर्ण "काय बदलले" पॉप-अप आणि एक-टॅप Update Now बटण',
        hinglish: 'New update aane par automatic "What’s New" pop-up aur 1-tap Update Now button',
      },
      {
        en: 'Updates & Version History panel inside Account section with live Up-to-Date verification',
        hi: 'अकाउंट सेक्शन में वर्ज़न इतिहास व फीचर बदलाव पैनल — तुरंत जांचें कौन-सा अपडेट सक्रिय है',
        mr: 'खाते विभागात आवृत्ती इतिहास आणि नवीन बदलांची यादी — थेट पडताळणीसह',
        hinglish: 'Account section me Updates & Version History panel + instant Check for Updates',
      },
      {
        en: 'Compact Account Identity pill (name & status dot on top bar; address opens cleanly on tap)',
        hi: 'हेडर व अकाउंट में छोटा नाम पिल — टैप करने पर अंदर पूरा पता व फोन दिखेगा',
        mr: 'हेडर व खात्यात सुटसुटीत नाव — टॅप केल्यावर पत्ता आणि फोन दिसेल',
        hinglish: 'Header & Account me compact name bar — tap karne par address aur phone dikhega',
      },
    ],
    fixes: [
      {
        en: 'Cleared lingering update highlights & Service Worker cache loops immediately after updating',
        hi: 'अपडेट पूरा होने के बाद बार-बार दिखने वाला Update बटन और हाइलाइट पूरी तरह ठीक किया गया',
        mr: 'अपडेट पूर्ण झाल्यानंतर पुन्हा दिसणारे Update हायलाइट पूर्णपणे काढले',
        hinglish: 'Update complete hone ke baad highlight aur Update badge cleanly remove hota hai',
      },
      {
        en: 'Fixed Admin panel language labels to stay cleanly synced with English / Hinglish / Hindi',
        hi: 'एडमिन पैनल में भाषा बदलने (English/Hinglish/Hindi) पर अटके हिंदी शब्दों को ठीक किया गया',
        mr: 'अ‍ॅडमिन पॅनेलमधील भाषा निवड अचूकपणे सिंक केली',
        hinglish: 'Admin panel ke English / Hinglish labels ka language sync fix kiya gaya',
      },
      {
        en: 'Protected customer order history against accidental or unauthorized deletion',
        hi: 'ग्राहकों के पुराने ऑर्डर रिकॉर्ड डिलीट होने से पूरी तरह सुरक्षित किए गए',
        mr: 'ग्राहकांचे जुने ऑर्डर रेकॉर्ड डिलीट होण्यापासून पूर्ण सुरक्षित केले',
        hinglish: 'Customer order history delete hone se strictly protect ki gayi hai',
      },
    ],
  },
  {
    version: '5.3.0',
    releaseId: '5.3.0-live',
    releasedAt: '2026-11-16',
    headline: {
      en: 'Admin Feature Master Switches, RBAC & Audit Logs',
      hi: 'एडमिन मास्टर फीचर टॉगल, सुरक्षा नियम व ऑडिट लॉग',
      mr: 'अ‍ॅडमिन मास्टर फीचर नियंत्रण, RBAC व ऑडिट लॉग',
      hinglish: 'Admin Master Feature Controls, RBAC aur Audit Logs',
    },
    summary: {
      en: 'Granular admin switches to enable/disable customer sections anytime alongside role-based access control.',
      hi: 'एडमिन के लिए हर कस्टमर फीचर बंद/चालू करने के बटन और सख्त सुरक्षा लॉग।',
      mr: 'प्रत्येक ग्राहक सुविधा चालू/बंद करण्याची सोय आणि सुरक्षित ऑडिट लॉग.',
      hinglish: 'Admin ke paas har store feature ON/OFF karne ka master control aur audit logs.',
    },
    features: [
      {
        en: '21 Master Feature Toggles in Admin Console (YouTube videos, Voice AI, Suggestions, Referral & more)',
        hi: 'एडमिन कंसोल में 21 मास्टर फीचर टॉगल (YouTube वीडियो, वॉइस AI, बचत सुझाव आदि)',
        mr: 'अ‍ॅडमिन कंसोलमध्ये २१ मास्टर फीचर स्विच (YouTube व्हिडिओ, व्हॉइस AI, सूचना)',
        hinglish: 'Admin console me 21 master toggles (YouTube, Voice AI, Suggestions, Referral)',
      },
      {
        en: 'Strict Role-Based Access Control (RBAC) middleware & persistent Admin Audit Log viewer',
        hi: 'सख्त रोल-बेस्ड सुरक्षा (RBAC) और एडमिन गतिविधि ऑडिट लॉग',
        mr: 'कडक RBAC सुरक्षा आणि अ‍ॅडमिन क्रियाकलाप ऑडिट लॉग',
        hinglish: 'Strict RBAC security middleware aur live Admin Audit Logs',
      },
    ],
    fixes: [
      {
        en: 'Synced customer views immediately when admin toggles any store feature',
        hi: 'एडमिन द्वारा टॉगल बदलते ही कस्टमर स्क्रीन पर तुरंत असर दिखता है',
        mr: 'अ‍ॅडमिन स्विच बदलताच ग्राहक स्क्रीनवर त्वरित बदल दिसतो',
        hinglish: 'Admin toggle change karte hi customer UI turant update hota hai',
      },
    ],
  },
  {
    version: '5.2.0',
    releaseId: '5.2.0-live',
    releasedAt: '2026-11-12',
    headline: {
      en: 'Play-Store Style App Installer, GPS Auto-Fill & Clean Folder Structure',
      hi: 'प्ले-स्टोर जैसा ऐप इंस्टॉलर, सटीक GPS पता व स्वच्छ कोड ढांचा',
      mr: 'प्ले-स्टोर सारखा अ‍ॅप इन्स्टॉलर, अचूक GPS पत्ता आणि सुधारित रचना',
      hinglish: 'Play-Store Style App Installer, GPS Location Fix & Clean Architecture',
    },
    summary: {
      en: 'Guided standalone WebAPK installer flow with step-by-step permissions, privacy terms, and accurate GPS address lookup.',
      hi: 'बिना ब्राउज़र बार वाला ऐप इंस्टॉलर, अनुमतियों की स्पष्ट जानकारी और सटीक GPS लोकेशन फिल-अप।',
      mr: 'परवानग्यांसह थेट अ‍ॅप इन्स्टॉलर, गोपनीयता नियम आणि अचूक GPS पत्ता.',
      hinglish: 'Permission-based standalone app installer, Privacy Terms aur accurate GPS auto-fill.',
    },
    features: [
      {
        en: 'Standalone Mobile App Install wizard hiding browser bars with Privacy Policy & Terms',
        hi: 'अनुमतियों व गोपनीयता नियमों के साथ फुल-स्क्रीन मोबाइल ऐप इंस्टॉल विजार्ड',
        mr: 'गोपनीयता धोरण आणि परवानग्यांसह फुल-स्क्रीन मोबाईल अ‍ॅप इन्स्टॉलर',
        hinglish: 'Standalone Chrome bar-free install flow with Privacy Policy & Terms',
      },
      {
        en: '18-language voice ordering assistant & real-time mandi savings estimator',
        hi: '18 भाषाओं में बोलकर ऑर्डर करने वाला असिस्टेंट और लाइव बचत कैलकुलेटर',
        mr: '१८ भाषांमधील व्हॉइस ऑर्डर सहाय्यक आणि थेट बचत अंदाज',
        hinglish: 'Voice ordering assistant + batch savings calculator',
      },
    ],
    fixes: [
      {
        en: 'Resolved GPS location detection so coordinates reliably auto-fill street & PIN address',
        hi: 'GPS लोकेशन से पता और पिनकोड अपने-आप भरने की समस्या हल की गई',
        mr: 'GPS परवानगीनंतर पत्ता व पिनकोड अचूक भरला जाण्याची खात्री केली',
        hinglish: 'GPS permission ke baad street & PIN address auto-fill issue fix kiya gaya',
      },
    ],
  },
];

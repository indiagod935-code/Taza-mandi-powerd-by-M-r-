import { ProduceItem, AppLanguage } from '../types';
import { pickLang } from './i18nHelper';

export interface ProduceHealthBenefits {
  headline: string;
  benefits: string[];
  bestFor: string;
  nutrients: string;
}

interface HealthRecord {
  headline: Record<'en' | 'hi' | 'mr' | 'hinglish', string>;
  benefits: Record<'en' | 'hi' | 'mr' | 'hinglish', string[]>;
  bestFor: Record<'en' | 'hi' | 'mr' | 'hinglish', string>;
  nutrients: string;
}

function resolveBenefitText(
  map: Record<'en' | 'hi' | 'mr' | 'hinglish', string>,
  lang: AppLanguage
): string {
  return pickLang(lang, map);
}

function resolveBenefitList(
  map: Record<'en' | 'hi' | 'mr' | 'hinglish', string[]>,
  lang: AppLanguage
): string[] {
  if (lang === 'hi') return map.hi;
  if (lang === 'mr') return map.mr;
  if (lang === 'hinglish') return map.hinglish;
  if (lang === 'en') return map.en;
  return map.hi || map.en;
}

const SPECIFIC_HEALTH_BENEFITS: Record<string, HealthRecord> = {
  veg_tomato: {
    headline: {
      en: 'Heart, Skin Glow & Lycopene Shield',
      hi: 'दिल की सेहत, चमकती त्वचा और इम्यूनिटी बूस्ट',
      mr: 'हृदयाचे आरोग्य, तजेलदार त्वचा व रोगप्रतिकारशक्ती',
      hinglish: 'Dil ki sehat, skin glow aur immunity ke liye best',
    },
    benefits: {
      en: [
        'Rich in Lycopene antioxidant that supports heart health',
        'High Vitamin C boosts natural immunity and collagen glow',
        'Supports healthy blood pressure with natural potassium',
      ],
      hi: [
        'लाइकोपीन एंटीऑक्सीडेंट दिल और कोशिकाओं की रक्षा करता है',
        'विटामिन-C से रोग प्रतिरोधक क्षमता और त्वचा में निखार आता है',
        'पोटैशियम ब्लड प्रेशर और पाचन को संतुलित रखता है',
      ],
      mr: [
        'लायकोपीन अँटिऑक्सिडंट हृदयाचे आरोग्य उत्तम ठेवते',
        'व्हिटॅमिन-C मुळे रोगप्रतिकारशक्ती व त्वचेवर तेज येते',
        'पोटॅशियम रक्तदाब संतुलित ठेवण्यास मदत करते',
      ],
      hinglish: [
        'Lycopene antioxidant heart health ko strong rakhta hai',
        'Vitamin-C se immunity aur skin glow badhta hai',
        'Potassium BP balance aur digestion me madad karta hai',
      ],
    },
    bestFor: {
      en: 'Daily curries, fresh salads, detox soups',
      hi: 'दैनिक सब्ज़ी, सलाद व सूप के लिए श्रेष्ठ',
      mr: 'रोजची भाजी, सॅलड आणि सूपसाठी उत्तम',
      hinglish: 'Daily sabzi, salad aur soup ke liye best',
    },
    nutrients: 'Vitamin C · Lycopene · Potassium',
  },
  root_potato: {
    headline: {
      en: 'Clean Everyday Energy & Gut Potassium',
      hi: 'तुरंत ऊर्जा, पोटैशियम और हल्का सुपाच्य आहार',
      mr: 'झटपट ऊर्जा, पोटॅशियम व पचनास हलका आहार',
      hinglish: 'Instant energy, potassium aur kids ka favorite fuel',
    },
    benefits: {
      en: [
        'Complex carbs fuel active kids and busy mornings steadily',
        'Rich in Potassium & Vitamin B6 for muscle recovery',
        'Gentle on sensitive stomachs when boiled or lightly roasted',
      ],
      hi: [
        'बच्चों व परिवार को दिनभर के लिए संतुलित ऊर्जा देता है',
        'पोटैशियम और विटामिन B6 मांसपेशियों को ताकत देते हैं',
        'उबालकर या कम तेल में खाने पर पेट के लिए बहुत हल्का',
      ],
      mr: [
        'मुलांना व कुटुंबाला दिवसभर ऊर्जा देते',
        'पोटॅशियम व व्हिटॅमिन B6 स्नायूंना बळकटी देतात',
        'उकडलेले बटाटे पचनास अत्यंत हलके असतात',
      ],
      hinglish: [
        'Kids aur family ko din bhar ki active energy deta hai',
        'Potassium aur Vitamin B6 muscles ke liye achha hai',
        'Kam tel me banaane par pet ke liye halka rehta hai',
      ],
    },
    bestFor: {
      en: 'Kids tiffin, paratha, light boiled meals',
      hi: 'बच्चों का टिफिन, पराठा व सादा भोजन',
      mr: 'मुलांचा डबा, पराठा व रोजचा आहार',
      hinglish: 'Kids tiffin, paratha aur daily meals',
    },
    nutrients: 'Vitamin B6 · Potassium · Clean Carbs',
  },
  root_onion: {
    headline: {
      en: 'Natural Prebiotic, Blood Sugar & Heart Guard',
      hi: 'गट हेल्थ (प्रीबायोटिक), लू से बचाव व दिल की सुरक्षा',
      mr: 'पचनशक्ती, उष्णतेपासून बचाव आणि हृदय रक्षक',
      hinglish: 'Gut health, summer cooling aur heart support',
    },
    benefits: {
      en: [
        'Quercetin antioxidant helps control inflammation and cholesterol',
        'Natural prebiotic fibers nourish healthy gut bacteria',
        'Keeps body cool in Indian heat when eaten fresh with meals',
      ],
      hi: [
        'क्वेर्सेटिन एंटीऑक्सीडेंट कोलेस्ट्रॉल व सूजन कम करने में मददगार',
        'प्रीबायोटिक फाइबर आंतों व पाचन तंत्र को मजबूत बनाता है',
        'गर्मियों में कच्चा सलाद खाने से लू व गर्मी से राहत मिलती है',
      ],
      mr: [
        'क्वेर्सेटिन घटक कोलेस्ट्रॉल नियंत्रित ठेवतो',
        'फायबरमुळे पचनक्रिया व आतड्यांचे आरोग्य सुधारते',
        'उन्हाळ्यात कच्चा कांदा उष्णतेपासून संरक्षण देतो',
      ],
      hinglish: [
        'Quercetin cholesterol aur inflammation kam karta hai',
        'Prebiotic fiber digestion ko strong banata hai',
        'Garmiyon me body ko cool rakhne me madadgaar',
      ],
    },
    bestFor: {
      en: 'Everyday tadka, kachumber salad, immunity boost',
      hi: 'तड़का, कचुंबर सलाद व गर्मियों में बचाव',
      mr: 'फोडणी, कोशिंबीर आणि उन्हाळी आहार',
      hinglish: 'Tadka, kachumber salad aur immunity',
    },
    nutrients: 'Quercetin · Prebiotic Fiber · Vitamin B6',
  },
  veg_bitter_gourd: {
    headline: {
      en: 'Blood Sugar Balance, Liver Detox & Clear Skin',
      hi: 'शुगर कंट्रोल, लिवर डिटॉक्स व खून साफ़ करने में अचूक',
      mr: 'मधुमेह नियंत्रण, लिव्हर डिटॉक्स आणि रक्तशुद्धी',
      hinglish: 'Blood sugar control, liver detox aur skin clear rakhe',
    },
    benefits: {
      en: [
        'Charantin & Polypeptide-P naturally help manage blood glucose',
        'Purifies blood and supports healthy liver enzyme function',
        'High fiber & low calories aid weight and digestion goals',
      ],
      hi: [
        'चैरेन्टिन और पॉलीपेप्टाइड-P डायबिटीज़ व शुगर को नियंत्रित रखते हैं',
        'खून साफ़ कर त्वचा के दाग-धब्बों व लिवर की गर्मी को कम करता है',
        'कम कैलोरी व हाई फाइबर वजन घटाने में बेहद असरदार',
      ],
      mr: [
        'रक्तातील साखर नैसर्गिकरीत्या नियंत्रित ठेवण्यास मदत करते',
        'रक्त शुद्ध करून लिव्हरचे कार्य सुधारते',
        'कमी कॅलरी आणि उच्च फायबरमुळे वजन नियंत्रणात राहते',
      ],
      hinglish: [
        'Natural compounds blood sugar balance karne me best hai',
        'Blood purify karke liver aur skin ko clean rakhta hai',
        'Low calorie aur high fiber se weight control me madad',
      ],
    },
    bestFor: {
      en: 'Diabetic diet, morning detox juice, stuffed karela',
      hi: 'डायबिटीज़ डाइट, सुबह का जूस व भरवां करेला',
      mr: 'मधुमेह आहार, सकाळचा रस आणि भरलेली कारली',
      hinglish: 'Diabetic diet, morning juice aur bharwa karela',
    },
    nutrients: 'Charantin · Vitamin C · Iron · Fiber',
  },
  veg_bottle_gourd: {
    headline: {
      en: '92% Hydration, Acidity Relief & Weight Lightness',
      hi: 'पेट की ठंडक, एसिडिटी में राहत व वजन घटाने के लिए उत्तम',
      mr: 'पोटातील जळजळ शमवते, हायड्रेशन व वजन कमी करण्यास उत्तम',
      hinglish: 'Pet ki thandak, acidity relief aur weight loss me best',
    },
    benefits: {
      en: [
        'Over 92% natural water cools acidity and digestive heat',
        'Very light on stomach for elders, kids & heart patients',
        'Low sodium & zero cholesterol keeps heart and BP calm',
      ],
      hi: [
        '92% पानी होने से एसिडिटी, गैस और पेट की जलन तुरंत शांत करता है',
        'बुजुर्गों, बच्चों व हृदय रोगियों के लिए सबसे सुपाच्य सब्ज़ी',
        'कम कैलोरी व ज़ीरो कोलेस्ट्रॉल से दिल व वजन स्वस्थ रहता है',
      ],
      mr: [
        '९२% पाण्याचे प्रमाण आम्लपित्त व जळजळ शांत करते',
        'लहान मुले, ज्येष्ठ नागरिक व रुग्णांसाठी अत्यंत पचायला हलकी',
        'कमी कॅलरीजमुळे वजन व हृदय निरोगी राहते',
      ],
      hinglish: [
        '92% water content acidity aur gas ko shant karta hai',
        'Elders, kids aur heart care ke liye sabse light sabzi',
        'Low calorie se weight loss aur BP calm rehta hai',
      ],
    },
    bestFor: {
      en: 'Heart care, summer lunch, detox juice, elders meal',
      hi: 'गर्मियों का हल्का भोजन, बुजुर्गों व डाइट के लिए श्रेष्ठ',
      mr: 'दुपारचे हलके जेवण, ज्येष्ठ व हृदयरोग्यांसाठी उत्तम',
      hinglish: 'Summer lunch, heart care aur morning juice',
    },
    nutrients: '92% Water · Vitamin C · Soluble Fiber',
  },
  veg_ridge_gourd: {
    headline: {
      en: 'Digestion Booster, Liver Cooling & Eye Health',
      hi: 'आसान पाचन, आंखों की रोशनी और कब्ज़ से छुटकारा',
      mr: 'सुलभ पचन, डोळ्यांचे आरोग्य व पोटातील थंडावा',
      hinglish: 'Easy digestion, liver cooling aur gut light rakhe',
    },
    benefits: {
      en: [
        'Natural cellulose fiber clears constipation gently',
        'Low glycemic index supports steady blood sugar',
        'Beta-carotene and iron boost hemoglobin & eye health',
      ],
      hi: [
        'प्राकृतिक फाइबर कब्ज़ दूर कर पेट को बिल्कुल हल्का रखता है',
        'लो ग्लाइसेमिक इंडेक्स डायबिटीज़ व कोलेस्ट्रॉल में सुरक्षित है',
        'आयरन व बीटा-कैरोटीन आंखों व खून बढ़ाने में सहायक',
      ],
      mr: [
        'नैसर्गिक फायबरमुळे बद्धकोष्ठता दूर होते',
        'मधुमेह व कोलेस्ट्रॉल नियंत्रणासाठी सुरक्षित भाजी',
        'लोह आणि बीटा-कॅरोटीन डोळे व हिमोग्लोबिनसाठी उत्तम',
      ],
      hinglish: [
        'Natural fiber se kabz door hoti hai aur pet light rehta hai',
        'Low GI hone se sugar aur heart ke liye safe',
        'Iron aur vitamins se aankhein aur khoon majboot hota hai',
      ],
    },
    bestFor: {
      en: 'Light dinner, post-recovery meals, senior nutrition',
      hi: 'रात के हल्के भोजन व पाचन सुधार के लिए श्रेष्ठ',
      mr: 'रात्रीचे हलके जेवण व पचन सुधारण्यासाठी उत्तम',
      hinglish: 'Light dinner aur daily pet ki sehat ke liye',
    },
    nutrients: 'Dietary Fiber · Vitamin A · Iron',
  },
  veg_sponge_gourd: {
    headline: {
      en: 'Soft Gut Soother, Hydration & Natural Blood Cleanser',
      hi: 'बेहद मुलायम, पेट को ठंडक व त्वचा निखारने वाली सब्ज़ी',
      mr: 'पचायला हलकी, रक्ताचे शुद्धीकरण आणि त्वचेसाठी उत्तम',
      hinglish: 'Soft digestion, skin detox aur garmi me thandak',
    },
    benefits: {
      en: [
        'Gentle soft fiber ideal for stomach recovery & seniors',
        'Hydrates body tissues and reduces internal heat',
        'Supports clean skin & balanced lipid profile',
      ],
      hi: [
        'मुलायम फाइबर पेट खराब या कमज़ोरी में आसानी से पचता है',
        'शरीर को नमी देकर पित्त व एसिडिटी को कम करती है',
        'कम वसा के कारण कोलेस्ट्रॉल व वजन नियंत्रण में मददगार',
      ],
      mr: [
        'आजारातून बरे होताना व ज्येष्ठांसाठी अत्यंत सौम्य भाजी',
        'शरीरातील अतिरिक्त उष्णता व पित्त कमी करते',
        'रक्त शुद्ध करून त्वचा निरोगी ठेवते',
      ],
      hinglish: [
        'Soft fiber pet aur seniors ke liye easily digestible hai',
        'Body ki garmi aur pitta kam karti hai',
        'Cholesterol free aur weight friendly sabzi',
      ],
    },
    bestFor: {
      en: 'Quick homestyle dal/sabzi, seniors, recovery diet',
      hi: 'सादा घर का खाना, बुजुर्ग व पेट की राहत के लिए',
      mr: 'घरगुती जेवण, आजारी व ज्येष्ठांसाठी सर्वोत्तम',
      hinglish: 'Homestyle dinner, seniors aur gut rest',
    },
    nutrients: 'Water · Vitamin C · Folate · Magnesium',
  },
  veg_snake_gourd: {
    headline: {
      en: 'Body Detox, Fever Recovery & Bone Minerals',
      hi: 'शरीर की अंदरूनी सफाई, हड्डियों की मजबूती व शुगर नियंत्रण',
      mr: 'शरीर शुद्धीकरण, हाडांची मजबुती व थंडावा',
      hinglish: 'Detox, fever recovery aur bones ke liye minerals',
    },
    benefits: {
      en: [
        'Traditional cooling vegetable that aids liver & gut detox',
        'Contains calcium, magnesium & phosphorus for bone strength',
        'Low-calorie fiber helps regulate blood sugar naturally',
      ],
      hi: [
        'पारंपरिक ठंडी सब्ज़ी जो बुखार या गर्मी के बाद शरीर को संतुलित करती है',
        'कैल्शियम व फॉस्फोरस हड्डियों और दांतों को मजबूत रखते हैं',
        'फाइबर से भरपूर होने के कारण शुगर और वजन नियंत्रण में मददगार',
      ],
      mr: [
        'उष्णता व थकवा दूर करून शरीर डिटॉक्स करते',
        'कॅल्शियम व फॉस्फरस हाडांना बळकटी देतात',
        'कमी कॅलरीज व फायबरमुळे रक्तातील साखर संतुलित राहते',
      ],
      hinglish: [
        'Body heat kam karke liver detox me help karti hai',
        'Calcium aur magnesium haddiyon ko strong banate hain',
        'Low-calorie fiber weight aur sugar balance rakhta hai',
      ],
    },
    bestFor: {
      en: 'Chana dal chichinda, stuffed stir-fry, light summer diet',
      hi: 'चने की दाल चिचिंडा व गर्मी के संतुलित भोजन के लिए',
      mr: 'डाळ पडवळ व उन्हाळी पचनासाठी उत्तम',
      hinglish: 'Chana dal sabzi aur healthy summer meal',
    },
    nutrients: 'Calcium · Magnesium · Fiber · Vitamin A',
  },
  veg_okra: {
    headline: {
      en: 'Prebiotic Mucilage, Bone Vitamin K & Brain Folate',
      hi: 'हड्डियों की मजबूती, पाचन व गर्भवती माताओं के लिए उत्तम',
      mr: 'हाडांचे आरोग्य, पचन आणि फोलेटचा उत्तम स्रोत',
      hinglish: 'Gut coating, strong bones aur brain health booster',
    },
    benefits: {
      en: [
        'Natural soluble mucilage lubricates gut & feeds good bacteria',
        'High Vitamin K & Folate support strong bones & healthy pregnancy',
        'Helps bind excess cholesterol cleanly in the digestive tract',
      ],
      hi: [
        'भिंडी का प्राकृतिक लस आंतों की सफाई व पाचन को बेहतर बनाता है',
        'विटामिन K और फोलेट हड्डियों व दिमागी विकास के लिए ज़रूरी',
        'कोलेस्ट्रॉल व ब्लड शुगर को नियंत्रित करने में सहायक',
      ],
      mr: [
        'भेंडीतील नैसर्गिक चिकटावा आतड्यांचे आरोग्य सुधारतो',
        'व्हिटॅमिन K व फोलेट हाडे व मेंदूच्या विकासासाठी उत्तम',
        'कोलेस्ट्रॉल आणि साखर नियंत्रित ठेवण्यास मदत करते',
      ],
      hinglish: [
        'Natural fiber gut ko smooth aur healthy rakhta hai',
        'Vitamin K aur folate haddiyon aur brain ke liye best',
        'Cholesterol kam karne me helpful',
      ],
    },
    bestFor: {
      en: 'Kids tiffin, growing teens, bone & gut health',
      hi: 'बच्चों का टिफिन, हड्डियों व पेट की सेहत के लिए',
      mr: 'मुलांचा डबा, वाढती मुले आणि हाडांच्या आरोग्यासाठी',
      hinglish: 'Kids tiffin, growing kids aur daily lunch',
    },
    nutrients: 'Vitamin K · Folate · Soluble Fiber · Vitamin C',
  },
  veg_sweet_corn: {
    headline: {
      en: 'Eye-Protecting Lutein & Clean Sustained Energy',
      hi: 'आंखों की सुरक्षा (ल्यूटिन), फाइबर और तुरंत ताज़गी ऊर्जा',
      mr: 'डोळ्यांचे संरक्षण, फायबर व भरपूर ऊर्जा',
      hinglish: 'Eye protection, protein snack aur steady energy',
    },
    benefits: {
      en: [
        'Rich in Lutein & Zeaxanthin antioxidants for sharp vision',
        'Insoluble fiber improves bowel regularity and fullness',
        'Healthy whole-grain carbs + B-vitamins energize kids & athletes',
      ],
      hi: [
        'ल्यूटिन व ज़ियाज़ैंथिन आंखों की रोशनी व स्क्रीन से सुरक्षा करते हैं',
        'फाइबर से पेट लंबे समय तक भरा रहता है और कब्ज़ दूर होती है',
        'विटामिन B1 व प्राकृतिक ऊर्जा बच्चों के लिए हेल्दी स्नैक है',
      ],
      mr: [
        'ल्युटीनमुळे डोळ्यांचे आरोग्य व दृष्टी उत्तम राहते',
        'फायबरमुळे पोट भरलेले राहते व पचन सुधारते',
        'मुलांसाठी आरोग्यदायी व ऊर्जा देणारा स्नॅक',
      ],
      hinglish: [
        'Lutein aur zeaxanthin mobile screen se aankhon ko bachate hain',
        'Fiber se bhook control hoti hai aur digestion achha rehta hai',
        'Kids aur gym lovers ke liye healthy evening snack',
      ],
    },
    bestFor: {
      en: 'Steamed masala corn, soups, kids snack, salads',
      hi: 'उबले मसाला कॉर्न, सूप, सलाद व शाम का हेल्दी नाश्ता',
      mr: 'मसाला कॉर्न, सूप, सॅलड आणि मुलांचा खाऊ',
      hinglish: 'Masala corn chaat, soup aur kids evening snack',
    },
    nutrients: 'Lutein · Vitamin B1 · Insoluble Fiber',
  },
  veg_baby_corn: {
    headline: {
      en: 'Low-Carb Crunch, Folate & Heart-Safe Snack',
      hi: 'कम कैलोरी क्रंच, फोलेट व डाइट फ्रेंडली सुपरफूड',
      mr: 'कमी कार्ब्स, भरपूर फायबर व हृदयस्नेही भाजी',
      hinglish: 'Low calorie crunch, keto/weight-loss friendly',
    },
    benefits: {
      en: [
        'Much lower starch & calories than mature sweet corn',
        'Supports digestive health with tender soluble dietary fiber',
        'Contains Folate, Vitamin A & Potassium for steady energy',
      ],
      hi: [
        'पके भुट्टे की तुलना में बहुत कम स्टार्च और कैलोरी (वजन घटाने में बेस्ट)',
        'कोमल फाइबर से पाचन सुधरता है और कोलेस्ट्रॉल कम रहता है',
        'विटामिन A, आयरन व फोलेट शरीर को हल्का व ऊर्जावान रखते हैं',
      ],
      mr: [
        'पिकलेल्या मक्यापेक्षा कमी कॅलरी व स्टार्च असलेली भाजी',
        'मऊ फायबरमुळे पचनक्रिया सुधारते',
        'डाएट आणि हृदय आरोग्यासाठी उत्तम पर्याय',
      ],
      hinglish: [
        'Regular corn se bahut kam starch aur calories',
        'Weight loss aur gym diet ke liye best crispy veggie',
        'Folate aur Vitamin A se daily nutrition milta hai',
      ],
    },
    bestFor: {
      en: 'Stir-fry, weight-loss salads, crispy starters',
      hi: 'वजन घटाने वाले सलाद, स्टर-फ्राई व हेल्दी स्टार्टर',
      mr: 'वजन कमी करणारे सॅलड, स्टर-फाय व सूप',
      hinglish: 'Stir-fry, salads aur healthy starters',
    },
    nutrients: 'Low Calorie · Folate · Vitamin A · Fiber',
  },
  veg_french_beans: {
    headline: {
      en: 'Plant Protein, Bone Silicon & Chlorophyll Goodness',
      hi: 'हड्डियों के लिए सिलिकॉन, प्लांट प्रोटीन व शुगर फ्रेंडली',
      mr: 'हाडांसाठी सिलिकॉन, प्रथिने व हृदय रक्षक शेंगा',
      hinglish: 'Plant protein, bone strength aur zero cholesterol',
    },
    benefits: {
      en: [
        'Bio-available silicon & Vitamin K help maintain dense bones',
        'Low glycemic load + fiber keeps blood sugar stable',
        'Antioxidant flavonoids protect blood vessels cleanly',
      ],
      hi: [
        'विटामिन K व मिनरल्स हड्डियों व जोड़ों की मजबूती बढ़ाते हैं',
        'लो-शुगर व हाई-फाइबर डायबिटीज़ व डाइट के लिए बेहतरीन',
        'फ्लैवोनोइड्स दिल की नसों को स्वस्थ और लचीला रखते हैं',
      ],
      mr: [
        'व्हिटॅमिन K आणि मिनरल्स हाडांना बळकटी देतात',
        'मधुमेह व वजन कमी करण्यासाठी उपयुक्त शेंगा',
        'हृदय आणि रक्तवाहिन्यांचे आरोग्य जपते',
      ],
      hinglish: [
        'Vitamin K aur minerals haddiyon ko strong banate hain',
        'Sugar control aur weight-loss tiffin ke liye ideal',
        'Heart arteries ko clean aur healthy rakhti hai',
      ],
    },
    bestFor: {
      en: 'Pulao, dry aloo-beans tiffin, healthy stir-fry',
      hi: 'पुलाव, टिफिन की सूखी सब्ज़ी व हेल्दी वेजिटेबल बाउल',
      mr: 'पुलाव, टिफिनची भाजी व सॅलड',
      hinglish: 'Tiffin sabzi, pulao aur healthy meal prep',
    },
    nutrients: 'Vitamin K · Plant Protein · Silicon · Fiber',
  },
  veg_flat_beans: {
    headline: {
      en: 'High Plant Protein, Iron & Digestive Fiber',
      hi: 'देसी प्लांट प्रोटीन, आयरन व पेट को भरने वाला फाइबर',
      mr: 'भरपूर प्रथिने, लोह आणि पचन सुधारणारे फायबर',
      hinglish: 'Desi plant protein, iron aur blood sugar friendly',
    },
    benefits: {
      en: [
        'Rich source of vegetarian protein & slow-release carbs',
        'Iron and zinc fight fatigue and boost daily stamina',
        'High dietary fiber supports gut health and cholesterol control',
      ],
      hi: [
        'शाकाहारी भोजन में प्रोटीन व ताकत का बेहतरीन प्राकृतिक स्रोत',
        'आयरन व ज़िंक थकान दूर कर खून बढ़ाने में मदद करते हैं',
        'हाई फाइबर पेट को साफ व कोलेस्ट्रॉल को काबू में रखता है',
      ],
      mr: [
        'शाकाहारी आहारात प्रथिनांचा उत्तम नैसर्गिक स्रोत',
        'लोह व झिंक थकवा दूर करून ताकद वाढवतात',
        'भरपूर फायबरमुळे पचन व कोलेस्ट्रॉल नियंत्रणात राहते',
      ],
      hinglish: [
        'Vegetarian diet ke liye natural protein aur taqat',
        'Iron aur zinc thakan door kar stamina badhate hain',
        'High fiber digestion aur cholesterol control rakhta hai',
      ],
    },
    bestFor: {
      en: 'Gujarati Undhiyu, Vaal/Papdi sabzi, high-protein lunch',
      hi: 'उंधियू, पापड़ी की मसालेदार सब्ज़ी व प्रोटीन लंच',
      mr: 'उंधियू, पापडीची भाजी व प्रथिनयुक्त जेवण',
      hinglish: 'Undhiyu, papdi sabzi aur protein-rich lunch',
    },
    nutrients: 'Plant Protein · Iron · Zinc · Fiber',
  },
  veg_cowpea_pods: {
    headline: {
      en: 'Muscle-Building Protein, Folate & Heart Magnesium',
      hi: 'मांसपेशियों के लिए प्रोटीन, फोलेट व कोलेस्ट्रॉल नियंत्रण',
      mr: 'स्नायूंसाठी प्रथिने, फोलेट व हृदयासाठी मॅग्नेशियम',
      hinglish: 'Muscle protein, hemoglobin booster aur zero fat',
    },
    benefits: {
      en: [
        'High-protein green pods build strength without heavy fat',
        'Rich in Folate & Vitamin C for healthy blood cell formation',
        'Potassium & magnesium support calm heart rhythm',
      ],
      hi: [
        'बढ़ते बच्चों व शाकाहारियों के लिए हल्का और शुद्ध प्रोटीन स्रोत',
        'फोलेट व आयरन हीमोग्लोबिन और थकान को बेहतर बनाते हैं',
        'पोटैशियम व मैग्नीशियम हृदय व रक्तचाप के लिए लाभकारी',
      ],
      mr: [
        'वाढत्या मुलांसाठी व शाकाहारी लोकांसाठी उत्तम प्रथिने',
        'फोलेट व लोह हिमोग्लोबिन वाढवण्यास मदत करतात',
        'पोटॅशियम व मॅग्नेशियम हृदयाचे ठोके संतुलित ठेवतात',
      ],
      hinglish: [
        'Pure vegetarian protein bina extra fat ke',
        'Folate aur iron khoon badhane me madad karte hain',
        'Heart aur blood pressure ke liye beneficial',
      ],
    },
    bestFor: {
      en: 'Maharashtrian chawli bhaji, dal-tadka, daily tiffin',
      hi: 'चौलाई फली आलू सब्ज़ी व रोज़ाना टिफिन के लिए बेस्ट',
      mr: 'चवळीची भाजी, आमटी आणि टिफिनसाठी उत्तम',
      hinglish: 'Chawli aloo bhaji aur daily protein tiffin',
    },
    nutrients: 'Protein · Folate · Magnesium · Vitamin A',
  },
  veg_raw_banana: {
    headline: {
      en: 'Resistant Starch Prebiotic, Zero Sugar Spike & Gut Heal',
      hi: 'रेसिस्टेंट स्टार्च (गट हेल्थ), बिना शुगर बढ़ाए पाचन सुधार',
      mr: 'प्रिबायोटिक स्टार्च, पचन सुधारक व मधुमेहासाठी सुरक्षित',
      hinglish: 'Prebiotic gut healer, diabetes-safe & filling',
    },
    benefits: {
      en: [
        'Rich in Resistant Starch that acts as fuel for friendly gut flora',
        'Helps regulate loose stomach & supports stable blood sugar',
        'High Potassium & Vitamin B6 nourish heart and nerves',
      ],
      hi: [
        'रेसिस्टेंट स्टार्च पेट को आराम देता है व अच्छे बैक्टीरिया बढ़ाता है',
        'पके केले के विपरीत ब्लड शुगर नहीं बढ़ाता — डायबिटीज़ में सुरक्षित',
        'पोटैशियम व विटामिन B6 नसों व दिल की सेहत को मजबूत बनाते हैं',
      ],
      mr: [
        'पोटाच्या तक्रारी दूर करून चांगले बॅक्टेरिया वाढवते',
        'रक्तातील साखर न वाढवणारा सुरक्षित फायबर स्रोत',
        'पोटॅशियम व B6 हृदय आणि मज्जासंस्थेसाठी उत्तम',
      ],
      hinglish: [
        'Resistant starch gut health aur loose motion relief ke liye best',
        'Diabetes me safe kyunki isme sugar spike nahi hota',
        'Potassium aur Vitamin B6 nerves ko strong banate hain',
      ],
    },
    bestFor: {
      en: 'Kofta, upvas vrat sabzi, gut recovery meals',
      hi: 'कोफ़्ता, उपवास की सब्ज़ी व पेट आराम के भोजन में',
      mr: 'कच्च्या केळ्याचे काप, उपवास भाजी व पचनासाठी',
      hinglish: 'Kofta, vrat sabzi aur pet ki sehat ke liye',
    },
    nutrients: 'Resistant Starch · Potassium · Vitamin B6',
  },
  veg_yellow_chilli: {
    headline: {
      en: 'Gentle Digestive Heat, High Vitamin C & Sinus Clear',
      hi: 'हल्का तीखापन, भरपूर विटामिन-C व मेटाबॉलिज़्म बूस्टर',
      mr: 'सौम्य तिखटपणा, भरपूर व्हिटॅमिन-C व पचन सुधारक',
      hinglish: 'Mild heat, super-rich Vitamin C & digestion aid',
    },
    benefits: {
      en: [
        'Packed with Vitamin C & Beta-carotene for skin & immunity',
        'Mild Capsaicin gently stimulates digestion without burning stomach',
        'Rich fleshy skin helps clear mild sinus congestion',
      ],
      hi: [
        'संतरे से भी ज़्यादा विटामिन-C जो इम्यूनिटी और त्वचा को मजबूत करे',
        'कम तीखा होने से पेट में जलन किए बिना पाचन अग्नि जगाता है',
        'भरवां पकवान व अचार में स्वाद और एंटीऑक्सीडेंट बढ़ाती है',
      ],
      mr: [
        'भरपूर व्हिटॅमिन-C मुळे रोगप्रतिकारशक्ती मजबूत होते',
        'सौम्य तिखट असल्यामुळे जळजळ न होता पचन सुधारते',
        'लोणचे, भजी आणि भरलेल्या मिरचीसाठी सर्वोत्तम',
      ],
      hinglish: [
        'High Vitamin-C immunity aur skin glow badhata hai',
        'Mild heat pet me jalan kiye bina digestion boost karti hai',
        'Bharwa mirch, achar aur pakode ke liye healthy taste',
      ],
    },
    bestFor: {
      en: 'Bharwa mirch, achar, mirchi vada, mild tadka',
      hi: 'भरवां मिर्च, अचार, मिर्ची बड़ा व हल्का तड़का',
      mr: 'भरलेली मिरची, लोणचे व सौम्य फोडणी',
      hinglish: 'Bharwa mirch, achar aur mild tadka',
    },
    nutrients: 'Vitamin C (2x Citrus) · Beta-Carotene · Mild Capsaicin',
  },
  leafy_palak: {
    headline: {
      en: 'Plant Iron, Hemoglobin Support & Bone Calcium',
      hi: 'खून (हीमोग्लोबिन) बढ़ाने, आंखों व हड्डियों का सुपरफूड',
      mr: 'रक्तवाढ (हिमोग्लोबिन), डोळे व हाडांसाठी सुपरफूड',
      hinglish: 'Khoon badhane (Iron), eyes aur bones ka powerhouse',
    },
    benefits: {
      en: [
        'Natural plant iron & folate fight anemia and boost energy',
        'Lutein & Vitamin A shield eyesight cleanly',
        'Nitrate compounds support healthy blood circulation',
      ],
      hi: [
        'आयरन और फोलिक एसिड कमज़ोरी व खून की कमी (एनीमिया) दूर करते हैं',
        'विटामिन A और ल्यूटिन आंखों की रोशनी तेज़ बनाए रखते हैं',
        'प्राकृतिक नाइट्रेट्स रक्त संचार व मांसपेशियों की ताकत बढ़ाते हैं',
      ],
      mr: [
        'लोह व फॉलिक अ‍ॅसिडमुळे रक्ताची कमतरता (अ‍ॅनिमिया) दूर होते',
        'व्हिटॅमिन A आणि ल्युटीन डोळ्यांच्या आरोग्यासाठी उत्तम',
        'रक्ताभिसरण व स्नायूंची ताकद वाढवते',
      ],
      hinglish: [
        'Iron aur folate kamzori aur khoon ki kami door karte hain',
        'Vitamin A aur lutein eyesight sharp rakhte hain',
        'Blood flow aur stamina badhane me helpful',
      ],
    },
    bestFor: {
      en: 'Palak paneer, dal palak, green smoothies, kids diet',
      hi: 'दाल पालक, पालक पनीर, ग्रीन सूप व बच्चों की सेहत',
      mr: 'पालक पनीर, वरण पालक आणि मुलांचा आहार',
      hinglish: 'Dal palak, palak paneer aur green soup',
    },
    nutrients: 'Iron · Folate · Vitamin K · Vitamin A',
  },
  leafy_methi: {
    headline: {
      en: 'Natural Sugar Control, Joint Relief & Hair Strength',
      hi: 'शुगर कंट्रोल, जोड़ों के दर्द में आराम व पाचन शक्ति',
      mr: 'साखर नियंत्रण, सांधेदुखीवर आराम आणि केसांचे आरोग्य',
      hinglish: 'Diabetes control, joints care & hair/skin nutrition',
    },
    benefits: {
      en: [
        'Galactomannan soluble fiber slows sugar absorption steadily',
        'Traditional anti-inflammatory warmth soothes joint stiffness',
        'Rich in Vitamin K, Iron & Phyto-nutrients for hair vitality',
      ],
      hi: [
        'मेथी का फाइबर डायबिटीज़ व कोलेस्ट्रॉल को काबू में रखता है',
        'जोड़ों के दर्द और सूजन को कम करने में पारंपरिक रूप से उपयोगी',
        'आयरन व विटामिन बालों की जड़ों और पाचन को मजबूत बनाते हैं',
      ],
      mr: [
        'मेथीतील फायबर मधुमेह व कोलेस्ट्रॉल नियंत्रित ठेवतो',
        'सांधेदुखी आणि सूज कमी करण्यासाठी अत्यंत उपयुक्त',
        'लोह व जीवनसत्त्वे केस व पचनशक्ती सुधारतात',
      ],
      hinglish: [
        'Soluble fiber blood sugar aur cholesterol control rakhta hai',
        'Joint stiffness aur sardi ke dard me aram deti hai',
        'Iron aur vitamins hair roots ko strong banate hain',
      ],
    },
    bestFor: {
      en: 'Methi thepla, aloo methi, diabetic & winter wellness',
      hi: 'मेथी थेपला, आलू मेथी व डायबिटीज़ डाइट',
      mr: 'मेथीची भाजी, थेपले आणि मधुमेह आहार',
      hinglish: 'Methi thepla, aloo methi aur diabetic diet',
    },
    nutrients: 'Galactomannan Fiber · Iron · Vitamin K',
  },
  root_haldi: {
    headline: {
      en: 'Pure Curcumin Anti-Inflammatory & Immunity Shield',
      hi: 'शुद्ध करक्यूमिन: जोड़ों के दर्द, सर्दी व इम्यूनिटी का रक्षक',
      mr: 'शुद्ध कर्क्युमिन: सांधेदुखी, सर्दी व रोगप्रतिकारशक्ती रक्षक',
      hinglish: 'Natural Curcumin: immunity, joints & throat relief',
    },
    benefits: {
      en: [
        'Raw fresh curcumin offers much higher potency than old powder',
        'Calms joint inflammation, sore throat & seasonal cough',
        'Supports liver detoxification and glowing clear skin',
      ],
      hi: [
        'ताज़ी कच्ची हल्दी में पाउडर से कहीं ज़्यादा असरदार करक्यूमिन होता है',
        'जोड़ों के दर्द, खांसी-जुकाम व गले की खराश में अचूक आराम',
        'लिवर डिटॉक्स व त्वचा के निखार के लिए आयुर्वेदिक अमृत',
      ],
      mr: [
        'ताज्या ओल्या हळदीत कोरड्या पावडरपेक्षा अधिक औषधी गुणधर्म असतात',
        'सांधेदुखी, खोकला व घसादुखीवर उत्तम उपाय',
        'लिव्हर स्वच्छ करून त्वचेला नैसर्गिक तेज देते',
      ],
      hinglish: [
        'Powder se zyada fresh raw Curcumin milta hai',
        'Joints pain, khansi-zukam aur immunity ke liye best',
        'Liver detox aur clear glowing skin me madadgaar',
      ],
    },
    bestFor: {
      en: 'Haldi doodh (golden milk), kadha, immunity pickle',
      hi: 'हल्दी दूध, आयुर्वेदिक काढ़ा व इम्यूनिटी अचार',
      mr: 'हळदीचे दूध, काढा व हिवाळी लोणचे',
      hinglish: 'Haldi doodh, immunity kadha aur achar',
    },
    nutrients: 'Active Curcumin · Manganese · Antioxidants',
  },
  fruit_pomegranate: {
    headline: {
      en: 'Rapid Hemoglobin Builder, Heart Flow & Memory Boost',
      hi: 'खून (HB) तेज़ी से बढ़ाए, दिल व दिमाग को नई ताकत दे',
      mr: 'झटपट हिमोग्लोबिन वाढ, हृदय आणि मेंदूचे आरोग्य',
      hinglish: 'Fast Hemoglobin/HB booster, heart flow & stamina',
    },
    benefits: {
      en: [
        'Punicalagin antioxidants are 3x stronger than green tea',
        'Boosts blood hemoglobin levels & reduces physical fatigue',
        'Protects heart arteries and supports sharp memory',
      ],
      hi: [
        'कमज़ोरी, डेंगू रिकवरी व खून की कमी (HB) तेज़ी से दूर करता है',
        'दिल की धमनियों को ब्लॉक होने से बचाकर ब्लड फ्लो सुगम रखता है',
        'बच्चों व बुजुर्गों की याददाश्त व इम्यूनिटी बढ़ाता है',
      ],
      mr: [
        'अशक्तपणा व रक्ताची कमतरता झटपट भरून काढते',
        'हृदयाच्या रक्तवाहिन्या निरोगी व स्वच्छ ठेवते',
        'मुलांची स्मरणशक्ती व रोगप्रतिकारशक्ती वाढवते',
      ],
      hinglish: [
        'HB (khoon) tezi se badhata hai aur kamzori door karta hai',
        'Green tea se 3x zyada antioxidants heart ko protect karte hain',
        'Recovery aur memory boost ke liye super-fruit',
      ],
    },
    bestFor: {
      en: 'Morning fruit bowl, recovery nutrition, kids snack',
      hi: 'सुबह का नाश्ता, कमज़ोरी से रिकवरी व बच्चों के लिए',
      mr: 'सकाळचा नाश्ता, आजारपणातून रिकव्हरी व मुलांसाठी',
      hinglish: 'Morning bowl, recovery diet aur daily stamina',
    },
    nutrients: 'Punicalagins · Vitamin C · Potassium · Iron Support',
  },
  fruit_papaya: {
    headline: {
      en: 'Papain Digestive Enzyme, Constipation Relief & Skin Glow',
      hi: 'पापैन एंजाइम से तुरंत पाचन, कब्ज़ राहत व दमकती त्वचा',
      mr: 'पपैन एन्झाईममुळे सुलभ पचन, बद्धकोष्ठता मुक्ती व तेजस्वी त्वचा',
      hinglish: 'Papain enzyme for digestion, weight loss & glowing skin',
    },
    benefits: {
      en: [
        'Natural Papain enzyme breaks down proteins & relieves bloating',
        'Clears chronic constipation cleanly without harsh laxatives',
        'High Vitamin A & C restore skin elasticity and eye shine',
      ],
      hi: [
        'पापैन एंजाइम भारी भोजन पचाकर गैस व कब्ज़ को जड़ से मिटाता है',
        'विटामिन A व C आंखों की रोशनी व चेहरे की चमक बढ़ाते हैं',
        'प्लेटलेट्स और पेट की सफाई में डॉक्टरों द्वारा सुझाया गया फल',
      ],
      mr: [
        'पपैन एन्झाईम जड अन्न पचवून पोटाचा जडपणा दूर करते',
        'बद्धकोष्ठता व पोटाच्या तक्रारींवर नैसर्गिक उपाय',
        'व्हिटॅमिन A व C त्वचा आणि डोळ्यांचे आरोग्य जपतात',
      ],
      hinglish: [
        'Papain enzyme bhaari khana digest karta hai aur kabz mitata hai',
        'Vitamin A & C skin glow aur eyesight ke liye best',
        'Low-sugar fruit jo weight loss me help karta hai',
      ],
    },
    bestFor: {
      en: 'Empty stomach morning bowl, gut detox, weight balance',
      hi: 'सुबह खाली पेट नाश्ता व पेट की सफाई के लिए श्रेष्ठ',
      mr: 'सकाळी रिकाम्या पोटी व पचन सुधारण्यासाठी सर्वोत्तम',
      hinglish: 'Morning breakfast bowl aur daily digestion',
    },
    nutrients: 'Papain Enzyme · Vitamin A · Vitamin C · Fiber',
  },
  root_turmeric: {
    headline: {
      en: 'Active Curcumin Immunity, Joint Comfort & Skin Glow',
      hi: 'सक्रिय करक्यूमिन रोग-प्रतिरोधक शक्ति, जोड़ों का आराम व दमकती त्वचा',
      mr: 'सक्रिय कर्क्युमिन प्रतिकारशक्ती, सांधेदुखी आराम व त्वचा तेज',
      hinglish: 'Natural raw curcumin immunity, joint pain relief & golden glow',
    },
    benefits: {
      en: [
        'Fresh bio-available curcumin calms joint stiffness & seasonal inflammation',
        'Supports strong winter respiratory immunity in golden milk or decoction',
        'Aids liver detoxification and natural blood purification',
      ],
      hi: [
        'कच्ची हल्दी का सक्रिय करक्यूमिन सूजन व जोड़ों के दर्द में तुरंत आराम देता है',
        'सर्दियों में हल्दी दूध व काढ़े के साथ रोग-प्रतिरोधक शक्ति दोगुनी करे',
        'लीवर डिटॉक्स और प्राकृतिक रक्त शुद्धीकरण में बेहद गुणकारी',
      ],
      mr: [
        'ताज्या ओल्या हळदीतील कर्क्युमिन सांधेदुखी व सूज कमी करते',
        'हळदीचे दूध व काढ्यामुळे हिवाळी प्रतिकारशक्ती मजबूत होते',
        'यकृत शुद्धीकरण आणि रक्त शुद्ध ठेवण्यासाठी अत्यंत गुणकारी',
      ],
      hinglish: [
        'Raw haldi ka active curcumin joint pain aur sujan me turant rahat deta hai',
        'Winter me haldi doodh ya kadha me immunity boost karta hai',
        'Liver detox aur khoon saaf rakhne me madadgaar',
      ],
    },
    bestFor: {
      en: 'Golden haldi milk, winter haldi sabzi, fresh grated pickle',
      hi: 'गोल्डन हल्दी दूध, सर्दियों की हल्दी सब्ज़ी व ताज़ा अचार',
      mr: 'हळदीचे दूध, ओल्या हळदीची भाजी व लोणचे',
      hinglish: 'Haldi doodh, kacchi haldi sabzi aur morning detox',
    },
    nutrients: 'Bio-Active Curcumin · Volatile Oils · Vitamin C · Iron',
  },
  spice_dry_turmeric: {
    headline: {
      en: 'Pure Sangli Curcumin, Everyday Immunity & Gut Healer',
      hi: 'शुद्ध सांगली करक्यूमिन, रोज़ाना इम्युनिटी व पेट के रोगों से बचाव',
      mr: 'अस्सल सांगली कर्क्युमिन, रोजची प्रतिकारशक्ती व पचन आरोग्य',
      hinglish: 'Sun-cured Sangli haldi for home grinding, immunity & healing',
    },
    benefits: {
      en: [
        'Sun-cured whole fingers retain natural essential oils without artificial color',
        'Daily tadka spice boosts digestion, metabolism & antibacterial defense',
        'Long shelf life for pure home-ground masala and traditional rituals',
      ],
      hi: [
        'बिना मिलावट व कृत्रिम रंग के शुद्ध सांगली हळकुंड में भरपूर प्राकृतिक तेल',
        'रोज़ाना दाल-सब्ज़ी के तड़के में पाचन सुधार व जीवाणु-रोधी सुरक्षा दे',
        'साल भर स्टोर कर घर पर ताज़ा व शुद्ध हल्दी पाउडर पीसने के लिए उत्तम',
      ],
      mr: [
        'कोणत्याही कृत्रिम रंगाशिवाय अस्सल सांगली हळकुंडात नैसर्गिक अर्क टिकून राहतो',
        'रोजच्या फोडणीत पचनशक्ती व रोगप्रतिकारक शक्ती वाढवते',
        'घरगुती शुद्ध हळद दळण्यासाठी व शुभ कार्यांसाठी वर्षभर साठवण्यास योग्य',
      ],
      hinglish: [
        'Bina milawat aur synthetic colour ke pure sun-dried Sangli haldi fingers',
        'Daily tadka aur doodh ke liye immunity aur digestion powerhouse',
        'Ghar ki chakki me pure fresh haldi powder peesne ke liye best',
      ],
    },
    bestFor: {
      en: 'Home chakki grinding, daily masala tadka, festive rituals',
      hi: 'घर पर हल्दी पीसने, रोज़ाना मसाला तड़का व शुभ पूजा के लिए',
      mr: 'घरगुती हळद दळण, रोजची फोडणी आणि शुभ कार्ये',
      hinglish: 'Chakki powder grinding, daily masala tadka aur puja',
    },
    nutrients: 'Concentrated Curcumin · Natural Turmeric Oils · Manganese',
  },
};

const CATEGORY_DEFAULTS: Record<ProduceItem['category'], HealthRecord> = {
  vegetables: {
    headline: {
      en: 'Daily Farm Fiber, Vitamins & Balanced Nutrition',
      hi: 'ताज़ा मंडी फाइबर, मिनरल्स और रोज़ाना संपूर्ण पोषण',
      mr: 'ताजे फायबर, जीवनसत्त्वे व दैनंदिन संपूर्ण पोषण',
      hinglish: 'Fresh farm fiber, vitamins aur daily immunity',
    },
    benefits: {
      en: [
        'Naturally rich in dietary fiber to keep digestion light & active',
        'Delivers essential vitamins & trace minerals for family immunity',
        'Low calorie & 0% cholesterol supports healthy heart lifestyle',
      ],
      hi: [
        'प्राकृतिक फाइबर पाचन को हल्का और पेट को साफ़ रखता है',
        'ताज़ा लॉट होने से विटामिन्स और मिनरल्स पूरी मात्रा में मिलते हैं',
        'कम कैलोरी व ज़ीरो कोलेस्ट्रॉल से परिवार स्वस्थ रहता है',
      ],
      mr: [
        'नैसर्गिक फायबरमुळे पचनक्रिया सुलभ व हलकी राहते',
        'ताज्या भाजीतून सर्व जीवनसत्त्वे व खनिजे पूर्ण मिळतात',
        'कमी कॅलरीज व शून्य कोलेस्ट्रॉलमुळे हृदय निरोगी राहते',
      ],
      hinglish: [
        'Natural fiber digestion ko smooth aur pet ko light rakhta hai',
        'Fresh 4 AM mandi lot se pure vitamins aur minerals milte hain',
        'Zero cholesterol aur low calorie family health ke liye best',
      ],
    },
    bestFor: {
      en: 'Daily homestyle lunch, tiffin & balanced family meals',
      hi: 'रोज़ाना घर का ताज़ा खाना व बच्चों के टिफिन के लिए',
      mr: 'रोजचे घरगुती जेवण आणि कुटुंबाच्या आरोग्यासाठी',
      hinglish: 'Daily homestyle lunch, tiffin aur family diet',
    },
    nutrients: 'Dietary Fiber · Potassium · Antioxidants',
  },
  leafy: {
    headline: {
      en: 'Chlorophyll Blood Cleanse, Iron & Bone Vitamin K',
      hi: 'हीमोग्लोबिन (आयरन), हड्डियों व आंखों के लिए हरी शक्ति',
      mr: 'रक्तवाढ, हाडांची मजबुती व डोळ्यांसाठी हिरवे पोषण',
      hinglish: 'Natural Iron, hemoglobin aur bone strength',
    },
    benefits: {
      en: [
        'Plant iron & chlorophyll support fresh blood oxygenation',
        'High Vitamin K & calcium nourish bone density naturally',
        'Hydrating detox greens purify gut & skin gently',
      ],
      hi: [
        'क्लोरोफिल व आयरन शरीर में खून और ऊर्जा का स्तर बढ़ाते हैं',
        'विटामिन K व कैल्शियम हड्डियों व जोड़ों को मजबूत रखते हैं',
        'आंतों की सफाई व चेहरे के प्राकृतिक निखार के लिए बेजोड़',
      ],
      mr: [
        'क्लोरोफिल व लोह रक्तातील ऑक्सिजन व ऊर्जा वाढवते',
        'व्हिटॅमिन K व कॅल्शियम हाडांना बळकटी देतात',
        'पोटाचे आरोग्य व त्वचेच्या तेजासाठी अत्यंत गुणकारी',
      ],
      hinglish: [
        'Chlorophyll aur iron khoon aur stamina badhate hain',
        'Vitamin K aur calcium haddiyon ko strong banate hain',
        'Body detox aur clear skin ke liye best leafy greens',
      ],
    },
    bestFor: {
      en: 'Weekly 3x iron boost, dal tadka, parathas & soups',
      hi: 'हफ्ते में 3 बार आयरन बूस्ट, दाल तड़का व पराठे',
      mr: 'आठवड्यातून ३ वेळा लोहवाढ, वरण व पराठे',
      hinglish: 'Weekly iron boost, dal tadka aur parathas',
    },
    nutrients: 'Iron · Vitamin K · Chlorophyll · Folate',
  },
  roots: {
    headline: {
      en: 'Long-Lasting Minerals, Clean Energy & Prebiotics',
      hi: 'ज़मीनी मिनरल्स, प्रीबायोटिक फाइबर व टिकाऊ ऊर्जा',
      mr: 'खनिजे, प्रिबायोटिक फायबर आणि टिकाऊ ऊर्जा',
      hinglish: 'Mineral-rich roots, prebiotic fiber aur stamina',
    },
    benefits: {
      en: [
        'Absorbs deep soil trace minerals & potassium naturally',
        'Prebiotic fibers support gut microbiome balance',
        'Provides clean steady energy without artificial additives',
      ],
      hi: [
        'मिट्टी के गहरे मिनरल्स व पोटैशियम से भरपूर जो शरीर को ताकत दें',
        'प्रीबायोटिक फाइबर पाचन और अच्छे बैक्टीरिया को बढ़ाता है',
        'बिना किसी मिलावट के दिनभर काम करने की शुद्ध ऊर्जा',
      ],
      mr: [
        'मातीतील नैसर्गिक खनिजे आणि पोटॅशियमने समृद्ध',
        'प्रिबायोटिक फायबर पचनसंस्था मजबूत ठेवतो',
        'दिवसभर टिकणारी शुद्ध नैसर्गिक ऊर्जा देतो',
      ],
      hinglish: [
        'Potassium aur soil minerals body ko steady strength dete hain',
        'Prebiotic fiber pet ke good bacteria ko support karta hai',
        'Bina milawat ke clean everyday energy source',
      ],
    },
    bestFor: {
      en: 'Everyday base cooking, roasting, stews & detox',
      hi: 'रोज़ाना तड़का, सब्ज़ी व सर्दी-गर्मी में संपूर्ण आहार',
      mr: 'रोजच्या जेवणाचा पाया, फोडणी आणि कोशिंबीर',
      hinglish: 'Everyday base sabzi, soups aur tadka',
    },
    nutrients: 'Potassium · Prebiotics · Trace Minerals',
  },
  fruits: {
    headline: {
      en: 'Natural Antioxidants, Living Enzymes & Pure Vitality',
      hi: 'एंटीऑक्सीडेंट्स, प्राकृतिक एंजाइम्स व तुरंत ताज़गी ऊर्जा',
      mr: 'अँटिऑक्सिडंट्स, नैसर्गिक एन्झाईम्स व शुद्ध ऊर्जा',
      hinglish: 'Antioxidants, natural vitamins aur fresh energy',
    },
    benefits: {
      en: [
        'Rich in natural vitamins & polyphenols that protect heart & cells',
        'Whole fruit fiber keeps blood sugar steadier than packaged juice',
        'Hydrates tissues & boosts natural glowing skin and stamina',
      ],
      hi: [
        'पॉलीफेनोल्स व विटामिन्स इम्यूनिटी और दिल की सेहत को मजबूत रखते हैं',
        'पैकेट जूस के बजाय ताज़ा फल का फाइबर शुगर को संतुलित रखता है',
        'शरीर को प्राकृतिक नमी, चमकती त्वचा और तुरंत स्फूर्ति देता है',
      ],
      mr: [
        'पॉलिफेनॉल्स व जीवनसत्त्वे रोगप्रतिकारशक्ती व हृदय जपतात',
        'ताज्या फळांतील फायबरमुळे रक्तातील साखर नियंत्रणात राहते',
        'शरीराला झटपट ताजेतवाने व त्वचेला तजेलदार बनवते',
      ],
      hinglish: [
        'Vitamins aur polyphenols immunity aur heart protect karte hain',
        'Packaged juice se behtar natural fiber energy deta hai',
        'Skin glow aur fresh stamina ke liye daily fruit best hai',
      ],
    },
    bestFor: {
      en: 'Morning empty-stomach breakfast, kids snack, recovery',
      hi: 'सुबह का नाश्ता, बच्चों का टिफिन व सेहत रिकवरी',
      mr: 'सकाळचा नाश्ता, मुलांचा खाऊ व आरोग्यासाठी',
      hinglish: 'Morning breakfast, kids snack aur workout fuel',
    },
    nutrients: 'Polyphenols · Natural Enzymes · Fruit Fiber',
  },
  citrus: {
    headline: {
      en: 'High Vitamin C Immunity, Hydration & Iron Absorption',
      hi: 'विटामिन-C से भरपूर इम्यूनिटी, हाइड्रेशन व पाचन शक्ति',
      mr: 'व्हिटॅमिन-C चा खजिना: प्रतिकारशक्ती व हायड्रेशन',
      hinglish: 'Vitamin C immunity shield & iron absorption helper',
    },
    benefits: {
      en: [
        'Powerful natural Vitamin C wards off seasonal colds & fatigue',
        'Boosts iron absorption when paired with Indian dal & greens',
        'Refreshing electrolytes & citric antioxidants support clear skin',
      ],
      hi: [
        'भरपूर विटामिन-C मौसम बदलने पर होने वाली सर्दी-थकान से बचाता है',
        'दाल व हरी सब्ज़ियों के साथ खाने पर आयरन को दोगुना सोखने में मदद',
        'ताज़गी भरे इलेक्ट्रोलाइट्स शरीर को डिहाइड्रेशन से बचाते हैं',
      ],
      mr: [
        'मुबलक व्हिटॅमिन-C हंगामी सर्दी व थकव्यापासून बचाव करते',
        'डाळ व पालेभाज्यांसोबत घेतल्यास लोह शोषण वाढते',
        'शरीरातील पाण्याचे प्रमाण व त्वचेची चमक टिकवते',
      ],
      hinglish: [
        'Vitamin-C seasonal sardi-thakan se bachata hai',
        'Dal aur palak ke saath khane par iron absorption double karta hai',
        'Summer hydration aur fresh skin ke liye best',
      ],
    },
    bestFor: {
      en: 'Fresh morning juice, immunity detox water, post-meal digestif',
      hi: 'सुबह का ताज़ा जूस, नींबू पानी व रोग प्रतिरोधक आहार',
      mr: 'ताजा रस, लिंबू पाणी व प्रतिकारशक्तीसाठी',
      hinglish: 'Fresh juice, detox water aur daily immunity',
    },
    nutrients: 'Vitamin C · Citric Flavonoids · Electrolytes',
  },
  herbs: {
    headline: {
      en: 'Digestive Essential Oils, Detox & Flavor Without Extra Salt',
      hi: 'प्राकृतिक पाचन तेल, डिटॉक्स व कम नमक में भरपूर स्वाद',
      mr: 'पचन सुधारक नैसर्गिक अर्क, डिटॉक्स व अस्सल चव',
      hinglish: 'Natural digestive aroma, detox & low-salt flavor',
    },
    benefits: {
      en: [
        'Volatile aromatic oils soothe gas, acidity & bloating rapidly',
        'Helps flush kidney & liver toxins naturally',
        'Enhances dish aroma so you need less oil and less salt',
      ],
      hi: [
        'ताज़ी पत्तियों का प्राकृतिक अर्क गैस, अफारा और एसिडिटी तुरंत शांत करे',
        'शरीर के विषैले तत्व (डिटॉक्स) बाहर निकालने में सहायक',
        'खुशबू व स्वाद इतना ताज़ा कि कम तेल-नमक में भी खाना लाजवाब बने',
      ],
      mr: [
        'ताज्या पानांतील अर्क गॅस व आम्लपित्त त्वरित कमी करतो',
        'शरीरातील विषारी घटक बाहेर काढण्यास मदत करते',
        'कमी तेल व मिठात जेवणाला उत्तम सुगंध व चव येते',
      ],
      hinglish: [
        'Natural aroma gas aur bloating turant shant karta hai',
        'Body detox aur kidney-liver cleanse me madadgaar',
        'Kam namak aur kam tel me bhi khane ka swad double karta hai',
      ],
    },
    bestFor: {
      en: 'Green chutney, tadka garnish, morning detox tea/water',
      hi: 'ताज़ी हरी चटनी, तड़का व सुबह का डिटॉक्स पानी',
      mr: 'हिरवी चटणी, फोडणी आणि हर्बल चहा',
      hinglish: 'Hari chutney, tadka aur morning detox',
    },
    nutrients: 'Volatile Essential Oils · Vitamin K · Chlorophyll',
  },
  sprouts: {
    headline: {
      en: 'Living Plant Protein, Active Enzymes & Easy Absorption',
      hi: 'जीवंत प्लांट प्रोटीन, सक्रिय एंजाइम्स व जल्दी पचने वाली ताकत',
      mr: 'जिवंत वनस्पती प्रथिने, सक्रिय एन्झाईम्स व सुलभ पचन',
      hinglish: 'Bio-active plant protein, zero gas & gym stamina',
    },
    benefits: {
      en: [
        'Sprouting multiplies protein digestibility & unlocks B-vitamins',
        'Breaks down phytic acid so iron & zinc absorb effortlessly',
        'Supports lean muscle building, blood sugar & sustained energy',
      ],
      hi: [
        'अंकुरित होने से प्रोटीन और विटामिन कई गुना बढ़कर आसानी से पचते हैं',
        'सामान्य दाल के मुकाबले गैस नहीं होती व आयरन-ज़िंक पूरा मिलता है',
        'मांसपेशियों की ताकत, जिम व बच्चों के विकास के लिए सुपरफूड',
      ],
      mr: [
        'मोड आल्यामुळे प्रथिने व जीवनसत्त्वे सहज पचतात',
        'गॅस न होता लोह आणि झिंक शरीरात शोषले जाते',
        'स्नायूंची ताकद व मुलांच्या वाढीसाठी सर्वोत्तम सुपरफूड',
      ],
      hinglish: [
        'Sprouting se protein aur vitamins easily digest hote hain',
        'Normal dal ki tarah gas nahi banate aur iron zyada milta hai',
        'Fitness, gym aur growing kids ke liye daily powerhouse',
      ],
    },
    bestFor: {
      en: 'Morning sprout chaat, fitness bowl, Maharashtrian Usal',
      hi: 'सुबह की स्प्राउट्स चाट, फिटनेस नाश्ता व महाराष्ट्रियन उसळ',
      mr: 'सकाळची उसळ, कोशिंबीर आणि फिटनेस नाश्ता',
      hinglish: 'Morning sprout chaat, gym breakfast aur Usal',
    },
    nutrients: 'Active Plant Protein · Enzymes · B-Vitamins · Zinc',
  },
  other: {
    headline: {
      en: 'Pure Natural Energy, Minerals & Farm Purity',
      hi: 'शुद्ध प्राकृतिक ऊर्जा, मिनरल्स और रसायन-मुक्त ताज़गी',
      mr: 'शुद्ध नैसर्गिक ऊर्जा, खनिजे आणि ताजेपणा',
      hinglish: 'Natural electrolytes, minerals & zero additives',
    },
    benefits: {
      en: [
        'Zero artificial preservatives, wax, or synthetic enhancers',
        'Packed with trace electrolytes for quick daily hydration',
        'Fresh harvest lot preserves authentic farm taste and nutrients',
      ],
      hi: [
        'बिना किसी केमिकल, वैक्स या कृत्रिम मिलावट के बिल्कुल शुद्ध',
        'प्राकृतिक इलेक्ट्रोलाइट्स व मिनरल्स शरीर को तुरंत तरोताज़ा रखते हैं',
        'सीधा सुबह के मंडी लॉट से आने के कारण पोषण पूरी तरह सुरक्षित',
      ],
      mr: [
        'कोणत्याही कृत्रिम रसायनाशिवाय किंवा मेणाशिवाय शुद्ध',
        'नैसर्गिक इलेक्ट्रोलाइट्समुळे शरीर त्वरित ताजेतवाने होते',
        'थेट ताज्या लॉटमुळे अस्सल चव व पोषण टिकून राहते',
      ],
      hinglish: [
        'Bina wax ya chemical ke 100% shuddh natural harvest',
        'Natural electrolytes aur minerals body ko recharge karte hain',
        'Direct fresh mandi lot se nutrients safe rehte hain',
      ],
    },
    bestFor: {
      en: 'Daily wellness, fasting (upvas), family hydration',
      hi: 'रोज़ाना सेहत, व्रत (उपवास) व परिवार के पोषण के लिए',
      mr: 'रोजचे आरोग्य, उपवास आणि कुटुंबासाठी उत्तम',
      hinglish: 'Daily wellness, fasting aur hydration',
    },
    nutrients: 'Natural Electrolytes · Trace Minerals · Pure Energy',
  },
};

export function getProduceHealthBenefits(
  item: ProduceItem,
  lang: AppLanguage
): ProduceHealthBenefits {
  const specific = SPECIFIC_HEALTH_BENEFITS[item.id];
  const record = specific || CATEGORY_DEFAULTS[item.category] || CATEGORY_DEFAULTS.vegetables;

  return {
    headline: resolveBenefitText(record.headline, lang),
    benefits: resolveBenefitList(record.benefits, lang),
    bestFor: resolveBenefitText(record.bestFor, lang),
    nutrients: record.nutrients,
  };
}

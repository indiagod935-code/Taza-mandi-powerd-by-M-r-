import React from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';

interface CategoryQuickBarProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  categoryCounts: Record<string, number>;
}

export const CategoryQuickBar: React.FC<CategoryQuickBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const { lang } = useApp();

  const categories = [
    {
      id: 'all',
      icon: '🛒',
      labels: {
        en: 'All Produce',
        hi: 'सभी उत्पाद',
        mr: 'सर्व उत्पादने',
        hinglish: 'All Items',
        gu: 'બધા ઉત્પાદનો',
        bn: 'সব পণ্য',
        ta: 'அனைத்து பொருட்கள்',
        te: 'అన్ని ఉత్పత్తులు',
        kn: 'ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು',
        pa: 'ਸਾਰੇ ਉਤਪਾਦ',
      },
    },
    {
      id: 'vegetables',
      icon: '🥦',
      labels: {
        en: 'Vegetables',
        hi: 'सामान्य सब्ज़ियाँ',
        mr: 'भाज्या',
        hinglish: 'Vegetables',
        gu: 'શાકભાજી',
        bn: 'সবজি',
        ta: 'காய்கறிகள்',
        te: 'కూరగాయలు',
        kn: 'ತರಕಾರಿಗಳು',
        pa: 'ਸਬਜ਼ੀਆਂ',
      },
    },
    {
      id: 'fruits',
      icon: '🍎',
      labels: {
        en: 'Fresh Fruits',
        hi: 'ताज़े फल',
        mr: 'ताजी फळे',
        hinglish: 'Fresh Fruits',
        gu: 'તાજા ફળો',
        bn: 'টাটকা ফল',
        ta: 'புதிய பழங்கள்',
        te: 'తాజా పండ్లు',
        kn: 'ತಾಜಾ ಹಣ್ಣುಗಳು',
        pa: 'ਤਾਜ਼ੇ ਫਲ',
      },
    },
    {
      id: 'leafy',
      icon: '🌿',
      labels: {
        en: 'Leafy Greens',
        hi: 'पत्तेदार भाजी',
        mr: 'पालेभाज्या',
        hinglish: 'Leafy Greens',
        gu: 'પાંદડાવાળી ભાજી',
        bn: 'শাকসবজি',
        ta: 'கீரை வகைகள்',
        te: 'ఆకుకూరలు',
        kn: 'ಸೊಪ್ಪುಗಳು',
        pa: 'ਪੱਤੇਦਾਰ ਸਬਜ਼ੀਆਂ',
      },
    },
    {
      id: 'roots',
      icon: '🥔',
      labels: {
        en: 'Roots & Onions',
        hi: 'जड़ व कंद सब्ज़ियाँ',
        mr: 'कंदमुळे',
        hinglish: 'Aloo-Pyaaz & Roots',
        gu: 'કંદમૂળ (બટાકા-ડુંગળી)',
        bn: 'আলু-পেঁয়াজ ও মূল',
        ta: 'கிழங்கு & வெங்காயம்',
        te: 'దుంపలు & ఉల్లి',
        kn: 'ಗೆಡ್ಡೆ ಮತ್ತು ಈರುಳ್ಳಿ',
        pa: 'ਆਲੂ-ਪਿਆਜ਼ ਤੇ ਜੜ੍ਹਾਂ',
      },
    },
    {
      id: 'citrus',
      icon: '🍋',
      labels: {
        en: 'Citrus Fruits',
        hi: 'खट्टे फल',
        mr: 'लिंबूवर्गीय',
        hinglish: 'Citrus',
        gu: 'ખાટા ફળો',
        bn: 'লেবু জাতীয় ফল',
        ta: 'சிட்ரஸ் பழங்கள்',
        te: 'నిమ్మ జాతి పండ్లు',
        kn: 'ಸಿಟ್ರಸ್ ಹಣ್ಣುಗಳು',
        pa: 'ਖੱਟੇ ਫਲ',
      },
    },
    {
      id: 'herbs',
      icon: '🌱',
      labels: {
        en: 'Fresh Herbs',
        hi: 'धनिया व जड़ी-बूटियाँ',
        mr: 'सुगंधी वनस्पती',
        hinglish: 'Herbs & Mint',
        gu: 'ધાણા-ફુદીનો',
        bn: 'ধনেপাতা ও ভেষজ',
        ta: 'மல்லி & புதினா',
        te: 'కొత్తిమీర & పుదీనా',
        kn: 'ಕೊತ್ತಂಬರಿ & ಪುದೀನಾ',
        pa: 'ਧਨੀਆ ਤੇ ਪੁਦੀਨਾ',
      },
    },
    {
      id: 'sprouts',
      icon: '🫛',
      labels: {
        en: 'Sprouts & Beans',
        hi: 'अंकुरित व फलियाँ',
        mr: 'मोड आलेली कडधान्ये',
        hinglish: 'Sprouts',
        gu: 'ફણગાવેલા કઠોળ',
        bn: 'অঙ্কুরিত ডাল',
        ta: 'முளைகட்டிய பயறு',
        te: 'మొలకలు & చిక్కుళ్ళు',
        kn: 'ಮೊಳಕೆ ಕಾಳು',
        pa: 'ਪੁੰਗਰੀਆਂ ਦਾਲਾਂ',
      },
    },
    {
      id: 'other',
      icon: '🥥',
      labels: {
        en: 'Kitchen Essentials',
        hi: 'अन्य रसोई आवश्यक',
        mr: 'इतर ताजे',
        hinglish: 'Essentials',
        gu: 'રસોડાની જરૂરિયાત',
        bn: 'রান্নাঘরের প্রয়োজনীয়',
        ta: 'சமையல் அத்தியாவசியம்',
        te: 'వంటగది అవసరాలు',
        kn: 'ಅಡುಗೆಮನೆ ಅಗತ್ಯಗಳು',
        pa: 'ਰਸੋਈ ਦੀਆਂ ਲੋੜਾਂ',
      },
    },
    {
      id: 'seasonal',
      icon: '⭐',
      labels: {
        en: 'Seasonal Special',
        hi: 'मौसमी स्पेशल',
        mr: 'हंगामी स्पेशल',
        hinglish: 'Seasonal Special',
        gu: 'સિઝનલ સ્પેશિયલ',
        bn: 'মৌসুমি স্পেশাল',
        ta: 'பருவகால சிறப்பு',
        te: 'సీజనల్ స్పెషల్',
        kn: 'ಸೀಸನಲ್ ಸ್ಪೆಷಲ್',
        pa: 'ਸੀਜ਼ਨਲ ਸਪੈਸ਼ਲ',
      },
    },
  ];

  const getCountLabel = (count: number) =>
    pickLang(lang, {
      en: `${count} ${count === 1 ? 'item' : 'items'}`,
      hi: `${count} किस्में`,
      mr: `${count} प्रकार`,
      hinglish: `${count} items`,
      gu: `${count} પ્રકાર`,
      bn: `${count}টি আইটেম`,
      ta: `${count} வகைகள்`,
      te: `${count} రకాలు`,
      kn: `${count} ವಿಧಗಳು`,
      pa: `${count} ਕਿਸਮਾਂ`,
    });

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1.5 px-0.5">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'fruits'
              ? (categoryCounts.fruits ?? 0) + (categoryCounts.citrus ?? 0)
              : (categoryCounts[cat.id] ?? 0);
          const label = pickLang(lang, cat.labels);

          const isSeasonal = cat.id === 'seasonal';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl transition-all border shrink-0 text-left cursor-pointer active:scale-95 ${
                isSelected
                  ? isSeasonal
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-500/30'
                  : isSeasonal
                  ? 'bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/70 hover:border-amber-400'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800'
              }`}
            >
              <span className="text-lg leading-none">{cat.icon}</span>
              <div>
                <div
                  className={`text-xs font-bold leading-tight whitespace-nowrap ${
                    isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {label}
                </div>
                <div
                  className={`text-[10px] leading-none mt-0.5 ${
                    isSelected
                      ? isSeasonal
                        ? 'text-amber-100'
                        : 'text-emerald-100'
                      : 'text-slate-400'
                  }`}
                >
                  {getCountLabel(count)}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

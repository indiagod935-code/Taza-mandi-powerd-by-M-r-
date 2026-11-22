import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Check, Lock } from 'lucide-react';
import { pickLang } from '../utils/i18nHelper';

interface BrandCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandCustomizerModal: React.FC<BrandCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { brand, updateBrand, lang } = useApp();

  const [brandName, setBrandName] = useState(brand.brandName);
  const [tagline, setTagline] = useState(brand.tagline);
  const [societyName, setSocietyName] = useState(brand.societyName);
  const [mandiCity, setMandiCity] = useState(brand.mandiCity);
  const [whatsappContact, setWhatsappContact] = useState(brand.whatsappContact);

  useEffect(() => {
    if (isOpen) {
      setBrandName(brand.brandName);
      setTagline(brand.tagline);
      setSocietyName(brand.societyName);
      setMandiCity(brand.mandiCity);
      setWhatsappContact(brand.whatsappContact);
    }
  }, [isOpen, brand]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrand({
      brandName: brandName.trim() || 'ताज़ाMandi',
      tagline: tagline.trim(),
      societyName: societyName.trim(),
      mandiCity: mandiCity.trim(),
      whatsappContact: whatsappContact.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 rounded-lg text-amber-700 dark:text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Admin-Locked Brand & Locality Settings',
                  hi: 'एडमिन ब्रांड व सोसायटी सेटिंग्स (लॉक्ड)',
                  hinglish: 'Admin-Locked Brand & Store Settings',
                })}
              </h3>
              <p className="text-xs text-slate-500">
                {pickLang(lang, {
                  en: 'Saved changes apply globally to every customer device',
                  hi: 'यहाँ से सेव किया गया ब्रांड नाम हर कस्टमर को दिखेगा',
                  hinglish: 'Changes save hokar har customer ko globally dikhenge',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 py-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'hi' ? 'ब्रांड नाम (Brand Name):' : 'Brand Name:'}
            </label>
            <input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. ताज़ा Mandi"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'hi' ? 'टैगलाइन / विवरण:' : 'Tagline / Bio:'}
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="मंडी से सीधे आपके घर · powered by MARCO 💯"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'hi' ? 'सोसायटी / अपार्टमेंट का नाम:' : 'Target Society / Cluster Name:'}
            </label>
            <input
              type="text"
              value={societyName}
              onChange={(e) => setSocietyName(e.target.value)}
              placeholder="उदा. रॉयल पाम्स / आपकी सोसायटी (विंग या ब्लॉक)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'hi' ? 'थोक APMC मंडी हब (Procurement Source):' : 'APMC Mandi Wholesale Source:'}
            </label>
            <input
              type="text"
              value={mandiCity}
              onChange={(e) => setMandiCity(e.target.value)}
              placeholder="e.g. APMC Vashi Wholesale Mandi, Navi Mumbai"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              {lang === 'hi' ? 'मंडी ऑपरेटर WhatsApp नंबर:' : 'Operator WhatsApp Contact:'}
            </label>
            <input
              type="text"
              value={whatsappContact}
              onChange={(e) => setWhatsappContact(e.target.value)}
              placeholder="+91 98200 45678"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-emerald-600 font-mono-nums"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{lang === 'hi' ? 'सुरक्षित करें (Save)' : 'Save Brand'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

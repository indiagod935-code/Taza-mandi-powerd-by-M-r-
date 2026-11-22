import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  Gift,
  Share2,
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  Settings,
  Copy,
  Check,
  Percent,
  Trash2,
} from 'lucide-react';

export const ReferralRewardsManager: React.FC = () => {
  const {
    lang,
    referralConfig,
    updateReferralConfig,
    referralRecords,
    updateReferralRecordStatus,
    deleteReferralRecord,
    user,
  } = useApp();

  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [configForm, setConfigForm] = useState(referralConfig);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const showBanner = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateReferralConfig(configForm);
    showBanner(
      pickLang(lang, {
        en: '✓ Referral & Cashback rules saved successfully!',
        hi: '✓ रेफ़रल व कैशबैक सेटिंग्स सफलतापूर्वक सहेजी गईं!',
        mr: '✓ रेफरल आणि कॅशबॅक नियम यशस्वीरित्या जतन केले!',
        hinglish: '✓ Referral aur Cashback settings save ho gayi!',
      })
    );
    setIsEditingSettings(false);
  };

  const handleApproveCashback = (recordId: string) => {
    updateReferralRecordStatus(recordId, 'rewarded', true);
  };

  const handleDeleteRow = (id: string) => {
    deleteReferralRecord(id);
    setConfirmDeleteId(null);
    showBanner(
      pickLang(lang, {
        en: '🗑️ Referral record deleted.',
        hi: '🗑️ रेफ़रल रिकॉर्ड सफलतापूर्वक हटा दिया गया!',
        mr: '🗑️ रेफरल नोंद यशस्वीरित्या हटवली!',
        hinglish: '🗑️ Referral record delete ho gaya.',
      })
    );
  };

  const customerShareLink = `${window.location.origin}/?ref=${user.referralCode || 'TAZA-MEMBER'}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(customerShareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredRecords = referralRecords.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const totalCashbackGiven = referralRecords
    .filter((r) => r.status === 'rewarded')
    .reduce((sum, r) => sum + (r.cashbackAmount || 0), 0);

  const totalGiftsDisbursed = referralRecords.filter((r) => r.giftDisbursed).length;
  const minQualifyAmount = referralConfig.minOrderValueToQualify || 150;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/80 text-emerald-200 text-xs font-bold mb-2">
              <Gift className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Customer Growth & Referral Cashback Engine',
                  hi: 'ग्राहक आकर्षण व रेफ़रल कैशबैक इंजन',
                  mr: 'ग्राहक वाढ आणि रेफरल कॅशबॅक इंजिन',
                  hinglish: 'Customer Growth & Referral Cashback Engine',
                })}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              {pickLang(lang, {
                en: 'Share, Reward Cashback & Grow Society Orders',
                hi: 'शेयर करें, कैशबैक दें व नए ग्राहक बनाएं',
                mr: 'शेअर करा, कॅशबॅक द्या आणि नवीन ग्राहक जोडा',
                hinglish: 'Share Karein, Cashback Dein & Naye Customers Jodein',
              })}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              {pickLang(lang, {
                en: `Customers can share fresh produce or the store app with friends and neighbors. When a new customer places a qualifying order of at least ₹${minQualifyAmount} and delivery + payment are confirmed, the referrer automatically earns ₹${referralConfig.referrerCashbackAmount} cashback.`,
                hi: `ग्राहक अपने दोस्तों व पड़ोसियों को किसी भी सब्ज़ी/फल या पूरे ऐप को शेयर कर सकते हैं। जब नया ग्राहक कम से कम ₹${minQualifyAmount} का ऑर्डर करता है और डिलीवरी व पेमेंट कन्फ़र्म हो जाती है, तभी शेयर करने वाले को ₹${referralConfig.referrerCashbackAmount} कैशबैक मिलता है।`,
                mr: `ग्राहक आपल्या मित्रांना भाजीपाला किंवा संपूर्ण अ‍ॅप शेअर करू शकतात. नवीन ग्राहकाने किमान ₹${minQualifyAmount} ची ऑर्डर पूर्ण करून डिलिव्हरी व पेमेंट कन्फर्म झाल्यावर रेफर करणाऱ्याला ₹${referralConfig.referrerCashbackAmount} कॅशबॅक मिळतो.`,
                hinglish: `Customers apne doston aur neighbours ko koi bhi sabzi/phal ya poora app share kar sakte hain. Jab naya customer kam se kam ₹${minQualifyAmount} ka order karta hai aur delivery + payment confirm ho jaati hai, tab share karne wale ko ₹${referralConfig.referrerCashbackAmount} cashback milta hai.`,
              })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-50 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-emerald-700" />
              <span>
                {isEditingSettings
                  ? pickLang(lang, {
                      en: 'Close Settings',
                      hi: 'सेटिंग्स बंद करें',
                      mr: 'सेटिंग्ज बंद करा',
                      hinglish: 'Close Settings',
                    })
                  : pickLang(lang, {
                      en: '⚙️ Edit Rules & Cashback',
                      hi: '⚙️ नियम व कैशबैक राशि बदलें',
                      mr: '⚙️ नियम व कॅशबॅक बदला',
                      hinglish: '⚙️ Edit Rules & Cashback',
                    })}
              </span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold text-center animate-in fade-in">
          {saveSuccess}
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>
              {pickLang(lang, {
                en: 'Referrer Cashback',
                hi: 'शेयर करने वाले को कैशबैक',
                mr: 'रेफर करणाऱ्याला कॅशबॅक',
                hinglish: 'Referrer Cashback',
              })}
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono-nums">
            ₹{referralConfig.referrerCashbackAmount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {pickLang(lang, {
              en: 'Per qualified friend order',
              hi: 'प्रति सफल दोस्त ऑर्डर',
              mr: 'प्रत्येक यशस्वी मित्र ऑर्डरमागे',
              hinglish: 'Per successful friend order',
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>
              {pickLang(lang, {
                en: 'New Customer Discount',
                hi: 'नए ग्राहक को छूट',
                mr: 'नवीन ग्राहक सूट',
                hinglish: 'New Customer Discount',
              })}
            </span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono-nums">
            ₹{referralConfig.refereeDiscountAmount}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            {pickLang(lang, {
              en: 'Instant discount on first order',
              hi: 'पहली खरीद पर तत्काल छूट',
              mr: 'पहिल्या ऑर्डरवर त्वरित सूट',
              hinglish: 'First order par instant discount',
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>
              {pickLang(lang, {
                en: 'Free Produce Gift',
                hi: 'मुफ्त उत्पाद उपहार',
                mr: 'मोफत उत्पादन भेट',
                hinglish: 'Free Produce Gift',
              })}
            </span>
            <Gift className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mt-1">
            {referralConfig.freeProduceName}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">
            {referralConfig.freeProduceGiftEnabled
              ? pickLang(lang, {
                  en: '✓ Active',
                  hi: '✓ चालू (Active)',
                  mr: '✓ सुरू (Active)',
                  hinglish: '✓ Active',
                })
              : pickLang(lang, {
                  en: '✗ Disabled',
                  hi: '✗ बंद',
                  mr: '✗ बंद',
                  hinglish: '✗ Disabled',
                })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>
              {pickLang(lang, {
                en: 'Total Cashback Credited',
                hi: 'कुल कैशबैक वितरित',
                mr: 'एकूण दिलेला कॅशबॅक',
                hinglish: 'Total Cashback Given',
              })}
            </span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono-nums">
            ₹{totalCashbackGiven}
          </div>
          <div className="text-[10px] text-teal-600 font-medium mt-1">
            {pickLang(lang, {
              en: `${totalGiftsDisbursed} free gifts delivered`,
              hi: `${totalGiftsDisbursed} मुफ्त उपहार वितरित`,
              mr: `${totalGiftsDisbursed} मोफत भेटी वितरित`,
              hinglish: `${totalGiftsDisbursed} free gifts delivered`,
            })}
          </div>
        </div>
      </div>

      {/* Settings Form Modal/Panel */}
      {isEditingSettings && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: 'Referral & Cashback Rules Configuration',
                  hi: 'रेफ़रल व कैशबैक नियम कॉन्फ़िगरेशन',
                  mr: 'रेफरल व कॅशबॅक नियम सेटिंग्ज',
                  hinglish: 'Referral & Cashback Rules Settings',
                })}
              </span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
              {pickLang(lang, {
                en: 'Admin Control',
                hi: 'एडमिन कंट्रोल',
                mr: 'अ‍ॅडमिन नियंत्रण',
                hinglish: 'Admin Control',
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: 'Referrer Cashback Amount (₹):',
                  hi: 'शेयर करने वाले को कैशबैक राशि (₹):',
                  mr: 'रेफर करणाऱ्याला कॅशबॅक रक्कम (₹):',
                  hinglish: 'Referrer Cashback Amount (₹):',
                })}
              </label>
              <input
                type="number"
                min={0}
                max={500}
                value={configForm.referrerCashbackAmount}
                onChange={(e) =>
                  setConfigForm({ ...configForm, referrerCashbackAmount: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              />
              <span className="text-[10px] text-slate-500">
                {pickLang(lang, {
                  en: 'e.g. ₹50 or ₹100 credited to referrer wallet',
                  hi: 'उदा: ₹50 या ₹100 ग्राहक के वॉलेट में जुड़ेगा',
                  mr: 'उदा. ₹५० किंवा ₹१०० ग्राहकाच्या वॉलेटमध्ये जमा होतील',
                  hinglish: 'e.g. ₹50 ya ₹100 customer ke wallet mein add hoga',
                })}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: 'New Friend First-Order Discount (₹):',
                  hi: 'नए दोस्त को पहली खरीद छूट (₹):',
                  mr: 'नवीन मित्राला पहिल्या ऑर्डरवर सूट (₹):',
                  hinglish: 'New Friend First-Order Discount (₹):',
                })}
              </label>
              <input
                type="number"
                min={0}
                max={300}
                value={configForm.refereeDiscountAmount}
                onChange={(e) =>
                  setConfigForm({ ...configForm, refereeDiscountAmount: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              />
              <span className="text-[10px] text-slate-500">
                {pickLang(lang, {
                  en: 'e.g. ₹30 instant checkout discount',
                  hi: 'उदा: ₹30 तत्काल चेकआउट छूट',
                  mr: 'उदा. ₹३० त्वरित चेकआउट सूट',
                  hinglish: 'e.g. ₹30 instant checkout discount',
                })}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: 'Free Produce Gift Name:',
                  hi: 'मुफ्त उत्पाद उपहार का नाम:',
                  mr: 'मोफत उत्पादन भेटीचे नाव:',
                  hinglish: 'Free Produce Gift Name:',
                })}
              </label>
              <input
                type="text"
                value={configForm.freeProduceName}
                onChange={(e) => setConfigForm({ ...configForm, freeProduceName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              />
              <span className="text-[10px] text-slate-500">
                {pickLang(lang, {
                  en: 'e.g. 1 Bunch Fresh Spinach / 1 kg Potato / 1 Coconut',
                  hi: 'उदा: 1 गड्डी ताज़ी पालक / 1kg आलू / 1 नारियल',
                  mr: 'उदा. १ जुडी ताजी पालक / १ किलो बटाटे',
                  hinglish: 'e.g. 1 Bunch Fresh Palak / 1kg Aloo / 1 Coconut',
                })}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: 'Minimum Qualifying Order Value (₹):',
                  hi: 'न्यूनतम ऑर्डर मूल्य (₹) पात्रता:',
                  mr: 'किमान ऑर्डर रक्कम (₹) पात्रता:',
                  hinglish: 'Min Qualifying Order Value (₹):',
                })}
              </label>
              <input
                type="number"
                min={50}
                value={configForm.minOrderValueToQualify}
                onChange={(e) =>
                  setConfigForm({ ...configForm, minOrderValueToQualify: Number(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
              />
              <span className="text-[10px] text-slate-500">
                {pickLang(lang, {
                  en: 'Reward unlocks once friend order reaches this amount',
                  hi: 'कम से कम इतना ऑर्डर होने पर इनाम मिलेगा',
                  mr: 'इतकी किमान ऑर्डर झाल्यावर बक्षीस मिळते',
                  hinglish: 'Kam se kam itna order hone par reward milega',
                })}
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: 'WhatsApp Share Promotional Message:',
                  hi: 'व्हाट्सएप शेयर का प्रचार संदेश:',
                  mr: 'व्हॉट्सॲप शेअर संदेश:',
                  hinglish: 'WhatsApp Share Promotional Message:',
                })}
              </label>
              <input
                type="text"
                value={configForm.promotionalMessage}
                onChange={(e) => setConfigForm({ ...configForm, promotionalMessage: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingSettings(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Cancel',
                hi: 'रद्द करें',
                mr: 'रद्द करा',
                hinglish: 'Cancel',
              })}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {pickLang(lang, {
                  en: 'Save Rules',
                  hi: 'सेटिंग्स सहेजें',
                  mr: 'नियम जतन करा',
                  hinglish: 'Save Rules',
                })}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Live Customer Referral Link */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-700 shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {pickLang(lang, {
                en: 'Live Customer Referral Sharing Link',
                hi: 'ग्राहक रेफ़रल शेयरिंग लिंक',
                mr: 'ग्राहक रेफरल शेअरिंग लिंक',
                hinglish: 'Live Customer Referral Link',
              })}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm sm:max-w-md">
              {customerShareLink}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={copyShareLink}
          className="px-3.5 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>
            {copiedLink
              ? pickLang(lang, {
                  en: 'Link Copied!',
                  hi: 'लिंक कॉपी हुआ!',
                  mr: 'लिंक कॉपी झाली!',
                  hinglish: 'Link Copied!',
                })
              : pickLang(lang, {
                  en: 'Copy Link',
                  hi: 'लिंक कॉपी करें',
                  mr: 'लिंक कॉपी करा',
                  hinglish: 'Copy Link',
                })}
          </span>
        </button>
      </div>

      {/* Referrals Tracking Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: `Customer Referrals & Reward Ledger (${referralRecords.length} Records)`,
                  hi: `ग्राहक रेफ़रल व पुरस्कार सूची (${referralRecords.length} रिकॉर्ड)`,
                  mr: `ग्राहक रेफरल व बक्षीस यादी (${referralRecords.length} नोंदी)`,
                  hinglish: `Customer Referrals & Rewards List (${referralRecords.length} Records)`,
                })}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {pickLang(lang, {
                en: 'Tracks live referral invites, minimum qualifying order status, delivery/payment confirmation, and wallet payouts.',
                hi: 'जब कोई ग्राहक किसी दोस्त को उत्पाद भेजता है और वह आर्डर करता है, तो यहाँ स्टेटस दिखता है।',
                mr: 'ग्राहकाने मित्राला उत्पादन शेअर करून ऑर्डर केल्यावर स्थिती येथे दिसते.',
                hinglish: 'Jab koi customer dost ko link ya product share karta hai aur order hota hai, toh yahan live status dikhta hai.',
              })}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold flex-wrap">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {pickLang(lang, {
                en: `All (${referralRecords.length})`,
                hi: `सभी (${referralRecords.length})`,
                mr: `सर्व (${referralRecords.length})`,
                hinglish: `All (${referralRecords.length})`,
              })}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('qualified')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'qualified'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {pickLang(lang, {
                en: `Awaiting Delivery/Pay (${referralRecords.filter((r) => r.status === 'qualified').length})`,
                hi: `डिलीवरी/पेमेंट बाकी (${referralRecords.filter((r) => r.status === 'qualified').length})`,
                mr: `डिलिव्हरी/पेमेंट बाकी (${referralRecords.filter((r) => r.status === 'qualified').length})`,
                hinglish: `Delivery/Pay Pending (${referralRecords.filter((r) => r.status === 'qualified').length})`,
              })}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('below_minimum')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'below_minimum'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {pickLang(lang, {
                en: `Below ₹${minQualifyAmount} (${referralRecords.filter((r) => r.status === 'below_minimum').length})`,
                hi: `₹${minQualifyAmount} से कम (${referralRecords.filter((r) => r.status === 'below_minimum').length})`,
                mr: `₹${minQualifyAmount} पेक्षा कमी (${referralRecords.filter((r) => r.status === 'below_minimum').length})`,
                hinglish: `Below ₹${minQualifyAmount} (${referralRecords.filter((r) => r.status === 'below_minimum').length})`,
              })}
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('rewarded')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                filterStatus === 'rewarded'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {pickLang(lang, {
                en: `Cashback Credited (${referralRecords.filter((r) => r.status === 'rewarded').length})`,
                hi: `कैशबैक क्रेडिट हुआ (${referralRecords.filter((r) => r.status === 'rewarded').length})`,
                mr: `कॅशबॅक जमा झाला (${referralRecords.filter((r) => r.status === 'rewarded').length})`,
                hinglish: `Cashback Credited (${referralRecords.filter((r) => r.status === 'rewarded').length})`,
              })}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">
                  {pickLang(lang, { en: 'Referrer', hi: 'शेयर करने वाला (Referrer)', mr: 'शेअर करणारा', hinglish: 'Referrer' })}
                </th>
                <th className="py-3 px-4">
                  {pickLang(lang, { en: 'Referred Friend', hi: 'नया ग्राहक (Referred Friend)', mr: 'नवीन मित्र', hinglish: 'Referred Friend' })}
                </th>
                <th className="py-3 px-4">
                  {pickLang(lang, { en: 'Order & Amount', hi: 'ऑर्डर व राशि', mr: 'ऑर्डर व रक्कम', hinglish: 'Order & Amount' })}
                </th>
                <th className="py-3 px-4">
                  {pickLang(lang, { en: 'Referral Code', hi: 'रेफ़रल कोड', mr: 'रेफरल कोड', hinglish: 'Referral Code' })}
                </th>
                <th className="py-3 px-4 text-center">
                  {pickLang(lang, { en: 'Cashback', hi: 'कैशबैक', mr: 'कॅशबॅक', hinglish: 'Cashback' })}
                </th>
                <th className="py-3 px-4">
                  {pickLang(lang, { en: 'Delivery & Payment', hi: 'डिलीवरी व पेमेंट', mr: 'डिलिव्हरी व पेमेंट', hinglish: 'Delivery & Payment' })}
                </th>
                <th className="py-3 px-4 text-center">
                  {pickLang(lang, { en: 'Status', hi: 'स्थिति (Status)', mr: 'स्थिती', hinglish: 'Status' })}
                </th>
                <th className="py-3 px-4 text-right">
                  {pickLang(lang, { en: 'Admin Action', hi: 'एडमिन कार्रवाई', mr: 'अ‍ॅडमिन कृती', hinglish: 'Admin Action' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {pickLang(lang, {
                      en: `No referral records yet. Orders of ₹${minQualifyAmount}+ placed with a customer referral code appear here automatically.`,
                      hi: `कोई रेफ़रल रिकॉर्ड उपलब्ध नहीं है। कम से कम ₹${minQualifyAmount} का रेफ़रल ऑर्डर होने पर रिकॉर्ड यहाँ दिखता है।`,
                      mr: `अद्याप कोणतीही रेफरल नोंद नाही. किमान ₹${minQualifyAmount} ची रेफरल ऑर्डर झाल्यावर येथे दिसेल.`,
                      hinglish: `Abhi koi referral record nahi hai. Kam se kam ₹${minQualifyAmount} ka referral order hone par record yahan dikhta hai.`,
                    })}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{rec.referrerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{rec.referrerPhone}</div>
                      <div className="text-[10px] text-slate-400">{rec.createdAt}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{rec.refereeName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{rec.refereePhone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-slate-900 dark:text-slate-100">
                        {rec.orderAmount !== undefined ? `₹${rec.orderAmount}` : '—'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        {rec.orderId ? `#${rec.orderId} · ` : ''}
                        {rec.productName ||
                          pickLang(lang, {
                            en: 'TazaMandi Order',
                            hi: 'ताज़ाMandi ऑर्डर',
                            mr: 'ताज़ाMandi ऑर्डर',
                            hinglish: 'TazaMandi Order',
                          })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {rec.referralCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700 dark:text-emerald-400 font-mono-nums">
                      ₹{rec.cashbackAmount}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-semibold">
                        {rec.deliveryStatus === 'delivered' ? (
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {pickLang(lang, {
                              en: '✓ Delivered',
                              hi: '✓ डिलीवर',
                              mr: '✓ पोहोचले',
                              hinglish: '✓ Delivered',
                            })}
                          </span>
                        ) : rec.deliveryStatus === 'out_for_delivery' ? (
                          <span className="text-sky-700 dark:text-sky-400">
                            {pickLang(lang, {
                              en: '🚚 Out for Delivery',
                              hi: '🚚 रास्ते में',
                              mr: '🚚 मार्गावर',
                              hinglish: '🚚 On the Way',
                            })}
                          </span>
                        ) : rec.deliveryStatus === 'packed' ? (
                          <span className="text-indigo-700 dark:text-indigo-400">
                            {pickLang(lang, {
                              en: '📦 Packed',
                              hi: '📦 पैक हुआ',
                              mr: '📦 पॅक झाले',
                              hinglish: '📦 Packed',
                            })}
                          </span>
                        ) : rec.deliveryStatus === 'cancelled' ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            {pickLang(lang, {
                              en: '✕ Cancelled',
                              hi: '✕ रद्द',
                              mr: '✕ रद्द',
                              hinglish: '✕ Cancelled',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {pickLang(lang, {
                              en: '⏳ Ordered',
                              hi: '⏳ ऑर्डर दर्ज',
                              mr: '⏳ नोंदवले',
                              hinglish: '⏳ Ordered',
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px]">
                        {rec.paymentConfirmed ? (
                          <span className="text-emerald-600 font-bold">
                            {pickLang(lang, {
                              en: '✓ Payment Confirmed',
                              hi: '✓ पेमेंट कन्फ़र्म',
                              mr: '✓ पेमेंट कन्फर्म',
                              hinglish: '✓ Payment Confirmed',
                            })}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold">
                            {pickLang(lang, {
                              en: '⏳ Payment Pending',
                              hi: '⏳ पेमेंट बाकी',
                              mr: '⏳ पेमेंट बाकी',
                              hinglish: '⏳ Payment Pending',
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rec.status === 'rewarded' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                          <CheckCircle className="w-3 h-3" />
                          <span>
                            {pickLang(lang, {
                              en: `₹${rec.cashbackAmount} Credited`,
                              hi: `₹${rec.cashbackAmount} क्रेडिट हुआ`,
                              mr: `₹${rec.cashbackAmount} जमा झाले`,
                              hinglish: `₹${rec.cashbackAmount} Credited`,
                            })}
                          </span>
                        </span>
                      ) : rec.status === 'below_minimum' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                          <span>
                            {pickLang(lang, {
                              en: `Below ₹${minQualifyAmount}`,
                              hi: `₹${minQualifyAmount} से कम`,
                              mr: `₹${minQualifyAmount} पेक्षा कमी`,
                              hinglish: `Below ₹${minQualifyAmount}`,
                            })}
                          </span>
                        </span>
                      ) : rec.status === 'qualified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {pickLang(lang, {
                              en: 'Awaiting Delivery & Pay',
                              hi: 'डिलीवरी व पेमेंट बाकी',
                              mr: 'डिलिव्हरी व पेमेंट बाकी',
                              hinglish: 'Delivery & Pay Pending',
                            })}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                          <span>
                            {pickLang(lang, {
                              en: 'Pending',
                              hi: 'लंबित',
                              mr: 'प्रलंबित',
                              hinglish: 'Pending',
                            })}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {rec.status !== 'rewarded' && rec.status !== 'below_minimum' && (
                          <button
                            type="button"
                            onClick={() => handleApproveCashback(rec.id)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                          >
                            {pickLang(lang, {
                              en: `Credit ₹${rec.cashbackAmount}`,
                              hi: `₹${rec.cashbackAmount} कैशबैक दें`,
                              mr: `₹${rec.cashbackAmount} कॅशबॅक द्या`,
                              hinglish: `Credit ₹${rec.cashbackAmount}`,
                            })}
                          </button>
                        )}
                        {rec.status === 'rewarded' && (
                          <span className="text-[11px] text-emerald-600 font-semibold">
                            {pickLang(lang, {
                              en: '✓ Done',
                              hi: '✓ पूर्ण',
                              mr: '✓ पूर्ण',
                              hinglish: '✓ Done',
                            })}
                          </span>
                        )}

                        {confirmDeleteId === rec.id ? (
                          <div className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 px-1.5 py-0.5 rounded-lg">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rec.id)}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-black cursor-pointer"
                            >
                              {pickLang(lang, {
                                en: 'Confirm',
                                hi: 'पक्का हटाएँ',
                                mr: 'नक्की हटवा',
                                hinglish: 'Confirm',
                              })}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-[11px] font-bold cursor-pointer"
                              title={pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(rec.id)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white border border-rose-200 dark:border-rose-800 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title={pickLang(lang, {
                              en: 'Delete this referral record',
                              hi: 'इस रेफ़रल रिकॉर्ड को हटाएँ',
                              mr: 'ही रेफरल नोंद हटवा',
                              hinglish: 'Delete referral record',
                            })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {pickLang(lang, {
                                en: 'Delete',
                                hi: 'हटाएँ',
                                mr: 'हटवा',
                                hinglish: 'Delete',
                              })}
                            </span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

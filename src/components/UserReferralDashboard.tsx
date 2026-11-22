import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  Share2,
  Copy,
  Check,
  Gift,
  Wallet,
  Users,
  CheckCircle2,
  ShoppingBag,
  Send,
  Info,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface UserReferralDashboardProps {
  onGoToShop?: () => void;
  onClose?: () => void;
}

export const UserReferralDashboard: React.FC<UserReferralDashboardProps> = ({ onClose }) => {
  const { user, brand, lang, referralConfig, referralRecords, addReferralRecord, setIsCartOpen } =
    useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inviteFriendName, setInviteFriendName] = useState('');
  const [inviteFriendFlat, setInviteFriendFlat] = useState('');
  const [inviteFriendPhone, setInviteFriendPhone] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [pendingInviteHref, setPendingInviteHref] = useState<string | null>(null);

  const userReferralCode = (
    user.referralCode || (user.flat ? `TAZA-${user.flat}` : 'TAZA-MEMBER')
  )
    .trim()
    .toUpperCase();
  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralShareUrl = originUrl
    ? `${originUrl}/?ref=${encodeURIComponent(userReferralCode)}`
    : `/?ref=${encodeURIComponent(userReferralCode)}`;

  const referrerCashback = referralConfig?.referrerCashbackAmount || 50;
  const refereeDiscount = referralConfig?.refereeDiscountAmount || 30;
  const minOrderAmount = Math.max(150, referralConfig?.minOrderValueToQualify || 150);
  const freeGiftItem =
    user.freeGiftAvailable ||
    referralConfig?.freeProduceName ||
    pickLang(lang, {
      en: '1 Bunch Fresh Spinach',
      hi: '1 गड्डी ताज़ी पालक',
      mr: '१ जुडी ताजा पालक',
      hinglish: '1 Bunch Fresh Spinach',
    });

  const currentWalletBalance = user.walletBalance ?? 0;

  const activeInvites = referralRecords.filter(
    (r) =>
      r.referralCode?.trim().toUpperCase() === userReferralCode ||
      (user.name && r.referrerName === user.name) ||
      (user.phone && r.referrerPhone === user.phone)
  );

  const successfulInvitesCount = activeInvites.filter((r) => r.status === 'rewarded').length;
  const pendingInvitesCount = activeInvites.filter((r) => r.status !== 'rewarded').length;
  const rewardedSum = activeInvites
    .filter((r) => r.status === 'rewarded')
    .reduce((sum, r) => sum + (r.cashbackAmount || referrerCashback), 0);
  const lifetimeEarnedCashback = Math.max(rewardedSum, currentWalletBalance);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(referralShareUrl);
    } catch {}
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(userReferralCode);
    } catch {}
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const getReferralWhatsAppUrl = (customFriendName?: string) => {
    const storeName = brand.brandName || 'ताज़ाMandi';
    const message = pickLang(lang, {
      en: `${customFriendName ? `Hi ${customFriendName}!` : 'Hello!'} 🥬\n\nOrder farm-fresh produce direct from APMC Vashi Mandi via *${storeName}*.\n\n🎁 *Special Offer:* Order at least *₹${minOrderAmount}* via my referral link and get *₹${refereeDiscount} instant discount + 1 free fresh gift*!\n\n👇 *Order Now:*\n${referralShareUrl}\n\nReferral Code: *${userReferralCode}*\n_(Valid on min. order of ₹${minOrderAmount})_`,
      hi: `${customFriendName ? `नमस्ते ${customFriendName} जी!` : 'नमस्ते!'} 🥬\n\n*${storeName}* (APMC वाशी थोक मंडी डायरेक्ट) से अपनी सोसायटी में ताज़ी हरी सब्ज़ियाँ व फल मंगवाएँ।\n\n🎁 *आपके लिए ऑफ़र:* मेरे रेफ़रल लिंक से कम से कम *₹${minOrderAmount}* का ऑर्डर करने पर आपको तुरंत *₹${refereeDiscount} की छूट* मिलेगी!\n\n👇 *यहाँ क्लिक करके ऑर्डर करें:*\n${referralShareUrl}\n\nरेफ़रल कोड: *${userReferralCode}*\n_(शर्त: कम से कम ₹${minOrderAmount} की खरीदारी पर लागू)_`,
      mr: `${customFriendName ? `नमस्कार ${customFriendName}!` : 'नमस्कार!'} 🥬\n\n*${storeName}* (APMC वाशी मंडी थेट) मधून ताज्या भाज्या व फळे थेट घरी मागवा.\n\n🎁 *खास ऑफर:* माझ्या रेफरल लिंकवरून किमान *₹${minOrderAmount}* ची ऑर्डर केल्यास तुम्हाला त्वरित *₹${refereeDiscount} सूट* मिळेल!\n\n👇 *येथे ऑर्डर करा:*\n${referralShareUrl}\n\nरेफरल कोड: *${userReferralCode}*`,
      hinglish: `${customFriendName ? `Hi ${customFriendName}!` : 'Namaste!'} 🥬\n\n*${storeName}* (Direct APMC Vashi Mandi) se apni society me taazi sabziyan aur phal mangwayein.\n\n🎁 *Special Offer:* Mere referral link se kam se kam *₹${minOrderAmount}* ka order karne par aapko turant *₹${refereeDiscount} discount + free gift* milega!\n\n👇 *Order Now:*\n${referralShareUrl}\n\nReferral Code: *${userReferralCode}*`,
    });

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  };

  const handleSendDirectInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteFriendName.trim()) return;

    const fullRefereeName = `${inviteFriendName.trim()} ${
      inviteFriendFlat ? `(${inviteFriendFlat.trim()})` : ''
    }`.trim();
    const cleanPhone = inviteFriendPhone.trim();

    addReferralRecord({
      referrerName: user.name,
      referrerPhone: user.phone,
      refereeName: fullRefereeName,
      refereePhone: cleanPhone || 'WhatsApp Invite',
      referralCode: userReferralCode,
      sharedType: 'app',
      status: 'pending',
      cashbackAmount: referrerCashback,
      freeGiftName: freeGiftItem,
      giftDisbursed: false,
      paymentConfirmed: false,
    });

    const inviteUrl = getReferralWhatsAppUrl(inviteFriendName.trim());
    try {
      navigator.clipboard?.writeText(referralShareUrl);
    } catch {}
    setPendingInviteHref(inviteUrl);
    setFeedbackMsg(
      pickLang(lang, {
        en: `✓ Invite ready for ${inviteFriendName}! ₹${referrerCashback} unlocks once they purchase ₹${minOrderAmount}+ & delivery/payment confirms.`,
        hi: `✓ ${inviteFriendName} जी के लिए इनवाइट तैयार! ₹${minOrderAmount}+ ऑर्डर की डिलीवरी व पेमेंट कन्फ़र्म होने पर ₹${referrerCashback} मिलेगा।`,
        mr: `✓ ${inviteFriendName} साठी आमंत्रण तयार! ₹${minOrderAmount}+ ऑर्डर पूर्ण व पेमेंट कन्फर्म झाल्यावर ₹${referrerCashback} मिळेल.`,
        hinglish: `✓ ${inviteFriendName} ke liye invite ready hai! ₹${minOrderAmount}+ order deliver & pay confirm hone par ₹${referrerCashback} milega.`,
      })
    );
    setTimeout(() => {
      setFeedbackMsg(null);
      setPendingInviteHref(null);
    }, 8000);

    setInviteFriendName('');
    setInviteFriendFlat('');
    setInviteFriendPhone('');
    setShowInviteForm(false);
  };

  const deliveryStepLabel = (status?: string) => {
    switch (status) {
      case 'delivered':
        return pickLang(lang, { en: '✓ Delivered', hi: '✓ डिलीवर', mr: '✓ पोहोचले', hinglish: '✓ Delivered' });
      case 'out_for_delivery':
        return pickLang(lang, { en: '🚚 Out for Delivery', hi: '🚚 रास्ते में', mr: '🚚 मार्गावर', hinglish: '🚚 On the Way' });
      case 'packed':
        return pickLang(lang, { en: '📦 Packed', hi: '📦 पैक हुआ', mr: '📦 पॅक झाले', hinglish: '📦 Packed' });
      case 'cancelled':
        return pickLang(lang, { en: 'Cancelled', hi: 'रद्द', mr: 'रद्द', hinglish: 'Cancelled' });
      default:
        return pickLang(lang, { en: '⏳ Ordered', hi: '⏳ ऑर्डर दर्ज', mr: '⏳ नोंदवले', hinglish: '⏳ Ordered' });
    }
  };

  return (
    <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
      {/* 1. CLEAN HERO BANNER */}
      <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-emerald-800 via-teal-900 to-slate-900 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {pickLang(lang, {
                  en: `Society Referral & ₹${referrerCashback} Cashback`,
                  hi: `रेफ़रल व ₹${referrerCashback} कैशबैक प्रोग्राम`,
                  mr: `सोसायटी रेफरल व ₹${referrerCashback} कॅशबॅक`,
                  hinglish: `Society Referral & ₹${referrerCashback} Cashback`,
                })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-white">
              {pickLang(lang, {
                en: `Share & Earn ₹${referrerCashback} Cashback`,
                hi: `शेयर करें और ₹${referrerCashback} कैशबैक पाएँ`,
                mr: `शेअर करा आणि ₹${referrerCashback} कॅशबॅक मिळवा`,
                hinglish: `Share Karein & ₹${referrerCashback} Cashback Payein`,
              })}
            </h1>
            <p className="text-emerald-100/90 text-xs max-w-md leading-relaxed">
              {pickLang(lang, {
                en: `Neighbors save ₹${refereeDiscount} + ${freeGiftItem}, and you earn ₹${referrerCashback} cashback in your wallet.`,
                hi: `पड़ोसी को ₹${refereeDiscount} छूट व ${freeGiftItem}, और आपको ₹${referrerCashback} कैशबैक मिलेगा।`,
                mr: `शेजाऱ्यांना ₹${refereeDiscount} सूट व ${freeGiftItem}, आणि तुम्हाला ₹${referrerCashback} कॅशबॅक मिळेल.`,
                hinglish: `Neighbours ko ₹${refereeDiscount} off + ${freeGiftItem}, aur aapko ₹${referrerCashback} cashback milega.`,
              })}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 sm:min-w-[175px] sm:text-right shrink-0">
            <div className="text-[11px] text-emerald-200 font-medium flex items-center sm:justify-end gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {pickLang(lang, {
                  en: 'Wallet Balance',
                  hi: 'वॉलेट बैलेंस',
                  mr: 'वॉलेट शिल्लक',
                  hinglish: 'Wallet Balance',
                })}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-0.5 tabular-nums">
              ₹{currentWalletBalance}
            </div>
            <div className="text-[10px] text-emerald-200/90 mt-0.5">
              {currentWalletBalance > 0
                ? pickLang(lang, {
                    en: 'Ready to redeem in Cart',
                    hi: 'चेकआउट में उपयोग के लिए तैयार',
                    mr: 'कार्टमध्ये वापरण्यासाठी तयार',
                    hinglish: 'Cart me redeem ke liye ready',
                  })
                : pickLang(lang, {
                    en: `Unlocks after ₹${minOrderAmount}+ delivered order`,
                    hi: `₹${minOrderAmount}+ डिलीवरी व पेमेंट पर अनलॉक`,
                    mr: `₹${minOrderAmount}+ ऑर्डर पूर्ण झाल्यावर अनलॉक`,
                    hinglish: `₹${minOrderAmount}+ delivered order par unlock`,
                  })}
            </div>
          </div>
        </div>

        <div className="mt-3.5 p-2.5 sm:p-3 rounded-xl bg-amber-400/15 border border-amber-300/35 text-amber-100 text-[11px] flex items-start gap-2 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300">
              {pickLang(lang, {
                en: 'Eligibility Rule:',
                hi: 'जरूरी शर्त:',
                mr: 'पात्रता अट:',
                hinglish: 'Eligibility Rule:',
              })}
            </strong>{' '}
            {pickLang(lang, {
              en: `Your referred friend must order ₹${minOrderAmount}+ via your link. Once delivered & payment is confirmed, ₹${referrerCashback} credits automatically.`,
              hi: `दोस्त को आपके लिंक से कम से कम ₹${minOrderAmount} का ऑर्डर करना होगा। डिलीवरी व पेमेंट कन्फ़र्म होने के बाद ₹${referrerCashback} आपके वॉलेट में जुड़ता है।`,
              mr: `मित्राने तुमच्या लिंकवरून किमान ₹${minOrderAmount} ची ऑर्डर देणे आवश्यक आहे. डिलिव्हरी व पेमेंट कन्फर्म झाल्यावर ₹${referrerCashback} जमा होतील.`,
              hinglish: `Aapke dost ko link se min ₹${minOrderAmount} ka order karna hoga. Delivery aur payment confirm hone par ₹${referrerCashback} wallet me aayega.`,
            })}
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          {pendingInviteHref && (
            <a
              href={pendingInviteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1"
            >
              <Share2 className="w-3 h-3" />
              <span>
                {pickLang(lang, {
                  en: 'Open WhatsApp',
                  hi: 'WhatsApp खोलें',
                  mr: 'WhatsApp उघडा',
                  hinglish: 'WhatsApp Kholein',
                })}
              </span>
            </a>
          )}
        </div>
      )}

      {/* 2. CLEAN KPI SUMMARY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {pickLang(lang, {
                en: 'Confirmed Referrals',
                hi: 'सफल कन्फ़र्म रेफ़रल',
                mr: 'यशस्वी रेफरल्स',
                hinglish: 'Confirmed Referrals',
              })}
            </span>
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {successfulInvitesCount}{' '}
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {pickLang(lang, { en: 'completed', hi: 'पूर्ण', mr: 'पूर्ण', hinglish: 'completed' })}
            </span>
          </div>
          <div className="text-[10.5px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
            {pendingInvitesCount > 0
              ? pickLang(lang, {
                  en: `${pendingInvitesCount} awaiting delivery/pay`,
                  hi: `${pendingInvitesCount} कन्फ़र्म होना बाकी`,
                  mr: `${pendingInvitesCount} बाकी`,
                  hinglish: `${pendingInvitesCount} delivery/pay pending`,
                })
              : pickLang(lang, {
                  en: `Min ₹${minOrderAmount} per order`,
                  hi: `न्यूनतम ऑर्डर ₹${minOrderAmount}`,
                  mr: `किमान ₹${minOrderAmount} ऑर्डर`,
                  hinglish: `Min ₹${minOrderAmount} order zaroori`,
                })}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
            <Wallet className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              {pickLang(lang, {
                en: 'Total Earned Cashback',
                hi: 'कुल अर्जित कैशबैक',
                mr: 'एकूण मिळालेला कॅशबॅक',
                hinglish: 'Total Earned Cashback',
              })}
            </span>
          </div>
          <div className="text-lg font-black font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            ₹{lifetimeEarnedCashback}
          </div>
          <div className="text-[10.5px] text-indigo-700 dark:text-indigo-400 font-semibold mt-0.5">
            {pickLang(lang, {
              en: 'Credited on delivery confirm',
              hi: 'डिलीवरी व पेमेंट के बाद क्रेडिट',
              mr: 'डिलिव्हरी व पेमेंटनंतर जमा',
              hinglish: 'Delivery confirm ke baad credit',
            })}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {pickLang(lang, {
                en: 'Qualification Rule',
                hi: 'पात्रता नियम',
                mr: 'पात्रता नियम',
                hinglish: 'Qualification Rule',
              })}
            </span>
          </div>
          <div className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
            {pickLang(lang, {
              en: `Min ₹${minOrderAmount} Order`,
              hi: `न्यूनतम ₹${minOrderAmount} ऑर्डर`,
              mr: `किमान ₹${minOrderAmount} ऑर्डर`,
              hinglish: `Min ₹${minOrderAmount} Order`,
            })}
          </div>
          <div className="text-[10.5px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5 truncate">
            + {freeGiftItem}
          </div>
        </div>
      </div>

      {/* 3. REFERRAL LINK & INVITE */}
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: 'Your Personal Referral Link & Code',
                  hi: 'आपका व्यक्तिगत रेफ़रल लिंक व कोड',
                  mr: 'तुमची वैयक्तिक रेफरल लिंक व कोड',
                  hinglish: 'Aapka Personal Referral Link & Code',
                })}
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {pickLang(lang, {
                en: `Share link — neighbor orders ₹${minOrderAmount}+ & confirms delivery ➔ you earn ₹${referrerCashback}.`,
                hi: `लिंक भेजें — पड़ोसी ₹${minOrderAmount}+ ऑर्डर करे और डिलीवरी कन्फ़र्म हो ➔ ₹${referrerCashback} मिलेगा।`,
                mr: `लिंक शेअर करा — मित्र ₹${minOrderAmount}+ ऑर्डर पूर्ण झाल्यावर ➔ ₹${referrerCashback} मिळेल.`,
                hinglish: `Link share karein — dost ₹${minOrderAmount}+ order kare aur delivery confirm ho ➔ ₹${referrerCashback} milega.`,
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {pickLang(lang, { en: 'Code:', hi: 'कोड:', mr: 'कोड:', hinglish: 'Code:' })}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg font-mono font-black text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-1.5 hover:bg-emerald-50 transition cursor-pointer"
            >
              <span>{userReferralCode}</span>
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralShareUrl}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-700 dark:text-slate-200 select-all pr-10 focus:outline-emerald-600"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              aria-label="Copy referral link"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {pickLang(lang, { en: 'Copied!', hi: 'कॉपी हो गया!', mr: 'कॉपी केले!', hinglish: 'Copied!' })}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {pickLang(lang, { en: 'Copy Link', hi: 'लिंक कॉपी करें', mr: 'लिंक कॉपी करा', hinglish: 'Copy Link' })}
                  </span>
                </>
              )}
            </button>

            <a
              href={getReferralWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center justify-center gap-2 transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Share on WhatsApp',
                  hi: 'WhatsApp पर भेजें',
                  mr: 'WhatsApp वर शेअर करा',
                  hinglish: 'WhatsApp par Bhejein',
                })}
              </span>
            </a>
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>
              {showInviteForm
                ? pickLang(lang, { en: '✕ Close Form', hi: '✕ फॉर्म बंद करें', mr: '✕ फॉर्म बंद करा', hinglish: '✕ Close Form' })
                : pickLang(lang, {
                    en: '+ Invite a Neighbor by Name',
                    hi: '+ पड़ोसी के नाम से इनवाइट भेजें',
                    mr: '+ शेजाऱ्याच्या नावाने आमंत्रण पाठवा',
                    hinglish: '+ Neighbor ko Naam se Invite Karein',
                  })}
            </span>
          </button>
        </div>

        {showInviteForm && (
          <form
            onSubmit={handleSendDirectInvite}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-3"
          >
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: 'Invite a Society Neighbor',
                  hi: 'सोसायटी के पड़ोसी को इनवाइट करें',
                  mr: 'सोसायटीतील शेजाऱ्याला आमंत्रित करा',
                  hinglish: 'Society Neighbor ko Invite Karein',
                })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {pickLang(lang, { en: 'Neighbor Name *', hi: 'दोस्त का नाम *', mr: 'मित्राचे नाव *', hinglish: 'Friend Name *' })}
                </label>
                <input
                  type="text"
                  required
                  value={inviteFriendName}
                  onChange={(e) => setInviteFriendName(e.target.value)}
                  placeholder={pickLang(lang, { en: 'e.g. Amit Sharma', hi: 'उदा. अमित शर्मा', hinglish: 'e.g. Amit Sharma' })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {pickLang(lang, { en: 'Flat / Wing', hi: 'फ्लैट नं.', mr: 'फ्लॅट क्र.', hinglish: 'Flat / Wing' })}
                </label>
                <input
                  type="text"
                  value={inviteFriendFlat}
                  onChange={(e) => setInviteFriendFlat(e.target.value)}
                  placeholder="B-Wing 304"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  {pickLang(lang, { en: 'Phone (Optional)', hi: 'मोबाइल नंबर (वैकल्पिक)', mr: 'फोन (ऐच्छिक)', hinglish: 'Phone (Optional)' })}
                </label>
                <input
                  type="tel"
                  value={inviteFriendPhone}
                  onChange={(e) => setInviteFriendPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 font-bold cursor-pointer"
              >
                {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, { en: 'Send WhatsApp Invite', hi: 'WhatsApp इनवाइट भेजें', mr: 'WhatsApp आमंत्रण पाठवा', hinglish: 'Send WhatsApp Invite' })}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 4. HOW CASHBACK WORKS */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-xs">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>
              {pickLang(lang, {
                en: `How ₹${referrerCashback} Cashback Unlocks & Redeems`,
                hi: `₹${referrerCashback} कैशबैक कैसे अनलॉक व रिडीम होता है?`,
                mr: `₹${referrerCashback} कॅशबॅक कसा मिळतो आणि वापरता येतो?`,
                hinglish: `₹${referrerCashback} Cashback Kaise Unlock Hota Hai`,
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onClose) onClose();
              setIsCartOpen(true);
            }}
            className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Redeem in Cart ➔',
                hi: 'थैली में रिडीम करें ➔',
                mr: 'कार्टमध्ये वापरा ➔',
                hinglish: 'Cart me Redeem Karein ➔',
              })}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-600 dark:text-slate-300">
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <strong className="text-emerald-700 dark:text-emerald-400 block font-bold mb-0.5">
              {pickLang(lang, {
                en: `1. Friend Orders ₹${minOrderAmount}+`,
                hi: `1. दोस्त ₹${minOrderAmount}+ ऑर्डर करे`,
                mr: `1. मित्र ₹${minOrderAmount}+ ऑर्डर करतो`,
                hinglish: `1. Friend ₹${minOrderAmount}+ Order Kare`,
              })}
            </strong>
            {pickLang(lang, {
              en: `Friend opens your link & orders at least ₹${minOrderAmount}.`,
              hi: `दोस्त आपके लिंक से कम से कम ₹${minOrderAmount} की सब्ज़ियाँ/सामान ऑर्डर करे।`,
              mr: `मित्राने तुमच्या लिंकवरून किमान ₹${minOrderAmount} ची खरेदी करावी.`,
              hinglish: `Dost aapke link se min ₹${minOrderAmount} ka samaan order kare.`,
            })}
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <strong className="text-emerald-700 dark:text-emerald-400 block font-bold mb-0.5">
              {pickLang(lang, {
                en: '2. Delivery & Pay Confirmed',
                hi: '2. डिलीवरी + पेमेंट कन्फ़र्म',
                mr: '2. डिलिव्हरी व पेमेंट कन्फर्म',
                hinglish: '2. Delivery & Pay Confirm',
              })}
            </strong>
            {pickLang(lang, {
              en: `After delivery & payment confirm, ₹${referrerCashback} credits to your wallet.`,
              hi: `ऑर्डर डिलीवर होकर पेमेंट कन्फ़र्म होते ही ₹${referrerCashback} वॉलेट में जुड़ता है।`,
              mr: `डिलिव्हरी व पेमेंट कन्फर्म झाल्यावर ₹${referrerCashback} वॉलेटमध्ये जमा होतात.`,
              hinglish: `Order deliver aur payment confirm hote hi ₹${referrerCashback} wallet me aata hai.`,
            })}
          </div>
          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
            <strong className="text-emerald-700 dark:text-emerald-400 block font-bold mb-0.5">
              {pickLang(lang, {
                en: '3. Auto-Apply at Checkout',
                hi: '3. चेकआउट में सीधा लाभ',
                mr: '3. चेकआउटवर थेट सूट',
                hinglish: '3. Checkout me Auto-Apply',
              })}
            </strong>
            {pickLang(lang, {
              en: 'Credited cashback auto-deducts inside your Cart on your next order!',
              hi: 'क्रेडिट हुआ कैशबैक आपकी अगली खरीदारी के बिल से अपने-आप कम हो जाता है।',
              mr: 'जमा कॅशबॅक तुमच्या पुढील बिलातून आपोआप वजा होतो.',
              hinglish: 'Credited cashback aapke next cart bill me seedha kam ho jaata hai!',
            })}
          </div>
        </div>
      </div>

      {/* 5. REAL ACTIVITY FEED (Zero Fake Items) */}
      <div className="space-y-2.5 pt-1">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {pickLang(lang, {
              en: `Referred Friends & Status (${activeInvites.length})`,
              hi: `आमंत्रित दोस्त व स्टेटस (${activeInvites.length})`,
              mr: `आमंत्रित मित्र व स्थिती (${activeInvites.length})`,
              hinglish: `Referred Friends & Status (${activeInvites.length})`,
            })}
          </span>
        </h3>

        {activeInvites.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 text-center space-y-1.5">
            <div className="text-slate-800 dark:text-slate-200 font-bold">
              {pickLang(lang, {
                en: 'No referred orders recorded yet',
                hi: 'अभी आपके रेफ़रल लिंक से कोई ऑर्डर पूरा नहीं हुआ है',
                mr: 'अद्याप तुमच्या लिंकवरून कोणतीही ऑर्डर पूर्ण झालेली नाही',
                hinglish: 'Abhi aapke referral link se koi order record nahi hua hai',
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {pickLang(lang, {
                en: `Share your link above. Once a friend completes a ₹${minOrderAmount}+ order with confirmed delivery & payment, ₹${referrerCashback} cashback will appear here.`,
                hi: `ऊपर दिया लिंक अपने पड़ोसियों को भेजें। जब वे कम से कम ₹${minOrderAmount} का ऑर्डर पूरा करेंगे, तब यहाँ ₹${referrerCashback} कैशबैक दिखेगा।`,
                mr: `वरील लिंक शेअर करा. मित्राने किमान ₹${minOrderAmount} ची ऑर्डर पूर्ण केल्यावर येथे कॅशबॅक दिसेल.`,
                hinglish: `Upar diya link doston ko bhejein. ₹${minOrderAmount}+ order complete hone par yahan ₹${referrerCashback} cashback dikhega.`,
              })}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {activeInvites.map((invite) => {
              const isRewarded = invite.status === 'rewarded';
              const isQualified = invite.status === 'qualified';
              const isBelowMin = invite.status === 'below_minimum';

              return (
                <div
                  key={invite.id}
                  className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isRewarded
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : isQualified
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                          : isBelowMin
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {isRewarded ? '✓' : isQualified ? '📦' : isBelowMin ? '!' : '⏳'}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span>{invite.refereeName}</span>
                        {invite.orderId && (
                          <span className="font-mono text-[10px] text-slate-500">
                            #{invite.orderId}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                        <span>{invite.createdAt}</span>
                        <span>·</span>
                        <span className="truncate max-w-[180px]">
                          {invite.productName || brand.brandName}
                        </span>
                        {typeof invite.orderAmount === 'number' && (
                          <>
                            <span>·</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                              ₹{invite.orderAmount}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-left sm:text-right">
                      <div
                        className={`font-mono font-black text-xs ${
                          isBelowMin
                            ? 'text-slate-400 line-through'
                            : isRewarded
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        +₹{invite.cashbackAmount}{' '}
                        {pickLang(lang, { en: 'Cashback', hi: 'कैशबैक', mr: 'कॅशबॅक', hinglish: 'Cashback' })}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {invite.paymentConfirmed
                          ? pickLang(lang, {
                              en: '✓ Delivery & Paid',
                              hi: '✓ डिलीवरी व पेमेंट कन्फ़र्म',
                              mr: '✓ डिलिव्हरी व पेमेंट कन्फर्म',
                              hinglish: '✓ Delivery & Paid',
                            })
                          : isBelowMin
                          ? pickLang(lang, {
                              en: `Below ₹${minOrderAmount} min.`,
                              hi: `₹${minOrderAmount} से कम ऑर्डर`,
                              mr: `₹${minOrderAmount} पेक्षा कमी`,
                              hinglish: `₹${minOrderAmount} se kam order`,
                            })
                          : deliveryStepLabel(invite.deliveryStatus)}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        isRewarded
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : isQualified
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                          : isBelowMin
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {isRewarded
                        ? pickLang(lang, {
                            en: `✓ Rewarded ₹${invite.cashbackAmount}`,
                            hi: `✓ ₹${invite.cashbackAmount} वॉलेट में जुड़ा`,
                            mr: `✓ ₹${invite.cashbackAmount} जमा झाले`,
                            hinglish: `✓ Rewarded ₹${invite.cashbackAmount}`,
                          })
                        : isQualified
                        ? pickLang(lang, {
                            en: '📦 Pending Confirm',
                            hi: '📦 कन्फ़र्म बाकी',
                            mr: '📦 कन्फर्म बाकी',
                            hinglish: '📦 Confirm Pending',
                          })
                        : isBelowMin
                        ? pickLang(lang, {
                            en: `⚠️ Below ₹${minOrderAmount}`,
                            hi: `⚠️ ₹${minOrderAmount} से कम`,
                            mr: `⚠️ ₹${minOrderAmount} पेक्षा कमी`,
                            hinglish: `⚠️ Below ₹${minOrderAmount}`,
                          })
                        : pickLang(lang, {
                            en: '⏳ Pending Order',
                            hi: '⏳ ऑर्डर बाकी',
                            mr: '⏳ ऑर्डर बाकी',
                            hinglish: '⏳ Order Pending',
                          })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

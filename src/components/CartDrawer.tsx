import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SafeProductImg } from './SafeProductImg';
import { OrderFeedbackCard } from './OrderFeedbackCard';
import { pickLang, resolveLocalizedProduceName, resolveLocalizedField } from '../utils/i18nHelper';
import { rewardsApi } from '../api/endpoints';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  Leaf,
  Clock,
  Truck,
  QrCode,
  Share2,
  FileText,
  Copy,
  Check,
  ExternalLink,
  User,
  Gift,
  ChefHat,
  Sparkles,
  XCircle,
  Ticket,
} from 'lucide-react';
import {
  OFFICIAL_UPI_CONFIG,
  generateUpiUrl,
  generateUpiQrCodeUrl,
  generateOrderWhatsAppBillText,
} from '../utils/billingUtils';
import { CustomerOrder, CustomerRewardRecord, ProduceItem } from '../types';

interface CartDrawerProps {
  onTrackOrder?: (orderId: string) => void;
  onOpenInvoice?: (order: CustomerOrder) => void;
}

// Contextual dish pairing rules based on what is already in the cart
const DISH_PAIRING_MAP: Record<string, string[]> = {
  root_potato: ['veg_cauliflower', 'veg_green_peas', 'veg_tomato', 'root_onion', 'herb_coriander'],
  veg_cauliflower: ['root_potato', 'veg_green_peas', 'veg_tomato', 'root_ginger', 'herb_coriander'],
  veg_okra: ['root_onion', 'veg_tomato', 'citrus_lemon', 'veg_green_chilli', 'herb_coriander'],
  veg_brinjal: ['root_potato', 'veg_tomato', 'root_onion', 'root_garlic', 'herb_coriander'],
  leafy_palak: ['root_garlic', 'veg_tomato', 'root_onion', 'veg_green_chilli', 'citrus_lemon'],
  leafy_methi: ['root_potato', 'root_garlic', 'veg_green_chilli', 'root_onion'],
  veg_green_peas: ['root_potato', 'veg_cauliflower', 'root_carrot', 'veg_tomato', 'herb_coriander'],
  veg_capsicum: ['root_potato', 'root_onion', 'veg_tomato', 'veg_cabbage', 'root_carrot'],
  veg_cabbage: ['veg_green_peas', 'root_carrot', 'veg_capsicum', 'veg_green_chilli', 'herb_coriander'],
  veg_tomato: ['root_onion', 'herb_coriander', 'veg_green_chilli', 'root_ginger', 'root_garlic'],
  root_onion: ['veg_tomato', 'root_potato', 'veg_green_chilli', 'root_ginger', 'herb_coriander'],
  veg_cucumber: ['veg_tomato', 'root_carrot', 'root_beetroot', 'citrus_lemon', 'herb_mint'],
};

const ESSENTIALS_FALLBACK_IDS = [
  'herb_coriander',
  'citrus_lemon',
  'veg_green_chilli',
  'root_ginger',
  'root_garlic',
  'veg_tomato',
];

const SEASONAL_FRUIT_HIGHLIGHTS: {
  id: string;
  seasonType: 'in_season' | 'upcoming';
}[] = [
  { id: 'fruit_mango', seasonType: 'upcoming' },
  { id: 'fruit_custard_apple', seasonType: 'upcoming' },
  { id: 'fruit_strawberry', seasonType: 'upcoming' },
  { id: 'fruit_muskmelon', seasonType: 'in_season' },
  { id: 'fruit_watermelon', seasonType: 'in_season' },
  { id: 'fruit_grapes_green', seasonType: 'in_season' },
  { id: 'fruit_pomegranate', seasonType: 'in_season' },
  { id: 'fruit_banana', seasonType: 'in_season' },
];

export const CartDrawer: React.FC<CartDrawerProps> = ({ onTrackOrder, onOpenInvoice }) => {
  const {
    produceCart,
    accessoryCart,
    produceList,
    accessoriesList,
    setProduceCartQty,
    addProduceToCart,
    removeProduceFromCart,
    setAccessoryCartQty,
    removeAccessoryFromCart,
    isCartOpen,
    setIsCartOpen,
    user,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    setActiveAddress,
    placeOrder,
    cancelOrder,
    orders,
    redeemWalletBalance,
    referralConfig,
    referredByCode,
    brand,
    lang,
    t,
    isBefore11PmCutoff,
    featureFlags,
  } = useApp();

  const [deliverySlot, setDeliverySlot] = useState('10:00 AM - 12:00 PM');
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<CustomerOrder | null>(null);
  const [confirmCancelInline, setConfirmCancelInline] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi_qr' | 'cod'>('upi_qr');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [applyWalletDiscount, setApplyWalletDiscount] = useState(true);
  const [activeAdminRewards, setActiveAdminRewards] = useState<CustomerRewardRecord[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string>('');

  useEffect(() => {
    if (!isCartOpen || !user.isLoggedIn || (!user.id && !user.phone)) {
      return;
    }
    let cancelled = false;
    rewardsApi
      .getMyRewards({ userId: user.id, phone: user.phone })
      .then((res) => {
        if (cancelled) return;
        const active = (res?.rewards || []).filter((r) => r.status === 'active');
        setActiveAdminRewards(active);
        if (active.length > 0) {
          setSelectedRewardId((prev) =>
            prev && active.some((a) => a.id === prev) ? prev : active[0].id
          );
        } else {
          setSelectedRewardId('');
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isCartOpen, user.isLoggedIn, user.id, user.phone]);

  const getCleanItemName = (
    nameObj: { en: string; hi: string; mr: string; hinglish: string },
    id?: string
  ) => resolveLocalizedProduceName(nameObj, lang, id);

  const getUnitShort = (unit?: string) => {
    if (unit === 'gaddi') {
      return pickLang(lang, {
        en: 'Gaddi',
        hi: 'गड्डी',
        mr: 'जुडी',
        hinglish: 'Gaddi',
        gu: 'ગડ્ડી',
        bn: 'আঁটি',
        ta: 'கட்டு',
        te: 'కట్ట',
        kn: 'ಕಟ್ಟು',
        pa: 'ਗੁੱਛੀ',
      });
    }
    if (unit === 'piece') {
      return pickLang(lang, {
        en: 'Pc',
        hi: 'पीस',
        mr: 'नग',
        hinglish: 'Pc',
        gu: 'નંગ',
        bn: 'পিস',
        ta: 'எண்ணிக்கை',
        te: 'పీస్',
        kn: 'ನಂಗ್',
        pa: 'ਪੀਸ',
      });
    }
    return 'kg';
  };

  // Smart dish-based pairing suggestions based on produce currently in cart
  const dishRecommendations = useMemo(() => {
    const inCartIds = new Set(Object.keys(produceCart).filter((id) => produceCart[id] > 0));
    const scoredIds = new Map<string, number>();

    inCartIds.forEach((cartId) => {
      const pairs = DISH_PAIRING_MAP[cartId] || [];
      pairs.forEach((targetId, index) => {
        if (!inCartIds.has(targetId)) {
          scoredIds.set(targetId, (scoredIds.get(targetId) || 0) + (10 - index));
        }
      });
    });

    ESSENTIALS_FALLBACK_IDS.forEach((id, idx) => {
      if (!inCartIds.has(id) && !scoredIds.has(id)) {
        scoredIds.set(id, 3 - idx * 0.2);
      }
    });

    const sortedIds = Array.from(scoredIds.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    const items: ProduceItem[] = [];
    for (const id of sortedIds) {
      const found = produceList.find((p) => p.id === id && p.isAvailable !== false);
      if (found) items.push(found);
      if (items.length >= 4) break;
    }
    return items;
  }, [produceCart, produceList]);

  // Seasonal & Upcoming Fruit Recommendations
  const seasonalFruitUpsells = useMemo(() => {
    const inCartIds = new Set(Object.keys(produceCart).filter((id) => produceCart[id] > 0));
    const result: { item: ProduceItem; seasonType: 'in_season' | 'upcoming' }[] = [];

    for (const entry of SEASONAL_FRUIT_HIGHLIGHTS) {
      if (inCartIds.has(entry.id)) continue;
      const found = produceList.find((p) => p.id === entry.id && p.isAvailable !== false);
      if (found) {
        result.push({ item: found, seasonType: entry.seasonType });
      }
      if (result.length >= 4) break;
    }
    return result;
  }, [produceCart, produceList]);

  if (!isCartOpen) return null;

  // Produce Items
  const produceItems = Object.entries(produceCart)
    .map(([id, kg]) => {
      const prod = produceList.find((p) => p.id === id);
      const effectiveUnitRate = prod
        ? prod.discountPrice && prod.discountPrice > 0 && prod.discountPrice < prod.pricePerKg
          ? prod.discountPrice
          : prod.pricePerKg
        : 0;
      return {
        prod,
        quantityKg: kg,
        effectiveUnitRate,
        itemTotal: prod ? Math.round(kg * effectiveUnitRate) : 0,
      };
    })
    .filter((ci) => ci.prod !== undefined && ci.quantityKg > 0);

  // Accessory Items
  const accessoryItems = Object.entries(accessoryCart)
    .map(([id, qty]) => {
      const acc = accessoriesList.find((a) => a.id === id);
      return {
        acc,
        quantity: qty,
        itemTotal: acc ? qty * acc.price : 0,
      };
    })
    .filter((ci) => ci.acc !== undefined && ci.quantity > 0);

  const produceTotal = produceItems.reduce((s, i) => s + i.itemTotal, 0);
  const accessoriesTotal = accessoryItems.reduce((s, i) => s + i.itemTotal, 0);
  const grandTotal = produceTotal + accessoriesTotal;

  const selectedReward = activeAdminRewards.find((r) => r.id === selectedRewardId) || null;
  const isSelectedRewardEligible = selectedReward
    ? grandTotal >= (selectedReward.minOrderRupees || 0)
    : false;
  const effectiveCouponDiscount =
    selectedReward && isSelectedRewardEligible
      ? Math.min(
          grandTotal,
          selectedReward.discountRupees > 0
            ? selectedReward.discountRupees
            : selectedReward.discountPercent > 0
            ? Math.round((grandTotal * selectedReward.discountPercent) / 100)
            : 0
        )
      : 0;
  const afterCouponTotal = Math.max(0, grandTotal - effectiveCouponDiscount);

  const walletBalance = user?.walletBalance || 0;
  const effectiveWalletDiscount =
    applyWalletDiscount && walletBalance > 0 ? Math.min(walletBalance, afterCouponTotal) : 0;
  const payableGrandTotal = Math.max(0, afterCouponTotal - effectiveWalletDiscount);
  const freeGiftItem =
    (isSelectedRewardEligible ? selectedReward?.freeGiftItem : undefined) ||
    user?.freeGiftAvailable ||
    (referralConfig?.freeProduceGiftEnabled ? referralConfig?.freeProduceName : undefined);

  const totalProduceKg = Math.round(produceItems.reduce((s, i) => s + i.quantityKg, 0) * 10) / 10;
  const totalAccessoriesUnits = accessoryItems.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    if (produceItems.length === 0 && accessoryItems.length === 0) return;
    if (!user.isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    if (effectiveWalletDiscount > 0) {
      redeemWalletBalance(effectiveWalletDiscount);
    }
    const rewardToRedeem = selectedReward && isSelectedRewardEligible ? selectedReward : null;
    const ord = placeOrder(deliverySlot, paymentMethod, {
      discountAmount: effectiveCouponDiscount + effectiveWalletDiscount,
      couponCode: rewardToRedeem?.couponCode,
      surpriseGift: rewardToRedeem?.freeGiftItem || undefined,
    });
    if (rewardToRedeem) {
      rewardsApi.redeemReward(rewardToRedeem.id, ord.id).catch(() => {});
      setActiveAdminRewards((prev) => prev.filter((r) => r.id !== rewardToRedeem.id));
      setSelectedRewardId('');
    }
    setConfirmedOrderId(ord.id);
    setConfirmedOrder(ord);
    setOrderConfirmed(true);
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setOrderConfirmed(false);
    setConfirmedOrder(null);
    setConfirmCancelInline(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                {brand.brandName} · APMC Vashi Direct
              </div>
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-slate-100">
                {t('cart_title')}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {orderConfirmed && confirmedOrder ? (
              <div className="py-6 flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Order Confirmed in Batch!',
                      hi: '24x7 आर्डर सफलतापूर्वक दर्ज!',
                      mr: 'ऑर्डर यशस्वीरीत्या नोंदवली गेली!',
                      hinglish: 'Order Confirm Ho Gaya!',
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 font-bold">
                    Order ID: #{confirmedOrderId} · Total: ₹{confirmedOrder.totalAmount}
                  </p>
                </div>

                {/* DYNAMIC KOTAK BANK UPI QR CODE */}
                <div className="w-full bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border-2 border-emerald-500/40 text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Kotak UPI QR Payment</span>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-mono font-black text-sm">
                      ₹{confirmedOrder.totalAmount}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={generateUpiQrCodeUrl(confirmedOrder.totalAmount, confirmedOrderId)}
                      alt="Kotak UPI QR Code"
                      className="w-32 h-32 object-contain rounded-lg border border-slate-100 dark:border-slate-800"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5 text-xs text-center sm:text-left">
                      <div className="text-[11px] text-slate-500">
                        {pickLang(lang, {
                          en: 'Scan via GPay / PhonePe / Paytm',
                          hi: 'GPay / PhonePe / Paytm से स्कैन करें',
                          mr: 'GPay / PhonePe / Paytm ने स्कॅन करा',
                          hinglish: 'GPay / PhonePe / Paytm se scan karein',
                        })}
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate text-[11px] bg-slate-100 dark:bg-slate-800 p-1.5 rounded">
                        {OFFICIAL_UPI_CONFIG.upiId}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(OFFICIAL_UPI_CONFIG.upiId);
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2000);
                          }}
                          className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          {copiedUpi ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>
                            {copiedUpi
                              ? pickLang(lang, { en: 'Copied', hi: 'कॉपी हुआ', mr: 'कॉपी झाले' })
                              : pickLang(lang, { en: 'Copy UPI', hi: 'UPI कॉपी', mr: 'UPI कॉपी' })}
                          </span>
                        </button>
                        <a
                          href={generateUpiUrl(confirmedOrder.totalAmount, confirmedOrderId)}
                          className="flex-1 py-1 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>{pickLang(lang, { en: 'Pay App', hi: 'Pay ऐप', mr: 'Pay अ‍ॅप' })}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 text-left w-full space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {pickLang(lang, {
                        en: 'Delivery Schedule:',
                        hi: 'डिलीवरी समय:',
                        mr: 'डिलिव्हरी वेळ:',
                        hinglish: 'Delivery Time:',
                      })}
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {confirmedOrder.targetDeliveryDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {pickLang(lang, {
                        en: 'Customer Flat:',
                        hi: 'ग्राहक फ्लैट:',
                        mr: 'ग्राहक फ्लॅट:',
                        hinglish: 'Customer Flat:',
                      })}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.wing} - {user.flat}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      {pickLang(lang, {
                        en: 'Mandi Sourcing:',
                        hi: 'मंडी उठाव:',
                        mr: 'मंडी खरेदी:',
                        hinglish: 'Mandi Sourcing:',
                      })}
                    </span>
                    <span className="font-semibold">{brand.mandiCity.split(',')[0]} (4:00 AM)</span>
                  </div>
                  {(confirmedOrder.appliedCouponCode || confirmedOrder.surpriseGiftItem || (confirmedOrder.discountAmount || 0) > 0) && (
                    <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-1 text-emerald-700 dark:text-emerald-300 font-bold">
                      <span>
                        🎁{' '}
                        {confirmedOrder.appliedCouponCode
                          ? `Coupon ${confirmedOrder.appliedCouponCode}`
                          : 'Admin Reward Applied'}
                        {confirmedOrder.surpriseGiftItem ? ` · Free: ${confirmedOrder.surpriseGiftItem}` : ''}
                      </span>
                      {(confirmedOrder.discountAmount || 0) > 0 && (
                        <span className="font-mono">-₹{confirmedOrder.discountAmount}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Post-Checkout Experience Rating */}
                {(() => {
                  const liveOrd = orders.find((o) => o.id === confirmedOrderId) || confirmedOrder;
                  if (liveOrd.status === 'cancelled') return null;
                  return <OrderFeedbackCard order={liveOrd} stage="checkout" compact />;
                })()}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 w-full pt-1">
                  {(() => {
                    const billText = generateOrderWhatsAppBillText(confirmedOrder, brand);
                    const cleanAdmin = (brand.whatsappContact || '+91 88288 22808').replace(/\D/g, '');
                    const adminWaPhone = cleanAdmin.startsWith('91') ? cleanAdmin : `91${cleanAdmin}`;
                    const cleanCust = (confirmedOrder.phone || user.phone || '').replace(/\D/g, '');
                    const custWaPhone =
                      cleanCust.length >= 10
                        ? cleanCust.startsWith('91')
                          ? cleanCust
                          : `91${cleanCust}`
                        : '';
                    return (
                      <>
                        <a
                          href={`https://wa.me/${adminWaPhone}?text=${encodeURIComponent(
                            `📢 *New Order Received (${brand.brandName})*\n\n${billText}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-2 shadow-xs"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>
                            {pickLang(lang, {
                              en: '📲 Notify Admin on WhatsApp',
                              hi: '📲 व्यवस्थापक (Admin) को WhatsApp भेजें',
                              mr: '📲 अ‍ॅडमिनला WhatsApp वर पाठवा',
                              hinglish: '📲 Admin ko WhatsApp Bhejein',
                            })}
                          </span>
                        </a>

                        <a
                          href={
                            custWaPhone
                              ? `https://wa.me/${custWaPhone}?text=${encodeURIComponent(billText)}`
                              : `https://wa.me/?text=${encodeURIComponent(billText)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            {pickLang(lang, {
                              en: 'Send Customer WhatsApp Bill',
                              hi: 'ग्राहक WhatsApp पर बिल भेजें',
                              mr: 'ग्राहकाच्या WhatsApp वर बिल पाठवा',
                              hinglish: 'Customer WhatsApp Bill Bhejein',
                            })}
                          </span>
                        </a>
                      </>
                    );
                  })()}

                  {onOpenInvoice && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onOpenInvoice(confirmedOrder);
                      }}
                      className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>
                        {pickLang(lang, {
                          en: '📄 View & Print Bill / Invoice',
                          hi: '📄 पक्का बिल / इनवॉइस देखें व प्रिंट करें',
                          mr: '📄 अधिकृत बिल / पावती पहा',
                          hinglish: '📄 Pakka Bill / Invoice Dekhein',
                        })}
                      </span>
                    </button>
                  )}

                  {onTrackOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        handleClose();
                        onTrackOrder(confirmedOrderId);
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Truck className="w-4 h-4" />
                      <span>
                        {pickLang(lang, {
                          en: '🚚 Track Live Mandi Dispatch',
                          hi: '🚚 लाइव मंडी डिस्पैच ट्रैक करें',
                          mr: '🚚 थेट मंडी डिस्पॅच ट्रॅक करा',
                          hinglish: '🚚 Live Mandi Dispatch Track Karein',
                        })}
                      </span>
                    </button>
                  )}

                  {(() => {
                    const liveOrder = orders.find((o) => o.id === confirmedOrderId) || confirmedOrder;
                    if (liveOrder.status === 'cancelled') {
                      return (
                        <div className="w-full p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5">
                          <XCircle className="w-4 h-4" />
                          <span>
                            {pickLang(lang, {
                              en: 'Order Cancelled',
                              hi: 'ऑर्डर रद्द कर दिया गया',
                              mr: 'ऑर्डर रद्द केली',
                              hinglish: 'Order Cancel Ho Gaya',
                            })}
                          </span>
                        </div>
                      );
                    }
                    if (confirmCancelInline) {
                      return (
                        <div className="w-full p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2 text-xs">
                          <div className="font-bold text-rose-800 dark:text-rose-200">
                            {pickLang(lang, {
                              en: 'Cancel this order right now?',
                              hi: 'क्या आप यह ऑर्डर अभी रद्द करना चाहते हैं?',
                              mr: 'ही ऑर्डर आत्ता रद्द करायची का?',
                              hinglish: 'Kya yeh order abhi cancel karein?',
                            })}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmCancelInline(false)}
                              className="flex-1 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                            >
                              {pickLang(lang, { en: 'No, Keep', hi: 'नहीं, रखें', mr: 'नाही ठेवा', hinglish: 'Keep' })}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                cancelOrder(confirmedOrderId, 'Cancelled immediately from cart');
                                setConfirmedOrder((prev) => (prev ? { ...prev, status: 'cancelled' } : prev));
                                setConfirmCancelInline(false);
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                            >
                              {pickLang(lang, { en: 'Yes, Cancel', hi: 'हाँ, कैंसिल करें', mr: 'हो, रद्द करा', hinglish: 'Haan Cancel' })}
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => setConfirmCancelInline(true)}
                        className="w-full py-2 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>
                          {pickLang(lang, {
                            en: 'Cancel Order',
                            hi: 'ऑर्डर कैंसिल करें',
                            mr: 'ऑर्डर रद्द करा',
                            hinglish: 'Order Cancel Karein',
                          })}
                        </span>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-2 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors mt-1"
                  >
                    {pickLang(lang, {
                      en: 'Continue Shopping',
                      hi: 'खरीदारी जारी रखें',
                      mr: 'खरेदी सुरू ठेवा',
                      hinglish: 'Shopping Jari Rakhein',
                    })}
                  </button>
                </div>
              </div>
            ) : produceItems.length === 0 && accessoryItems.length === 0 ? (
              <div className="py-12 text-center space-y-6">
                <div>
                  <span className="text-4xl block mb-3">🛍️</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Your cart is currently empty',
                      hi: 'आपकी थैली अभी खाली है',
                      mr: 'तुमची पिशवी सध्या रिकामी आहे',
                      hinglish: 'Aapki cart abhi khali hai',
                    })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {pickLang(lang, {
                      en: 'Add fresh vegetables, seasonal fruits, or MARCO 100 mobile accessories.',
                      hi: 'ताज़ी सब्ज़ियाँ, मौसमी फल या मोबाइल एक्सेसरीज़ (चार्जर, ईयरबड्स) जोड़ें।',
                      mr: 'ताज्या भाज्या, हंगामी फळे किंवा मोबाइल अ‍ॅक्सेसरीज पिशवीत जोडा.',
                      hinglish: 'Fresh sabziyan, seasonal fruits ya MARCO 100 accessories add karein.',
                    })}
                  </p>
                </div>

                {/* Also show seasonal fruits picker in empty cart for quick attraction */}
                {seasonalFruitUpsells.length > 0 && (
                  <div className="text-left p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-2">
                    <div className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {pickLang(lang, {
                          en: '🍓 Fresh In-Season & Upcoming Fruits',
                          hi: '🍓 आज के ताज़े व आने वाले मौसमी फल',
                          mr: '🍓 आजची ताजी व येणारी हंगामी फळे',
                          hinglish: '🍓 Aaj Ke Fresh Seasonal Fruits',
                        })}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {seasonalFruitUpsells.map(({ item, seasonType }) => {
                        const rate =
                          item.discountPrice && item.discountPrice > 0
                            ? item.discountPrice
                            : item.pricePerKg;
                        const uTxt = getUnitShort(item.pricingUnit);
                        return (
                          <div
                            key={item.id}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-700 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SafeProductImg
                                product={item}
                                alt={item.name.en}
                                className="w-9 h-9 rounded-md object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {getCleanItemName(item.name, item.id)}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                    ₹{rate}/{uTxt}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-bold ${
                                      seasonType === 'upcoming'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                    }`}
                                  >
                                    {seasonType === 'upcoming'
                                      ? pickLang(lang, {
                                          en: 'Upcoming Lot',
                                          hi: 'आने वाला स्पेशल',
                                          mr: 'लवकरच येत आहे',
                                          hinglish: 'Upcoming Lot',
                                        })
                                      : pickLang(lang, {
                                          en: 'In Season',
                                          hi: 'सीज़न स्पेशल',
                                          mr: 'ताजा हंगाम',
                                          hinglish: 'In Season',
                                        })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addProduceToCart(item.id, item.defaultKg || 1)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                            >
                              + {pickLang(lang, { en: 'Add', hi: 'जोड़ें', mr: 'जोडा', hinglish: 'Add' })}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* 11 PM Cutoff Notice in Cart */}
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    isBefore11PmCutoff
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{isBefore11PmCutoff ? t('cutoff_before') : t('cutoff_after')}</span>
                </div>

                {/* Section A: Fresh Produce */}
                {produceItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {t('market_tab')} ({totalProduceKg} kg)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {produceItems.map(({ prod, quantityKg, effectiveUnitRate, itemTotal }) => {
                        if (!prod) return null;
                        const isGaddi = prod.pricingUnit === 'gaddi';
                        const isPiece = prod.pricingUnit === 'piece';
                        const unitLabel = getUnitShort(prod.pricingUnit);
                        const step = isGaddi || isPiece ? 1 : prod.minIncrementKg;

                        return (
                          <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                            <SafeProductImg
                              product={prod}
                              alt={prod.name.en}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {getCleanItemName(prod.name, prod.id)}
                              </h4>
                              <div className="text-[11px] text-slate-500">
                                ₹{effectiveUnitRate}/{unitLabel}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded p-1">
                              <button
                                type="button"
                                onClick={() => setProduceCartQty(prod.id, quantityKg - step)}
                                className="p-0.5 rounded text-slate-600 dark:text-slate-300"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold font-mono px-1">
                                {quantityKg} {unitLabel}
                              </span>
                              <button
                                type="button"
                                onClick={() => setProduceCartQty(prod.id, quantityKg + step)}
                                className="p-0.5 rounded text-slate-600 dark:text-slate-300"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right min-w-[50px]">
                              <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                                ₹{itemTotal}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProduceFromCart(prod.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section B: Mobile Accessories */}
                {accessoryItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {t('accessories_tab')} ({totalAccessoriesUnits}{' '}
                        {pickLang(lang, { en: 'items', hi: 'आइटम', mr: 'वस्तू', hinglish: 'items' })})
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {accessoryItems.map(({ acc, quantity, itemTotal }) => {
                        if (!acc) return null;
                        return (
                          <div key={acc.id} className="py-2.5 flex items-center justify-between gap-3">
                            <SafeProductImg
                              product={acc}
                              alt={acc.name.en}
                              isAccessory
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {resolveLocalizedField(acc.name, lang)}
                              </h4>
                              <div className="text-[11px] text-slate-500">
                                ₹{acc.price} · {acc.brand}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded p-1">
                              <button
                                type="button"
                                onClick={() => setAccessoryCartQty(acc.id, quantity - 1)}
                                className="p-0.5 rounded text-slate-600 dark:text-slate-300"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold font-mono px-1">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => setAccessoryCartQty(acc.id, quantity + 1)}
                                className="p-0.5 rounded text-slate-600 dark:text-slate-300"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right min-w-[50px]">
                              <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                                ₹{itemTotal}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAccessoryFromCart(acc.id)}
                                className="text-slate-400 hover:text-rose-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SMART DISH & KITCHEN PAIRING UPSELLS */}
                {featureFlags.cartUpsellSuggestions && dishRecommendations.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4 text-emerald-600" />
                        <span>
                          {pickLang(lang, {
                            en: 'Complete Your Dish (Smart Pairings)',
                            hi: 'भाजी पूरी करने के लिए ये भी लें (स्मार्ट सुझाव)',
                            mr: 'भाजीसाठी लागणारे इतर ताजे जिन्नस जोडा',
                            hinglish: 'Bhaji Complete Karne Ke Liye Ye Bhi Le Lein',
                            gu: 'શાક પૂરું કરવા માટે આ પણ લો',
                            bn: 'রান্নার জন্য এগুলোও যোগ করুন',
                            ta: 'சமையலுக்குத் தேவையான மற்றவை',
                            te: 'వంట పూర్తి చేయడానికి ఇవి కూడా తీసుకోండి',
                            kn: 'ಅಡುಗೆಗೆ ಬೇಕಾದ ಇತರ ತಾಜಾ ವಸ್ತುಗಳು',
                            pa: 'ਸਬਜ਼ੀ ਪੂਰੀ ਕਰਨ ਲਈ ਇਹ ਵੀ ਲਓ',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {dishRecommendations.map((rec) => {
                        const rate =
                          rec.discountPrice && rec.discountPrice > 0
                            ? rec.discountPrice
                            : rec.pricePerKg;
                        const uTxt = getUnitShort(rec.pricingUnit);
                        const addQty = rec.defaultKg || 1;
                        return (
                          <div
                            key={rec.id}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-700 flex flex-col justify-between gap-1.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SafeProductImg
                                product={rec}
                                alt={rec.name.en}
                                className="w-8 h-8 rounded-md object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {getCleanItemName(rec.name, rec.id)}
                                </div>
                                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                                  ₹{rate}/{uTxt}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addProduceToCart(rec.id, addQty)}
                              className="w-full py-1 px-2 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                              <span>
                                {addQty} {uTxt} · ₹{Math.round(addQty * rate)}
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SEASONAL & UPCOMING FRESH FRUITS UPSELL */}
                {featureFlags.cartUpsellSuggestions && seasonalFruitUpsells.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
                    <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>
                        {pickLang(lang, {
                          en: '🍓 Fresh In-Season & Upcoming Fruits for Home',
                          hi: '🍓 घर के लिए ताज़े व आने वाले मौसमी फल चुनें',
                          mr: '🍓 घरासाठी ताजी व येणारी हंगामी फळे घ्या',
                          hinglish: '🍓 Ghar Ke Liye Fresh Seasonal & Upcoming Fruits',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {seasonalFruitUpsells.map(({ item, seasonType }) => {
                        const rate =
                          item.discountPrice && item.discountPrice > 0
                            ? item.discountPrice
                            : item.pricePerKg;
                        const uTxt = getUnitShort(item.pricingUnit);
                        const addQty = item.defaultKg || 1;
                        return (
                          <div
                            key={item.id}
                            className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-700 flex flex-col justify-between gap-1.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SafeProductImg
                                product={item}
                                alt={item.name.en}
                                className="w-8 h-8 rounded-md object-cover shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate">
                                  {getCleanItemName(item.name, item.id)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                                    ₹{rate}/{uTxt}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold truncate ${
                                  seasonType === 'upcoming'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                }`}
                              >
                                {seasonType === 'upcoming'
                                  ? pickLang(lang, {
                                      en: 'Upcoming Lot',
                                      hi: 'आने वाला लॉट',
                                      mr: 'लवकरच येत आहे',
                                      hinglish: 'Upcoming Lot',
                                    })
                                  : pickLang(lang, {
                                      en: 'In Season',
                                      hi: 'मौसमी ताज़ा',
                                      mr: 'हंगामी ताजे',
                                      hinglish: 'In Season',
                                    })}
                              </span>
                              <button
                                type="button"
                                onClick={() => addProduceToCart(item.id, addQty)}
                                className="px-2 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black flex items-center gap-0.5 shrink-0 cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                                <span>
                                  {pickLang(lang, { en: 'Add', hi: 'जोड़ें', mr: 'जोडा', hinglish: 'Add' })}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Delivery Slot Selection */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {t('delivery_slot')}:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeliverySlot('10:00 AM - 12:00 PM')}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        deliverySlot === '10:00 AM - 12:00 PM'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <div>{t('morning_slot')}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliverySlot('02:00 PM - 04:00 PM')}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        deliverySlot === '02:00 PM - 04:00 PM'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <div>{t('afternoon_slot')}</div>
                    </button>
                  </div>
                </div>

                {/* Payment Mode Selection */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {pickLang(lang, {
                      en: 'Select Payment Mode:',
                      hi: 'भुगतान का तरीका (Payment Mode):',
                      mr: 'पेमेंटची पद्धत निवडा:',
                      hinglish: 'Payment Mode Chunein:',
                    })}
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi_qr')}
                      className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                        paymentMethod === 'upi_qr'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div>Kotak UPI QR</div>
                        <div className="text-[10px] font-normal text-slate-500 font-mono">
                          8828822808@kotakbank
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-2.5 rounded-lg border text-left transition-colors flex items-center gap-2 ${
                        paymentMethod === 'cod'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <span className="text-base shrink-0">💵</span>
                      <div>
                        <div>
                          {pickLang(lang, {
                            en: 'Pay at Doorstep',
                            hi: 'डिलीवरी पर दें',
                            mr: 'डिलिव्हरीवर पैसे द्या',
                            hinglish: 'Delivery Pe Pay Karein',
                          })}
                        </div>
                        <div className="text-[10px] font-normal text-slate-500">
                          Cash / UPI to Driver
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Incoming Referral Qualification Status (Min ₹150 + Delivery & Payment Confirmed) */}
                {featureFlags.referralProgram &&
                  referredByCode &&
                  referredByCode !== (user.referralCode || '').trim().toUpperCase() && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        grandTotal >= (referralConfig.minOrderValueToQualify || 150)
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            {pickLang(lang, {
                              en: `Referral Active: ${referredByCode}`,
                              hi: `रेफ़रल कोड लागू: ${referredByCode}`,
                              mr: `रेफरल कोड लागू: ${referredByCode}`,
                            })}
                          </span>
                        </span>
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900">
                          {grandTotal >= (referralConfig.minOrderValueToQualify || 150)
                            ? '₹150+ ✓'
                            : `₹${Math.max(0, (referralConfig.minOrderValueToQualify || 150) - grandTotal)} कम`}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug">
                        {grandTotal >= (referralConfig.minOrderValueToQualify || 150)
                          ? pickLang(lang, {
                              en: `Qualified (₹${grandTotal}). Referrer receives ₹${referralConfig.referrerCashbackAmount || 50} ONLY after delivery & payment confirmation.`,
                              hi: `₹${grandTotal} का ऑर्डर योग्य है! डिलीवरी पूरा होने व पेमेंट कन्फ़र्म होने के बाद शेयर करने वाले को ₹${referralConfig.referrerCashbackAmount || 50} कैशबैक मिलेगा।`,
                              mr: `₹${grandTotal} ऑर्डर पात्र! डिलिव्हरी व पेमेंट कन्फर्म झाल्यावर ₹${referralConfig.referrerCashbackAmount || 50} कॅशबॅक मिळेल.`,
                            })
                          : pickLang(lang, {
                              en: `Add ₹${Math.max(1, (referralConfig.minOrderValueToQualify || 150) - grandTotal)} more (Min ₹${referralConfig.minOrderValueToQualify || 150}) to unlock ₹${referralConfig.referrerCashbackAmount || 50} referral cashback after delivery & payment.`,
                              hi: `₹${referralConfig.minOrderValueToQualify || 150} न्यूनतम खरीद के लिए ₹${Math.max(1, (referralConfig.minOrderValueToQualify || 150) - grandTotal)} का सामान और जोड़ें — डिलीवरी व पेमेंट कन्फ़र्म होने पर ₹${referralConfig.referrerCashbackAmount || 50} कैशबैक मिलेगा।`,
                              mr: `किमान ₹${referralConfig.minOrderValueToQualify || 150} ऑर्डरसाठी ₹${Math.max(1, (referralConfig.minOrderValueToQualify || 150) - grandTotal)} अधिक जोडा.`,
                            })}
                      </p>
                    </div>
                  )}

                {/* Admin Special Rewards / Surprise Gifts & Coupons */}
                {user.isLoggedIn && activeAdminRewards.length > 0 && (
                  <div className="p-3 bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                        <Ticket className="w-4 h-4 text-amber-600" />
                        <span>
                          {pickLang(lang, {
                            en: 'Founder Direct Coupons & Surprise Gifts',
                            hi: 'एडमिन स्पेशल कूपन व सरप्राइज़ गिफ्ट',
                            mr: 'खास कूपन आणि सरप्राइज भेट',
                            hinglish: 'Admin Special Coupons & Surprise Gifts',
                          })}
                        </span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                        {activeAdminRewards.length} Active
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {activeAdminRewards.map((r) => {
                        const eligible = grandTotal >= (r.minOrderRupees || 0);
                        const isPicked = selectedRewardId === r.id;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedRewardId(isPicked ? '' : r.id)}
                            className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                              isPicked
                                ? 'bg-white dark:bg-slate-900 border-emerald-600 ring-1 ring-emerald-500/40 shadow-2xs'
                                : 'bg-white/75 dark:bg-slate-900/60 border-amber-200 dark:border-amber-800/70 hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-black text-slate-900 dark:text-white truncate">
                                {r.title}
                              </span>
                              <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
                                {r.couponCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                              {r.discountRupees > 0 && (
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  -₹{r.discountRupees} OFF
                                </span>
                              )}
                              {r.discountPercent > 0 && (
                                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                  {r.discountPercent}% OFF
                                </span>
                              )}
                              {r.freeGiftItem && (
                                <span className="font-bold text-amber-700 dark:text-amber-300">
                                  🎁 {r.freeGiftItem}
                                </span>
                              )}
                              {!eligible && r.minOrderRupees > 0 && (
                                <span className="text-rose-600 font-semibold">
                                  (Add ₹{Math.max(1, r.minOrderRupees - grandTotal)} more for min ₹{r.minOrderRupees})
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Referral Rewards & Wallet Balance Card */}
                {featureFlags.referralProgram && user.isLoggedIn && (walletBalance > 0 || freeGiftItem) && (
                  <div className="p-3 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-emerald-600" />
                        <span>
                          {pickLang(lang, {
                            en: 'Referral Rewards & Wallet',
                            hi: 'रेफ़रल रिवॉर्ड्स व वॉलेट बैलेंस',
                            mr: 'रेफरल बक्षिसे व वॉलेट शिल्लक',
                            hinglish: 'Referral Rewards & Wallet',
                          })}
                        </span>
                      </span>
                      {walletBalance > 0 && (
                        <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                          {pickLang(lang, { en: 'Balance', hi: 'बैलेंस', mr: 'शिल्लक', hinglish: 'Balance' })}: ₹
                          {walletBalance}
                        </span>
                      )}
                    </div>

                    {walletBalance > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={applyWalletDiscount}
                          onChange={(e) => setApplyWalletDiscount(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <span className="font-semibold text-xs">
                          {pickLang(lang, {
                            en: `✓ Apply ₹${effectiveWalletDiscount} wallet cashback discount`,
                            hi: `✓ ₹${effectiveWalletDiscount} वॉलेट बैलेंस घटाएं (-₹${effectiveWalletDiscount})`,
                            mr: `✓ ₹${effectiveWalletDiscount} वॉलेट सवलत लागू करा (-₹${effectiveWalletDiscount})`,
                            hinglish: `✓ ₹${effectiveWalletDiscount} wallet discount lagayein`,
                          })}
                        </span>
                      </label>
                    )}

                    {freeGiftItem && (
                      <div className="p-2 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <span>🎉</span>
                          <span>
                            {pickLang(lang, {
                              en: 'Free Order Gift:',
                              hi: 'मुफ़्त आर्डर उपहार:',
                              mr: 'मोफत ऑर्डर भेट:',
                              hinglish: 'Free Order Gift:',
                            })}
                          </span>
                        </span>
                        <span className="font-black text-emerald-700 dark:text-emerald-300">
                          {freeGiftItem}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Account & Delivery Address */}
                {user.isLoggedIn ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          {pickLang(lang, {
                            en: 'Verified Delivery Address:',
                            hi: 'डिलीवरी फ्लैट व ग्राहक विवरण:',
                            mr: 'डिलिव्हरी पत्ता व ग्राहक माहिती:',
                            hinglish: 'Delivery Address & Details:',
                          })}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold underline hover:text-emerald-800 flex items-center gap-0.5"
                      >
                        <span>
                          {pickLang(lang, {
                            en: 'Change / + Add Address',
                            hi: 'बदलें / + नया पता',
                            mr: 'बदला / + नवीन पत्ता',
                            hinglish: 'Change / + Add Address',
                          })}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                      <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
                        📞 {user.phone}
                        {user.secondaryPhone && (
                          <span className="text-emerald-700 dark:text-emerald-400 ml-1">
                            ({pickLang(lang, { en: 'Alt', hi: 'दूसरा', mr: 'दुसरा', hinglish: 'Alt' })}: {user.secondaryPhone})
                          </span>
                        )}
                      </div>
                    </div>

                    {user.savedAddresses && user.savedAddresses.length > 1 && (
                      <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                        <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                          {pickLang(lang, {
                            en: `Select Delivery Address (${user.savedAddresses.length} saved):`,
                            hi: `डिलीवरी पता चुनें (${user.savedAddresses.length} सहेजे गए पते):`,
                            mr: `पत्ता निवडा (${user.savedAddresses.length} पत्ते):`,
                            hinglish: `Delivery Address chunein (${user.savedAddresses.length} saved):`,
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                          {user.savedAddresses.map((addr) => {
                            const isSelected =
                              user.activeAddressId === addr.id ||
                              (!user.activeAddressId && addr.isDefault);
                            return (
                              <button
                                key={addr.id}
                                type="button"
                                onClick={() => setActiveAddress(addr.id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border transition-colors ${
                                  isSelected
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {addr.label} {isSelected ? '✓' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/60">
                      📍{' '}
                      {user.fullAddress ||
                        `${user.flat ? 'Flat ' + user.flat + ', ' : ''}${
                          user.society || 'Society Delivery'
                        }`}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-600" />
                        <span>
                          {pickLang(lang, {
                            en: 'Customer Account Required',
                            hi: 'ग्राहक खाता / लॉगिन (आवश्यक)',
                            mr: 'ग्राहक खाते / लॉगिन आवश्यक',
                            hinglish: 'Customer Account / Login Required',
                          })}
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-100 font-bold">
                        {pickLang(lang, { en: 'Required', hi: 'आवश्यक', mr: 'आवश्यक', hinglish: 'Required' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      {pickLang(lang, {
                        en: 'Sign in with your name, flat number, and mobile number for doorstep delivery & live tracking:',
                        hi: 'आपके फ्लैट पर सटीक डिलीवरी व लाइव ट्रैकिंग के लिए अपना नाम, फ्लैट नंबर और मोबाइल नंबर दर्ज करें:',
                        mr: 'अचूक घरपोच डिलिव्हरीसाठी तुमचे नाव, फ्लॅट नंबर आणि मोबाईल नंबर नोंदवा:',
                        hinglish: 'Doorstep delivery aur live tracking ke liye naam, flat aur mobile enter karein:',
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>
                        {pickLang(lang, {
                          en: 'Sign Up / Login',
                          hi: 'खाता बनाएं या लॉगिन करें',
                          mr: 'लॉगिन / नवीन खाते उघडा',
                          hinglish: 'Sign Up / Login Karein',
                        })}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Checkout */}
          {!orderConfirmed && (produceItems.length > 0 || accessoryItems.length > 0) && (
            <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="space-y-1 mb-3">
                {effectiveCouponDiscount > 0 && selectedReward && (
                  <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    <span>Coupon ({selectedReward.couponCode}):</span>
                    <span className="font-mono font-bold">-₹{effectiveCouponDiscount}</span>
                  </div>
                )}
                {effectiveWalletDiscount > 0 && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>
                      {pickLang(lang, {
                        en: 'Wallet Cashback:',
                        hi: 'वॉलेट कैशबैक डिस्काउंट:',
                        mr: 'वॉलेट कॅशबॅक सवलत:',
                        hinglish: 'Wallet Cashback Discount:',
                      })}
                    </span>
                    <span className="font-mono font-bold">-₹{effectiveWalletDiscount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-slate-100">
                  <span>
                    {pickLang(lang, {
                      en: 'Grand Total:',
                      hi: 'कुल देय राशि:',
                      mr: 'एकूण देय रक्कम:',
                      hinglish: 'Grand Total:',
                    })}
                  </span>
                  <span className="font-mono text-emerald-800 dark:text-emerald-400 text-xl font-black">
                    ₹{payableGrandTotal}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 mb-3">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{t('zero_waste_tag')}</span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>
                  {t('confirm_order')} (₹{payableGrandTotal})
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

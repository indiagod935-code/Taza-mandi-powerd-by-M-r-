import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrder } from '../types';
import { SafeProductImg } from './SafeProductImg';
import { OrderFeedbackCard } from './OrderFeedbackCard';
import { OrderCardSkeleton } from './LoadingSkeletons';
import { pickLang } from '../utils/i18nHelper';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  Smartphone,
  Leaf,
  FileText,
  Share2,
  User,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  generateOrderWhatsAppBillText,
  getWhatsAppBillUrl,
} from '../utils/billingUtils';

interface OrdersViewProps {
  onGoToMarket: () => void;
  onTrackOrder?: (orderId: string) => void;
  onOpenInvoice?: (order: CustomerOrder) => void;
  isAdminAuthorized?: boolean;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onGoToMarket,
  onTrackOrder,
  onOpenInvoice,
  isAdminAuthorized = false,
}) => {
  const {
    orders,
    isOrdersLoading,
    refreshOrdersFromServer,
    user,
    brand,
    lang,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    cancelOrder,
    confirmOrderDeliveryAndPayment,
  } = useApp();
  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Ordered by mistake');
  const [deliveryToast, setDeliveryToast] = useState<string | null>(null);

  useEffect(() => {
    refreshOrdersFromServer();
  }, []);

  const CANCEL_REASONS = [
    {
      id: 'Ordered by mistake',
      labels: {
        en: 'Ordered by mistake',
        hi: 'गलती से ऑर्डर हो गया',
        mr: 'चुकून ऑर्डर झाली',
        hinglish: 'Galti se order ho gaya',
      },
    },
    {
      id: 'Want to change items or weight',
      labels: {
        en: 'Change items / qty',
        hi: 'सामान या वज़न बदलना है',
        mr: 'माल किंवा वजन बदलायचे आहे',
        hinglish: 'Items ya weight change karna hai',
      },
    },
    {
      id: 'Delivery slot timing issue',
      labels: {
        en: 'Delivery timing issue',
        hi: 'डिलीवरी समय बदलना है',
        mr: 'डिलिव्हरी वेळ जमत नाही',
        hinglish: 'Delivery timing issue',
      },
    },
    {
      id: 'Other reason',
      labels: {
        en: 'Other reason',
        hi: 'अन्य कारण',
        mr: 'इतर कारण',
        hinglish: 'Other reason',
      },
    },
  ];

  const myRealOrders = orders.filter(
    (o) =>
      !o.isSampleOrder &&
      (user.isLoggedIn
        ? o.customerEmail === user.email || o.customerName === user.name || o.phone === user.phone
        : true)
  );

  const getCleanName = (nameObj: { en: string; hi: string; mr: string; hinglish: string }) => {
    if (lang === 'en') return nameObj.en.replace(/\(.*?\)/g, '').trim() || nameObj.en;
    if (lang === 'mr') return nameObj.mr.replace(/[a-zA-Z()]/g, '').trim() || nameObj.mr;
    if (lang === 'hi') return nameObj.hi.replace(/[a-zA-Z()]/g, '').trim() || nameObj.hi;
    return nameObj.hinglish || nameObj.en;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {lang === 'hi'
                ? 'सफलतापूर्वक डिलीवर हुआ'
                : lang === 'mr'
                ? 'यशस्वीरीत्या वितरित'
                : 'Delivered'}
            </span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="flex items-center gap-1 text-sky-700 dark:text-sky-400 font-bold bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800 text-xs">
            <Truck className="w-3.5 h-3.5 animate-bounce" />
            <span>
              {lang === 'hi'
                ? 'डिलीवरी के लिए रवाना'
                : lang === 'mr'
                ? 'डिलिव्हरीसाठी निघाले'
                : 'Out for Delivery'}
            </span>
          </span>
        );
      case 'packed':
        return (
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 text-xs">
            <Package className="w-3.5 h-3.5" />
            <span>
              {lang === 'hi'
                ? 'जूट बैग में पैक हो गया'
                : lang === 'mr'
                ? 'इको-बॅगमध्ये पॅक केले'
                : 'Packed in Eco-Bag'}
            </span>
          </span>
        );
      case 'procured_at_mandi':
        return (
          <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 text-xs">
            <Leaf className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {lang === 'hi'
                ? 'APMC वाशी से माल उठा लिया'
                : lang === 'mr'
                ? 'APMC वाशी मधून खरेदी झाली'
                : 'Procured at APMC'}
            </span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-pink-700 dark:text-pink-400 font-bold bg-pink-50 dark:bg-pink-950/60 px-2.5 py-1 rounded-full border border-pink-200 dark:border-pink-800 text-xs">
            <XCircle className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Order Cancelled',
                hi: 'ऑर्डर रद्द किया गया',
                mr: 'ऑर्डर रद्द केली',
                hinglish: 'Order Cancelled',
              })}
            </span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-emerald-800 dark:text-emerald-300 font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {lang === 'hi'
                ? 'आर्डर दर्ज हुआ · मंडी उठान की प्रतीक्षा'
                : lang === 'mr'
                ? 'ऑर्डर नोंदवली · मंडी बॅच प्रतीक्षेत'
                : 'Order Placed · Awaiting Mandi Batch'}
            </span>
          </span>
        );
    }
  };

  const renderOrderCard = (order: CustomerOrder, isOwnOrder: boolean) => (
    <div
      key={order.id}
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all ${
        isOwnOrder
          ? 'border-emerald-300 dark:border-emerald-800/80 ring-1 ring-emerald-500/20'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
              #{order.id}
            </span>
            <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-black border border-emerald-300">
              {lang === 'hi'
                ? '⭐ आधिकारिक आर्डर'
                : lang === 'mr'
                ? '⭐ अधिकृत ऑर्डर'
                : '⭐ Verified Order'}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{order.orderedAt}</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {order.customerName} · {order.flatNumber}
            </span>
            <span>·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {order.targetDeliveryDate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {getStatusBadge(order.status)}
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
              order.paymentConfirmed
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
            }`}
          >
            {order.paymentConfirmed
              ? pickLang(lang, { en: '✓ Payment Confirmed', hi: '✓ पेमेंट कन्फ़र्म', mr: '✓ पेमेंट कन्फर्म' })
              : pickLang(lang, { en: 'Payment Pending', hi: 'पेमेंट बाकी', mr: 'पेमेंट प्रलंबित' })}
          </span>
          {order.referredByCode && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Ref: {order.referredByCode}
            </span>
          )}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
            {order.deliverySlot}
          </span>
        </div>
      </div>

      {/* Visual Step Progress or Cancelled Banner */}
      {order.status === 'cancelled' ? (
        <div className="py-3 px-4 my-3 bg-pink-50 dark:bg-pink-950/30 rounded-xl border border-pink-200 dark:border-pink-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-pink-800 dark:text-pink-300 font-bold">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>
              {pickLang(lang, {
                en: 'This order has been cancelled and removed from Mandi procurement.',
                hi: 'यह ऑर्डर रद्द कर दिया गया है और मंडी ख़रीद सूची से हटा दिया गया है।',
                mr: 'ही ऑर्डर रद्द करण्यात आली आहे आणि मंडी यादीतून काढली आहे.',
                hinglish: 'Yeh order cancel ho chuka hai aur Mandi list se hata diya gaya hai.',
              })}
            </span>
          </div>
          <div className="text-[11px] text-pink-600 dark:text-pink-400 font-medium">
            {order.cancelReason ? `${order.cancelReason}` : ''}
            {order.cancelledAt ? ` · ${order.cancelledAt}` : ''}
          </div>
        </div>
      ) : (
        <div className="py-3 px-3 my-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="grid grid-cols-5 gap-1 text-center font-bold">
            <div
              className={`p-1.5 rounded-lg ${
                order.status
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-400'
              }`}
            >
              {lang === 'hi' ? '1. आर्डर दर्ज ✓' : lang === 'mr' ? '१. ऑर्डर ✓' : '1. Ordered ✓'}
            </div>
            <div
              className={`p-1.5 rounded-lg ${
                ['procured_at_mandi', 'packed', 'out_for_delivery', 'delivered'].includes(order.status)
                  ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300'
                  : 'text-slate-400 bg-slate-100/60 dark:bg-slate-800/60'
              }`}
            >
              {lang === 'hi' ? '2. मंडी उठाव' : lang === 'mr' ? '२. मंडी खरेदी' : '2. Sourced'}
            </div>
            <div
              className={`p-1.5 rounded-lg ${
                ['packed', 'out_for_delivery', 'delivered'].includes(order.status)
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                  : 'text-slate-400 bg-slate-100/60 dark:bg-slate-800/60'
              }`}
            >
              {lang === 'hi' ? '3. बैग पैकिंग' : lang === 'mr' ? '३. पॅकिंग' : '3. Packed'}
            </div>
            <div
              className={`p-1.5 rounded-lg ${
                ['out_for_delivery', 'delivered'].includes(order.status)
                  ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300'
                  : 'text-slate-400 bg-slate-100/60 dark:bg-slate-800/60'
              }`}
            >
              {lang === 'hi' ? '4. वैन रवाना' : lang === 'mr' ? '४. व्हॅन मार्गस्थ' : '4. En Route'}
            </div>
            <div
              className={`p-1.5 rounded-lg ${
                order.status === 'delivered'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 bg-slate-100/60 dark:bg-slate-800/60'
              }`}
            >
              {lang === 'hi' ? '5. डिलीवर' : lang === 'mr' ? '५. पोहोचले' : '5. Delivered'}
            </div>
          </div>
        </div>
      )}

      {/* Items in the order */}
      <div className="py-3 space-y-2 text-xs">
        {order.produceItems.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? 'ताज़ी सब्ज़ियाँ व फल:'
                  : lang === 'mr'
                  ? 'ताजी भाजी व फळे:'
                  : 'Fresh Produce:'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {order.produceItems.map((it, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeProductImg
                      product={it.produceId}
                      alt={it.name.en}
                      className="w-9 h-9 rounded-md object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {getCleanName(it.name)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">₹{it.pricePerKg}/kg</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                      {it.quantityKg} kg
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      ₹{it.itemTotal}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.accessoryItems.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? 'MARCO 100 मोबाइल एक्सेसरीज़:'
                  : lang === 'mr'
                  ? 'MARCO 100 मोबाइल अ‍ॅक्सेसरीज:'
                  : 'MARCO 100 Mobile Accessories:'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {order.accessoryItems.map((acc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeProductImg
                      product={acc.accessoryId}
                      alt={acc.name.en}
                      isAccessory
                      className="w-9 h-9 rounded-md object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {acc.name[lang] || acc.name.en}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">₹{acc.price} each</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sky-800 dark:text-sky-300 font-mono">
                      {acc.quantity} pcs
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                      ₹{acc.itemTotal}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500">
            {lang === 'hi' ? 'कुल:' : lang === 'mr' ? 'एकूण:' : 'Total:'}{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {order.totalProduceWeightKg} kg
            </strong>{' '}
            {lang === 'hi' ? 'सब्ज़ी/फल' : lang === 'mr' ? 'भाजी/फळे' : 'Produce'} +{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-mono">
              {order.totalAccessoriesCount}
            </strong>{' '}
            {lang === 'hi' ? 'टेक आइटम' : lang === 'mr' ? 'टेक वस्तू' : 'Tech'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              order.cutoffBatch === 'tomorrow_morning'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            {order.cutoffBatch === 'tomorrow_morning'
              ? lang === 'hi'
                ? '✅ सुबह 10 बजे होम डिलीवरी'
                : lang === 'mr'
                ? '✅ सकाळी १० वा. घरपोच डिलिव्हरी'
                : '✅ Tomorrow 10 AM Delivery'
              : lang === 'hi'
              ? '🌙 परसों सुबह का बैच'
              : lang === 'mr'
              ? '🌙 परवा सकाळचा बॅच'
              : '🌙 Day-After Morning Batch'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          <span className="text-slate-900 dark:text-slate-100 font-bold text-sm mr-1">
            {lang === 'hi' ? 'बिल:' : lang === 'mr' ? 'बिल:' : 'Bill:'}{' '}
            <span className="font-mono text-emerald-700 dark:text-emerald-400 text-base font-black">
              ₹{order.totalAmount}
            </span>
          </span>

          <a
            href={getWhatsAppBillUrl(order.phone, generateOrderWhatsAppBillText(order, brand))}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'WhatsApp बिल' : 'WhatsApp Bill'}</span>
          </a>

          {onOpenInvoice && (
            <button
              type="button"
              onClick={() => onOpenInvoice(order)}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? 'डिजिटल बिल / QR'
                  : lang === 'mr'
                  ? 'डिजिटल बिल / QR'
                  : 'Invoice / QR'}
              </span>
            </button>
          )}

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => {
                setConfirmCancelOrderId(confirmCancelOrderId === order.id ? null : order.id);
                setCancelReason('Ordered by mistake');
              }}
              className="px-2.5 py-1.5 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/50 dark:hover:bg-pink-900/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
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
          )}

          {isAdminAuthorized &&
            order.status !== 'cancelled' &&
            !(order.status === 'delivered' && order.paymentConfirmed) && (
            <button
              type="button"
              onClick={() => {
                const res = confirmOrderDeliveryAndPayment(order.id);
                setDeliveryToast(res.message);
                setTimeout(() => setDeliveryToast(null), 5000);
              }}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-black text-xs flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, {
                  en: 'Confirm Delivery & Payment',
                  hi: 'डिलीवरी व पेमेंट कन्फ़र्म करें',
                  mr: 'डिलिव्हरी व पेमेंट कन्फर्म करा',
                })}
              </span>
            </button>
          )}

          {onTrackOrder && order.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onTrackOrder(order.id)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>
                {lang === 'hi' ? 'लाइव ट्रैक' : lang === 'mr' ? 'थेट ट्रॅक' : 'Live Track'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Delivered Order Rating & Freshness Feedback */}
      {order.status === 'delivered' && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <OrderFeedbackCard order={order} stage="delivered" />
        </div>
      )}

      {/* Inline Order Cancellation Confirmation */}
      {confirmCancelOrderId === order.id && order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="mt-3 p-3.5 rounded-xl bg-pink-50/90 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 space-y-2.5 text-xs">
          <div className="font-bold text-pink-900 dark:text-pink-200">
            {pickLang(lang, {
              en: `Confirm cancellation for Order #${order.id}? Select a reason:`,
              hi: `ऑर्डर #${order.id} रद्द करने की पुष्टि करें — कारण चुनें:`,
              mr: `ऑर्डर #${order.id} रद्द करायची का? कारण निवडा:`,
              hinglish: `Order #${order.id} cancel karna confirm karein — reason chunein:`,
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setCancelReason(r.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors cursor-pointer ${
                  cancelReason === r.id
                    ? 'bg-pink-600 text-white border-pink-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-pink-200 dark:border-pink-800'
                }`}
              >
                {pickLang(lang, r.labels)}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setConfirmCancelOrderId(null)}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Keep Order',
                hi: 'ऑर्डर रखें',
                mr: 'ऑर्डर ठेवा',
                hinglish: 'Order Rakhein',
              })}
            </button>
            <button
              type="button"
              onClick={() => {
                cancelOrder(order.id, cancelReason);
                setConfirmCancelOrderId(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold shadow-xs cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Yes, Cancel Order',
                hi: 'हाँ, ऑर्डर कैंसिल करें',
                mr: 'होय, ऑर्डर रद्द करा',
                hinglish: 'Haan, Order Cancel Karein',
              })}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {!user.isLoggedIn ? (
        <div className="mb-6 p-5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-950 dark:text-emerald-100 text-sm">
                {pickLang(lang, {
                  en: 'Sign in to view your orders & invoices',
                  hi: 'अपने ऑर्डर्स और बिल देखने के लिए लॉगिन करें',
                  mr: 'तुमच्या ऑर्डर्स आणि बिले पाहण्यासाठी लॉगिन करा',
                  hinglish: 'Apne orders aur bills dekhne ke liye login karein',
                })}
              </div>
              <p className="text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                {pickLang(lang, {
                  en: 'Access live delivery tracking, order cancellation, and WhatsApp receipts in one place.',
                  hi: 'अपना ऑर्डर ट्रैक करने, बिल डाउनलोड करने और सभी सेवाओं का लाभ उठाने के लिए लॉगिन करें।',
                  mr: 'थेट ट्रॅकिंग आणि बिल डाउनलोड करण्यासाठी साइन इन करा.',
                  hinglish: 'Live tracking, order cancel aur bill download ke liye sign in karein.',
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>
              {pickLang(lang, {
                en: 'Sign In / Register',
                hi: 'लॉगिन / नया खाता बनाएं',
                mr: 'लॉगिन / नवीन खाते',
                hinglish: 'Sign In / Register',
              })}
            </span>
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2 flex-wrap">
                <span className="truncate max-w-[180px] sm:max-w-xs">{user.name}</span>
                <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  {lang === 'hi'
                    ? 'सक्रिय ग्राहक'
                    : lang === 'mr'
                    ? 'सक्रिय ग्राहक'
                    : 'Verified'}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5 font-mono">
                📞 {user.phone}
                {user.secondaryPhone && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold ml-1.5">
                    · {lang === 'hi' ? 'दूसरा' : lang === 'mr' ? 'दुसरा' : 'Alt'}: {user.secondaryPhone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === 'hi'
                  ? '✏️ प्रोफाइल व पते बदलें'
                  : lang === 'mr'
                  ? '✏️ प्रोफाइल व पत्ता बदला'
                  : '✏️ Edit Profile & Address'}
              </span>
            </button>

            <button
              type="button"
              onClick={onGoToMarket}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {lang === 'hi'
                  ? 'ताज़ा सामान खरीदें'
                  : lang === 'mr'
                  ? 'ताजा माल खरेदी करा'
                  : 'Shop Fresh Produce'}
              </span>
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <span>
                {pickLang(lang, {
                  en: `My Orders & History (${myRealOrders.length})`,
                  hi: `मेरे ऑर्डर व इतिहास (${myRealOrders.length})`,
                  mr: `माझ्या ऑर्डर्स व इतिहास (${myRealOrders.length})`,
                  hinglish: `Mere Orders & History (${myRealOrders.length})`,
                })}
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {pickLang(lang, {
                en: '🔒 Verified order history is permanently saved — you can cancel upcoming orders before dispatch, never erase records.',
                hi: '🔒 आपका पूरा ऑर्डर इतिहास सुरक्षित रहता है — आप आने वाले ऑर्डर कैंसिल कर सकते हैं, इतिहास डिलीट नहीं होता।',
                mr: '🔒 तुमचा ऑर्डर इतिहास कायम सुरक्षित राहतो — ऑर्डर रद्द करता येतो पण इतिहास हटवता येत नाही.',
                hinglish: '🔒 Aapka order history permanent save rehta hai — upcoming order cancel kar sakte hain, history delete nahi hoti.',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshOrdersFromServer()}
              disabled={isOrdersLoading}
              className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isOrdersLoading ? 'animate-spin text-emerald-600' : ''}`} />
              <span>
                {pickLang(lang, {
                  en: isOrdersLoading ? 'Syncing...' : 'Refresh Status',
                  hi: isOrdersLoading ? 'अपडेट हो रहा है...' : 'ताज़ा स्टेटस देखें',
                  mr: isOrdersLoading ? 'अपडेट होत आहे...' : 'स्थिती ताजी करा',
                  hinglish: isOrdersLoading ? 'Sync ho raha hai...' : 'Refresh Status',
                })}
              </span>
            </button>
            {myRealOrders.length > 0 && (
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                {pickLang(lang, {
                  en: '✓ Saved History',
                  hi: '✓ सुरक्षित इतिहास',
                  mr: '✓ सुरक्षित इतिहास',
                  hinglish: '✓ Saved History',
                })}
              </span>
            )}
          </div>
        </div>

        {deliveryToast && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{deliveryToast}</span>
          </div>
        )}

        {isOrdersLoading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading orders">
            {Array.from({ length: Math.max(2, Math.min(4, myRealOrders.length || 3)) }).map((_, idx) => (
              <OrderCardSkeleton key={idx} />
            ))}
          </div>
        ) : myRealOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {lang === 'hi'
                ? 'वर्तमान में कोई सक्रिय आर्डर नहीं है'
                : lang === 'mr'
                ? 'सध्या कोणतीही सक्रिय ऑर्डर नाही'
                : 'No Active Orders Yet'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
              {lang === 'hi'
                ? 'वाशी APMC थोक मंडी से सीधी सुबह 10:00 AM ताज़ी डिलीवरी उपलब्ध है। अपनी पसंद की ताज़ी सब्ज़ियाँ व फल चुनकर पहला आर्डर दर्ज करें।'
                : lang === 'mr'
                ? 'वाशी एपीएमसी घाऊक बाजारातून सकाळी १०:०० वा. ताजी डिलिव्हरी उपलब्ध आहे. ताज्या भाज्या व फळे निवडून पहिली ऑर्डर नोंदवा.'
                : 'Direct morning 10:00 AM fresh delivery from APMC Vashi Mandi is open. Pick fresh produce and place your first order.'}
            </p>
            <button
              type="button"
              onClick={onGoToMarket}
              className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-800 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {lang === 'hi'
                  ? 'ताज़ा मंडी बाज़ार खोलें'
                  : lang === 'mr'
                  ? 'ताजी मंडी बाजार उघडा'
                  : 'Open Fresh Mandi Store'}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myRealOrders.map((order) => renderOrderCard(order, true))}
          </div>
        )}
      </div>
    </div>
  );
};

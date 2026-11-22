import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AppPageId } from '../types';
import { pickLang, resolveLocalizedProduceName } from '../utils/i18nHelper';
import { getAdminAuthHeaders } from '../api/client';
import {
  Bell,
  X,
  CheckCheck,
  Clock,
  Award,
  Trophy,
  Truck,
  Sparkles,
  ArrowRight,
  Send,
  VolumeX,
} from 'lucide-react';

export type SmartNotificationCategory = 'savings' | 'cutoff' | 'freshness' | 'leaderboard' | 'order';

export interface SmartNotificationItem {
  id: string;
  title: string;
  message: string;
  category: SmartNotificationCategory;
  priority: 'high' | 'normal';
  ctaLabel?: string;
  actionType?: 'open_cart' | 'open_savings' | 'open_leaderboard' | 'open_orders' | 'open_catalog';
  timestampLabel: string;
  isBroadcast?: boolean;
}

interface ServerBroadcast {
  id: string;
  title: string;
  message: string;
  category: SmartNotificationCategory;
  priority: 'high' | 'normal';
  ctaTab?: string;
  ctaLabel?: string;
  createdAt: string;
}

const READ_STORAGE_KEY = 'tazamandi_notif_read_ids_v1';
const DISMISSED_TOAST_KEY = 'tazamandi_toast_dismissed_v1';

function loadStringSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed.map(String));
    }
  } catch {}
  return new Set();
}

function saveStringSet(key: string, set: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-80)));
  } catch {}
}

export function useSmartDynamicNotifications(homeSavingsStats?: {
  totalSavedRupees: number;
  totalKg: number;
  wasteAvoidedKg: number;
}) {
  const { lang, produceList, produceCart, orders, user, timeUntil11Pm, isBefore11PmCutoff } = useApp();
  const [broadcasts, setBroadcasts] = useState<ServerBroadcast[]>([]);
  const [topRankXp, setTopRankXp] = useState<number | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadStringSet(READ_STORAGE_KEY));
  const [dismissedToastIds, setDismissedToastIds] = useState<Set<string>>(() =>
    loadStringSet(DISMISSED_TOAST_KEY)
  );
  const [sessionMuted, setSessionMuted] = useState(false);

  const fetchDynamicFeed = async () => {
    try {
      const [notifRes, lbRes] = await Promise.all([
        fetch('/api/notifications/dynamic?limit=15'),
        fetch('/api/leaderboard?sortBy=xp'),
      ]);
      const notifData = await notifRes.json();
      if (notifData?.success && Array.isArray(notifData.notifications)) {
        setBroadcasts(notifData.notifications);
      }
      const lbData = await lbRes.json();
      if (lbData?.success && Array.isArray(lbData.entries) && lbData.entries.length > 0) {
        setTopRankXp(Number(lbData.entries[0]?.xpPoints) || null);
      }
    } catch {}
  };

  useEffect(() => {
    fetchDynamicFeed();
    const timer = setInterval(fetchDynamicFeed, 45000);
    return () => clearInterval(timer);
  }, []);

  const notifications = useMemo<SmartNotificationItem[]>(() => {
    const list: SmartNotificationItem[] = [];

    // 1. Live Server Broadcasts (Real Admin / Mandi Hub announcements)
    broadcasts.forEach((b) => {
      list.push({
        id: `srv-${b.id}`,
        title: b.title,
        message: b.message,
        category: b.category || 'freshness',
        priority: b.priority || 'normal',
        ctaLabel: b.ctaLabel || pickLang(lang, { en: 'View Store', hi: 'स्टोर देखें' }),
        actionType:
          b.ctaTab === 'leaderboard'
            ? 'open_leaderboard'
            : b.ctaTab === 'orders'
            ? 'open_orders'
            : 'open_catalog',
        timestampLabel: new Date(b.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isBroadcast: true,
      });
    });

    // 2. Dynamic Cutoff Urgency Alert (Calculated live from 11:00 PM lock countdown)
    const cartItemCount = Object.values(produceCart).filter((q) => q > 0).length;
    const hoursMatch = /^(\d+)h/.exec(timeUntil11Pm || '');
    const hoursRemaining = hoursMatch ? parseInt(hoursMatch[1], 10) : 5;
    if (isBefore11PmCutoff && cartItemCount > 0 && hoursRemaining <= 3) {
      list.push({
        id: `cutoff-urgent-${cartItemCount}`,
        title: pickLang(lang, {
          en: `Tomorrow 10 AM Dispatch Locks in ${timeUntil11Pm}`,
          hi: `कल सुबह 10 AM बैच लॉक होने में सिर्फ ${timeUntil11Pm} बाकी`,
        }),
        message: pickLang(lang, {
          en: `You have ${cartItemCount} fresh produce items in your basket. Confirm before 11 PM cutoff for morning APMC delivery.`,
          hi: `आपकी थैली में ${cartItemCount} आइटम तैयार हैं — 11 PM से पहले ऑर्डर कन्फ़र्म करें।`,
        }),
        category: 'cutoff',
        priority: 'high',
        ctaLabel: pickLang(lang, { en: 'Confirm Basket', hi: 'थैली कन्फ़र्म करें' }),
        actionType: 'open_cart',
        timestampLabel: pickLang(lang, { en: 'Live Timer', hi: 'लाइव' }),
      });
    }

    // 3. Dynamic Saver Badge Milestone Nudge
    const savedRupees = Math.round(homeSavingsStats?.totalSavedRupees || 0);
    const nextTierThreshold = savedRupees < 500 ? 500 : savedRupees < 2000 ? 2000 : savedRupees < 5000 ? 5000 : null;
    if (nextTierThreshold) {
      const gap = nextTierThreshold - savedRupees;
      const tierName =
        nextTierThreshold === 500
          ? pickLang(lang, { en: 'Smart Mandi Saver', hi: 'स्मार्ट मंडी सेवर' })
          : nextTierThreshold === 2000
          ? pickLang(lang, { en: 'Wholesale Gold Pro', hi: 'थोक गोल्ड प्रो' })
          : pickLang(lang, { en: 'Society Crown Legend', hi: 'सोसायटी क्राउन लीजेंड' });

      list.push({
        id: `badge-gap-${nextTierThreshold}-${Math.floor(savedRupees / 100)}`,
        title: pickLang(lang, {
          en: `₹${gap.toLocaleString('en-IN')} away from "${tierName}" Badge`,
          hi: `"${tierName}" बैज अनलॉक होने में सिर्फ ₹${gap.toLocaleString('en-IN')} बाकी`,
        }),
        message: pickLang(lang, {
          en: `Your total batch savings stand at ₹${savedRupees.toLocaleString('en-IN')}. Add weekly staples to unlock the next crest & forecast perks.`,
          hi: `आपने अभी तक ₹${savedRupees.toLocaleString('en-IN')} बचाए हैं। अगला बचत बैज अनलॉक करने के लिए बास्केट जोड़ें।`,
        }),
        category: 'savings',
        priority: gap <= 250 ? 'high' : 'normal',
        ctaLabel: pickLang(lang, { en: 'Open Savings Card', hi: 'बचत कार्ड देखें' }),
        actionType: 'open_savings',
        timestampLabel: pickLang(lang, { en: 'Savings Goal', hi: 'लक्ष्य' }),
      });
    }

    // 4. Active Order Tracking Milestone Alert
    const activeOrder = orders.find(
      (o) => !o.isSampleOrder && o.status !== 'cancelled' && o.status !== 'delivered'
    );
    if (activeOrder) {
      const statusTextMap: Record<string, { en: string; hi: string }> = {
        ordered: { en: 'Queued for 4:00 AM APMC Auction', hi: 'सुबह 4 AM मंडी बोली के लिए कन्फ़र्म' },
        procured_at_mandi: { en: 'Procured Fresh at APMC Vashi!', hi: 'APMC वाशी से ताज़ा माल उठ गया!' },
        packed: { en: 'Packed in Zero-Waste Eco Bag', hi: 'जूट इको-बैग में पैक हो गया' },
        out_for_delivery: { en: 'Delivery Van En Route to Your Gate', hi: 'डिलीवरी वैन आपके गेट की ओर रवाना' },
      };
      const st = statusTextMap[activeOrder.status] || statusTextMap.ordered;
      list.push({
        id: `order-live-${activeOrder.id}-${activeOrder.status}`,
        title: `#${activeOrder.id} · ${pickLang(lang, st)}`,
        message: pickLang(lang, {
          en: `${activeOrder.totalProduceWeightKg} kg fresh batch scheduled for ${activeOrder.deliverySlot}.`,
          hi: `${activeOrder.totalProduceWeightKg} kg ताज़ा बैच (${activeOrder.deliverySlot}) की तैयारी जारी है।`,
        }),
        category: 'order',
        priority: activeOrder.status === 'out_for_delivery' ? 'high' : 'normal',
        ctaLabel: pickLang(lang, { en: 'Track Order', hi: 'लाइव ट्रैक' }),
        actionType: 'open_orders',
        timestampLabel: pickLang(lang, { en: 'Order Live', hi: 'ऑर्डर' }),
      });
    }

    // 5. Leaderboard XP Rank Nudge
    const liveKg = Math.round((homeSavingsStats?.totalKg || 0) * 10) / 10;
    const realOrdersCount = orders.filter((o) => !o.isSampleOrder && o.status !== 'cancelled').length;
    const userXp = Math.round(savedRupees * 0.5 + liveKg * 25 + realOrdersCount * 120);
    if (user.isLoggedIn) {
      list.push({
        id: `lb-nudge-${Math.floor(userXp / 50)}`,
        title:
          topRankXp && userXp < topRankXp
            ? pickLang(lang, {
                en: `${topRankXp - userXp} XP to challenge Society Rank #1`,
                hi: `लीडरबोर्ड #1 रैंक से सिर्फ ${topRankXp - userXp} XP पीछे`,
              })
            : pickLang(lang, {
                en: `Your Live Saver Score: ${userXp.toLocaleString('en-IN')} XP`,
                hi: `आपका लाइव सेवर स्कोर: ${userXp.toLocaleString('en-IN')} XP`,
              }),
        message: pickLang(lang, {
          en: 'Earn +200 XP & ₹50 cashback per referred society neighbor, plus +25 XP per kg ordered.',
          hi: 'पड़ोसी को जोड़ने पर +200 XP + ₹50 कैशबैक और हर किलो ऑर्डर पर +25 XP कमाएं।',
        }),
        category: 'leaderboard',
        priority: 'normal',
        ctaLabel: pickLang(lang, { en: 'View Leaderboard', hi: 'लीडरबोर्ड देखें' }),
        actionType: 'open_leaderboard',
        timestampLabel: pickLang(lang, { en: 'Rankings', hi: 'रैंकिंग' }),
      });
    }

    // 6. Real Discounted / Seasonal Harvest Arrival from live Produce catalog
    const discountedItems = produceList.filter(
      (p) => p.isAvailable !== false && p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.pricePerKg
    );
    if (discountedItems.length > 0) {
      const pick = discountedItems[0];
      const pct = Math.round(((pick.pricePerKg - (pick.discountPrice || pick.pricePerKg)) / pick.pricePerKg) * 100);
      const itemName = resolveLocalizedProduceName(pick.name, lang, pick.id);
      list.push({
        id: `fresh-drop-${pick.id}-${pick.discountPrice}`,
        title: pickLang(lang, {
          en: `Wholesale Rate Drop: ${itemName} (${pct}% Extra Off)`,
          hi: `आज का सस्ता मंडी भाव: ${itemName} (${pct}% अतिरिक्त छूट)`,
        }),
        message: pickLang(lang, {
          en: `Morning APMC lot available at ₹${pick.discountPrice}/kg instead of ₹${pick.localMarketPricePerKg}/kg local retail.`,
          hi: `लोकल बाज़ार ₹${pick.localMarketPricePerKg}/kg के मुकाबले आज सिर्फ ₹${pick.discountPrice}/kg में उपलब्ध।`,
        }),
        category: 'freshness',
        priority: 'normal',
        ctaLabel: pickLang(lang, { en: 'Shop Deal', hi: 'डील देखें' }),
        actionType: 'open_catalog',
        timestampLabel: pickLang(lang, { en: 'Fresh Drop', hi: 'मंडी भाव' }),
      });
    }

    return list;
  }, [broadcasts, produceCart, timeUntil11Pm, isBefore11PmCutoff, homeSavingsStats, orders, user.isLoggedIn, topRankXp, produceList, lang]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const activeToast = useMemo(() => {
    if (sessionMuted) return null;
    const priorityFirst = [...notifications].sort((a, b) =>
      a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1
    );
    return priorityFirst.find((n) => !dismissedToastIds.has(n.id) && !readIds.has(n.id)) || null;
  }, [notifications, dismissedToastIds, readIds, sessionMuted]);

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStringSet(READ_STORAGE_KEY, next);
      return next;
    });
  };

  const markAllRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveStringSet(READ_STORAGE_KEY, next);
      return next;
    });
  };

  const dismissToast = (id: string) => {
    setDismissedToastIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStringSet(DISMISSED_TOAST_KEY, next);
      return next;
    });
    markRead(id);
  };

  return {
    notifications,
    unreadCount,
    readIds,
    activeToast,
    sessionMuted,
    setSessionMuted,
    markRead,
    markAllRead,
    dismissToast,
    refreshFeed: fetchDynamicFeed,
  };
}

function getCategoryIcon(cat: SmartNotificationCategory) {
  switch (cat) {
    case 'cutoff':
      return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 'savings':
      return <Award className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
    case 'leaderboard':
      return <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    case 'order':
      return <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    default:
      return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  }
}

interface SmartNotificationBellProps {
  onNavigateTab: (tab: AppPageId) => void;
  onOpenSavingsForecast: () => void;
  isAdminAuthorized?: boolean;
}

export const SmartNotificationBell: React.FC<SmartNotificationBellProps> = ({
  onNavigateTab,
  onOpenSavingsForecast,
  isAdminAuthorized = false,
}) => {
  const { lang, setIsCartOpen, produceList, produceCart, orders, featureFlags } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [filterCat, setFilterCat] = useState<'all' | SmartNotificationCategory>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const approxSavedStats = useMemo(() => {
    let saved = 0;
    let kg = 0;
    const rateMap = new Map(
      produceList.map((p) => [
        p.id,
        {
          price: p.discountPrice && p.discountPrice > 0 ? p.discountPrice : p.pricePerKg,
          market: p.localMarketPricePerKg,
        },
      ])
    );
    Object.entries(produceCart).forEach(([id, q]) => {
      const r = rateMap.get(id);
      if (r && q > 0) {
        kg += q;
        saved += Math.max(0, (r.market - r.price) * q) + r.market * q * 0.14;
      }
    });
    orders.forEach((o) => {
      if (o.status === 'cancelled' || o.isSampleOrder) return;
      (o.produceItems || []).forEach((it) => {
        const r = rateMap.get(it.produceId);
        const market = r?.market || Math.round(it.pricePerKg * 1.32);
        kg += it.quantityKg;
        saved += Math.max(0, (market - it.pricePerKg) * it.quantityKg) + market * it.quantityKg * 0.14;
      });
    });
    return { totalSavedRupees: Math.round(saved), totalKg: kg, wasteAvoidedKg: kg * 0.14 };
  }, [produceList, produceCart, orders]);

  const { notifications, unreadCount, readIds, markRead, markAllRead, refreshFeed } =
    useSmartDynamicNotifications(approxSavedStats);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const visibleItems = useMemo(() => {
    if (filterCat === 'all') return notifications;
    return notifications.filter((n) => n.category === filterCat);
  }, [notifications, filterCat]);

  const executeNotificationAction = (item: SmartNotificationItem) => {
    markRead(item.id);
    setIsOpen(false);
    if (item.actionType === 'open_cart') setIsCartOpen(true);
    else if (item.actionType === 'open_savings') onOpenSavingsForecast();
    else if (item.actionType === 'open_leaderboard') onNavigateTab('leaderboard');
    else if (item.actionType === 'open_orders') onNavigateTab('orders');
    else onNavigateTab('catalog');
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMsg.trim()) return;
    setIsPosting(true);
    try {
      await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminAuthHeaders() },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMsg.trim(),
          category: 'freshness',
          priority: 'high',
          ctaTab: 'catalog',
          ctaLabel: 'Open Fresh Store',
        }),
      });
      setBroadcastTitle('');
      setBroadcastMsg('');
      await refreshFeed();
    } finally {
      setIsPosting(false);
    }
  };

  if (!featureFlags.smartNotifications) return null;

  return (
    <div ref={popoverRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Smart Notifications"
        title={pickLang(lang, {
          en: 'Smart Dynamic Notifications',
          hi: 'स्मार्ट लाइव नोटिफ़िकेशन',
        })}
        className="relative p-1.5 sm:p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-950/40 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
      >
        <Bell className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-pink-600 text-white text-[10px] font-black flex items-center justify-center font-mono-nums shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-emerald-50/60 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {pickLang(lang, {
                  en: 'Smart Dynamic Alerts',
                  hi: 'स्मार्ट लाइव अलर्ट्स',
                })}
              </span>
              {unreadCount > 0 && (
                <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-mono-nums">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{pickLang(lang, { en: 'Mark all read', hi: 'सब पढ़ा' })}</span>
              </button>
            )}
          </div>

          {/* Filter Strip */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-bold">
            {([
              { id: 'all', label: pickLang(lang, { en: 'All', hi: 'सभी' }) },
              { id: 'savings', label: pickLang(lang, { en: 'Badges', hi: 'बैज' }) },
              { id: 'cutoff', label: pickLang(lang, { en: 'Cutoff', hi: 'कटऑफ' }) },
              { id: 'leaderboard', label: pickLang(lang, { en: 'Rank', hi: 'रैंक' }) },
              { id: 'order', label: pickLang(lang, { en: 'Orders', hi: 'ऑर्डर' }) },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterCat(tab.id)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  filterCat === tab.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alert List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {visibleItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {pickLang(lang, {
                  en: 'You are all caught up! Live batch & savings updates appear here automatically.',
                  hi: 'अभी कोई नया अलर्ट नहीं है — आपके ऑर्डर व बचत के लाइव अपडेट यहाँ दिखेंगे।',
                })}
              </div>
            ) : (
              visibleItems.map((item) => {
                const isUnread = !readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 text-xs transition-colors ${
                      isUnread
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'bg-white dark:bg-slate-900 opacity-85'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 dark:text-white leading-snug">
                            {item.title}
                          </span>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {item.message}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.timestampLabel}
                          </span>
                          {item.ctaLabel && (
                            <button
                              type="button"
                              onClick={() => executeNotificationAction(item)}
                              className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer text-[11px]"
                            >
                              <span>{item.ctaLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Admin Quick Broadcast Form */}
          {isAdminAuthorized && (
            <form
              onSubmit={handleBroadcastSubmit}
              className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs"
            >
              <div className="text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Broadcast Live Society Alert
              </div>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Headline (e.g. Fresh Alphonso Lot Arrived)"
                className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Short alert details..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={isPosting || !broadcastTitle.trim() || !broadcastMsg.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

interface SmartDynamicToastProps {
  homeSavingsStats?: {
    totalSavedRupees: number;
    totalKg: number;
    wasteAvoidedKg: number;
  };
  onNavigateTab: (tab: AppPageId) => void;
  onOpenSavingsForecast: () => void;
}

export const SmartDynamicToast: React.FC<SmartDynamicToastProps> = ({
  homeSavingsStats,
  onNavigateTab,
  onOpenSavingsForecast,
}) => {
  const { setIsCartOpen, featureFlags } = useApp();
  const { activeToast, dismissToast, setSessionMuted } = useSmartDynamicNotifications(homeSavingsStats);

  if (!featureFlags.smartNotifications || !activeToast) return null;

  const handleAction = () => {
    dismissToast(activeToast.id);
    if (activeToast.actionType === 'open_cart') setIsCartOpen(true);
    else if (activeToast.actionType === 'open_savings') onOpenSavingsForecast();
    else if (activeToast.actionType === 'open_leaderboard') onNavigateTab('leaderboard');
    else if (activeToast.actionType === 'open_orders') onNavigateTab('orders');
    else onNavigateTab('catalog');
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 left-3 sm:left-5 z-30 max-w-sm w-[calc(100vw-24px)] sm:w-88 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-200 dark:border-emerald-800/80 rounded-2xl shadow-xl p-3.5 animate-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
          {getCategoryIcon(activeToast.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white leading-snug">
              {activeToast.title}
            </span>
            <button
              type="button"
              onClick={() => dismissToast(activeToast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2">
            {activeToast.message}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            {activeToast.ctaLabel && (
              <button
                type="button"
                onClick={handleAction}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{activeToast.ctaLabel}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSessionMuted(true)}
              className="text-[10.5px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
            >
              <VolumeX className="w-3 h-3" />
              <span>Mute alerts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

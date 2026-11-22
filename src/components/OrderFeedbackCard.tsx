import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CustomerOrder } from '../types';
import { pickLang } from '../utils/i18nHelper';
import { Star, CheckCircle2, MessageSquareHeart, Edit3 } from 'lucide-react';

interface OrderFeedbackCardProps {
  order: CustomerOrder;
  stage?: 'checkout' | 'delivered';
  compact?: boolean;
}

const FEEDBACK_TAGS = [
  {
    id: 'farm_fresh',
    labels: {
      en: 'Farm-Fresh Produce',
      hi: 'खेत जैसी ताज़गी',
      mr: 'ताजी भाजीपाला',
      hinglish: 'Ekdam Taaza Maal',
    },
  },
  {
    id: 'exact_weight',
    labels: {
      en: 'Accurate Weight',
      hi: 'सटीक तौल',
      mr: 'अचूक वजन',
      hinglish: 'Exact Weight',
    },
  },
  {
    id: 'on_time',
    labels: {
      en: 'On-Time Delivery',
      hi: 'समय पर वैन',
      mr: 'वेळेवर डिलिव्हरी',
      hinglish: 'On-Time Delivery',
    },
  },
  {
    id: 'value_price',
    labels: {
      en: 'Wholesale Savings',
      hi: 'थोक भाव बचत',
      mr: 'घाऊक दरात बचत',
      hinglish: 'Best Mandi Rate',
    },
  },
];

const CHECKOUT_TAGS = [
  {
    id: 'easy_order',
    labels: {
      en: 'Smooth Booking',
      hi: 'आसान ऑर्डरिंग',
      mr: 'सोपी ऑर्डर',
      hinglish: 'Smooth Booking',
    },
  },
  {
    id: 'voice_fast',
    labels: {
      en: 'Fast Voice / Cart',
      hi: 'तेज़ कार्ट / वॉइस',
      mr: 'जलद कार्ट / व्हॉइस',
      hinglish: 'Fast Experience',
    },
  },
  {
    id: 'value_price',
    labels: {
      en: 'Great Mandi Rates',
      hi: 'बढ़िया मंडी भाव',
      mr: 'उत्तम मंडी दर',
      hinglish: 'Great Mandi Rates',
    },
  },
];

export const OrderFeedbackCard: React.FC<OrderFeedbackCardProps> = ({
  order,
  stage = 'delivered',
  compact = false,
}) => {
  const { lang, submitOrderFeedback } = useApp();

  const [selectedRating, setSelectedRating] = useState<number>(order.feedback?.rating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(order.feedback?.freshnessTags || []);
  const [comment, setComment] = useState<string>(order.feedback?.comment || '');
  const [isEditing, setIsEditing] = useState<boolean>(!order.feedback);

  useEffect(() => {
    if (order.feedback) {
      setSelectedRating(order.feedback.rating);
      setSelectedTags(order.feedback.freshnessTags || []);
      setComment(order.feedback.comment || '');
      setIsEditing(false);
    }
  }, [order.id, order.feedback]);

  const tagsSource = stage === 'checkout' ? CHECKOUT_TAGS : FEEDBACK_TAGS;

  const activeRating = hoverRating || selectedRating;

  const getRatingSentiment = (val: number) => {
    if (val === 1) {
      return pickLang(lang, {
        en: 'Needs improvement',
        hi: 'सुधार की ज़रूरत',
        mr: 'सुधारणा हवी',
        hinglish: 'Needs improvement',
      });
    }
    if (val === 2) {
      return pickLang(lang, {
        en: 'Could be fresher',
        hi: 'ठीक-ठाक अनुभव',
        mr: 'ठीक अनुभव',
        hinglish: 'Okay experience',
      });
    }
    if (val === 3) {
      return pickLang(lang, {
        en: 'Good & clean',
        hi: 'अच्छा अनुभव',
        mr: 'चांगला अनुभव',
        hinglish: 'Good & clean',
      });
    }
    if (val === 4) {
      return pickLang(lang, {
        en: 'Very fresh & crisp',
        hi: 'बहुत बढ़िया व ताज़ा',
        mr: 'खूप ताजी व उत्तम',
        hinglish: 'Very fresh & crisp',
      });
    }
    if (val === 5) {
      return pickLang(lang, {
        en: 'Farm-fresh APMC quality!',
        hi: 'लाजवाब · मंडी जैसी ताज़गी!',
        mr: 'अप्रतिम · थेट मंडीचा ताजेपणा!',
        hinglish: 'Ekdam Farm-Fresh Quality!',
      });
    }
    return '';
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRating < 1) return;
    submitOrderFeedback(order.id, {
      rating: selectedRating,
      freshnessTags: selectedTags,
      comment,
      stage,
    });
    setIsEditing(false);
  };

  if (!isEditing && order.feedback) {
    const tagLabels = (order.feedback.freshnessTags || [])
      .map((id) => {
        const found = [...FEEDBACK_TAGS, ...CHECKOUT_TAGS].find((t) => t.id === id);
        return found ? pickLang(lang, found.labels) : null;
      })
      .filter(Boolean);

    return (
      <div
        className={`w-full rounded-xl bg-emerald-50/75 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/80 ${
          compact ? 'p-3' : 'p-4'
        } text-left`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {pickLang(lang, {
                    en: 'Thanks for rating ताज़ाMandi',
                    hi: 'आपकी ताज़ाMandi रेटिंग दर्ज हो गई',
                    mr: 'तुमचे ताज़ाMandi रेटिंग नोंदवले गेले',
                    hinglish: 'Rating ke liye Shukriya!',
                  })}
                </span>
                <span className="inline-flex items-center gap-0.5" aria-label={`${order.feedback.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3.5 h-3.5 ${
                        n <= order.feedback!.rating
                          ? 'fill-amber-400 text-amber-500'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </span>
              </div>

              {tagLabels.length > 0 && (
                <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mt-1">
                  {tagLabels.join(' · ')}
                </p>
              )}

              {order.feedback.comment && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                  "{order.feedback.comment}"
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            <span>{pickLang(lang, { en: 'Edit', hi: 'बदलें', mr: 'बदला', hinglish: 'Edit' })}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 ${
        compact ? 'p-3 space-y-2.5' : 'p-4 space-y-3'
      } text-left`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {stage === 'checkout'
                ? pickLang(lang, {
                    en: 'How smooth was your order experience?',
                    hi: 'ऑर्डर बुक करने का अनुभव कैसा रहा?',
                    mr: 'ऑर्डर अनुभव कसा होता?',
                    hinglish: 'Order booking experience kaisa raha?',
                  })
                : pickLang(lang, {
                    en: 'Rate your ताज़ाMandi freshness & delivery',
                    hi: 'ताज़ी सब्ज़ियों और डिलीवरी को रेटिंग दें',
                    mr: 'ताज्या भाज्या आणि डिलिव्हरीला रेटिंग द्या',
                    hinglish: 'Produce freshness aur delivery rate karein',
                  })}
            </div>
            {activeRating > 0 && (
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                {getRatingSentiment(activeRating)}
              </div>
            )}
          </div>
        </div>

        {/* Interactive 5-Star Selector */}
        <div
          className="flex items-center gap-1 self-start sm:self-auto"
          role="radiogroup"
          aria-label="Order rating from 1 to 5 stars"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const filled = star <= activeRating;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={selectedRating === star}
                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setSelectedRating(star)}
                className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-transform active:scale-90 cursor-pointer"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    filled
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Show highlights + note + submit cleanly as soon as user taps a star */}
      {selectedRating > 0 && (
        <div className="space-y-2.5 pt-1 border-t border-slate-200/80 dark:border-slate-700/70">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagsSource.map((tag) => {
              const active = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                  }`}
                >
                  {pickLang(lang, tag.labels)}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={240}
              placeholder={pickLang(lang, {
                en: 'Optional note for our 4 AM mandi team...',
                hi: 'कोई सुझाव या टिप्पणी लिखें (वैकल्पिक)...',
                mr: 'काही अभिप्राय असल्यास लिहा (ऐच्छिक)...',
                hinglish: 'Koi feedback note likhein (optional)...',
              })}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-emerald-600"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Submit',
                hi: 'भेजें',
                mr: 'पाठवा',
                hinglish: 'Submit',
              })}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

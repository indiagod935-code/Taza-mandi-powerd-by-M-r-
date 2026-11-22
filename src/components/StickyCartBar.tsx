import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { pickLang } from '../utils/i18nHelper';

export const StickyCartBar: React.FC = () => {
  const {
    totalCartItemCount,
    totalProduceWeightKg,
    produceCart,
    produceList,
    accessoryCart,
    accessoriesList,
    setIsCartOpen,
    lang,
    featureFlags,
  } = useApp();

  if (!featureFlags.stickyCartBar || totalCartItemCount === 0) return null;

  const produceTotal = Object.entries(produceCart).reduce((sum, [id, qty]) => {
    const numQty = Number(qty) || 0;
    if (numQty <= 0) return sum;
    const item = produceList.find((p) => p.id === id);
    if (!item) return sum;
    const price = item.discountPrice && item.discountPrice > 0 ? item.discountPrice : item.pricePerKg;
    return sum + Math.round(numQty * price);
  }, 0);

  const accessoriesTotal = Object.entries(accessoryCart).reduce((sum, [id, qty]) => {
    const numQty = Number(qty) || 0;
    if (numQty <= 0) return sum;
    const item = accessoriesList.find((a) => a.id === id);
    if (!item) return sum;
    return sum + numQty * item.price;
  }, 0);

  const grandTotal = produceTotal + accessoriesTotal;

  return (
    <div className="fixed bottom-16 md:bottom-5 left-4 right-3 sm:left-8 sm:right-auto sm:min-w-[340px] sm:max-w-md z-35 animate-in slide-in-from-bottom-3 duration-200">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsCartOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCartOpen(true);
          }
        }}
        className="liquid-glass-capsule rounded-full pl-2 pr-2 py-1.5 flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 transition-transform"
      >
        {/* Left: Protruding Bag Orb + Item/Weight summary */}
        <div className="flex items-center gap-2.5 min-w-0 z-10">
          <div className="-ml-3 shrink-0">
            <div className="liquid-glass-orb-ring w-11 h-11 rounded-full p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-950/90 flex items-center justify-center text-amber-300 shadow-inner">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs font-display font-bold text-white leading-tight truncate whitespace-nowrap">
              {totalCartItemCount}{' '}
              {pickLang(lang, { en: 'Items', hi: 'आइटम', mr: 'वस्तू', hinglish: 'Items' })}
              {totalProduceWeightKg > 0 ? ` · ${totalProduceWeightKg} kg` : ''}
            </div>
            <div className="text-[11px] text-white/80 leading-tight font-mono-nums whitespace-nowrap">
              {pickLang(lang, { en: 'Morning 4 AM Lot', hi: 'सुबह 4 AM लॉट', mr: 'सकाळी ४ AM लॉट' })}
            </div>
          </div>
        </div>

        {/* Right: Frosted Price Chip + Pure White View Cart Oval CTA */}
        <div className="flex items-center gap-1.5 shrink-0 z-10">
          <span className="liquid-glass-split px-2.5 py-1.5 rounded-full text-xs font-black text-slate-900 font-mono-nums whitespace-nowrap">
            ₹{grandTotal}
          </span>
          <span className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-md inline-flex items-center gap-1 whitespace-nowrap">
            <span>
              {pickLang(lang, { en: 'View Bag', hi: 'थैली देखें', mr: 'बॅग पहा', hinglish: 'View Bag' })}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
          </span>
        </div>
      </div>
    </div>
  );
};

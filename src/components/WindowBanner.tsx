import React from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Zap, Truck } from 'lucide-react';

interface WindowBannerProps {
  isAdminAuthorized?: boolean;
}

export const WindowBanner: React.FC<WindowBannerProps> = () => {
  const {
    isBefore11PmCutoff,
    timeUntil11Pm,
    lang,
    featureFlags,
  } = useApp();

  if (!featureFlags.windowCutoffBanner) return null;

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8 py-1">
        <div className="flex flex-row flex-nowrap items-center justify-between gap-2 text-[10px] sm:text-[11px] w-full max-w-full whitespace-nowrap overflow-x-auto no-scrollbar">
          {/* Left: 24x7 + 11 PM Cutoff batch status inline */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-black text-[9.5px] bg-emerald-500 text-slate-950 shrink-0">
              <Zap className="w-2.5 h-2.5 fill-slate-950" />
              <span>24x7</span>
            </span>

            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 shrink-0 ${
                isBefore11PmCutoff
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
              }`}
            >
              <Clock className="w-2.5 h-2.5 shrink-0" />
              <span>
                {isBefore11PmCutoff
                  ? lang === 'hi'
                    ? 'कल 10 AM बैच (11 PM से पहले)'
                    : lang === 'mr'
                    ? 'उद्या १० AM बॅच (११ PM आत)'
                    : 'Tomorrow 10 AM Batch'
                  : lang === 'hi'
                  ? 'अगला बैच (11 PM बाद)'
                  : lang === 'mr'
                  ? 'पुढील बॅच (११ PM नंतर)'
                  : 'Next Day Batch (Post-11 PM)'}
              </span>
            </span>

            <span className="text-slate-300 hidden md:inline shrink-0">
              {isBefore11PmCutoff ? (
                <>
                  ·{' '}
                  {lang === 'hi' ? 'शेष:' : lang === 'mr' ? 'बाकी:' : 'Left:'}{' '}
                  <strong className="text-emerald-400 font-mono font-bold">{timeUntil11Pm}</strong>
                </>
              ) : (
                <span className="text-amber-400">
                  · {lang === 'hi' ? '4 AM लॉट लॉक' : lang === 'mr' ? '४ AM लॉट लॉक' : '4 AM Lot Locked'}
                </span>
              )}
            </span>
          </div>

          {/* Right: Inline Hub Note */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:inline-flex items-center gap-1 text-slate-400">
              <Truck className="w-3 h-3 text-emerald-400" />
              <span>
                {lang === 'hi'
                  ? 'सीधा APMC मंडी लॉट'
                  : lang === 'mr'
                  ? 'थेट APMC मंडी लॉट'
                  : 'APMC Direct Hub'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

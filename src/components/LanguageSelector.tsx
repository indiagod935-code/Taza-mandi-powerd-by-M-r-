import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_LANGUAGES, pickLang } from '../utils/i18nHelper';
import { Globe, Check, ChevronDown, Search } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
  align?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  align = 'left',
}) => {
  const { lang, setLang } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLang = useMemo(
    () => SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0],
    [lang]
  );

  const filteredGlobal = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.region === 'global' &&
        (!q ||
          l.label.toLowerCase().includes(q) ||
          l.shortLabel.toLowerCase().includes(q) ||
          l.nativeGreeting.toLowerCase().includes(q))
    );
  }, [search]);

  const filteredIndia = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.region === 'india' &&
        (!q ||
          l.label.toLowerCase().includes(q) ||
          l.shortLabel.toLowerCase().includes(q) ||
          l.nativeGreeting.toLowerCase().includes(q))
    );
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setSearch('');
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={pickLang(lang, {
          en: 'Select Language (18 Global & Indian Languages)',
          hi: 'भाषा चुनें (18 विश्व व भारतीय भाषाएँ)',
          mr: 'भाषा निवडा',
        })}
        className={`inline-flex items-center gap-1.5 font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          compact
            ? 'px-2 py-1 text-[11px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            : 'px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs'
        }`}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>{compact ? activeLang.shortLabel : activeLang.label.split(' (')[0]}</span>
        {!compact && (
          <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
            · 18
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 text-xs animate-in fade-in zoom-in-95`}
        >
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pickLang(lang, {
                en: 'Search language (English, हिंदी, 中文, Español...)',
                hi: 'भाषा खोजें (हिंदी, English, 中文, العربية...)',
              })}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2.5 pr-0.5">
            {filteredGlobal.length > 0 && (
              <div>
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {pickLang(lang, {
                    en: 'Major World Languages',
                    hi: 'प्रमुख अंतर्राष्ट्रीय भाषाएँ',
                  })}
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {filteredGlobal.map((item) => {
                    const selected = item.code === lang;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLang(item.code);
                          setIsOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 text-center font-mono text-[10px] font-black px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            {item.shortLabel}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-slate-400">{item.nativeGreeting}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredIndia.length > 0 && (
              <div>
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {pickLang(lang, {
                    en: 'Indian & Regional Languages',
                    hi: 'भारतीय व क्षेत्रीय भाषाएँ',
                  })}
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {filteredIndia.map((item) => {
                    const selected = item.code === lang;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setLang(item.code);
                          setIsOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 text-center font-mono text-[10px] font-black px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            {item.shortLabel}
                          </span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-slate-400">{item.nativeGreeting}</span>
                          {selected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredGlobal.length === 0 && filteredIndia.length === 0 && (
              <div className="py-4 text-center text-slate-400 text-xs">
                No matching language found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

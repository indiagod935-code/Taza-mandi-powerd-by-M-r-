import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  History,
  PlusCircle,
  RefreshCw,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { pickLang } from '../utils/i18nHelper';

export const AppUpdatesSection: React.FC = () => {
  const { lang } = useApp();
  const {
    hasUpdate,
    currentVersion,
    serverVersion,
    releases,
    lastCheckedAt,
    isCheckingUpdate,
    triggerUpdate,
    checkForUpdates,
  } = usePWAInstall();

  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string>(() => releases[0]?.version || currentVersion);
  const [checkFeedback, setCheckFeedback] = useState(false);

  const handleManualCheck = () => {
    setCheckFeedback(true);
    checkForUpdates();
    window.setTimeout(() => setCheckFeedback(false), 4000);
  };

  const formattedCheckedTime = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
      {/* Header Row */}
      <button
        type="button"
        onClick={() => setIsSectionOpen((prev) => !prev)}
        aria-expanded={isSectionOpen}
        className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left cursor-pointer min-h-[56px]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
              {pickLang(lang, {
                en: 'App Updates & Release History',
                hi: 'ऐप अपडेट व बदलाव इतिहास',
                mr: 'अ‍ॅप अपडेट व बदलांचा इतिहास',
                hinglish: 'App Updates & Release History',
              })}
            </h3>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap tabular-nums">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Running v{currentVersion}
              </span>
              <span aria-hidden="true">·</span>
              {hasUpdate ? (
                <span className="text-amber-700 dark:text-amber-400 font-bold inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {pickLang(lang, {
                      en: `New v${serverVersion} available`,
                      hi: `नया v${serverVersion} अपडेट तैयार`,
                      mr: `नवीन v${serverVersion} उपलब्ध`,
                      hinglish: `New v${serverVersion} Ready`,
                    })}
                  </span>
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {pickLang(lang, {
                      en: 'Latest Version Active',
                      hi: 'नवीनतम वर्ज़न चालू',
                      mr: 'नवीनतम आवृत्ती सक्रिय',
                      hinglish: 'Latest Active',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/70">
          <span>
            {isSectionOpen
              ? pickLang(lang, { en: 'Hide', hi: 'छुपाएँ', mr: 'लपवा', hinglish: 'Hide' })
              : pickLang(lang, { en: 'View', hi: 'देखें', mr: 'पहा', hinglish: 'View' })}
          </span>
          {isSectionOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {isSectionOpen && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4 text-xs">
          {/* Installed vs Server Status Card (Company-style Update Panel) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap tabular-nums">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
                  {pickLang(lang, {
                    en: `Current: v${currentVersion}`,
                    hi: `अभी चल रहा है: v${currentVersion}`,
                    mr: `सध्याची आवृत्ती: v${currentVersion}`,
                    hinglish: `Running: v${currentVersion}`,
                  })}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300">
                  {pickLang(lang, {
                    en: `Server Latest: v${serverVersion}`,
                    hi: `सर्वर पर नया: v${serverVersion}`,
                    mr: `सर्व्हर आवृत्ती: v${serverVersion}`,
                    hinglish: `Server Latest: v${serverVersion}`,
                  })}
                </span>
              </div>

              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 pt-0.5">
                {hasUpdate ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {pickLang(lang, {
                        en: `Update to v${serverVersion} now to unlock the newest features.`,
                        hi: `नए फीचर्स के लिए अभी v${serverVersion} पर अपडेट करें।`,
                        mr: `नवीन सुविधांसाठी आत्ता v${serverVersion} वर अपडेट करा.`,
                        hinglish: `Naye features ke liye abhi v${serverVersion} Update Now karein.`,
                      })}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {pickLang(lang, {
                        en: `You are running the latest version (v${currentVersion}).`,
                        hi: `आप अभी सबसे नया वर्ज़न (v${currentVersion}) इस्तेमाल कर रहे हैं।`,
                        mr: `तुम्ही सध्या नवीनतम आवृत्ती (v${currentVersion}) वापरत आहात.`,
                        hinglish: `Aap abhi latest version (v${currentVersion}) chala rahe hain.`,
                      })}
                    </span>
                  </>
                )}
              </div>

              {checkFeedback && !isCheckingUpdate && !hasUpdate && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  {pickLang(lang, {
                    en: '✓ Checked server — no newer update pending.',
                    hi: '✓ सर्वर जाँचा गया — अभी कोई नया अपडेट बाकी नहीं है।',
                    hinglish: '✓ Verified — abhi koi pending update nahi hai.',
                  })}
                </div>
              )}
              {formattedCheckedTime && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {pickLang(lang, {
                    en: `Last checked at ${formattedCheckedTime}`,
                    hi: `अंतिम जांच: ${formattedCheckedTime}`,
                    hinglish: `Last checked: ${formattedCheckedTime}`,
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {hasUpdate ? (
                <button
                  type="button"
                  onClick={triggerUpdate}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: `Update to v${serverVersion}`,
                      hi: `v${serverVersion} अपडेट करें`,
                      mr: `v${serverVersion} अपडेट करा`,
                      hinglish: `Update Now (v${serverVersion})`,
                    })}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={triggerUpdate}
                  title="Clear browser cache and reload freshest app build"
                  className="min-h-[40px] px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {pickLang(lang, {
                      en: 'Sync Refresh',
                      hi: 'ताज़ा सिंक करें',
                      hinglish: 'Force Refresh',
                    })}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isCheckingUpdate}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>
                  {isCheckingUpdate
                    ? pickLang(lang, { en: 'Checking...', hi: 'जांच जारी...', mr: 'तपासत आहे...' })
                    : pickLang(lang, {
                        en: 'Check Updates',
                        hi: 'अपडेट जांचें',
                        mr: 'अपडेट तपासा',
                        hinglish: 'Check Updates',
                      })}
                </span>
              </button>
            </div>
          </div>

          {/* Chronological Release History (Current + Previous Updates) */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {pickLang(lang, {
                en: 'Current & Previous Updates Changelog',
                hi: 'मौजूदा व पहले के सभी अपडेट्स',
                mr: 'सध्याचे व मागील सर्व अपडेट्स',
                hinglish: 'Current & Previous Updates History',
              })}
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-0.5">
              {releases.map((release, relIndex) => {
                const isExpanded = expandedVersion === release.version;
                const isCurrent = release.version === currentVersion;
                const isServerLatest = release.version === serverVersion;

                return (
                  <div key={release.version} className="py-3 first:pt-1 last:pb-0">
                    <button
                      type="button"
                      onClick={() => setExpandedVersion(isExpanded ? '' : release.version)}
                      aria-expanded={isExpanded}
                      className="w-full flex items-start justify-between gap-3 text-left cursor-pointer py-1"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap tabular-nums">
                          <span className="font-black text-slate-900 dark:text-slate-100">
                            v{release.version}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{release.releasedAt}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                              {pickLang(lang, {
                                en: 'Running Now',
                                hi: 'अभी सक्रिय',
                                mr: 'सध्या चालू',
                                hinglish: 'Running Now',
                              })}
                            </span>
                          )}
                          {!isCurrent && isServerLatest && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                              {pickLang(lang, { en: 'New Update', hi: 'नया अपडेट', hinglish: 'New Update' })}
                            </span>
                          )}
                          {!isCurrent && !isServerLatest && relIndex > 0 && (
                            <span className="text-[10px] text-slate-400">
                              ({pickLang(lang, { en: 'Previous', hi: 'पुराना', hinglish: 'Previous' })})
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug">
                          {pickLang(lang, release.headline)}
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 inline-flex items-center gap-1 mt-0.5">
                        <span>
                          {isExpanded
                            ? pickLang(lang, { en: 'Hide', hi: 'छुपाएँ', hinglish: 'Hide' })
                            : pickLang(lang, { en: 'View', hi: 'देखें', hinglish: 'View' })}
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2.5 space-y-3 pl-1">
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {pickLang(lang, release.summary)}
                        </p>

                        {release.features.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                {pickLang(lang, {
                                  en: 'New Features Added',
                                  hi: 'नए जोड़े गए फीचर्स',
                                  mr: 'नवीन जोडलेल्या सुविधा',
                                  hinglish: 'New Features Added',
                                })}
                              </span>
                            </div>
                            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                              {release.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="text-emerald-600 font-bold" aria-hidden="true">
                                    •
                                  </span>
                                  <span>{pickLang(lang, feat)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {release.fixes.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>
                                {pickLang(lang, {
                                  en: 'Improvements & Fixes',
                                  hi: 'सुधार और बग फिक्स',
                                  mr: 'सुधारणा आणि दुरुस्त्या',
                                  hinglish: 'Improvements & Fixes',
                                })}
                              </span>
                            </div>
                            <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                              {release.fixes.map((fix, idx) => (
                                <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                  <span className="text-slate-400 font-bold" aria-hidden="true">
                                    •
                                  </span>
                                  <span>{pickLang(lang, fix)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { adminApi } from '../api/endpoints';
import { extractErrorMessage, setAdminToken } from '../api/client';
import { signInWithGooglePopup } from '../firebase';
import { pickLang } from '../utils/i18nHelper';
import { ENV_CONFIG } from '../config/env';
import { Lock, ShieldAlert, KeyRound, ArrowLeft, UserCheck, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AdminLockGateProps {
  onUnlock: () => void;
  onBackToStore: () => void;
}

export const AdminLockGate: React.FC<AdminLockGateProps> = ({ onUnlock, onBackToStore }) => {
  const { lang } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPwd = password.trim();
    if (!cleanPwd) {
      setError(
        pickLang(lang, {
          en: 'Please enter the Master Admin password.',
          hi: 'कृपया एडमिन पासवर्ड दर्ज करें।',
          hinglish: 'Kripya Admin password enter karein.',
        })
      );
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      const res = await adminApi.createSession({
        pin: cleanPwd,
        actorName: 'Admin Console Operator',
      });
      if (res.success && res.token) {
        setAdminToken(res.token);
        onUnlock();
      } else {
        setError(
          pickLang(lang, {
            en: 'Invalid Admin Password! Please enter the authorized secret key.',
            hi: 'अमान्य एडमिन पासवर्ड! कृपया सही गुप्त पासवर्ड दर्ज करें।',
            hinglish: 'Galat Admin password! Sahi secret key enter karein.',
          })
        );
      }
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          pickLang(lang, {
            en: 'Invalid Admin Password or RBAC verification failed.',
            hi: 'अमान्य एडमिन पासवर्ड या सर्वर सत्यापन विफल।',
            hinglish: 'Invalid Admin password ya server verification failed.',
          })
        )
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setIsVerifying(true);
    setError('');
    try {
      const fbUser = await signInWithGooglePopup();
      if (!fbUser.emailVerified || fbUser.email.trim().toLowerCase() !== ENV_CONFIG.OWNER_EMAIL) {
        setError(
          pickLang(lang, {
            en: `Access Denied: Only verified Platform Owner (${ENV_CONFIG.OWNER_EMAIL}) may unlock Admin Console.`,
            hi: `अस्वीकृत: केवल सत्यापित प्लेटफ़ॉर्म ओनर (${ENV_CONFIG.OWNER_EMAIL}) ही एडमिन खोल सकते हैं।`,
            hinglish: `Access Denied: Sirf verified owner (${ENV_CONFIG.OWNER_EMAIL}) Admin khol sakte hain.`,
          })
        );
        return;
      }
      const res = await adminApi.createSession({
        email: fbUser.email,
        actorName: fbUser.name || 'Admin (Marco 100)',
      });
      if (res.success && res.token) {
        setAdminToken(res.token);
        onUnlock();
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Google Owner verification failed or cancelled.'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-14 text-center">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-7 sm:p-8 shadow-xl">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          <span>
            {pickLang(lang, {
              en: 'RBAC Protected Admin Portal',
              hi: 'RBAC सुरक्षित एडमिन पोर्टल',
              hinglish: 'RBAC Protected Admin Portal',
            })}
          </span>
        </div>

        <h2 className="text-2xl font-display font-black text-slate-900 dark:text-slate-100 mb-2">
          {pickLang(lang, {
            en: 'Admin Control Center',
            hi: 'एडमिन कंट्रोल सेंटर',
            hinglish: 'Admin Control Center',
          })}
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
          {pickLang(lang, {
            en: 'Restricted strictly to authorized platform administrators. Manages live mandi pricing, wholesale stock, customer registry & dispatch.',
            hi: 'यह सेक्शन केवल अधिकृत प्लेटफ़ॉर्म एडमिन के लिए है। यहाँ से उत्पाद का भाव, स्टॉक इन/आउट, रजिस्टर्ड यूज़र और डिलीवरी कंट्रोल की जाती है।',
            hinglish:
              'Yeh section sirf authorized platform admin ke liye hai. Yahan se rates, stock, user accounts aur delivery control hoti hai.',
          })}
        </p>

        {/* Password Entry Form */}
        <form onSubmit={handleVerifyPassword} className="max-w-xs mx-auto space-y-3 mb-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-left">
              {pickLang(lang, {
                en: 'Enter Master Admin Password:',
                hi: 'एडमिन गुप्त पासवर्ड दर्ज करें:',
                hinglish: 'Master Admin Password enter karein:',
              })}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={30}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={pickLang(lang, {
                  en: 'Enter secret key...',
                  hi: 'पासवर्ड दर्ज करें...',
                  hinglish: 'Secret password...',
                })}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold text-base text-slate-900 dark:text-slate-100 focus:outline-emerald-600"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {pickLang(lang, {
                en: 'Verify & Unlock Admin Console',
                hi: 'सत्यापित करें और एडमिन अनलॉक करें',
                hinglish: 'Verify & Unlock Admin Console',
              })}
            </span>
          </button>
        </form>

        {/* Direct Admin 1-Click login */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            disabled={isVerifying}
            onClick={handleAdminGoogleLogin}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {pickLang(lang, {
                en: `Sign in as ${ENV_CONFIG.OWNER_EMAIL}`,
                hi: `${ENV_CONFIG.OWNER_EMAIL} से लॉगिन`,
                hinglish: `${ENV_CONFIG.OWNER_EMAIL} se Sign In`,
              })}
            </span>
          </button>

          <button
            type="button"
            onClick={onBackToStore}
            className="w-full sm:w-auto px-4 py-2 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {pickLang(lang, {
                en: 'Back to Storefront',
                hi: 'ग्राहक स्टोर पर वापस जाएं',
                hinglish: 'Customer Store par wapas jayein',
              })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

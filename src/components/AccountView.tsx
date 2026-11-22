import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserReferralDashboard } from './UserReferralDashboard';
import { pickLang, SUPPORTED_LANGUAGES } from '../utils/i18nHelper';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  User,
  MapPin,
  Globe,
  LogOut,
  ChevronRight,
  ChevronDown,
  FolderDown,
  Download,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Compass,
  TrendingUp,
  Activity,
  FileText,
  Package,
  Truck,
  Gift,
  MessageCircle,
  Camera,
  Trophy,
  Palette,
  Sparkles,
  Lock,
  Ticket,
  Store,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { ClientActivityEntry } from '../utils/activityLogger';
import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { GamifiedSavingsBadgeCard } from './GamifiedSavingsBadgeCard';
import { GamifiedLeaderboard } from './GamifiedLeaderboard';
import { AppUpdatesSection } from './AppUpdatesSection';
import { compressAvatarFile } from '../utils/avatarHelper';
import { signInWithGooglePopup, syncFirebaseUserProfile } from '../firebase';
import { rewardsApi } from '../api/endpoints';
import { authService } from '../services/authService';
import { getAdminAuthHeaders } from '../api/client';
import { CustomerRewardRecord, StoreUiSampleId } from '../types';

interface AccountViewProps {
  onGoToStore: () => void;
  onOpenOrders: () => void;
  onOpenTracking: () => void;
  onOpenMap: () => void;
  onOpenInstall: () => void;
  onOpenSavingsForecast?: () => void;
  onOpenSamplesGallery?: () => void;
  onOpenBrandModal?: () => void;
  onOpenAdminDesk?: () => void;
  onLockAdmin?: () => void;
  isAdminAuthorized?: boolean;
  isAdminLocked?: boolean;
  initialSubSection?: 'menu' | 'referral' | 'leaderboard';
  homeSavingsStats?: {
    totalSavedRupees: number;
    totalKg: number;
    wasteAvoidedKg: number;
  };
}

interface ApkFileEntry {
  name: string;
  url: string;
  sizeKb: number;
}

export const AccountView: React.FC<AccountViewProps> = ({
  onGoToStore,
  onOpenOrders,
  onOpenTracking,
  onOpenMap,
  onOpenInstall,
  onOpenSavingsForecast,
  onOpenSamplesGallery,
  onOpenBrandModal,
  onOpenAdminDesk,
  onLockAdmin,
  isAdminAuthorized = false,
  isAdminLocked = false,
  initialSubSection = 'menu',
  homeSavingsStats,
}) => {
  const {
    user,
    brand,
    lang,
    setLang,
    logout,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    updateUserProfile,
    featureFlags,
    activeUiSample,
    setActiveUiSample,
    festivalTheme,
    setIsCartOpen,
  } = useApp();

  const [activeSubSection, setActiveSubSection] = useState<'menu' | 'referral' | 'leaderboard'>(
    initialSubSection
  );
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [isApkFolderOpen, setIsApkFolderOpen] = useState(false);
  const [isLangSliderOpen, setIsLangSliderOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [apkFiles, setApkFiles] = useState<ApkFileEntry[]>([]);
  const [isUploadingApk, setIsUploadingApk] = useState(false);
  const [apkUploadNotice, setApkUploadNotice] = useState('');
  const [myActivityLogs, setMyActivityLogs] = useState<ClientActivityEntry[]>([]);
  const [myRewards, setMyRewards] = useState<CustomerRewardRecord[]>([]);
  const [dpUploadToast, setDpUploadToast] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpPreview, setPhoneOtpPreview] = useState('');
  const [phoneEnteredOtp, setPhoneEnteredOtp] = useState('');
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState('');
  const { isRunningStandalone, isInstallable, isInIframe, hasUpdate, install, triggerUpdate } =
    usePWAInstall();

  const languages = SUPPORTED_LANGUAGES;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    setActiveSubSection(initialSubSection);
  }, [initialSubSection]);

  const fetchMyActivity = async () => {
    if (!user.id) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`/api/activity-logs?userId=${encodeURIComponent(user.id)}&limit=12`);
      const data = await res.json();
      if (data?.success && Array.isArray(data.logs)) {
        setMyActivityLogs(data.logs);
      }
    } catch {
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetch('/api/app/apk-status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.apkFiles)) {
          setApkFiles(data.apkFiles);
        }
      })
      .catch(() => {});
    fetchMyActivity();
    if (user.isLoggedIn && (user.id || user.phone)) {
      rewardsApi
        .getMyRewards({ userId: user.id, phone: user.phone })
        .then((res) => {
          if (res?.success && Array.isArray(res.rewards)) {
            setMyRewards(res.rewards);
          }
        })
        .catch(() => {});
    }
  }, [user.id, user.phone, user.isLoggedIn]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressAvatarFile(file);
      updateUserProfile({ avatarUrl: compressed });
      setDpUploadToast(
        pickLang(lang, {
          en: 'Profile photo updated!',
          hi: 'प्रोफाइल फोटो सफलतापूर्वक लग गई!',
          mr: 'प्रोफाइल फोटो अपडेट झाला!',
          hinglish: 'Profile DP update ho gayi!',
        })
      );
      setTimeout(() => setDpUploadToast(''), 3500);
    } catch {}
  };

  const refreshApkStatus = () => {
    fetch('/api/app/apk-status')
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.apkFiles)) {
          setApkFiles(data.apkFiles);
        }
      })
      .catch(() => {});
  };

  const handleAdminApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingApk(true);
    setApkUploadNotice('');
    try {
      const buf = await file.arrayBuffer();
      const res = await fetch('/api/app/admin/upload-apk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'x-file-name': file.name,
          ...getAdminAuthHeaders(),
        },
        body: buf,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setApkUploadNotice(data?.error || 'APK upload failed');
      } else {
        setApkUploadNotice(`✓ ${data.file.name} uploaded (${(data.file.sizeKb / 1024).toFixed(1)} MB)`);
        refreshApkStatus();
      }
    } catch (err: any) {
      setApkUploadNotice(err?.message || 'APK upload error');
    } finally {
      setIsUploadingApk(false);
      e.target.value = '';
    }
  };

  if (activeSubSection === 'referral') {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4">
        <button
          type="button"
          onClick={() => setActiveSubSection('menu')}
          className="mb-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
        >
          ←{' '}
          {pickLang(lang, {
            en: 'Back to Account Menu',
            hi: 'वापस खाता मेनू पर जाएँ',
            mr: 'खाते मेनूकडे परत जा',
            hinglish: 'Wapas Account Menu par jaayein',
          })}
        </button>
        <UserReferralDashboard onGoToShop={onGoToStore} />
      </div>
    );
  }

  if (activeSubSection === 'leaderboard') {
    return (
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4">
        <button
          type="button"
          onClick={() => setActiveSubSection('menu')}
          className="mb-4 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
        >
          ←{' '}
          {pickLang(lang, {
            en: 'Back to Account Menu',
            hi: 'वापस खाता मेनू पर जाएँ',
            mr: 'खाते मेनूकडे परत जा',
            hinglish: 'Wapas Account Menu par jaayein',
          })}
        </button>
        <GamifiedLeaderboard
          homeSavingsStats={homeSavingsStats}
          onOpenShop={onGoToStore}
          onOpenReferral={() => setActiveSubSection('referral')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 space-y-3.5">
      {/* 1. CLEAN IDENTITY BAR (DP Upload Avatar + Name; NO Green Dot next to name) */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-3.5 shadow-sm border border-emerald-700/80 overflow-hidden">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <label
              title={pickLang(lang, {
                en: 'Upload Profile Photo (DP)',
                hi: 'प्रोफाइल फोटो लगाएँ (DP)',
                hinglish: 'Profile DP Lagayein',
              })}
              className="relative w-11 h-11 rounded-full bg-white/15 flex items-center justify-center border border-white/30 shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-300 transition"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'Customer DP'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
              {user.isLoggedIn && (
                <span className="absolute bottom-0 inset-x-0 bg-black/55 py-0.5 flex items-center justify-center">
                  <Camera className="w-2.5 h-2.5 text-white" />
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={!user.isLoggedIn}
              />
            </label>

            <button
              type="button"
              onClick={() => (user.isLoggedIn ? setShowProfileDetails((prev) => !prev) : setIsAuthModalOpen(true))}
              aria-expanded={showProfileDetails}
              className="min-w-0 flex-1 text-left cursor-pointer"
            >
              <h1 className="text-sm sm:text-base font-black font-display tracking-tight truncate max-w-[190px] sm:max-w-xs">
                {user.isLoggedIn && user.name
                  ? user.name
                  : pickLang(lang, {
                      en: 'Customer Account',
                      hi: 'ग्राहक खाता',
                      mr: 'ग्राहक खाते',
                      hinglish: 'Customer Account',
                    })}
              </h1>
              {user.isLoggedIn && (
                <div className="text-[11px] text-emerald-100/80 truncate">
                  {pickLang(lang, {
                    en: 'Tap photo for DP · Tap name for address',
                    hi: 'फोटो पर टैप कर DP बदलें · पता देखने के लिए टैप करें',
                    hinglish: 'Photo par DP badlein · Tap for address',
                  })}
                </div>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {user.isLoggedIn ? (
              <>
                <label className="px-2.5 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl font-bold text-[11px] border border-white/20 flex items-center gap-1 cursor-pointer">
                  <Camera className="w-3 h-3 text-amber-300" />
                  <span className="hidden sm:inline">
                    {pickLang(lang, { en: 'DP Photo', hi: 'DP फोटो', hinglish: 'DP' })}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowProfileDetails((prev) => !prev)}
                  className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-emerald-300" />
                  <span>
                    {pickLang(lang, {
                      en: showProfileDetails ? 'Hide' : 'Address',
                      hi: showProfileDetails ? 'छुपाएँ' : 'पता',
                      mr: showProfileDetails ? 'लपवा' : 'पत्ता',
                      hinglish: showProfileDetails ? 'Hide' : 'Address',
                    })}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProfileDetails ? 'rotate-180' : ''}`} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl font-black text-xs shadow-sm transition cursor-pointer"
              >
                {pickLang(lang, {
                  en: 'Sign In',
                  hi: 'लॉगिन करें',
                  mr: 'लॉगिन करा',
                  hinglish: 'Sign In',
                })}
              </button>
            )}
          </div>
        </div>

        {dpUploadToast && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-400/50 text-emerald-200 text-[11px] font-bold">
            ✓ {dpUploadToast}
          </div>
        )}

        {/* Tap-to-Reveal Address, Phone, Camera DP Upload & Edit Profile */}
        {user.isLoggedIn && showProfileDetails && (
          <div className="mt-3 pt-3 border-t border-white/15 space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-1 min-w-0">
                {user.phone && (
                  <div className="font-mono text-emerald-100 flex flex-wrap items-center gap-1.5">
                    <span>
                      📞 {user.phone.startsWith('+91') ? user.phone : `+91 ${user.phone}`}
                      {user.secondaryPhone ? ` · ${user.secondaryPhone}` : ''}
                    </span>
                    {user.phoneVerified ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 text-[10px] font-sans font-bold">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{pickLang(lang, { en: 'OTP Verified', hi: 'OTP सत्यापित' })}</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          setVerifyNotice('');
                          try {
                            const res = await fetch('/api/auth/send-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ phone: user.phone, purpose: 'verify_phone' }),
                            });
                            const data = await res.json().catch(() => ({}));
                            if (res.ok && data?.otpPreview) {
                              setPhoneOtpPreview(String(data.otpPreview));
                              setPhoneOtpSent(true);
                            } else {
                              setVerifyNotice(data?.error || 'Could not send OTP.');
                            }
                          } catch {
                            setVerifyNotice('Network error while sending OTP.');
                          }
                        }}
                        className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-sans font-black text-[10px] hover:bg-amber-300 cursor-pointer"
                      >
                        {pickLang(lang, { en: 'Verify Mobile OTP', hi: 'मोबाइल OTP वेरीफाई करें' })}
                      </button>
                    )}
                  </div>
                )}

                <div className="text-emerald-100/95 flex flex-wrap items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">
                    {user.verifiedGoogleEmail || user.email || pickLang(lang, { en: 'No Gmail linked', hi: 'Gmail जुड़ा नहीं' })}
                  </span>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 text-[10px] font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>{pickLang(lang, { en: 'Gmail Connected', hi: 'Gmail जुड़ा है ✓' })}</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isConnectingGmail}
                      onClick={async () => {
                        setVerifyNotice('');
                        setIsConnectingGmail(true);
                        try {
                          const googleUser = await signInWithGooglePopup(
                            user.email && !user.email.endsWith('@tazamandi.in') ? user.email : undefined
                          );
                          const res = await fetch('/api/auth/link-google', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: user.id,
                              uid: googleUser.uid,
                              email: googleUser.email,
                              emailVerified: googleUser.emailVerified,
                              name: googleUser.name,
                            }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok || !data?.success || !data?.user) {
                            setVerifyNotice(data?.error || 'Could not connect Google Gmail.');
                            return;
                          }
                          void syncFirebaseUserProfile({
                            uid: googleUser.uid,
                            name: data.user.name,
                            email: data.user.email,
                            phone: data.user.phone,
                            flat: data.user.flat,
                            society: data.user.society,
                            fullAddress: data.user.fullAddress,
                            loginProvider: 'google',
                          }).catch(() => {});
                          updateUserProfile({
                            email: data.user.email,
                            emailVerified: true,
                            verifiedGoogleEmail: data.user.email,
                          });
                          setVerifyNotice(
                            pickLang(lang, {
                              en: `✓ Gmail verified & connected (${data.user.email})`,
                              hi: `✓ Gmail कनेक्ट व सत्यापित हो गया (${data.user.email})`,
                            })
                          );
                        } catch (err: any) {
                          setVerifyNotice(
                            err?.code === 'auth/popup-closed-by-user'
                              ? pickLang(lang, { en: 'Google popup closed.', hi: 'Google विंडो बंद की गई।' })
                              : pickLang(lang, { en: 'Could not connect Gmail right now.', hi: 'Gmail अभी कनेक्ट नहीं हो सका।' })
                          );
                        } finally {
                          setIsConnectingGmail(false);
                        }
                      }}
                      className="px-2 py-0.5 rounded-full bg-white text-slate-950 font-black text-[10px] hover:bg-amber-200 cursor-pointer disabled:opacity-60"
                    >
                      {isConnectingGmail
                        ? pickLang(lang, { en: 'Connecting...', hi: 'कनेक्ट हो रहा है...' })
                        : pickLang(lang, { en: 'Connect Gmail', hi: 'Gmail कनेक्ट करें' })}
                    </button>
                  )}
                </div>

                {(user.fullAddress || user.society || user.flat) && (
                  <div className="flex items-start gap-1.5 text-emerald-100/95 leading-snug">
                    <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                    <span>
                      {user.fullAddress || `${user.flat ? `#${user.flat}, ` : ''}${user.society || brand.societyName}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-white/20">
                  <Camera className="w-3.5 h-3.5 text-amber-300" />
                  <span>{pickLang(lang, { en: 'Change DP', hi: 'DP लगाएँ', hinglish: 'Upload DP' })}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="px-3.5 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {pickLang(lang, {
                      en: 'Edit Profile',
                      hi: 'प्रोफाइल बदलें',
                      mr: 'प्रोफाइल बदला',
                      hinglish: 'Edit Profile',
                    })}
                  </span>
                </button>
              </div>
            </div>

            {phoneOtpSent && !user.phoneVerified && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-400/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold text-emerald-100">
                    📲 OTP: <span className="font-mono text-sm font-black tracking-widest text-amber-300">{phoneOtpPreview}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoneEnteredOtp(phoneOtpPreview)}
                    className="px-2 py-1 rounded-lg bg-emerald-700 text-white text-[10px] font-bold cursor-pointer"
                  >
                    1-Click Fill
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={phoneEnteredOtp}
                    onChange={(e) => setPhoneEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="4-digit OTP"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white text-slate-900 font-mono font-black text-center tracking-widest"
                  />
                  <button
                    type="button"
                    disabled={isVerifyingPhoneOtp}
                    onClick={async () => {
                      setIsVerifyingPhoneOtp(true);
                      setVerifyNotice('');
                      try {
                        const res = await fetch('/api/auth/verify-phone-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: user.id,
                            phone: user.phone,
                            otp: phoneEnteredOtp.trim(),
                          }),
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok || !data?.success) {
                          setVerifyNotice(data?.error || 'Incorrect OTP.');
                          return;
                        }
                        updateUserProfile({ phoneVerified: true });
                        setPhoneOtpSent(false);
                        setVerifyNotice(
                          pickLang(lang, {
                            en: '✓ Mobile number verified via OTP!',
                            hi: '✓ मोबाइल नंबर OTP द्वारा सत्यापित हो गया!',
                          })
                        );
                      } finally {
                        setIsVerifyingPhoneOtp(false);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-black cursor-pointer disabled:opacity-60"
                  >
                    {isVerifyingPhoneOtp ? '...' : pickLang(lang, { en: 'Verify', hi: 'वेरीफाई करें' })}
                  </button>
                </div>
              </div>
            )}

            {verifyNotice && (
              <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-400/40 text-emerald-100 text-[11px] font-bold">
                {verifyNotice}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. CLEAN 2x2 PRIMARY SERVICE TILES */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenOrders}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <Package className="w-4.5 h-4.5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              {pickLang(lang, {
                en: 'My Orders & Bills',
                hi: 'मेरे ऑर्डर्स व बिल',
                mr: 'माझे ऑर्डर्स व बिल',
                hinglish: 'My Orders & Bills',
              })}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {pickLang(lang, { en: 'Receipts & status', hi: 'बिल व स्टेटस', mr: 'पावती व स्थिती', hinglish: 'Bills & status' })}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenTracking}
          className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              {pickLang(lang, {
                en: 'Track Delivery Van',
                hi: 'लाइव वैन ट्रैकिंग',
                mr: 'थेट व्हॅन ट्रॅक',
                hinglish: 'Live Van Track',
              })}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {pickLang(lang, { en: '6 AM Vashi Dispatch', hi: 'सुबह 6 AM डिस्पैच', mr: 'पहाटे ६ वा. डिस्पॅच', hinglish: '6 AM dispatch status' })}
            </div>
          </div>
        </button>

        {featureFlags.referralProgram && (
          <button
            type="button"
            onClick={() => setActiveSubSection('referral')}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Gift className="w-4.5 h-4.5" />
              </div>
              <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                ₹{user.walletBalance ?? 0}
              </span>
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Refer & Earn Cashback',
                  hi: 'रेफ़र व कैशबैक',
                  mr: 'रेफर व कॅशबॅक',
                  hinglish: 'Refer & Earn',
                })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {pickLang(lang, { en: 'Share & get ₹50', hi: 'शेयर कर ₹50 पाएँ', mr: 'शेअर करून ₹५०', hinglish: 'Share & earn ₹50' })}
              </div>
            </div>
          </button>
        )}

        {onOpenSavingsForecast && featureFlags.rateSavingsSuggestions && (
          <button
            type="button"
            onClick={onOpenSavingsForecast}
            className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 text-left transition flex flex-col justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5" />
              </div>
              <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                ₹{homeSavingsStats?.totalSavedRupees ?? 0}
              </span>
            </div>
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Savings Forecast',
                  hi: 'बचत अनुमान रिपोर्ट',
                  mr: 'बचत अंदाज',
                  hinglish: 'Savings Forecast',
                })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {pickLang(lang, { en: 'Daily & yearly savings', hi: 'रोज़ व सालाना बचत', mr: 'दैनिक व वार्षिक बचत', hinglish: 'Daily & yearly report' })}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Compact Live Route Strip (When Map Flag ON) */}
      {featureFlags.liveMapCorridor && (
        <button
          type="button"
          onClick={onOpenMap}
          className="w-full p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 flex items-center justify-between gap-3 text-left transition cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 flex items-center justify-center shrink-0">
              <MapPin className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                {pickLang(lang, {
                  en: 'Vashi APMC Live Delivery Map Route',
                  hi: 'वाशी APMC लाइव डिलीवरी रूट मैप',
                  mr: 'वाशी APMC थेट डिलिव्हरी मार्ग नकाशा',
                  hinglish: 'Vashi APMC Live Delivery Map',
                })}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {pickLang(lang, {
                  en: 'Cold-chain hub & society gate drop route',
                  hi: 'मंडी हब से सोसायटी गेट तक लाइव रास्ता',
                  hinglish: 'APMC se society gate tak live route',
                })}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      )}

      {/* MY ADMIN REWARDS & SURPRISE GIFTS (Delivered directly from Admin Top Buyers Console) */}
      {myRewards.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/70 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4.5 h-4.5 text-amber-600" />
              <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'My Special Admin Rewards & Surprise Gifts',
                  hi: 'आपके लिए खास एडमिन कूपन व सरप्राइज गिफ्ट',
                  hinglish: 'Aapke Special Discounts & Surprise Gifts',
                })}
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 tabular-nums">
              {myRewards.filter((r) => r.status === 'active').length} active
            </span>
          </div>
          <div className="space-y-2">
            {myRewards.slice(0, 4).map((rw) => (
              <div
                key={rw.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{rw.title}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px]">
                      {rw.couponCode}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">{rw.messageToCustomer}</div>
                  {rw.freeGiftItem && (
                    <div className="text-amber-700 dark:text-amber-300 font-bold">
                      🎁 Surprise Gift: {rw.freeGiftItem}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {rw.status === 'active' ? (
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                    >
                      {pickLang(lang, { en: 'Use in Cart', hi: 'कार्ट में लगाएँ', hinglish: 'Cart me Use Karein' })}
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                      Redeemed ✓
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. GAMIFIED LEADERBOARD & SAVER BADGE CARD (Consolidated Inside Account Center) */}
      {featureFlags.leaderboardAndBadges && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setActiveSubSection('leaderboard')}
            className="w-full p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 flex items-center justify-between gap-3 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <Trophy className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                  {pickLang(lang, {
                    en: 'Society Leaderboard & Savings Rank',
                    hi: 'सोसायटी लीडरबोर्ड व बचत रैंक',
                    mr: 'सोसायटी लीडरबोर्ड व बचत रँक',
                    hinglish: 'Society Leaderboard & Savings Rank',
                  })}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {pickLang(lang, {
                    en: 'See real verified society ranks, XP & seasonal badges',
                    hi: 'सत्यापित सोसायटी बचत रैंकिंग और बैज देखें',
                    hinglish: 'Verified society rankings & saving badges dekhein',
                  })}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>

          <GamifiedSavingsBadgeCard
            homeSavingsStats={homeSavingsStats}
            onOpenFullForecast={onOpenSavingsForecast}
          />
        </div>
      )}

      {/* ADMIN-ONLY STOREFRONT UI, FESTIVAL AI & LOCKED BRAND STUDIO (Inside Account Center) */}
      {isAdminAuthorized ? (
        <div className="bg-slate-950 text-white rounded-2xl border border-emerald-500/40 p-4 space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                <Palette className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Admin Global Storefront Control · Applies to ALL Customers</span>
                </div>
                <h3 className="font-black text-sm text-white truncate">
                  {pickLang(lang, {
                    en: 'UI Styles, Festival AI Studio & Locked Brand',
                    hi: 'स्टोर UI सैंपल, त्यौहार AI व ब्रांड कंट्रोल (केवल एडमिन)',
                    hinglish: 'Global UI Samples, Festival AI Studio & Brand',
                  })}
                </h3>
              </div>
            </div>
            {onLockAdmin && (
              <button
                type="button"
                onClick={onLockAdmin}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 self-start cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Lock Admin</span>
              </button>
            )}
          </div>

          {/* 4 Global Storefront UI Switches */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'classic', label: 'Classic Fresh' },
                { id: 'quick_mart', label: 'Quick-Mart' },
                { id: 'fresh_boutique', label: 'Fresh Boutique' },
                { id: 'hybrid_superapp', label: 'Hybrid SuperApp' },
              ] as { id: StoreUiSampleId; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setActiveUiSample(opt.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  activeUiSample === opt.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                {opt.label} {activeUiSample === opt.id ? '✓' : ''}
              </button>
            ))}
          </div>

          {festivalTheme?.active && (
            <div className="px-3 py-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-[11px] text-amber-200 font-bold">
              ✨ Active Global Festival Theme: {festivalTheme.name}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {onOpenSamplesGallery && (
              <button
                type="button"
                onClick={onOpenSamplesGallery}
                className="flex-1 min-w-[160px] py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, {
                    en: 'Open AI Festival & UI Studio',
                    hi: 'AI त्यौहार व लोगो स्टूडियो खोलें',
                    hinglish: 'AI Festival & UI Studio',
                  })}
                </span>
              </button>
            )}
            {onOpenBrandModal && (
              <button
                type="button"
                onClick={onOpenBrandModal}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {pickLang(lang, { en: 'Brand Settings', hi: 'ब्रांड सेटिंग्स', hinglish: 'Brand Edit' })}
                </span>
              </button>
            )}
            {onOpenAdminDesk && (
              <button
                type="button"
                onClick={onOpenAdminDesk}
                className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, { en: 'Full Admin Console', hi: 'पूर्ण एडमिन डेस्क', hinglish: 'Admin Desk' })}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : authService.isOwnerEmail(user.email) && isAdminLocked && onOpenAdminDesk ? (
        <button
          type="button"
          onClick={onOpenAdminDesk}
          className="w-full p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-700 hover:border-amber-400 flex items-center justify-between text-xs font-bold cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>
              {pickLang(lang, {
                en: 'Admin UI & Storefront Controls Locked (Tap to Unlock)',
                hi: 'एडमिन UI व ब्रांड कंट्रोल लॉक हैं (खोलने के लिए टैप करें)',
                hinglish: 'Admin UI Controls Locked (Unlock karne ke liye tap karein)',
              })}
            </span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      ) : null}

      {/* 4. APP UPDATES & RELEASE CHANGELOG */}
      <AppUpdatesSection />

      {/* 5. UNIFIED APP SETTINGS, MOBILE INSTALL & HELPDESK LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {/* Android APK & WebAPK Accordion */}
        {featureFlags.pwaInstallPrompt && (
          <div>
            <button
              type="button"
              onClick={() => setIsApkFolderOpen((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <FolderDown className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {pickLang(lang, {
                      en: 'Mobile App & Android APK Folder',
                      hi: 'मोबाइल ऐप व Android APK डाउनलोड',
                      mr: 'मोबाईल अ‍ॅप व Android APK फोल्डर',
                      hinglish: 'Mobile App & Android APK Folder',
                    })}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {pickLang(lang, {
                      en: 'Standalone WebAPK & TWA package for all Android devices',
                      hi: 'हर Android फ़ोन के लिए फुल-स्क्रीन ऐप व APK',
                      hinglish: 'Standalone WebAPK & Android bundle',
                    })}
                  </div>
                </div>
              </div>
              {isApkFolderOpen ? (
                <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {isApkFolderOpen && (
              <div className="px-4 pb-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs bg-slate-50/50 dark:bg-slate-900/40">
                {apkFiles.length > 0 && (
                  <div className="space-y-2">
                    {apkFiles.map((file) => (
                      <a
                        key={file.name}
                        href={file.url}
                        download={file.name}
                        className="w-full p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-between shadow-xs"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Download className="w-4 h-4 shrink-0" />
                          <span className="truncate">Download Android App ({file.name})</span>
                        </span>
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">
                          {(file.sizeKb / 1024).toFixed(1)} MB
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!isRunningStandalone ? (
                    <button
                      type="button"
                      onClick={() => onOpenInstall()}
                      className="flex-1 min-w-[190px] py-2.5 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>
                        {pickLang(lang, {
                          en: 'Install App & Allow Permissions (Mic, Camera, Alerts)',
                          hi: 'ऐप इंस्टॉल व परमिशन सेटअप (माइक, कैमरा, फोटो)',
                          mr: 'अ‍ॅप इन्स्टॉल व परवानग्या सेट करा',
                          hinglish: 'App Install & Permissions Setup (Mic/Camera)',
                        })}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-100 font-bold text-[11px] flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {pickLang(lang, {
                          en: 'Installed in Standalone App Mode',
                          hi: 'ऐप स्टैंडअलोन मोड में चालू है',
                          hinglish: 'Standalone Mode Active',
                        })}
                      </span>
                    </div>
                  )}

                  {hasUpdate && (
                    <button
                      type="button"
                      onClick={triggerUpdate}
                      className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>{pickLang(lang, { en: 'Update', hi: 'अपडेट', hinglish: 'Update' })}</span>
                    </button>
                  )}

                  {isInIframe && appUrl && (
                    <a
                      href={appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{pickLang(lang, { en: 'Open Chrome Tab', hi: 'Chrome में खोलें', hinglish: 'Open Chrome' })}</span>
                    </a>
                  )}
                </div>

                {/* Admin-Only Signed .APK Hosting Panel */}
                {isAdminAuthorized && (
                  <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-700 space-y-2">
                    <div className="text-[11px] font-bold text-amber-300">
                      Admin Android .APK Hosting (Customer Direct Download)
                    </div>
                    <p className="text-[10.5px] text-slate-300 leading-relaxed">
                      {pickLang(lang, {
                        en: 'Generate a real signed Android .apk in 1 minute on PWABuilder using your live URL, then upload that .apk here so every customer gets 1-tap APK download.',
                        hi: 'PWABuilder से अपनी लाइव वेबसाइट का असली signed .apk बनाएं और नीचे अपलोड करें — फिर हर ग्राहक को सीधे .apk डाउनलोड बटन मिलेगा।',
                        hinglish: 'PWABuilder se signed .apk generate karke yahan upload karein — har customer ko direct .apk milega.',
                      })}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        <span>{isUploadingApk ? 'Uploading .apk...' : 'Upload Signed .apk'}</span>
                        <input
                          type="file"
                          accept=".apk,application/vnd.android.package-archive"
                          onChange={handleAdminApkUpload}
                          disabled={isUploadingApk}
                          className="hidden"
                        />
                      </label>
                      {appUrl && (
                        <a
                          href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 font-bold text-[11px] inline-flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Build .APK on PWABuilder</span>
                        </a>
                      )}
                    </div>
                    {apkUploadNotice && (
                      <div className="text-[11px] font-semibold text-emerald-300">{apkUploadNotice}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Language Selector Row */}
        {featureFlags.languageSelector && (
          <div>
            <button
              type="button"
              onClick={() => setIsLangSliderOpen((prev) => !prev)}
              className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'App Language',
                      hi: 'ऐप की भाषा',
                      mr: 'अ‍ॅपची भाषा',
                      hinglish: 'App Language',
                    })}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                    {languages.find((l) => l.code === lang)?.label || 'हिन्दी'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isLangSliderOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangSliderOpen && (
              <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 overflow-x-auto snap-x scroll-smooth pb-1 no-scrollbar">
                  {languages.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLang(item.code);
                        setIsLangSliderOpen(false);
                      }}
                      className={`snap-start shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer ${
                        lang === item.code
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Interactive App Tour */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('tazamandi-start-onboarding-tour'))}
          className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Interactive App Tour',
                  hi: 'ऐप गाइड टूर चलाएँ',
                  mr: 'अ‍ॅप गाईड टूर पहा',
                  hinglish: 'App Guide Tour',
                })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {pickLang(lang, {
                  en: 'Walkthrough of Catalog, Voice Order & Account',
                  hi: 'कैटलॉग, बोलकर ऑर्डर व अकाउंट की जानकारी',
                  hinglish: 'Catalog, Voice Order & Account walkthrough',
                })}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {/* Support WhatsApp Helpdesk */}
        <a
          href="https://wa.me/918828822808"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MessageCircle className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {pickLang(lang, {
                  en: 'Mandi WhatsApp Helpdesk',
                  hi: 'मंडी WhatsApp सहायता केंद्र',
                  mr: 'मंडी WhatsApp मदत केंद्र',
                  hinglish: 'Mandi WhatsApp Helpdesk',
                })}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {pickLang(lang, {
                  en: 'Instant support 6:00 AM – 11:00 PM',
                  hi: 'सुबह 6:00 AM से रात 11:00 PM सहायता',
                  hinglish: 'Fast WhatsApp help 6 AM – 11 PM',
                })}
              </div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shrink-0">
            {pickLang(lang, { en: 'Chat', hi: 'चैट', mr: 'चॅट', hinglish: 'Chat' })}
          </span>
        </a>
      </div>

      {/* 6. PERSONAL ACTIVITY LOGGER (Collapsible View / Hide just like App Updates) + TERMS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div
          onClick={() => setIsActivityOpen((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsActivityOpen((prev) => !prev);
            }
          }}
          aria-expanded={isActivityOpen}
          className="w-full p-4 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {pickLang(lang, {
                  en: 'My Activity Logger',
                  hi: 'मेरी गतिविधि लॉग',
                  mr: 'माझी क्रियाकलाप नोंद',
                  hinglish: 'Meri Activity Log',
                })}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
                {myActivityLogs.length > 0
                  ? `${myActivityLogs.length} ${pickLang(lang, { en: 'recent actions recorded', hi: 'गतिविधियाँ दर्ज', hinglish: 'actions recorded' })}`
                  : pickLang(lang, {
                      en: 'Verified sign-ins and order actions',
                      hi: 'आपके लॉगिन व ऑर्डर रिकॉर्ड',
                      hinglish: 'Recent login & order actions',
                    })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{pickLang(lang, { en: 'Terms', hi: 'नियम', mr: 'नियम', hinglish: 'Terms' })}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsActivityOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
            >
              <span>
                {isActivityOpen
                  ? pickLang(lang, { en: 'Hide', hi: 'छुपाएँ', mr: 'लपवा', hinglish: 'Hide' })
                  : pickLang(lang, { en: 'View', hi: 'देखें', mr: 'पहा', hinglish: 'View' })}
              </span>
              {isActivityOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {isActivityOpen && (
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 pt-3 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {pickLang(lang, {
                  en: 'Recent Verified Activity History',
                  hi: 'आपकी हाल की गतिविधि',
                  hinglish: 'Recent Verified Activity',
                })}
              </span>
              <button
                type="button"
                onClick={fetchMyActivity}
                disabled={isLoadingLogs}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>{pickLang(lang, { en: 'Refresh', hi: 'ताज़ा', hinglish: 'Refresh' })}</span>
              </button>
            </div>

            {myActivityLogs.length === 0 ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                {pickLang(lang, {
                  en: 'No activity recorded for this account yet.',
                  hi: 'अभी इस खाते की कोई गतिविधि दर्ज नहीं हुई है।',
                  hinglish: 'Is account ki abhi koi activity record nahi hui hai.',
                })}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-52 overflow-y-auto">
                {myActivityLogs.map((log) => (
                  <div key={log.id} className="py-2 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {log.actionTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {log.eventType}
                        {log.details ? ` · ${log.details}` : ''}
                      </div>
                    </div>
                    <div className="font-mono text-[10.5px] text-slate-400 tabular-nums shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {user.isLoggedIn && (
        <button
          type="button"
          onClick={logout}
          className="w-full py-3 rounded-2xl bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-900/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{pickLang(lang, { en: 'Log Out', hi: 'लॉगआउट करें', mr: 'लॉगआउट करा', hinglish: 'Log Out' })}</span>
        </button>
      )}

      <TermsAndConditionsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};

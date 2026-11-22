import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SavedAddress } from '../types';
import { pickLang } from '../utils/i18nHelper';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Navigation,
  Check,
  ShieldCheck,
  Smartphone,
  Home,
  Briefcase,
  Users,
  Gift,
  Camera,
  ImagePlus,
} from 'lucide-react';
import { UserReferralDashboard } from './UserReferralDashboard';
import { locationService } from '../services/locationService';
import { compressAvatarFile } from '../utils/avatarHelper';

export const ProfileEditModal: React.FC = () => {
  const {
    user,
    updateUserProfile,
    addSavedAddress,
    updateSavedAddress,
    deleteSavedAddress,
    setActiveAddress,
    isProfileModalOpen,
    setIsProfileModalOpen,
    profileActiveTab,
    setProfileActiveTab,
    brand,
    lang,
  } = useApp();

  const activeTab = profileActiveTab;
  const setActiveTab = setProfileActiveTab;

  // Profile Form States
  const [profileName, setProfileName] = useState(user.name || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileSecondaryPhone, setProfileSecondaryPhone] = useState(user.secondaryPhone || '');
  const [profileEmail, setProfileEmail] = useState(user.email || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Address Form States (for adding or editing)
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const [addrLabel, setAddrLabel] = useState('घर (Home)');
  const [addrFlat, setAddrFlat] = useState('');
  const [addrWing, setAddrWing] = useState('');
  const [addrSociety, setAddrSociety] = useState('');
  const [addrRoad, setAddrRoad] = useState('');
  const [addrFull, setAddrFull] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isProfileModalOpen) return null;

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showNotification(
        pickLang(lang, {
          en: 'Please enter your full name.',
          hi: 'कृपया अपना पूरा नाम दर्ज करें।',
          mr: 'कृपया तुमचे पूर्ण नाव नोंदवा.',
          hinglish: 'Apna full name enter karein.',
        }),
        'error'
      );
      return;
    }
    if (!profilePhone.trim() || profilePhone.replace(/\D/g, '').length < 10) {
      showNotification(
        pickLang(lang, {
          en: 'Please enter a valid 10-digit mobile number.',
          hi: 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।',
          mr: 'कृपया १० अंकी वैध मोबाईल नंबर नोंदवा.',
          hinglish: '10-digit valid mobile number enter karein.',
        }),
        'error'
      );
      return;
    }

    updateUserProfile({
      name: profileName.trim(),
      phone: profilePhone.trim().startsWith('+91') ? profilePhone.trim() : `+91 ${profilePhone.trim().replace(/^91/, '')}`,
      secondaryPhone: profileSecondaryPhone.trim()
        ? (profileSecondaryPhone.trim().startsWith('+91') ? profileSecondaryPhone.trim() : `+91 ${profileSecondaryPhone.trim().replace(/^91/, '')}`)
        : '',
      email: profileEmail.trim(),
      avatarUrl: profileAvatarUrl,
    });

    showNotification(
      pickLang(lang, {
        en: '✓ Profile & contact numbers updated!',
        hi: '✓ प्रोफाइल व संपर्क नंबर सफलतापूर्वक अपडेट हो गए!',
        mr: '✓ प्रोफाइल व संपर्क नंबर यशस्वीरित्या अपडेट झाले!',
        hinglish: '✓ Profile aur contact numbers update ho gaye!',
      })
    );
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const resolved = await locationService.detectAndReverseGeocode();
      const societyVal = resolved.society || resolved.area || resolved.city;
      const roadVal = resolved.roadOrStreet || [resolved.area, resolved.city, resolved.pincode].filter(Boolean).join(', ');
      if (societyVal && !addrSociety.trim()) {
        setAddrSociety(societyVal);
      }
      if (roadVal && !addrRoad.trim()) {
        setAddrRoad(roadVal);
      }
      if (!addrFull.trim()) {
        setAddrFull(resolved.fullAddress);
      } else {
        setAddrFull(resolved.fullAddress);
      }
      showNotification(
        pickLang(lang, {
          en: `✓ Address resolved: ${resolved.society || resolved.city || 'GPS Locked'}`,
          hi: `✓ सटीक पता प्राप्त: ${resolved.society || resolved.city || 'GPS प्राप्त'}`,
          mr: `✓ अचूक पत्ता मिळाला: ${resolved.society || resolved.city || 'GPS'}`,
          hinglish: `✓ Location detect ho gayi: ${resolved.society || resolved.city || 'GPS'}`,
        })
      );
    } catch (err: any) {
      const code = err?.message;
      showNotification(
        code === 'GPS_UNSUPPORTED'
          ? pickLang(lang, {
              en: 'GPS location is not supported on your device.',
              hi: 'आपके डिवाइस पर जीपीएस लोकेशन समर्थित नहीं है।',
              mr: 'तुमच्या डिव्हाइसवर GPS लोकेशन उपलब्ध नाही.',
              hinglish: 'GPS location supported nahi hai.',
            })
          : pickLang(lang, {
              en: 'Location permission denied or unavailable. Please enter address manually.',
              hi: 'लोकेशन अनुमति नहीं मिली या सिग्नल उपलब्ध नहीं। कृपया मैन्युअल पता लिखें।',
              mr: 'लोकेशन परवानगी नाकारली. कृपया पत्ता लिहा.',
              hinglish: 'Location permission nahi mili. Manual address likhein.',
            }),
        'error'
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleStartEditAddress = (addr: SavedAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label);
    setAddrFlat(addr.flat);
    setAddrWing(addr.wing || '');
    setAddrSociety(addr.society);
    setAddrRoad(addr.roadOrStreet || '');
    setAddrFull(addr.fullAddress);
    setAddrIsDefault(Boolean(addr.isDefault));
    setIsAddingAddress(true);
  };

  const handleResetAddressForm = () => {
    setEditingAddressId(null);
    setAddrLabel(pickLang(lang, { en: 'Home', hi: 'घर (Home)', mr: 'घर (Home)', hinglish: 'Home' }));
    setAddrFlat('');
    setAddrWing('');
    setAddrSociety('');
    setAddrRoad('');
    setAddrFull('');
    setAddrIsDefault(false);
    setIsAddingAddress(false);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrSociety.trim() && !addrRoad.trim() && !addrFull.trim()) {
      showNotification(
        pickLang(lang, {
          en: 'Please enter a building/society name or address.',
          hi: 'कृपया बिल्डिंग/सोसायटी का नाम या पता दर्ज करें।',
          mr: 'कृपया इमारत/सोसायटीचे नाव किंवा पत्ता नोंदवा.',
          hinglish: 'Building/Society ka naam ya address enter karein.',
        }),
        'error'
      );
      return;
    }

    const cleanFlat = addrFlat.trim();
    const cleanWing = addrWing.trim();
    const cleanSociety = addrSociety.trim();
    const cleanRoad = addrRoad.trim();
    const constructedAddress = addrFull.trim() || [
      cleanFlat ? `Flat ${cleanFlat}${cleanWing ? ` (${cleanWing})` : ''}` : '',
      cleanSociety,
      cleanRoad,
    ].filter(Boolean).join(', ');

    if (editingAddressId) {
      updateSavedAddress(editingAddressId, {
        label: addrLabel,
        flat: cleanFlat,
        wing: cleanWing,
        society: cleanSociety,
        roadOrStreet: cleanRoad,
        fullAddress: constructedAddress,
        isDefault: addrIsDefault,
      });
      showNotification(
        pickLang(lang, {
          en: '✓ Address updated!',
          hi: '✓ पता सफलतापूर्वक अपडेट किया गया!',
          mr: '✓ पत्ता यशस्वीरित्या अपडेट झाला!',
          hinglish: '✓ Address update ho gaya!',
        })
      );
    } else {
      addSavedAddress({
        label: addrLabel,
        flat: cleanFlat,
        wing: cleanWing,
        society: cleanSociety,
        roadOrStreet: cleanRoad,
        fullAddress: constructedAddress,
        isDefault: addrIsDefault,
      });
      showNotification(
        pickLang(lang, {
          en: '✓ New delivery address saved!',
          hi: '✓ नया अतिरिक्त पता सफलतापूर्वक सहेजा गया!',
          mr: '✓ नवीन पत्ता यशस्वीरित्या जतन झाला!',
          hinglish: '✓ Naya address save ho gaya!',
        })
      );
    }

    handleResetAddressForm();
  };

  const savedAddressesList: SavedAddress[] = user.savedAddresses && user.savedAddresses.length > 0
    ? user.savedAddresses
    : [
        {
          id: 'addr-default',
          label: 'मुख्य पता (Home)',
          flat: user.flat || '402',
          wing: user.wing || '',
          society: user.society || brand.societyName,
          fullAddress: user.fullAddress || `${user.flat ? 'Flat ' + user.flat + ', ' : ''}${user.society || brand.societyName}`,
          isDefault: true,
        },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div>
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              {brand.brandName} · {pickLang(lang, { en: 'Customer Account Hub', hi: 'ग्राहक खाता प्रबंधन', mr: 'ग्राहक खाते व्यवस्थापन', hinglish: 'Customer Account Hub' })}
            </div>
            <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 dark:text-slate-100">
              {activeTab === 'referrals'
                ? pickLang(lang, { en: '🎁 Referral Link & Cashback Wallet', hi: '🎁 रेफ़रल लिंक व कैशबैक वॉलेट', mr: '🎁 रेफरल लिंक व कॅशबॅक वॉलेट', hinglish: '🎁 Referral Link & Cashback Wallet' })
                : activeTab === 'addresses'
                ? pickLang(lang, { en: '📍 Saved Delivery Addresses', hi: '📍 अतिरिक्त डिलीवरी पते', mr: '📍 डिलिव्हरी पत्ते', hinglish: '📍 Saved Delivery Addresses' })
                : pickLang(lang, { en: 'Account, Contact & Addresses', hi: 'खाता, संपर्क व अतिरिक्त पते', mr: 'खाते, संपर्क व पत्ते', hinglish: 'Account, Contact & Addresses' })}
            </h2>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 p-1 gap-1 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>{pickLang(lang, { en: 'Profile', hi: 'प्रोफाइल', mr: 'प्रोफाइल', hinglish: 'Profile' })}</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'addresses'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{pickLang(lang, { en: 'Addresses', hi: 'पते', mr: 'पत्ते', hinglish: 'Addresses' })} ({savedAddressesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'referrals'
                ? 'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-500" />
            <span>{pickLang(lang, { en: '🎁 Rewards & Cashback', hi: '🎁 रेफ़रल व कैशबैक', mr: '🎁 रेफरल व कॅशबॅक', hinglish: '🎁 Rewards & Cashback' })}</span>
            <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[10px] font-mono px-1 py-0.2 rounded font-black">
              ₹{user.walletBalance ?? 0}
            </span>
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {statusMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <X className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs space-y-4">
          
          {/* TAB 1: PROFILE EDIT */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{pickLang(lang, { en: 'Registered Customer Profile', hi: 'पंजीकृत ग्राहक विवरण', mr: 'नोंदणीकृत ग्राहक तपशील', hinglish: 'Customer Profile Details' })}</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  {pickLang(lang, {
                    en: 'Delivery partner will contact these numbers directly. You can also add an alternate phone number.',
                    hi: 'डिलीवरी पार्टनर सीधे इन नंबरों पर संपर्क करेगा। आप अपना अतिरिक्त (वैकल्पिक) नंबर भी जोड़ सकते हैं।',
                    mr: 'डिलिव्हरी पार्टनर या नंबरवर संपर्क करेल. तुम्ही पर्यायी नंबरही जोडू शकता.',
                    hinglish: 'Delivery partner in numbers par call karega. Aap alternate number bhi add kar sakte hain.',
                  })}
                </p>
              </div>

              {/* Customer DP Photo Picker (Gallery or Camera) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border-2 border-emerald-500/50 overflow-hidden flex items-center justify-center shrink-0">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt="Profile DP" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-emerald-700 dark:text-emerald-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {pickLang(lang, {
                      en: 'Profile Photo (DP)',
                      hi: 'आपकी प्रोफाइल फोटो (DP)',
                      mr: 'तुमचा प्रोफाइल फोटो (DP)',
                      hinglish: 'Apni Profile DP Lagayein',
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold inline-flex items-center gap-1 cursor-pointer">
                      <ImagePlus className="w-3.5 h-3.5" />
                      <span>{isUploadingAvatar ? '...' : pickLang(lang, { en: 'Gallery', hi: 'गैलरी से चुनें', mr: 'गॅलरी', hinglish: 'Gallery' })}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingAvatar(true);
                          try {
                            const compressed = await compressAvatarFile(file);
                            setProfileAvatarUrl(compressed);
                            updateUserProfile({ avatarUrl: compressed });
                            showNotification(pickLang(lang, { en: '✓ Profile DP updated!', hi: '✓ प्रोफाइल फोटो लग गई!', hinglish: '✓ DP update ho gayi!' }));
                          } catch {
                            showNotification('Could not process image', 'error');
                          } finally {
                            setIsUploadingAvatar(false);
                          }
                        }}
                      />
                    </label>
                    <label className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold inline-flex items-center gap-1 cursor-pointer">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{pickLang(lang, { en: 'Camera', hi: 'कैमरा', mr: 'कॅमेरा', hinglish: 'Camera' })}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingAvatar(true);
                          try {
                            const compressed = await compressAvatarFile(file);
                            setProfileAvatarUrl(compressed);
                            updateUserProfile({ avatarUrl: compressed });
                            showNotification(pickLang(lang, { en: '✓ Profile DP updated!', hi: '✓ प्रोफाइल फोटो लग गई!', hinglish: '✓ DP update ho gayi!' }));
                          } catch {
                            showNotification('Could not process camera photo', 'error');
                          } finally {
                            setIsUploadingAvatar(false);
                          }
                        }}
                      />
                    </label>
                    {profileAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileAvatarUrl('');
                          updateUserProfile({ avatarUrl: '' });
                        }}
                        className="px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold cursor-pointer"
                      >
                        {pickLang(lang, { en: 'Remove', hi: 'हटाएँ', hinglish: 'Remove' })}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {pickLang(lang, { en: 'Full Name *', hi: 'ग्राहक का पूरा नाम *', mr: 'पूर्ण नाव *', hinglish: 'Full Name *' })}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    placeholder={pickLang(lang, { en: 'e.g. Rahul Sharma', hi: 'उदा. राहुल शर्मा', mr: 'उदा. राहुल शर्मा', hinglish: 'e.g. Rahul Sharma' })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {pickLang(lang, { en: 'Primary Phone *', hi: 'मुख्य मोबाइल नंबर *', mr: 'मुख्य मोबाईल नंबर *', hinglish: 'Primary Phone *' })}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    required
                    placeholder="88288 22808"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'WhatsApp invoices & order updates are sent to this number.',
                    hi: 'WhatsApp बिल व आर्डर अपडेट इसी नंबर पर भेजे जाएंगे।',
                    mr: 'WhatsApp बिल व ऑर्डर अपडेट्स या नंबरवर पाठवले जातील.',
                    hinglish: 'WhatsApp bills aur updates isi number par bheje jayenge.',
                  })}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pickLang(lang, { en: 'Alternate / Extra Phone', hi: 'अतिरिक्त / वैकल्पिक मोबाइल नंबर', mr: 'पर्यायी मोबाईल नंबर', hinglish: 'Alternate Phone' })}</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded font-bold">
                    {pickLang(lang, { en: 'Optional', hi: 'वैकल्पिक', mr: 'पर्यायी', hinglish: 'Optional' })}
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={profileSecondaryPhone}
                    onChange={(e) => setProfileSecondaryPhone(e.target.value)}
                    placeholder={pickLang(lang, { en: 'Alternate or family mobile', hi: 'दूसरा नंबर / परिवार का मोबाइल', mr: 'पर्यायी नंबर', hinglish: 'Alternate mobile' })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {pickLang(lang, {
                    en: 'Used if the primary number is unreachable during delivery.',
                    hi: 'यदि मुख्य नंबर व्यस्त हो, तो डिलीवरी राइडर इस दूसरे नंबर पर कॉल कर सकेगा।',
                    mr: 'मुख्य नंबर उपलब्ध नसल्यास राइडर या नंबरवर कॉल करेल.',
                    hinglish: 'Primary busy hone par rider is alternate number par call karega.',
                  })}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {pickLang(lang, { en: 'Email Address', hi: 'ईमेल पता', mr: 'ईमेल पत्ता', hinglish: 'Email Address' })}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{pickLang(lang, { en: 'Save Profile Changes', hi: 'प्रोफाइल में बदलाव सहेजें', mr: 'प्रोफाइल बदल जतन करा', hinglish: 'Save Profile Changes' })}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: ADDRESS MANAGEMENT */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              {isAddingAddress ? (
                <form onSubmit={handleSaveAddress} className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>
                        {editingAddressId
                          ? pickLang(lang, { en: 'Edit Address', hi: 'पते में सुधार करें', mr: 'पत्ता संपादित करा', hinglish: 'Edit Address' })
                          : pickLang(lang, { en: 'Add New Address', hi: 'नया अतिरिक्त पता जोड़ें', mr: 'नवीन पत्ता जोडा', hinglish: 'Add New Address' })}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={handleResetAddressForm}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold"
                    >
                      ✕ {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
                    </button>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {pickLang(lang, { en: 'Select Address Label:', hi: 'पते का प्रकार / लेबल चुनें:', mr: 'पत्त्याचा प्रकार निवडा:', hinglish: 'Address Label Chunein:' })}
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: pickLang(lang, { en: 'Home', hi: 'घर (Home)', mr: 'घर (Home)', hinglish: 'Home' }), icon: Home },
                        { label: pickLang(lang, { en: 'Office', hi: 'ऑफिस (Office)', mr: 'ऑफिस (Office)', hinglish: 'Office' }), icon: Briefcase },
                        { label: pickLang(lang, { en: 'Parents', hi: 'माता-पिता (Parents)', mr: 'आई-वडील', hinglish: 'Parents' }), icon: Users },
                        { label: pickLang(lang, { en: 'Other', hi: 'अन्य फ्लैट (Other)', mr: 'इतर', hinglish: 'Other' }), icon: MapPin },
                      ].map((preset) => {
                        const Icon = preset.icon;
                        const isSelected = addrLabel === preset.label;
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setAddrLabel(preset.label)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-colors ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {pickLang(lang, { en: 'Flat / Room No.', hi: 'फ्लैट / कमरा नं.', mr: 'फ्लॅट क्र.', hinglish: 'Flat / Room No.' })}
                      </label>
                      <input
                        type="text"
                        value={addrFlat}
                        onChange={(e) => setAddrFlat(e.target.value)}
                        placeholder="e.g. 402 / A-104"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {pickLang(lang, { en: 'Wing / Tower (Optional)', hi: 'विंग / टावर (वैकल्पिक)', mr: 'विंग / टॉवर (पर्यायी)', hinglish: 'Wing / Tower' })}
                      </label>
                      <input
                        type="text"
                        value={addrWing}
                        onChange={(e) => setAddrWing(e.target.value)}
                        placeholder="Tower B"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        {pickLang(lang, { en: 'Building / Society Name *', hi: 'बिल्डिंग / सोसायटी का नाम *', mr: 'इमारत / सोसायटीचे नाव *', hinglish: 'Building / Society Name *' })}
                      </label>
                      {addrSociety && (
                        <button
                          type="button"
                          onClick={() => setAddrSociety('')}
                          className="text-[10px] text-rose-600 hover:underline"
                        >
                          ✕ {pickLang(lang, { en: 'Clear', hi: 'साफ़ करें', mr: 'साफ करा', hinglish: 'Clear' })}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={addrSociety}
                      onChange={(e) => setAddrSociety(e.target.value)}
                      placeholder={pickLang(lang, { en: 'e.g. Shiv Residency', hi: 'उदा. शिव रेजीडेंसी', mr: 'उदा. शिव रेसिडेन्सी', hinglish: 'e.g. Shiv Residency' })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {pickLang(lang, { en: 'Road / Street / Landmark', hi: 'सड़क, लेन या लैंडमार्क', mr: 'रस्ता / मुख्य खूण', hinglish: 'Road / Landmark' })}
                    </label>
                    <input
                      type="text"
                      value={addrRoad}
                      onChange={(e) => setAddrRoad(e.target.value)}
                      placeholder={pickLang(lang, { en: 'e.g. Station Road, Near Temple', hi: 'उदा. स्टेशन रोड, मंदिर के पास', mr: 'उदा. स्टेशन रोड', hinglish: 'e.g. Station Road' })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        {pickLang(lang, { en: 'Full Detailed Address', hi: 'सटीक संपूर्ण पता', mr: 'संपूर्ण पत्ता', hinglish: 'Full Detailed Address' })}
                      </label>
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        disabled={isDetectingLocation}
                        className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <Navigation className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                        <span>
                          {isDetectingLocation
                            ? pickLang(lang, { en: 'Locating...', hi: 'खोज रहे हैं...', mr: 'शोधत आहे...', hinglish: 'Locating...' })
                            : pickLang(lang, { en: '📍 Use GPS', hi: '📍 GPS से लें', mr: '📍 GPS मधून घ्या', hinglish: '📍 Use GPS' })}
                        </span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={addrFull}
                      onChange={(e) => setAddrFull(e.target.value)}
                      placeholder={pickLang(lang, { en: 'Flat, wing, building, road & pincode...', hi: 'फ्लैट, विंग, बिल्डिंग, रोड व पिनकोड...', mr: 'फ्लॅट, विंग, इमारत व पिनकोड...', hinglish: 'Full address details...' })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={addrIsDefault}
                      onChange={(e) => setAddrIsDefault(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {pickLang(lang, { en: 'Set as Default Delivery Address', hi: 'इसे मुख्य/डिफ़ॉल्ट डिलीवरी पता बनाएं', mr: 'मुख्य डिलिव्हरी पत्ता म्हणून निवडा', hinglish: 'Default Address Banayein' })}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleResetAddressForm}
                      className="flex-1 py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {pickLang(lang, { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा', hinglish: 'Cancel' })}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>
                        {editingAddressId
                          ? pickLang(lang, { en: 'Update', hi: 'अपडेट करें', mr: 'अपडेट करा', hinglish: 'Update' })
                          : pickLang(lang, { en: 'Save Address', hi: 'पता सहेजें', mr: 'पत्ता जतन करा', hinglish: 'Save Address' })}
                      </span>
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(true)}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{pickLang(lang, { en: '+ Add Another Delivery Address', hi: '+ नया अतिरिक्त पता जोड़ें', mr: '+ नवीन डिलिव्हरी पत्ता जोडा', hinglish: '+ Naya Delivery Address Jodein' })}</span>
                </button>
              )}

              {/* Saved Addresses List */}
              <div className="space-y-2.5 pt-2">
                <div className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  {pickLang(lang, { en: 'Saved Addresses', hi: 'सहेजे गए पते', mr: 'जतन केलेले पत्ते', hinglish: 'Saved Addresses' })} ({savedAddressesList.length}):
                </div>

                {savedAddressesList.map((addr) => {
                  const isActive = user.activeAddressId === addr.id || (!user.activeAddressId && addr.isDefault);
                  return (
                    <div
                      key={addr.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                                {pickLang(lang, { en: 'Default', hi: 'डिफ़ॉल्ट पता', mr: 'डिफॉल्ट पत्ता', hinglish: 'Default' })}
                              </span>
                            )}
                            {isActive && (
                              <span className="bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded shadow-2xs flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                <span>{pickLang(lang, { en: 'Active Delivery', hi: 'सक्रिय डिलीवरी पता', mr: 'सक्रिय पत्ता', hinglish: 'Active Delivery' })}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            📍 {addr.fullAddress || `${addr.flat ? 'Flat ' + addr.flat + ', ' : ''}${addr.society}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditAddress(addr)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={pickLang(lang, { en: 'Edit', hi: 'एडिट करें', mr: 'बदला', hinglish: 'Edit' })}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {savedAddressesList.length > 1 && (
                            confirmDeleteId === addr.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg px-1.5 py-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    deleteSavedAddress(addr.id);
                                    setConfirmDeleteId(null);
                                    showNotification(
                                      pickLang(lang, {
                                        en: 'Address removed.',
                                        hi: 'पता हटा दिया गया।',
                                        mr: 'पत्ता काढून टाकला.',
                                        hinglish: 'Address hata diya gaya.',
                                      })
                                    );
                                  }}
                                  className="text-[10px] font-bold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
                                >
                                  {pickLang(lang, { en: 'Confirm', hi: 'हटाएं', mr: 'काढा', hinglish: 'Confirm' })}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="text-[10px] font-semibold text-slate-500 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(addr.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title={pickLang(lang, { en: 'Delete', hi: 'हटाएं', mr: 'काढा', hinglish: 'Delete' })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>

                      {!isActive && (
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAddress(addr.id);
                              showNotification(
                                pickLang(lang, {
                                  en: `✓ '${addr.label}' set as active delivery address.`,
                                  hi: `✓ '${addr.label}' को सक्रिय डिलीवरी पता चुना गया।`,
                                  mr: `✓ '${addr.label}' सक्रिय पत्ता म्हणून निवडला.`,
                                  hinglish: `✓ '${addr.label}' active delivery address set.`,
                                })
                              );
                            }}
                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>{pickLang(lang, { en: 'Deliver Here', hi: 'इस पते पर डिलीवरी मंगवाएं', mr: 'येथे डिलिव्हरी घ्या', hinglish: 'Deliver Here' })}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <UserReferralDashboard
              onClose={() => setIsProfileModalOpen(false)}
            />
          )}
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg font-bold text-xs"
          >
            {pickLang(lang, { en: 'Done', hi: 'बंद करें', mr: 'बंद करा', hinglish: 'Done' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditModal;

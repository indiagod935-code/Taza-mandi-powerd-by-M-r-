import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { pickLang } from '../utils/i18nHelper';
import {
  X,
  Lock,
  Phone,
  User,
  Building,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Smartphone,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  MapPin,
  Navigation,
} from 'lucide-react';

import { TermsAndConditionsModal } from './TermsAndConditionsModal';
import { LanguageSelector } from './LanguageSelector';
import { logUserActivity } from '../utils/activityLogger';
import { signInWithGooglePopup, syncFirebaseUserProfile } from '../firebase';
import { locationService } from '../services/locationService';

interface AuthModalProps {
  isRequiredGate?: boolean;
  inlineMode?: boolean;
  initialMode?: 'login' | 'register' | 'otp';
  onOpenFullTerms?: () => void;
  onSocialGoogleClick?: () => void;
  socialSetupPending?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isRequiredGate = false,
  inlineMode = false,
  initialMode = 'login',
  onOpenFullTerms,
  onSocialGoogleClick,
  socialSetupPending = false,
}) => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithCredentials,
    brand,
    lang,
    setLang,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'otp' | 'connect_gmail'>(initialMode);
  const [localTermsModalOpen, setLocalTermsModalOpen] = useState(false);
  const [localLegalTab, setLocalLegalTab] = useState<'terms' | 'privacy'>('terms');

  // Customer Credentials - Starts clean for genuine registered user input
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginConfirmPassword, setLoginConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Fields - Exact User Flow Order
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtpPreview, setSignupOtpPreview] = useState('');
  const [signupEnteredOtp, setSignupEnteredOtp] = useState('');
  const [signupPhoneVerified, setSignupPhoneVerified] = useState(false);
  const [isSendingSignupOtp, setIsSendingSignupOtp] = useState(false);
  const [isVerifyingSignupOtp, setIsVerifyingSignupOtp] = useState(false);
  const [regSecondaryPhone, setRegSecondaryPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [regFlat, setRegFlat] = useState('');
  const [regBuilding, setRegBuilding] = useState('');
  const [regRoad, setRegRoad] = useState('');
  const [regFullAddress, setRegFullAddress] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password Fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotEnteredOtp, setForgotEnteredOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmNewPassword, setForgotConfirmNewPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Quick OTP State
  const [otpPhone, setOtpPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [userEnteredOtp, setUserEnteredOtp] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(30);

  // Mandatory Privacy Policy & Terms Consent (Customer Responsibility)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPolicyDetails, setShowPolicyDetails] = useState(false);

  // Status & Validation
  const [authError, setAuthError] = useState('');
  const [suggestSignUp, setSuggestSignUp] = useState(false);
  const [authSuccess, setAuthSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [verifiedGoogleUid, setVerifiedGoogleUid] = useState<string | null>(null);
  const [pendingGmailUser, setPendingGmailUser] = useState<any | null>(null);

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((otpSent || forgotOtpSent) && otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, forgotOtpSent, otpCountdown]);

  if (!inlineMode && !isAuthModalOpen) return null;

  const hydrateVerifiedUser = (serverUser: any) => {
    loginWithCredentials({
      id: serverUser.id,
      name: serverUser.name,
      phone: serverUser.phone,
      secondaryPhone: serverUser.secondaryPhone || '',
      email: serverUser.email || '',
      flat: serverUser.flat || 'Doorstep',
      wing: serverUser.wing || '',
      society: serverUser.society || '',
      roadOrStreet: serverUser.roadOrStreet || '',
      fullAddress: serverUser.fullAddress || '',
      savedAddresses: serverUser.savedAddresses,
      activeAddressId: serverUser.activeAddressId,
      avatarUrl: serverUser.avatarUrl || '',
      phoneVerified: Boolean(serverUser.phoneVerified),
      emailVerified: Boolean(serverUser.emailVerified),
      verifiedGoogleEmail: serverUser.verifiedGoogleEmail,
    });
    setPendingGmailUser(null);
    setIsAuthModalOpen(false);
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setAuthError('');
    setSuggestSignUp(false);
    try {
      const resolved = await locationService.detectAndReverseGeocode();
      const candidateBuilding = resolved.society || resolved.area || resolved.city || '';
      const candidateRoad = resolved.roadOrStreet || resolved.area || '';
      if (candidateBuilding && !regBuilding.trim()) {
        setRegBuilding(candidateBuilding);
      }
      if (candidateRoad && !regRoad.trim()) {
        setRegRoad(candidateRoad);
      }
      if (resolved.fullAddress && !regFullAddress.trim()) {
        setRegFullAddress(resolved.fullAddress);
      }
      setAuthSuccess(
        pickLang(lang, {
          en: `GPS Locked & Blank Fields Filled: ${resolved.society || resolved.area || resolved.city || 'Exact Location'}`,
          hi: `सटीक GPS लोकेशन मिल गई (खाली बॉक्स भर दिए गए): ${resolved.society || resolved.area || resolved.city || 'GPS प्राप्त'}`,
          mr: `अचूक GPS लोकेशन मिळाले: ${resolved.society || resolved.city || 'GPS'}`,
          hinglish: `GPS detect ho gaya (khali fields bhar di gayi): ${resolved.society || resolved.area || resolved.city || 'GPS Locked'}`,
        })
      );
      setTimeout(() => setAuthSuccess(''), 3500);
    } catch (err: any) {
      const code = err?.message;
      if (code === 'GPS_UNSUPPORTED') {
        setAuthError(
          pickLang(lang, {
            en: 'GPS location is not supported on this device. Please type your address manually.',
            hi: 'आपके डिवाइस पर जीपीएस लोकेशन समर्थित नहीं है। कृपया मैन्युअल पता टाइप करें।',
            mr: 'तुमच्या डिव्हाइसवर GPS लोकेशन उपलब्ध नाही. कृपया पत्ता टाइप करा.',
            hinglish: 'GPS supported nahi hai. Manual address likhein.',
          })
        );
      } else if (code === 'PERMISSION_DENIED') {
        setAuthError(
          pickLang(lang, {
            en: 'Location permission denied. Enable browser location permission or enter your address below.',
            hi: 'लोकेशन अनुमति नहीं मिली। ब्राउज़र में लोकेशन चालू करें या नीचे मैन्युअल पता लिखें।',
            mr: 'लोकेशन परवानगी नाकारली. कृपया खाली पत्ता लिहा.',
            hinglish: 'Location permission denied. Browser GPS allow karein ya niche address likhein.',
          })
        );
      } else {
        setAuthError(
          pickLang(lang, {
            en: 'Could not lock GPS signal right now. Please enter your building & street below.',
            hi: 'अभी GPS सिग्नल नहीं मिल पाया। कृपया नीचे अपनी बिल्डिंग व सड़क का नाम लिखें।',
            mr: 'सध्या GPS सिग्नल मिळू शकला नाही. कृपया खाली पत्ता लिहा.',
            hinglish: 'Abhi GPS signal nahi mila. Niche building aur street details bhar dein.',
          })
        );
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const requireTermsConsent = () => {
    if (acceptedTerms) return true;
    setAuthError(
      pickLang(lang, {
        en: 'Please accept the Privacy Policy & Terms & Conditions checkbox to continue.',
        hi: 'खाता चालू करने के लिए कृपया नीचे दी गई Privacy Policy और नियम व शर्तें (Terms & Conditions) स्वीकार करें।',
        mr: 'खाते सुरू करण्यासाठी कृपया खालील Privacy Policy व अटी व शर्ती स्वीकारा.',
        hinglish: 'Account chalu karne ke liye pehle Privacy Policy aur Terms accept karein.',
      })
    );
    return false;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuggestSignUp(false);
    if (!requireTermsConsent()) return;
    if (!loginIdentifier.trim()) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter your registered Mobile No. or Gmail.',
          hi: 'कृपया अपना पंजीकृत मोबाइल No. या Gmail दर्ज करें।',
          mr: 'कृपया तुमचा नोंदणीकृत मोबाईल No. किंवा Gmail नोंदवा.',
          hinglish: 'Apna registered Mobile No. ya Gmail enter karein.',
        })
      );
      return;
    }
    if (!loginPassword.trim()) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter your password.',
          hi: 'कृपया अपना पासवर्ड दर्ज करें।',
          mr: 'कृपया तुमचा पासवर्ड नोंदवा.',
          hinglish: 'Password enter karein.',
        })
      );
      return;
    }
    if (loginPassword !== loginConfirmPassword) {
      setAuthError(
        pickLang(lang, {
          en: 'Both Password and Confirm Password entries must match!',
          hi: 'दोनों पासवर्ड एक जैसे होने चाहिए! कृपया दोनों बॉक्स में एक ही पासवर्ड लिखें।',
          mr: 'दोन्ही पासवर्ड जुळणे आवश्यक आहे!',
          hinglish: 'Dono Password aur Confirm Password bilkul same hone chahiye!',
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'password',
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        if (res.status === 404) {
          setSuggestSignUp(true);
          setAuthError(
            pickLang(lang, {
              en: 'Account not registered yet! Only users who create an account via Sign Up can sign in.',
              hi: 'यह नंबर या ईमेल पंजीकृत नहीं है! प्लेटफॉर्म उपयोग करने के लिए पहले "खाता बनाएं (Sign Up)" प्रक्रिया पूरी करें।',
              mr: 'हा नंबर नोंदणीकृत नाही! वापरण्यासाठी आधी नवीन खाते तयार करा.',
              hinglish: 'Yeh number registered nahi hai! Pehle Sign Up (Create Account) karein.',
            })
          );
        } else {
          setAuthError(
            data?.error ||
              pickLang(lang, {
                en: 'Incorrect password! Please check again or tap "Forgot password?".',
                hi: 'गलत पासवर्ड! कृपया सही पासवर्ड दर्ज करें या "पासवर्ड भूल गए?" दबाएं।',
                mr: 'चुकीचा पासवर्ड! कृपया पुन्हा तपासा.',
                hinglish: 'Galat password! Sahi password dalein ya Forgot karein.',
              })
          );
        }
        return;
      }
      hydrateVerifiedUser(data.user);
    } catch {
      setAuthError(
        pickLang(lang, {
          en: 'Unable to verify credentials right now. Please try again.',
          hi: 'अभी सर्वर से सत्यापन नहीं हो सका। कृपया पुनः प्रयास करें।',
          hinglish: 'Verify nahi ho saka. Dobara try karein.',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendSignupOtp = async (): Promise<boolean> => {
    setAuthError('');
    const digits = regPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setAuthError(
        pickLang(lang, {
          en: 'Enter a valid 10-digit mobile number first to receive OTP.',
          hi: 'OTP पाने के लिए पहले 10 अंकों का सही मोबाइल नंबर लिखें।',
          hinglish: 'OTP ke liye pehle 10-digit mobile number daalein.',
        })
      );
      return false;
    }
    setIsSendingSignupOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits.slice(-10), purpose: 'register' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.otpPreview) {
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Could not send verification OTP.',
              hi: 'सत्यापन OTP नहीं भेजा जा सका।',
            })
        );
        return false;
      }
      setSignupOtpPreview(String(data.otpPreview));
      setSignupOtpSent(true);
      setSignupPhoneVerified(false);
      return true;
    } catch {
      setAuthError(
        pickLang(lang, {
          en: 'Network error while sending OTP.',
          hi: 'OTP भेजते समय नेटवर्क त्रुटि हुई।',
        })
      );
      return false;
    } finally {
      setIsSendingSignupOtp(false);
    }
  };

  const handleVerifySignupOtp = async () => {
    setAuthError('');
    if (!signupEnteredOtp.trim() || signupEnteredOtp.trim().length < 4) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter the 4-digit OTP code.',
          hi: 'कृपया 4-अंकों का OTP कोड दर्ज करें।',
        })
      );
      return;
    }
    setIsVerifyingSignupOtp(true);
    try {
      const res = await fetch('/api/auth/verify-signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone.replace(/\D/g, '').slice(-10),
          otp: signupEnteredOtp.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Incorrect OTP. Please try again.',
              hi: 'गलत OTP! कृपया सही कोड डालें।',
            })
        );
        return;
      }
      setSignupPhoneVerified(true);
      setSignupOtpSent(false);
      setAuthSuccess(
        pickLang(lang, {
          en: '✓ Mobile number verified via OTP!',
          hi: '✓ मोबाइल नंबर OTP द्वारा सत्यापित हो गया!',
          hinglish: '✓ Mobile number OTP se verify ho gaya!',
        })
      );
    } catch {
      setAuthError('Failed to verify OTP.');
    } finally {
      setIsVerifyingSignupOtp(false);
    }
  };

  const handleConnectPendingGmail = async () => {
    if (!pendingGmailUser) return;
    setAuthError('');
    setIsGooglePending(true);
    try {
      const googleUser = await signInWithGooglePopup(pendingGmailUser.email || regEmail);
      const res = await fetch('/api/auth/link-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: pendingGmailUser.id,
          uid: googleUser.uid,
          email: googleUser.email,
          emailVerified: googleUser.emailVerified,
          name: googleUser.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Could not verify Gmail on this account.',
              hi: 'यह Gmail इस खाते से कनेक्ट नहीं हो सका।',
            })
        );
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
      hydrateVerifiedUser(data.user);
    } catch (err: any) {
      setAuthError(
        err?.code === 'auth/popup-closed-by-user'
          ? pickLang(lang, {
              en: 'Google popup was closed. Tap "Connect & Verify Gmail" again.',
              hi: 'Google विंडो बंद हो गई। कृपया फिर से "Gmail कनेक्ट व वेरीफाई करें" दबाएं।',
            })
          : pickLang(lang, {
              en: 'Google connection failed. Allow popups or tap "Verify later in Account".',
              hi: 'Gmail कनेक्शन नहीं हो सका। पॉपअप अनुमति दें या नीचे से बाद में वेरीफाई चुनें।',
            })
      );
    } finally {
      setIsGooglePending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuggestSignUp(false);
    if (!requireTermsConsent()) return;
    if (!regName.trim()) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter your full name.',
          hi: 'कृपया अपना पूरा नाम दर्ज करें।',
          mr: 'कृपया तुमचे पूर्ण नाव नोंदवा.',
          hinglish: 'Apna full name enter karein.',
        })
      );
      return;
    }
    if (!regPhone.trim() || regPhone.replace(/\D/g, '').length < 10) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter a valid 10-digit mobile number.',
          hi: 'कृपया वैध 10 अंकों का मोबाइल नंबर दर्ज करें।',
          mr: 'कृपया वैध १० अंकी मोबाईल नंबर नोंदवा.',
          hinglish: 'Valid 10-digit mobile number enter karein.',
        })
      );
      return;
    }
    if (!signupPhoneVerified) {
      if (!signupOtpSent) {
        await handleSendSignupOtp();
      }
      setAuthError(
        pickLang(lang, {
          en: 'Please verify your mobile number using the 4-digit OTP above before creating your account.',
          hi: 'अकाउंट बनाने से पहले कृपया ऊपर आए 4-अंकों के OTP से अपना मोबाइल नंबर वेरीफाई करें।',
          hinglish: 'Account banane se pehle upar diye OTP se mobile number verify karein.',
        })
      );
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter the Gmail ID you want to connect & verify.',
          hi: 'कृपया वह Gmail ID दर्ज करें जिससे आप अपना खाता कनेक्ट करना चाहते हैं।',
          hinglish: 'Apni Gmail ID daalein jisse account connect karna hai.',
        })
      );
      return;
    }
    if (!regBuilding.trim() && !regRoad.trim() && !regFullAddress.trim()) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter your building/street or tap Use GPS to auto-fill.',
          hi: 'कृपया अपनी बिल्डिंग/सड़क लिखें या GPS से खाली स्थान भरें।',
          mr: 'कृपया इमारत, रस्ता किंवा पत्ता नोंदवा.',
          hinglish: 'Building, street ya GPS location enter karein.',
        })
      );
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setAuthError(
        pickLang(lang, {
          en: 'Password must be at least 4 characters.',
          hi: 'पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।',
          mr: 'पासवर्ड किमान ४ अक्षरांचा असावा.',
          hinglish: 'Password kam se kam 4 letters ka hona chahiye.',
        })
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setAuthError(
        pickLang(lang, {
          en: 'Password and Confirm Password do not match!',
          hi: 'पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खाते!',
          mr: 'पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत!',
          hinglish: 'Password aur Confirm Password match nahi kar rahe!',
        })
      );
      return;
    }

    const cleanBuilding = regBuilding.trim();
    const cleanRoad = regRoad.trim();
    const cleanFlat = regFlat.trim() || 'Doorstep';
    const cleanAddress =
      regFullAddress.trim() ||
      [cleanFlat ? `Flat ${cleanFlat}` : '', cleanBuilding, cleanRoad].filter(Boolean).join(', ');

    setIsSubmitting(true);
    try {
      const phoneFormatted = regPhone.startsWith('+91') ? regPhone : `+91 ${regPhone}`;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          phone: phoneFormatted,
          secondaryPhone: regSecondaryPhone.trim()
            ? regSecondaryPhone.startsWith('+91')
              ? regSecondaryPhone
              : `+91 ${regSecondaryPhone}`
            : '',
          email: regEmail.trim(),
          flat: cleanFlat,
          wing: '',
          society: cleanBuilding || cleanRoad || cleanAddress,
          roadOrStreet: cleanRoad,
          fullAddress: cleanAddress,
          password: regPassword,
          phoneVerified: signupPhoneVerified,
          emailVerified: Boolean(verifiedGoogleUid),
          googleUid: verifiedGoogleUid || undefined,
          verifiedGoogleEmail: verifiedGoogleUid ? regEmail.trim().toLowerCase() : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Could not create account. Please check details.',
              hi: 'खाता नहीं बन सका। कृपया विवरण जांचें या यदि पहले से खाता है तो Sign In करें।',
            })
        );
        return;
      }
      if (verifiedGoogleUid) {
        void syncFirebaseUserProfile({
          uid: verifiedGoogleUid,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          flat: data.user.flat,
          society: data.user.society,
          fullAddress: data.user.fullAddress,
          loginProvider: 'google',
        }).catch(() => {});
        hydrateVerifiedUser(data.user);
        return;
      }
      // Step 2: Account created! Now let customer connect & verify their Gmail on this device
      setPendingGmailUser(data.user);
      setAuthError('');
      setAuthSuccess(
        pickLang(lang, {
          en: 'Account & mobile verified! Connect your Gmail below to complete email verification.',
          hi: 'खाता बन गया और मोबाइल सत्यापित हो गया! अब अपना Gmail यहीं से कनेक्ट व वेरीफाई करें।',
          hinglish: 'Account ban gaya! Ab neeche Connect & Verify Gmail par click karein.',
        })
      );
      setMode('connect_gmail');
    } catch {
      setAuthError(
        pickLang(lang, {
          en: 'Network error while creating account. Please try again.',
          hi: 'नेटवर्क त्रुटि! कृपया दोबारा प्रयास करें।',
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuggestSignUp(false);
    if (!forgotPhone || forgotPhone.replace(/\D/g, '').length < 10) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter your registered 10-digit mobile number.',
          hi: 'कृपया अपना पंजीकृत 10 अंकों का मोबाइल नंबर दर्ज करें।',
          mr: 'कृपया तुमचा नोंदणीकृत १० अंकी मोबाईल नंबर नोंदवा.',
          hinglish: 'Registered 10-digit mobile number enter karein.',
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, purpose: 'forgot' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.otpPreview) {
        if (res.status === 404) setSuggestSignUp(true);
        setAuthError(
          res.status === 404
            ? pickLang(lang, {
                en: 'Mobile number is not registered. Please Sign Up / Create Account first.',
                hi: 'यह मोबाइल नंबर पंजीकृत नहीं है! पासवर्ड रीसेट से पहले नया खाता बनाएं (Sign Up)।',
                hinglish: 'Yeh number registered nahi hai! Pehle Sign Up karein.',
              })
            : data?.error || 'Failed to send verification OTP.'
        );
        return;
      }
      setForgotGeneratedOtp(String(data.otpPreview));
      setForgotOtpSent(true);
      setOtpCountdown(30);
    } catch {
      setAuthError('Unable to send OTP right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuggestSignUp(false);
    if (!requireTermsConsent()) return;
    if (!forgotEnteredOtp.trim() || forgotEnteredOtp.trim().length < 4) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter the exact 4-digit OTP.',
          hi: 'कृपया सटीक 4-अंकों का OTP कोड दर्ज करें।',
        })
      );
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      setAuthError(
        pickLang(lang, {
          en: 'New password must be at least 4 characters.',
          hi: 'नया पासवर्ड कम से कम 4 अक्षरों का होना चाहिए।',
          mr: 'नवीन पासवर्ड किमान ४ अक्षरांचा असावा.',
          hinglish: 'Naya password kam se kam 4 letters ka hona chahiye.',
        })
      );
      return;
    }
    if (forgotNewPassword !== forgotConfirmNewPassword) {
      setAuthError(
        pickLang(lang, {
          en: 'New Password and Confirm New Password must match!',
          hi: 'नया पासवर्ड और कन्फर्म पासवर्ड दोनों एक जैसे होने चाहिए!',
          hinglish: 'Naya password aur Confirm password match nahi hue!',
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: forgotPhone,
          otp: forgotEnteredOtp.trim(),
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Incorrect OTP or unregistered account.',
              hi: 'गलत OTP कोड! कृपया स्क्रीन पर आया सटीक OTP दर्ज करें।',
            })
        );
        return;
      }
      setAuthSuccess(
        pickLang(lang, {
          en: 'Password updated! Signing you in...',
          hi: 'पासवर्ड सफलतापूर्वक बदल दिया गया! लॉगिन हो रहा है...',
          hinglish: 'Password update ho gaya! Sign in ho raha hai...',
        })
      );
      setTimeout(() => {
        hydrateVerifiedUser(data.user);
      }, 600);
    } catch {
      setAuthError('Password reset failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickOtpSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setSuggestSignUp(false);
    if (!otpPhone || otpPhone.replace(/\D/g, '').length < 10) {
      setAuthError(
        pickLang(lang, {
          en: 'Please enter a valid 10-digit registered mobile number.',
          hi: 'कृपया अपना पंजीकृत 10 अंकों का मोबाइल नंबर दर्ज करें।',
          mr: 'कृपया वैध १० अंकी मोबाईल नंबर नोंदवा.',
          hinglish: 'Apna registered 10-digit mobile number enter karein.',
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, purpose: 'login' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.otpPreview) {
        if (res.status === 404) setSuggestSignUp(true);
        setAuthError(
          res.status === 404
            ? pickLang(lang, {
                en: 'Number not registered! Only users with a created account can get an OTP.',
                hi: 'यह मोबाइल नंबर पंजीकृत नहीं है! OTP सिर्फ़ "खाता बनाएं (Sign Up)" करने के बाद ही काम करेगा।',
                hinglish: 'Yeh number registered nahi hai! Pehle Create Account (Sign Up) karein.',
              })
            : data?.error || 'Could not send OTP.'
        );
        return;
      }
      setSimulatedOtp(String(data.otpPreview));
      setOtpSent(true);
      setOtpCountdown(30);
    } catch {
      setAuthError('Network error while sending OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSuggestSignUp(false);
    if (!requireTermsConsent()) return;
    if (!userEnteredOtp.trim()) {
      setAuthError('Please enter the verification OTP.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'otp',
          phone: otpPhone,
          otp: userEnteredOtp.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.user) {
        if (res.status === 404) setSuggestSignUp(true);
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Incorrect OTP! Enter the exact verification code.',
              hi: 'गलत OTP कोड! कृपया स्क्रीन पर आया सटीक OTP दर्ज करें।',
              hinglish: 'Galat OTP code! Screen par dikh raha sahi OTP enter karein.',
            })
        );
        return;
      }
      hydrateVerifiedUser(data.user);
    } catch {
      setAuthError('OTP verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSocialLogin = async () => {
    setAuthError('');
    setSuggestSignUp(false);
    if (!requireTermsConsent()) return;

    if (onSocialGoogleClick) {
      onSocialGoogleClick();
      return;
    }

    setIsGooglePending(true);
    try {
      const googleUser = await signInWithGooglePopup();
      const res = await fetch('/api/auth/social-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleUser),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setAuthError(
          data?.error ||
            pickLang(lang, {
              en: 'Google account verification failed. Please try again.',
              hi: 'Google खाता सत्यापन विफल रहा। कृपया पुनः प्रयास करें।',
            })
        );
        return;
      }

      if (data.registered && data.user) {
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
        hydrateVerifiedUser(data.user);
        return;
      }

      // First-time Google visitor -> prefill verified Name + Gmail on Sign Up tab
      setVerifiedGoogleUid(googleUser.uid);
      if (data.profile?.name && !regName) setRegName(data.profile.name);
      if (data.profile?.email) setRegEmail(data.profile.email);
      setMode('register');
      setAuthSuccess(
        pickLang(lang, {
          en: `Google verified (${googleUser.email}). Enter your 10-digit Mobile No., delivery address & double password once to activate your account.`,
          hi: `✓ Google सत्यापित (${googleUser.email})! कृपया अपना 10-अंकों का मोबाइल No., पता व दो बार पासवर्ड डालकर खाता सक्रिय करें।`,
          hinglish: `✓ Google verified (${googleUser.email})! Ab 10-digit Mobile No., address aur 2x password daal kar Sign Up poora karein.`,
        })
      );
    } catch (err: any) {
      const msg = err?.code === 'auth/popup-closed-by-user'
        ? pickLang(lang, { en: 'Google sign-in popup was closed.', hi: 'Google लॉगिन विंडो बंद कर दी गई।' })
        : pickLang(lang, {
            en: 'Could not complete Google Sign-In. Please allow popups or use Mobile/Gmail password.',
            hi: 'Google लॉगिन पूरा नहीं हो सका। कृपया पॉपअप की अनुमति दें या मोबाइल/पासवर्ड का उपयोग करें।',
          });
      setAuthError(msg);
    } finally {
      setIsGooglePending(false);
    }
  };

  const cardBody = (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative ${inlineMode ? '' : 'max-h-[92vh] overflow-y-auto'}`}>
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="truncate">{brand.brandName} · powered by MARCO 💯</span>
            </div>
            <h3 className="font-display font-black text-lg text-slate-900 dark:text-slate-100 mt-0.5">
              {mode === 'login' &&
                pickLang(lang, {
                  en: 'Registered Member Sign In',
                  hi: 'पंजीकृत ग्राहक लॉगिन (Sign In)',
                  mr: 'नोंदणीकृत ग्राहक लॉगिन',
                  hinglish: 'Registered Sign In',
                })}
              {mode === 'register' &&
                pickLang(lang, {
                  en: 'Create Customer Account',
                  hi: 'नया खाता बनाएं (Sign Up)',
                  mr: 'नवीन खाते तयार करा',
                  hinglish: 'Naya Account Banayein',
                })}
              {mode === 'forgot' &&
                pickLang(lang, {
                  en: 'Reset Password',
                  hi: 'पासवर्ड रीसेट करें',
                  mr: 'पासवर्ड रीसेट करा',
                  hinglish: 'Password Reset Karein',
                })}
              {mode === 'otp' &&
                pickLang(lang, {
                  en: 'Registered Mobile OTP Login',
                  hi: 'पंजीकृत फ़ोन OTP लॉगिन',
                  mr: 'नोंदणीकृत मोबाईल OTP लॉगिन',
                  hinglish: 'Registered Mobile OTP Login',
                })}
              {mode === 'connect_gmail' &&
                pickLang(lang, {
                  en: 'Step 2 · Connect & Verify Gmail',
                  hi: 'अंतिम चरण · Gmail कनेक्ट व वेरीफाई करें',
                  hinglish: 'Step 2 · Gmail Connect & Verify Karein',
                })}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <LanguageSelector compact align="right" />
            {!isRequiredGate && !inlineMode && (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        {mode !== 'forgot' && mode !== 'connect_gmail' && (
          <div className="flex gap-1 my-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'Password', hi: 'पासवर्ड लॉगिन', mr: 'पासवर्ड', hinglish: 'Password' })}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('register');
                setAuthError('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'Sign Up', hi: 'खाता बनाएं', mr: 'नवीन खाते', hinglish: 'Sign Up' })}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setAuthError('');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${
                mode === 'otp'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'OTP Login', hi: 'OTP लॉगिन', mr: 'OTP लॉगिन', hinglish: 'OTP Login' })}</span>
            </button>
          </div>
        )}

        {/* Mandatory Privacy Policy & Zero-Liability Consent Gate */}
        {mode !== 'connect_gmail' && (
        <div className="mb-3 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-amber-200/70 dark:border-amber-800/50">
            <span className="text-[11px] font-black text-amber-900 dark:text-amber-200">
              {pickLang(lang, {
                en: 'Required before sign-in / registration',
                hi: 'साइन इन / रजिस्टर से पहले आवश्यक (Required before sign-in / registration)',
                hinglish: 'Required before sign-in / registration',
              })}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setLocalLegalTab('privacy');
                  setLocalTermsModalOpen(true);
                }}
                className="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 underline cursor-pointer shrink-0"
              >
                {pickLang(lang, { en: 'Privacy Policy', hi: 'गोपनीयता नीति' })}
              </button>
              <span className="text-slate-300 text-[10px]">·</span>
              <button
                type="button"
                onClick={() => {
                  setLocalLegalTab('terms');
                  if (onOpenFullTerms) onOpenFullTerms();
                  else setLocalTermsModalOpen(true);
                }}
                className="text-[10.5px] font-black text-emerald-700 dark:text-emerald-400 underline cursor-pointer shrink-0"
              >
                {pickLang(lang, { en: 'Terms & Conditions', hi: 'नियम व शर्तें पढ़े' })}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked) {
                  setAuthError('');
                  logUserActivity({
                    eventType: 'TERMS_ACCEPTED',
                    actionTitle: 'Accepted Terms & Conditions before sign-in/signup',
                    pageTab: mode,
                  });
                }
              }}
              className="mt-0.5 w-4 h-4 accent-emerald-700 rounded cursor-pointer shrink-0"
            />
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              {pickLang(lang, {
                en: 'I accept the Privacy Policy & Terms & Conditions. I understand "100% ताज़ा / 100% Fresh" is a tagline only (no guarantee) and the seller/Mandi holds no liability.',
                hi: 'मैं Privacy Policy और नियम व शर्तें स्वीकार करता/करती हूँ — "100% ताज़ा / 100% Fresh" केवल एक शब्द/टैगलाइन है, इसकी कोई गारंटी नहीं है और किसी भी बात की ज़िम्मेदारी ग्राहक की होगी।',
                mr: 'मी Privacy Policy आणि अटी व शर्ती स्वीकारतो — "१००% ताजे" हा केवळ शब्द आहे आणि सर्व जबाबदारी ग्राहकाची राहील.',
              })}
            </span>
          </label>

          <div className="flex items-center justify-between gap-2 pl-6">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
              {acceptedTerms
                ? pickLang(lang, { en: '✓ Accepted — Account enabled', hi: '✓ स्वीकृत — खाता चालू करने के लिए तैयार' })
                : pickLang(lang, { en: 'Tick checkbox to continue', hi: 'आगे बढ़ने के लिए ऊपर टिक करें' })}
            </span>
            <button
              type="button"
              onClick={() => setShowPolicyDetails((prev) => !prev)}
              className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300 underline cursor-pointer shrink-0"
            >
              {showPolicyDetails
                ? pickLang(lang, { en: 'Hide Summary', hi: 'संक्षेप छुपाएं' })
                : pickLang(lang, { en: 'Quick Summary', hi: 'त्वरित सारांश' })}
            </button>
          </div>

          {showPolicyDetails && (
            <div className="ml-6 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 text-[10.5px] text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <p>
                <strong>1. </strong>
                {pickLang(lang, {
                  en: '"100% ताज़ा / 100% Fresh" is strictly a promotional word/tagline — ताज़ाMandi and the seller provide zero guarantee of freshness, grade, or condition.',
                  hi: '“100% ताज़ा / 100% Fresh” केवल एक प्रचार शब्द / टैगलाइन है — ताज़ाMandi या विक्रेता (Seller) इसकी कोई गारंटी नहीं देता है।',
                })}
              </p>
              <p>
                <strong>2. </strong>
                {pickLang(lang, {
                  en: 'Zero Seller / Mandi Liability: Whatever happens (right or wrong) regarding produce quality, weight, pricing, or delivery, neither the seller nor Mandi vendor is responsible — full responsibility rests strictly with the customer.',
                  hi: 'विक्रेता / मंडी की कोई ज़िम्मेदारी नहीं: माल में कुछ भी गड़बड़ हो या सही हो, इसके लिए विक्रेता या मंडी वाला कोई ज़िम्मेदार नहीं होगा — हर स्थिति की पूरी ज़िम्मेदारी स्वयं ग्राहक (Customer) की होगी।',
                })}
              </p>
              <p>
                <strong>3. </strong>
                {pickLang(lang, {
                  en: 'By ticking above and creating/accessing your account, you agree to store delivery phone/address details locally & on order servers solely for fulfilling requests.',
                  hi: 'ऊपर टिक करके खाता चालू करने पर आप ऑर्डर प्रोसेसिंग हेतु अपना नाम, मोबाइल व पता उपयोग करने की सहमति देते हैं।',
                })}
              </p>
            </div>
          )}
        </div>
        )}

        {/* Error / Success Messages */}
        {authError && (
          <div className="p-3 mb-3 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300 rounded-xl text-xs font-semibold space-y-2">
            <div>{authError}</div>
            {suggestSignUp && (
              <button
                type="button"
                onClick={() => {
                  const candidateDigits = (loginIdentifier || otpPhone || forgotPhone).replace(/\D/g, '').slice(-10);
                  if (candidateDigits.length === 10 && !regPhone) {
                    setRegPhone(candidateDigits);
                  }
                  setMode('register');
                  setSuggestSignUp(false);
                  setAuthError('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>
                  {pickLang(lang, {
                    en: 'Create Account Now (Sign Up) →',
                    hi: 'नया खाता बनाएं (Sign Up) →',
                    hinglish: 'Naya Account Banayein (Sign Up) →',
                  })}
                </span>
              </button>
            )}
          </div>
        )}
        {authSuccess && (
          <div className="p-2.5 mb-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 1: CUSTOMER LOGIN WITH PASSWORD + HIDE/SHOW PASSWORD + FORGOT */}
        {/* ========================================================================= */}
        {mode === 'login' && (
          <form onSubmit={handlePasswordLogin} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: 'Mobile No. or Gmail:',
                  hi: 'मोबाइल No. या Gmail:',
                  mr: 'मोबाईल No. किंवा Gmail:',
                  hinglish: 'Mobile No. ya Gmail:',
                })}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="88288 22808 / name@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-emerald-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  {pickLang(lang, {
                    en: 'Password (Enter Twice to Verify):',
                    hi: 'पासवर्ड (दो बार दर्ज करें):',
                    mr: 'पासवर्ड (दोनदा टाका):',
                    hinglish: 'Password (2 Baar Enter Karein):',
                  })}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setForgotPhone(loginIdentifier.replace(/\D/g, ''));
                    setAuthError('');
                  }}
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {pickLang(lang, { en: 'Forgot password?', hi: 'पासवर्ड भूल गए?', mr: 'पासवर्ड विसरलात?', hinglish: 'Forgot password?' })}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={pickLang(lang, { en: '1. Password', hi: '1. पासवर्ड लिखें', hinglish: '1. Password' })}
                    className="w-full pl-8 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-emerald-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    title={showLoginPassword ? 'Hide' : 'Show'}
                  >
                    {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginConfirmPassword}
                    onChange={(e) => setLoginConfirmPassword(e.target.value)}
                    placeholder={pickLang(lang, { en: '2. Confirm Password', hi: '2. दोबारा पासवर्ड लिखें', hinglish: '2. Confirm Password' })}
                    className="w-full pl-8 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-emerald-600"
                    required
                  />
                </div>
              </div>

              {loginConfirmPassword.length > 0 && (
                <div
                  className={`text-[10.5px] font-bold ${
                    loginPassword === loginConfirmPassword
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-pink-600 dark:text-pink-400'
                  }`}
                >
                  {loginPassword === loginConfirmPassword
                    ? pickLang(lang, { en: '✓ Passwords match', hi: '✓ दोनों पासवर्ड मेल खा रहे हैं' })
                    : pickLang(lang, { en: '✕ Passwords do not match yet', hi: '✕ दोनों पासवर्ड एक जैसे लिखें' })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-xs text-sm cursor-pointer"
            >
              <span>
                {isSubmitting
                  ? pickLang(lang, { en: 'Verifying...', hi: 'जाँच हो रही है...', hinglish: 'Checking...' })
                  : pickLang(lang, { en: 'Sign In', hi: 'लॉगिन करें', mr: 'लॉगिन करा', hinglish: 'Sign In Karein' })}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setAuthError('');
                  setSuggestSignUp(false);
                }}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {pickLang(lang, {
                  en: "New customer? Create your account first →",
                  hi: 'नए ग्राहक हैं? पहले नया खाता बनाएं (Sign Up) →',
                  hinglish: 'Naye customer hain? Pehle Create Account karein →',
                })}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CUSTOMER SIGN UP (ORDERED FLOW + MOBILE OTP + GPS AUTOFILL) */}
        {/* ========================================================================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3 text-xs">
            {/* 1. Full Name */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, { en: '1. Full Name *', hi: '1. पूरा नाम *', mr: '१. पूर्ण नाव *', hinglish: '1. Full Name *' })}
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder={pickLang(lang, { en: 'e.g. Rahul Sharma', hi: 'उदा. राहुल शर्मा', mr: 'उदा. राहुल शर्मा', hinglish: 'e.g. Rahul Sharma' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                required
              />
            </div>

            {/* 2. Mobile Number + Inline OTP Verify */}
            <div className="space-y-2">
              <label className="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                <span>
                  {pickLang(lang, {
                    en: '2. Mobile Number (OTP Verified) *',
                    hi: '2. मोबाइल नंबर (OTP से वेरीफाई करें) *',
                    hinglish: '2. Mobile Number (OTP Verify Karein) *',
                  })}
                </span>
                {signupPhoneVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{pickLang(lang, { en: 'Verified', hi: 'सत्यापित ✓', hinglish: 'Verified ✓' })}</span>
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => {
                      const nextDigits = e.target.value.replace(/\D/g, '');
                      setRegPhone(nextDigits);
                      if (signupPhoneVerified || signupOtpSent) {
                        setSignupPhoneVerified(false);
                        setSignupOtpSent(false);
                        setSignupOtpPreview('');
                        setSignupEnteredOtp('');
                      }
                    }}
                    placeholder="9876543210"
                    className="w-full pl-11 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold"
                    required
                  />
                </div>
                {!signupPhoneVerified && (
                  <button
                    type="button"
                    onClick={handleSendSignupOtp}
                    disabled={isSendingSignupOtp || regPhone.replace(/\D/g, '').length < 10}
                    className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    {isSendingSignupOtp
                      ? pickLang(lang, { en: 'Sending...', hi: 'भेज रहे हैं...' })
                      : signupOtpSent
                      ? pickLang(lang, { en: 'Resend OTP', hi: 'फिर भेजें' })
                      : pickLang(lang, { en: 'Verify OTP', hi: 'OTP भेजें' })}
                  </button>
                )}
              </div>

              {signupOtpSent && !signupPhoneVerified && (
                <div className="p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {pickLang(lang, { en: '📲 Live Verification OTP:', hi: '📲 मोबाइल सत्यापन OTP:' })}
                      </div>
                      <div className="text-base font-mono font-black tracking-widest text-emerald-800 dark:text-emerald-200">
                        {signupOtpPreview}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignupEnteredOtp(signupOtpPreview)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>1-Click Fill</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={signupEnteredOtp}
                      onChange={(e) => setSignupEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder={pickLang(lang, { en: 'Enter 4-digit OTP', hi: '4-अंकीय OTP डालें' })}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-emerald-400 rounded-lg font-mono font-black text-center tracking-widest text-sm text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleVerifySignupOtp}
                      disabled={isVerifyingSignupOtp}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isVerifyingSignupOtp
                        ? '...'
                        : pickLang(lang, { en: 'Verify', hi: 'सत्यापित करें', hinglish: 'Verify' })}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Gmail ID (to connect in Step 2) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: '3. Gmail ID (to connect & verify account) *',
                  hi: '3. Gmail ID (जिससे अकाउंट कनेक्ट व वेरीफाई करना है) *',
                  hinglish: '3. Gmail ID (jisse account connect karna hai) *',
                })}
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                required
              />
            </div>

            {/* 4. Alternate Mobile Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, {
                  en: '4. Alternate Mobile No. (Optional)',
                  hi: '4. अल्टरनेट मोबाइल नंबर (वैकल्पिक)',
                  hinglish: '4. Alternate Mobile No. (Optional)',
                })}
              </label>
              <input
                type="tel"
                maxLength={10}
                value={regSecondaryPhone}
                onChange={(e) => setRegSecondaryPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={pickLang(lang, { en: 'Optional family mobile no.', hi: 'परिवार या दूसरा नंबर', hinglish: 'Optional family mobile' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>

            {/* 5. Flat Number */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                {pickLang(lang, { en: '5. Flat / Room / Floor No.:', hi: '5. फ्लैट / कमरा / फ्लोर नंबर:', mr: 'फ्लॅट / खोली क्रमांक:', hinglish: '5. Flat / Floor No.:' })}
              </label>
              <input
                type="text"
                value={regFlat}
                onChange={(e) => setRegFlat(e.target.value)}
                placeholder={pickLang(lang, { en: 'e.g. 402, 4th Floor', hi: 'उदा. 402, 3rd Floor', mr: 'उदा. ४०२, ३रा मजला', hinglish: 'e.g. 402, 3rd Floor' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold"
              />
            </div>

            {/* 6. Building / Society Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{pickLang(lang, { en: '6. Building / Society Name:', hi: '6. बिल्डिंग / सोसायटी का नाम:', mr: 'इमारत / सोसायटीचे नाव:', hinglish: '6. Building / Society Name:' })}</span>
                </label>
                {regBuilding && (
                  <button
                    type="button"
                    onClick={() => setRegBuilding('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    {pickLang(lang, { en: 'Clear ✕', hi: 'साफ़ करें ✕', mr: 'साफ करा ✕', hinglish: 'Clear ✕' })}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={regBuilding}
                onChange={(e) => setRegBuilding(e.target.value)}
                placeholder={pickLang(lang, { en: 'e.g. Royal Heights / Gokul Dham', hi: 'उदा. रॉयल हाइट्स / गोकुल धाम', mr: 'उदा. रॉयल हाइट्स', hinglish: 'e.g. Royal Heights' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            {/* 7. Road / Landmark */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>{pickLang(lang, { en: '7. Road / Landmark:', hi: '7. सड़क / रोड लैंडमार्क:', mr: 'रस्ता / मुख्य खूण:', hinglish: '7. Road / Landmark:' })}</span>
                </label>
                {regRoad && (
                  <button
                    type="button"
                    onClick={() => setRegRoad('')}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                  >
                    {pickLang(lang, { en: 'Clear ✕', hi: 'साफ़ करें ✕', hinglish: 'Clear ✕' })}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={regRoad}
                onChange={(e) => setRegRoad(e.target.value)}
                placeholder={pickLang(lang, { en: 'e.g. MG Road, Near Temple', hi: 'उदा. एमजी रोड, मंदिर के पास', mr: 'उदा. एमजी रोड, मंदिराजवळ', hinglish: 'e.g. MG Road' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
              />
            </div>

            {/* 8. GPS Exact Location (fills any empty fields above + Exact Location box) */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{pickLang(lang, { en: '8. Exact GPS Location:', hi: '8. एग्ज़ैक्ट लोकेशन (GPS):', hinglish: '8. Exact Location (GPS):' })}</span>
                </label>
                <div className="flex items-center gap-2">
                  {regFullAddress && (
                    <button
                      type="button"
                      onClick={() => setRegFullAddress('')}
                      className="text-[10.5px] text-rose-500 font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                  >
                    <Navigation className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>
                      {isDetectingLocation
                        ? pickLang(lang, { en: 'Locating...', hi: 'खोज रहे हैं...', hinglish: 'Locating...' })
                        : pickLang(lang, { en: 'Use GPS (Fill Blanks)', hi: 'GPS लगाएं (खाली भरें)', hinglish: 'Use GPS' })}
                    </span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={regFullAddress}
                onChange={(e) => setRegFullAddress(e.target.value)}
                placeholder={pickLang(lang, { en: 'Tap "Use GPS" to auto-fill blank location fields', hi: 'ऊपर "GPS लगाएं" दबाने पर खाली पता अपने आप भर जाएगा', hinglish: 'Use GPS dabane par khali location auto-fill hogi' })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 text-xs"
              />
            </div>

            {/* 9. Password Entered Twice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {pickLang(lang, { en: '9. Create Password:', hi: '9. पासवर्ड बनाएं:', mr: 'पासवर्ड तयार करा:', hinglish: '9. Create Password:' })}
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={pickLang(lang, { en: 'Min 4 characters', hi: 'कम से कम 4 अक्षर', mr: 'किमान ४ अक्षरे', hinglish: 'Min 4 letters' })}
                    className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {pickLang(lang, { en: 'Confirm Password:', hi: 'पासवर्ड दोबारा लिखें:', mr: 'पासवर्ड पुन्हा लिहा:', hinglish: 'Confirm Password:' })}
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder={pickLang(lang, { en: 'Re-enter password', hi: 'कन्फर्म पासवर्ड', mr: 'पुन्हा पासवर्ड', hinglish: 'Confirm password' })}
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {regConfirmPassword.length > 0 && (
              <div
                className={`text-[10.5px] font-bold ${
                  regPassword === regConfirmPassword
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-pink-600 dark:text-pink-400'
                }`}
              >
                {regPassword === regConfirmPassword
                  ? pickLang(lang, { en: '✓ Passwords match', hi: '✓ दोनों पासवर्ड मेल खा रहे हैं' })
                  : pickLang(lang, { en: '✕ Passwords do not match yet', hi: '✕ दोनों पासवर्ड एक जैसे लिखें' })}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl font-bold transition-colors text-sm shadow-xs cursor-pointer"
            >
              {isSubmitting
                ? pickLang(lang, { en: 'Creating Account...', hi: 'खाता बन रहा है...' })
                : pickLang(lang, {
                    en: 'Create Account & Connect Gmail ➔',
                    hi: 'खाता बनाएं व Gmail जोड़ें ➔',
                    hinglish: 'Account Banayein & Gmail Connect Karein ➔',
                  })}
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2 AFTER ACCOUNT CREATION: CONNECT & VERIFY ENTERED GMAIL */}
        {/* ========================================================================= */}
        {mode === 'connect_gmail' && pendingGmailUser && (
          <div className="space-y-4 text-xs py-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                  {pendingGmailUser.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                  ✓ {pickLang(lang, { en: 'Mobile Verified', hi: 'मोबाइल सत्यापित' })}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300">
                📞 {pendingGmailUser.phone}
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  {pickLang(lang, { en: 'Gmail to Verify & Link', hi: 'कनेक्ट होने वाला Gmail' })}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 break-all">
                  {pendingGmailUser.email}
                </div>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11.5px]">
              {pickLang(lang, {
                en: 'Tap below to sign in with Google on this mobile/browser and verify your Gmail directly onto your customer profile.',
                hi: 'अपने मोबाइल या ब्राउज़र से Google के ज़रिए अपना Gmail कनेक्ट करने के लिए नीचे क्लिक करें। जुड़ते ही आपका Gmail ✓ वेरीफाई हो जाएगा।',
                hinglish: 'Neeche click karke Google se apna Gmail connect aur verify karein.',
              })}
            </p>

            <button
              type="button"
              onClick={handleConnectPendingGmail}
              disabled={isGooglePending}
              className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
            >
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center text-xs font-black">
                G
              </span>
              <span>
                {isGooglePending
                  ? pickLang(lang, { en: 'Connecting Google...', hi: 'Gmail जुड़ रहा है...' })
                  : pickLang(lang, {
                      en: 'Connect & Verify Gmail Now',
                      hi: 'Gmail अभी कनेक्ट व वेरीफाई करें',
                      hinglish: 'Connect & Verify Gmail Now',
                    })}
              </span>
            </button>

            <button
              type="button"
              onClick={() => hydrateVerifiedUser(pendingGmailUser)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              {pickLang(lang, {
                en: 'Verify later from Account → Enter Store',
                hi: 'बाद में Account में वेरीफाई करें → स्टोर खोलें',
                hinglish: 'Baad me Account se verify karein → Store Kholein',
              })}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 3: FORGOT PASSWORD FLOW (OTP VERIFICATION + NEW PASSWORD) */}
        {/* ========================================================================= */}
        {mode === 'forgot' && (
          <div className="space-y-3.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError('');
              }}
              className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold hover:underline mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{pickLang(lang, { en: 'Back to Sign In', hi: 'लॉगिन पेज पर वापस जाएं', mr: 'लॉगिन पेजवर परत जा', hinglish: 'Back to Sign In' })}</span>
            </button>

            {!forgotOtpSent ? (
              <form onSubmit={handleForgotSendOtp} className="space-y-3">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pickLang(lang, {
                    en: 'Enter your registered 10-digit mobile number to receive a password reset verification OTP:',
                    hi: 'अपना पंजीकृत 10 अंकों का मोबाइल नंबर दर्ज करें। हम आपको पासवर्ड रीसेट OTP भेजेंगे:',
                    mr: 'पासवर्ड रीसेट OTP मिळवण्यासाठी तुमचा नोंदणीकृत १० अंकी मोबाईल नंबर टाका:',
                    hinglish: 'Password reset ke liye apna registered 10-digit number enter karein:',
                  })}
                </p>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {pickLang(lang, { en: 'Mobile Number:', hi: 'मोबाइल नंबर:', mr: 'मोबाईल नंबर:', hinglish: 'Mobile No.:' })}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="88288 22808"
                      className="w-full pl-12 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>{pickLang(lang, { en: 'Send OTP Code', hi: 'OTP कोड भेजें', mr: 'OTP कोड पाठवा', hinglish: 'Send OTP Code' })}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="space-y-3.5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/60">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>{pickLang(lang, { en: '📲 Live Verification OTP:', hi: '📲 लाइव SMS प्राप्त हुआ:', mr: '📲 थेट SMS आला:', hinglish: '📲 Live SMS OTP:' })}</span>
                    </span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-1.5 py-0.5 rounded text-[10px]">
                      Just Now
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <div>
                      <div className="text-[10px] text-slate-400">Reset OTP:</div>
                      <div className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-400 tracking-widest">
                        {forgotGeneratedOtp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotEnteredOtp(forgotGeneratedOtp)}
                      className="px-2.5 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <span>1-Click Auto Fill</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {pickLang(lang, { en: 'Enter 4-Digit OTP:', hi: '4-अंकों का OTP कोड दर्ज करें:', mr: '४-अंकी OTP कोड टाका:', hinglish: '4-Digit OTP Enter Karein:' })}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={forgotEnteredOtp}
                    onChange={(e) => setForgotEnteredOtp(e.target.value)}
                    placeholder="4892"
                    className="w-full text-center text-xl font-mono font-black tracking-widest py-2 bg-slate-50 dark:bg-slate-800 border-2 border-emerald-600 rounded-xl text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {pickLang(lang, { en: 'New Password:', hi: '1. नया पासवर्ड:', mr: 'नवीन पासवर्ड:', hinglish: 'New Password:' })}
                    </label>
                    <div className="relative">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder={pickLang(lang, { en: 'Enter new password', hi: 'नया पासवर्ड लिखें', hinglish: 'New password' })}
                        className="w-full pl-3 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {pickLang(lang, { en: 'Confirm Password:', hi: '2. पासवर्ड दोबारा लिखें:', hinglish: 'Confirm Password:' })}
                    </label>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotConfirmNewPassword}
                      onChange={(e) => setForgotConfirmNewPassword(e.target.value)}
                      placeholder={pickLang(lang, { en: 'Re-enter password', hi: 'दोबारा लिखें', hinglish: 'Confirm password' })}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {pickLang(lang, { en: 'Reset & Sign In', hi: 'पासवर्ड बदलें व लॉगिन करें', mr: 'पासवर्ड बदला व लॉगिन करा', hinglish: 'Reset & Sign In' })}
                </button>
              </form>
            )}
          </div>
        )}

        {mode === 'otp' && (
          <div className="space-y-4 text-xs">
            {!otpSent ? (
              <form onSubmit={handleQuickOtpSend} className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {pickLang(lang, { en: 'Enter 10-Digit Mobile Number:', hi: 'अपना 10 अंकों का मोबाइल नंबर दर्ज करें:', mr: 'तुमचा १० अंकी मोबाईल नंबर टाका:', hinglish: '10-Digit Mobile Number Enter Karein:' })}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="88288 22808"
                      className="w-full pl-12 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-bold text-sm tracking-wider"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-xs text-sm"
                >
                  <span>{pickLang(lang, { en: 'Send OTP Code', hi: 'OTP कोड भेजें', mr: 'OTP कोड पाठवा', hinglish: 'Send OTP' })}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleQuickOtpVerify} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <span>{pickLang(lang, { en: '📲 Live OTP Ready:', hi: '📲 लाइव SMS प्राप्त हुआ:', mr: '📲 थेट SMS आला:', hinglish: '📲 Live OTP Ready:' })}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded">
                      Just Now
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400">ताज़ाMandi OTP:</div>
                      <div className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-400 tracking-widest">
                        {simulatedOtp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUserEnteredOtp(simulatedOtp)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1"
                    >
                      <span>1-Click Auto Fill</span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    {pickLang(lang, { en: 'Enter 4-Digit OTP:', hi: '4-अंकों का OTP दर्ज करें:', mr: '४-अंकी OTP टाका:', hinglish: '4-Digit OTP Enter Karein:' })}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={userEnteredOtp}
                    onChange={(e) => setUserEnteredOtp(e.target.value)}
                    placeholder="5178"
                    className="w-full text-center text-2xl tracking-[0.5em] py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-emerald-600 rounded-xl font-mono font-black text-slate-900 dark:text-slate-100 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold transition-colors shadow-xs"
                  >
                    {pickLang(lang, { en: 'Verify & Sign In', hi: 'सत्यापित करें व लॉगिन करें', mr: 'सत्यापित करा व लॉगिन करा', hinglish: 'Verify & Sign In' })}
                  </button>
                  <button
                    type="button"
                    disabled={otpCountdown > 0}
                    onClick={() => handleQuickOtpSend()}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold disabled:opacity-50"
                  >
                    {otpCountdown > 0 ? `${otpCountdown}s` : 'Resend'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Social Login Bar */}
        {mode !== 'connect_gmail' && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="text-center text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {pickLang(lang, {
              en: 'Or continue with Social Login',
              hi: 'या सोशल लॉगिन (Social Login) से जुड़ें',
              hinglish: 'Ya Social Login se continue karein',
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleGoogleSocialLogin}
              disabled={socialSetupPending || isGooglePending}
              className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <span className="w-4 h-4 rounded-full bg-white text-slate-900 border border-slate-300 flex items-center justify-center text-[10px] font-black">
                G
              </span>
              <span>
                {socialSetupPending || isGooglePending
                  ? pickLang(lang, { en: 'Connecting...', hi: 'कनेक्ट हो रहा है...' })
                  : 'Google Gmail'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('otp');
                setAuthError('');
              }}
              className="py-2 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>
                {pickLang(lang, { en: 'Phone OTP', hi: 'मोबाइल OTP' })}
              </span>
            </button>
          </div>
        </div>
        )}

        <TermsAndConditionsModal
          isOpen={localTermsModalOpen}
          initialTab={localLegalTab}
          onClose={() => setLocalTermsModalOpen(false)}
          onAcceptAndClose={() => {
            setAcceptedTerms(true);
            setAuthError('');
            setLocalTermsModalOpen(false);
          }}
        />
      </div>
  );

  if (inlineMode) {
    return cardBody;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      {cardBody}
    </div>
  );
};

export default AuthModal;

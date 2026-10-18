import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { validateUsername } from '../utils/chatUtils';
import { ADMIN_EMAIL } from '../types';
import { AppLogo } from './AppLogo';
import {
  MessageSquare,
  Mail,
  Lock,
  User as UserIcon,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const AuthScreen: React.FC<{
  onCompleteUsername?: (username: string) => Promise<void>;
}> = ({ onCompleteUsername }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'link'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isOpNotAllowed, setIsOpNotAllowed] = useState(false);

  // Email link prompt state if opened without stored email
  const [promptEmailModal, setPromptEmailModal] = useState(false);
  const [linkEmailInput, setLinkEmailInput] = useState('');

  // Handle email link login if URL contains sign-in link
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem('emailForSignIn');
      if (storedEmail) {
        completeEmailLinkSignIn(storedEmail);
      } else {
        setPromptEmailModal(true);
      }
    }
  }, []);

  const completeEmailLinkSignIn = async (userEmail: string) => {
    setLoading(true);
    setErrorMsg(null);
    setIsOpNotAllowed(false);
    try {
      const result = await signInWithEmailLink(auth, userEmail, window.location.href);
      window.localStorage.removeItem('emailForSignIn');
      window.history.replaceState({}, document.title, window.location.pathname);
      
      if (result.user) {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          // New user will be prompted to choose a username
        }
      }
    } catch (err: any) {
      console.warn('Email link sign in info:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOpNotAllowed(true);
      }
      setErrorMsg(getArabicAuthErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    setIsOpNotAllowed(false);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // User signed in successfully, App.tsx will prompt for username if new
    } catch (err: any) {
      console.warn('Sign-in info:', err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setErrorMsg(getArabicAuthErrorMessage(err.code || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const getArabicAuthErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'لا يوجد حساب مسجل بهذا البريد الإلكتروني';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      case 'auth/operation-not-allowed':
        return 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل في لوحة Firebase Console. يرجى تفعيل Email/Password في Firebase > Authentication > Sign-in method.';
      case 'auth/email-already-in-use':
        return 'البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول بدلاً من ذلك';
      case 'auth/weak-password':
        return 'كلمة المرور ضعيفة جداً، يرجى كتابة 6 أحرف على الأقل';
      case 'auth/invalid-email':
        return 'صيغة البريد الإلكتروني غير صحيحة';
      case 'auth/too-many-requests':
        return 'تم حظر المحاولات مؤقتاً لكثرة المحاولات، يرجى المحاولة لاحقاً';
      case 'auth/network-request-failed':
        return 'تعذر الاتصال بالشبكة، تحقق من اتصال الإنترنت';
      case 'username-taken':
        return 'اسم المستخدم هذا محجوز بالفعل، يرجى اختيار اسم آخر';
      default:
        return 'حدث خطأ غير متوقع، يرجى إعادة المحاولة';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.warn('Login info:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOpNotAllowed(true);
      }
      setErrorMsg(getArabicAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const valResult = validateUsername(username);
    if (!valResult.valid) {
      setErrorMsg(valResult.error || 'اسم المستخدم غير صالح');
      return;
    }
    const cleanUsername = valResult.cleaned!;

    if (!email.trim() || !password) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if username is already taken
      const usernameDocRef = doc(db, 'usernames', cleanUsername.toLowerCase());
      const usernameSnap = await getDoc(usernameDocRef);
      if (usernameSnap.exists()) {
        setErrorMsg('اسم المستخدم هذا محجوز بالفعل، يرجى اختيار اسم آخر');
        setLoading(false);
        return;
      }

      // 2. Create user with email and password
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;
      const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // 3. Write username reservation
      await setDoc(usernameDocRef, {
        uid: user.uid,
        username: cleanUsername,
        createdAt: serverTimestamp(),
      });

      // 4. Create user profile
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        email: user.email || email.trim(),
        username: cleanUsername,
        status: isAdmin ? 'approved' : 'none',
        role: isAdmin ? 'admin' : 'member',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn('Signup info:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOpNotAllowed(true);
      }
      setErrorMsg(getArabicAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني');
      return;
    }

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + window.location.pathname,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, trimmedEmail, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', trimmedEmail);
      setSuccessMsg('تم إرسال الرابط، افحص بريدك (وفحص الرسائل المزعجة)');
    } catch (err: any) {
      console.warn('Send sign in link info:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setIsOpNotAllowed(true);
      }
      setErrorMsg(getArabicAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-[#0e1621] p-3 sm:p-4 transition-colors duration-200">
      {/* Main card */}
      <div className="w-full max-w-md mx-auto my-auto bg-[#17212b] rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden transition-all duration-200">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-[#2AABEE] to-[#229ED9] p-6 text-center text-white relative">
          <div className="flex justify-center mb-3">
            <AppLogo size="lg" className="shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold">مرحباً بك</h1>
          <p className="text-white/90 text-sm mt-1">منصة الحوار والتواصل الجماعي الفوري</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3.5 text-center transition-colors border-b-2 cursor-pointer ${
              activeTab === 'login'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-3.5 text-center transition-colors border-b-2 cursor-pointer ${
              activeTab === 'signup'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Content body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/40 border border-red-900/60 text-red-400 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {isOpNotAllowed && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>تفعيل موفر تسجيل الدخول بالبريد:</span>
              </div>
              <p>
                يرجى تفعيل موفر البريد الإلكتروني في إعدادات المصادقة الخاصة بالمشروع.
              </p>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-sm flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Quick Sign-In */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-[#242f3d] hover:bg-[#2c3949] text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2.5 mb-4 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>المتابعة السريعة للحساب</span>
          </button>

          <div className="relative flex mb-4 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="shrink-0 mx-3 text-xs text-slate-400">أو بالبريد الإلكتروني</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] focus:border-transparent transition-all text-sm text-left"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-10 py-2.5 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] focus:border-transparent transition-all text-sm text-left"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="p-1 text-slate-400 hover:text-slate-200 absolute left-3 top-2.5 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-[#2AABEE] hover:bg-[#229ED9] active:bg-[#1d8dc3] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تسجيل الدخول'}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="shrink-0 mx-3 text-xs text-slate-400 dark:text-slate-500">أو</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('link');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-[#2AABEE] hover:bg-[#2AABEE]/10 border border-[#2AABEE]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                الدخول برابط على البريد
              </button>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    اسم المستخدم (المعرّف)
                  </label>
                  <span className="text-[11px] text-[#2AABEE]">
                    مثال: <span className="font-mono font-semibold" dir="ltr">user99</span>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm pointer-events-none select-none">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="user99"
                    maxLength={20}
                    className="w-full px-4 py-2.5 pl-8 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] focus:border-transparent transition-all text-sm font-mono text-left"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  أحرف إنجليزية صغيرة وأرقام بدون مسافات (مثال: user99)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] focus:border-transparent transition-all text-sm text-left"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور (6 أحرف فأكثر)
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full px-10 py-2.5 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] focus:border-transparent transition-all text-sm text-left"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword((p) => !p)}
                    aria-label={showSignupPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    className="p-1 text-slate-400 hover:text-slate-200 absolute left-3 top-2.5 transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-[#2AABEE] hover:bg-[#229ED9] active:bg-[#1d8dc3] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء الحساب والانضمام'}
              </button>
            </form>
          )}

          {/* Passwordless Email Link Form */}
          {activeTab === 'link' && (
            <form onSubmit={handleSendEmailLink} className="space-y-4">
              <div className="p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl text-xs text-blue-300 leading-relaxed">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً سحرياً لتسجيل الدخول الفوري دون الحاجة لكلمة مرور.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] focus:border-transparent transition-all text-sm text-left"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-[#2AABEE] hover:bg-[#229ED9] active:bg-[#1d8dc3] transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    إرسال رابط الدخول
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 py-1"
              >
                العودة لتسجيل الدخول التقليدي
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Re-prompt email modal if opened from another device */}
      {promptEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#17212b] rounded-2xl max-w-sm w-full p-6 shadow-2xl text-right">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">تأكيد البريد الإلكتروني</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              يبدو أنك فتحت الرابط من جهاز مختلف. يرجى كتابة بريدك الإلكتروني لتأكيد تسجيل الدخول.
            </p>
            <input
              type="email"
              dir="ltr"
              value={linkEmailInput}
              onChange={(e) => setLinkEmailInput(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#242f3d] text-slate-900 dark:text-white mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2AABEE]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loading || !linkEmailInput.trim()}
                onClick={() => completeEmailLinkSignIn(linkEmailInput.trim())}
                className="flex-1 py-2.5 bg-[#2AABEE] text-white rounded-xl font-bold text-sm hover:bg-[#229ED9] transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'متابعة'}
              </button>
              <button
                type="button"
                onClick={() => setPromptEmailModal(false)}
                className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="w-full max-w-md mx-auto text-center py-4 text-xs text-slate-400 dark:text-slate-500">
        تطبيق مجلس للدردشة الجماعية الفورية الآمنة
      </div>
    </div>
  );
};

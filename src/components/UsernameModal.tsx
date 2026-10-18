import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { validateUsername } from '../utils/chatUtils';
import { User, AlertCircle, Loader2 } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface UsernameModalProps {
  onChooseUsername: (username: string) => Promise<void>;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ onChooseUsername }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const val = validateUsername(username);
    if (!val.valid) {
      setErrorMsg(val.error || 'اسم المستخدم غير صالح');
      return;
    }
    const clean = val.cleaned!;

    setLoading(true);
    try {
      // Check uniqueness in usernames collection
      const usernameDocRef = doc(db, 'usernames', clean.toLowerCase());
      const usernameSnap = await getDoc(usernameDocRef);
      if (usernameSnap.exists()) {
        setErrorMsg('اسم المستخدم هذا محجوز بالفعل، يرجى اختيار اسم آخر');
        setLoading(false);
        return;
      }

      await onChooseUsername(clean);
    } catch (err: any) {
      console.warn('Error choosing username info:', err);
      setErrorMsg('حدث خطأ أثناء حفظ اسم المستخدم، يرجى المحاولة مرة أخرى');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-[#17212b] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-800 text-right">
        <div className="flex justify-center mb-3">
          <AppLogo size="md" withGlow />
        </div>
        <h3 className="font-bold text-lg text-white text-center mb-1">
          اختر اسم المستخدم
        </h3>
        <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
          أهلاً بك في مجلس! للبدء، يرجى اختيار اسم مستخدم فريد سيظهر للأعضاء الآخرين في المحادثة.
        </p>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-900 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-2.5 pl-8 rounded-xl border border-slate-700 bg-[#242f3d] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2AABEE] text-sm font-mono text-left"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              أحرف إنجليزية صغيرة وأرقام بدون مسافات (مثال: user99)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#2AABEE] text-white rounded-xl font-bold text-sm hover:bg-[#229ED9] transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد وحفظ'}
          </button>
        </form>
      </div>
    </div>
  );
};

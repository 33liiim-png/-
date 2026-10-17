import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, AlertCircle, LogOut, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const GatekeeperScreen: React.FC = () => {
  const { userProfile, requestToJoin, logout } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleJoinClick = async () => {
    setSubmitting(true);
    try {
      await requestToJoin();
    } catch (err) {
      console.warn('Error requesting to join:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const status = userProfile?.status || 'none';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0e1621] p-4 text-[#f5f5f5] transition-colors duration-200">
      {/* Top Bar */}
      <div className="w-full max-w-lg mx-auto flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#2AABEE] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            م
          </div>
          <span className="font-bold text-xl tracking-tight text-white">مجلس</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="w-full max-w-lg mx-auto my-auto bg-white dark:bg-[#17212b] rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-8 text-center transition-all">
        {status === 'none' && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-[#2AABEE]/10 text-[#2AABEE] mx-auto flex items-center justify-center">
              <Users className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                أهلاً بك يا {userProfile?.username || 'صديقنا'} في مجلس!
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                مجلس هو مساحة خاصة للدردشة الجماعية الفورية والتواصل مع الأعضاء. للمشاركة وتبادل الرسائل، يرجى تقديم طلب انضمام للمشرف.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleJoinClick}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-base text-white bg-[#2AABEE] hover:bg-[#229ED9] active:bg-[#1d8dc3] transition-all shadow-lg shadow-[#2AABEE]/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>انضمام إلى المجلس</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 animate-ping opacity-60"></div>
              <div className="relative w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center border border-amber-200 dark:border-amber-800/60">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                في انتظار موافقة المشرف
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                تم تقديم طلب انضمامك بنجاح وهو قيد المراجعة حالياً من قِبل مشرف المجلس. سيتم نقلك مباشرة إلى ساحة الدردشة فور الموافقة دون الحاجة لتحديث الصفحة.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#242f3d] border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>المزامنة التلقائية قيد التشغيل</span>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-500 mx-auto flex items-center justify-center border border-red-200 dark:border-red-900/60">
              <AlertCircle className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                تم رفض طلب انضمامك
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                نعتذر، لم يتم قبول طلب انضمامك إلى هذا المجلس أو تمت إزالة حسابك من قِبل المشرف. يمكنك التواصل مع المشرف لإعادة المراجعة.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 px-6 rounded-2xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-lg mx-auto text-center py-4 text-xs text-slate-400 dark:text-slate-500">
        مجلس - بيئة حوار تفاعلية آمنة
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, User, AtSign, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserColor, getAvatarInitial } from '../utils/chatUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAvatarModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAvatarModal,
}) => {
  const { userProfile, updateDisplayName, isAdmin } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
    }
  }, [userProfile, isOpen]);

  if (!isOpen) return null;

  const currentInitial = getAvatarInitial(displayName.trim() || userProfile?.username || '');
  const currentColor = getUserColor(userProfile?.username || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setErrorText(null);
    setSavedSuccess(false);

    const trimmed = displayName.trim();
    if (trimmed.length > 50) {
      setErrorText('الاسم لا يمكن أن يتجاوز 50 حرفاً');
      return;
    }

    setSaving(true);
    try {
      const success = await updateDisplayName(trimmed);
      if (success) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 1200);
      } else {
        setErrorText('حدث خطأ أثناء حفظ الاسم، يرجى المحاولة لاحقاً');
      }
    } catch {
      setErrorText('حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-3xl bg-[#17212b] border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2AABEE]/15 flex items-center justify-center text-[#2AABEE]">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">إعدادات الملف الشخصي</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-right">
          {/* Avatar Preview & Change button */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl text-white shadow-md border-2 border-white/10 bg-[#242f3d]">
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: currentColor.bg }}
                  >
                    {currentInitial}
                  </div>
                )}
              </div>
            </div>

            {onOpenAvatarModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAvatarModal();
                }}
                className="text-xs font-semibold text-[#2AABEE] hover:text-[#36b9fc] hover:underline cursor-pointer transition-colors"
              >
                تغيير الصورة الشخصية
              </button>
            )}
          </div>

          {/* User handle (Read-only identifier) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              المعرف الثابت في المجلس
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#0e1621] border border-slate-800 text-slate-300 text-sm font-mono dir-ltr">
              <AtSign className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{userProfile?.username}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              هذا المعرف الفريد الخاص بك للبحث والتمييز.
            </p>
          </div>

          {/* Display Name Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                الاسم الظاهر (بالعربية أو الإنجليزية)
              </label>
              <span className="text-[11px] text-slate-500">
                {displayName.length} / 50
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                maxLength={50}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errorText) setErrorText(null);
                }}
                placeholder="اكتب اسمك كما تحب (مثال: أحمد أو Alex)..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#242f3d] border border-slate-700/80 focus:border-[#2AABEE] focus:ring-2 focus:ring-[#2AABEE]/30 text-white placeholder-slate-500 text-sm outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              إذا تركت هذا الحقل فارغاً، سيظهر معرفك (@{userProfile?.username}) تلقائياً للأعضاء.
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-2xl bg-[#0e1621] border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 mb-2 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#2AABEE]" />
              <span>معاينة ظهورك للأعضاء:</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white shrink-0 border border-white/10"
                style={{ backgroundColor: currentColor.bg }}
              >
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentInitial
                )}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-white text-sm">
                  {displayName.trim() || userProfile?.username}
                </span>
                <span className="text-[11px] text-slate-400 font-mono dir-ltr text-right">
                  @{userProfile?.username} {isAdmin ? '• مشرف' : ''}
                </span>
              </div>
            </div>
          </div>

          {errorText && (
            <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-900 text-red-300 text-xs">
              {errorText}
            </div>
          )}

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-900 text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-semibold">
              <Check className="w-4 h-4" />
              <span>تم حفظ التعديلات بنجاح!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

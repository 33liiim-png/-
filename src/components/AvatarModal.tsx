import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { compressAvatarFile, AVATAR_PRESETS } from '../utils/imageUtils';
import { getUserColor, getAvatarInitial } from '../utils/chatUtils';
import { X, Upload, Check, Trash2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateAvatar } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(userProfile?.avatarUrl || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !userProfile) return null;

  const userInitial = getAvatarInitial(userProfile.username);
  const userColor = getUserColor(userProfile.username);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsProcessing(true);

    try {
      const dataUrl = await compressAvatarFile(file);
      setSelectedAvatar(dataUrl);
    } catch (err: any) {
      console.error('Avatar processing error:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء معالجة الصورة، يرجى تجربة صورة أخرى');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const ok = await updateAvatar(selectedAvatar || null);
      if (ok) {
        setSuccessMsg('تم تحديث الصورة الشخصية بنجاح!');
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMsg('تعذر حفظ الصورة، يرجى المحاولة لاحقاً');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#17212b] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2AABEE]/20 flex items-center justify-center text-[#2AABEE]">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">تغيير الصورة الشخصية</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs text-right">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs text-right flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current / Selected Preview */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-2 border-[#2AABEE]/40 flex items-center justify-center bg-[#242f3d]">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt={userProfile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-3xl text-white"
                    style={{ backgroundColor: userColor.bg }}
                  >
                    {userInitial}
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2AABEE]" />
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="font-bold text-white text-sm">{userProfile.username}</div>
              <div className="text-xs text-slate-400">ستظهر صورتك في محادثات المجلس لجميع الأعضاء</div>
            </div>

            {selectedAvatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-950/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إزالة الصورة والعودة للحرف الافتراضي</span>
              </button>
            )}
          </div>

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isSaving}
              className="w-full py-3 px-4 rounded-2xl bg-[#242f3d] hover:bg-[#2c394a] border border-slate-700/80 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-[#2AABEE]" />
              <span>رفع صورة من جهازك (JPG, PNG, WebP)</span>
            </button>
          </div>

          {/* Preset Avatars Selection */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>أو اختر أيقونة مميزة:</span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {AVATAR_PRESETS.map((preset) => {
                const isCurrent = selectedAvatar === preset.svgDataUri;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(preset.svgDataUri);
                      setErrorMsg(null);
                    }}
                    title={preset.label}
                    className={`relative p-1.5 rounded-2xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#2AABEE]/20 ring-2 ring-[#2AABEE] scale-105'
                        : 'bg-[#242f3d] hover:bg-[#2c394a] border border-slate-700/60'
                    }`}
                  >
                    <img
                      src={preset.svgDataUri}
                      alt={preset.label}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-[10px] text-slate-300 truncate max-w-full">
                      {preset.label}
                    </span>
                    {isCurrent && (
                      <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#2AABEE] text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-[#121922] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isProcessing}
            className="px-6 py-2.5 rounded-xl bg-[#2AABEE] hover:bg-[#229ED9] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>حفظ الصورة</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

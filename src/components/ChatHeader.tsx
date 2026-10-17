import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ShieldCheck, LogOut, Shield, Camera } from 'lucide-react';
import { getUserColor, getAvatarInitial } from '../utils/chatUtils';
import { AvatarModal } from './AvatarModal';

interface ChatHeaderProps {
  onOpenAdmin: () => void;
  pendingCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onOpenAdmin, pendingCount }) => {
  const { userProfile, isAdmin, logout } = useAuth();
  const [memberCount, setMemberCount] = useState<number>(1);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    // Listen to count of approved users
    const q = query(collection(db, 'users'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMemberCount(Math.max(snapshot.size, 1));
      },
      (err) => {
        console.warn('Member count query error:', err);
      }
    );

    return () => unsubscribe();
  }, []);

  const userInitial = getAvatarInitial(userProfile?.username || '');
  const userColor = getUserColor(userProfile?.username || '');

  return (
    <>
      <header className="h-16 px-4 bg-[#17212b] border-b border-slate-800 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Telegram-style Room Header */}
        <div className="flex items-center gap-3">
          {/* Room Avatar */}
          <div className="relative">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#229ED9] to-[#2AABEE] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              م
            </div>
            <span className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 border-2 border-[#17212b] rounded-full"></span>
          </div>

          {/* Room Title & Members */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-[#f5f5f5] leading-tight">
                مجلس
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2AABEE]/10 text-[#2AABEE] font-semibold">
                دردشة جماعية
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {memberCount === 1 ? 'عضو واحد' : `${memberCount} أعضاء`}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* Admin Dashboard Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              aria-label="لوحة الإشراف"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">لوحة الإشراف</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center animate-bounce shadow-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          {/* User Avatar & Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu((p) => !p)}
              className="relative flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-[#2AABEE]/50 transition-all cursor-pointer group"
              aria-label="قائمة المستخدم وتغيير الصورة"
              title="تعديل الصورة الشخصية"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white shadow-xs border border-white/10 bg-[#242f3d]">
                {userProfile?.avatarUrl ? (
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ backgroundColor: userColor.bg }}
                  >
                    {userInitial}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#2AABEE] text-white flex items-center justify-center shadow-xs border border-[#17212b]">
                <Camera className="w-2.5 h-2.5" />
              </span>
            </button>

            {/* User dropdown popup */}
            {showUserMenu && (
              <div
                className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#17212b] border border-slate-800 shadow-2xl py-2 z-50 text-right animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-4 py-2 border-b border-slate-800">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>{userProfile?.username}</span>
                    {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                  <div className="text-xs text-slate-400 dir-ltr text-right truncate">
                    {userProfile?.email}
                  </div>
                </div>

                {/* Change Avatar Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsAvatarModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-right text-xs font-semibold text-[#2AABEE] hover:bg-[#242f3d] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  <span>تغيير الصورة الشخصية</span>
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="w-full px-4 py-2 text-right text-xs font-semibold text-amber-400 hover:bg-[#242f3d] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      لوحة المشرف
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px]">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={logout}
                  className="w-full px-4 py-2 text-right text-xs font-semibold text-red-400 hover:bg-red-950/20 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-800/80"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Avatar Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </>
  );
};

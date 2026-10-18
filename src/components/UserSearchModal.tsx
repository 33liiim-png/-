import React, { useState, useMemo } from 'react';
import { X, Search, AtSign, ShieldCheck, Copy, Check, User } from 'lucide-react';
import { getUserColor, getAvatarInitial } from '../utils/chatUtils';

export interface SearchableUser {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: SearchableUser[];
  onSelectUser?: (user: SearchableUser) => void;
}

export const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase().replace(/^@/, '');
    if (!term) return users.slice(0, 30);

    return users.filter((u) => {
      const matchUsername = u.username.toLowerCase().includes(term);
      const matchDisplayName = (u.displayName || '').toLowerCase().includes(term);
      return matchUsername || matchDisplayName;
    });
  }, [searchTerm, users]);

  if (!isOpen) return null;

  const handleCopyHandle = (username: string, id: string) => {
    navigator.clipboard?.writeText(`@${username}`);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-[#17212b] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2AABEE]/15 flex items-center justify-center text-[#2AABEE]">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                البحث عن الأعضاء بالمعرف
              </h2>
              <span className="text-[11px] text-slate-400">
                ابحث عن أي عضو عبر المعرف أو الاسم
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق نافذة البحث"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-[#17212b]">
          <div className="relative">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالمعرف مثل @username أو الاسم..."
              className="w-full py-2.5 pr-10 pl-10 rounded-2xl bg-[#242f3d] border border-slate-700/80 focus:border-[#2AABEE] focus:ring-2 focus:ring-[#2AABEE]/30 text-white placeholder-slate-400 text-sm outline-none transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-2">
              <User className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="font-semibold text-slate-300">لم يتم العثور على أي عضو بهذا المعرف</p>
              <p className="text-xs text-slate-500">
                تأكد من كتابة المعرف بشكل صحيح (مثال: @user)
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const displayName = user.displayName?.trim() || user.username;
              const hasCustomName = Boolean(user.displayName?.trim());
              const userColor = getUserColor(user.username);
              const userInitial = getAvatarInitial(displayName);
              const isCopied = copiedId === user.id;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#242f3d]/60 hover:bg-[#242f3d] border border-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* User Avatar */}
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs border border-white/10"
                      style={{ backgroundColor: userColor.bg }}
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userInitial
                      )}
                    </div>

                    {/* Names */}
                    <div className="overflow-hidden text-right">
                      <div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                        <span>{displayName}</span>
                        {user.role === 'admin' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <span className="font-mono dir-ltr text-right text-slate-400 text-[11px]">
                          @{user.username}
                        </span>
                        {hasCustomName && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            معرف
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyHandle(user.username, user.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      title="نسخ المعرف"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">نسخ المعرف</span>
                        </>
                      )}
                    </button>

                    {onSelectUser && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectUser(user);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#2AABEE]/20 hover:bg-[#2AABEE]/30 text-[#2AABEE] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        إشارة
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 px-6 border-t border-slate-800 text-center text-xs text-slate-400 bg-[#0e1621]">
          إجمالي الأعضاء المعتمدين: {users.length}
        </div>
      </div>
    </div>
  );
};

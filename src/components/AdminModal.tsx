import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { getUserColor, getAvatarInitial } from '../utils/chatUtils';
import {
  ShieldAlert,
  X,
  UserCheck,
  UserX,
  Trash2,
  RotateCcw,
  Clock,
  Users,
  UserMinus,
  Loader2,
  CheckCircle,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'members' | 'rejected'>('pending');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const usersCol = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersCol,
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as UserProfile);
        });
        setUsers(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users in admin:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const memberUsers = users.filter((u) => u.status === 'approved' && u.role !== 'admin');
  const rejectedUsers = users.filter((u) => u.status === 'rejected');

  const handleUpdateStatus = async (userId: string, newStatus: 'approved' | 'rejected' | 'none') => {
    setActionLoadingId(userId);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      showToast(newStatus === 'approved' ? 'تم قبول العضو بنجاح' : 'تم تحديث حالة العضو');
    } catch (err) {
      console.error('Error updating status:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUserPermanently = async (user: UserProfile) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب "${user.username}" بشكل نهائي؟`)) {
      return;
    }
    setActionLoadingId(user.id);
    try {
      // 1. Delete username registry
      if (user.username) {
        try {
          await deleteDoc(doc(db, 'usernames', user.username.toLowerCase()));
        } catch (e) {
          console.warn('Username record delete warning:', e);
        }
      }
      // 2. Delete user doc
      await deleteDoc(doc(db, 'users', user.id));
      showToast('تم حذف الحساب نهائياً وإتاحة اسم المستخدم');
    } catch (err) {
      console.error('Error deleting user:', err);
      handleFirestoreError(err, OperationType.DELETE, `users/${user.id}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white dark:bg-[#17212b] rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 text-right overflow-hidden transition-all">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#242f3d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2AABEE]/15 text-[#2AABEE] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                لوحة إشراف المجلس
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إدارة طلبات الانضمام والأعضاء والصلاحيات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm font-semibold bg-white dark:bg-[#17212b]">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>طلبات الانضمام</span>
            {pendingUsers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-bold animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الأعضاء المعتمدون</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {memberUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`flex-1 py-3 px-2 flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'rejected'
                ? 'border-[#2AABEE] text-[#2AABEE] bg-[#2AABEE]/5 dark:bg-[#2AABEE]/10'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <UserMinus className="w-4 h-4" />
            <span>المرفوضون</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {rejectedUsers.length}
            </span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#2AABEE]" />
              <span className="text-xs">جاري تحميل البيانات...</span>
            </div>
          ) : (
            <>
              {/* Tab: Pending Requests */}
              {activeTab === 'pending' && (
                <>
                  {pendingUsers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      لا توجد طلبات انضمام معلقة في الوقت الحالي
                    </div>
                  ) : (
                    pendingUsers.map((user) => {
                      const color = getUserColor(user.username);
                      const initial = getAvatarInitial(user.username);
                      const isWorking = actionLoadingId === user.id;

                      return (
                        <div
                          key={user.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#242f3d] border border-slate-200 dark:border-slate-800 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-white/10 bg-[#242f3d]"
                              style={{ backgroundColor: color.bg, color: color.text }}
                            >
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                initial
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {user.username}
                              </div>
                              <div className="text-xs text-slate-400 dir-ltr text-right">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleUpdateStatus(user.id, 'approved')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {isWorking ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>قبول</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleUpdateStatus(user.id, 'rejected')}
                              className="px-3.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>رفض</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* Tab: Members */}
              {activeTab === 'members' && (
                <>
                  {memberUsers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      لا يوجد أعضاء منضمون حتى الآن
                    </div>
                  ) : (
                    memberUsers.map((user) => {
                      const color = getUserColor(user.username);
                      const initial = getAvatarInitial(user.username);
                      const isWorking = actionLoadingId === user.id;

                      return (
                        <div
                          key={user.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#242f3d] border border-slate-200 dark:border-slate-800 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-white/10 bg-[#242f3d]"
                              style={{ backgroundColor: color.bg, color: color.text }}
                            >
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                initial
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {user.username}
                              </div>
                              <div className="text-xs text-slate-400 dir-ltr text-right">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleUpdateStatus(user.id, 'none')}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>إزالة</span>
                            </button>

                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleDeleteUserPermanently(user)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف نهائي</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* Tab: Rejected */}
              {activeTab === 'rejected' && (
                <>
                  {rejectedUsers.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      لا يوجد مستخدمون مرفوضون
                    </div>
                  ) : (
                    rejectedUsers.map((user) => {
                      const color = getUserColor(user.username);
                      const initial = getAvatarInitial(user.username);
                      const isWorking = actionLoadingId === user.id;

                      return (
                        <div
                          key={user.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#242f3d] border border-slate-200 dark:border-slate-800 gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm shrink-0 shadow-xs border border-white/10 bg-[#242f3d]"
                              style={{ backgroundColor: color.bg, color: color.text }}
                            >
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                initial
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {user.username}
                              </div>
                              <div className="text-xs text-slate-400 dir-ltr text-right">
                                {user.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleUpdateStatus(user.id, 'approved')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>إعادة إضافة</span>
                            </button>

                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleDeleteUserPermanently(user)}
                              className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>حذف نهائي</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

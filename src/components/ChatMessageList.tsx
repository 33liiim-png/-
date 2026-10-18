import React, { useRef, useState, useLayoutEffect } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getUserColor,
  getAvatarInitial,
  formatArabicDateSeparator,
  formatArabicTime,
} from '../utils/chatUtils';
import { Trash2, ArrowDown, Check, CheckCheck, Loader2, Reply, Eye, X, Users } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ChatMessageListProps {
  messages: ChatMessage[];
  usersMap?: Record<string, { username: string; displayName?: string; avatarUrl?: string }>;
  loadingEarlier: boolean;
  hasMoreEarlier: boolean;
  onLoadMore: () => void;
  onReplyMessage: (message: ChatMessage) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  usersMap,
  loadingEarlier,
  hasMoreEarlier,
  onLoadMore,
  onReplyMessage,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomMarkerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [selectedReceiptMsg, setSelectedReceiptMsg] = useState<ChatMessage | null>(null);
  const prevMessagesLength = useRef(messages.length);

  // Detect scroll position
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const scrolledUp = distanceFromBottom > 150;
    setIsUserScrolledUp(scrolledUp);
    setShowScrollBottom(scrolledUp);
  };

  // Auto-scroll to bottom only if user was not reading old ones
  useLayoutEffect(() => {
    if (!isUserScrolledUp && bottomMarkerRef.current) {
      bottomMarkerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isUserScrolledUp]);

  const scrollToBottom = () => {
    if (bottomMarkerRef.current) {
      bottomMarkerRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsUserScrolledUp(false);
      setShowScrollBottom(false);
    }
  };

  const scrollToRepliedMessage = (targetId: string) => {
    const el = document.getElementById(`msg-${targetId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1500);
    }
  };

  const handleDeleteMessage = async (message: ChatMessage) => {
    if (!window.confirm('هل تريد حذف هذه الرسالة من المجلس؟')) return;
    try {
      await deleteDoc(doc(db, 'messages', message.id));
    } catch (err) {
      console.error('Error deleting message:', err);
      handleFirestoreError(err, OperationType.DELETE, `messages/${message.id}`);
    }
  };

  // Group messages by date
  let lastDateLabel = '';

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 bg-[#0E1621] relative transition-colors duration-200"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(42, 171, 238, 0.03) 0%, transparent 70%)`,
      }}
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col space-y-3">
        {/* Load More Button */}
        {hasMoreEarlier && (
          <div className="flex justify-center my-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingEarlier}
            className="px-4 py-1.5 rounded-full bg-[#17212b]/90 hover:bg-[#17212b] text-[#2AABEE] text-xs font-semibold shadow-xs border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingEarlier ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري تحميل الرسائل السابقة...</span>
              </>
            ) : (
              <span>تحميل المزيد من الرسائل</span>
            )}
          </button>
        </div>
      )}

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
          <div className="w-16 h-16 rounded-3xl bg-[#17212b]/60 flex items-center justify-center text-3xl mb-3 shadow-inner border border-slate-800">
            💬
          </div>
          <h3 className="font-bold text-slate-200 text-base mb-1">
            لا توجد رسائل بعد
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            كن أول من يبدأ المحادثة ويرحب بأعضاء المجلس!
          </p>
        </div>
      )}

      {/* Messages */}
      {messages.map((msg, index) => {
        const isMine = msg.authorId === currentUser?.uid;
        const canDelete = isMine || isAdmin;
        const isHighlighted = highlightedMsgId === msg.id;

        // Parse date for separator
        let messageDate = new Date();
        if (msg.createdAt?.toDate) {
          messageDate = msg.createdAt.toDate();
        } else if (msg.createdAt instanceof Date) {
          messageDate = msg.createdAt;
        } else if (typeof msg.createdAt === 'number') {
          messageDate = new Date(msg.createdAt);
        }

        const dateLabel = formatArabicDateSeparator(messageDate);
        const showSeparator = dateLabel !== lastDateLabel;
        if (showSeparator) {
          lastDateLabel = dateLabel;
        }

        // Resolve latest avatar, username & displayName from usersMap if available, fallback to message doc
        const user = usersMap?.[msg.authorId];
        const authorAvatarUrl = user?.avatarUrl || msg.authorAvatarUrl;
        const authorUsername = user?.username || msg.authorUsername;
        const authorDisplayName = user?.displayName || msg.authorDisplayName;
        const displayNameToRender = authorDisplayName?.trim() || authorUsername;

        const userColor = getUserColor(authorUsername);
        const avatarInitial = getAvatarInitial(displayNameToRender);
        const timeStr = formatArabicTime(messageDate);

        // Check if next message is by the same author
        const nextMsg = messages[index + 1];
        const isLastInGroup = !nextMsg || nextMsg.authorId !== msg.authorId;

        return (
          <React.Fragment key={msg.id}>
            {/* Centered Date Separator Pill */}
            {showSeparator && (
              <div className="flex justify-center my-4 sticky top-2 z-10">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-bold text-slate-300 bg-[#17212b]/90 backdrop-blur-md shadow-xs border border-white/5">
                  {dateLabel}
                </span>
              </div>
            )}

            {/* Message Row */}
            <div
              id={`msg-${msg.id}`}
              className={`flex items-end gap-2 group transition-all duration-300 ${
                isMine ? 'flex-row justify-start' : 'flex-row-reverse justify-end'
              } ${isHighlighted ? 'scale-[1.02]' : ''}`}
            >
              {/* For Current User: Avatar on outer side */}
              {isMine && (
                <div className="w-8 shrink-0 mb-0.5">
                  {isLastInGroup ? (
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden relative flex items-center justify-center font-bold text-xs text-white shadow-2xs border border-white/10 bg-[#242f3d]"
                      title={`أنت (${displayNameToRender} @${authorUsername})`}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: userColor.bg }}
                      >
                        {avatarInitial}
                      </div>
                      {authorAvatarUrl && (
                        <img
                          src={authorAvatarUrl}
                          alt={displayNameToRender}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}

              {/* Message Bubble Container */}
              <div
                className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl px-3.5 py-2 text-sm shadow-xs transition-all ${
                  isHighlighted
                    ? 'ring-2 ring-amber-400 shadow-lg'
                    : ''
                } ${
                  isMine
                    ? 'bg-[#2AABEE] text-white rounded-br-xs'
                    : 'bg-[#182533] text-white rounded-bl-xs border border-slate-800/80'
                }`}
              >
                {/* Author Name for Other's message */}
                {!isMine && (
                  <div
                    className="font-bold text-xs mb-1 flex items-center gap-1.5 flex-wrap"
                    style={{ color: userColor.nameColor }}
                  >
                    <span>{displayNameToRender}</span>
                    {authorDisplayName?.trim() && (
                      <span className="text-[10px] text-slate-400 font-mono dir-ltr font-normal">
                        @{authorUsername}
                      </span>
                    )}
                  </div>
                )}

                {/* Quoted Replying Card */}
                {msg.replyTo && (
                  <div
                    onClick={() => msg.replyTo && scrollToRepliedMessage(msg.replyTo.id)}
                    className={`mb-2 pr-2.5 pl-2 py-1.5 rounded-lg border-r-3 text-right cursor-pointer transition-all ${
                      isMine
                        ? 'bg-black/15 hover:bg-black/25 border-white text-white'
                        : 'bg-[#242f3d]/80 hover:bg-[#242f3d] border-[#2AABEE] text-slate-200'
                    }`}
                    title="الانتقال إلى الرسالة الأصلية"
                  >
                    <div
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        isMine ? 'text-white' : 'text-[#2AABEE]'
                      }`}
                    >
                      <Reply className="w-3 h-3 rotate-180" />
                      <span>{msg.replyTo.authorDisplayName || msg.replyTo.authorUsername}</span>
                    </div>
                    <div className="text-[11.5px] truncate opacity-85 leading-tight mt-0.5">
                      {msg.replyTo.text}
                    </div>
                  </div>
                )}

                {/* Message Text (escaped safely by React, pre-wrap to support line breaks) */}
                <div className="whitespace-pre-wrap break-words leading-relaxed select-text text-[13.5px]">
                  {msg.text}
                </div>

                {/* Bottom row: Time + Read mark + Reply & Delete Actions */}
                <div
                  className={`flex items-center gap-2 mt-1 text-[10px] select-none ${
                    isMine ? 'text-white/80 justify-end' : 'text-slate-400 justify-start'
                  }`}
                >
                  {/* Reply button */}
                  <button
                    type="button"
                    onClick={() => onReplyMessage(msg)}
                    title="الرد على الرسالة"
                    aria-label="الرد على الرسالة"
                    className={`opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 cursor-pointer ${
                      isMine ? 'text-white hover:text-white' : 'text-slate-300 hover:text-[#2AABEE]'
                    }`}
                  >
                    <Reply className="w-3 h-3 rotate-180" />
                  </button>

                  {/* Delete button (visible on hover or tap) */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg)}
                      title="حذف الرسالة"
                      aria-label="حذف الرسالة"
                      className={`opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10 cursor-pointer ${
                        isMine ? 'text-white hover:text-red-200' : 'text-slate-400 hover:text-red-400'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  <span>{timeStr}</span>

                  {/* Read Receipts Indicator (Single check for sent, double check for read by others) */}
                  {isMine && (() => {
                    const otherReaders = (msg.readBy || []).filter((uid) => uid !== currentUser?.uid);
                    const isReadByOthers = otherReaders.length > 0;

                    return (
                      <button
                        type="button"
                        onClick={() => {
                          if (otherReaders.length > 0) {
                            setSelectedReceiptMsg(msg);
                          }
                        }}
                        disabled={!isReadByOthers}
                        title={
                          isReadByOthers
                            ? `تمت القراءة من قِبل ${otherReaders.length} ${
                                otherReaders.length === 1 ? 'عضو' : 'أعضاء'
                              } (انقر لعرض التفاصيل)`
                            : 'تم الإرسال (في انتظار قراءة الأعضاء)'
                        }
                        aria-label={
                          isReadByOthers
                            ? `تمت القراءة بواسطة ${otherReaders.length} أعضاء`
                            : 'تم الإرسال'
                        }
                        className={`inline-flex items-center gap-0.5 transition-all select-none ${
                          isReadByOthers
                            ? 'cursor-pointer hover:opacity-100 opacity-95 text-sky-200 hover:scale-110 active:scale-95'
                            : 'cursor-default opacity-60 text-white'
                        }`}
                      >
                        {isReadByOthers ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                            {otherReaders.length > 1 && (
                              <span className="text-[9px] font-bold text-sky-100 font-mono">
                                {otherReaders.length}
                              </span>
                            )}
                          </>
                        ) : (
                          <Check className="w-3.5 h-3.5 text-white/80" />
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Sender Avatar for other users */}
              {!isMine && (
                <div className="w-8 shrink-0 mb-0.5">
                  {isLastInGroup ? (
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden relative flex items-center justify-center font-bold text-xs text-white shadow-2xs border border-white/10 bg-[#242f3d]"
                      title={`@${authorUsername}`}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: userColor.bg }}
                      >
                        {avatarInitial}
                      </div>
                      {authorAvatarUrl && (
                        <img
                          src={authorAvatarUrl}
                          alt={authorUsername}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-8" />
                  )}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}

        <div ref={bottomMarkerRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="الانتقال لآخر الرسائل"
          className="fixed bottom-24 left-4 sm:left-8 z-30 min-w-[44px] min-h-[44px] p-2.5 rounded-full bg-[#17212b] text-[#2AABEE] shadow-xl border border-slate-700/80 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in zoom-in-75 flex items-center justify-center"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      {/* Read Receipts Details Modal */}
      {selectedReceiptMsg && (() => {
        const readerIds = (selectedReceiptMsg.readBy || []).filter((id) => id !== currentUser?.uid);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
            onClick={() => setSelectedReceiptMsg(null)}
          >
            <div
              className="w-full max-w-md bg-[#17212b] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150 text-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#2AABEE]/15 flex items-center justify-center text-[#2AABEE]">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">تفاصيل المشاهدة</h3>
                    <p className="text-xs text-slate-400">
                      {readerIds.length === 1 ? 'عضو واحد قرأ الرسالة' : `${readerIds.length} أعضاء قرأوا الرسالة`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptMsg(null)}
                  className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Message Quote Preview */}
              <div className="p-3.5 mx-4 mt-3 bg-[#242f3d]/60 rounded-xl border border-slate-700/50">
                <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <span>الرسالة:</span>
                </div>
                <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                  {selectedReceiptMsg.text}
                </p>
              </div>

              {/* Readers List */}
              <div className="p-4 overflow-y-auto space-y-2 flex-1">
                {readerIds.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    لم يقم أي عضو بقراءة الرسالة بعد
                  </div>
                ) : (
                  readerIds.map((uid) => {
                    const readerInfo = usersMap?.[uid];
                    const username = readerInfo?.username || 'عضو';
                    const displayName = readerInfo?.displayName?.trim() || username;
                    const avatarUrl = readerInfo?.avatarUrl;
                    const color = getUserColor(username);
                    const initial = getAvatarInitial(displayName);

                    return (
                      <div
                        key={uid}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#242f3d]/50 border border-slate-800/80 hover:bg-[#242f3d] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs border border-white/10"
                            style={{ backgroundColor: color.bg }}
                          >
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initial
                            )}
                          </div>

                          {/* Names */}
                          <div>
                            <div className="font-semibold text-xs text-white">
                              {displayName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono dir-ltr text-right">
                              @{username}
                            </div>
                          </div>
                        </div>

                        {/* Read badge */}
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-[#2AABEE] px-2 py-0.5 rounded-full bg-[#2AABEE]/10">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>تمت القراءة</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptMsg(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

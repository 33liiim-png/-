import React, { useRef, useState, useLayoutEffect } from 'react';
import { ChatMessage } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getUserColor,
  getAvatarInitial,
  formatArabicDateSeparator,
  formatArabicTime,
} from '../utils/chatUtils';
import { Trash2, ArrowDown, CheckCheck, Loader2, Reply } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ChatMessageListProps {
  messages: ChatMessage[];
  loadingEarlier: boolean;
  hasMoreEarlier: boolean;
  onLoadMore: () => void;
  onReplyMessage: (message: ChatMessage) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
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
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bg-[#0E1621] space-y-3 relative transition-colors duration-200"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(42, 171, 238, 0.03) 0%, transparent 70%)`,
      }}
    >
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

        const userColor = getUserColor(msg.authorUsername);
        const avatarInitial = getAvatarInitial(msg.authorUsername);
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
                    className="font-bold text-xs mb-1"
                    style={{ color: userColor.nameColor }}
                  >
                    {msg.authorUsername}
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
                      <span>{msg.replyTo.authorUsername}</span>
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

                  {isMine && <CheckCheck className="w-3.5 h-3.5 text-white/90" />}
                </div>
              </div>

              {/* Sender Avatar for other users */}
              {!isMine && (
                <div className="w-8 shrink-0 mb-0.5">
                  {isLastInGroup ? (
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-xs text-white shadow-2xs border border-white/10 bg-[#242f3d]"
                      title={msg.authorUsername}
                    >
                      {msg.authorAvatarUrl ? (
                        <img
                          src={msg.authorAvatarUrl}
                          alt={msg.authorUsername}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: userColor.bg }}
                        >
                          {avatarInitial}
                        </div>
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

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="الانتقال لآخر الرسائل"
          className="fixed bottom-20 left-6 sm:left-8 z-30 p-2.5 rounded-full bg-[#17212b] text-[#2AABEE] shadow-lg border border-slate-800 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in zoom-in-75"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

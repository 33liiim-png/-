import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Reply, X, Smile } from 'lucide-react';
import { sanitizeMessage } from '../utils/chatUtils';
import { ChatMessage, MessageReplyInfo } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, replyTo?: MessageReplyInfo) => Promise<boolean>;
  disabled?: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

const QUICK_EMOJIS = ['❤️', '👍', '😂', '🔥', '👏', '✨', '🌹', '😍', '🤲', '👌', '🎉', '☕', '⚡', '💯'];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  replyingTo,
  onCancelReply,
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiTrayRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when a reply is triggered
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [text]);

  // Close emoji tray on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiTrayRef.current &&
        !emojiTrayRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showEmojiPicker]);

  const handleSend = async () => {
    if (sending || disabled || !text.trim()) return;
    setErrorText(null);

    const validation = sanitizeMessage(text);
    if (!validation.valid) {
      if (validation.error && text.trim().length > 0) {
        setErrorText(validation.error);
      }
      return;
    }

    setSending(true);
    try {
      const replyPayload: MessageReplyInfo | undefined = replyingTo
        ? {
            id: replyingTo.id,
            authorUsername: replyingTo.authorUsername,
            authorDisplayName: replyingTo.authorDisplayName,
            text: replyingTo.text.slice(0, 150),
          }
        : undefined;

      const success = await onSendMessage(validation.cleaned!, replyPayload);
      if (success) {
        setText('');
        setShowEmojiPicker(false);
        if (onCancelReply) onCancelReply();
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.focus();
        }
      }
    } catch (err: any) {
      setErrorText('تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      } else if (replyingTo && onCancelReply) {
        onCancelReply();
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart || text.length;
    const end = textarea.selectionEnd || text.length;
    const newText = text.slice(0, start) + emoji + text.slice(end);

    if (newText.length <= 2000) {
      setText(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > 1800;
  const hasContent = text.trim().length > 0;

  return (
    <div className="p-2 sm:p-4 bg-[#17212b]/95 backdrop-blur-md border-t border-slate-800/80 shrink-0 z-20 pb-[calc(0.6rem+env(safe-area-inset-bottom,0px))]">
      {/* Error notification */}
      {errorText && (
        <div className="max-w-4xl mx-auto mb-2 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-900/80 text-red-300 text-xs text-right animate-in fade-in duration-150">
          {errorText}
        </div>
      )}

      {/* Quoted Replying Banner */}
      {replyingTo && (
        <div className="max-w-4xl mx-auto mb-2 px-3.5 py-2 rounded-2xl bg-[#242f3d]/90 border border-slate-700/60 border-r-3 border-r-[#2AABEE] flex items-center justify-between text-right shadow-md animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#2AABEE]/20 flex items-center justify-center text-[#2AABEE] shrink-0">
              <Reply className="w-4 h-4 rotate-180" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#2AABEE] leading-tight flex items-center gap-1.5">
                <span>الرد على</span>
                <span className="text-white">
                  {replyingTo.authorDisplayName || replyingTo.authorUsername}
                </span>
              </div>
              <div className="text-[11.5px] text-slate-300 truncate leading-tight mt-0.5">
                {replyingTo.text}
              </div>
            </div>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
              title="إلغاء الرد (Esc)"
              aria-label="إلغاء الرد"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Quick Emoji Reaction Bar (World-class messenger style) */}
      {showEmojiPicker && (
        <div
          ref={emojiTrayRef}
          className="max-w-4xl mx-auto mb-2 p-2 rounded-2xl bg-[#242f3d] border border-slate-700/70 shadow-2xl flex items-center gap-1 overflow-x-auto scrollbar-none animate-in fade-in zoom-in-95 duration-150 text-xl"
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-white/10 active:scale-90 flex items-center justify-center transition-all cursor-pointer select-none shrink-0"
              title={`إدراج ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Bar: Capsule + Circular Send Button */}
      <div className="flex items-end gap-2 sm:gap-3 max-w-4xl mx-auto w-full">
        {/* World-class Rounded Capsule */}
        <div className="flex-1 relative bg-[#242f3d]/95 hover:bg-[#242f3d] focus-within:bg-[#242f3d] rounded-[28px] border border-slate-700/60 focus-within:border-[#2AABEE] focus-within:ring-2 focus-within:ring-[#2AABEE]/25 shadow-sm transition-all duration-200 flex items-end pl-3 pr-2 py-1 min-h-[48px]">
          {/* Emoji Toggle Trigger */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            aria-label="لوحة الرموز التعبيرية"
            title="الرموز التعبيرية"
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-1 transition-all cursor-pointer ${
              showEmojiPicker
                ? 'text-[#2AABEE] bg-[#2AABEE]/15'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Flexible Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= 2000) {
                setText(e.target.value);
                if (errorText) setErrorText(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              replyingTo
                ? `اكتب ردك على ${replyingTo.authorDisplayName || replyingTo.authorUsername}...`
                : 'اكتب رسالة...'
            }
            disabled={disabled || sending}
            className="flex-1 py-2.5 px-3 text-sm text-white placeholder-slate-400 bg-transparent resize-none focus:outline-none max-h-32 min-h-[40px] leading-relaxed select-text"
          />

          {/* Near limit character alert */}
          {isNearLimit && (
            <span
              className={`text-[10px] pl-1 pb-2 shrink-0 ${
                charCount >= 2000 ? 'text-red-400 font-bold' : 'text-amber-400'
              }`}
            >
              {charCount}/2000
            </span>
          )}
        </div>

        {/* World-class Telegram-style Gradient Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!hasContent || sending || disabled}
          aria-label="إرسال الرسالة"
          title={hasContent ? 'إرسال (Enter)' : 'اكتب رسالة أولاً'}
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 select-none transition-all duration-200 ${
            hasContent && !sending && !disabled
              ? 'bg-gradient-to-tr from-[#229ED9] via-[#2AABEE] to-[#36b9fc] text-white shadow-[0_4px_16px_rgba(42,171,238,0.4)] hover:shadow-[0_6px_22px_rgba(42,171,238,0.55)] hover:scale-105 active:scale-95 cursor-pointer opacity-100 scale-100'
              : 'bg-[#242f3d] text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50 scale-95 shadow-none'
          }`}
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <Send className="w-5 h-5 rtl:-scale-x-100 transition-transform" />
          )}
        </button>
      </div>
    </div>
  );
};

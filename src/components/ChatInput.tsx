import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Reply, X } from 'lucide-react';
import { sanitizeMessage } from '../utils/chatUtils';
import { ChatMessage, MessageReplyInfo } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, replyTo?: MessageReplyInfo) => Promise<boolean>;
  disabled?: boolean;
  replyingTo?: ChatMessage | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  replyingTo,
  onCancelReply,
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = async () => {
    if (sending || disabled) return;
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
            text: replyingTo.text.slice(0, 150),
          }
        : undefined;

      const success = await onSendMessage(validation.cleaned!, replyPayload);
      if (success) {
        setText('');
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
    } else if (e.key === 'Escape' && replyingTo && onCancelReply) {
      onCancelReply();
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > 1800;

  return (
    <div className="p-3 sm:p-4 bg-[#17212b] border-t border-slate-800 shrink-0 z-20">
      {errorText && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-950/50 border border-red-900 text-red-300 text-xs text-right">
          {errorText}
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="max-w-4xl mx-auto mb-2 px-3 py-2 rounded-2xl bg-[#242f3d] border-r-3 border-[#2AABEE] flex items-center justify-between text-right animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-[#2AABEE]/20 flex items-center justify-center text-[#2AABEE] shrink-0">
              <Reply className="w-3.5 h-3.5 rotate-180" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-[#2AABEE] leading-tight">
                الرد على {replyingTo.authorUsername}
              </div>
              <div className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">
                {replyingTo.text}
              </div>
            </div>
          </div>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
              title="إلغاء الرد (Esc)"
              aria-label="إلغاء الرد"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Rounded Input Area */}
        <div className="flex-1 relative bg-[#242f3d] rounded-2xl border border-transparent focus-within:border-[#2AABEE]/50 focus-within:bg-[#202b36] transition-all">
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
            placeholder={replyingTo ? `اكتب ردك على ${replyingTo.authorUsername}...` : "اكتب رسالتك في المجلس..."}
            disabled={disabled || sending}
            className="w-full py-2.5 px-4 text-sm text-white placeholder-slate-400 bg-transparent resize-none focus:outline-none max-h-32 min-h-[42px] leading-relaxed"
          />

          {isNearLimit && (
            <span
              className={`absolute left-3 bottom-1.5 text-[10px] ${
                charCount >= 2000 ? 'text-red-400 font-bold' : 'text-amber-400'
              }`}
            >
              {charCount} / 2000
            </span>
          )}
        </div>

        {/* Circular Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          aria-label="إرسال الرسالة"
          className="w-11 h-11 rounded-full bg-[#2AABEE] hover:bg-[#229ED9] active:bg-[#1f8cc3] text-white flex items-center justify-center shrink-0 shadow-md transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {sending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5 -rotate-90 rtl:rotate-180 translate-x-[-1px]" />
          )}
        </button>
      </div>
    </div>
  );
};

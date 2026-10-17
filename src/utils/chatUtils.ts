/**
 * Pure utility functions for Majlis chat application.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  cleaned?: string;
}

/**
 * Validate and clean username:
 * - Format: like 'ahmed33', 'ali_99', lowercase alphanumeric + underscore
 * - Length between 3 and 20 characters
 * - Allows English letters (a-z), digits (0-9), and underscore (_)
 */
export function validateUsername(raw: string): ValidationResult {
  const username = (raw || '').trim().toLowerCase();
  if (!username) {
    return { valid: false, error: 'اسم المستخدم مطلوب' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'يجب أن يتكون اسم المستخدم من 3 أحرف على الأقل' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'يجب ألا يتجاوز اسم المستخدم 20 حرفاً' };
  }
  // Enforce english letters, numbers, and underscore like 'ahmed33'
  const regex = /^[a-z0-9_]+$/;
  if (!regex.test(username)) {
    return {
      valid: false,
      error: 'يجب أن يحتوي اسم المستخدم على أحرف إنجليزية صغيرة وأرقام فقط (مثل: user99)',
    };
  }
  return { valid: true, cleaned: username };
}

/**
 * Validate and sanitize chat message:
 * - Non-empty
 * - Max 2000 characters
 * - Strips excess whitespace
 */
export function sanitizeMessage(raw: string): ValidationResult {
  if (typeof raw !== 'string') {
    return { valid: false, error: 'الرسالة غير صالحة' };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'لا يمكن إرسال رسالة فارغة' };
  }
  if (trimmed.length > 2000) {
    return { valid: false, error: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)' };
  }
  return { valid: true, cleaned: trimmed };
}

/**
 * Formats a date into Arabic date label: "اليوم", "أمس", or localized Arabic date
 */
export function formatArabicDateSeparator(date: Date, now: Date = new Date()): string {
  const target = new Date(date);
  const current = new Date(now);

  target.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const diffTime = current.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'اليوم';
  }
  if (diffDays === 1) {
    return 'أمس';
  }

  try {
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: target.getFullYear() !== current.getFullYear() ? 'numeric' : undefined,
    }).format(date);
  } catch {
    return target.toLocaleDateString('ar');
  }
}

/**
 * Formats time in Arabic (e.g. 10:45 ص or 06:12 م)
 */
export function formatArabicTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Telegram-inspired distinct user color palette
 */
const TELEGRAM_PALETTE = [
  { bg: '#E17076', text: '#FFFFFF', name: '#D35400' },
  { bg: '#FAA774', text: '#FFFFFF', name: '#E67E22' },
  { bg: '#A695E7', text: '#FFFFFF', name: '#8E44AD' },
  { bg: '#7BC862', text: '#FFFFFF', name: '#27AE60' },
  { bg: '#6EC9CB', text: '#FFFFFF', name: '#16A085' },
  { bg: '#65AADD', text: '#FFFFFF', name: '#2980B9' },
  { bg: '#EE7AAE', text: '#FFFFFF', name: '#C0392B' },
  { bg: '#E579B1', text: '#FFFFFF', name: '#884EA0' },
];

export function getUserColor(username: string): { bg: string; text: string; nameColor: string } {
  if (!username) {
    return { bg: '#2AABEE', text: '#FFFFFF', nameColor: '#2AABEE' };
  }
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TELEGRAM_PALETTE.length;
  const choice = TELEGRAM_PALETTE[index];
  return {
    bg: choice.bg,
    text: choice.text,
    nameColor: choice.name,
  };
}

/**
 * Get first letter or avatar initial for display
 */
export function getAvatarInitial(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return 'م';
  return trimmed.charAt(0).toUpperCase();
}

/**
 * Expiration calculation for 14 days TTL
 */
export const TTL_DAYS = 14;
export const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export function getExpireAtDate(createdAt: Date): Date {
  return new Date(createdAt.getTime() + TTL_MS);
}

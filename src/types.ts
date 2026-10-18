export type UserStatus = 'none' | 'pending' | 'approved' | 'rejected';
export type UserRole = 'admin' | 'member';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  status: UserStatus;
  role: UserRole;
  avatarUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface MessageReplyInfo {
  id: string;
  authorUsername: string;
  authorDisplayName?: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName?: string;
  authorEmail: string;
  authorAvatarUrl?: string;
  text: string;
  replyTo?: MessageReplyInfo;
  readBy?: string[];
  createdAt: any;
  expireAt: any;
}

export const ADMIN_EMAIL = '33liiim@gmail.com';

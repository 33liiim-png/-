import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, MessageReplyInfo } from '../types';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { AdminModal } from './AdminModal';
import { TTL_MS, getExpireAtDate } from '../utils/chatUtils';

export const ChatRoom: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLimit, setMessagesLimit] = useState<number>(100);
  const [hasMoreEarlier, setHasMoreEarlier] = useState<boolean>(false);
  const [loadingEarlier, setLoadingEarlier] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Listen to pending requests count if admin
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setPendingCount(snapshot.size);
      },
      (err) => {
        console.warn('Pending users listener warning:', err);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Real-time listener for messages within the last 14 days, limited to messagesLimit
  useEffect(() => {
    if (!currentUser) return;

    const fourteenDaysAgo = new Date(Date.now() - TTL_MS);
    const messagesCol = collection(db, 'messages');

    // Query messages within last 14 days, ordered by createdAt desc to get the most recent ones
    const q = query(
      messagesCol,
      where('createdAt', '>=', fourteenDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(messagesLimit)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ChatMessage[] = [];
        snapshot.forEach((d) => {
          loaded.push(d.data() as ChatMessage);
        });

        // If returned messages equal the limit, there may be earlier messages
        setHasMoreEarlier(loaded.length >= messagesLimit);

        // Reverse so chronological order (earliest at top, newest at bottom)
        setMessages(loaded.reverse());
        setLoadingEarlier(false);
      },
      (error) => {
        console.error('Messages onSnapshot error:', error);
        handleFirestoreError(error, OperationType.LIST, 'messages');
      }
    );

    return () => unsubscribe();
  }, [currentUser, messagesLimit]);

  const handleLoadMore = () => {
    setLoadingEarlier(true);
    setMessagesLimit((prev) => prev + 50);
  };

  const handleSendMessage = async (
    text: string,
    replyTo?: MessageReplyInfo
  ): Promise<boolean> => {
    if (!currentUser || !userProfile) return false;

    try {
      const messagesCol = collection(db, 'messages');
      const newDocRef = doc(messagesCol);
      const now = new Date();
      const expireAtDate = getExpireAtDate(now);

      const messagePayload: ChatMessage = {
        id: newDocRef.id,
        authorId: currentUser.uid,
        authorUsername: userProfile.username,
        authorEmail: currentUser.email || '',
        text: text,
        createdAt: serverTimestamp(),
        expireAt: Timestamp.fromDate(expireAtDate),
      };

      if (userProfile.avatarUrl) {
        messagePayload.authorAvatarUrl = userProfile.avatarUrl;
      }

      if (replyTo) {
        messagePayload.replyTo = replyTo;
      }

      await setDoc(newDocRef, messagePayload);
      setReplyingTo(null);
      return true;
    } catch (error) {
      console.error('Send message error:', error);
      handleFirestoreError(error, OperationType.CREATE, 'messages');
      return false;
    }
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#17212b]">
      {/* Telegram-style Top Header */}
      <ChatHeader
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Real-time Message Stream */}
      <ChatMessageList
        messages={messages}
        loadingEarlier={loadingEarlier}
        hasMoreEarlier={hasMoreEarlier}
        onLoadMore={handleLoadMore}
        onReplyMessage={(msg) => setReplyingTo(msg)}
      />

      {/* Input Bar */}
      <ChatInput
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />

      {/* Admin Panel Modal */}
      {isAdmin && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}
    </div>
  );
};

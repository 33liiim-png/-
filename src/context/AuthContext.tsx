import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { UserProfile, ADMIN_EMAIL } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  logout: () => Promise<void>;
  requestToJoin: () => Promise<void>;
  createProfileWithUsername: (username: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateAvatar: (avatarUrl: string | null) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Monitor Auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        // Set up real-time listener for user profile document
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error listening to user profile:', error);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const isAdmin = currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isApproved = isAdmin || userProfile?.status === 'approved';

  const logout = async () => {
    await signOut(auth);
  };

  const requestToJoin = async () => {
    if (!currentUser || !userProfile) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        status: 'pending',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const createProfileWithUsername = async (username: string) => {
    if (!currentUser) return;
    const cleanUsername = username.trim();
    const isUserAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    // 1. Reserve username
    const usernameDocRef = doc(db, 'usernames', cleanUsername.toLowerCase());
    try {
      await setDoc(usernameDocRef, {
        uid: currentUser.uid,
        username: cleanUsername,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `usernames/${cleanUsername.toLowerCase()}`);
    }

    // 2. Create user profile
    const userDocRef = doc(db, 'users', currentUser.uid);
    const newProfile = {
      id: currentUser.uid,
      email: currentUser.email || '',
      username: cleanUsername,
      status: isUserAdmin ? 'approved' : 'none',
      role: isUserAdmin ? 'admin' : 'member',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userDocRef, newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    }
  };

  const updateAvatar = async (avatarUrl: string | null): Promise<boolean> => {
    if (!currentUser || !userProfile) return false;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };
      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      } else {
        updateData.avatarUrl = '';
      }
      await updateDoc(userDocRef, updateData);
      return true;
    } catch (error) {
      console.error('Update avatar error:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAdmin,
        isApproved,
        logout,
        requestToJoin,
        createProfileWithUsername,
        refreshProfile,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

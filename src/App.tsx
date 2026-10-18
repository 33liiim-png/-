import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { UsernameModal } from './components/UsernameModal';
import { GatekeeperScreen } from './components/GatekeeperScreen';
import { ChatRoom } from './components/ChatRoom';
import { AppLogo } from './components/AppLogo';
import { Loader2 } from 'lucide-react';

const MainView: React.FC = () => {
  const { currentUser, userProfile, loading, isApproved, createProfileWithUsername } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0e1621] text-[#f5f5f5] p-4">
        <AppLogo size="xl" withGlow className="mb-4 animate-pulse" />
        <h1 className="text-xl font-bold tracking-tight mb-2">مجلس</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-[#2AABEE]" />
          <span>جاري التحميل...</span>
        </div>
      </div>
    );
  }

  // 1. Not logged in -> Show Auth Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // 2. Logged in via email link or missing username -> Show Username Selection Modal
  if (!userProfile || !userProfile.username) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0e1621]">
        <UsernameModal onChooseUsername={createProfileWithUsername} />
      </div>
    );
  }

  // 3. Logged in, profile exists, but not approved yet -> Gatekeeper Screen
  if (!isApproved) {
    return <GatekeeperScreen />;
  }

  // 4. Approved member or admin -> Real-time Chat Room
  return <ChatRoom />;
};

export default function App() {
  return (
    <AuthProvider>
      <MainView />
    </AuthProvider>
  );
}

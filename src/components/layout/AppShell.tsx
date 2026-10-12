import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ConnectBoxScreen } from '../screens/ConnectBoxScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { RefillsScreen } from '../screens/RefillsScreen';
import { PrivacyDignityScreen } from '../screens/PrivacyDignityScreen';
import { SimulatorScreen } from '../screens/SimulatorScreen';
import LoginScreen from '../screens/LoginScreen';
import ConsentScreen from '../screens/ConsentScreen';
import InviteScreen from '../screens/InviteScreen';
import { GentleNudgeModal } from '../screens/GentleNudgeModal';
import { LegalModals } from '../screens/LegalModals';
import { BottomNav } from './BottomNav';
import {
  Smartphone,
  Maximize2,
  Box,
  Bell,
  EyeOff,
  Check,
  UserPlus,
  Lock,
  FileCheck,
  Crown,
  Eye
} from 'lucide-react';
import { ENV } from '../../lib/env';
import { DemoModeBanner } from './DemoModeBanner';

export const AppShell: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    currentTab,
    setCurrentTab,
    setNudgeModalOpen,
    toastMessage,
    showToast,
    parent,
    toggleSharingPause,
  } = useApp();

  const { authStep, isDemoMode, user, userRole, setUserRole } = useAuth();
  const [isFramed, setIsFramed] = useState<boolean>(true);

  const handleToggleSharing = () => {
    if (userRole !== 'admin') {
      showToast('Permission denied: Only family admins or Mom can toggle sharing.');
      return;
    }
    toggleSharingPause();
  };

  // Render the active view with strict authentication and role-based guards
  const renderActiveScreen = () => {
    // 1. Strict Authentication Guard:
    // If not in demo mode, unauthenticated users can NEVER access private screens
    if (!isDemoMode) {
      if (authStep === 'auth' || !user) return <LoginScreen />;
      if (authStep === 'consent') return <ConsentScreen />;
      if (authStep === 'onboarding') return <OnboardingScreen />;
    }

    // 2. Admin Route Protection (RBAC)
    // Protected admin-only screens: invite, connect-box, simulator
    const isAdminRoute = currentStep === 'invite' || currentStep === 'connect-box' || currentStep === 'simulator';
    if (isAdminRoute && userRole !== 'admin') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FCF6EE]">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 border border-amber-200 shadow-sm">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-bold text-lg text-[#1F4E4B]">
            Admin Access Required
          </h2>
          <p className="text-xs text-[#597573] mt-2 max-w-xs leading-relaxed">
            Only family admins have permission to {currentStep === 'invite' ? 'invite family members' : currentStep === 'connect-box' ? 'pair new CareBox hardware' : 'access hardware simulation tools'}.
          </p>
          <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium flex items-center gap-1.5 border border-slate-200">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Current Role: <strong>Viewer</strong> (Read Only)</span>
          </div>
          <button
            onClick={() => {
              setCurrentStep('main');
              setCurrentTab('today');
            }}
            className="mt-6 px-5 py-2.5 bg-[#2E7D79] hover:bg-[#246562] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Return to Today
          </button>
        </div>
      );
    }

    if (currentStep === 'welcome') return <OnboardingScreen />;
    if (currentStep === 'connect-box') return <ConnectBoxScreen />;
    if (currentStep === 'simulator') return <SimulatorScreen />;
    if (currentStep === 'login') return <LoginScreen />;
    if (currentStep === 'consent') return <ConsentScreen />;
    if (currentStep === 'invite') return <InviteScreen />;

    // Main app tabs
    switch (currentTab) {
      case 'today':
        return <TodayScreen />;
      case 'history':
        return <HistoryScreen />;
      case 'refills':
        return <RefillsScreen />;
      case 'settings':
        return <PrivacyDignityScreen />;
      default:
        return <TodayScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0ECE3] flex flex-col items-center justify-start text-[#1F4E4B]">
      {/* REVIEWER & DEMO TOOLBAR AT THE VERY TOP */}
      <header className="w-full bg-[#1F4E4B] text-white px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-md z-40 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="CareBox" className="w-5 h-5 invert" />
          <span className="font-heading font-bold text-sm tracking-tight">CareBox Family</span>
          <span className="bg-[#2E7D79] text-[10px] px-2 py-0.5 rounded-full font-medium">
            Phases 1–3 Ready
          </span>
        </div>

        {/* Quick Screen Jump Buttons (Development & Demo Only) */}
        {ENV.IS_DEVELOPMENT && (
          <div className="flex items-center gap-1 overflow-x-auto py-1">
            <button
              onClick={() => setCurrentStep('welcome')}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] ${
                currentStep === 'welcome' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
            >
              1. Welcome
            </button>
            <button
              onClick={() => setCurrentStep('connect-box')}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] ${
                currentStep === 'connect-box' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
            >
              2. Connect
            </button>
            <button
              onClick={() => setCurrentStep('login')}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] flex items-center gap-1 ${
                currentStep === 'login' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
              title="OTP & Google Auth"
            >
              <Lock className="w-3 h-3" />
              <span>Auth</span>
            </button>
            <button
              onClick={() => setCurrentStep('consent')}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] flex items-center gap-1 ${
                currentStep === 'consent' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
              title="DPDP Act 2023 Consent"
            >
              <FileCheck className="w-3 h-3" />
              <span>Consent</span>
            </button>
            <button
              onClick={() => {
                setCurrentStep('main');
                setCurrentTab('today');
              }}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] ${
                currentStep === 'main' && currentTab === 'today' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
            >
              3. Today
            </button>
            <button
              onClick={() => {
                setCurrentStep('main');
                setNudgeModalOpen(true);
              }}
              className="px-2 py-1 rounded-lg transition-colors text-[11px] bg-[#F2B33D] text-[#1F4E4B] font-bold flex items-center gap-1 hover:brightness-105"
              title="Preview Gentle Nudge Sheet (Screen 4)"
            >
              <Bell className="w-3 h-3" />
              <span>4. Nudge</span>
            </button>
            <button
              onClick={() => {
                setCurrentStep('main');
                setCurrentTab('history');
              }}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] ${
                currentStep === 'main' && currentTab === 'history' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
            >
              5. History
            </button>
            <button
              onClick={() => {
                setCurrentStep('main');
                setCurrentTab('refills');
              }}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] ${
                currentStep === 'main' && currentTab === 'refills' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
            >
              6. Refills
            </button>
            <button
              onClick={() => {
                setCurrentStep('main');
                setCurrentTab('settings');
              }}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] ${
                currentStep === 'main' && currentTab === 'settings' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
            >
              7. Privacy
            </button>
            <button
              onClick={() => setCurrentStep('invite')}
              className={`px-2 py-1 rounded-lg transition-colors text-[11px] flex items-center gap-1 ${
                currentStep === 'invite' ? 'bg-[#2E7D79] font-bold' : 'hover:bg-white/10'
              }`}
              title="Invite Family Member"
            >
              <UserPlus className="w-3 h-3" />
              <span>Invite</span>
            </button>
            <button
              onClick={() => setCurrentStep('simulator')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-[11px] font-semibold flex items-center gap-1 ${
                currentStep === 'simulator' ? 'bg-white text-[#1F4E4B]' : 'bg-[#2E7D79] text-white hover:bg-[#246562]'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>Box Simulator</span>
            </button>
          </div>
        )}

        {/* Framing & Quick Toggles */}
        <div className="flex items-center gap-2">
          {/* RBAC Role Switcher (Active in dev/demo mode) */}
          <button
            onClick={() => {
              const nextRole = userRole === 'admin' ? 'viewer' : 'admin';
              setUserRole(nextRole);
              showToast(`Switched active role to ${nextRole.toUpperCase()}`);
            }}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all ${
              userRole === 'admin'
                ? 'bg-amber-400 text-teal-950 font-bold shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Toggle RBAC Role (Admin vs Viewer)"
          >
            {userRole === 'admin' ? <Crown className="w-3 h-3 text-amber-900" /> : <Eye className="w-3 h-3 text-white" />}
            <span>{userRole === 'admin' ? 'Admin' : 'Viewer'}</span>
          </button>

          {/* Quick Sharing Pause Toggle */}
          <button
            onClick={handleToggleSharing}
            className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
              parent.sharingPaused ? 'bg-[#F2B33D] text-[#1F4E4B]' : 'bg-white/10 hover:bg-white/20'
            }`}
            title={userRole === 'admin' ? 'Toggle Parent Pause Sharing' : 'Admin only: Toggle sharing'}
          >
            <EyeOff className="w-3 h-3" />
            <span>{parent.sharingPaused ? 'Sharing Paused' : 'Live Sharing'}</span>
          </button>

          {/* Toggle Phone Frame */}
          <button
            onClick={() => setIsFramed(!isFramed)}
            className="p-1.5 rounded hover:bg-white/10 text-white/80 hover:text-white"
            title={isFramed ? 'Full screen view' : 'Phone frame view'}
            aria-label="Toggle frame mode"
          >
            {isFramed ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* DEMO MODE BANNER (When Supabase is disconnected) */}
      {isDemoMode && <DemoModeBanner />}

      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-14 z-50 px-4 py-2.5 bg-[#1F4E4B] text-white text-xs font-medium rounded-full shadow-float flex items-center gap-2 animate-bounce border border-white/20"
        >
          <Check className="w-4 h-4 text-[#27A348] stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN MOBILE DEVICE CANVAS */}
      <main
        className={`w-full flex-1 flex flex-col justify-center items-center p-0 sm:py-6 transition-all duration-300`}
      >
        <div
          className={`relative bg-[#FCF6EE] flex flex-col overflow-hidden transition-all duration-300 ${
            isFramed
              ? 'w-full max-w-[390px] h-[100dvh] sm:h-[844px] sm:rounded-[44px] sm:shadow-float sm:border-[8px] sm:border-[#1F4E4B]/80'
              : 'w-full max-w-lg min-h-screen'
          }`}
        >
          {/* Simulated Mobile Status Bar on Framed Mode */}
          {isFramed && (
            <div className="h-7 w-full bg-[#FCF6EE] shrink-0 flex items-center justify-between px-6 text-[11px] font-semibold text-[#1F4E4B] select-none pt-1">
              <span>9:47</span>
              {/* Dynamic island / speaker pill */}
              <div className="w-20 h-4 bg-black/10 rounded-full" />
              <div className="flex items-center gap-1.5 text-[10px]">
                <span>5G</span>
                <span className="w-4 h-2 border border-[#1F4E4B] rounded-sm relative flex items-center p-0.5">
                  <span className="w-2 h-1 bg-[#1F4E4B]" />
                </span>
              </div>
            </div>
          )}

          {/* Screen Content */}
          <div className="flex-1 overflow-y-auto flex flex-col relative">
            {renderActiveScreen()}
          </div>

          {/* Bottom Navigation (Only visible on main tabs) */}
          {currentStep === 'main' && <BottomNav />}
        </div>
      </main>

      {/* Global Modals */}
      <GentleNudgeModal />
      <LegalModals />
    </div>
  );
};

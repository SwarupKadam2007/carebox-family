/**
 * AuthContext — provides authentication state throughout the app.
 * Manages Supabase Auth session, user profile, and consent state.
 * When Supabase is not configured, immediately places app in demo mode.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, IS_SUPABASE_CONFIGURED } from '../lib/supabase';
import { signOut, checkUserConsents } from '../lib/authService';

export type AuthStep =
  | 'splash'        // Initial loading
  | 'auth'          // Login / Sign-up screen
  | 'consent'       // Terms & Privacy consent (first-time only)
  | 'onboarding'    // Role selection & family setup
  | 'ready';        // Authenticated & consented — show main app

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authStep: AuthStep;
  setAuthStep: (step: AuthStep) => void;
  isDemoMode: boolean;
  loginAsDemoUser: () => void;
  signOutUser: () => Promise<void>;
  userRole: 'admin' | 'viewer';
  setUserRole: (role: 'admin' | 'viewer') => void;
  consentsAccepted: { terms: boolean; privacy: boolean; medicineData: boolean };
  setConsentsAccepted: React.Dispatch<React.SetStateAction<{
    terms: boolean;
    privacy: boolean;
    medicineData: boolean;
  }>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@carebox.family',
  role: 'authenticated',
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { name: 'Swarup Kadam' },
} as User;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authStep, setAuthStep] = useState<AuthStep>('splash');
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('admin');
  const [consentsAccepted, setConsentsAccepted] = useState({
    terms: false,
    privacy: false,
    medicineData: false,
  });

  const isDemoMode = !IS_SUPABASE_CONFIGURED;

  useEffect(() => {
    // If Supabase is not configured, skip to demo mode after brief splash
    if (isDemoMode) {
      const timer = setTimeout(() => {
        setUser(DEMO_USER);
        setUserRole('admin');
        setAuthStep('auth'); // Still show auth screen for demo flow
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Helper to evaluate user state (consents -> family -> ready)
    const evaluateUserState = async (currentUser: User) => {
      // 1. Check mandatory DPDP consents
      const hasConsents = await checkUserConsents(currentUser.id);
      if (!hasConsents) {
        setAuthStep('consent');
        return;
      }

      // 2. Fetch role and active family membership
      try {
        const { data: memberRow } = await supabase
          .from('members')
          .select('role, family_id')
          .eq('user_id', currentUser.id)
          .eq('status', 'active')
          .limit(1)
          .single();

        if (memberRow) {
          setUserRole(memberRow.role === 'admin' ? 'admin' : 'viewer');
          setAuthStep('ready');
        } else {
          // User authenticated & consented, but has not set up or joined a family yet
          setAuthStep('onboarding');
        }
      } catch {
        setAuthStep('onboarding');
      }
    };

    // Check existing session
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setUser(data.session.user);
        setSession(data.session);
        await evaluateUserState(data.session.user);
      } else {
        setAuthStep('auth');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setUser(newSession?.user ?? null);
        setSession(newSession);
        if (newSession?.user) {
          await evaluateUserState(newSession.user);
        } else {
          setAuthStep('auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const loginAsDemoUser = useCallback(() => {
    setUser(DEMO_USER);
    setUserRole('admin');
    setConsentsAccepted({ terms: true, privacy: true, medicineData: true });
    setAuthStep('ready');
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut();
    setUser(null);
    setSession(null);
    setUserRole('viewer');
    setAuthStep('auth');
    setConsentsAccepted({ terms: false, privacy: false, medicineData: false });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      authStep,
      setAuthStep,
      isDemoMode,
      loginAsDemoUser,
      signOutUser,
      userRole,
      setUserRole,
      consentsAccepted,
      setConsentsAccepted,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: DEMO_USER,
      session: null,
      authStep: 'ready',
      setAuthStep: () => {},
      isDemoMode: true,
      loginAsDemoUser: () => {},
      signOutUser: async () => {},
      userRole: 'admin',
      setUserRole: () => {},
      consentsAccepted: { terms: true, privacy: true, medicineData: true },
      setConsentsAccepted: () => {},
    };
  }
  return ctx;
};


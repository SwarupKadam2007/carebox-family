/**
 * AuthContext — provides authentication state throughout the app.
 * Manages Supabase Auth session, user profile, and consent state.
 * When Supabase is not configured, immediately places app in demo mode.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, IS_SUPABASE_CONFIGURED } from '../lib/supabase';
import { signOut } from '../lib/authService';

export type AuthStep =
  | 'splash'        // Initial loading
  | 'auth'          // Login / Sign-up screen
  | 'consent'       // Terms & Privacy consent (first-time only)
  | 'ready';        // Authenticated & consented — show main app

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authStep: AuthStep;
  setAuthStep: (step: AuthStep) => void;
  isDemoMode: boolean;
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

    // Check existing session
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        setUser(data.session.user);
        setSession(data.session);

        // Fetch user's role from members table for active family (least-privilege default: 'viewer')
        try {
          const { data: memberRow } = await supabase
            .from('members')
            .select('role')
            .eq('user_id', data.session.user.id)
            .eq('status', 'active')
            .limit(1)
            .single();

          if (memberRow?.role === 'admin') {
            setUserRole('admin');
          } else {
            setUserRole('viewer');
          }
        } catch {
          setUserRole('viewer');
        }

        // Check if consents exist to skip consent screen
        setAuthStep('ready');
      } else {
        setAuthStep('auth');
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setUser(newSession?.user ?? null);
        setSession(newSession);
        if (newSession) {
          try {
            const { data: memberRow } = await supabase
              .from('members')
              .select('role')
              .eq('user_id', newSession.user.id)
              .eq('status', 'active')
              .limit(1)
              .single();

            setUserRole(memberRow?.role === 'admin' ? 'admin' : 'viewer');
          } catch {
            setUserRole('viewer');
          }
          setAuthStep('ready');
        } else {
          setAuthStep('auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

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
      signOutUser: async () => {},
      userRole: 'admin',
      setUserRole: () => {},
      consentsAccepted: { terms: true, privacy: true, medicineData: true },
      setConsentsAccepted: () => {},
    };
  }
  return ctx;
};


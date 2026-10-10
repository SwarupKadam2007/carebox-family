/**
 * Auth Service — handles sign-in, sign-up, OTP, Google OAuth, session management
 * Wraps Supabase Auth with graceful mock fallback for Phase 1 demo mode.
 */
import { supabase, IS_SUPABASE_CONFIGURED } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

/** Sign in with Email OTP — sends magic link / OTP to user's email */
export async function signInWithEmailOTP(email: string): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) {
    console.warn('[CareBox] Supabase not configured — using demo OTP bypass.');
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  return { error: error?.message ?? null };
}

/** Verify OTP token entered by user */
export async function verifyEmailOTP(email: string, token: string): Promise<AuthResult> {
  if (!IS_SUPABASE_CONFIGURED) {
    console.warn('[CareBox] Demo mode — OTP bypass with mock user.');
    return {
      user: { id: '00000000-0000-0000-0000-000000000001', email } as User,
      session: null,
      error: null,
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    error: error?.message ?? null,
  };
}

/** Sign in with Google OAuth */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) {
    console.warn('[CareBox] Demo mode — Google sign-in bypassed.');
    return { error: null };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  return { error: error?.message ?? null };
}

/** Get current session */
export async function getSession(): Promise<{ session: Session | null; error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) {
    return { session: null, error: null };
  }
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error: error?.message ?? null };
}

/** Sign out */
export async function signOut(): Promise<void> {
  if (!IS_SUPABASE_CONFIGURED) return;
  await supabase.auth.signOut();
}

/** Create or update a user's profile row after first sign-in */
export async function upsertProfile(userId: string, name: string): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) return { error: null };

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, name } as any)
    .select();

  return { error: error?.message ?? null };
}

/** Record consent acceptance (terms, privacy, medicine_data) */
export async function recordConsent(
  userId: string,
  document: 'terms' | 'privacy' | 'medicine_data',
  version: string
): Promise<{ error: string | null }> {
  if (!IS_SUPABASE_CONFIGURED) return { error: null };

  const { error } = await supabase
    .from('consents')
    .insert({ user_id: userId, document, version } as any);

  return { error: error?.message ?? null };
}

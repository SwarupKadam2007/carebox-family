/**
 * Environment Configuration & Security Validator
 * Validates environment variables at runtime, prevents service role key exposure,
 * and ensures safe fallback handling for client builds.
 */

// Defensive check to ensure no service_role key is bundled into the client
function isServiceRoleKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      // Decode JWT payload safely
      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson);
      if (payload?.role === 'service_role') {
        return true;
      }
    }
  } catch {
    // If decoding fails, continue
  }
  return false;
}

function validateUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      console.error('[CareBox Security] Invalid protocol for VITE_SUPABASE_URL. Must be HTTPS.');
      return '';
    }
    // In production, force HTTPS
    if (import.meta.env.PROD && parsed.protocol !== 'https:') {
      console.error('[CareBox Security] Insecure HTTP protocol blocked in production.');
      return '';
    }
    return trimmed;
  } catch {
    console.error('[CareBox Security] Malformed VITE_SUPABASE_URL:', trimmed);
    return '';
  }
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const rawAppEnv = import.meta.env.VITE_APP_ENV ?? (import.meta.env.MODE as string) ?? 'development';

// Guard: NEVER allow a service role key in the browser
if (isServiceRoleKey(rawAnonKey)) {
  const errMsg = '[CRITICAL SECURITY ERROR] A Supabase service_role key was provided in VITE_SUPABASE_ANON_KEY! Service role keys have admin access and MUST NEVER be exposed in the frontend bundle. Halting client configuration.';
  console.error(errMsg);
  throw new Error(errMsg);
}

export const ENV = {
  APP_ENV: (rawAppEnv === 'production' ? 'production' : rawAppEnv === 'test' ? 'test' : 'development') as 'development' | 'production' | 'test',
  IS_PRODUCTION: import.meta.env.PROD || rawAppEnv === 'production',
  IS_DEVELOPMENT: import.meta.env.DEV && rawAppEnv !== 'production',
  // Debug mode is explicitly FALSE in production
  IS_DEBUG_MODE: import.meta.env.DEV && rawAppEnv !== 'production',
  SUPABASE_URL: validateUrl(rawUrl),
  SUPABASE_ANON_KEY: rawAnonKey.trim(),
  VAPID_PUBLIC_KEY: (import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '').trim(),
} as const;

export const IS_SUPABASE_CONFIGURED = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);

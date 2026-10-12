/**
 * Supabase client singleton
 * Falls back gracefully when env variables are missing (Phase 1 mock mode)
 */
import { createClient } from '@supabase/supabase-js';
import { ENV, IS_SUPABASE_CONFIGURED } from './env';

export { IS_SUPABASE_CONFIGURED };

export const supabase = createClient(
  ENV.SUPABASE_URL || 'https://placeholder.supabase.co',
  ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export default supabase;

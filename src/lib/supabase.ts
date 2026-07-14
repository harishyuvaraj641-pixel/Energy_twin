import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Demo mode is active when Supabase credentials are not configured.
 * In demo mode, authentication uses predefined demo users and
 * all data is generated locally via the simulation engine.
 */
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

/**
 * Supabase client instance.
 * Returns null in demo mode — consumers must check `isDemoMode` before using.
 */
export const supabase: SupabaseClient | null = !isDemoMode
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

/** A client that acts as the caller: their JWT goes on every query, so Postgres RLS does the isolation. */
export const clientFor = (token: string): SupabaseClient =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

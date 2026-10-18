import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

type ClientFactory = (token: string) => SupabaseClient;

const defaultFactory: ClientFactory = (token) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

let factory = defaultFactory;

export const setClientFactory = (custom?: ClientFactory) => {
  factory = custom ?? defaultFactory;
};

/** A client that acts as the caller: their JWT goes on every query, so Postgres RLS does the isolation. */
export const clientFor = (token: string): SupabaseClient => factory(token);


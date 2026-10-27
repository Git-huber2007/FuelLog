import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';

/**
 * Columns required by active application code.
 *
 * ATTENTION DEVELOPERS / MIGRATION AUTHORS:
 * Whenever you add a new database migration that introduces columns that the server
 * or client depends on, extend this list with the table and required column(s).
 */
export const REQUIRED_SCHEMA: ReadonlyArray<{ table: string; columns: string }> = [
  { table: 'profiles', columns: 'level,program' },
  { table: 'workout_sets', columns: 'incline_pct' },
  { table: 'daily_checks', columns: 'steps,skipped_exercises' },
];

let anonSb: SupabaseClient | undefined;
let clientOverride: (() => SupabaseClient) | undefined;

export function setSchemaCheckClient(custom?: () => SupabaseClient) {
  clientOverride = custom;
}

export function getAnonClient(): SupabaseClient {
  if (clientOverride) return clientOverride();
  anonSb ??= createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return anonSb;
}

export interface SchemaCheckResult {
  ok: boolean;
  missing?: string;
}

export async function checkRequiredSchema(sb?: SupabaseClient): Promise<SchemaCheckResult> {
  const client = sb ?? getAnonClient();

  for (const { table, columns } of REQUIRED_SCHEMA) {
    const { error } = await client.from(table).select(columns).limit(0);
    if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
      console.error(`Database schema is missing required column on ${table}: ${columns} (Postgres error ${error.code ?? 'unknown'}: ${error.message})`);
      return { ok: false, missing: `${table}.${columns}` };
    }
  }

  return { ok: true };
}

import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';
import { HttpError, unwrap } from '../middleware/errors';

export type AiKind = 'parse_text' | 'parse_photo' | 'weekly_coach';

// A failed AI call counts as one use.
// Note: Rows older than 7 days should be removed by a scheduled job (see 0007_hardening.sql).
export async function getRecentAiCount(sb: SupabaseClient): Promise<number> {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { count, error } = await sb.from('ai_usage').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if (error) unwrap({ data: null, error });
  return count ?? 0;
}

/**
 * Before recording a use (`afterInsert` false) refuses at the limit, so no row is added;
 * after recording it allows the row just inserted, which catches concurrent burst calls.
 */
async function quota(sb: SupabaseClient, afterInsert: boolean): Promise<void> {
  const count = await getRecentAiCount(sb);
  if (count > env.AI_DAILY_LIMIT - (afterInsert ? 0 : 1)) {
    throw new HttpError(429, 'ai_limit', `You have used all ${env.AI_DAILY_LIMIT} AI requests for today. You can still log manually, and AI is back tomorrow.`);
  }
}

export const checkAiQuota = (sb: SupabaseClient) => quota(sb, false);
export const assertAiQuota = (sb: SupabaseClient) => quota(sb, true);

export async function recordAiUse(sb: SupabaseClient, userId: string, kind: AiKind): Promise<void> {
  unwrap(await sb.from('ai_usage').insert({ user_id: userId, kind }));
}


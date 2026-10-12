import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';
import { HttpError, unwrap } from '../middleware/errors';

export type AiKind = 'parse_text' | 'parse_photo' | 'weekly_coach';

// A failed AI call counts as one use.
export async function assertAiQuota(sb: SupabaseClient): Promise<void> {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { count, error } = await sb.from('ai_usage').select('id', { count: 'exact', head: true }).gte('created_at', since);
  if (error) unwrap({ data: null, error });
  if ((count ?? 0) > env.AI_DAILY_LIMIT) {
    throw new HttpError(429, 'ai_limit', `You have used all ${env.AI_DAILY_LIMIT} AI requests for today. You can still log manually, and AI is back tomorrow.`);
  }
}

export async function recordAiUse(sb: SupabaseClient, userId: string, kind: AiKind): Promise<void> {
  unwrap(await sb.from('ai_usage').insert({ user_id: userId, kind }));
}

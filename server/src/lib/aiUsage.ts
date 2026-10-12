import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env';
import { HttpError, unwrap } from '../middleware/errors';

export type AiKind = 'parse_text' | 'parse_photo' | 'weekly_coach';

export async function assertAiQuota(sb: SupabaseClient): Promise<void> {
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { count, error } = await sb.from('ai_usage').select('id', { count: 'exact', head: true }).gte('created_at', since).eq('failed', false);
  if (error) unwrap({ data: null, error });
  if ((count ?? 0) >= env.AI_DAILY_LIMIT) {
    throw new HttpError(429, 'ai_limit', `You have used all ${env.AI_DAILY_LIMIT} AI requests for today. You can still log manually, and AI is back tomorrow.`);
  }
}

export async function recordAiUse(sb: SupabaseClient, userId: string, kind: AiKind): Promise<number> {
  const row = unwrap<{ id: number }>(await sb.from('ai_usage').insert({ user_id: userId, kind }).select('id').single());
  return row.id;
}

export async function clearAiUse(sb: SupabaseClient, id: number): Promise<void> {
  // shortcut: users can mark their own rows failed to reclaim quota, upgrade to a service-role key or security-definer function if abuse occurs
  unwrap(await sb.from('ai_usage').update({ failed: true }).eq('id', id));
}


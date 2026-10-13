import { Router } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { addDays, adjustmentAdvice, clampAdjust, computeTargets, ProfileInput, type Profile, type ProfileResponse, type Targets, type Weigh } from '@fuellog/shared';
import { aiEnabled } from '../lib/gemini';
import { h, HttpError, unwrap } from '../middleware/errors';
import { validate } from '../middleware/validate';

export function targetsOf(p: Profile, dayDelta = 0): Targets | null {
  if (!p.sex || p.age === null || p.height_cm === null || p.weight_kg === null) return null;
  return computeTargets({ sex: p.sex, age: p.age, height_cm: p.height_cm, weight_kg: p.weight_kg, goal: p.goal, kcal_adjust: p.kcal_adjust }, dayDelta);
}

/** Targets for an onboarded user; routes that need them refuse anyone who has not finished onboarding. */
export function requireTargets(p: Profile, dayDelta = 0): Targets {
  const targets = targetsOf(p, dayDelta);
  if (!targets) throw new HttpError(400, 'not_onboarded', 'Finish setting up your profile first.');
  return targets;
}

export const loadProfile = async (sb: SupabaseClient, userId: string): Promise<Profile> =>
  unwrap(await sb.from('profiles').select('*').eq('id', userId).single());

export const loadWeights = async (sb: SupabaseClient, today: string): Promise<Weigh[]> =>
  unwrap(await sb.from('weight_logs').select('log_date,weight_kg').gte('log_date', addDays(today, -89)).lte('log_date', today).order('log_date'));

const respond = (profile: Profile): ProfileResponse => ({ profile, targets: targetsOf(profile), aiEnabled: aiEnabled() });

export const profileRouter = Router();

profileRouter.get('/profile', h(async (req, res) => {
  res.json(respond(await loadProfile(req.sb, req.userId)));
}));

profileRouter.put('/profile', validate({ body: ProfileInput }), h(async (req, res) => {
  const updated: Profile = unwrap(await req.sb.from('profiles').update({ ...req.body, onboarded: true }).eq('id', req.userId).select().single());
  res.json(respond(updated));
}));

profileRouter.post('/profile/adjustment', h(async (req, res) => {
  const [profile, weights] = await Promise.all([loadProfile(req.sb, req.userId), loadWeights(req.sb, req.today)]);
  const advice = adjustmentAdvice({ weights, goal: profile.goal, today: req.today, lastAdjustedOn: profile.last_adjusted_on });
  if (advice.status !== 'adjust') throw new HttpError(400, 'no_adjustment', 'There is no adjustment to apply right now.');
  const updated: Profile = unwrap(
    await req.sb
      .from('profiles')
      .update({ kcal_adjust: clampAdjust(profile.kcal_adjust + advice.delta), last_adjusted_on: req.today })
      .eq('id', req.userId)
      .select()
      .single(),
  );
  res.json(respond(updated));
}));

profileRouter.delete('/account', h(async (req, res) => {
  const { data: files, error: listError } = await req.sb.storage.from('progress-photos').list(req.userId);
  if (listError) {
    throw new HttpError(500, 'storage_error', 'Could not inspect stored photos. Account was not deleted.');
  }

  if (files && files.length > 0) {
    const paths = files.map((f) => `${req.userId}/${f.name}`);
    const { error: removeError } = await req.sb.storage.from('progress-photos').remove(paths);
    if (removeError) {
      throw new HttpError(500, 'storage_error', 'Could not remove stored photos. Account was not deleted.');
    }
  }

  const { error: rpcError } = await req.sb.rpc('delete_my_account');
  if (rpcError) {
    throw new HttpError(500, 'delete_failed', 'Could not delete account.');
  }

  res.status(204).end();
}));

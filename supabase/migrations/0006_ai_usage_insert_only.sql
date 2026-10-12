-- Migration 0006: ai_usage allows its owner to select and insert only.
-- Safe to run multiple times.
-- Remove the update policy so users cannot mark rows failed to reclaim daily quota.
-- The failed column remains in place, unused.

drop policy if exists ai_usage_update on public.ai_usage;

drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = auth.uid());

drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (user_id = auth.uid());

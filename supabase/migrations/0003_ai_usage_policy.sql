-- Migration 0003: Restrict ai_usage row-level security to select, insert and failure marking only.
-- Safe to run multiple times.

alter table public.ai_usage add column if not exists failed boolean not null default false;

drop policy if exists ai_usage_owner on public.ai_usage;

drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = auth.uid());

drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (user_id = auth.uid());

drop policy if exists ai_usage_update on public.ai_usage;
create policy ai_usage_update on public.ai_usage for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and failed = true);

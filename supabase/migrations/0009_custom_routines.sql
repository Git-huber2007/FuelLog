-- Migration 0009: Custom routines support.
-- Safe to run more than once.

create table if not exists public.routine_days (
  user_id    uuid not null references auth.users(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  title      text not null default '' check (char_length(title) <= 40),
  exercises  jsonb not null default '[]'::jsonb
             check (jsonb_typeof(exercises) = 'array' and jsonb_array_length(exercises) <= 15),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, weekday)
);

-- Enable RLS
alter table public.routine_days enable row level security;

-- Policies matching 0007 hardening style
drop policy if exists routine_days_select on public.routine_days;
create policy routine_days_select on public.routine_days for select to authenticated using (user_id = auth.uid());

drop policy if exists routine_days_insert on public.routine_days;
create policy routine_days_insert on public.routine_days for insert to authenticated with check (user_id = auth.uid());

drop policy if exists routine_days_update on public.routine_days;
create policy routine_days_update on public.routine_days for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists routine_days_delete on public.routine_days;
create policy routine_days_delete on public.routine_days for delete to authenticated using (user_id = auth.uid());

-- Extend profiles.program check constraint to include 'custom'
alter table public.profiles drop constraint if exists profiles_program_check;
alter table public.profiles add constraint profiles_program_check
  check (program in ('full_body', 'upper_lower', 'six_day', 'custom'));

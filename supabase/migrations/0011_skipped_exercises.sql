-- Planned exercises the user chose to skip on a given day. Safe to run more than once.
alter table public.daily_checks
  add column if not exists skipped_exercises text[] not null default '{}'
  check (coalesce(array_length(skipped_exercises, 1), 0) <= 50);

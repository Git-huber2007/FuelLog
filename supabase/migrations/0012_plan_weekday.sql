-- The weekday whose plan the user chose to train on a date, when it is not that date's own. Safe to run more than once.
alter table public.daily_checks
  add column if not exists plan_weekday smallint
  check (plan_weekday between 0 and 6);

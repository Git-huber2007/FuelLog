-- Daily step count, typed in by the user. Safe to run more than once.
alter table public.daily_checks
  add column if not exists steps int not null default 0 check (steps between 0 and 100000);

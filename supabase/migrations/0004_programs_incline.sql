-- Training level and weekly program on the profile, and an incline for cardio rows. Safe to run more than once.
alter table public.profiles
  add column if not exists level   text not null default 'beginner' check (level in ('beginner','intermediate','expert')),
  add column if not exists program text not null default 'six_day'  check (program in ('full_body','upper_lower','six_day'));

alter table public.workout_sets
  add column if not exists incline_pct numeric(4,1) check (incline_pct between -15 and 40);

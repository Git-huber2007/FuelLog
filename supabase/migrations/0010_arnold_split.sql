-- Extend profiles.program check constraint to include 'arnold_six_day'
alter table public.profiles drop constraint if exists profiles_program_check;
alter table public.profiles add constraint profiles_program_check
  check (program in ('full_body', 'upper_lower', 'six_day', 'arnold_six_day', 'custom'));

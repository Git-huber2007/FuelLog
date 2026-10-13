create extension if not exists pgcrypto;

do $$ begin
  create type sex_type as enum ('male','female');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type goal_type as enum ('cut','maintain','gain');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type meal_type as enum ('breakfast','lunch','dinner','snack');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type log_source as enum ('list','custom','ai_text','ai_photo','barcode','saved_meal');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  sex              sex_type,
  age              int          check (age between 14 and 90),
  height_cm        numeric(5,1) check (height_cm between 120 and 230),
  weight_kg        numeric(5,1) check (weight_kg between 30 and 250),
  goal             goal_type not null default 'maintain',
  kcal_adjust      int  not null default 0 check (kcal_adjust between -600 and 600),
  last_adjusted_on date check (last_adjusted_on is null or last_adjusted_on >= '2020-01-01'),
  level            text not null default 'beginner' check (level in ('beginner','intermediate','expert')),
  program          text not null default 'six_day'  check (program in ('full_body','upper_lower','six_day')),
  onboarded        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.foods (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users(id) on delete cascade, -- null = global seed food
  name          text not null check (char_length(name) between 1 and 80),
  serving_label text not null default '1 serving' check (char_length(serving_label) <= 40),
  kcal          numeric(7,1) not null check (kcal >= 0 and kcal <= 5000),
  protein_g     numeric(6,1) not null default 0 check (protein_g >= 0 and protein_g <= 1000),
  carbs_g       numeric(6,1) not null default 0 check (carbs_g >= 0 and carbs_g <= 1000),
  fat_g         numeric(6,1) not null default 0 check (fat_g >= 0 and fat_g <= 1000),
  fibre_g       numeric(6,1) not null default 0 check (fibre_g >= 0 and fibre_g <= 1000),
  category      text not null default 'prepared',
  barcode       text,
  created_at    timestamptz not null default now()
);
create unique index if not exists foods_owner_name_uq on public.foods (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index if not exists foods_barcode_idx on public.foods (barcode) where barcode is not null;

create table if not exists public.food_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null check (log_date >= '2020-01-01'),
  meal       meal_type not null,
  food_id    uuid references public.foods(id) on delete set null,
  name       text not null check (char_length(name) between 1 and 120),
  servings   numeric(5,2) not null default 1 check (servings > 0 and servings <= 50),
  kcal       numeric(7,1) not null check (kcal >= 0 and kcal <= 10000),   -- totals for this entry, snapshotted at log time
  protein_g  numeric(6,1) not null default 0 check (protein_g >= 0 and protein_g <= 1000),
  carbs_g    numeric(6,1) not null default 0 check (carbs_g >= 0 and carbs_g <= 1000),
  fat_g      numeric(6,1) not null default 0 check (fat_g >= 0 and fat_g <= 1000),
  fibre_g    numeric(6,1) not null default 0 check (fibre_g >= 0 and fibre_g <= 1000),
  source     log_source not null default 'list',
  created_at timestamptz not null default now()
);
create index if not exists food_logs_user_date_idx on public.food_logs (user_id, log_date);

create table if not exists public.saved_meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  items      jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50 and octet_length(items::text) <= 20480), -- array of {name, kcal, protein_g, carbs_g, fat_g, fibre_g}
  created_at timestamptz not null default now()
);

create table if not exists public.daily_checks (
  user_id       uuid not null references auth.users(id) on delete cascade,
  log_date      date not null check (log_date >= '2020-01-01'),
  water_ml      int not null default 0 check (water_ml between 0 and 10000),
  sleep_hours   numeric(3,1) check (sleep_hours between 0 and 16),
  creatine      boolean not null default false,
  protein_shake boolean not null default false,
  steps         int not null default 0 check (steps between 0 and 100000),
  primary key (user_id, log_date)
);

create table if not exists public.weight_logs (
  user_id   uuid not null references auth.users(id) on delete cascade,
  log_date  date not null check (log_date >= '2020-01-01'),
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 250),
  primary key (user_id, log_date)
);

create table if not exists public.measurements (
  user_id  uuid not null references auth.users(id) on delete cascade,
  log_date date not null check (log_date >= '2020-01-01'),
  waist_cm numeric(5,1) check (waist_cm between 30 and 250),
  chest_cm numeric(5,1) check (chest_cm between 30 and 250),
  arm_cm   numeric(5,1) check (arm_cm between 10 and 100),
  primary key (user_id, log_date)
);

create table if not exists public.workout_sets (
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null check (log_date >= '2020-01-01'),
  exercise_key text not null check (char_length(exercise_key) <= 60),
  set_number   int  not null check (set_number between 1 and 10),
  weight_kg    numeric(5,1) not null default 0 check (weight_kg between 0 and 500),
  reps         int  not null default 0 check (reps between 0 and 200),
  incline_pct  numeric(4,1) check (incline_pct between -15 and 40),
  primary key (user_id, log_date, exercise_key, set_number)
);
create index if not exists workout_sets_exercise_idx on public.workout_sets (user_id, exercise_key, log_date desc);

create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null check (log_date >= '2020-01-01'),
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table if not exists public.ai_usage (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('parse_text','parse_photo','weekly_coach')),
  failed     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_time_idx on public.ai_usage (user_id, created_at desc);

-- Account deletion
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Dynamic date checks (not more than 1 day in future)
create or replace function public.check_log_date_bounds() returns trigger
language plpgsql as $$
begin
  if new.log_date < '2020-01-01'::date or new.log_date > (current_date + interval '1 day')::date then
    raise exception 'Date out of allowed range: must be between 2020-01-01 and 1 day in the future';
  end if;
  return new;
end;
$$;

create or replace function public.check_profile_date_bounds() returns trigger
language plpgsql as $$
begin
  if new.last_adjusted_on is not null and (new.last_adjusted_on < '2020-01-01'::date or new.last_adjusted_on > (current_date + interval '1 day')::date) then
    raise exception 'Date out of allowed range: must be between 2020-01-01 and 1 day in the future';
  end if;
  return new;
end;
$$;

drop trigger if exists food_logs_date_check on public.food_logs;
create trigger food_logs_date_check before insert or update on public.food_logs
  for each row execute function public.check_log_date_bounds();

drop trigger if exists daily_checks_date_check on public.daily_checks;
create trigger daily_checks_date_check before insert or update on public.daily_checks
  for each row execute function public.check_log_date_bounds();

drop trigger if exists weight_logs_date_check on public.weight_logs;
create trigger weight_logs_date_check before insert or update on public.weight_logs
  for each row execute function public.check_log_date_bounds();

drop trigger if exists measurements_date_check on public.measurements;
create trigger measurements_date_check before insert or update on public.measurements
  for each row execute function public.check_log_date_bounds();

drop trigger if exists workout_sets_date_check on public.workout_sets;
create trigger workout_sets_date_check before insert or update on public.workout_sets
  for each row execute function public.check_log_date_bounds();

drop trigger if exists progress_photos_date_check on public.progress_photos;
create trigger progress_photos_date_check before insert or update on public.progress_photos
  for each row execute function public.check_log_date_bounds();

drop trigger if exists profiles_date_check on public.profiles;
create trigger profiles_date_check before insert or update on public.profiles
  for each row execute function public.check_profile_date_bounds();

-- Row caps by before-insert triggers
create or replace function public.check_foods_row_cap() returns trigger
language plpgsql as $$
declare food_count int;
begin
  if new.owner_id is not null then
    select count(*) into food_count from public.foods where owner_id = new.owner_id;
    if food_count >= 500 then raise exception 'Custom food limit reached (maximum 500 custom foods per user)'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists foods_row_cap on public.foods;
create trigger foods_row_cap before insert on public.foods for each row execute function public.check_foods_row_cap();

create or replace function public.check_food_logs_row_cap() returns trigger
language plpgsql as $$
declare day_count int;
begin
  select count(*) into day_count from public.food_logs where user_id = new.user_id and log_date = new.log_date;
  if day_count >= 200 then raise exception 'Daily food log limit reached (maximum 200 food logs per day)'; end if;
  return new;
end;
$$;
drop trigger if exists food_logs_row_cap on public.food_logs;
create trigger food_logs_row_cap before insert on public.food_logs for each row execute function public.check_food_logs_row_cap();

create or replace function public.check_saved_meals_row_cap() returns trigger
language plpgsql as $$
declare meal_count int;
begin
  select count(*) into meal_count from public.saved_meals where user_id = new.user_id;
  if meal_count >= 100 then raise exception 'Saved meal limit reached (maximum 100 saved meals per user)'; end if;
  return new;
end;
$$;
drop trigger if exists saved_meals_row_cap on public.saved_meals;
create trigger saved_meals_row_cap before insert on public.saved_meals for each row execute function public.check_saved_meals_row_cap();

create or replace function public.check_workout_sets_row_cap() returns trigger
language plpgsql as $$
declare set_count int;
begin
  select count(*) into set_count from public.workout_sets where user_id = new.user_id and log_date = new.log_date;
  if set_count >= 100 then raise exception 'Daily workout set limit reached (maximum 100 workout sets per day)'; end if;
  return new;
end;
$$;
drop trigger if exists workout_sets_row_cap on public.workout_sets;
create trigger workout_sets_row_cap before insert on public.workout_sets for each row execute function public.check_workout_sets_row_cap();

create or replace function public.check_progress_photos_row_cap() returns trigger
language plpgsql as $$
declare photo_count int;
begin
  select count(*) into photo_count from public.progress_photos where user_id = new.user_id;
  if photo_count >= 60 then raise exception 'Progress photo limit reached (maximum 60 photos per user)'; end if;
  return new;
end;
$$;
drop trigger if exists progress_photos_row_cap on public.progress_photos;
create trigger progress_photos_row_cap before insert on public.progress_photos for each row execute function public.check_progress_photos_row_cap();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Row level security

alter table public.profiles        enable row level security;
alter table public.foods           enable row level security;
alter table public.food_logs       enable row level security;
alter table public.saved_meals     enable row level security;
alter table public.daily_checks    enable row level security;
alter table public.weight_logs     enable row level security;
alter table public.measurements    enable row level security;
alter table public.workout_sets    enable row level security;
alter table public.progress_photos enable row level security;
alter table public.ai_usage        enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists foods_select on public.foods;
create policy foods_select on public.foods for select to authenticated using (owner_id is null or owner_id = auth.uid());

drop policy if exists foods_insert on public.foods;
create policy foods_insert on public.foods for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists foods_update on public.foods;
create policy foods_update on public.foods for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists foods_delete on public.foods;
create policy foods_delete on public.foods for delete to authenticated using (owner_id = auth.uid());

-- Narrowed per-command policies for user tables
drop policy if exists food_logs_select on public.food_logs;
create policy food_logs_select on public.food_logs for select to authenticated using (user_id = auth.uid());
drop policy if exists food_logs_insert on public.food_logs;
create policy food_logs_insert on public.food_logs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists food_logs_delete on public.food_logs;
create policy food_logs_delete on public.food_logs for delete to authenticated using (user_id = auth.uid());

drop policy if exists saved_meals_select on public.saved_meals;
create policy saved_meals_select on public.saved_meals for select to authenticated using (user_id = auth.uid());
drop policy if exists saved_meals_insert on public.saved_meals;
create policy saved_meals_insert on public.saved_meals for insert to authenticated with check (user_id = auth.uid());
drop policy if exists saved_meals_delete on public.saved_meals;
create policy saved_meals_delete on public.saved_meals for delete to authenticated using (user_id = auth.uid());

drop policy if exists progress_photos_select on public.progress_photos;
create policy progress_photos_select on public.progress_photos for select to authenticated using (user_id = auth.uid());
drop policy if exists progress_photos_insert on public.progress_photos;
create policy progress_photos_insert on public.progress_photos for insert to authenticated with check (user_id = auth.uid());
drop policy if exists progress_photos_delete on public.progress_photos;
create policy progress_photos_delete on public.progress_photos for delete to authenticated using (user_id = auth.uid());

drop policy if exists daily_checks_select on public.daily_checks;
create policy daily_checks_select on public.daily_checks for select to authenticated using (user_id = auth.uid());
drop policy if exists daily_checks_insert on public.daily_checks;
create policy daily_checks_insert on public.daily_checks for insert to authenticated with check (user_id = auth.uid());
drop policy if exists daily_checks_update on public.daily_checks;
create policy daily_checks_update on public.daily_checks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists daily_checks_delete on public.daily_checks;
create policy daily_checks_delete on public.daily_checks for delete to authenticated using (user_id = auth.uid());

drop policy if exists weight_logs_select on public.weight_logs;
create policy weight_logs_select on public.weight_logs for select to authenticated using (user_id = auth.uid());
drop policy if exists weight_logs_insert on public.weight_logs;
create policy weight_logs_insert on public.weight_logs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists weight_logs_update on public.weight_logs;
create policy weight_logs_update on public.weight_logs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists weight_logs_delete on public.weight_logs;
create policy weight_logs_delete on public.weight_logs for delete to authenticated using (user_id = auth.uid());

drop policy if exists measurements_select on public.measurements;
create policy measurements_select on public.measurements for select to authenticated using (user_id = auth.uid());
drop policy if exists measurements_insert on public.measurements;
create policy measurements_insert on public.measurements for insert to authenticated with check (user_id = auth.uid());
drop policy if exists measurements_update on public.measurements;
create policy measurements_update on public.measurements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists measurements_delete on public.measurements;
create policy measurements_delete on public.measurements for delete to authenticated using (user_id = auth.uid());

drop policy if exists workout_sets_select on public.workout_sets;
create policy workout_sets_select on public.workout_sets for select to authenticated using (user_id = auth.uid());
drop policy if exists workout_sets_insert on public.workout_sets;
create policy workout_sets_insert on public.workout_sets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists workout_sets_update on public.workout_sets;
create policy workout_sets_update on public.workout_sets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists workout_sets_delete on public.workout_sets;
create policy workout_sets_delete on public.workout_sets for delete to authenticated using (user_id = auth.uid());

drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = auth.uid());

drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage for insert to authenticated
  with check (user_id = auth.uid() and failed = false and created_at = now());

drop policy if exists photos_select on storage.objects;
create policy photos_select on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      select count(*)
      from storage.objects
      where bucket_id = 'progress-photos'
        and (storage.foldername(name))[1] = auth.uid()::text
    ) < 60
  );

drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Scheduled cleanup of ai_usage rows older than 7 days
do $cron_setup$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $cron_job$
      select cron.unschedule(jobid) from cron.job where jobname = 'purge-ai-usage';
      select cron.schedule('purge-ai-usage', '0 3 * * *', 'delete from public.ai_usage where created_at < now() - interval ''7 days''');
    $cron_job$;
  end if;
exception when others then
  null;
end $cron_setup$;


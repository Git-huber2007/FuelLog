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
  last_adjusted_on date,
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
  protein_g     numeric(6,1) not null default 0 check (protein_g >= 0),
  carbs_g       numeric(6,1) not null default 0 check (carbs_g >= 0),
  fat_g         numeric(6,1) not null default 0 check (fat_g >= 0),
  fibre_g       numeric(6,1) not null default 0 check (fibre_g >= 0),
  category      text not null default 'prepared',
  barcode       text,
  created_at    timestamptz not null default now()
);
create unique index if not exists foods_owner_name_uq on public.foods (coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));
create index if not exists foods_barcode_idx on public.foods (barcode) where barcode is not null;

create table if not exists public.food_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  meal       meal_type not null,
  food_id    uuid references public.foods(id) on delete set null,
  name       text not null check (char_length(name) between 1 and 120),
  servings   numeric(5,2) not null default 1 check (servings > 0 and servings <= 50),
  kcal       numeric(7,1) not null check (kcal >= 0),   -- totals for this entry, snapshotted at log time
  protein_g  numeric(6,1) not null default 0,
  carbs_g    numeric(6,1) not null default 0,
  fat_g      numeric(6,1) not null default 0,
  fibre_g    numeric(6,1) not null default 0,
  source     log_source not null default 'list',
  created_at timestamptz not null default now()
);
create index if not exists food_logs_user_date_idx on public.food_logs (user_id, log_date);

create table if not exists public.saved_meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  items      jsonb not null, -- array of {name, kcal, protein_g, carbs_g, fat_g, fibre_g}
  created_at timestamptz not null default now()
);

create table if not exists public.daily_checks (
  user_id       uuid not null references auth.users(id) on delete cascade,
  log_date      date not null,
  water_ml      int not null default 0 check (water_ml between 0 and 10000),
  sleep_hours   numeric(3,1) check (sleep_hours between 0 and 16),
  creatine      boolean not null default false,
  protein_shake boolean not null default false,
  primary key (user_id, log_date)
);

create table if not exists public.weight_logs (
  user_id   uuid not null references auth.users(id) on delete cascade,
  log_date  date not null,
  weight_kg numeric(5,1) not null check (weight_kg between 30 and 250),
  primary key (user_id, log_date)
);

create table if not exists public.measurements (
  user_id  uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  waist_cm numeric(5,1) check (waist_cm between 30 and 250),
  chest_cm numeric(5,1) check (chest_cm between 30 and 250),
  arm_cm   numeric(5,1) check (arm_cm between 10 and 100),
  primary key (user_id, log_date)
);

create table if not exists public.workout_sets (
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null,
  exercise_key text not null check (char_length(exercise_key) <= 60),
  set_number   int  not null check (set_number between 1 and 10),
  weight_kg    numeric(5,1) not null default 0 check (weight_kg between 0 and 500),
  reps         int  not null default 0 check (reps between 0 and 200),
  primary key (user_id, log_date, exercise_key, set_number)
);
create index if not exists workout_sets_exercise_idx on public.workout_sets (user_id, exercise_key, log_date desc);

create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null,
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

do $$
declare t text;
begin
  foreach t in array array['food_logs','saved_meals','daily_checks','weight_logs','measurements','workout_sets','progress_photos'] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_owner', t);
  end loop;
end $$;

drop policy if exists ai_usage_owner on public.ai_usage;
drop policy if exists ai_usage_select on public.ai_usage;
create policy ai_usage_select on public.ai_usage for select to authenticated using (user_id = auth.uid());

drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage for insert to authenticated with check (user_id = auth.uid());

drop policy if exists ai_usage_update on public.ai_usage;
create policy ai_usage_update on public.ai_usage for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and failed = true);

drop policy if exists photos_select on storage.objects;
create policy photos_select on storage.objects for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

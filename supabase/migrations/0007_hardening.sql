-- Migration 0007: Security hardening
-- Safe to run multiple times.

-- ============================================================================
-- A. Account deletion
-- ============================================================================
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

-- ============================================================================
-- B. Limits and constraints
-- ============================================================================

-- saved_meals.items: at most 50 entries and 20 kB
alter table public.saved_meals drop constraint if exists saved_meals_items_limit;
alter table public.saved_meals add constraint saved_meals_items_limit
  check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50 and octet_length(items::text) <= 20480);

-- Upper bounds on food_logs macros matching shared/src/schemas.ts
alter table public.food_logs drop constraint if exists food_logs_kcal_max;
alter table public.food_logs add constraint food_logs_kcal_max check (kcal <= 10000);

alter table public.food_logs drop constraint if exists food_logs_protein_g_check;
alter table public.food_logs add constraint food_logs_protein_g_check check (protein_g >= 0 and protein_g <= 1000);

alter table public.food_logs drop constraint if exists food_logs_carbs_g_check;
alter table public.food_logs add constraint food_logs_carbs_g_check check (carbs_g >= 0 and carbs_g <= 1000);

alter table public.food_logs drop constraint if exists food_logs_fat_g_check;
alter table public.food_logs add constraint food_logs_fat_g_check check (fat_g >= 0 and fat_g <= 1000);

alter table public.food_logs drop constraint if exists food_logs_fibre_g_check;
alter table public.food_logs add constraint food_logs_fibre_g_check check (fibre_g >= 0 and fibre_g <= 1000);

-- Date checks: static lower bound (>= 2020-01-01) on tables with dates
alter table public.food_logs drop constraint if exists food_logs_date_min;
alter table public.food_logs add constraint food_logs_date_min check (log_date >= '2020-01-01');

alter table public.daily_checks drop constraint if exists daily_checks_date_min;
alter table public.daily_checks add constraint daily_checks_date_min check (log_date >= '2020-01-01');

alter table public.weight_logs drop constraint if exists weight_logs_date_min;
alter table public.weight_logs add constraint weight_logs_date_min check (log_date >= '2020-01-01');

alter table public.measurements drop constraint if exists measurements_date_min;
alter table public.measurements add constraint measurements_date_min check (log_date >= '2020-01-01');

alter table public.workout_sets drop constraint if exists workout_sets_date_min;
alter table public.workout_sets add constraint workout_sets_date_min check (log_date >= '2020-01-01');

alter table public.progress_photos drop constraint if exists progress_photos_date_min;
alter table public.progress_photos add constraint progress_photos_date_min check (log_date >= '2020-01-01');

alter table public.profiles drop constraint if exists profiles_last_adjusted_date_min;
alter table public.profiles add constraint profiles_last_adjusted_date_min check (last_adjusted_on is null or last_adjusted_on >= '2020-01-01');

-- Dynamic date checks (not more than 1 day in the future, and not before 2020) via trigger
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

-- Row caps by before-insert trigger on user-writable tables
create or replace function public.check_foods_row_cap() returns trigger
language plpgsql as $$
declare
  food_count int;
begin
  if new.owner_id is not null then
    select count(*) into food_count from public.foods where owner_id = new.owner_id;
    if food_count >= 500 then
      raise exception 'Custom food limit reached (maximum 500 custom foods per user)';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists foods_row_cap on public.foods;
create trigger foods_row_cap before insert on public.foods
  for each row execute function public.check_foods_row_cap();

create or replace function public.check_food_logs_row_cap() returns trigger
language plpgsql as $$
declare
  day_count int;
begin
  select count(*) into day_count from public.food_logs where user_id = new.user_id and log_date = new.log_date;
  if day_count >= 200 then
    raise exception 'Daily food log limit reached (maximum 200 food logs per day)';
  end if;
  return new;
end;
$$;

drop trigger if exists food_logs_row_cap on public.food_logs;
create trigger food_logs_row_cap before insert on public.food_logs
  for each row execute function public.check_food_logs_row_cap();

create or replace function public.check_saved_meals_row_cap() returns trigger
language plpgsql as $$
declare
  meal_count int;
begin
  select count(*) into meal_count from public.saved_meals where user_id = new.user_id;
  if meal_count >= 100 then
    raise exception 'Saved meal limit reached (maximum 100 saved meals per user)';
  end if;
  return new;
end;
$$;

drop trigger if exists saved_meals_row_cap on public.saved_meals;
create trigger saved_meals_row_cap before insert on public.saved_meals
  for each row execute function public.check_saved_meals_row_cap();

create or replace function public.check_workout_sets_row_cap() returns trigger
language plpgsql as $$
declare
  set_count int;
begin
  select count(*) into set_count from public.workout_sets where user_id = new.user_id and log_date = new.log_date;
  if set_count >= 100 then
    raise exception 'Daily workout set limit reached (maximum 100 workout sets per day)';
  end if;
  return new;
end;
$$;

drop trigger if exists workout_sets_row_cap on public.workout_sets;
create trigger workout_sets_row_cap before insert on public.workout_sets
  for each row execute function public.check_workout_sets_row_cap();

create or replace function public.check_progress_photos_row_cap() returns trigger
language plpgsql as $$
declare
  photo_count int;
begin
  select count(*) into photo_count from public.progress_photos where user_id = new.user_id;
  if photo_count >= 60 then
    raise exception 'Progress photo limit reached (maximum 60 photos per user)';
  end if;
  return new;
end;
$$;

drop trigger if exists progress_photos_row_cap on public.progress_photos;
create trigger progress_photos_row_cap before insert on public.progress_photos
  for each row execute function public.check_progress_photos_row_cap();

-- Storage insert policy: at most 60 objects per user in the photo bucket
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

-- ============================================================================
-- C. Narrow the policies (split 'for all' and drop update where never updated)
-- ============================================================================

-- 1. food_logs (insert, select, delete only - never updated)
drop policy if exists food_logs_owner on public.food_logs;
drop policy if exists food_logs_select on public.food_logs;
create policy food_logs_select on public.food_logs for select to authenticated using (user_id = auth.uid());
drop policy if exists food_logs_insert on public.food_logs;
create policy food_logs_insert on public.food_logs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists food_logs_delete on public.food_logs;
create policy food_logs_delete on public.food_logs for delete to authenticated using (user_id = auth.uid());
drop policy if exists food_logs_update on public.food_logs;

-- 2. saved_meals (insert, select, delete only - never updated)
drop policy if exists saved_meals_owner on public.saved_meals;
drop policy if exists saved_meals_select on public.saved_meals;
create policy saved_meals_select on public.saved_meals for select to authenticated using (user_id = auth.uid());
drop policy if exists saved_meals_insert on public.saved_meals;
create policy saved_meals_insert on public.saved_meals for insert to authenticated with check (user_id = auth.uid());
drop policy if exists saved_meals_delete on public.saved_meals;
create policy saved_meals_delete on public.saved_meals for delete to authenticated using (user_id = auth.uid());
drop policy if exists saved_meals_update on public.saved_meals;

-- 3. progress_photos (insert, select, delete only - never updated)
drop policy if exists progress_photos_owner on public.progress_photos;
drop policy if exists progress_photos_select on public.progress_photos;
create policy progress_photos_select on public.progress_photos for select to authenticated using (user_id = auth.uid());
drop policy if exists progress_photos_insert on public.progress_photos;
create policy progress_photos_insert on public.progress_photos for insert to authenticated with check (user_id = auth.uid());
drop policy if exists progress_photos_delete on public.progress_photos;
create policy progress_photos_delete on public.progress_photos for delete to authenticated using (user_id = auth.uid());
drop policy if exists progress_photos_update on public.progress_photos;

-- 4. daily_checks (select, insert, update, delete)
drop policy if exists daily_checks_owner on public.daily_checks;
drop policy if exists daily_checks_select on public.daily_checks;
create policy daily_checks_select on public.daily_checks for select to authenticated using (user_id = auth.uid());
drop policy if exists daily_checks_insert on public.daily_checks;
create policy daily_checks_insert on public.daily_checks for insert to authenticated with check (user_id = auth.uid());
drop policy if exists daily_checks_update on public.daily_checks;
create policy daily_checks_update on public.daily_checks for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists daily_checks_delete on public.daily_checks;
create policy daily_checks_delete on public.daily_checks for delete to authenticated using (user_id = auth.uid());

-- 5. weight_logs (select, insert, update, delete)
drop policy if exists weight_logs_owner on public.weight_logs;
drop policy if exists weight_logs_select on public.weight_logs;
create policy weight_logs_select on public.weight_logs for select to authenticated using (user_id = auth.uid());
drop policy if exists weight_logs_insert on public.weight_logs;
create policy weight_logs_insert on public.weight_logs for insert to authenticated with check (user_id = auth.uid());
drop policy if exists weight_logs_update on public.weight_logs;
create policy weight_logs_update on public.weight_logs for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists weight_logs_delete on public.weight_logs;
create policy weight_logs_delete on public.weight_logs for delete to authenticated using (user_id = auth.uid());

-- 6. measurements (select, insert, update, delete)
drop policy if exists measurements_owner on public.measurements;
drop policy if exists measurements_select on public.measurements;
create policy measurements_select on public.measurements for select to authenticated using (user_id = auth.uid());
drop policy if exists measurements_insert on public.measurements;
create policy measurements_insert on public.measurements for insert to authenticated with check (user_id = auth.uid());
drop policy if exists measurements_update on public.measurements;
create policy measurements_update on public.measurements for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists measurements_delete on public.measurements;
create policy measurements_delete on public.measurements for delete to authenticated using (user_id = auth.uid());

-- 7. workout_sets (select, insert, update, delete)
drop policy if exists workout_sets_owner on public.workout_sets;
drop policy if exists workout_sets_select on public.workout_sets;
create policy workout_sets_select on public.workout_sets for select to authenticated using (user_id = auth.uid());
drop policy if exists workout_sets_insert on public.workout_sets;
create policy workout_sets_insert on public.workout_sets for insert to authenticated with check (user_id = auth.uid());
drop policy if exists workout_sets_update on public.workout_sets;
create policy workout_sets_update on public.workout_sets for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists workout_sets_delete on public.workout_sets;
create policy workout_sets_delete on public.workout_sets for delete to authenticated using (user_id = auth.uid());

-- ai_usage insert: force created_at = now() and failed = false
alter table public.ai_usage alter column created_at set default now();
alter table public.ai_usage alter column failed set default false;

drop policy if exists ai_usage_insert on public.ai_usage;
create policy ai_usage_insert on public.ai_usage for insert to authenticated
  with check (user_id = auth.uid() and failed = false and created_at = now());

-- ============================================================================
-- D. AI quota retention and scheduled purge
-- ============================================================================
-- Note: rows older than 7 days should be removed by a scheduled job.
-- The following block schedules a nightly purge using pg_cron when available.
do $cron_setup$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute $cron_job$
      select cron.unschedule(jobid) from cron.job where jobname = 'purge-ai-usage';
      select cron.schedule('purge-ai-usage', '0 3 * * *', 'delete from public.ai_usage where created_at < now() - interval ''7 days''');
    $cron_job$;
  end if;
exception when others then
  null; -- Ignore if pg_cron is not configured or lacks permissions
end $cron_setup$;


-- Indexes, an edit-safe set cap, and an atomic skip toggle. Safe to run more than once.

-- 1. Foreign keys and filters that had no index.
--    foods_owner_name_uq starts with coalesce(owner_id, ...), so it cannot serve `owner_id = x`.
create index if not exists foods_owner_idx on public.foods(owner_id);
--    `delete from foods` nulls food_logs.food_id, which scanned the largest table.
create index if not exists food_logs_food_id_idx on public.food_logs(food_id) where food_id is not null;
--    /recent-foods orders a user's whole history by created_at.
create index if not exists food_logs_user_created_idx on public.food_logs(user_id, created_at desc);
create index if not exists saved_meals_user_idx on public.saved_meals(user_id);
create index if not exists progress_photos_user_idx on public.progress_photos(user_id);

-- 2. The row cap fired on every upsert, because BEFORE INSERT triggers run before the
--    ON CONFLICT clause resolves. At 100 sets a day that blocked EDITING the sets you already had.
create or replace function public.check_workout_sets_row_cap() returns trigger
language plpgsql as $$
declare set_count int;
begin
  if exists (
    select 1 from public.workout_sets
    where user_id = new.user_id and log_date = new.log_date
      and exercise_key = new.exercise_key and set_number = new.set_number
  ) then
    return new; -- an update of an existing set adds no row
  end if;
  select count(*) into set_count from public.workout_sets where user_id = new.user_id and log_date = new.log_date;
  if set_count >= 100 then raise exception 'Daily workout set limit reached (maximum 100 workout sets per day)'; end if;
  return new;
end;
$$;

-- 3. Skipping an exercise was read-modify-write in the API, so two quick taps lost one change.
create or replace function public.set_exercise_skipped(p_date date, p_key text, p_skip boolean)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.daily_checks (user_id, log_date, skipped_exercises)
  values (auth.uid(), p_date, case when p_skip then array[p_key] else '{}' end)
  on conflict (user_id, log_date) do update
    set skipped_exercises = coalesce((
      select array_agg(k)
      from (
        select distinct k
        from unnest(
          case when p_skip
            then array_append(array_remove(public.daily_checks.skipped_exercises, p_key), p_key)
            else array_remove(public.daily_checks.skipped_exercises, p_key)
          end
        ) as k
        limit 50  -- the table's own check constraint caps the array at 50
      ) kept
    ), '{}');
$$;
revoke execute on function public.set_exercise_skipped(date, text, boolean) from public, anon;
grant execute on function public.set_exercise_skipped(date, text, boolean) to authenticated;

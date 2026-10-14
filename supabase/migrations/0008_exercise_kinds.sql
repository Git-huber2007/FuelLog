-- Migration 0008: Raise reps check limit to 3600 to support duration holds in seconds.
-- Safe to run more than once.

alter table public.workout_sets drop constraint if exists workout_sets_reps_check;
alter table public.workout_sets add constraint workout_sets_reps_check check (reps between 0 and 3600);

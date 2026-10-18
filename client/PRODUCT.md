# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who have just started lifting. They use FuelLog on their phone, often as an installed PWA: logging meals at home or work (Indian staples such as roti, dal and chicken rice bowls are a common case) and logging sets between exercises in the gym, one-handed and in a hurry.

## Product Purpose

One app for eating and training toward a goal (lose fat, maintain, gain muscle). Success is a beginner who logs most days, hits protein, trains on plan and sees their weight trend move the right way without needing to understand nutrition science.

## Positioning

- Food and gym in one place, so a beginner does not juggle a calorie counter and a workout log.
- Logging takes seconds: recent foods, saved meals, search, barcode, and AI estimates from a text description or a photo.
- Beginner guidance built in: fixed splits by level, progressive-overload hints, PR detection, and an AI weekly coach.
- The calorie target follows the user's real 7-day weight trend instead of staying fixed.

## Operating Context

- Today: calorie scoreboard (kcal to get, target, eaten, burned) and macro bars, daily check (water, sleep, steps, creatine, protein shake), add food, eaten list by meal.
- Workout: the day's split from the chosen program or a custom weekly routine, set rows (kg × reps, duration, assisted, cardio), rest timer, exercise demos, library extras.
- Progress: 7-day summary, top lifts, weight trend, target tuning, progress photos, 14-day calories, measurements, weekly coach, CSV/JSON export.
- Profile: level, program, body stats, goal, derived daily targets, account.
- Used in gyms (bright light, sweaty hands, glances between sets) and at meals.

## Capabilities and Constraints

- React + Vite + Tailwind client, Express API, Supabase (auth, Postgres with RLS, photo storage); deployed on Vercel (client) and Render (API).
- Light and dark themes follow the system; the app must work at 320px width and from tablet up with a side rail.
- AI features are optional per server; the UI must hide them when off.
- Estimates only, not medical advice; calorie targets never go below 1500 kcal.

## Brand Commitments

- Name: FuelLog, with the existing app icon.
- Green is the brand colour.
- Macro colours stay: protein pink, carbs blue, fat amber (taken from bumper plates).
- Everything else about the visual world is open to replacement (confirmed 2026-10-18).

## Evidence on Hand

- Exercise demo photos from the free-exercise-db library (served via `/api/exercises/:key/:frame`).
- No testimonials, user counts, reviews or press exist; do not fabricate any.

## Product Principles

1. Logging speed beats completeness: the fastest path to a correct entry wins every layout decision.
2. Tell a beginner what to do next, in plain words, without jargon.
3. One place, two jobs: food and training should feel like one product, not two apps stapled together.
4. Honest numbers: estimates are labelled as estimates, and nothing is invented to look impressive.

## Accessibility & Inclusion

WCAG 2.2 AA (contrast, 24px minimum targets, keyboard order, screen-reader labels), usable at 320px, respects reduced motion.

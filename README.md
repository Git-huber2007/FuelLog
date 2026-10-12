# FuelLog

A mobile-first calorie, macro and gym tracker for people who have just started lifting. Log food in a few seconds (recent foods, saved meals, search, barcode, AI text or photo), track a fixed Monday-to-Saturday split, and let your calorie target follow your real 7-day weight trend.

It runs as one Node web service that serves both the API and the built React app, with Supabase for the database, sign-in and photo storage. It installs to a phone home screen as a PWA.

**Estimates only, not medical advice.**

## What you need

- Node.js 20.12 or newer
- A free [Supabase](https://supabase.com) project
- Optional: a [Gemini API key](https://aistudio.google.com/apikey) for AI logging and the weekly coach. Without it everything else works and the AI controls are hidden.

## Run it on your computer

1. **Create the database.** In the Supabase dashboard open **SQL Editor**, paste the contents of `supabase/migrations/0001_init.sql`, and press **Run**. Then do the same with `supabase/migrations/0002_seed_foods.sql`.
2. **Copy your keys.** In Supabase go to **Project Settings → API** and note the **Project URL** and the **anon public** key.
3. **Create the two env files.**
   ```
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
   Put the Project URL and anon key in both files. In `server/.env` set `GEMINI_API_KEY` to your key, or leave it empty to run without AI.
4. **Install and start.**
   ```
   npm install
   npm run dev
   ```
5. Open http://localhost:5173, create an account, and fill in the onboarding form.

| Command | What it does |
|---|---|
| `npm run dev` | API on port 4000 and the Vite client on 5173, which proxies `/api` to the API |
| `npm test` | Vitest for the target, advice, streak, overload and split logic in `shared/` |
| `npm run build` | Type-checks and builds the client and the server |
| `npm start` | Runs the built server. With `NODE_ENV=production` it also serves the built client, so the whole app is on one port |
| `npm run lint` | ESLint |

To try the production build locally: `npm run build`, set `NODE_ENV=production` in `server/.env`, `npm start`, and open http://localhost:4000.

## Deploy: client on Vercel, API on Render

The browser only ever talks to the Vercel address. `vercel.json` forwards `/api/*` to the Render service, so there is no cross-origin setup and the client keeps `VITE_API_URL=/api`.

1. **Supabase.** Create the project and run the two migrations (steps 1 to 3 of the next section).
2. **GitHub.** Push this folder to a repository. `.env` files are ignored and must stay out of it.
3. **Render (API).** **New → Blueprint**, pick the repository. `render.yaml` builds only the server. Enter `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `GEMINI_API_KEY`. When it is live, open `https://YOUR-SERVICE.onrender.com/api/health` and expect `{"ok":true}`.
4. **Point Vercel at Render.** If Render gave you an address other than `https://fuellog.onrender.com`, change the `destination` of the first rewrite in `vercel.json` to it, and push. If your Supabase project is not `ppbdkynhmkcxivhjyzlh`, change the two Supabase addresses in the `Content-Security-Policy` line as well.
5. **Vercel (client).** **Add New → Project**, import the same repository, leave **Root Directory** as the repository root. `vercel.json` supplies the build settings. Add three environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` set to `/api`. Deploy.
6. **Supabase emails.** **Authentication → URL Configuration**: set **Site URL** to the Vercel address and add `https://YOUR-APP.vercel.app/**` under **Redirect URLs**.
7. Create your account on the Vercel address, then turn off **Allow new users to sign up** in Supabase.

The Render free plan sleeps after about 15 idle minutes, so the first request after a break takes close to a minute. The app shell still opens at once from Vercel.

## Alternative: everything on one Render service

To serve the client from Render as well, change the build command in `render.yaml` back to `npm ci && npm run build` and add the three `VITE_` variables there. The server serves `client/dist` whenever it exists.

1. **Supabase project.** At supabase.com choose **New project**, name it, set a database password, pick the region nearest you, and wait for it to finish.
2. **Run the migrations.** **SQL Editor → New query**, paste `0001_init.sql`, **Run**. New query, paste `0002_seed_foods.sql`, **Run**.
3. **Copy the URL and anon key** from **Project Settings → API**.
4. **Put the code on GitHub.** Create a repository and push this folder to it.
5. **Create the Render service.** At render.com choose **New → Blueprint**, connect the repository, and Render reads `render.yaml`: one Node 20 web service, build `npm ci && npm run build`, start `npm start`, health check `/api/health`.
6. **Enter the variables** Render asks for:

   | Variable | Value |
   |---|---|
   | `SUPABASE_URL` | your Project URL |
   | `SUPABASE_ANON_KEY` | your anon public key |
   | `VITE_SUPABASE_URL` | the same Project URL |
   | `VITE_SUPABASE_ANON_KEY` | the same anon key |
   | `GEMINI_API_KEY` | your Gemini key, or leave empty |

   `NODE_ENV`, `GEMINI_MODEL`, `AI_DAILY_LIMIT` and `VITE_API_URL` are already set by `render.yaml`. `PORT` is supplied by Render. `CLIENT_ORIGIN` is only used in development. The `VITE_` values are baked in at build time, so if you change them later, redeploy.
7. **Open the HTTPS URL** Render gives you, such as `https://fuellog.onrender.com`.
8. **Point Supabase emails at the live site.** In Supabase go to **Authentication → URL Configuration**. Set **Site URL** to your Render URL, and add `https://YOUR-APP.onrender.com/**` under **Redirect URLs**. Confirmation and password-reset emails now link to the live site instead of localhost.
9. **Create your own account** on the live site and finish onboarding.
10. **Switch off new sign-ups.** In Supabase go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up**. Nobody else can register on your deployment.

Railway and Fly.io work the same way: one Node 20 service, the same build and start commands, the same variables.

### Install on your phone

Open the HTTPS URL on your phone. On Android (Chrome) tap the menu and choose **Add to Home screen** or **Install app**. On iPhone (Safari) tap **Share**, then **Add to Home Screen**. FuelLog opens full screen like any other app.

## How it is put together

```
shared/    Zod schemas, target formulas, advice rules, the workout split and date helpers, used by both sides
server/    Express API. Each request gets its own Supabase client carrying the caller's token, so Postgres row level security does the isolation
client/    React 18 + Vite + TanStack Query + Tailwind, built as a PWA
supabase/  The two SQL migrations
```

- `GEMINI_API_KEY` lives only in the server environment. The browser calls `/api/ai/*` and never talks to Google.
- The server never uses a service-role key and never takes `user_id` from a request body.
- Progress photos sit in a private bucket under `{user_id}/…` and are shown through signed URLs that last 60 minutes.
- Request logs hold the method, path, status, duration and user id. Bodies, tokens, images and health data are never logged.

## Checks to run after deploying

These need a live Supabase project, so they are yours to run once:

- **Second-account isolation.** Before turning sign-ups off, create a second account. Confirm it sees none of the first account's food, weights, workouts or photos in the app, and that Supabase's **Table Editor → impersonate user** shows only that user's rows.
- **AI.** With a key set, log "2 rotis, dal, 1 bowl rice", a plate photo and a nutrition-label photo.
- **Barcode.** Scan a packaged product with the live camera on your phone.
- **Password reset.** Request a reset email and confirm the link opens the deployed site.

## Decisions

Choices made where the specification left room:

- **"Today" comes from the phone, not the server.** The server runs in UTC, which is a different calendar day from India for part of every morning. The client sends its local date in an `X-Local-Date` header; the server accepts it only within one day of UTC and uses it for the future-date rule, streaks, the weekly windows and "is this weigh-in today".
- **Adaptive adjustment window.** "At least 8 weigh-ins spanning at least 13 days" is read as: 8 or more weigh-ins in the last 14 days, and 13 or more days between your first and latest weigh-in. Both 7-day windows must contain a weigh-in.
- **Protein hit rate** counts a day as a hit at 90% of the protein target, so 134 g against 135 g is not a miss.
- **Good-fit foods for the nudge** are chosen from every food you can see (seed foods and your own) with at least 8 g protein, sent with the day's data so the rule runs in the shared code on the client.
- **Streak** is counted over your newest 1000 food entries, roughly 100 days. Noted in `server/src/routes/progress.ts` with what to change for longer streaks.
- **CSV export** has one row for every day with any food, daily check or weigh-in.
- **Saved-meal logging** takes `{ date, meal }` in the body, so a saved meal goes into the meal slot you have selected.
- **Custom foods and barcode foods** are stored with the category `prepared`, because the food form in the spec has no category field. A barcode product whose name clashes with one of your foods gets the last four digits of the barcode appended.
- **Recent-food chips** log one serving, worked back from what you logged last time.
- **AI responses** have out-of-range numbers and over-long text pulled into the schema's limits before validation, then one retry, then a 502.
- **Gemini thinking is turned off for 2.5 Flash models.** Thinking tokens count against the 2048 output-token cap and would cut the JSON short. Other models are called exactly as the spec's helper does.
- **The Gemini client is created on first use** rather than at import, so the server starts with an empty key.
- **Build tools are listed under `dependencies`.** Render sets `NODE_ENV=production` during the build, and `npm ci` then skips `devDependencies`; Vite, TypeScript, Tailwind and esbuild have to be installed for `npm run build` to work.
- **The server is bundled with esbuild**, with `shared/` compiled in, so production runs plain `node dist/index.js` with no TypeScript loader.
- **Content Security Policy** allows inline `style` attributes (`style-src 'unsafe-inline'`), which React needs for bar widths. Scripts are self-only.
- **Password reset uses one route for both steps.** Signed out, `/reset-password` asks for your email. The emailed link signs you in and returns to the same page, which then asks for the new password.
- **Icons** are a generated calorie ring on plate green.
- **Exercise photos** (start and finish position for each lift) are from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), which is released into the public domain. They are stored in `client/public/exercises`, named by exercise key, so they load from the app's own address. Where the split names two options or a variation the set does not have, the nearest match is shown: bench for "Close-grip bench or dips", barbell for "Barbell or dumbbell row", squat for "Squat or leg press", band-assisted pull-up, and hanging leg raise for "Hanging knee raise".
- **Exercise library (added after the original brief).** On top of the fixed split, any day can take extra exercises from a library of 873 (free-exercise-db), filtered by type (strength, cardio, stretching, plyometrics), muscle and level (beginner, intermediate, advanced). The chosen level is remembered on the device. An exercise is on a day when it has a set row for that date, so no new table was needed. Library photos load from jsDelivr, pinned to one commit, which is why `cdn.jsdelivr.net` is allowed in the image policy.
- **Cardio** is logged as one row of kilometres and minutes. It reuses the set columns (`weight_kg` holds km, `reps` holds minutes), so it needed no migration; the limit is 500 km and 200 minutes per session.
- **Demos** are the start and finish photos cross-fading. They start paused, and the finish photo downloads on first play.
- **Plank sets** label the second input "Seconds" instead of "Reps".

## Known limits

- **`npm audit` reports 5 high findings, all one advisory**: `braces` 3.0.3, pulled in by Tailwind CSS v3's file watcher. No patched `braces` exists, and the only fix npm offers is Tailwind v4, which the project brief rules out. It is build-time tooling that only reads this repository's own file patterns, and it is not in the server bundle or the browser bundle. There are no critical findings.
- The 40-a-day AI limit is counted from rows each user can delete through Supabase directly, because the schema gives users full access to their own `ai_usage` rows. It stops accidents and runaway use, not a determined account owner. For a personal deployment with sign-ups off, that owner is you.
- The app shell works offline; logging needs a connection.

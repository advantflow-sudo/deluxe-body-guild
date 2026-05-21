
# Phase 1 MVP — Build Plan

The current app is a marketing site (Home, Pricing, Coach, etc.) with auth and a basic `/dashboard`. To deliver your spec without breaking what's already shipped, I'll add a **separate authenticated app shell** at `/app/*` with a luxury bottom navigation. The marketing pages stay as the public funnel; signed-in users live in `/app`.

## Scope of this turn (Phase 1 only)

### 1. Backend (one migration)
New tables, all RLS-protected to `auth.uid()`:
- `user_profiles_ext` — goal, weight_kg, height_cm, age, level, preferred_type, units, onboarded_at
- `workouts` — public catalog (category, level, duration, type, video_url)
- `workout_sessions` — completed sessions per user (workout_id, duration, calories)
- `daily_stats` — date, steps, calories, water_ml, streak
- `body_measurements` — date, weight_kg, chest, waist, hips, arms, thighs
- `progress_photos` — storage path + date
- `reward_points` — ledger (delta, reason, balance_after)
- `rewards_catalog` — public catalog (cost_points, title, type)
- `reward_claims` — user_id, reward_id, status
- `challenges` — public catalog
- `challenge_participants` — user_id, challenge_id, progress
- Storage bucket `progress-photos` (private, user-scoped folder policy)

### 2. Bottom-nav app shell
- `src/routes/_authenticated/app.tsx` — layout with fixed luxury bottom nav (Home / Workouts / Progress / Rewards / Profile), `<Outlet/>`.
- 5 child routes: `app/index.tsx`, `app/workouts.tsx`, `app/progress.tsx`, `app/rewards.tsx`, `app/profile.tsx`.

### 3. Onboarding flow
- `src/routes/_authenticated/onboarding.tsx` — multi-step (goal → metrics → level → type → plan). Writes `user_profiles_ext`, then redirects to `/app`.
- `_authenticated` layout: if `onboarded_at` is null → redirect to `/onboarding`.

### 4. Page contents (functional, not placeholder)
- **Home**: today's suggested workout, streak, daily stats ring, motivation quote, points preview.
- **Workouts**: category chips, plan list from `workouts`, detail drawer with video, start → timer → complete → log session + award points.
- **Progress**: weight chart (recharts), measurements form, photo upload, history list, badges.
- **Rewards**: points balance, active challenges with progress, catalog grid, claim flow.
- **Profile**: details, goals, subscription status, notifications toggles, links to help/terms.

### 5. Wire existing CTAs
- `Header` "Dashboard" → `/app` instead of `/dashboard` (keep `/dashboard` as redirect).
- Login success → `/onboarding` if not onboarded, else `/app`.

## Out of scope this turn (acknowledged, not built)
- **Phase 2** Community, DMs, leaderboards, premium gate, payments page
- **Phase 3** Meal planner, calorie/barcode, wearable sync, advanced AI analytics
- **Phase 4** Admin panel (users/workouts/rewards/challenges/analytics)
- Native mobile-only features (barcode scanner, HealthKit/Google Fit)

The schema above is intentionally shaped so Phase 2 (add `posts`, `post_likes`, `follows`), Phase 3 (add `meals`, `foods`, `wearable_syncs`), and Phase 4 (add `admin` role + admin routes under `/_authenticated/_admin/`) drop in without refactors.

## Estimated size
~14 new route files, 1 migration (~12 tables + policies + 1 bucket), ~6 shared components (BottomNav, StatRing, WorkoutCard, Timer, ChartCard, PointsBadge). One large turn.

## Confirm before I start
1. **Proceed with Phase 1 only this turn?** (recommended — quality > breadth)
2. **Seed data**: should I seed ~20 workouts, ~10 rewards, ~5 challenges so the app feels alive on first login? (yes/no)
3. **Premium gating**: leave subscription as a display field for now and wire real Stripe later? (yes/no)

Reply "go" + answers to 2 & 3 and I'll execute.

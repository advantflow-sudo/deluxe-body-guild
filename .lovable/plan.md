
# Phase 2 — Daily Engagement & Community

Goal: turn Deluxe Fitness into a daily-open habit. Every signed-in user has a **Mission**, a **Score**, a **Streak**, a **Partner**, and a **Leaderboard** waiting for them.

Executed over **3 turns**. Each turn ships end-to-end (DB → server → UI → polish) so the app is always shippable.

---

## Turn 1 — Foundation: Daily Mission, Deluxe Score, Streak, Habits

The single most important loop. Everything else hangs off the daily score.

### Database (1 migration)
- `habits` — user_id, name, type (water/steps/sleep/meditation/custom), target_value, unit, icon, active, sort_order
- `habit_logs` — user_id, habit_id, log_date, value, created_at (unique on user+habit+date)
- `daily_missions` — user_id, mission_date (unique), workout_id, habit_ids[], mindset_prompt, completed_at, score (0–100), generated_at
- `daily_scores` — user_id, score_date (unique), workout_pts, habits_pts, mindset_pts, social_pts, total, streak_day
- `streaks` — user_id (pk), current_len, longest_len, last_active_date, freezes_remaining (default 1, reset weekly)
- RLS: all `auth.uid() = user_id`. Service-role GRANT for cron.
- RPC `compute_daily_score(_user uuid, _date date)` SECURITY DEFINER — recomputes & upserts `daily_scores`, updates `streaks`, awards points via existing `award_points`.
- RPC `generate_daily_mission(_user uuid)` SECURITY DEFINER — picks workout from `workouts` matching user's `preferred_type`/`training_level`, attaches active habits, rotating mindset prompt.

### Code
- `src/routes/_authenticated/app/index.tsx` — replace Today with **Today's Mission** card: workout CTA, habit checklist (tap-to-log), mindset prompt, live Deluxe Score ring (animates 0→N), streak flame with freeze indicator.
- `src/routes/_authenticated/app/habits.tsx` — manage habits, history grid (last 30d), quick-add presets.
- `src/components/deluxe/ScoreRing.tsx` — animated radial ring with breakdown tooltip.
- `src/components/deluxe/StreakFlame.tsx` — animated flame, freeze badge, "at risk" pulse after 8pm.
- Hook `useDailyMission()` — fetches/generates today's mission, exposes `logHabit`, `completeMission`.
- Bottom nav: add **Habits** between Workouts and Progress.

---

## Turn 2 — Community: Accountability Partners, Leaderboards, Weekly Challenges

### Database (1 migration)
- `partnerships` — id, user_a, user_b, status (pending/active/ended), paired_at, ended_at, source (invite/automatch)
- `partner_invites` — id, from_user, to_email, code (unique), expires_at, accepted_at
- `partner_nudges` — id, from_user, to_user, kind (cheer/poke/checkin), message, created_at
- `weekly_team_challenges` — id, week_start (unique), title, goal_metric, goal_target, points_reward
- `team_challenge_teams` — id, challenge_id, name, created_by
- `team_challenge_members` — team_id, user_id, joined_at, contribution
- View `leaderboard_weekly` — aggregates daily_scores last 7d per user with rank, friends-only and global.
- RLS scoped to participants; service-role for matcher cron.
- RPC `auto_match_partner(_user)` for users who opt in (matches by goal+level+timezone, weekly).

### Code
- `src/routes/_authenticated/app/partner.tsx` — invite friend (email/link), pending invites, active partner card (their streak, score today, last activity, nudge buttons), weekly check-in prompt.
- `src/routes/_authenticated/app/leaderboard.tsx` — tabs Friends / Global / Team, top 50, your rank pinned, podium for top 3.
- `src/routes/_authenticated/app/challenges.tsx` — current weekly team challenge, join/create team, live progress bar, contribution breakdown.
- `src/routes/_authenticated/accept-invite.$code.tsx` — partner invite acceptance.
- Home: add "Your Partner" + "This Week" mini-cards.

---

## Turn 3 — Retention: Push + Email Re-engagement, Polish

### Infrastructure
- Set up Lovable Emails (sender domain dialog → infra → transactional templates).
- Templates: `daily-mission` (8am local), `streak-at-risk` (8pm local if score < threshold), `partner-nudge`, `weekly-recap` (Sunday 6pm).
- Web Push: VAPID keys in secrets, `push_subscriptions` table, `/api/public/hooks/send-reminders` server route, settings UI to enable.

### Cron (pg_cron + pg_net)
- `daily-missions-generate` — 4am UTC, generate today's mission for all active users (last 14d).
- `score-recompute` — every 15min, recompute today's score for users with recent activity.
- `streak-at-risk-alert` — every hour, fan out push+email to users whose local time = 20:00 and today's score < 50.
- `weekly-recap` — Sunday 18:00 local, email summary.
- `auto-match-partners` — Monday 09:00 UTC.

### Code
- `src/routes/_authenticated/app/profile.tsx` — notification preferences (push/email per category), partner pairing mode (invite-only / auto-match / both), quiet hours.
- `src/components/deluxe/PushPrompt.tsx` — soft-ask after 2nd session completed.

---

## Tech Notes

- All new RPCs are `SECURITY DEFINER` with `auth.uid()` checks and input caps (already-established pattern from `award_points`).
- All cron endpoints under `/api/public/hooks/*` with `x-cron-secret` + `timingSafeEqual` (existing pattern).
- Realtime: enable for `partner_nudges` and `team_challenge_members` only (small payloads, partner-scoped). NOT for `daily_scores` (privacy).
- Subscription gates (already enforced server-side): auto-match, team challenges, weekly recap email = free; advanced analytics in recap = premium.
- No edge functions — all server logic via `createServerFn` + server routes.

## Scope discipline

- No new workout content, no nutrition, no admin panel this phase.
- Existing community feed (`community_posts`) stays as-is; we add to it, don't replace it.

---

**Ready to start Turn 1?** Reply "go turn 1" and I'll ship the foundation (Mission + Score + Streak + Habits).

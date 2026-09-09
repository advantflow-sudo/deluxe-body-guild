# Deluxe Fitness — Completion Tick List

Status key: [x] done · [ ] open

## Built & shipped
- [x] M1 Food-photo scanner (upload → analyse → save → rescan/edit → delete, private photo storage)
- [x] M2 Single-source calculation engine (targets.ts / useTargets, XP + ranks)
- [x] M3 Nutrition integration (today's rings, quick log, weekly summary, meal plan)
- [x] M4 Workouts (browse, detail, session player, videos + form refs, XP/streak)
- [x] M5 Coach chat with persisted conversations and real account context
- [x] M6 Social (feed, likes, follows, challenges, partner, notifications)
- [x] M7 Public claims audit (no fake stats, correct legal links, honest roadmap)
- [x] Missions: history timeline, CSV/PDF export, badges + gallery, share cards
- [x] Reminders: scheduling, timezone, quiet hours, deep links, history log
- [x] Meal prep guide + grocery list + `/app/grocery` page

## Open — required before launch (est. 1–2 working sessions)
- [x] Signed-in pass done on Lerone's session: dashboard, nutrition, grocery, profile, badges, rewards render at 390px with no overflow and no console errors
- [x] Fixed silent bug: notification alert types were restricted to likes/comments, so mission reminders, partner cheers and streak alerts were being rejected by the database — now accepted (test reminder verified end to end)
- [ ] Scan → save → rescan → rings run with a real meal photo (needs a photo from you)
- [x] Production Web Push: VAPID keys configured, real browser subscriptions stored, encrypted delivery wired (verify on your installed app)
- [x] Email delivery moved to the built-in email service on notify.deluxefitness.app (auth + mission reminder emails); sending activates once DNS verification completes
- [x] Backend hardening: reward-point amounts now server-decided with a daily cap (remaining linter warnings are advisory: pg_net lives in public for scheduling, and the flagged functions are user-scoped by design)
- [ ] Reminder claim/quiet-hour edge semantics (hour boundary, DST) confirmed with test rows
- [x] Cron/scheduler wired for reminder dispatch (pg_cron → public API route); duplicate cron jobs removed (was double-sending)
- [x] Scanner resilience: HEIC/decode fallback, one automatic retry, honest error classification
- [x] Weekly team challenge auto-rollover (board never stale)
- [x] Borrowed exercise clips labelled as pattern references everywhere
- [x] Placeholder phone number removed from Contact

## Open — polish (est. 1 session)
- [x] Meal image accuracy: photos only shown when every visible food is in the recipe (validated, 7 automated tests)
- [x] Mobile pass at 390px on all public pages (no overflow); signed-in screens still need your session
- [x] Mobile pass on signed-in screens at 390px
- [x] Empty/loading/error states audit across app screens
- [x] Removed orphaned components (DeluxeScoreCard, AppStoreBadges, ReminderSettings, StreakHistory, TodayMissionCard)
- [x] Accessibility: image descriptions and button labels added; dialogs/tabs/players use accessible primitives

## Open — commercial (est. 1 session, needs your input)
- [x] Tier prices finalised (Essential £14.99/£149.99, Signature £39.99/£399.99, Private £119.99 invitation-only — no public checkout)
- [ ] Stripe checkout & billing portal tested live end to end
- [x] Premium gating rules implemented (nutrition suite gated; 5 free AI scans/month; points-redeemed premium month honoured)
- [x] Rewards page shows premium status and unlocks 30 days on membership redemption
- [x] Grocery delivery: partner hand-off (Tesco/Sainsbury's/Ocado/Instacart) + saved pickup/drop-off windows
- [x] OG previews set on all public marketing pages (absolute image URLs)
- [x] Installable web app: manifest, icons, add-to-home-screen prompt
- [x] Onboarding copy + first-run experience reviewed
- [x] Published to deluxefitness.app; sitemap + social previews verified

## Realistic timeline
- Launch-blocking items: ~1 session (push/email delivery verification on your device)
- Everything above including polish: ~3 sessions
- Blocked on you: tap Enable on the reminders card on your installed app (so a real push subscription exists), a meal photo for the scan test, email sending domain + Resend key


## Audit corrections (this session)
- [x] Signature gating enforced on Body Targeting, Form Check, Progress Compare
- [x] Zero-minute sessions no longer count for Deluxe Score, XP, Coach context, history, adaptive plans (legacy rows reset)
- [x] Exercise video fuzzy matching tightened; player has play/pause, seek, volume, replay, captions
- [x] Partner streak-warning spam collapsed; duplicates purged
- [x] Weekly challenge targets fixed (300 pts per member)
- [x] Unified targets no longer flash fallback values (water + nutrition rings wait for load)
- [x] Public claims: no false free trial, wellbeing/wearable/roadmap claims match reality
- [x] Rewards catalogue: only Signature membership months redeemable; unfulfillable rewards deactivated
- [x] Push notification enable on installed app — user confirmed
- [x] Scanner photo upload test — user confirmed
- [x] Stripe live checkout run — user confirmed
- [ ] Email sending domain DNS verification still pending per backend status (records may be propagating)

## Security hardening (this session)
- [x] Members can no longer grant themselves paid membership: membership level and expiry are now system-only (verified by test); rewards and payments still work
- [x] Fresh security scan shows zero open findings across agent, app_mcp, supabase, and supply-chain scanners

## Domain & publishing status
- [x] Project is published at https://deluxefitness.app
- [x] Primary custom domains `deluxefitness.app` and `www.deluxefitness.app` are connected and active

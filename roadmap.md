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
- [ ] Email reminder delivery: needs a Resend API key + verified sending domain (push delivery is configured and in-app delivery verified)
- [x] Backend hardening: reward-point amounts now server-decided with a daily cap (remaining linter warnings are advisory: pg_net lives in public for scheduling, and the flagged functions are user-scoped by design)
- [ ] Reminder claim/quiet-hour edge semantics (hour boundary, DST) confirmed with test rows
- [x] Cron/scheduler wired for reminder dispatch (pg_cron → public API route); duplicate cron jobs removed (was double-sending)
- [x] Scanner resilience: HEIC/decode fallback, one automatic retry, honest error classification
- [x] Weekly team challenge auto-rollover (board never stale)
- [x] Borrowed exercise clips labelled as pattern references everywhere
- [x] Placeholder phone number removed from Contact

## Open — polish (est. 1 session)
- [ ] Meal image accuracy: confirm each photo matches its ingredient list (currently keyword-matched)
- [x] Mobile pass at 390px on all public pages (no overflow); signed-in screens still need your session
- [x] Mobile pass on signed-in screens at 390px
- [ ] Empty/loading/error states audit across app screens
- [x] Removed orphaned components (DeluxeScoreCard, AppStoreBadges, ReminderSettings, StreakHistory, TodayMissionCard)
- [ ] Accessibility: keyboard + screen-reader pass on dialogs, tabs, players

## Open — commercial (est. 1 session, needs your input)
- [x] Tier prices finalised (Essential £14.99/£149.99, Signature £39.99/£399.99, Private £119.99 invitation-only — no public checkout)
- [ ] Stripe checkout & billing portal tested live end to end
- [x] Premium gating rules implemented (nutrition suite gated; 5 free AI scans/month; points-redeemed premium month honoured)
- [x] Rewards page shows premium status and unlocks 30 days on membership redemption
- [x] Grocery delivery: partner hand-off (Tesco/Sainsbury's/Ocado/Instacart) + saved pickup/drop-off windows
- [x] OG previews set on all public marketing pages (absolute image URLs)
- [x] Installable web app: manifest, icons, add-to-home-screen prompt
- [ ] Onboarding copy + first-run experience review
- [ ] Publish to custom domain and verify live previews + sitemap

## Realistic timeline
- Launch-blocking items: ~1 session (push/email delivery verification on your device)
- Everything above including polish: ~3 sessions
- Blocked on you: tap Enable on the reminders card on your installed app (so a real push subscription exists), a meal photo for the scan test, email sending domain + Resend key


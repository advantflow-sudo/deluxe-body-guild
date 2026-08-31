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
- [ ] Signed-in end-to-end verification pass (scan → save → rescan → rings; grocery tick-off/regroup)
- [x] Production Web Push: VAPID keys configured, real browser subscriptions stored, encrypted delivery wired (verify on your installed app)
- [ ] Email reminder delivery verified from a verified sending domain
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
- [ ] Mobile pass on signed-in screens at 390px (needs preview sign-in)
- [ ] Empty/loading/error states audit across app screens
- [x] Removed orphaned components (DeluxeScoreCard, AppStoreBadges, ReminderSettings, StreakHistory, TodayMissionCard)
- [ ] Accessibility: keyboard + screen-reader pass on dialogs, tabs, players

## Open — commercial (est. 1 session, needs your input)
- [ ] Stripe plans/prices finalised + checkout & billing portal tested live
- [ ] Premium gating rules confirmed per feature
- [ ] Onboarding copy + first-run experience review
- [ ] Publish to custom domain, verify OG previews and sitemap

## Realistic timeline
- Launch-blocking items: ~2 sessions (mostly verification + push/email delivery)
- Everything above including polish and commercial: ~4 sessions
- Blocked on you: sign in on the preview (for signed-in checks), Stripe pricing decisions, push/email domain approval

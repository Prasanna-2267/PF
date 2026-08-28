# Parallax Flow Gate 3 progress

## Practice architecture correction — 2026-08-26

This is the current authoritative state and supersedes older Feature 8 wording below:

- removed Solve & Earn from real and demo mobile Practice;
- removed Question Bank/package sources and entitlement checks from Student Practice;
- all published Admin-uploaded questions for the learner's selected course are free;
- purchasable Question Banks remain PDF notes/packages surfaced through Notes/Library;
- secure sessions, timers, navigator, server grading and Free/Paid answer-policy behavior remain;
- Practice tracker now aggregates unique questions and attempts by subject, chapter and topic, plus 30-day activity; Paid weak-area signals use topic granularity;
- the Admin UI and Admin question authoring routes were not modified.

Last updated: 26 August 2026

## Feature 11 — Tracker consistency and chapter revision projections

Status: backend and real-session mobile integration complete in code; live database execution remains pending.

- added learner-scoped 7/30/90-day Tracker summaries from authoritative daily activity;
- returns total and average study time, active/goal days, best day, period trend, streak, syllabus completion, revision totals and selected-course exam countdown;
- added chapter-wise revision aggregation using Admin-authored `SUBJECT` and `CHAPTER` content entities, with safe hierarchy fallbacks for older folder trees;
- added transparent 1/7/21-day revision due intervals, due/upcoming/not-started/in-rhythm states and paginated revision history;
- connected real Tracker, revision shortcut and Revision Tracker screens while preserving named demo fixtures and existing animations;
- added no table, migration, Admin route or Admin UI change;
- backend TypeScript, focused unit test, integration-test discovery, mobile TypeScript and Expo lint passed;
- database-backed integration execution was safely skipped because the disposable PostgreSQL test flag/database was unavailable.

The proposed Admin-mobile backend batch is no longer required and is excluded from the active roadmap.

## Feature 12 — Deterministic adaptive daily study plan

Status: backend and real-session Home integration complete in code; migration deployment and live database execution remain pending.

- added additive `LearnerStudyPlan`, `LearnerStudyTask` and optional `StudyWorkloadEstimate` persistence in migration `20260827070000_add_adaptive_study_plans`;
- generates stable learner-local-date plans from carry-over, due revisions, partial note progress and accessible unread course notes;
- caps sessions to 15–45 minutes, the day to five tasks, and total generated work to the learner's saved daily target;
- supports manual tasks, start, idempotent completion/reopen, skip, reschedule, non-destructive removal and clear-completed history preservation;
- uses Admin estimates when records exist and labels safe fallback estimates as `FALLBACK_V1` when they do not;
- excludes unowned paid content and never creates an entitlement or purchase;
- real Home renders task sources, reasons, minutes, regeneration, full actions and real error states; named demos remain local;
- Prisma formatting/validation/generation, backend TypeScript, two planner unit tests, integration-test discovery, mobile TypeScript and Expo lint passed;
- the guarded database integration case remains skipped until the disposable PostgreSQL environment is available.

Practice-derived weak-concept recommendations are intentionally absent while Practice is paused. Admin workload-estimate authoring was not added because Admin-owned changes require explicit approval.

## Shared baseline

- Admin/web/backend repository: `Parallax-Flow-web`
- Branch: `main`
- Synchronized commit: `83e5635`
- Integration method: fetch followed by `git merge --ff-only origin/main`
- Worktree was clean and aligned with `origin/main` before Gate 3 implementation began.
- Shared backend changes remain additive and isolated to mobile authentication metadata, Student APIs, and their supporting tables. No Admin UI or Admin route contract has been changed.

## Feature 1 — mobile API and secure session foundation

Status: complete

Implemented only under `mobile/`:

- centralized authenticated Axios client;
- native SecureStore credential persistence and memory-only web preview storage;
- single-flight refresh-token rotation;
- session restoration before splash dismissal;
- real email/password sign-in using existing `/api/auth/login`;
- server session validation and student-only mobile access;
- secure logout and user-scoped React Query/AsyncStorage/in-memory cleanup;
- development-only mock account shortcuts;
- no false-success Google login while its native integration is pending.

Validation:

- `npx.cmd tsc --noEmit` — passed;
- `npm.cmd run lint` — passed with zero warnings/errors;
- Expo web production export — passed;
- Git diff check — passed.

Not yet end-to-end tested against the shared server/database. No shared environment or database was contacted.

## Admin-team update compatibility audit

Commit `83e5635` changes Admin styles and upload retry behavior, adds upload tests, and makes a type-only content service improvement. It does not invalidate Gate 1 or Gate 2 mobile contracts. No reconciliation code is required.

Upstream tests were not executed because dependencies are not installed in the nested repository. An implicit `npx` download was stopped after package resolution failed; no dependency or lockfile changed.

## Feature 2 - student bootstrap and client platform metadata

Status: complete

Implemented in the shared server without changing Admin UI or existing Admin API contracts:

- added authenticated, student-only `GET /api/student/bootstrap`;
- returns the current student profile, active session, academy context, memberships, entitlement summary, and server time;
- validates that both the user and current session remain active;
- records `ANDROID`, `IOS`, `WEB`, or `UNKNOWN` session platform metadata from `x-client-platform` instead of hardcoding every login as web;
- requires no Prisma migration and performs read-only queries in the new endpoint.

Implemented in `mobile/`:

- sends device name and client platform on password login;
- hydrates phone, avatar reference, and free/paid access state from the student bootstrap response;
- refreshes bootstrap data during session restoration and token rotation;
- treats temporary bootstrap outages as non-fatal while still failing closed for an unauthorized session.

Validation:

- backend `npm.cmd run typecheck` - passed;
- backend authentication tests - 5 passed;
- mobile `npx.cmd tsc --noEmit` - passed;
- mobile `npm.cmd run lint` - passed;
- database integration assertions were added for bootstrap authentication and response shape, but were not executed because this feature did not contact or mutate a shared database.

Environment note: the host Node 22 installation returned `uv_os_get_passwd ... ENOMEM` inside `tsx`. The installed, ignored local `tsx` package was temporarily adjusted to use the existing `USERNAME` environment variable so the unit test could run. No tracked dependency file or lockfile was changed.

## Feature 3 - staged student registration with dual OTP verification

Status: complete in code; migration deployment and real provider configuration remain pending.

Implemented in the shared server without changing Admin UI, Admin routes, or the existing web `POST /api/auth/register` contract:

- added an isolated `AUTH_STAGED_REGISTRATION_ENABLED` feature flag so mobile OTP registration can be enabled without enabling the legacy direct-registration route;
- added an additive `RegistrationChallenge` table and migration for hashed password/OTP state, expiry, attempts, resend limits, verification and completion timestamps;
- added staged registration endpoints for creating a challenge, sending/resending email or mobile codes, verifying both channels, and completing the account;
- creates the Student, password credential and authenticated session only after both channels are verified;
- stores only HMAC OTP hashes, permits five attempts and five resend cycles, uses a 30-second resend cooldown, expires registration after 15 minutes, and invalidates replaced challenges;
- added an idempotent HTTP SMS provider alongside the existing email provider;
- requires both email and SMS webhooks when staged registration is enabled in production;
- preserves the original web registration behavior and uses a separate feature flag to prevent an OTP bypass.

Implemented in `mobile/`:

- the signup form creates a real registration challenge and shows server validation/delivery errors;
- the existing animated email and mobile OTP panels now call the real verification endpoints;
- mobile OTP delivery begins only after email verification;
- successful mobile verification completes registration, securely persists the returned session, and continues to personalisation/rocket launch;
- `mockuser` and `mockadmin` remain explicit development-only UI preview paths;
- non-production servers without delivery providers return a development code for local testing; production never returns OTP codes.

Validation:

- Prisma schema validation and client generation - passed;
- backend `npm.cmd run typecheck` - passed;
- focused authentication/configuration tests - 9 passed;
- mobile `npx.cmd tsc --noEmit` - passed;
- mobile `npm.cmd run lint` - passed;
- a disposable-database integration test was added for the complete email OTP -> mobile OTP -> Student/session flow, including Android session metadata and completion replay rejection;
- the integration test was not executed because no explicitly disposable test database was configured or contacted.

Deployment requirements:

1. deploy migration `20260826150000_add_registration_challenges` through the shared backend migration process;
2. set `AUTH_STAGED_REGISTRATION_ENABLED=true` for mobile signup;
3. configure `EMAIL_WEBHOOK_URL` and `SMS_WEBHOOK_URL` plus bearer tokens where required;
4. deploy the backend before releasing the connected mobile signup build.

## Feature 4 - learner personalisation and preferences

Status: complete in code; migration deployment and disposable-database integration execution remain pending.

Implemented in the shared server without changing Admin UI or existing Admin API contracts:

- added an additive `LearnerPreference` model and migration for selected course, exam date precision, academy reference, daily target, timezone, language, reminder time, onboarding completion and optimistic versioning;
- added student-only `GET /api/student/preferences/options`, `GET /api/student/preferences`, `PUT /api/student/preferences`, and `PATCH /api/student/preferences` endpoints;
- limits selectable courses to active platform courses and active courses from the learner's active Academy memberships;
- choosing a course is personalisation only and does not create an enrolment, entitlement, order, purchase, or paid-content unlock;
- normalizes an exam month/year without a day to the first day of that month and records `MONTH` precision; exact valid days record `DAY` precision;
- validates real calendar dates, daily target bounds, IANA timezones, reminder time format and stale update versions;
- includes the current preference and selected course in `GET /api/student/bootstrap`.

Implemented in `mobile/`:

- real authenticated onboarding loads only server-authorized course choices and saves preferences to the backend;
- the existing mock-user and mock-Google preview paths remain local and do not call production APIs;
- onboarding now captures a daily study target in addition to course, exam month/year/day and academy reference;
- Account saves exam date, academy reference, target, reminder, language, timezone and mobile number to the backend for real sessions;
- server-selected course identity is read-only in Account, preventing arbitrary course text from being mistaken for access;
- bootstrap hydration restores the saved learner preference into the existing UI profile store.

Validation:

- Prisma schema validation - passed;
- backend `npm.cmd run typecheck` - passed;
- mobile `npm.cmd run lint` - passed;
- mobile TypeScript `tsc --noEmit` - passed;
- integration assertions cover option visibility, foreign-Academy denial, first-day normalization, optimistic version rejection, bootstrap hydration and the no-enrolment/no-unlock boundary;
- disposable-database integration execution remains pending because the configured PostgreSQL test server at `127.0.0.1:55432` was unavailable;
- the general backend test command reached 31 passing tests, while five pre-existing database-dependent tests failed only because that same test database was unavailable.

Deployment requirements:

1. deploy migration `20260826170000_add_learner_preferences` after the registration migration;
2. deploy the backend before releasing the connected onboarding/account mobile build;
3. run the full integration suite against an explicitly disposable PostgreSQL database.

## Next backend checkpoint

Permanent single-device binding is intentionally deferred at the user's request.

## Feature 5 - protected PDF note opening

Status: complete in code; migration deployment, real object-storage verification and disposable-database integration execution remain pending.

Implemented in the shared server without changing Admin UI or Admin route contracts:

- added an additive `NoteViewerSession` model and migration with user, authenticated session, note, trace ID, expiry, lifecycle, page/scroll position and monotonic progress;
- added student-only viewer creation, manifest, protected content, progress, heartbeat and close endpoints;
- viewer creation and every subsequent operation recheck publication, active course, Academy enrolment where applicable, and paid entitlement/grant expiry;
- a direct note entitlement/grant can authorize the selected note without silently creating an enrolment;
- viewer sessions are bound to both learner and current authenticated session, so another user or login session cannot reuse a viewer ID;
- private storage URLs are used only server-side and are never returned to mobile;
- PDF pages are watermarked server-side with learner email, trace ID and view timestamp;
- content is served inline, supports byte ranges, and uses strict private `no-store`/no-cache headers;
- the former `/api/student/content/{contentId}/access` raw signed-URL endpoint was removed to close the download/watermark bypass;
- heartbeat renews only the short viewer window and cannot extend an underlying resource entitlement;
- closing is idempotent and expired/closed sessions fail closed.

Implemented in `mobile/`:

- UUID-backed note routes create and close real viewer sessions;
- the reader loads manifest metadata and authenticated protected content without displaying download, print or page-navigation controls;
- continuous scrolling and pinch zoom remain enabled;
- a five-minute heartbeat keeps an actively read note session current;
- initial reading progress is persisted after document load;
- existing slug-based UI demo notes continue using the local five-page preview;
- web and native development builds accept authenticated protected sources; Expo Go now clearly explains that a development build is required instead of pretending the sample PDF is the protected server document;
- native screenshot/app-switcher protection and the client watermark overlay remain in place as defense in depth.

Validation:

- Prisma format, validation and client generation - passed;
- backend TypeScript - passed;
- mobile lint and TypeScript - passed;
- integration test discovery/compilation - passed;
- integration assertions cover raw URL removal, viewer ownership isolation, manifest capabilities, personalized PDF mutation, inline/no-store headers, byte ranges, monotonic progress and closed-session denial;
- database/storage-backed assertions were not executed because the explicitly disposable integration database was not enabled.

Deployment requirements:

1. deploy migration `20260826190000_add_note_viewer_sessions` after the learner-preferences migration;
2. configure the existing durable object-storage provider;
3. deploy the backend before releasing real protected-note opening in mobile;
4. use an Expo development build for native PDF testing (`react-native-pdf` is not available inside Expo Go);
5. execute the full suite against a disposable PostgreSQL database and test storage provider before production.

## Previous backend checkpoint

The database-backed notes catalogue/hierarchy and learner note-state slice identified here was completed as Feature 6 below.

## Feature 6 - notes catalogue, hierarchy and learner note state

Status: backend complete in code; mobile catalogue replacement, migration deployment and disposable-database execution remain pending.

Implemented in the shared server without changing Admin UI, Admin routes, upload behavior, or existing Admin response contracts:

- added additive `LearnerNoteState` and `NoteRevisionEvent` models plus migration `20260826210000_add_learner_note_state`;
- exposes the selected course's published Admin-uploaded PDF/folder hierarchy directly from `ContentItem`, without copying or inventing a separate mobile catalogue;
- added Student APIs for the complete tree, flat search/status/favourite filtering, recent notes, favourites, note details and learner state;
- added completion and favourite mutations plus append-only revision events;
- permits completion, favourite and revision metadata on visible unpurchased premium notes while keeping protected viewer creation entitlement-gated;
- computes access from direct note, course or package entitlements and recognizes Admin grants without silently creating an order or enrolment;
- synchronizes a successful protected-viewer open to `firstOpenedAt`/`lastOpenedAt` and synchronizes reader position to monotonic learner progress;
- recent notes therefore reflect real successful opens, while inaccessible card taps never enter the list;
- returns storage-safe metadata only; catalogue/state responses never expose `storagePath` or signed object-storage URLs.

New Student routes:

- `GET /api/student/notes/tree`
- `GET /api/student/notes`
- `GET /api/student/notes/recent`
- `GET /api/student/notes/favourites`
- `GET /api/student/notes/:contentItemId`
- `GET /api/student/notes/:contentItemId/state`
- `PATCH /api/student/notes/:contentItemId/state`
- `POST /api/student/notes/:contentItemId/revisions`

Validation:

- Prisma format, validation and client generation passed;
- backend TypeScript passed;
- existing database-independent tests passed; five pre-existing tests that require PostgreSQL failed because the configured disposable server at `127.0.0.1:55432` was unavailable;
- integration suite discovery/compilation passed with database tests safely skipped;
- integration assertions now cover locked-note metadata actions, locked viewer denial, favourites, revision creation, successful-open recency and monotonic reader-state synchronization.

Deployment requirements:

1. deploy migration `20260826210000_add_learner_note_state` after the viewer-session migration;
2. deploy the backend before switching the mobile Notes screens from demo catalogue IDs to real ContentItem UUIDs;
3. run the full integration suite against an explicitly disposable PostgreSQL database.

## Previous backend checkpoint

The packages/store/entitlement backend presentation proposed here was completed as Feature 7 below. Mobile Notes/Library wiring remains a separate client-integration task.

## Feature 7 - Student packages, store, Library and entitlement presentation

Status: backend complete in code; mobile Library/Packages integration and disposable-database execution remain pending.

Implemented as an additive Student read layer over the existing Admin catalogue and commerce records:

- lists published packages for the learner's selected course with search and `all/owned/available` filters;
- returns package contents, server-owned prices and ownership from active direct package or course entitlements;
- exposes a combined paid-note/package store projection without accepting price or ownership from mobile;
- exposes the learner's entitlement ledger with effective `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, or `REVOKED` state evaluated against server time;
- exposes Library-owned PDF resources by expanding direct content, package and course entitlements and attaching persisted reading progress;
- derives `Owned`, `Free purchases`, and `Paid purchases` from authoritative entitlements and successful orders rather than UI counters;
- returns presentation-safe, user-scoped receipts with normalized amount/minor-unit totals, item snapshots, payment state and coupon summary;
- preserves orders, receipts and learner progress after expiry/revocation while denying expired content through the existing viewer authorization;
- does not alter Admin routes, Admin UI, package authoring, checkout pricing, coupon evaluation, payment webhooks, refund handling or entitlement creation.

New Student routes:

- `GET /api/student/packages`
- `GET /api/student/packages/:packageId`
- `GET /api/student/store/resources`
- `GET /api/student/library`
- `GET /api/student/entitlements`
- `GET /api/student/entitlements/:entitlementId`
- `GET /api/student/orders/:orderId/receipt`

Database impact:

- no new migration;
- read-only projection over `Package`, `PackageItem`, `ContentItem`, `Entitlement`, `Order`, `OrderItem`, `Payment`, `CouponRedemption`, and `LearnerNoteState`;
- existing checkout remains the only purchase/entitlement writer in this slice.

Validation:

- backend TypeScript passed;
- Prisma schema validation passed;
- diff whitespace validation passed;
- integration discovery/compilation passed with database cases safely skipped because no disposable PostgreSQL database is enabled;
- integration assertions cover pre/post-purchase package ownership, zero-price purchase reflection, Library expansion, free-purchase counts, receipt IDOR protection, entitlement IDOR protection, and request-time expiry of a stale stored `ACTIVE` grant.

## Previous backend checkpoint

The secure practice backend proposed here was completed as Feature 8 below.

## Feature 8 - secure practice sources, sessions, attempts and chapter tracker

Status: backend core complete in code; Admin metadata authoring, Solve & Earn, mobile wiring, migration deployment and disposable-database execution remain pending.

Implemented in the shared backend without modifying Admin UI or existing Admin route response contracts:

- added Question practice metadata for an existing Package-backed Question Bank, `PYQ/RTP/MTP/ORIGINAL` collection and Archive-only year;
- added immutable `PracticeSession`, `PracticeSessionQuestion` and append-only `PracticeAttempt` models;
- uses the learner's selected active course and Academy membership when resolving practice data;
- exposes a free Archive and published Question Banks, with exact active package entitlement required for each bank;
- rejects a year filter for Question Banks and accepts it only for Archive questions;
- validates subject/chapter/lesson/topic, collection, answer format, question count and custom timer entirely on the server;
- creates a snapshotted question order so later Admin edits cannot change an active session's prompts or grading key;
- prompt APIs serialize question/case/options and navigator state only; answer keys, model answers and explanations remain in private server snapshots;
- grades MCQs server-side and records every attempt using an idempotent client attempt ID;
- Free policy releases an explanation only after a correct response and permanently locks the first incorrect response;
- Paid policy releases an explanation after every response and permits another attempt after an incorrect response;
- rechecks exact Question Bank entitlement on every bank answer submission, so expiry/refund/revocation stops an active bank session from accepting more answers;
- supports navigator states for unanswered, marked review, correct, paid wrong, Free locked wrong and descriptive awaiting review;
- supports optional server deadline, session resume, explicit completion and safe user-scoped IDOR behavior;
- exposes a chapter-level practice tracker with unique questions solved, attempt count, correct/wrong totals, time and accuracy;
- exposes preliminary weak chapters only when the learner has Paid capability; robust concept-level scoring remains a later analytics feature.

New Student routes:

- `GET /api/student/practice/sources`
- `GET /api/student/practice/filters`
- `POST /api/student/practice/sets/preview`
- `POST /api/student/practice/sessions`
- `GET /api/student/practice/sessions/:sessionId`
- `GET /api/student/practice/sessions/:sessionId/questions`
- `PATCH /api/student/practice/sessions/:sessionId/questions/:sessionQuestionId/review`
- `POST /api/student/practice/sessions/:sessionId/questions/:sessionQuestionId/attempts`
- `POST /api/student/practice/sessions/:sessionId/complete`
- `GET /api/student/practice/tracker`

Database impact:

- migration `20260826230000_add_secure_practice_sessions`;
- new enums and tables for practice sessions, immutable session questions and attempts;
- additive Question metadata and Package relation;
- database constraints cover year/timer/count ranges, Archive-only years, non-empty attempts, sequence uniqueness and attempt idempotency.

Security compatibility note:

- mobile must use only the new `/api/student/practice/*` endpoints;
- legacy `GET /api/student/questions` still returns `answerHtml` and was not silently changed because its current web consumers have not been audited;
- it must be deprecated/sanitized before production mobile practice launch after confirming the Admin/web-team impact.

Validation:

- Prisma format, validation and client generation passed;
- backend TypeScript passed;
- integration discovery and compilation passed with database cases safely skipped;
- integration assertions cover prompt answer leakage, Free wrong lock/no explanation, Free correct explanation, idempotent replay, Paid wrong explanation/retry, exact-bank entitlement, bank year rejection, entitlement revocation during a session, timer expiry, IDOR and chapter tracker aggregation.

Deployment requirements:

1. review and deploy migration `20260826230000_add_secure_practice_sessions` after the learner-note-state migration;
2. obtain approval before extending the Admin question authoring contract for Question Bank, collection and Archive year metadata;
3. classify/backfill existing questions before relying on year/collection filters;
4. run the full integration suite against an explicitly disposable PostgreSQL database;
5. deploy backend before connecting the mobile Practice UI.

## Next backend checkpoint

Recommended next backend slice: Solve & Earn challenge policy and server-timed sessions, using the completed reward-ledger foundation documented below.

## Feature 9 - reward wallet, claims and immutable ledger foundation

Status: backend feature complete and verified; wallet counters are now wired into real-session Home, while Solve & Earn source-specific rewards remain a future slice.

Implemented without changing Admin UI or Admin route contracts:

- additive per-learner points/hearts wallet with non-negative balances, a three-heart cap and learner-timezone monthly refresh to three hearts;
- server-created reward claims keyed uniquely by learner, source type, source ID and policy version;
- immutable earn ledger entries with deltas, resulting balances, source provenance, policy version and learner-scoped idempotency keys;
- replay-safe claiming under serializable transactions; the phone supplies only the claim ID and idempotency key, never a points/hearts amount;
- duplicate source claims cannot be minted twice, replaying a successful claim cannot duplicate balance, and reusing an idempotency key for another claim is rejected;
- cursor-paginated learner ledger history and safe display-only reward rules;
- the Student bootstrap payload now includes the authoritative wallet snapshot.

New Student routes:

- `GET /api/student/rewards/wallet`
- `GET /api/student/rewards/ledger?cursor=&limit=`
- `GET /api/student/rewards/rules`
- `POST /api/student/rewards/claims/:claimId/claim` with `Idempotency-Key`

Database impact:

- migration `20260827010000_add_reward_wallet_and_ledger`;
- new `RewardWallet`, `RewardClaim` and `RewardLedgerEntry` tables plus reward enums and database checks;
- no shared database migration was applied by Codex.

Validation:

- Prisma format, validation and client generation passed;
- backend TypeScript passed;
- all 26 migrations applied cleanly to a new disposable PostgreSQL 16 database;
- focused integration test passed for source deduplication, claim replay, key-reuse rejection, heart-cap enforcement and ledger pagination;
- the disposable cluster was stopped and removed after verification.

## Feature 10 - focus sessions, daily activity and streak lifecycle

Status: backend and real-session mobile integration complete in code and verified against an isolated database; coordinated shared-database migration deployment remains pending.

Implemented without changing Admin UI or Admin route contracts:

- authoritative server-timed check-in/check-out shared by Home and Tracker;
- one active focus session per learner, concurrent-start convergence, heartbeat, resume, history and explicit abandon;
- checkout idempotency and a 24-hour maximum credited duration;
- learner-timezone daily attribution, including sessions crossing local midnight;
- daily target snapshots, focus totals, session count, goal completion and streak qualification;
- a one-minute minimum for a focus day to qualify, preventing zero-length reward/streak farming;
- one server-created daily reward claim: 10 points below target or 20 points at/above target, never duplicated by replay;
- current/longest streak calculation, learner calendar projection, missed-day eligibility and one-heart recovery;
- learner-month heart reset to three, with recovery spending recorded immutably in the reward ledger;
- real authenticated Home and Tracker now share the backend session, daily totals, wallet and streak state; named demo accounts retain local fixtures;
- the existing Tracker consistency graph visual was intentionally not modified.

New Student routes:

- `GET /api/student/focus-sessions/active`
- `POST /api/student/focus-sessions`
- `POST /api/student/focus-sessions/:sessionId/heartbeat`
- `POST /api/student/focus-sessions/:sessionId/checkout` with `Idempotency-Key`
- `POST /api/student/focus-sessions/:sessionId/abandon`
- `GET /api/student/focus-sessions`
- `GET /api/student/daily-summary?date=YYYY-MM-DD`
- `GET /api/student/streak`
- `GET /api/student/streak/calendar?month=YYYY-MM`
- `GET /api/student/streak/recoveries/eligible`
- `POST /api/student/streak/recoveries` with `Idempotency-Key`

Database impact:

- migration `20260827030000_add_focus_daily_activity_and_streak`;
- new `FocusSession`, `LearnerDailyActivity`, `LearnerStreakState` and `LearnerStreakDay` tables;
- additive monthly-period field/default policy in the not-yet-deployed reward migration;
- no migration or query was run against the shared Admin database.

Validation:

- all 27 migrations applied from zero to a disposable PostgreSQL 16 database;
- three focused reward/focus/streak tests passed, covering concurrency, IDOR, server timing, checkout replay, daily aggregation, daily claim uniqueness, monthly hearts, recovery replay, calendar state and abandon;
- backend Prisma validation and TypeScript passed;
- mobile TypeScript and Expo lint passed;
- the disposable cluster was stopped and removed.

## Mobile integration checkpoint - Batches 2 to 4

Status: mobile wiring and isolated-database integration verification complete; coordinated shared-database migration deployment remains pending.

- Real authenticated learners now use the Batch 2 Notes APIs for recursive course hierarchy, search, completion filters, recent notes, favourites, locked-note organisation actions, revisions and protected-reader navigation.
- Real authenticated learners now use Batch 3 package, Library, entitlement-derived ownership, order-history and receipt projections. Locked individual notes no longer simulate a successful purchase; they present authoritative access state and direct the learner toward published packages.
- Real authenticated learners now use the Batch 4 Practice APIs for Archive/Question Bank sources, source-specific filters, session creation, optional server timer, secure prompt retrieval, question navigator, review marks, answer submission, Free/Paid explanation and retry policies, completion and chapter analytics.
- Demo users remain explicitly isolated on the existing local fixtures. A failed real API request surfaces a retry/error state and never falls back to demo data.
- Mobile integration uses only `/api/student/practice/*`; the legacy answer-leaking `/api/student/questions` endpoint is not called.
- No Admin UI, Admin-owned route, Prisma schema, migration or shared database row was changed during this integration checkpoint.

Validation completed:

- mobile `npx tsc --noEmit`: passed;
- mobile `npx expo lint`: passed;
- backend `npm run typecheck`: passed;
- an isolated PostgreSQL 16 cluster was created on loopback port `55432`; all 25 committed migrations applied successfully to the disposable `parallax_flow_test` database;
- focused production integration tests passed for protected Notes/PDF viewing, locked-note actions, watermark/session binding, Packages, entitlements, Library, receipts, secure Practice policies, timers and chapter tracking;
- the Notes and Library test fixtures now explicitly restore their selected course, preventing a preceding personalisation test from leaking state into them;
- the broader shared suite exposed missing Admin-owned schema migrations for `StoreMerchandisingSection` and `ContentSampleImage.role`; these were not changed because they belong to the Admin team;
- no migration was applied to, and no query was made against, the shared Admin database.
- Batch 12 Paid monthly reports are complete in code: Student-only Paid authorization, live current-month aggregation, immutable completed-month snapshots, archive/detail endpoints, and real mobile integration. Practice-derived metrics remain explicitly unavailable while Practice is paused. Migration `20260827090000_add_paid_monthly_reports` is additive and has not been applied to the shared database. Prisma validation/generation, backend TypeScript, focused unit tests, mobile TypeScript and Expo lint pass; the guarded database integration test compiles and skips without an explicitly disposable database.

## Resource validity and expiry checkpoint

- Added the backward-compatible `ContentValidityMode` policy to paid PDF resources: `PERMANENT` by default or `EXAM_DATE_OFFSET` with 0-3650 Admin-defined days.
- Added only a compact validity selector and conditional days input to the existing website upload and Edit Access flows. Existing Admin layouts, routes, upload behaviour and permanent content remain intact.
- Exam-relative expiry is derived from the canonical learner exam date and remains valid through the complete final date. The earlier of resource expiry and entitlement/grant expiry always wins.
- Package purchases do not flatten validity: every included PDF enforces its own rule at request time.
- Note catalogue/open authorization, protected viewer renewal, Library, course-content and adaptive study-plan projections now enforce the same server-time rule. Missing exam data and expired access fail closed without deleting reading state or receipts.
- Public website catalogue reads expose resource validity, and Admin edits retain the existing audit trail with before/after policy values.
- Added migration `20260827110000_add_resource_validity_policy`; it has not been applied to the shared database.
- Validation passed: Prisma schema validation/client generation, backend TypeScript, four focused policy tests, mobile TypeScript and the complete Admin production build (2,163 modules). The broad server unit command also passed all non-database tests; five pre-existing database-backed cases could not connect because the disposable PostgreSQL instance at `127.0.0.1:55432` was not running.

## Notifications and reminders checkpoint

- Preserved the Admin team's existing Broadcast page and Publish/Schedule contracts; no Admin component was redesigned.
- Existing academy broadcast recipient expansion now also creates learner inbox items and retryable Expo push deliveries.
- Added learner installation tokens, category preferences, quiet hours, durable read state, delivery attempts and automatic invalid-token revocation.
- Added daily plan, revision due, resource expiry and streak-risk reminder scans plus sign-in security and profile-change account alerts.
- Added mobile permission/token bootstrap, tap routing and compact Account preference controls.
- Added migration `20260827130000_add_mobile_notifications`; it remains unapplied to the shared database.
- Validation passed: Prisma format/validation/generation, backend typecheck and production build, focused Expo provider test, mobile TypeScript and Expo lint, Expo config validation, and complete Admin production build (2,163 modules).

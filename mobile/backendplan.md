# Parallax Flow Mobile Backend Plan

## Authoritative product correction — 2026-08-26

This correction supersedes older references in this document to Question Bank Practice sources or Solve & Earn:

- Practice questions are completely free and come only from published Admin Excel/question uploads for the learner's selected course.
- Practice has no package entitlement gate, purchasable question source or Solve & Earn/reward mode.
- Purchasable Question Banks are PDF notes/packages. They use the existing Notes, Library, entitlement and protected-reader APIs.
- Practice filters use Admin-authored course, subject, chapter, optional lesson/topic, collection, answer format and optional year metadata.
- Free/Paid capability changes retry/explanation and advanced weak-topic analytics only; it never changes question visibility.
- The implemented Student Practice source is `ARCHIVE` as an internal compatibility identifier. It means the single free course-question pool, not a separate commercial product.

## Scope correction — Admin mobile backend

The user explicitly removed the proposed Admin-mobile backend batch from the mobile backend roadmap on 26 August 2026. The existing Admin-team backend remains authoritative for Admin operations. Section 17 is retained only as historical discovery context and must not be implemented unless the user restores that scope.

## Scope correction — Mobile commerce is read-only

Purchases happen only on the website. The mobile application must never create quotes, validate coupons for checkout, create purchase orders, initialize/confirm payments, process refunds or provide an in-app purchase flow. Mobile may show published paid notes/packages and their locked state, then refresh authoritative entitlements, Library ownership, order history and receipts after a website purchase. Commerce-write endpoints later in this document are website-backend context only and are not part of the mobile implementation roadmap.

## Batch 10 implementation checkpoint — Tracker and revision

Implemented in the shared server and connected to real authenticated mobile sessions without changing Admin contracts or adding a migration:

- `GET /api/student/tracker/summary?days=7|30|90` aggregates learner-timezone activity, consistency, goals, streak, note completion, revision totals and exam countdown;
- `GET /api/student/revisions/chapters?filter=all|due|not_started&subjectId=...` projects chapter/subject groups from the published `ContentItem` hierarchy and existing learner note states;
- `GET /api/student/revisions/history?page=...&limit=...` returns learner-scoped append-only revision history;
- spaced revision due dates use a transparent first-version rhythm of 1, 7 and 21 days based on revision depth;
- real Tracker and Revision Tracker screens consume these endpoints, while named demo accounts remain on local fixtures.

## Batch 11 implementation checkpoint — Adaptive daily study plan

Implemented as deterministic, non-AI learner planning with additive migration `20260827070000_add_adaptive_study_plans`:

- stable learner-timezone daily plans persisted in `LearnerStudyPlan` and append-preserving task history in `LearnerStudyTask`;
- priority order: unfinished carry-over, due revision, continue an in-progress note, then the next accessible unread syllabus note;
- daily packing respects the learner target, 15–45 minute bounded sessions, content deduplication and a five-task maximum;
- supports manual creation, start, idempotent complete/reopen, skip, future-date reschedule, non-destructive removal and clear-completed;
- locked paid resources are excluded unless an active content/package/course entitlement grants access;
- optional `StudyWorkloadEstimate` records supply Admin-estimated reading/revision minutes; missing records are explicitly versioned as `FALLBACK_V1` rather than inferred silently;
- real Home sessions consume the API with loading/error states and task actions; named demo sessions retain the persisted local preview.

The current v1 deliberately excludes Practice-derived weak-concept tasks while Practice work is paused. Admin UI/API authoring for workload estimates requires separate approval before editing Admin-owned code.

Status: implementation reference for the React Native mobile application

API base used in this document: `/api/v1`

Scope: `mobile/` only

## 1. Purpose and scope

This is the greenfield backend contract for the Parallax Flow React Native application. It was derived from the mobile routes, components, local stores, demo catalogues, UI-only flows, and the requirements recorded in `mobile/backendtodo.md`.

This plan intentionally does **not** inspect, reuse, or depend on any existing website or server implementation. The website may remain an upstream content-management client later, but this document defines only the APIs and backend behavior required by the mobile student and mobile Admin experiences.

The mobile app has two surfaces:

- Student: authentication, onboarding, home, notes, protected reading, practice, tracker, revision tracker, library, purchases, receipts, account, and Paid reports.
- Admin: dashboard, students, complimentary access, orders and receipts, course structure, published catalogue, question coverage, coupons, and audit activity.

## 2. Mobile route audit covered by this plan

| Mobile area | Routes/screens covered |
| --- | --- |
| Entry and authentication | Welcome, sign up, sign in, Google auth, dual OTP verification, forgot/reset password, forced logout |
| Onboarding and account | Course selection, exam date, academy ID, learner profile, daily target, language, timezone, reminders, logout |
| Home | Focus check-in/out, daily focus, rewards, streak/hearts, exam countdown, syllabus progress, study to-do list |
| Notes | Search, Notes/Packages tabs, status filters, recent/favourite cards, subject -> unit -> optional topic -> note hierarchy, locked-note actions |
| Secure reader | Access check, continuous PDF, reading progress, watermark identity, secure viewer session |
| Practice | Archive and Question Bank modes, source-specific filters, answer formats, timer, Solve & Earn, navigator, answer/retry/explanation rules |
| Analytics | Practice tracker, study tracker, streak calendar, consistency, weak concepts, revision tracker, monthly reports |
| Commerce | Store/library resources, free and paid orders, coupons, checkout, entitlements, expiry, receipts |
| Admin | Overview, students/details/grants, orders/receipts/analytics, courses, catalogue, question coverage, coupons, audit |

## 3. Product rules the backend must enforce

The phone is never authoritative for authorization, money, time limits, points, streaks, answers, or resource expiry.

### 3.1 Free, Paid, ownership, and grants

`plan = paid` and `owns this resource` are different checks.

| Capability | Free plan | Paid plan | Additional requirement |
| --- | --- | --- | --- |
| Practice Archive/PYQs | Allowed | Allowed | Published archive content |
| Purchased Question Bank | Allowed | Allowed | Exact active Question Bank entitlement |
| Open free note | Allowed | Allowed | Resource is published |
| Open premium note/package content | Not by plan alone | Not by plan alone | Exact active purchase, package entitlement, or Admin grant |
| Mark premium note completed/favourite/revised without purchase | Allowed | Allowed | Metadata action only; content remains locked |
| Explanation after correct MCQ answer | Allowed | Allowed | Submitted attempt |
| Explanation after wrong MCQ answer | Denied | Allowed | Paid feature entitlement active |
| Retry a wrong MCQ | Denied | Allowed | Paid feature entitlement active and question/session still valid |
| Concept-wise weak areas | Locked | Allowed | Paid feature entitlement active |
| Monthly report archive | Locked | Allowed | Paid feature entitlement active |

Infographic notes and Question Banks may also expire. An expired plan or expired resource entitlement removes only the capability it grants; it must not delete order history, attempts, progress, favourites, or receipts.

### 3.2 Permanent single-device binding

Each learner account has one permanently approved installation until an authorized recovery replaces it.

- First successful sign-in or completed sign-up atomically binds the account to the installation's public key.
- Logging out revokes sessions but does not remove the binding.
- The same approved installation may sign out and back in any number of times.
- Every other installation is rejected even when the approved device has no active session.
- Password, OTP, refresh-token, and Google flows all require the same device proof.
- Device replacement requires verified recovery and must revoke the old binding and all refresh tokens.
- Do not use IMEI, MAC address, phone number, advertising ID, or raw serial number as the binding.
- Use an app-generated key pair protected by Android Keystore/iOS Keychain, an installation ID, signed challenges, and optional Play Integrity/App Attest risk signals.

### 3.3 Exam date

- Course is mandatory during onboarding.
- Exam month and year are mandatory.
- Exact day is optional.
- When day is omitted, the canonical exam date is the first day of the selected month.
- The server stores and returns one ISO date and whether the day was user-selected or defaulted.
- Exam countdown and pressure are calculated from server time and learner timezone. The visual `365 -> actual days` count is client animation only.

### 3.4 Focus, streaks, points, and hearts

- Only one active focus session per learner.
- Check-in and checkout use server timestamps; device clock cannot set duration.
- A qualifying completed study/focus day updates the streak once.
- Daily points are awarded at most once: 10 points when completed time is below target, 20 points when it is equal to or above target.
- Hearts restore an eligible missed streak day. A learner may hold at most 3 hearts per calendar month.
- Rewards use an immutable, idempotent ledger. Replaying checkout or claim requests cannot duplicate points.

### 3.5 Notes and protected documents

- The hierarchy is course -> category -> subject -> unit/chapter -> optional topic -> note.
- Search and filters return only published metadata visible to the learner, including locked cards.
- Completion, favourite, and revision metadata actions are allowed on unpurchased premium notes.
- Opening content requires current entitlement or Admin grant.
- Protected PDFs use short-lived viewer sessions and must not expose permanent public URLs.
- Each rendered document is watermarked with the authenticated learner's email and traceable view information.
- Viewer responses use `Cache-Control: no-store`; signed content tokens expire quickly and are bound to user, session, device, and resource.
- Download/print controls are not exposed. Native screenshot/screen-record prevention remains a client/platform responsibility. No software can prevent an external camera or fully guarantee protection on a compromised/rooted device.
- Notes scroll continuously and pinch/double-tap zoom is handled by the client; there are no page-next/page-previous or zoom-percentage APIs.

### 3.6 Practice

- Archive/PYQ is free for all and includes year selection.
- Question Bank requires ownership of that exact active, unexpired bank.
- Question Bank filters may include Past Year, RTP, and MTP collections but must **not** expose a year filter.
- Formats are MCQ, descriptive, and case study.
- Standard practice may use a custom countdown or no timer.
- Solve & Earn uses a server-configured question count, duration, accuracy threshold, reward, and attempt policy.
- A Free learner's first wrong attempt is locked and cannot be solved again. Its explanation is withheld.
- A Paid learner may retry a wrong answer and receives the explanation after every submitted attempt.
- Question answer keys and explanations are never sent before the relevant answer-policy check.

## 4. API-wide conventions

### 4.1 Authentication and headers

- Access token: short-lived JWT or opaque token in `Authorization: Bearer <token>`.
- Refresh token: rotating, stored only in platform secure storage.
- Device proof: signed server nonce supplied during sign-in/refresh and periodically for protected operations.
- Mutating requests that can be replayed require `Idempotency-Key`.
- Clients send `X-App-Version`, `X-Platform`, `X-Installation-Id`, and an optional `X-Request-Id`.
- Server responses include `requestId` and `serverTime`.

### 4.2 Response shape

```json
{
  "data": {},
  "meta": {
    "requestId": "req_...",
    "serverTime": "2026-08-16T12:00:00Z",
    "nextCursor": null
  }
}
```

Errors use a stable machine-readable code:

```json
{
  "error": {
    "code": "RESOURCE_ENTITLEMENT_REQUIRED",
    "message": "Purchase or access is required to open this note.",
    "details": {},
    "requestId": "req_..."
  }
}
```

### 4.3 Shared rules

- UUID/ULID identifiers; never expose sequential database IDs.
- ISO-8601 UTC timestamps; calculate learner-day boundaries using the stored IANA timezone.
- Store money as integer paise and currency as ISO code (`INR`).
- Cursor pagination for lists; bounded range queries for charts.
- Use optimistic concurrency (`version` or `If-Match`) on editable profiles, course structures, and coupons.
- Soft-delete user-authored data where recovery is useful; immutable ledgers, attempts, orders, receipts, and audits are never edited away.
- All list/search/filter parameters are allow-listed and indexed.
- Rate-limit login, OTP, password reset, viewer sessions, answer submission, coupon validation, and reward claims.

## 5. Bootstrap and runtime configuration endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Liveness only; no sensitive dependency details |
| GET | `/mobile/config` | Optional | Minimum/supported app version, maintenance state, auth providers, OTP length/resend delay, feature flags, public support links |
| GET | `/bootstrap` | User | One post-login payload: user, role, profile/onboarding state, plan, resource-entitlement summary, device-binding state, reward wallet, active focus session, and feature flags |

## 6. Authentication, verification, sessions, and device binding

### 6.1 Sign-up and verification

| Method | Endpoint | Purpose and contract |
| --- | --- | --- |
| POST | `/auth/sign-up/password` | Start email/password registration with `name`, `mobile`, `email`, and password. Validate uniqueness/strength, create a pending flow, and send separate email and mobile OTPs. Return `flowId`, masked destinations, required channels, expiries, resend timers. Do not create an active session yet. |
| POST | `/auth/sign-up/google` | Exchange a Google authorization code + PKCE verifier. Take verified name/email from Google; no password is collected. Return a pending/completed sign-up state and any remaining profile requirement. |
| GET | `/auth/verification-flows/{flowId}` | Return each channel's masked destination, `pending/verified/expired`, attempts remaining, and resend availability. |
| POST | `/auth/verification-flows/{flowId}/otp/{channel}/resend` | Resend `email` or `mobile` OTP with throttling, cooldown, daily cap, and invalidation of the previous code. |
| POST | `/auth/verification-flows/{flowId}/otp/{channel}/verify` | Verify one code. Return channel status and whether every required channel is complete. Codes are hashed at rest, short-lived, single-use, and attempt-limited. |
| POST | `/auth/sign-up/{flowId}/complete` | Atomically create the user/credential, enroll or challenge the device binding, and return tokens plus `onboardingRequired=true`. Requires all required OTP channels. |

For Google sign-up, the Google-verified email does not need email OTP. If no mobile number is collected in that flow, expose `phoneVerificationRequired` and require verified phone before payment or protected-document access, not before showing onboarding/home.

### 6.2 Sign-in, tokens, password recovery, and logout

| Method | Endpoint | Purpose and contract |
| --- | --- | --- |
| POST | `/auth/sign-in/password` | Email + password sign-in. Verify permanent device binding before issuing tokens. Return user role so the client opens Student or Admin routes. |
| POST | `/auth/sign-in/google` | Exchange Google auth code, resolve the linked account, prove the approved device, and issue tokens. |
| POST | `/auth/token/refresh` | Rotate refresh token after device proof. Reuse detection revokes the token family. |
| POST | `/auth/logout` | Revoke current access/refresh session only; keep permanent device binding. Idempotent. |
| POST | `/auth/logout-all-sessions` | Revoke all sessions on the approved device without changing its binding. |
| POST | `/auth/password/forgot` | Start email recovery without revealing whether the address exists. |
| POST | `/auth/password/reset/verify` | Verify reset code and return a short-lived reset token. |
| POST | `/auth/password/reset/complete` | Set new password, revoke existing refresh tokens, preserve device binding. |
| GET | `/auth/me` | Current identity, role, plan, verification status, onboarding state, and binding summary. |

### 6.3 Device proof and recovery

| Method | Endpoint | Purpose and contract |
| --- | --- | --- |
| POST | `/auth/device/enrollment/challenge` | For an unbound account, issue a short-lived nonce for a supplied installation ID/public key. |
| POST | `/auth/device/enrollment/complete` | Verify the signed challenge and atomically create the one approved binding. |
| POST | `/auth/device/proof/challenge` | Issue nonce for an existing approved binding. |
| POST | `/auth/device/proof/verify` | Validate signature and return a short-lived proof token used by sign-in/refresh/protected actions. |
| GET | `/me/device` | Safe approved-device metadata, binding date, current/recovery status; never return secrets or a transferable fingerprint. |
| POST | `/auth/device-recovery` | Start replacement using verified email and mobile challenges; return `recoveryId`, cooldown, and whether support approval is required. |
| POST | `/auth/device-recovery/{id}/otp/{channel}/verify` | Verify recovery email/mobile OTP. |
| POST | `/auth/device-recovery/{id}/complete` | After policy approval/cooldown, revoke old binding and token families, then issue a new enrollment challenge. |
| DELETE | `/me/device` | Report/revoke a stolen approved device after step-up identity verification. This blocks all sign-in until recovery completes. |

Required errors: `DEVICE_ENROLLMENT_REQUIRED`, `DEVICE_PROOF_REQUIRED`, `DEVICE_PROOF_INVALID`, `ACCOUNT_BOUND_TO_ANOTHER_DEVICE`, `DEVICE_RECOVERY_PENDING`, `DEVICE_BINDING_REVOKED`, `SESSION_REVOKED`, and `TOKEN_REUSE_DETECTED`.

Until enrollment/proof succeeds, auth endpoints return only a short-lived, purpose-limited `preAuthToken`; they must not issue normal access/refresh tokens. Enrollment completion and first token issuance occur atomically so two devices cannot win a race to bind an account.

The forced-logout mobile screen must be driven by these errors or a revoked-session response, not by local navigation state.

## 7. Learner profile, onboarding, preferences, and notifications

| Method | Endpoint | Purpose and important fields |
| --- | --- | --- |
| GET | `/student/bootstrap` | **Implemented in Gate 3.** Authenticated user/session, memberships, active Academy, access summary and current learner preference. |
| GET | `/student/me` | **Implemented.** Name, email, mobile, verification flags, avatar and role/profile identity. |
| PATCH | `/student/me` | **Implemented.** Edit safe identity fields (`fullName`, `phone`). A future contact-change flow must replace direct phone editing once re-verification is enforced. |
| GET | `/student/preferences/options` | **Implemented.** Active platform courses plus courses visible through active learner Academy membership. Visibility does not imply ownership. |
| GET | `/student/preferences` | **Implemented.** Selected course, normalized exam date and precision, academy reference, daily target, language, timezone, reminder, onboarding completion and version. |
| PUT | `/student/preferences` | **Implemented.** Create/replace personalisation using `selectedCourseId`, `examMonth`, `examYear`, optional `examDay`, optional `academyReference`, target and locale/reminder fields. Missing day becomes day 1 with `MONTH` precision. Never creates an enrollment, entitlement, order or unlock. |
| PATCH | `/student/preferences` | **Implemented.** Partial preference update with optional optimistic `expectedVersion`; date changes require month and year together. |
| PATCH | `/student/study-preferences` | Future extension for preferred session length and adaptive-plan enabled flag; the currently displayed target/language/timezone/reminder fields already use `/student/preferences`. |
| GET | `/me/study-availability` | Weekday availability and date overrides used by deterministic planning |
| PUT | `/me/study-availability` | Set minutes available by weekday, preferred study windows, and temporary overrides |
| POST | `/me/contact-verifications` | Begin verified email or phone change; return flow ID and masked target |
| POST | `/me/contact-verifications/{id}/verify` | Verify OTP and atomically apply the new contact value |
| POST | `/me/push-tokens` | Register/update Expo/native push token, platform, app version, installation ID |
| DELETE | `/me/push-tokens/{id}` | Remove stale token on logout/uninstall detection |
| GET | `/me/notification-preferences` | Reminder and notification category settings |
| PATCH | `/me/notification-preferences` | Focus reminders, plan reminder, expiry warning, receipt, and security notification choices |

Theme, component animation, responsive layout, rocket onboarding transition, OTP checkmark animation, and navbar motion remain local presentation state unless cross-device theme sync is explicitly added later.

## 8. Academic hierarchy and public learner catalogue

Canonical hierarchy:

`course -> category/level -> subject -> unit/chapter -> optional topic -> concept`

Examples represented by the mobile Admin UI include JEE -> Mains -> Mathematics/Physics/Chemistry, CA -> Intermediate -> Phase 1 subjects, and NEET -> UG -> Biology/Physics/Chemistry.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/catalog/courses` | Optional/User | Published courses for onboarding and filters |
| GET | `/catalog/courses/{courseId}` | User | Course and published categories/levels |
| GET | `/catalog/categories/{categoryId}/subjects` | User | Subjects for selected course/category |
| GET | `/catalog/subjects/{subjectId}` | User | Subject summary and learner aggregate progress |
| GET | `/catalog/subjects/{subjectId}/units` | User | Units/chapters and progress/access counts |
| GET | `/catalog/units/{unitId}` | User | Unit with topics when applicable and direct notes when no topic exists |
| GET | `/catalog/topics/{topicId}` | User | Topic metadata, concepts, and note summaries |
| GET | `/catalog/tree` | User | Bounded tree for `courseId/categoryId`, optionally including note counts; cacheable per catalogue version |
| GET | `/catalog/search` | User | Search published subjects, units, topics, notes, and packages with type and hierarchy filters |

Every catalogue object returns stable IDs, display order, publication state as appropriate, and a `catalogVersion` so cached mobile trees can be invalidated.

## 9. Home, focus sessions, daily activity, streaks, and rewards

### 9.1 Home aggregation

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/home?date=YYYY-MM-DD` | Return a screen-ready snapshot: greeting identity, reward wallet, active focus session, today/target minutes, plan progress, exam countdown/pressure, syllabus completion, streak, pending heart recovery, and current study tasks |
| GET | `/me/daily-summary?date=YYYY-MM-DD` | Detailed totals by focus, reading, practice, revision, and completed goal state |
| GET | `/me/syllabus-progress` | Overall completion plus subject/unit breakdown; derived from published required resources and learner completion events |
| GET | `/me/exam-countdown` | Canonical exam date, actual days remaining, pressure score, course/category, and server time |

`/me/home` is an aggregation endpoint, not a second source of truth. It reads the same focus, plan, reward, profile, and progress records used by their detailed endpoints.

### 9.2 Focus sessions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/focus-sessions/active` | Resume active session on Home or Tracker; return authoritative elapsed seconds from server timestamps |
| POST | `/me/focus-sessions` | Check in. Create one active session with optional planned duration/source (`home`, `tracker`, `study_task`, `note`) |
| POST | `/me/focus-sessions/{sessionId}/heartbeat` | Optional foreground heartbeat for anomaly detection and reliable UI recovery; never used alone to calculate earned time |
| POST | `/me/focus-sessions/{sessionId}/checkout` | Check out atomically, finalize duration/daily totals/streak eligibility, and return celebration/reward-claim data |
| POST | `/me/focus-sessions/{sessionId}/abandon` | Close an accidental session under explicit policy without awarding rewards |
| GET | `/me/focus-sessions` | Cursor history with date range and source filters |

Concurrent starts return the existing active session. Checkout requires an idempotency key and never trusts a duration from the client.

### 9.3 Streak calendar and hearts

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/streak` | Current/longest streak, today state, next protection deadline, monthly hearts balance |
| GET | `/me/streak/calendar?month=YYYY-MM` | Calendar cells with `active`, `missed`, `protected`, `today`, `future`, and optional best-day metadata |
| GET | `/me/streak/recoveries/eligible` | Missed dates currently recoverable and heart cost |
| POST | `/me/streak/recoveries` | Spend one heart on an eligible missed date and recalculate the streak atomically |

The fire, burning effect, day-number placement, checkout celebration, confetti, and share sheet are mobile animations. The server only supplies canonical streak/reward state.

### 9.4 Points, hearts, and reward ledger

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/rewards/wallet` | Current points, hearts, monthly cap/refresh date, streak, pending claims |
| GET | `/me/rewards/ledger` | Cursor ledger of earn/spend/expire/adjust events with source and resulting balance |
| POST | `/me/rewards/claims/{claimId}/claim` | Idempotently claim a checkout, daily, or Solve & Earn reward |
| GET | `/me/rewards/rules` | Safe current earning rules for display; backend remains authoritative |

Daily focus claims are unique by learner + learner-local date + rule version. Reward entries store reason, source ID, points/hearts delta, policy version, idempotency key, and balance after transaction.

## 10. Deterministic study to-do list and adaptive daily plan

This feature does not require AI. It requires structured question-to-concept tags, Admin time estimates, trustworthy attempt data, deterministic scoring, and scheduled recomputation.

### 10.1 Required planning inputs

- Learner course/category, exam date, timezone, daily/weekday availability, preferred study windows, target minutes.
- Course hierarchy, syllabus weightage, prerequisites, publication state, and learner completion.
- Admin estimates per topic: learning, reading, practice, revision, and total expected minutes.
- Wrong answers grouped by primary concept across distinct questions, accuracy, recency, difficulty, response time, and retry history.
- Revision due dates, unfinished tasks, missed days, and near-expiry owned resources.

One isolated wrong answer must not create a weak-topic task. Use a configurable minimum distinct-question sample and cooldown/deduplication window.

### 10.2 Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/study-plan/today` | Today plan, manual/generated tasks, total planned minutes, available minutes, progress, reason strings, and plan algorithm version |
| POST | `/me/study-plan/generate` | Idempotently generate or retrieve the learner-local day's plan. Normally also run asynchronously before the learner opens the app |
| GET | `/me/study-plan/history` | Date-range plan history with completion/carryover summaries |
| POST | `/me/study-plan/tasks` | Add a manual task with title, planned minutes, optional subject/topic/note link |
| PATCH | `/me/study-plan/tasks/{taskId}` | Start, complete, skip, reschedule, or update an eligible manual task using a status transition |
| DELETE | `/me/study-plan/tasks/{taskId}` | Remove a manual task; generated tasks are skipped/replaced instead of deleted |
| POST | `/me/study-plan/clear-completed` | Clear completed manual tasks from the active visual list without deleting history |
| GET | `/me/recommendations/weak-concepts` | Paid-only ranked concept evidence and suggested action; also powers planning internally |

Task types: `learn_topic`, `read_note`, `practice_concept`, `revise_topic`, `continue_resource`, and `manual`. Statuses: `planned`, `in_progress`, `completed`, `skipped`, `rescheduled`, `expired`, and `replaced`.

Each generated task stores its hierarchy IDs, title, reason, planned minutes, priority, source signals, due date, algorithm version, and generation run ID. A first deterministic score should combine exam/syllabus weight, weakness confidence, revision urgency, prerequisite readiness, carryover, and ability to fit available minutes. The API returns a concise explanation such as “Repeated mistakes in Fundamental Rights” or “45 minutes fits today’s remaining plan.”

## 11. Notes, packages, learner note state, and secure reading

### 11.1 Notes library and hierarchy

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/student/notes/tree` | **Implemented in Gate 3.** Selected-course folder/note tree built directly from published Admin-uploaded `ContentItem` hierarchy, including safe locked metadata and learner state. |
| GET | `/student/notes` | **Implemented.** Search/filter selected-course PDF notes by parent, `all/in_progress/completed`, favourite and pagination; returns breadcrumbs and access reason without storage paths. |
| GET | `/student/notes/recent?limit=3` | **Implemented.** Top notes ordered by the learner's last successful protected-viewer open, not card taps. |
| GET | `/student/notes/favourites` | **Implemented.** Favourite cards, including locked/unpurchased premium notes. |
| GET | `/student/notes/{noteId}` | **Implemented.** Metadata, folder breadcrumbs, access reason, price and learner state. |
| GET | `/student/packages` | **Implemented in Gate 3.** Published packages for the selected course, searchable and filterable by `all/owned/available`, with authoritative ownership and expiry. |
| GET | `/student/packages/{packageId}` | **Implemented.** Package detail, published included resources, server price, and direct/course entitlement summary. |
| GET | `/student/library` | **Implemented.** Entitled PDF resources with learner progress plus authoritative counts for owned notes, free purchases, paid purchases, active entitlements, and expiring access. |

Recent and favourite card layout/sideways scrolling is client presentation. `recent` includes only resources successfully opened, not cards merely viewed.

### 11.2 Metadata actions, including locked paid notes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/student/notes/{noteId}/state` | **Implemented.** Completion, favourite, revision count/latest revision, reading progress, last opened and access summary. |
| PATCH | `/student/notes/{noteId}/state` | **Implemented.** Set `completed` and/or `favourite`; allowed for visible unpurchased premium notes without granting access. |
| POST | `/student/notes/{noteId}/revisions` | **Implemented.** Append an intentional revision event with `ACTION_SHEET`, `READER`, or `MANUAL` source; allowed for visible locked notes. |
| DELETE | `/me/notes/{noteId}/revisions/{revisionId}` | Undo only a recent accidental revision under a short policy window; otherwise ledger remains append-only |

Completion/favourite/revision APIs do not grant content access and must not call the viewer implicitly.

### 11.3 Protected viewer sessions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/student/notes/{noteId}/viewer-sessions` | **Implemented in Gate 3.** Re-evaluate publication, course visibility, enrolment and entitlement/grant expiry; bind a short viewer session to the current authenticated user session and record the actual open. Permanent device proof remains deferred. |
| GET | `/student/viewer-sessions/{viewerSessionId}/manifest` | **Implemented.** Resource title/page count when known, session expiry, watermark display identity and trace ID, last reading position and explicit no-download/no-print capabilities; never returns a private storage URL. |
| GET | `/student/viewer-sessions/{viewerSessionId}/content` | **Implemented.** Authenticated, range-capable, server-watermarked PDF response with `private, no-store`; rejects another user/session and rechecks access before every render. |
| PATCH | `/student/viewer-sessions/{viewerSessionId}/progress` | **Implemented.** Persist page/scroll position and monotonic highest progress percentage. |
| POST | `/student/viewer-sessions/{viewerSessionId}/heartbeat` | **Implemented.** Recheck access, record active view telemetry and renew only the short viewer window; never extends the underlying entitlement. |
| DELETE | `/student/viewer-sessions/{viewerSessionId}` | **Implemented.** Idempotently close the viewer session and finalize its last-seen time. |
| POST | `/notes/{noteId}/external-open` | For a curated government/external link, authorize access and return a validated short-lived redirect/URL plus audit event |

Successful viewer-session creation returns `allowed`. Current denials use typed API errors including `NOTE_NOT_FOUND`, `CONTENT_ENTITLEMENT_REQUIRED`, `COURSE_ENROLLMENT_REQUIRED`, and `COURSE_SELECTION_REQUIRED`. More granular `entitlement_expired`, phone-verification, grant-revocation and device-proof presentation states remain future refinements.

The former `/student/content/{contentId}/access` route was removed in Gate 3 because returning a raw object-storage signed URL bypassed watermarking and exposed a direct download path. The server now fetches the private source internally and returns only the personalized inline PDF stream. Device-proof-specific states remain pending with the deferred permanent-device feature.

Server-side watermarking should include email plus a non-obtrusive trace ID/view timestamp. Cache only encrypted source assets; rendered personalized artifacts must be short-lived and access-logged. A viewer session must stop working immediately after refund, grant revocation, resource expiry, device revocation, or user suspension.

## 12. Commerce, payments, coupons, entitlements, validity, and receipts

### 12.1 Store and access preview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/student/store/resources` | **Implemented for notes/packages.** Selected-course published paid notes and packages with server price, ownership and active-expiry summary. Question Bank projection remains part of the practice backend. |
| GET | `/store/resources/{resourceId}` | Purchase detail and exact contents/benefits; never claim lifetime access when a validity policy expires it |
| GET | `/plans` | Public/mobile-safe Free and Paid feature comparison and current pricing only if plan upgrades are offered in-app |
| GET | `/me/plan` | Authoritative Free/Paid state, activation/end/grace dates, source, feature flags, and entitlement version |
| GET | `/student/entitlements` | **Implemented.** User-owned active, expiring-soon, expired and revoked entitlement ledger with grant/purchase source, order reference, expiry and server time. |
| GET | `/student/entitlements/{entitlementId}` | **Implemented.** One user-scoped entitlement decision; another user's ID is returned as not found. |

If Paid-plan checkout is later exposed in mobile, it must reuse the quote/order/payment pipeline with an item type of `plan`. Until then, plan activation, cancellation, grace, expiry, refund, and restoration may arrive through verified provider/back-office events, while `/me/plan` remains the sole mobile source of truth.

### 12.2 Quote, coupon, order, and payment flow

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/checkout/quotes` | Price resource/package, validate exact user eligibility, taxes if used, and optional coupon. Return expiring quote with paise totals |
| POST | `/coupons/validate` | Validate code against learner/course/category/resource, date, minimum order, usage limits, and prior redemption without consuming it |
| POST | `/orders` | Idempotently create order from quote. A zero-total/free purchase completes immediately and creates a `free_purchase` entitlement; paid order returns payment-provider parameters |
| GET | `/orders/{orderId}` | Learner-safe order/payment state for polling and recovery |
| POST | `/orders/{orderId}/payment/confirm` | Verify provider response server-to-server, then atomically mark paid, redeem coupon, create entitlements, and create receipt |
| GET | `/student/orders/{orderId}/receipt` | **Implemented.** User-scoped presentation-safe receipt with normalized totals, items, successful/refunded payments and coupon summary; provider secrets are excluded. |
| POST | `/webhooks/payments/{provider}` | Signed provider webhook for success, failure, refund, dispute, and reconciliation. Though called by the provider, it is required for reliable mobile checkout |
| GET | `/me/orders` | Order history filtered by all/free/paid and status |
| GET | `/me/orders/{orderId}` | Learner order detail and purchased items |
| GET | `/me/receipts/{receiptId}` | Permanent receipt data with payment reference, item, amount, status, and issued date |
| GET | `/me/receipts/{receiptId}/document` | Optional authenticated receipt document for the existing “Save receipt” UI. This is separate from protected study-PDF download restrictions |

Do not accept price, discount, paid status, currency, entitlement expiry, or payment success from the phone. Coupon redemption and entitlements are committed in the same transaction as the verified order transition.

### 12.3 Entitlement validity

The implemented mobile resource-validity contract supports:

- `permanent` (the backward-compatible default)
- `exam_date_plus_offset` with an Admin-specified number of days

`fixed_duration_from_purchase` and resource-level `absolute_end_date` are deferred until product policy explicitly requires them; absolute expiry on an individual Admin grant already remains supported by the entitlement model.

Each paid PDF stores its own policy, including PDFs purchased inside a package. For exam-relative resources the server derives an exclusive effective expiry from the learner's canonical exam date (day 1 when omitted) plus the Admin offset, allowing access through the complete final date. The effective expiry is the earlier of this resource expiry and any absolute entitlement/grant expiry. It is resolved on every protected access request so a package entitlement cannot bypass a child PDF's policy. Missing exam data fails closed with `EXAM_DATE_REQUIRED`; elapsed policy returns `RESOURCE_EXPIRED`/`CONTENT_ACCESS_EXPIRED`.

The Notes catalogue, Library projection, legacy course-content projection, adaptive study plan and protected viewer use server time and the same policy. Viewer sessions are capped at the effective resource expiry and cannot renew past it. Responses return the policy plus authoritative `expiresAt`; learner progress, favourites, revisions, order history and receipts remain preserved after expiry. Changing a resource policy is an audited Admin action and takes effect on subsequent authorization checks.

Refund/cancellation/dispute workflows revoke the relevant entitlement but preserve learner state and receipts. Expired or revoked secure URLs and practice sessions must fail on the next authorization check.

## 13. Practice catalogue, sessions, answers, timers, and Solve & Earn

### 13.1 Practice discovery and filters

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/student/practice/sources` | **Implemented in Gate 3.** Return free Archive and published Question Banks with exact entitlement/expiry state and available Archive years. |
| GET | `/student/practice/filters?sourceKind=ARCHIVE` | **Implemented.** Source-specific taxonomy, collections, years and Free/Paid capabilities. |
| GET | `/student/practice/filters?sourceKind=QUESTION_BANK&questionBankPackageId=...` | **Implemented.** Exact entitled-bank taxonomy and collections; never returns a year filter. |
| POST | `/student/practice/sets/preview` | **Implemented.** Validate source/filter combination and return eligible/selected counts, normalized timer and access policy without question or answer data. |
| GET | `/practice/challenges/preview` | For current source/filter selection, return Solve & Earn question count, server duration, points, accuracy threshold, eligibility, attempts remaining, and availability window |

Question counts must reflect the exact selection and exclude unpublished/invalidated questions. The filter UI color and layout remain client-only.

### 13.2 Standard practice sessions

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/student/practice/sessions` | **Implemented.** Create immutable server-side question snapshots with Archive/exact-bank authorization and optional authoritative timer. |
| GET | `/student/practice/sessions/{sessionId}` | **Implemented.** Resume user-owned session with deadline, counts and navigator states. |
| GET | `/student/practice/sessions/{sessionId}/questions` | **Implemented.** Sanitized prompts/options only; correct answers and explanations remain server-side. |
| PATCH | `/student/practice/sessions/{sessionId}/questions/{sessionQuestionId}/review` | **Implemented.** Mark/unmark an unanswered question for review. |
| POST | `/student/practice/sessions/{sessionId}/questions/{sessionQuestionId}/attempts` | **Implemented.** Idempotent MCQ/descriptive submission, server grading for MCQ, policy-safe explanation and retry decision. |
| POST | `/practice/sessions/{sessionId}/questions/{questionId}/written-attempts` | Submit descriptive/case-study response. Return rubric/model feedback or `grading_pending` according to configured grading policy |
| POST | `/student/practice/sessions/{sessionId}/complete` | **Implemented for standard sessions.** Idempotently finalize and return persisted navigator/count state. Solve & Earn reward evaluation remains separate. |
| POST | `/practice/sessions/{sessionId}/abandon` | Explicitly close without fabricating attempts; preserve valid submitted answers |
| GET | `/practice/sessions` | Learner session history and resumable sessions |

Navigator states are `unanswered`, `answered_correct`, `answered_wrong`, `marked_review`, and `locked_wrong`. With Free policy, a wrong first attempt creates `locked_wrong`, rejects another attempt with `WRONG_RETRY_PAID_REQUIRED`, and withholds explanation. Paid policy permits another attempt and returns explanations after every attempt.

Descriptive and case-study free-text responses may be stored and displayed, but evaluation, semantic scoring, grading workflows and score-derived analytics are outside the mobile application's backend scope.

### 13.3 Solve & Earn

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/practice/challenges/sessions` | Create server-timed challenge with immutable pool/version, signed session ID, `startedAt`, `expiresAt`, rules, and selected questions |
| GET | `/practice/challenges/sessions/{id}` | Resume the original deadline; offline/background time continues to elapse |
| POST | `/practice/challenges/sessions/{id}/questions/{questionId}/attempts` | Submit within server deadline using normal answer/entitlement policy |
| POST | `/practice/challenges/sessions/{id}/complete` | Validate required question count, deadline, accuracy, attempt policy; create one pending/earned reward ledger entry idempotently |
| GET | `/practice/challenges/history` | Challenge outcomes and earned rewards |

Challenge states: `available`, `active`, `completed`, `earned`, `failed_time`, `failed_accuracy`, `attempt_limit_reached`, `expired`, and `ineligible`. Question Bank challenges recheck exact unexpired entitlement at creation and submission. Store anomaly signals for impossible response timing, replay, device mismatch, and repeated network manipulation.

## 14. Practice tracker and concept-wise weak areas

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/me/practice/summary` | All | Unique questions solved, total attempts, correct/closed counts, accuracy, and recent practice |
| GET | `/me/practice/subjects` | All | Subject-level solved/total/correct/locked aggregates for practice tracker tabs |
| GET | `/me/practice/subjects/{subjectId}/chapters` | All | Chapter/topic progress: available, solved, correct, wrong-locked, remaining, and percentage |
| GET | `/me/practice/chapters/{chapterId}/questions` | All | Question-level attempt/navigator history subject to question-source access |
| GET | `/me/practice/weak-concepts` | Paid | Ranked concept, confidence, distinct questions, attempts, accuracy, last evidence, recommended resource/action |
| GET | `/me/practice/weak-concepts/{conceptId}` | Paid | Transparent evidence and trend; never expose another learner or hidden answer data |

Current consolidated implementation: `GET /api/student/practice/tracker` returns all-user totals and chapter aggregates plus Paid-only preliminary weak chapters. Split summary/subject/chapter drill-down endpoints and robust concept confidence scoring remain a later analytics slice.

Weak-area computation must:

- tag every published question to one primary concept and optional secondary concepts;
- reject publication of unclassified questions used for recommendations;
- use distinct-question error rate, recency, difficulty, response time, retries, and study/revision-after-attempt signals;
- require a minimum sample and return a confidence level;
- reduce/resolve weakness after later correct evidence rather than permanently labelling a learner;
- exclude invalidated questions and technical duplicate submissions.

## 15. Study tracker, consistency, calendar, and revision tracker

### 15.1 Tracker

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/tracker/summary?range=7d` | Today focus/target, streak, exam countdown, syllabus %, revision total, and compact consistency metrics |
| GET | `/me/tracker/consistency?from=...&to=...` | Day-wise study minutes/hours, total, daily average, prior-period percentage change, goal days, best day, current streak |
| GET | `/me/tracker/activity-calendar?month=YYYY-MM` | Same canonical learning-day data used by the streak calendar: active, missed, protected, future, duration, goal completion |
| GET | `/me/tracker/activity/{date}` | Breakdown of a day into focus, reading, practice, revision, tasks, and reward events |

Home and Tracker use the same focus-session API and active session. The consistency graph referenced in the UI is data-driven but its exact bars, animation, and hat/header decoration are client-only.

### 15.2 Revision tracker

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/me/revisions/summary` | Total returns/revisions, chapters revisited, due count, syllabus coverage, and next due item |
| GET | `/me/revisions/chapters?filter=all|due|not_started&subjectId=...` | Chapter-wise revision cards grouped by subject, with completed notes, returns, depth, progress, and due status |
| GET | `/me/revisions/chapters/{chapterId}` | Revision history, included notes/topics, current stage, scheduled next return, and readiness |
| POST | `/me/revisions/chapters/{chapterId}/returns` | Record a chapter-level return/revision and schedule the next interval idempotently |
| PATCH | `/me/revisions/chapters/{chapterId}/schedule` | Reschedule a due revision if product policy allows learner control |

Recommended first schedule is configurable spaced return stages (for example 1, 7, and 21 days), never hard-coded into the app. UI stages 1-2-3 must be generated as evenly spaced client elements from backend stages; the backend stores stage number and due dates, not pixel positions.

## 16. Paid monthly reports

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/student/reports/monthly` | Paid | Live current-month report plus immutable completed-month archive, newest first |
| GET | `/api/student/reports/monthly/{yearMonth}` | Paid | Live current month or immutable completed snapshot with weekly study bars, activity breakdown, goal/streak days, notes, revisions, plan tasks and syllabus progress |

Subject drill-down and Practice-derived questions, accuracy and weak concepts are deferred until their underlying data contracts are resumed and verified.

Generate one snapshot after each learner-local month closes. Do not rebuild old reports from mutable live aggregates on every request. Plan expiry blocks access to the archive but does not delete snapshots; restored Paid access reveals them again according to product policy.

## 17. Admin mobile API

All routes in this section require `admin` or `superadmin` role plus the same approved-device proof. Mobile Admin permissions are intentionally limited:

- may view dashboard, learners, orders, receipts, catalogue, question coverage, and audit events;
- may create/manage coupons;
- may create course/category/subject structure;
- may grant/revoke complimentary learner note access;
- may **not** upload, edit, publish, unpublish, download, or print study files/packages from the phone;
- may **not** edit questions or mutate payments from the phone.

### 17.1 Dashboard

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard?range=7d` | Total successful-order value, student count, published note count, active coupons, published packages, recent activity, and order-count graph |
| GET | `/admin/analytics/orders?from=...&to=...&bucket=day` | Order count, successful revenue, refunds, and zero-cost purchases by time bucket |
| GET | `/admin/analytics/orders/by-course?range=7d|30d|all` | JEE/CA/NEET or dynamic course-wise orders, revenue, percentage, and trend |
| GET | `/admin/analytics/orders/by-category?courseId=...&range=7d|30d|all` | Category/level-wise order and revenue breakdown inside a selected course |

Financial totals exclude refunded orders from net revenue but return gross/refunded/net separately. Every response states currency and server time.

### 17.2 Students and complimentary access

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/students` | Cursor list/search/filter by query, course, category, plan, active state; rows include hours, orders, streak, total paid |
| GET | `/admin/students/summary` | Total learners, active today, aggregate focus hours, paid revenue |
| GET | `/admin/students/{studentId}` | Identity/contact verification, joined/last active, course/category/exam, academy, daily target, streak, syllabus, practice accuracy, hours, orders, plan, binding safe state |
| GET | `/admin/students/{studentId}/activity` | Date-range focus, reading, practice, revisions, and task summary |
| GET | `/admin/students/{studentId}/orders` | Learner order history linking to read-only Admin receipts |
| GET | `/admin/students/{studentId}/access-grants` | Current/revoked/expired complimentary grants |
| GET | `/admin/students/{studentId}/eligible-grant-resources` | Published premium notes matching course/category that are not already actively purchased/granted |
| POST | `/admin/students/{studentId}/access-grants` | Grant selected note with reason and optional expiry. Idempotent; creates entitlement and audit event |
| DELETE | `/admin/students/{studentId}/access-grants/{grantId}` | Revoke grant and invalidate active viewer sessions; never delete grant history |

Granting access does not create a paid order or revenue. If the product wants a visible zero-price receipt for an Admin grant, that must be an explicit future policy, not inferred.

### 17.3 Orders, receipts, and course-wise commerce analytics

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/orders` | Search receipt/student/email/item; filter course, category, type, status, period; cursor pagination |
| GET | `/admin/orders/summary` | Paid count, refunded count/value, gross/net revenue, average paid order, free purchases |
| GET | `/admin/orders/{orderId}` | Read-only verified transaction, learner, item, course/category, amount, method, payment/reference IDs, timestamps, status |
| GET | `/admin/orders/{orderId}/receipt` | Read-only receipt representation used by the mobile Admin receipt page; no print/download capability |

Payment changes, manual refunds, exports, receipt printing, and receipt downloading are outside the current mobile Admin UI. Provider webhooks and back-office operations may still change order state and will appear read-only here.

### 17.4 Courses and academic structure

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/courses` | Full Admin tree with category/subject counts, display order, publication/active state |
| POST | `/admin/courses` | Create exam/course with unique normalized code/display name |
| GET | `/admin/courses/{courseId}` | Course detail and nested categories/subjects |
| POST | `/admin/courses/{courseId}/categories` | Create category/level such as Mains, Intermediate, Phase 1, or UG |
| POST | `/admin/categories/{categoryId}/subjects` | Create subject within its course/category |
| PATCH | `/admin/courses/{courseId}` | Supporting lifecycle: rename/activate/reorder. Mobile UI currently exposes creation, but records need an audited correction path |
| PATCH | `/admin/categories/{categoryId}` | Rename/activate/reorder category with conflict checks |
| PATCH | `/admin/subjects/{subjectId}` | Rename/activate/reorder subject with conflict checks |

Deletion should initially be disabled when child content, orders, plans, or learner history exists. Prefer archival/deactivation and preserve stable IDs. Every structural change emits an audit event and increments `catalogVersion`.

### 17.5 Published notes/packages and question coverage (read-only on mobile)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/catalog/resources` | Search/filter published paid notes and infographic notes by course/category/type/access/expiry policy |
| GET | `/admin/catalog/resources/{resourceId}` | Read-only metadata, price, page count, validity policy, publication state, package membership |
| GET | `/admin/catalog/packages` | Search/filter published packages with lesson/resource count and listed price |
| GET | `/admin/catalog/packages/{packageId}` | Read-only package contents and validity summary |
| GET | `/admin/questions/coverage` | Counts by course/category/subject/chapter/topic/source/format; highlight missing concepts |
| GET | `/admin/questions/coverage/{subjectId}` | Topic-level MCQ/descriptive/case-study and Archive/Question Bank counts |

The mobile backend must serve these reads, but mobile endpoints to upload/edit/unpublish resources or create/edit/publish questions are intentionally absent.

### 17.6 Coupons

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/coupons` | Search code/scope; filter all/active/disabled; return total redemptions and usage limits |
| GET | `/admin/coupons/{couponId}` | Coupon rule, usage, dates, status, and safe redemption summary |
| POST | `/admin/coupons` | Create unique uppercase code with `percentage/flat`, value, minimum order, course/category scope, expiry, usage limit, and initial active state |
| PATCH | `/admin/coupons/{couponId}` | Enable/disable and edit only fields allowed before/after first redemption under explicit policy |
| GET | `/admin/coupons/{couponId}/redemptions` | Read-only cursor list of order, learner, discount, and timestamp |

Percentage must be bounded (normally 1-100); flat discount cannot exceed payable value; expiry is a timestamp, not a display string. Coupon reservation/redemption is transactional so concurrent checkouts cannot exceed the usage limit.

### 17.7 Audit and device-recovery support

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/admin/audit-events` | Immutable cursor timeline filtered by all/content/commerce/access/security, actor, resource, and date |
| GET | `/admin/audit-events/{eventId}` | Event detail, safe before/after diff, actor, request ID, IP/risk metadata according to role |
| GET | `/admin/device-recoveries` | `superadmin/support` queue for pending permanent-device replacement requests |
| POST | `/admin/device-recoveries/{recoveryId}/approve` | Step-up protected approval; revoke old binding/tokens and allow replacement enrollment |
| POST | `/admin/device-recoveries/{recoveryId}/reject` | Reject with internal reason and notify learner |

Audit events cannot be edited or deleted from mobile or database application code. At minimum record authentication security, device changes, course changes, coupon changes/redemptions, orders/refunds, resource publication/validity changes received from content management, grants/revocations, and reward adjustments.

## 18. Core persistence model

The exact database technology can change, but the following normalized records are required.

### 18.1 Identity and security

- `users`: identity, role, status, plan reference, verification flags.
- `plans`, `plan_subscriptions`, `plan_feature_entitlements`, and immutable plan lifecycle history.
- `password_credentials`, `oauth_accounts`.
- `verification_flows`, `otp_challenges` with hashes, attempts, expiry, consumption time.
- `sessions`, `refresh_token_families`, `revoked_tokens` where needed.
- `device_bindings`: user, public key/fingerprint hash, installation ID hash, safe metadata, bound/revoked/replaced times, status.
- `device_challenges`, `device_recovery_requests`, `security_events`.

### 18.2 Learner and academic data

- `learner_profiles`, `study_preferences`, `study_availability`, `availability_overrides`, `push_tokens`.
- `courses`, `categories`, `subjects`, `units`, `topics`, `concepts`, `concept_prerequisites`.
- `topic_time_estimates` with learning/reading/practice/revision minutes, editor, version, valid range.

### 18.3 Content and commerce

- `resources`: note/PDF/infographic/external link, hierarchy IDs, price, page count, storage key, published version, validity policy.
- `packages`, `package_resources`.
- `question_banks`, `question_bank_collections`, `questions`, `question_options`, `question_concepts`, `question_versions`.
- `orders`, `order_items`, `payment_transactions`, `receipts`.
- `coupons`, `coupon_scopes`, `coupon_reservations`, `coupon_redemptions`.
- `entitlements`: user/resource, source, source ID, start/end, status, policy snapshot.
- `complimentary_grants` with grantor, reason, expiry/revocation.

### 18.4 Learning activity

- `learner_note_state`, `note_open_events`, `viewer_sessions`, `reading_progress`.
- `revision_events`, `chapter_revision_state`, `revision_schedule`.
- `focus_sessions`, `daily_learning_aggregates`, `streak_days`, `streak_state`.
- `reward_wallets`, `reward_ledger`, `heart_ledger`, `reward_claims`.
- `study_plans`, `study_plan_tasks`, `plan_generation_runs`, `algorithm_versions`.
- `practice_sessions`, `practice_session_questions` (immutable snapshot), `question_attempts`, `question_review_state`, `written_attempts`.
- `challenge_policies`, `challenge_sessions`, `challenge_claims`.
- `learner_concept_scores`, `monthly_report_snapshots`.
- `admin_audit_events`.

Use append-only events/ledgers for attempts, rewards, revisions, orders, entitlements, and audits. Use projection tables for fast mobile summaries, always rebuildable from authoritative events.

## 19. Background jobs and event handling

| Job/event | Trigger | Required behavior |
| --- | --- | --- |
| Daily aggregate updater | Focus checkout, viewer close, practice completion, revision/task events | Update learner-local day totals idempotently |
| Streak finalizer | Qualifying activity and learner-local day close | Mark active/missed/protected day once; update current/longest streak |
| Weak concept recalculation | Valid practice attempt | Asynchronously recalculate concept evidence/version; exclude duplicates/invalid questions |
| Daily plan generator | Timezone-aware schedule, profile/availability/exam/content change | Generate one plan per learner/date/version with locking; avoid duplicates |
| Plan carryover | Learner-local day close | Expire/reschedule/carry tasks according to policy |
| Entitlement expiry | Scheduled plus request-time validation | Mark expired, notify learner, invalidate viewer/session access |
| Monthly report generator | Learner-local month close | Create immutable Paid report snapshot and version |
| Reward/heart monthly maintenance | Learner-local month boundary | Apply configured heart cap/reset rules through ledger, never raw balance overwrite |
| Payment reconciliation | Webhook plus scheduled poll | Resolve missed callbacks; keep order/payment/entitlement atomic |
| Coupon reservation cleanup | Quote/order timeout | Release expired reservations safely |
| Reminder/expiry notification | Preferences, plans, due revisions, entitlement dates | Send push with dedupe and quiet-hour/timezone rules |
| Viewer cleanup | Session expiry/revocation | Revoke tokens and delete personalized temporary artifacts |
| Catalogue projection rebuild | Admin/content change event | Increment version and rebuild learner/Admin counts |

Every job has a deterministic idempotency key, retry policy, dead-letter visibility, execution audit, and concurrency lock where duplicate work would create money/reward/plan errors.

## 20. Domain events and audit vocabulary

Publish transactional outbox events such as:

- `user.registered`, `contact.verified`, `profile.onboarding_completed`
- `device.bound`, `device.proof_failed`, `device.recovery_requested`, `device.replaced`
- `focus.started`, `focus.checked_out`, `learning.day_qualified`
- `note.opened`, `note.completed`, `note.favourited`, `note.revised`, `viewer.revoked`
- `practice.session_started`, `practice.attempt_submitted`, `practice.completed`, `concept.score_changed`
- `study_plan.generated`, `study_task.completed`, `study_task.rescheduled`
- `reward.claimed`, `heart.spent`, `streak.recovered`
- `order.created`, `payment.succeeded`, `payment.refunded`, `entitlement.granted`, `entitlement.expired`, `grant.revoked`
- `coupon.created`, `coupon.disabled`, `coupon.redeemed`
- `course.created`, `category.created`, `subject.created`, `catalogue.version_changed`
- `monthly_report.generated`

Use an outbox so database commits and downstream jobs cannot diverge.

## 21. Required error codes and UI states

Beyond standard `VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, and `RATE_LIMITED`, implement:

- Identity/security: `OTP_INVALID`, `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`, `VERIFICATION_INCOMPLETE`, and all device codes listed in section 6.
- Onboarding: `COURSE_REQUIRED`, `EXAM_MONTH_YEAR_REQUIRED`, `INVALID_EXAM_DATE`.
- Content: `RESOURCE_UNPUBLISHED`, `RESOURCE_ENTITLEMENT_REQUIRED`, `RESOURCE_ENTITLEMENT_EXPIRED`, `GRANT_REVOKED`, `VIEWER_SESSION_EXPIRED`, `PHONE_VERIFICATION_REQUIRED`.
- Commerce: `QUOTE_EXPIRED`, `COUPON_INVALID`, `COUPON_EXPIRED`, `COUPON_USAGE_LIMIT_REACHED`, `PAYMENT_PENDING`, `PAYMENT_FAILED`, `ORDER_ALREADY_COMPLETED`.
- Practice: `QUESTION_BANK_ENTITLEMENT_REQUIRED`, `QUESTION_BANK_EXPIRED`, `FILTER_COMBINATION_EMPTY`, `ANSWER_ALREADY_FINAL`, `WRONG_RETRY_PAID_REQUIRED`, `EXPLANATION_PAID_REQUIRED`, `SESSION_EXPIRED`, `CHALLENGE_INELIGIBLE`, `CHALLENGE_TIME_EXPIRED`, `CHALLENGE_ATTEMPT_LIMIT_REACHED`.
- Rewards/plans: `REWARD_ALREADY_CLAIMED`, `HEART_LIMIT_REACHED`, `NO_RECOVERABLE_STREAK_DAY`, `PLAN_ALREADY_GENERATED`, `INVALID_TASK_TRANSITION`.
- Admin: `ADMIN_ROLE_REQUIRED`, `DUPLICATE_COUPON_CODE`, `COURSE_STRUCTURE_CONFLICT`, `GRANT_ALREADY_ACTIVE`.

Errors should include safe remediation data such as `purchaseResourceId`, `recoveryId`, `retryAt`, `availableAlternatives`, or `currentVersion` where appropriate.

## 22. Security, privacy, and correctness checklist

- Validate authorization on every resource, Question Bank, viewer, answer, report, order, receipt, grant, and Admin request; never rely on a tab being hidden.
- Encrypt sensitive data at rest and in transit; hash passwords with Argon2id/bcrypt; hash OTPs and refresh tokens.
- Keep answer keys/explanations in separate server projections so list/session queries cannot accidentally serialize them.
- Signed content access is short-lived, single-user, single-device, and revocable. Do not log raw PDF tokens.
- Strip sensitive auth/payment data from logs; tokenize payment details and never store card data.
- Verify Google/provider tokens for issuer, audience, nonce, signature, and expiry.
- Add CSRF protection where browser flows exist; mobile APIs still require OAuth state/PKCE.
- Protect Admin endpoints with RBAC, step-up auth for grants/device recovery, and immutable audit.
- Use database constraints for one active focus session, one approved binding, unique daily reward, one active entitlement source, unique coupon code, and unique challenge claim.
- Return server time on timers/countdowns and test timezone/DST/month-boundary behavior.
- Data-retention and account-deletion policy must preserve legally required financial/audit records while anonymizing removable learning/profile data.

## 23. Validation and acceptance tests

### Authentication and device

- Password and Google sign-in both bind the first installation and reject a second one even after logout.
- Same approved installation can repeatedly log out/in.
- Device recovery revokes old refresh tokens before new enrollment.
- OTPs are independent for email/mobile, expire, throttle resend, show verified status, and cannot be reused.
- Month/year onboarding without day stores day 1.

### Notes and access

- Free, purchased, package-owned, Admin-granted, expired, revoked, and unpublished access cases return correct states.
- Locked premium notes can be completed/favourited/revised but cannot create a viewer session.
- Recent notes update only after a successful open.
- Revoking/refunding/expiring access immediately invalidates active viewer content.
- Watermarked stream is user/device bound and never publicly cacheable.

### Practice

- Archive shows years; Question Bank never shows a year selector.
- An unowned/expired Question Bank cannot expose metadata questions, start sessions, or accept answers.
- Free wrong answer becomes final and has no explanation; Free correct answer receives explanation.
- Paid wrong answer receives explanation and can retry.
- Navigator totals always equal immutable session question count.
- Solve & Earn deadline uses server time and duplicate completion cannot duplicate points.
- One isolated wrong answer does not create a weak concept; repeated distinct-question evidence can create one deduplicated recommendation.

### Progress, rewards, and reports

- Concurrent checkout creates one final focus result/reward only.
- Below target awards 10 and at/above target awards 20 once per eligible day.
- Hearts never exceed 3 per month and one recovery cannot be replayed.
- Daily plan fits configured availability where possible and records explainable reasons/version.
- Tracker, calendar, Home, and reports reconcile to the same learning events.
- Free users cannot retrieve weak-concept/monthly-report payloads through direct API calls.

### Commerce and Admin

- Zero-price purchase creates an order, free-purchase count, receipt, and entitlement without invoking payment.
- Paid success, failed payment, refund, coupon race, and webhook replay are idempotent.
- Course-wise totals reconcile to order totals.
- Complimentary grant gives access without increasing revenue/order count and revocation removes it.
- Mobile Admin cannot call upload/publish/question-edit/payment-mutation endpoints because none are exposed to its role/API surface.

## 24. Recommended implementation order

1. Foundations: API conventions, database migrations, identity, sessions, permanent device binding, OTP, RBAC, audit/outbox.
2. Learner profile/onboarding: course catalogue reads, profile, exam normalization, preferences, push-token registration.
3. Academic/content model: hierarchy, notes/packages metadata, learner note state, entitlements, secure asset storage.
4. Commerce: quotes, coupons, orders, provider webhook, receipts, entitlement creation/refund/expiry.
5. Secure reader: viewer sessions, watermark rendering/streaming, progress, revocation.
6. Focus and rewards: sessions, daily aggregates, streak calendar, hearts, points ledger, Home aggregation.
7. Practice core: sources/filters, immutable sessions, attempts, Free/Paid policies, navigator, tracker.
8. Solve & Earn and weak concepts: policies, server timer, reward claim, concept evidence projections.
9. Revision, consistency, adaptive plan, and Paid monthly snapshots.
10. Admin mobile APIs: dashboard, students/grants, orders/receipts, course structure, catalogue/question reads, coupons, audit.
11. Hardening: rate limits, integrity signals, reconciliation, load tests, expiry/device/security test matrices, observability.

## 25. Mobile screen-to-endpoint traceability

| Mobile screen | Primary endpoint groups |
| --- | --- |
| Welcome | `/mobile/config` |
| Sign up | `/auth/sign-up/*`, `/auth/verification-flows/*`, device enrollment |
| Sign in | `/auth/sign-in/*`, device proof, token refresh, password recovery |
| OTP verification | verification flow status/resend/verify |
| Personalization | `/catalog/courses`, course detail, `/me/onboarding` |
| Account | `/me/profile`, study/notification preferences, contact verification, device, logout |
| Home | `/me/home`, focus sessions, rewards, streak, study plan |
| Notes main | `/notes`, `/notes/recent`, `/notes/favourites`, `/packages`, catalogue search |
| Subject/unit/topic | subject/unit/topic catalogue endpoints plus `/notes` hierarchy filters |
| Note action sheet | `/me/notes/{id}/state`, `/me/notes/{id}/revisions` |
| Protected reader | viewer-session create/manifest/content/progress/heartbeat/close |
| Library | `/me/library`, entitlements, orders |
| Purchase | store detail, quote, coupon validate, order/payment confirm |
| Receipt | `/me/receipts/{id}` and optional authenticated receipt document |
| Practice | sources, filters, challenge preview, practice/challenge sessions and attempts |
| Practice tracker | `/me/practice/*`, Paid weak concepts |
| Tracker | tracker summary/consistency/calendar/activity plus shared focus/streak endpoints |
| Revision tracker | `/me/revisions/*` |
| Monthly reports | `/me/reports/monthly*` |
| Admin overview | `/admin/dashboard`, Admin analytics |
| Admin students/detail | `/admin/students*`, access grants, learner orders/activity |
| Admin orders/receipt | `/admin/orders*` |
| Admin courses/catalogue | `/admin/courses*`, categories/subjects, `/admin/catalog/*` |
| Admin questions | `/admin/questions/coverage*` |
| Admin coupons | `/admin/coupons*` |
| Admin audit | `/admin/audit-events*` |

## 26. Explicitly client-only or outside the current mobile backend

- All visual animations: focus orb, streak fire, checkout celebration, rocket launch, countdown number tween, cards, charts, navbar movement, page transitions, responsive tablet composition.
- Local rendering choices: colours, fonts, dark theme, list/grid toggle, horizontal cards, pinch zoom, continuous scroll.
- Native screenshot/screen-record blocking and app-switcher privacy overlay. The backend supports secure streams and watermarking but cannot toggle OS capture policy.
- Study-note/package upload, editing, publishing, and unpublishing from mobile.
- Question creation/editing/publishing from mobile.
- Admin payment mutation, receipt printing/downloading, and data export from mobile.
- AI is not required for the deterministic weak-area study plan. Descriptive-answer grading is outside this backend scope.

## 27. Backend completion definition

The backend is not complete merely when endpoints return demo-shaped JSON. It is complete for the mobile application when:

- every endpoint above has an authenticated/authorized implementation, validation, stable errors, pagination/versioning where required, and OpenAPI documentation;
- all demo stores can be replaced by API/query state without losing any screen capability;
- Free/Paid, exact ownership, Admin grant, active/expired/refunded, and device-binding matrices are covered by automated integration tests;
- rewards, payments, attempts, and plans are idempotent under retry/concurrency;
- secure resource and answer data cannot be obtained through alternate endpoints;
- background projections reconcile to source events;
- mobile Admin permissions match the deliberate read/write boundaries in this plan;
- metrics, structured logs, traces, job visibility, alerting, backup/restore, and migration/rollback procedures exist.

This file is the canonical backend implementation plan for the current `mobile/` application. Any future mobile UI feature must update this document with its endpoint, data ownership, entitlement rule, background work, security rule, and acceptance test before backend implementation.

## 29. Implemented test commerce contract

The website-only test purchase flow uses the shared backend and shared PostgreSQL source of truth:

- `POST /api/checkout` accepts server-validated `PACKAGE` and `CONTENT` item references plus an optional coupon. Legacy `packageIds` remains supported.
- Prices, course scope, publication status and ownership are resolved exclusively by the server. The browser cannot submit an amount.
- A non-zero test checkout persists a `CREATED` Order, OrderItems and one `PENDING` Payment. It grants no access at this stage.
- `POST /api/checkout/{orderId}/fake-payment` is authenticated, ownership-scoped and idempotent. It is available only when `FAKE_PAYMENT_ENABLED=true` outside production.
- Successful test confirmation marks Payment `SUCCESS`, Order `PAID`, assigns receipt/payment metadata and creates PURCHASE entitlements in one serializable transaction.
- `GET /api/student/orders/{orderId}/receipt`, `/api/student/entitlements`, `/api/student/library`, `/api/student/notes` and `/api/student/packages` project that same result to the website and mobile app.
- Mobile Library and Notes/Packages refetch on screen focus so website purchases become visible after returning to the app.
- No real card/bank data is requested or stored. Production configuration rejects fake payment.

## 28. Notification implementation contract

Student endpoints now implemented:

- `POST /api/student/notifications/push-tokens` — idempotently register the current Expo token and installation.
- `DELETE /api/student/notifications/push-tokens/:installationId` — revoke one installation token.
- `GET/PATCH /api/student/notifications/preferences` — read/update category switches and quiet hours.
- `GET /api/student/notifications/feed` — paginated durable learner inbox.
- `PATCH /api/student/notifications/feed/:notificationId/read` — learner-scoped read state.

The Admin team's existing platform Broadcast Create, Schedule and Publish UI/API remains authoritative. Publishing creates the existing academy notification recipients, then additively fans them into learner notifications and push deliveries. `LEARNER_PUSH_DELIVERY` jobs and periodic worker maintenance provide retries. Reminder scans use learner-local time and idempotent source keys. Database migration: `20260827130000_add_mobile_notifications`; coordinated deployment is pending and no shared database migration was applied during implementation.

## Batch 12 implementation checkpoint — Paid monthly reports

Implemented in the shared backend as additive Student-only functionality. No Admin route, Admin service, Admin UI, or existing Admin contract was changed.

- Added an immutable `LearnerMonthlyReport` snapshot per learner and calendar month, with learner timezone, selected-course snapshot, weekly study totals, focus/reading/practice/revision time, active and goal days, streak/protected days, notes completed, revision events, completed study-plan tasks, and syllabus completion.
- The current learner month is computed live and is never frozen. Completed Paid months are created idempotently and existing snapshots are never updated.
- Report access follows the existing mobile plan rule: at least one currently active, non-expired entitlement is required. Requests before the learner's first entitlement month and future months are rejected.
- Practice question count, accuracy, and weak-area metrics are deliberately unavailable while Practice development is paused. Persisted practice time remains part of total study time so recorded activity is not discarded.
- Added `GET /api/student/reports/monthly` and `GET /api/student/reports/monthly/:yearMonth`.
- Real authenticated mobile users consume the new API. Named demo accounts retain isolated report fixtures, and Free users retain the Paid lock presentation.
- Added migration `20260827090000_add_paid_monthly_reports`. It has not been applied to the shared database.

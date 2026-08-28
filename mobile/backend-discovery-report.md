# PARALLAX FLOW MOBILE BACKEND DISCOVERY REPORT

**Gate:** Gate 1 — discovery and feature ownership classification only  
**Prepared:** 26 August 2026  
**Mobile application reviewed:** `mobile/`  
**Existing web/backend reviewed read-only:** `Parallax-Flow-web/`  
**Backend scope:** the backend contracts required by the React Native mobile application  
**Out of scope for this gate:** backend implementation, schema or migration changes, database access, provider calls, mobile UI changes, and removal of the mobile Admin UI

**Shared repository sync note (26 August 2026):** `Parallax-Flow-web/main` was safely fast-forwarded from `2d9ce66` to `83e5635`. The incoming backend portion improves content response typing and adds proxy/S3 upload tests; it does not change Prisma, migrations, authentication, student routes, entitlement policy, or the mobile contracts classified in this report.

> This report is the evidence-backed prerequisite to backend planning. `backendplan.md` and `backendtodo.md` contain useful product intent, but they predate this full-stack discovery and are not implementation authority until reconciled in Gate 2.

## Evidence and verification policy

- Executable route, service, middleware, Prisma, and mobile screen code was treated as stronger evidence than stale documentation.
- No database was contacted. No Prisma migration command or integration test was run.
- No storage, payment, email, Google, push, or other external provider was contacted.
- No backend, migration, mobile UI, or runtime configuration was changed.
- The checked-in migration history was inspected. Which migrations are deployed in any live environment is **UNVERIFIED**.
- Where code and documentation conflict, the conflict is called out explicitly.
- Every unconfirmed runtime or product assumption is marked **UNVERIFIED**.

---

## 1. Executive summary

The existing web repository contains a substantial Express/Prisma/PostgreSQL backend that should be extended and reused for the mobile application. It already provides a strong base for authentication, database-backed sessions, roles and permissions, Academy tenant isolation, course/content/package/catalogue data, signed storage access, commerce, entitlements, orders, coupons, questions, Academy admissions, in-app notifications, audit events, and persistent background jobs.

The current React Native application is nevertheless almost entirely a UI prototype. Its screens do not consume the existing API. Authentication, profile, onboarding, learning activity, purchases, entitlements, note progress, practice answers, rewards, streaks, reports, and Admin data are mock, static, or stored locally. A generic Axios client exists but is not used by feature screens and has no complete refresh/session restoration flow.

The existing backend is therefore **reusable but not sufficient** for the complete mobile product. The largest missing server-owned domains are:

1. dual email/mobile OTP verification and password recovery;
2. permanent one-account/one-device binding;
3. learner exam preferences, daily capacity, and onboarding state;
4. note reading state, favourites, completion, revision, and recent activity;
5. focus sessions, daily activity, streaks, points, hearts, and immutable reward ledgers;
6. adaptive study plans and user to-do items;
7. practice sessions, answer submissions, retries, explanations, timers, challenges, and chapter metrics;
8. question-bank products and PYQ/RTP/MTP/year metadata;
9. weak-area computation, revision plans, and monthly reports;
10. protected document delivery with server-applied user watermarking and access audit;
11. mobile push registration/preferences and a unified student notification feed.

Several existing contracts also need correction before mobile adoption:

- the student questions endpoint returns `answerHtml` before the student submits an answer;
- question access is not tied to enrolment or question-bank entitlement;
- public catalogue listing can include inactive/archived or cross-Academy records unless explicitly filtered;
- a catalogue content service exists without a corresponding route;
- the web checkout client calls `/api/commerce/checkout`, while the server mounts `/api/checkout`;
- Academy analytics, Academy notification management, and Academy settings routers exist but are not mounted;
- mobile purchase UI grants local ownership without real payment or entitlement verification;
- the current PDF is bundled/sample content with a client-only watermark overlay, not protected document delivery.

The mobile Admin experience is explicitly obsolete for the target product. It must eventually be removed, but its screens and aliases should remain untouched until approval because three Admin-named local stores currently support student onboarding and note access. The real Admin workflow belongs in the web application.

**Gate 1 verdict:** ready for product/team review and Gate 2 contract planning; **not ready for backend implementation as one unrestricted batch**. Critical product and security decisions in section 24 must be approved first.

---

## 2. Existing application architecture

### 2.1 Mobile application

- React Native with Expo Router under `mobile/src/app`.
- Zustand stores provide mock auth and local feature state.
- AsyncStorage persists selected practice, reward, and to-do state; some stores are memory-only.
- Student routes:
  - entry/auth: `/`, `/login`, `/signup`, `/verify-otp`, `/forgot-password`, `/reset-password`, `/forced-logout`;
  - tabs: `/home`, `/notes`, `/practice`, `/tracker`, `/library`;
  - supporting screens: account, lesson reader, purchase, receipt, monthly reports, practice tracker, revision tracker, and hierarchical notes routes.
- Obsolete Admin routes exist both under `(admin)` and under `app/admin` aliases.
- Student screens currently read demo catalogues and local stores rather than backend APIs.
- `mobile/src/lib/api.ts` contains a generic Axios client, but no reviewed feature screen uses it.

### 2.2 Web application

- React/Vite storefront and Admin workspace under `Parallax-Flow-web/src`.
- Web data adapters call the Express API but several Admin/store adapters retain fixture fallbacks.
- Some checked-in documentation describes an older mock-only state and is stale relative to executable server code.
- Storefront static fallback products can mask backend failures and must not be copied into mobile production behavior.

### 2.3 Shared target architecture

The correct target is one backend and one PostgreSQL source of truth serving both web and mobile clients. Mobile must not create a second database or independently reimplement catalogue, Academy, commerce, entitlement, or question ownership. Mobile-specific endpoints may be added to the existing server, but they must reuse the existing identity, Academy, content, order, entitlement, audit, and job domains.

---

## 3. Existing backend architecture

### 3.1 Runtime

- TypeScript/Express server under `Parallax-Flow-web/server/src`.
- Prisma 7 and PostgreSQL persistence.
- Zod request validation.
- Central request context, structured logging, Helmet, allow-listed CORS, JSON content-type enforcement, API rate limiting, and structured errors.
- S3-compatible signed object storage adapter; disabled by default without valid configuration.
- Payment and email webhook adapters; disabled/unavailable when not configured.
- Persistent background-job table with leasing, retries, backoff, stale recovery, and deduplication.

### 3.2 Mounted route boundaries

| Mount | Authentication/authorization at mount | Purpose |
|---|---|---|
| `/health` | Public | Health checks |
| `/api/payments` | Provider signature in webhook flow | Raw-body payment webhook |
| `/api/auth` | Route-specific | Login, registration, Google, refresh, logout, session |
| `/api/admin` | Authenticated Super Admin | Platform operations |
| `/api/academy` | Authenticated, then Academy tenant middleware | Academy administration |
| `/api/student` | Authenticated global `student` role | Learner/profile/content/order/question/admission/notification APIs |
| `/api/catalog` | Public | Public catalogue |
| `/api/checkout` | Authenticated | Checkout creation |
| `/api/contact` | Public | Contact submission |

### 3.3 Important routing defects

- `academyAnalyticsRouter`, `academyNotificationRouter`, and `academySettingsRouter` are implemented but are not imported/mounted by the Academy router or application composition. Their apparent endpoints are currently unreachable.
- Existing unauthenticated integration checks can return `401` at the outer `/api/academy` mount even for an unmatched child path, so they do not prove these routers are mounted.
- A catalogue content service exists, but no `/api/catalog/content/:id` route was found.
- The web checkout adapter calls a different URL than the server mount.

### 3.4 Environment boundaries

- Local/test/staging/production are configuration-driven; checked-in examples expose names, not live secrets.
- Storage, payment, email, and Google behavior is provider-gated and may be disabled when configuration is absent.
- Which providers are enabled in staging or production is **UNVERIFIED**.
- No `.env` credential values are reproduced in this report.
- Integration tests include a database guard requiring an explicit run flag, identical test/runtime URL, loopback PostgreSQL host, and a database name containing a test/CI marker.
- Route response bodies are not uniformly wrapped by an obvious versioned mobile envelope. Exact envelope compatibility across domains is **UNVERIFIED** and must be frozen in Gate 2.

---

## 4. Existing PostgreSQL architecture

### 4.1 Identity and security

`User`, `Role`, `Permission`, `RolePermission`, `UserSession`, `PasswordCredential`, `AuditEvent`, `SystemAuditLog`, and `SecurityEvent` provide identities, permission assignment, refresh-token rotation, session revocation, and auditing.

### 4.2 Learning catalogue and content

- `Course`, `Subject`, hierarchical `ContentItem`, `Package`, and `PackageItem`.
- `TaxonomyChapter`, `TaxonomyLesson`, and `TaxonomyTopic` provide question taxonomy.
- Content includes free/paid access, publication state, pricing, storage path, MIME type, and parent hierarchy.
- `ContentLocationSetting`, sample images, and merchandising/store section models support presentation.
- Both `AcademyCourse`/`AcademyContent` and shared `Course`/`ContentItem` models exist. Current reviewed services primarily use the shared models. The intended long-term ownership of the parallel Academy models is **UNVERIFIED** and should be resolved before schema extension.

### 4.3 Questions

`Question`, `QuestionOption`, and `CaseSubQuestion` support MCQ, descriptive, and case questions; difficulty; HTML content; correct answer; free/correct explanation; premium wrong-answer explanation; and course/subject/chapter/lesson/topic references.

Missing from the observed schema are question-bank products, PYQ year/source, RTP/MTP collection metadata, practice sessions, attempts, selected answers, retry state, review flags, challenge participation, and per-user question progress.

### 4.4 Commerce and entitlement

`Order`, `OrderItem`, `Payment`, `PaymentRefund`, `Coupon`, `CouponTarget`, `CouponRedemption`, and `Entitlement` cover checkout, receipts, discounts, refunds, complimentary access, and access grants. Entitlements support permanent/time-limited state and purchase/Admin/subscription/promotion sources.

Current checkout grants permanent package entitlements. Individual content/question-bank commerce and exam-date-derived expiry are not fully represented by current flows.

### 4.5 Academy tenancy

`Academy`, `AcademyMembership`, `AcademyCourseEnrollment`, invitations, admissions, and active Academy preference models support tenant membership and course enrolment. Admissions include QR/code claim flows with provenance and hardening migrations.

### 4.6 Communications and operations

- `Notification`, recipient/target/template/delivery models support in-app and email delivery.
- `Broadcast` and related placement/target/timeline/event models are a separate platform/marketing domain.
- `BackgroundJob`, `StorageUpload`, `IdempotencyRecord`, `ContactSubmission`, and `PaymentWebhookEvent` support reliable operations.
- No Expo/APNs/FCM device-push-token model was found.

### 4.7 Migration state

Checked-in migrations cover auth, courses/content/packages/questions, commerce, broadcast, Academy, settings/security, multi-tenancy, admissions, notifications, refresh tokens, notification hardening, operational reliability, course uniqueness, admission provenance, and QR/code hardening through dated migrations on 25 August 2026.

Repository documents contain inconsistent claims about deployment: some reports describe successful disposable-database application while other documentation says an operational migration was not deployed. Newer migrations post-date some reports. Therefore:

- migration files present in Git: **CONFIRMED**;
- migration application to local/staging/production databases: **UNVERIFIED**;
- live schema parity with `schema.prisma`: **UNVERIFIED**.

---

## 5. Authentication and session architecture

### 5.1 Existing server behavior

- Password registration: `POST /api/auth/register` with full name, email, and password.
- Password login: `POST /api/auth/login`.
- Google ID token login/registration: `POST /api/auth/google` when configured.
- Refresh rotation: `POST /api/auth/refresh` using opaque hashed refresh tokens and an atomic rotation flow.
- Logout: `POST /api/auth/logout` revokes the current session.
- Session restore: `GET /api/auth/session` validates user, role, and session state.
- Access tokens are signed HMAC JWTs with issuer, audience, subject, session, JTI, issued-at, and expiry claims.
- Protected requests also check the database session and disabled/deleted user state.

### 5.2 Gaps against mobile UI/product requirements

- no email OTP send/verify;
- no mobile-number OTP send/verify;
- no verified phone ownership;
- no forgot-password initiation or reset-token/OTP completion;
- no permanent first-device binding;
- no secure mobile credential persistence/refresh coordinator;
- session platform is currently created as `WEB` rather than derived from the actual client;
- no app-attestation/device-integrity contract;
- no account recovery policy for a lost/replaced permanently bound device.

The mobile mock accepts local identities and locally assigns Free, Paid, or Admin roles. None of that is a valid authorization boundary.

### 5.3 Required mobile token posture

- Access and refresh credentials must be stored in OS secure storage, never AsyncStorage.
- Refresh rotation must be single-flight to avoid concurrent refresh replay failures.
- All local user data must be cleared or partitioned on logout/account change.
- A forced-logout response should map to a stable API error code, not merely a screen route.
- Device binding must use a server-issued installation key and explicit recovery flow; hardware identifiers alone are unstable and privacy-sensitive.

---

## 6. Role and permission model

### 6.1 Existing model

- Global roles and normalized permissions are database-backed.
- `/api/admin` requires a Super Admin identity; sensitive endpoints add explicit permissions such as `students:read`, `students:manage`, `orders:read`, `orders:manage`, `sessions:revoke`, `audit:read`, and `security:read`.
- Academy roles are membership-scoped: Academy Admin, teacher, and student states are represented independently of global roles.
- `/api/student` requires the global `student` role.

### 6.2 Mobile policy

- The production mobile application is a student/learner application.
- It must not expose Platform Super Admin or Academy Admin workflows.
- A role claim displayed by the client is never authorization; every resource request must be server-authorized.
- Free versus Paid is not a role. It is derived from current entitlements and resource policy.
- Academy membership, course enrolment, and content/question-bank entitlement are different checks and must not be collapsed.

### 6.3 Unverified role concern

The schema and mapping code contain more than one student-like role label across global and Academy domains. Seed/runtime consistency for all deployed role keys is **UNVERIFIED**. Gate 2 should define canonical role keys and test every route guard against real seeded roles.

---

## 7. Platform versus Academy ownership model

| Domain | Platform-owned | Academy-owned | User-owned/derived |
|---|---|---|---|
| Identity/global role | Yes | Membership association only | Profile fields/session state |
| Course/content/package | Supported with `academyId = null` | Supported with Academy scope | Enrolment/entitlement determines visibility |
| Questions | Supported with `academyId = null` | Supported with Academy scope | Attempts/progress missing |
| Orders/payments | Platform commerce records | Academy attribution supported in schema/queries where set | User order history |
| Entitlements | Platform grants/purchases | Admin grants may be Academy-associated | Effective access derived per user/resource/time |
| Admissions | Platform governance | Academy-owned issuance/claim | User claim result |
| Notifications | Platform infrastructure | Academy notification records | Read state/recipient status |
| Broadcasts | Platform marketing plus Academy targeting | Academy-targeted broadcasts supported | User event/ack domain exists but is not exposed to mobile |
| Learning telemetry | Missing | Missing | Must be user-owned with Academy/course context |

The tenant middleware is a strong starting point: non-Super-Admin Academy access is resolved from active memberships, client-supplied Academy IDs are checked, and ambiguous membership can fail closed. Student services also validate membership/enrolment for Academy-scoped course/content access.

Mobile requests must always carry or resolve an active Academy context where required. Cache keys must include user ID and Academy ID. A user switching Academy must not see the previous Academy's content, notification, progress, or signed URLs.

---

## 8. Admin-influenced feature inventory

| Admin/web action | Mobile effect | Existing source | Status |
|---|---|---|---|
| Create/update/archive course and subjects | Onboarding/course browse/filter options | Course/Subject | Existing, subject management contract needs verification |
| Build content hierarchy and publish PDFs | Notes hierarchy and reader availability | ContentItem | Existing base |
| Set free/paid status and price | Lock state and store metadata | ContentItem/Package | Existing base |
| Create/publish packages | Package/store/library cards | Package/PackageItem | Existing base |
| Create questions and taxonomy | Practice filters/questions | Question/taxonomy | Existing base; mobile metadata gaps |
| Create coupons | Checkout discount | Coupon models/routes | Existing web/backend; mobile purchase strategy unresolved |
| Grant complimentary access | Unlock specific material for a student | Entitlement | Existing base |
| Revoke/expire access | Lock/expiry state | Entitlement | Existing base |
| Set resource validity | Library expiry | Entitlement expiry | Schema supports it; authoring/checkout policy incomplete |
| Set estimated topic study hours | Adaptive daily plan | No confirmed model/route | Missing |
| Configure solve-and-earn target/reward | Practice challenge | No confirmed model/route | Missing |
| Send Academy notifications | Mobile notification feed | Notification domain | Student read API exists; Admin router currently unmounted |
| Publish platform broadcast | In-app campaign/banner | Broadcast domain | Admin domain exists; student delivery endpoint missing |
| Issue Academy admission QR/code | Academy join | Admissions domain | Existing APIs |
| Disable student/revoke sessions | Forced logout/access removal | User/UserSession | Existing platform Admin APIs |

Admin-authored data must never be duplicated into mobile fixtures in production. Publication state, Academy scope, entitlement, expiry, and revocation must be re-evaluated server-side.

---

## 9. User-influenced feature inventory

| User action | Expected source of truth | Current mobile state |
|---|---|---|
| Register/login/Google/logout | Server identity/session | Mock/local |
| Verify email and phone OTP | Server OTP challenges | Local animation only |
| Choose course/exam date/Academy | Learner profile/preferences | Local profile store |
| Check in/out of focus session | Focus session/activity records | Local demo study store |
| Add/complete/delete a to-do | User task records | AsyncStorage |
| Open/read/favourite/complete/revise a note | Reading/progress records | Local lesson reader store |
| Purchase/open receipt | Orders/payments/entitlements | Fake local purchase/static receipt |
| Configure practice filters/timer | Practice session request/user preference | Local state |
| Answer/retry/mark question | Attempt/answer records | AsyncStorage/local answer key |
| Complete solve-and-earn | Server challenge verification/reward ledger | Local calculation |
| View chapter practice stats | Attempt aggregation | Local seed/attempts |
| View streak/calendar/consistency | Daily activity aggregation | Local seed/reward store |
| Claim heart/reward | Immutable server ledger | Local store |
| View revision/monthly report | Server aggregation/snapshot | Static/local |
| Read notification | Notification recipient state | API exists but unused |

---

## 10. Mixed/system-derived feature inventory

These features combine Admin configuration, user activity, and deterministic server computation:

- effective Free/Paid/expired content access;
- exam countdown and default first-day rule when day is omitted;
- syllabus completion;
- streak continuity and streak recovery hearts;
- points based on target completion;
- adaptive study-plan generation from estimated topic hours, daily capacity, exam date, prerequisites, progress, and repeated weak concepts;
- weak-area detection from repeated errors by concept;
- chapter practice progress and revision due state;
- monthly learning reports;
- solve-and-earn eligibility and reward;
- recently opened notes;
- notification recipient selection and unread count.

All are server-derived even when presentation and transient animation are client-owned. The client may optimistically render, but it cannot award currency, alter access, or authoritatively compute progress.

---

## 11. Admin-to-mobile dependency map

```text
Web Admin course + subject management
  -> Course / Subject / taxonomy
  -> onboarding choices, Notes hierarchy, Practice filters

Web Admin content upload + publication + price
  -> ContentItem + storage object + publication/access policy
  -> Notes cards -> content access check -> protected reader session

Web Admin package composition
  -> Package + PackageItem
  -> store/package cards -> order -> entitlement -> Library

Web Admin question authoring
  -> Question + taxonomy + explanation policy + future source metadata
  -> practice builder -> session -> attempt -> tracker/weak areas

Web Admin entitlement grant
  -> Entitlement
  -> immediate mobile lock-state/library refresh

Web Admin topic estimate + challenge policy (missing)
  -> study-planning/challenge configuration
  -> daily plan and solve-and-earn card

Web Admin notification/broadcast
  -> recipient jobs and delivery records
  -> mobile inbox/push/read state

Web Admin account/session action
  -> User/UserSession state
  -> API rejection -> secure local logout/forced-logout screen

Web Admin archives/deletes course, content, or question
  -> authoritative lifecycle state
  -> server listing/access filter and cache invalidation
  -> mobile refresh removes, locks, or preserves historical access per approved policy

Web Admin disables a student
  -> User status + session revocation/authorization
  -> next refresh/protected request fails with a stable code
  -> mobile clears scoped cache and shows forced-logout/access-denied state
```

Mobile should invalidate affected queries after login/session refresh, Academy switch, purchase return, entitlement change, notification event, and content publication refresh. It must not poll Admin fixture stores.

---

## 12. Existing APIs the mobile app can reuse

### 12.1 Authentication

| Method and route | Reuse | Caveat |
|---|---|---|
| `POST /api/auth/login` | Yes | Add mobile platform/device metadata and secure token handling |
| `POST /api/auth/register` | Partial | Lacks phone and dual verification flow |
| `POST /api/auth/google` | Yes | Google configuration and mobile audience handling must be verified |
| `POST /api/auth/refresh` | Yes | Mobile single-flight rotation required |
| `POST /api/auth/logout` | Yes | Clear user/Academy-partitioned cache |
| `GET /api/auth/session` | Yes | Use for cold-start session restoration |

### 12.2 Student and Academy context

| Method and route | Reuse | Caveat |
|---|---|---|
| `GET /api/student/me` | Yes | Profile is too narrow for onboarding |
| `PATCH /api/student/me` | Yes | Only full name/phone currently |
| `GET /api/student/memberships` | Yes | Required for Academy selector/context |
| `GET/PUT /api/student/active-academy` | Yes | Cache isolation required |
| `GET /api/student/dashboard` | Partial | Current Academy counts/recent orders are not the mobile learning dashboard |
| `POST /api/student/admissions/qr/claim` | Yes | UI not currently present |
| `POST /api/student/admissions/codes/claim` | Yes | UI not currently present |

### 12.3 Catalogue, content, orders, and access

| Method and route | Reuse | Caveat |
|---|---|---|
| `GET /api/catalog` | Partial | Fix lifecycle/tenant filtering before production reuse |
| `GET /api/catalog/courses/:courseId` | Yes after policy review | Public metadata only |
| `GET /api/catalog/packages/:packageId` | Yes after policy review | Public metadata only |
| `GET /api/catalog/collections/:key` | Partial | Personalization actor is not currently populated |
| `GET /api/catalog/user-courses` | No as implemented | Public request context does not populate `actorId`; observed result is effectively empty |
| `GET /api/student/courses` | Yes | Academy enrolment-scoped, not public catalogue |
| `GET /api/student/courses/:courseId` | Yes | Enrolment and context required |
| `GET /api/student/courses/:courseId/content` | Yes | Hierarchical parent pagination/contract must drive Notes UI |
| `GET /api/student/content/:contentId/access` | Partial | Signed URL works; protected watermark/read-session contract missing |
| `GET /api/student/orders` | Yes | Mobile receipt shape/version should be stabilized |
| `GET /api/student/orders/:orderId` | Yes | User ownership is enforced |

### 12.4 Questions and communication

| Method and route | Reuse | Caveat |
|---|---|---|
| `GET /api/student/questions` | Unsafe until fixed | Leaks answer HTML; lacks entitlement and attempt/session policy |
| `GET /api/student/notifications` | Yes | In-app Notification domain only |
| `GET /api/student/notifications/unread-count` | Yes | Add mobile query/cache policy |
| `PATCH /api/student/notifications/:id/read` | Yes | Recipient ownership must remain server-enforced |

### 12.5 Commerce

| Method and route | Reuse | Caveat |
|---|---|---|
| `POST /api/checkout` | Product decision required | Prefer website/deep-link purchase if mobile must remain read-only for commerce |
| `POST /api/payments/webhook/:provider` | Backend-only | Never called by mobile; signed/idempotent provider callback |

No Admin endpoint should be called by the production student mobile application.

---

## 13. Existing mobile screens using real APIs

**None of the reviewed mobile feature screens currently use a real backend API.**

- The Axios client in `mobile/src/lib/api.ts` is infrastructure only.
- No reviewed student or Admin screen imports that client.
- The mobile auth store creates mock users/tokens in memory.
- React Query infrastructure may be installed/provided, but the reviewed feature screens are not backed by server queries.
- The PDF reader uses a bundled sample document rather than the content-access endpoint.
- Purchase, receipt, grant, progress, question, and report screens use local/static data.

This means there is no gradual production fallback to trust. Gate 3 must replace each feature source deliberately and must fail closed when required backend data is unavailable.

---

## 14. Screens still using mock, fixture, or fallback data

| Mobile area | Current source/behavior | Required replacement |
|---|---|---|
| Welcome/login/signup | Local mock identity routing; `mockuser`, `mockpaid`, `mockadmin` behavior | Real auth/session APIs and environment-gated demo harness outside production |
| OTP verification | Local input, timeout, and animation | OTP challenge/send/verify APIs |
| Forgot/reset password | Local transitions/success | Recovery challenge APIs |
| Learner onboarding | Local course store/profile | Catalogue/preferences/Academy APIs |
| Home focus card | Local demo study store | Focus-session APIs |
| Daily target/countdown/syllabus | Fixed/local profile data | Learner preferences and server aggregates |
| Points/hearts/streak | AsyncStorage/local calculation | Reward ledger and daily-activity APIs |
| Study to-do list | AsyncStorage | User-task/study-plan APIs |
| Notes and packages | `demo-catalog` and Admin local stores | Course/content/package/catalogue APIs |
| Note actions | Local lesson-reader state | Reading-state APIs |
| PDF reader | Bundled five-page sample and client overlay | Protected content view-session/document service |
| Library | Static owned items/orders/expiry | Entitlements, orders, resources, receipts |
| Purchase | Local fake success/ownership | Remove local mutation; approved checkout/deep-link and entitlement refresh |
| Practice builder | Demo subjects/topics/questions and local plan check | Question-bank catalogue/entitlement/session APIs |
| Practice runner | Local answers, retries, explanations, timer/navigation | Practice attempt/session APIs |
| Practice tracker | Seeded/local aggregates | Server attempt aggregations |
| Tracker | Fixed/local activity and exam metrics | Focus/activity/streak/progress APIs |
| Revision tracker | Local note status-derived data | Revision-plan APIs |
| Monthly reports | Static report data | Server snapshots/aggregates |
| Account | Mock auth/local profile | Profile, plan, memberships, devices, preferences APIs |
| Mobile Admin | `demo-admin`, local course/access stores | Remove after approved dependency replacement; Admin remains web-only |

### Web fallback warning

The web storefront/Admin repository also contains adapters that fall back to static store products or Admin fixtures when requests fail. These are not production backend evidence and must not be replicated in mobile. A production mobile request failure should render an explicit loading/error/offline state, never invented ownership, orders, prices, or content.

---

## 15. Missing backend contracts

The following are contract families, not approved endpoint designs. Exact methods and payloads belong to Gate 2.

### 15.1 Identity and onboarding

- initiate and verify email OTP;
- initiate and verify mobile OTP;
- verification status and resend/rate-limit state;
- forgot/reset password challenge;
- installation registration and permanent device binding;
- device inspection/recovery/Admin reset policy;
- expanded learner profile: course/exam/category, exam month/year/optional day, Academy/admission association, daily study capacity, timezone, locale, notification preferences, and onboarding completion;
- default exam date to the first day when only month/year is provided.

### 15.2 Learning dashboard and planning

- open/close/heartbeat focus session;
- daily target and daily/weekly activity summary;
- exam countdown and syllabus completion;
- streak calendar, recovery eligibility, points/hearts wallet, and immutable reward transactions;
- user-created tasks;
- generated daily study plan with reason/provenance, estimated duration, ordering, completion, dismissal, and regeneration policy;
- Admin topic-duration/prerequisite configuration;
- weak-concept signals feeding the plan.

### 15.3 Notes and protected content

- unified student notes/packages library query with search, status, recent, favourites, and pagination;
- reading-state mutation for opened/page/progress/completed/favourite/revision count/next revision;
- pre-purchase note actions that do not grant read access;
- protected document view-session creation;
- server-applied personalized watermark artifact or protected page stream;
- access audit and view-session expiry/revocation;
- explicit content-access denial reason (`NOT_ENROLLED`, `NOT_ENTITLED`, `EXPIRED`, `ARCHIVED`, etc.).

### 15.4 Practice

- question-bank/resource listing and entitlement;
- Archive/PYQ versus paid question-bank source policy;
- question source metadata: year, PYQ/RTP/MTP, exam/category, bank/edition;
- practice-set preview/build contract with server-selected eligible questions;
- practice session lifecycle and timer/challenge policy;
- answer submission with server evaluation;
- question navigator state: answered, unanswered, marked for review, wrong-locked, retryable;
- Free/Paid explanation and retry policy returned by the server;
- descriptive/case response storage contract; evaluation and grading are outside scope;
- solve-and-earn challenge verification and server reward award;
- chapter/topic practice aggregates, weak areas, and monthly snapshots.

### 15.5 Revision, reports, notifications, and commerce reflection

- revision plan/chapters/revision instances/due status;
- month list and monthly report detail;
- mobile push-token registration, rotation, deletion, and preferences;
- unified notification/broadcast inbox or an explicit separation contract;
- post-purchase return/status polling and entitlement refresh if purchase occurs on web;
- receipt view/share contract without client-generated financial data.

---

## 16. Existing schema gaps, if any

The following logical records are not represented by confirmed current models. Gate 2 must decide whether each is a model, event, aggregate, or projection; this report does not prescribe migrations.

| Gap | Why it is required |
|---|---|
| OTP challenge/verification | Dual verified email/mobile signup and recovery |
| Device installation/binding/recovery | Permanent single-device rule |
| Learner preferences/exam plan | Course/category/exam date/daily capacity/timezone/onboarding |
| Content reading state | Recent, favourite, completed, progress, revision count |
| Protected view session/watermark artifact | Auditable short-lived PDF access |
| Focus session and daily activity | Check-in/out, hours, consistency, streak |
| Reward wallet/ledger and recovery use | Tamper-resistant points/hearts/streak recovery |
| User task and generated study-plan item | Manual to-do and adaptive plan |
| Topic study estimate/prerequisite | Admin-authored workload planning |
| Question-bank product/edition | Paid bank ownership and filter scope |
| Question source/year/collection metadata | Archive PYQ/RTP/MTP behavior |
| Practice session/attempt/answer | Navigator, retry, explanation, timer, tracker |
| Practice challenge/reward result | Solve-and-earn verification |
| Weak-area aggregate/signal | Concept-wise recommendations |
| Revision plan/instance | Chapter-wise staged revision |
| Monthly report snapshot | Stable historical reports |
| Push installation/token/preference | Native notifications |

Potential reuse should be preferred: `Entitlement` already supports time-limited access; `BackgroundJob` already supports durable asynchronous work; existing Academy/course/content/taxonomy identifiers should be referenced rather than duplicated.

---

## 17. Security and tenant-isolation risks

### Critical

1. **Mobile local purchase grants access without payment.** A student can obtain local ownership by completing a UI flow. Production must remove this mutation and derive access only from server entitlements.
2. **Question answer leakage.** `GET /api/student/questions` exposes `answerHtml` before answer submission. A modified client can inspect correct answer content.
3. **Question authorization gap.** Question listing does not enforce course enrolment or question-bank entitlement, so paid-bank policy cannot be trusted.
4. **Mock mobile authentication/roles.** Local strings create Free/Paid/Admin identities and mock tokens. Any production inclusion would be an authorization bypass.

### High

1. **Catalogue lifecycle/tenant exposure.** Public listing does not consistently require active course/Academy state and can list Academy-scoped records without an Academy filter. Exact exploitable data depends on deployed records and is **UNVERIFIED**, but the query policy is unsafe.
2. **Client-only PDF protection.** A signed raw PDF URL plus client watermark overlay does not provide durable personalized watermarking. No-download/no-print UI is not access control.
3. **Token handling incomplete.** Mobile lacks secure persistent credentials, refresh coordination, session restore, and user-partitioned cache clearing.
4. **Local rewards/progress are mutable.** AsyncStorage can be edited; points, hearts, streaks, practice results, and completion cannot be trusted.
5. **Permanent device rule absent.** Current sessions allow account use on additional devices unless ordinary session policy happens to block it.
6. **Fixture fallback can invent commercial state.** Web fallback behavior demonstrates a pattern mobile must not inherit.
7. **Seed credential hazard.** A deterministic integration identity and plaintext test credential exist in seed/test-oriented code. Values are intentionally not reproduced here. They must never be used in shared or production environments; actual deployment is **UNVERIFIED**.

### Medium

1. Academy analytics/settings/notification management source exists but is unreachable due to missing router mounts.
2. Global Broadcast and Academy Notification are separate domains; a mobile client could miss platform communications without an explicit aggregation contract.
3. Public catalogue personalization relies on an actor context that is not set for the public router.
4. Checkout is mounted for any authenticated identity rather than explicitly student-only. Whether non-student checkout is acceptable is a product rule.
5. Coupon usage appears reserved/incremented during checkout; release after later abandoned/failed provider flows is not clearly demonstrated and is **UNVERIFIED**.
6. Direct platform entitlement without Academy enrolment may be blocked by student course/content flow. Intended behavior is **UNVERIFIED**.
7. Parallel Academy-specific and shared course/content models create ownership ambiguity and potential inconsistent writes.

### Existing strengths to preserve

- Academy membership-derived tenant context and client Academy-ID spoof checks;
- database-backed session revocation and disabled-user checks;
- permission checks on sensitive Platform Admin routes;
- signed/idempotent payment webhook handling;
- idempotency keys for checkout/refund workflows;
- local-only integration database guard requiring loopback and test-labelled database;
- bounded signed storage URL TTL;
- server-side price and coupon calculation.

---

## 18. Content/storage access model

### 18.1 Current model

1. Admin/web stores a content item with an object storage path.
2. Student requests content access.
3. Server checks publication, enrolment, free/entitled/package access, and entitlement expiry.
4. Server returns a short-lived signed object URL.
5. Mobile currently does not use this; it renders a bundled sample PDF.

### 18.2 Required protected-note model

- Keep object storage private.
- Never ship permanent object URLs.
- Create a short-lived user/content view session after re-evaluating access.
- Apply the authenticated user's normalized email as a server-generated watermark to the served artifact or page stream. A client overlay alone is insufficient.
- Record user, content, entitlement, Academy, installation, IP/risk metadata, and issue/expiry timestamps for access audit.
- Prevent caching of raw protected bytes by default. If encrypted offline access is ever approved, it requires a separate threat model, device-bound key, expiry, and remote revocation behavior.
- Reader UI may omit download, print, page-next, and percentage controls and allow continuous pinch/scroll. Those are UX controls, not security guarantees.
- Android secure-window/iOS capture detection may reduce casual capture. No consumer mobile application can guarantee that content cannot be photographed or captured by another device; this limitation must be stated honestly.

The current S3 adapter and signed URL mechanism are reusable building blocks, but the watermark transformation/streaming layer and view-session audit are missing.

---

## 19. Commerce/entitlement reflection model

### 19.1 Existing reliable path

1. Server validates published package/course and authoritative price.
2. Server validates coupon and idempotency key.
3. Zero-total/complimentary order can complete immediately.
4. Paid checkout creates a payment-provider redirect.
5. Signed/idempotent webhook marks payment/order and grants entitlement.
6. Full refund revokes entitlement; partial refund behavior does not automatically revoke all access.

### 19.2 Mobile rule

The mobile app must never set `owned`, `paid`, `expiresAt`, or entitlement state locally. It should render:

- catalogue metadata from the server;
- effective access from entitlements;
- pending payment separately from paid/owned;
- expiration and revocation from server timestamps/status;
- receipts from immutable order/payment data.

If native in-app payments are not part of the approved product, mobile should deep-link to the web checkout and refresh order/entitlement state on return. If native billing is later required, app-store purchase validation is a separate backend/provider project and cannot reuse a web redirect unmodified.

### 19.3 Gaps

- individual note/question-bank products and purchase mapping;
- question-bank entitlement enforcement;
- Admin authoring of time-limited resource policy in the current web flow;
- expiry derived from learner exam date;
- payment-return/deep-link status contract;
- explicit entitlement-change event/query invalidation for mobile;
- coupon reservation release policy for abandoned checkout (**UNVERIFIED**).

---

## 20. Broadcast/notification delivery model

### 20.1 Existing domains

- Academy `Notification` supports templates, recipients, individual targets, delivery records, in-app/email channels, scheduling, and background dispatch.
- Platform `Broadcast` supports placement, CTA/image, Academy/course/package targeting, timeline, and user events.
- Student notification list, unread count, and mark-read routes are mounted.
- Academy notification management source is not mounted.
- No student Broadcast feed endpoint and no Expo/APNs/FCM token model were found.

### 20.2 Required decision

Choose one mobile inbox contract:

1. aggregate Academy Notifications and Platform Broadcasts into one ordered feed with a discriminated item type; or
2. expose them as explicit separate channels.

Do not silently omit either domain. Native push should be a delivery hint; the database inbox remains the source of truth. Push token records must be tied to user, installation, platform, environment, and last-seen status and removed on logout/device reset.

---

## 21. Cache and offline-data isolation requirements

### 21.1 Partition keys

Every authenticated cache/persistence key must include at least:

```text
environment + userId + activeAcademyId + resource/query identity
```

Plan/entitlement changes must also invalidate policy-sensitive caches. A Free user logging into the same device after a Paid user must not inherit owned content, explanations, retries, reports, points, or signed URLs.

### 21.2 Allowed local persistence

- non-sensitive UI preferences such as theme;
- server response metadata required for read-only offline shells, if product-approved;
- unsent user task/answer drafts with user/Academy partition and conflict handling;
- short-lived query cache that excludes credentials and protected document bytes.

### 21.3 Prohibited or restricted persistence

- access/refresh tokens in AsyncStorage;
- raw paid PDFs or long-lived signed URLs;
- authoritative entitlements, prices, order status, points, hearts, streak, answer keys, or correct explanations;
- unpartitioned practice/reward/to-do state;
- Admin or another user's data.

### 21.4 Lifecycle

- Cold start: restore secure session, then active Academy, then hydrate scoped queries.
- Logout/forced logout/account change: revoke where possible, delete secure credentials, cancel requests, clear all user-scoped memory and disk cache.
- Academy change: cancel Academy-scoped requests and clear/switch the Academy partition.
- Offline mutation: queue only operations explicitly designed as idempotent; otherwise show read-only/offline state.

Current AsyncStorage-backed practice/reward/to-do data is not sufficiently partitioned and presents cross-account contamination risk.

---

## 22. Confirmed obsolete Admin UI inside mobile

### 22.1 Confirmed Admin-only screen tree

The following mobile production concepts are obsolete because Admin operations belong to the web workspace:

- `(admin)/index.tsx` — overview;
- `(admin)/students.tsx` and `(admin)/students/[id].tsx`;
- `(admin)/orders.tsx` and `(admin)/orders/[id].tsx`;
- `(admin)/content.tsx`;
- `(admin)/packages.tsx`;
- `(admin)/questions.tsx`;
- `(admin)/coupons.tsx`;
- `(admin)/audit.tsx`;
- `(admin)/_layout.tsx`;
- `components/admin-shell.tsx`;
- duplicate `app/admin/**` route aliases;
- legacy `app/admin/login.tsx` redirect;
- Admin-specific mock arrays and formatting in `lib/demo-admin.ts` after dependencies are removed;
- Admin demo identity/role branches in `lib/auth-store.ts` after routing/auth replacement.

### 22.2 Do not delete yet

Removal is blocked until approval and student dependencies are replaced:

- `admin-course-store.ts` is used by learner onboarding as the course source.
- `admin-access-store.ts` is used by student Notes hierarchy and note action components to simulate complimentary access.
- `demo-admin.ts` seeds `admin-access-store.ts`, so it indirectly influences student access.
- `auth-store.ts` is shared by all student screens even though it contains mock Admin behavior.

### 22.3 Safe removal sequence for a later gate

1. Replace onboarding course data with approved catalogue/course APIs.
2. Replace local grants with server `Entitlement` queries.
3. Replace mock auth roles with server session identity.
4. Confirm no student import reaches Admin fixtures/stores.
5. Remove Admin route group, aliases, Admin shell, Admin-specific fixtures, and Admin auth branches.
6. Add route tests proving Admin URLs are absent from mobile production bundles.

No file in this section was removed during Gate 1.

---

## 23. Recommended feature implementation order

This is a dependency order for Gate 2 planning, not authorization to implement.

### Phase A — safety and contract correction

1. Freeze canonical role keys, Academy context rules, API version/error envelope, pagination, timestamps, and idempotency conventions.
2. Reconcile migration history and deployed schema in an approved non-production environment.
3. Fix catalogue lifecycle/tenant filters, missing catalogue-content route decision, checkout path mismatch, and question answer/authorization leakage.
4. Mount or formally retire Academy analytics/settings/notification routers and add positive authorization tests.
5. Define environment boundaries and remove production fixture fallback behavior.

### Phase B — production mobile identity

1. Secure mobile login/Google/session restore/refresh/logout.
2. Email/mobile OTP and recovery.
3. Permanent installation binding plus approved lost-device recovery.
4. Expanded learner profile/onboarding, course/exam/Academy context.
5. User/Academy-partitioned query cache and forced-logout handling.

### Phase C — catalogue, entitlement, and protected notes

1. Mobile catalogue/course/content/package queries.
2. Effective entitlement/library/orders/receipts.
3. Note reading state: recent, favourite, completion, revision.
4. Protected document view session, server watermark, and access audit.
5. Remove local fake ownership and note-grant stores.

### Phase D — learning activity and rewards

1. Focus sessions and daily activity aggregation.
2. Daily targets, exam countdown, syllabus progress.
3. Streak calendar, points, hearts, recovery, immutable ledger.
4. Manual tasks and then deterministic adaptive plan generation.

### Phase E — practice and analytics

1. Question-bank/source/year metadata and entitlement.
2. Practice session/build/answer/navigation/timer APIs.
3. Server-enforced Free/Paid retry/explanation behavior.
4. Solve-and-earn verification and reward.
5. Practice tracker, concept weak areas, revision plan, monthly reports.

### Phase F — communications and cleanup

1. Unified mobile inbox and read state.
2. Push installation/token/preferences and delivery.
3. Remove obsolete mobile Admin UI after student dependencies are real.
4. Remove all production mock/fallback paths and add end-to-end tenant/security tests.

---

## 24. Questions requiring product/team approval

### Identity and access

1. Is device binding permanent for the lifetime of an account, or can support/Admin reset it after identity verification?
2. What constitutes the “same device” after OS reinstall, app-data clear, factory reset, or device repair?
3. Must email and phone both be verified before account creation completes, or can one be deferred?
4. What are OTP lifetime, resend limit, attempt limit, lockout, and recovery rules?
5. Can Google-created accounts set a password later, and is phone verification mandatory for them?
6. Which canonical global role key represents every mobile learner?

### Academy and course ownership

7. Can a learner belong to multiple Academies and switch actively, or must mobile enforce one Academy?
8. Can platform users purchase/access content without Academy enrolment?
9. Which course/content model family is canonical: shared `Course`/`ContentItem` or parallel `AcademyCourse`/`AcademyContent`?
10. Is course selection during onboarding a preference, enrolment request, or catalogue filter?

### Commerce and content

11. Is mobile commerce read-only with website checkout, or will native app-store billing be required?
12. Are individual notes purchasable, or only packages/courses/question banks?
13. Is paid expiry a fixed Admin date/duration, the learner's exam date, or the earliest of both?
14. What happens to access when the learner changes the exam date?
15. Should pre-purchase “completed/favourite/revise” state survive a later purchase?
16. What exact watermark appearance, density, and audit retention are required?
17. Is encrypted offline PDF access allowed? Default recommendation: no, until separately threat-modelled.

### Practice and planning

18. What identifies a Free Archive question versus a paid question-bank question?
19. Is the Free explanation rule “only after a correct answer,” while Paid sees explanation after every attempt, exactly as stated?
20. How many retries can Paid users make, and does a retry replace or append an attempt?
21. Descriptive and case-study free-text responses are stored ungraded; no Admin, manual, AI or automated evaluation workflow is in scope.
22. Who configures solve-and-earn question count, time, point value, attempt frequency, and anti-abuse rules?
23. What threshold makes repeated wrong answers a weak concept?
24. Should weak-area planning be deterministic rules only initially? Recommended: yes; AI is not required.
25. How should Admin estimated topic hours interact with prerequisites, exam priority, missed work, weekends, and user daily capacity?
26. Can a generated task be dismissed/rescheduled, and does doing so affect streak/reward eligibility?

### Rewards, reports, and communications

27. Confirm point rule: below target = 10, at/above target = 20, and define minimum qualifying activity.
28. Confirm heart allowance: maximum three per calendar month, earned or granted by what rule?
29. Which timezone determines streak day boundaries?
30. Are monthly reports immutable snapshots or recomputed when data is corrected?
31. Should Platform Broadcasts and Academy Notifications appear in one inbox?
32. Which push events are transactional, optional, or mandatory?

### Operations

33. Which migration set is deployed in each environment? Currently **UNVERIFIED**.
34. Which payment, storage, Google, and email providers are configured in staging/production? Currently **UNVERIFIED**.
35. What retention/deletion policy applies to attempts, focus events, device records, content-access logs, and notification delivery?
36. Who approves removal of mobile Admin routes after shared student dependencies are replaced?

---

## 25. Readiness verdict for backend implementation

### Verdict

**CONDITIONALLY READY FOR GATE 2 CONTRACT PLANNING; NOT READY FOR UNBOUNDED BACKEND IMPLEMENTATION.**

### What is ready

- The existing Express/Prisma backend is the correct foundation.
- Core identity/session, roles/permissions, Academy membership, course/content/package, commerce, entitlement, storage signing, admissions, notification, audit, and job concepts are reusable.
- Mobile screens and local stores have been mapped to backend ownership.
- Critical unsafe assumptions and endpoint defects have been identified.
- The obsolete mobile Admin scope and its shared dependencies are known.

### What must happen before implementation begins

1. Product/team answer the blocking decisions in section 24.
2. Gate 2 defines versioned contracts and acceptance tests in small feature batches.
3. The web/backend team confirms canonical schema ownership and migration deployment state.
4. Critical question, catalogue, and local-purchase risks are made first-class acceptance criteria.
5. A non-production test environment and provider configuration are explicitly approved.

### Testing posture for future gates

- Unit: authorization policies, reward/streak/date rules, retry/explanation policies, plan scheduler, watermark claims, idempotency.
- Integration: real local test PostgreSQL only, using the repository's loopback/test-database guard; tenant isolation and entitlement revocation.
- Contract: mobile request/response/error fixtures generated from the real server contract, not handwritten ownership mocks.
- End-to-end: Free/Paid and Academy/platform cases, purchase return, protected note access, answer leakage attempts, wrong-answer retry policy, device-binding conflict, logout/cache isolation, and Admin grant/revoke reflection.
- Security: IDOR, Academy spoofing, role escalation, replay, signed-URL expiry, local-storage tampering, duplicate reward claims, and device reset/recovery abuse.

Required future scenario matrix:

- direct Parallax Flow student;
- Academy A student and Academy B student with reciprocal cross-tenant denial;
- student with no enrolment and student with an active course;
- inactive/archived historical access according to the approved lifecycle rule;
- free course content;
- paid content without entitlement, with valid entitlement, expired entitlement, and refunded/revoked entitlement;
- purchased question bank becoming visible only after verified website purchase and entitlement;
- another Academy's content/question/notification rejected;
- another student's profile, attempt, report, order, and reading state rejected;
- disabled user rejected on refresh and protected access;
- expired access token, valid refresh rotation, refresh replay, logout, and cache clearing;
- offline/timeout/429/503 behavior without false success or fixture fallback;
- signed-download/view-session expiry and revoked access;
- Broadcast/Notification audience isolation and read ownership;
- admission-code expiry, capacity, Academy ownership, and replay;
- QR expiry, opacity, and replay rejection while preserving any separately approved pasted-token fallback;
- same bound device login/logout/relogin and different-device rejection;
- Free versus Paid practice explanations/retries enforced with a modified client;
- idempotent focus checkout, challenge reward, payment webhook, and duplicate-request handling.

No tests were run during this read-only discovery.

---

# Complete feature classification table

The table below is the Gate 1 feature register. “Proposed backend work” means a candidate Gate 2 contract area, not an approved implementation.

| Feature | Mobile screen | Ownership category | Admin action | User action | Source of truth | Ownership scope | Existing API | Authentication | Authorization | Mobile behavior | Offline/cache behavior | Current implementation | Contract gap | Security risk | Proposed backend work |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Entry routing | Welcome | User-influenced | None | Start learning or sign in | Client route plus session state | User | `GET /api/auth/session` | Optional then session | None until auth | Route to signup/login or restore session | Cache only non-sensitive entry state | UI/local | Stable bootstrap state | Stale/mock auth route | Session bootstrap contract |
| Password signup | Signup | User-influenced | Enable registration | Submit name/mobile/email/password | User + credential + verification | User | `POST /api/auth/register` partial | Public/rate-limited | Self | Dedicated signup flow | Never persist password | Mock | Phone and verification absent | Account spam/unverified identity | Staged registration + dual OTP |
| Google signup/sign-in | Signup/Login | User-influenced | Configure client ID | Consent with Google | User/session | User | `POST /api/auth/google` | Google ID token | Self | Provider button and onboarding | Secure credentials only | Mock success | Mobile audience/linking policy | Forged local success | Harden and integrate existing endpoint |
| Dual OTP | Verify OTP | User-influenced | Configure policy/provider | Enter email and mobile codes | None; OTP challenge model missing | User | None | Pending challenge | Challenge owner | Two animated verification stages | No code persistence | Local animation | Send/verify/resend/lockout | Brute force/account takeover | OTP challenge contracts |
| Password recovery | Forgot/reset | User-influenced | Configure policy | Request and reset | PasswordCredential exists; recovery challenge missing | User | None | Public challenge | Challenge owner | Recovery screens | No secret persistence | Local success | Complete recovery contract | Account takeover | Recovery endpoints and audit |
| Session restore/logout | Global/forced logout | User-influenced | Disable/revoke user | Login/logout | UserSession | User/device | Existing auth session/refresh/logout | Bearer + refresh | Session owner | Restore, rotate, clear, redirect | SecureStore; clear scoped cache | Mock memory token | Mobile refresh coordinator | Token theft/cross-user cache | Integrate existing session APIs |
| Permanent device binding | Global/account | System-derived | Approve reset/recovery | First bind; same-device relogin | UserSession exists; permanent installation binding missing | User + installation | None | Auth + installation proof | Bound user/device | Block other devices with recovery message | Secure installation key | Missing | Installation identity/recovery | Lockout/spoofing | Device binding contracts/model |
| Learner profile | Account | User-influenced | View/support as permitted | Edit profile | User; learner preference fields/models missing | User | `GET/PATCH /api/student/me` partial | Student | Self | Display/edit canonical fields | User-partitioned cache | Mock/local | Too few fields | Local falsification/privacy | Expand profile contract |
| Course/exam onboarding | Post-OTP setup | Mixed | Publish courses/categories | Select course, month/year/day, Academy ID | Course exists; learner preference model missing | User + Academy | Catalogue/profile partial | Student | Self + visible catalogue | Mandatory course/date; default day 1 | Draft scoped to pending user | Local Admin course store | No preference schema/API | Invalid course/Academy spoof | Preferences/onboarding contracts |
| Academy admission | Future account/onboarding | Mixed | Issue code/QR | Claim membership | Admissions + membership | Academy/user | Existing claim APIs | Student | Code/QR policy | Join confirmation | Do not cache code | API unused/no current UI | Product placement | Code abuse | Reuse claims; add UI later |
| Active Academy | Global/account | Mixed | Manage memberships | Choose Academy | Membership/preference | Academy/user | Existing memberships/active Academy | Student | Active member only | Switch and reload all scoped data | Strict Academy partition | Not integrated | Cache invalidation | Cross-tenant leak | Integrate existing APIs |
| Home learning dashboard | Home | Mixed | Configure resources/targets | View today | No mobile aggregate; underlying Course/Content/Entitlement/Order only | User + Academy | Student dashboard not equivalent | Student | Self/enrolled | Render focus, plan, progress | Short scoped cache | Static/local | Mobile aggregate missing | False progress | Mobile dashboard aggregate |
| Focus check-in/out | Home/Tracker | User-influenced | Set target policy | Start/stop session | None; focus/activity models missing | User | None | Student | Self; server clock | Grand animation; server duration | Queue only idempotent heartbeat/stop | Local demo store | Lifecycle/heartbeat/recovery | Time/reward tampering | Focus-session contracts |
| Daily target | Home | Mixed | Set defaults | Choose capacity | None; learner target/activity models missing | User | None | Student | Self | Actual vs target | Cache preference/summary | Fixed/local | Target source missing | Reward manipulation | Target and daily summary |
| Exam countdown | Home/Tracker | System-derived | Course/exam rules | Choose date | Learner exam date | User | None | Student | Self | Animate 365 toward actual value | Cache date; compute display locally | Local | Canonical date/default rule | Date tampering affects expiry | Profile date contract/server result |
| Syllabus completion | Home/Tracker | System-derived | Publish syllabus | Complete materials | Content progress aggregate | User/course | None | Student | Enrolled/entitled policy | Percentage and progress | Scoped summary cache | Fixed/local | Progress model missing | Inflated completion | Reading/progress aggregation |
| To-do list manual | Home | User-influenced | None | CRUD tasks | None; user-task model missing | User | None | Student | Self | Add/check/delete | Offline queue with IDs/conflicts | AsyncStorage | Sync/versioning | Cross-user leak/tampering | User-task CRUD |
| Adaptive study plan | Home | Mixed | Set topic hours/prerequisites | Capacity, complete/dismiss | None; plan/estimate/prerequisite models missing | User/course | None | Student | Self + eligible curriculum | Explain why/duration/priority | Cache dated plan; server reconciles | Not implemented | Planning inputs/policy | Misleading plan | Deterministic scheduler contracts |
| Streak calendar | Tracker | System-derived | Set policy | Perform qualifying work | None; focus activity/streak models missing | User/timezone | None | Student | Self | Fire days/missed days | Cache summaries only | Local/seeded | Day boundary/recompute | Local streak edits | Daily streak aggregate |
| Points and hearts | Header/checkout popup | System-derived | Set reward policy | Qualify/claim/recover | None; reward wallet/ledger models missing | User | None | Student | Self | Show balance/reward animation | Never authoritative offline | AsyncStorage | Idempotent award/use | Currency duplication | Ledger/claim/recovery APIs |
| Notes/package search | Notes | Mixed | Publish/tag content | Search/filter/tab | Catalogue/content/read state | Academy/course/user | Existing APIs partial | Student/public as appropriate | Publication/enrolment/access | Search, list/grid, Notes/Packages | Scoped page cache | Demo catalogue | Unified query/status filters | Fixture ownership | Library/search projection |
| Notes hierarchy | Subject/unit/topic | Admin-influenced | Build hierarchy | Navigate | Course/Subject/ContentItem | Academy/course | Existing student course/content | Student | Enrolled course | Subject -> unit -> topic -> notes | Scoped hierarchy cache | Demo catalogue | Mapping/pagination details | IDOR if client-only | Reuse content APIs with stable DTO |
| Recently opened | Notes | User-influenced | None | Open note | None; content reading-state model missing | User/content | None | Student | Access plus self | Top 3 horizontal cards | Scoped cache | Local status | Open event/query | Activity leak | Reading-state API |
| Favourite | Notes/note menu | User-influenced | None | Toggle favourite, even if locked | None; content reading metadata missing | User/content | None | Student | Self; no access grant | Action chip/menu | Optimistic scoped cache | Local | Mutation/query | Mistaken unlock | Reading-state mutation |
| Mark completed | Notes/note menu | User-influenced | None | Mark even unpurchased premium | None; content reading metadata missing | User/content | None | Student | Self; no access grant | Completion state | Optimistic scoped cache | Local | Separate metadata from access | Client unlock confusion | Reading-state mutation/policy |
| Revise note | Notes/note menu | User-influenced | None | Increment/revise | None; revision event/plan models missing | User/content | None | Student | Self | Revision count/due state | Scoped cache | Local | Revision semantics | Inflated analytics | Revision event/plan |
| Content entitlement | Notes/Library | Mixed | Price/grant/revoke/expire | Purchase/use | Entitlement | User/resource/Academy | Content access API partial | Student | Effective entitlement | Lock/open/expired states | Short cache; invalidate often | Admin local grant/fake ownership | Unified effective-access DTO | Local privilege grant | Reuse Entitlement; remove local grants |
| Protected PDF reader | Lesson | Mixed | Upload/publish PDF | Read/pinch/scroll | ContentItem exists; protected view-session model missing | User/content | Signed access partial | Student | Enrolled + entitled + unexpired | Continuous reader; no print/download controls | No raw protected cache by default | Bundled sample/client watermark | Watermark/view/audit | Content exfiltration | Protected view-session service |
| Paid validity/expiry | Library | Mixed | Set validity | Choose exam date/use | Entitlement expiry + policy | User/resource | Schema partial | Student | Effective entitlement | Expiry badge/lock | Cache until earliest expiry then refresh | Client hardcoded calculation | Authoring/derivation rule | Clock/date manipulation | Server effective access/expiry |
| Orders and receipts | Library/Receipt | System-derived | Refund/cancel | View own purchase | Order/Payment | User | Existing student orders | Student | Order owner | Lists/detail/share server receipt | Cache immutable paid receipt; refresh pending | Static | DTO/deep link/status | Forged receipt | Reuse order APIs |
| Mobile purchase | Purchase | Mixed | Publish price/coupon | Buy | Checkout/order/payment/entitlement | User/resource | Existing checkout partial | Student/authenticated | Eligible product/user | Web deep-link or approved billing | Never local ownership | Fake local success | Product/channel decision | Free access bypass | Remove local grant; approved commerce flow |
| Practice source selection | Practice | Mixed | Publish Archive/QB | Choose Archive or owned bank | Question/Entitlement exist; bank/source models missing | Course/user | None adequate | Student | Archive free; QB entitled | Clean source selector | Cache metadata only | Local plan check | QB/source model | Paid-bank bypass | QB/source contracts |
| Practice filters | Practice filter sheet | Mixed | Tag questions | Subject/chapter/year/collection/format | Question/taxonomy exist; source/year fields missing | Course/QB | Questions GET unsafe | Student | Enrolment/QB | Archive shows year; QB hides year; RTP/MTP | Scoped filter metadata | Demo data | Source/year contract | Query enumeration | Extend question metadata/query |
| Custom timer | Practice | User-influenced | Optional limits | Set countdown | None; practice-session model missing | User/session | None | Student | Session owner | Apple-style timer | Local transient okay; server timestamps authoritative | Local | Start/deadline contract | Clock tampering | Session timer fields |
| Solve and Earn | Practice filter/session | Mixed | Configure challenge | Opt in and complete | None; challenge/result/reward models missing | User/chapter | None | Student | Eligibility/one award | Show questions/time/points | No offline award | Local calculation | Challenge verification | Reward farming | Challenge and idempotent reward APIs |
| Practice session/navigator | Practice runner | User-influenced | Supply eligible questions | Answer/review/navigate | None; practice session/attempt models missing | User/QB | None | Student | Session owner/entitled | n questions/progress/status navigator | Draft queue only if designed | Local | Full session contract | Answer/state tampering | Session lifecycle APIs |
| Free answer policy | Practice runner | System-derived | Configure resource policy | Answer | Question exists; attempt/evaluation model missing | User/question | None | Student Free | Attempt owner + Free policy | Free: wrong locked; explanation after correct only | Server response cached per attempt | Local | Submission/evaluation | Answer key reverse engineering | Server answer endpoint/policy |
| Paid answer policy | Practice runner | System-derived | Sell/grant bank | Answer/retry | Question/Entitlement exist; attempt/bank model missing | User/question bank | None | Student entitled | Attempt owner + current bank entitlement | Retry wrong by option; explanation every answer | Scoped attempt cache | Local | Retry/explanation contract | Fake Paid flag | Server entitlement policy |
| Practice tracker | Practice tracker | System-derived | Taxonomy | Solve questions | None; attempt aggregate source missing | User/chapter | None | Student | Self | Solved/correct/accuracy/closed | Scoped aggregate cache | Seed/local | Aggregation endpoint | Inflated analytics | Chapter/topic aggregates |
| Concept weak areas | Practice/Tracker | System-derived | Map question to concept | Repeated wrong attempts | None; attempt/weak-signal models missing | User/concept | None | Paid student per current product | Paid entitlement | Rank concepts and feed plan | Cache explainable aggregate | Local/static | Threshold/versioning | Misclassification | Deterministic weak-area service |
| Revision tracker | Revision tracker | Mixed | Publish chapters | Revise/complete notes | None; revision plan/event models missing | User/chapter | None | Student | Self | Staged chapter timeline/due state | Scoped cache | Local | Plan/instance model | User edits analytics | Revision contracts |
| Monthly reports | Monthly reports | System-derived | Define policy | View month | None; monthly snapshot/aggregate model missing | User/month | None | Paid student | Entitlement at view policy | Month list/report/locked Free state | Cache immutable snapshot | Static | Snapshot generation | Fake Paid/report data | Monthly report jobs/APIs |
| Notifications inbox | Future/header | Mixed | Send notification | Read item | Notification recipient | Academy/user | Existing student notification APIs | Student | Recipient only | Feed/badge/read | Scoped cache; offline mark queue with idempotency | Not integrated | Push/aggregation | Cross-tenant notification leak | Reuse inbox + add push |
| Platform broadcasts | Future/header/home | Admin-influenced | Publish/target | View/ack | Broadcast/user event | Platform/Academy/user | No student feed | Student | Target eligibility | Campaign card/inbox | TTL-scoped cache | Not integrated | Delivery endpoint | Unauthorized targeting exposure | Mobile broadcast feed/ack |
| Account plan/access | Account | System-derived | Grant/revoke/refund | View | Entitlement/order | User | Existing partial | Student | Self | Free/Paid and expiry summary | Short scoped cache | Mock role plan | Aggregate contract | Client Paid spoof | Access-summary endpoint/projection |
| Mobile Admin workspace | Admin routes | Admin-influenced | All web Admin operations | None in target mobile | Web Admin/backend | Platform/Academy | Existing Admin APIs | Admin | Super Admin/Academy permission | Must be absent from production mobile | No Admin cache | Mock/local UI | Removal dependency | Privileged surface in student app | Replace shared deps then remove |

---

## Repository evidence index

Primary evidence reviewed:

- `mobile/src/app/**`
- `mobile/src/components/**`
- `mobile/src/lib/**`
- `mobile/backendplan.md`
- `mobile/backendtodo.md`
- `Parallax-Flow-web/server/prisma/schema.prisma`
- `Parallax-Flow-web/server/prisma/migrations/**`
- `Parallax-Flow-web/server/src/app/create-app.ts`
- `Parallax-Flow-web/server/src/routes/**`
- `Parallax-Flow-web/server/src/services/**`
- `Parallax-Flow-web/server/src/auth/**`
- `Parallax-Flow-web/server/src/middleware/**`
- `Parallax-Flow-web/server/src/storage/**`
- `Parallax-Flow-web/server/src/jobs/**`
- `Parallax-Flow-web/server/src/tests/**`
- `Parallax-Flow-web/src/lib/api/**` and reviewed storefront/Admin repositories
- checked-in README and architecture/current-state/testing/migration reports, treated as secondary when stale

**End of Gate 1 report. No implementation approval is implied.**

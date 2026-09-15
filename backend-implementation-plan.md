# PARALLAX FLOW MOBILE BACKEND IMPLEMENTATION PLAN

**Gate:** Gate 2 — contract and implementation planning only  
**Prepared:** 26 August 2026  
**Depends on:** `backend-discovery-report.md`  
**Target client:** Parallax Flow React Native student application  
**Shared system:** `Parallax-Flow-web/server` and its PostgreSQL database  
**Shared Git baseline:** `Parallax-Flow-web/main` at `83e5635` (synchronized 26 August 2026)  
**Status:** Proposed; no implementation is authorized by this document

> Gate 2 does not change backend code, Admin code, Prisma, migrations, providers, data, or mobile UI. Gate 3 begins only after this plan and its unresolved product decisions are approved.

---

## 1. Scope and implementation principles

### 1.1 Objective

Connect the completed mobile student UI to the existing shared backend without duplicating Admin-owned data, weakening tenant isolation, simulating purchases, or changing the web/Admin team's existing behavior unexpectedly.

### 1.2 Non-goals

- No mobile Admin dashboard or Admin CRUD.
- No second/mobile-only database.
- No copying Courses, Content, Questions, Orders, Payments, or Entitlements.
- No cosmetic mobile redesign during backend integration.
- No production fixture fallback.
- No native mobile purchase implementation unless separately approved.
- No claim that screenshots/recordings can be made impossible on every device.
- No AI dependency for the first study-plan or weak-area implementation.

### 1.3 Authoritative ownership

- Admin website authors platform/Academy catalogue, content, packages, questions, pricing, grants, and communications.
- Website commerce creates authoritative orders/payments/entitlements.
- Mobile writes only student-owned actions such as profile preferences, reading state, attempts, focus activity, tasks, and notification read state.
- Backend derives access, progress, rewards, streaks, weak areas, plans, and reports.
- PostgreSQL remains the single source of truth.

---

## 2. Shared-code change control and Admin-team protection

The user has required approval before changing code delivered by the Admin/web team. Therefore all files under `Parallax-Flow-web/` remain read-only until a Gate 3 change proposal is approved.

### 2.1 Change classes

| Class | Example | Expected compatibility | Approval before edit |
|---|---|---|---|
| M — mobile-only integration | API client, SecureStore, React Query hooks inside `mobile/` | Cannot change web/Admin | Gate 3 feature approval |
| A — additive shared backend | New student route/service/model | Existing URLs remain unchanged | **Required** |
| B — shared behavior correction | Secure catalogue filtering or question response change | Could affect storefront/Admin adapters | **Required with Admin-team impact note** |
| C — schema/migration | New learning-activity tables/fields/indexes | Shared DB deployment impact | **Required with migration/rollback review** |
| D — Admin/web client edit | Mounting Academy Admin modules, changing checkout URL, removing fixtures | Directly changes another team's application | **Separate explicit approval required** |
| E — provider/runtime | Storage, payment, email, Google, push configuration | Environment/operations impact | **Separate explicit approval required** |

### 2.2 Required proposal before every shared edit

Before modifying `Parallax-Flow-web`, Gate 3 must present:

1. feature and reason;
2. exact files expected to change;
3. existing endpoints affected;
4. new endpoints added;
5. database tables read/written;
6. migration and rollback, if any;
7. Admin/storefront behavior impact;
8. authorization and tenant rules;
9. tests to add/run;
10. deployment order and rollback trigger.

No shared edit proceeds until the user approves that proposal.

### 2.3 Compatibility strategy

- Preserve existing route paths and response shapes wherever safe.
- Add new routes beneath the existing `/api/student` boundary rather than creating a competing mobile backend.
- Do not globally version or wrap all existing API responses during mobile work.
- New contracts will include an explicit DTO version field only where long-lived snapshots/policies require it.
- If an existing endpoint is unsafe, create a secure replacement first, migrate known clients, then remove/deprecate the old endpoint only with web/Admin-team approval.
- Database changes are additive by default: new nullable columns/tables/indexes, backfill, dual-read if needed, then constraint tightening in a later approved release.
- Never change an existing enum or rename/drop a field in the same release as mobile integration.

### 2.4 Known shared changes requiring separate approval

These are not silently included in implementation batches:

- changing public catalogue lifecycle/Academy filtering;
- replacing/deprecating unsafe `GET /api/student/questions` behavior;
- mounting Academy analytics, notification-management, or settings routers;
- correcting the web checkout URL mismatch;
- removing web fixture fallbacks;
- changing shared course/content model ownership;
- modifying Admin forms to author study hours, question-bank metadata, validity, or Solve & Earn policy.

### 2.5 Latest Admin-team synchronization

The Admin team's commit `83e5635` was fetched and fast-forwarded with a clean worktree and no divergence. Its backend changes are compatible with this plan:

- `contentService.apiContent` received a type-safe generic without changing its JSON fields;
- proxy upload integration coverage now verifies size, checksum, tenant ownership, upload and finalize;
- S3 provider tests now cover signed upload integrity headers, retryable 503 responses and non-retryable 403 responses;
- Admin/Academy frontend upload steps retry only transient binary/finalize failures.

No Prisma, migration, auth, student API, entitlement, or protected-reader contract changed. The upload retry behavior supports the planned protected-content foundation but does not itself implement mobile protected viewing. Local execution of the new upstream tests remains pending because this nested repository currently has no installed root/server dependencies; no package installation was performed automatically.

---

## 3. Proposed target architecture

```text
Admin website / Web storefront
            |
            | existing + approved additive contracts
            v
Shared Express backend
  - auth/session/device policy
  - Academy tenant resolver
  - student catalogue/access
  - learning activity/practice/planning
  - commerce/entitlement reflection
  - protected content and jobs
            |
            v
Shared PostgreSQL + private object storage
            |
            v
React Native student app
  - SecureStore credentials
  - centralized API client
  - user + Academy partitioned query cache
  - existing UI with real loading/error/offline states
```

New learner features belong in domain-focused server modules, not one large `mobileService`. Suggested boundaries:

- `learnerProfile`;
- `learningActivity`;
- `learnerContentState`;
- `practice`;
- `studyPlanning`;
- `learningReports`;
- `mobileInstallation`;
- `protectedContent`.

---

## 4. Decisions and conditional defaults

The following defaults make the plan concrete but remain subject to approval before Gate 3.

| Decision | Proposed default | Why |
|---|---|---|
| Commerce in mobile | Read-only; open approved web checkout | Matches stated product architecture and avoids fake/native payment work |
| Course selection | Learner preference, not automatic enrolment | Prevents a client selection from granting Academy/course access |
| Exam date without day | First day of selected month/year | Explicit product requirement |
| Study-plan engine | Deterministic rules, no AI initially | Testable, explainable, lower cost/risk |
| Weak concept | Configurable repeated-wrong threshold over a rolling attempt window | Avoid hard-coded UI logic |
| Paid retry | Append a new attempt; preserve history | Required for analytics/audit |
| Free explanation | Reveal only after a correct answer | Current stated requirement; requires final confirmation |
| Paid explanation | Reveal after every submitted attempt | Current stated requirement |
| PDF offline | Disabled initially | Strongest safe default for paid content |
| Notifications | One mobile inbox projection for Notification + Broadcast | Best mobile UX without merging source tables |
| Timezone | Stored IANA learner timezone with a product fallback | Needed for streak/month/report boundaries |
| Device recovery | Support/Admin-approved reset after identity verification | Permanent binding without recovery creates permanent lockout |
| Historical archived access | Hidden from discovery; readable only if policy explicitly preserves entitlement | Fail-closed lifecycle behavior |

Any rejected default changes affected DTOs, tests, and migrations before implementation.

---

## 5. API-wide contract rules

### 5.1 Base and route policy

- Reuse existing `/api/auth`, `/api/student`, `/api/catalog`, and `/api/checkout` mounts.
- New authenticated learner operations use `/api/student/...`.
- Do not expose `/api/admin` or `/api/academy` credentials/contracts to mobile.
- IDs are server-generated UUIDs; clients may provide UUID idempotency keys for supported mutations.
- Times are UTC ISO-8601; date-only exam values use `YYYY-MM-DD`; learner timezone is an IANA zone.
- Money remains integer minor units with currency, never floating point.

### 5.2 Response compatibility

- Existing endpoints retain their observed response format.
- New list responses use:

```ts
type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  nextCursor?: string;
};
```

- New mutation responses return the authoritative updated resource plus a `version` or `updatedAt` where concurrent changes matter.
- Server policy DTOs expose capabilities (`canOpen`, `canRetry`, `canViewExplanation`) rather than requiring mobile to infer them from plan names.

### 5.3 Error contract

Preserve the existing structured API error mechanism. Gate 3 must verify its exact wire envelope before mobile parsing. New stable error codes include:

| HTTP | Codes |
|---|---|
| 400/422 | `VALIDATION_FAILED`, `INVALID_EXAM_DATE`, `INVALID_STATE_TRANSITION` |
| 401 | `AUTH_REQUIRED`, `ACCESS_TOKEN_EXPIRED`, `SESSION_REVOKED`, `REFRESH_REPLAYED` |
| 403 | `ACCOUNT_DISABLED`, `DEVICE_NOT_BOUND`, `DEVICE_MISMATCH`, `ACADEMY_ACCESS_DENIED`, `COURSE_NOT_ENROLLED`, `ENTITLEMENT_REQUIRED`, `ENTITLEMENT_EXPIRED`, `RETRY_NOT_ALLOWED`, `EXPLANATION_NOT_AVAILABLE` |
| 404 | `RESOURCE_NOT_FOUND`, `SESSION_NOT_FOUND`, `ATTEMPT_NOT_FOUND` |
| 409 | `EMAIL_IN_USE`, `PHONE_IN_USE`, `DEVICE_ALREADY_BOUND`, `SESSION_ALREADY_CLOSED`, `REWARD_ALREADY_CLAIMED`, `STALE_VERSION` |
| 410 | `OTP_EXPIRED`, `VIEW_SESSION_EXPIRED`, `ADMISSION_EXPIRED` |
| 429 | `OTP_RATE_LIMITED`, `AUTH_RATE_LIMITED`, `CHALLENGE_LIMIT_REACHED` |
| 503 | `STORAGE_UNAVAILABLE`, `PAYMENT_UNAVAILABLE`, `DELIVERY_UNAVAILABLE` |

Mobile must never translate a network failure into success or fixture data.

### 5.4 Authentication and request context

- Access token in `Authorization: Bearer`.
- Refresh token sent only to refresh/logout contracts and stored in OS secure storage.
- Installation proof header is server-issued/rotated, not a raw hardware ID.
- Academy context is selected through the existing active-Academy preference; client `academyId` may select among memberships but never authorizes access.
- Mutations that can be replayed use `Idempotency-Key`.

### 5.5 Cache rules

Query keys begin with:

```text
[environment, userId, activeAcademyId, feature, parameters]
```

Secure logout/account switch clears credentials and every user-scoped memory/disk entry. Entitlement, Academy, plan, and session changes invalidate dependent queries. Signed URLs and protected document bytes are not persisted.

---

## 6. Mobile bootstrap and centralized API client

### Existing backend reuse

- `GET /health` for diagnostics only, not normal app bootstrap.
- `GET /api/auth/session` after secure credentials are restored.
- `GET /api/student/memberships` and `GET /api/student/active-academy` after authentication.

### Proposed client sequence

1. Load non-secret runtime API origin from build configuration.
2. Load refresh/access state from SecureStore.
3. Call session restore; perform one single-flight refresh if access expired.
4. Register/verify installation binding.
5. Load active Academy and learner bootstrap.
6. Mount student navigation only after identity/role/device checks.

### New aggregate endpoint

`GET /api/student/bootstrap`

Response DTO:

```ts
type StudentBootstrap = {
  user: { id: string; fullName: string; email: string; phone: string | null };
  role: "student";
  session: { id: string; expiresAt: string; platform: "ANDROID" | "IOS" };
  installation: { id: string; status: "BOUND" | "RECOVERY_REQUIRED" };
  activeAcademy: { id: string; name: string } | null;
  memberships: Array<{ academyId: string; academyName: string; status: string }>;
  onboarding: { completed: boolean; requiredStep: string | null };
  accessSummary: { planLabel: "FREE" | "PAID"; activeEntitlementCount: number };
  serverTime: string;
};
```

Authorization: authenticated active Student, non-disabled account, valid current session, valid bound installation. Reads existing User/UserSession/AcademyMembership/UserAcademyPreference/Entitlement plus proposed learner profile/installation state. No Admin changes required.

### Tests

- cold-start success and expired access refresh;
- concurrent API calls cause only one refresh;
- disabled/revoked session fails closed;
- user/Academy cache isolation;
- no token or refresh value in logs;
- non-student cannot bootstrap student UI.

---

## 7. Authentication, OTP, recovery, sessions, and device binding

### 7.1 Existing endpoints to reuse

- `POST /api/auth/login`
- `POST /api/auth/register` — requires an approved staged-registration extension or replacement
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/session`

### 7.2 Proposed staged email/password signup

To avoid creating an active unverified account, use a registration challenge:

1. `POST /api/auth/registrations`

```ts
type CreateRegistrationRequest = {
  fullName: string;
  phone: string;       // normalized to E.164 server-side
  email: string;       // normalized server-side
  password: string;
};
type CreateRegistrationResponse = {
  registrationId: string;
  email: { masked: string; status: "PENDING"; resendAfter: string };
  phone: { masked: string; status: "PENDING"; resendAfter: string };
  expiresAt: string;
};
```

2. `POST /api/auth/registrations/:registrationId/email/send`
3. `POST /api/auth/registrations/:registrationId/email/verify` body `{ code: string }`
4. `POST /api/auth/registrations/:registrationId/phone/send`
5. `POST /api/auth/registrations/:registrationId/phone/verify` body `{ code: string }`
6. `POST /api/auth/registrations/:registrationId/complete`

Completion atomically creates User, PasswordCredential, verified contact state, UserSession, and device binding. Password is hashed when the challenge is created or held only in an encrypted/hashed pending credential design; plaintext is never stored or logged.

Rate limits are keyed by IP, normalized destination, registration ID, and installation. OTP hashes—not codes—are stored. Verification attempts, resend count, expiry, consumption, and audit events are server-owned.

### 7.3 Google flow

Reuse `POST /api/auth/google`, then require any missing mandatory onboarding/contact verification through a returned `nextStep`. Google email is prefilled and provider-verified only when Google's token states it is verified. No password is required for Google signup unless the user later chooses to add password authentication.

Proposed response addition must be backward-compatible:

```ts
type AuthNextStep = "VERIFY_PHONE" | "COMPLETE_PROFILE" | "DEVICE_RECOVERY" | null;
```

Changing the existing response requires shared-backend approval and contract tests for the web client. An alternative is a new mobile-specific completion endpoint while leaving the Google response unchanged.

### 7.4 Password recovery

- `POST /api/auth/password-recovery` body `{ identifier: string }` always returns a neutral accepted response.
- `POST /api/auth/password-recovery/:challengeId/verify` body `{ code: string }` returns a short-lived reset grant.
- `POST /api/auth/password-recovery/:challengeId/reset` body `{ resetGrant: string; newPassword: string }` rotates credentials and revokes other sessions according to approved policy.

### 7.5 Permanent single-device binding

Proposed contracts:

- `POST /api/auth/installations/register` with platform, app version, public key, and attestation when available;
- `GET /api/auth/installations/current`;
- `POST /api/auth/device-recovery/request`;
- `POST /api/auth/device-recovery/verify`;
- approved support/Admin reset remains a web operation, not mobile Admin UI.

The backend binds the account to an app installation record after successful authentication. Login/logout on the same installation is allowed indefinitely. A different installation receives `DEVICE_MISMATCH` even when no session is active. Logout revokes the session but does not remove binding.

Do not bind using IMEI, Android ID, IDFV, or push token alone. Use a server record plus an OS-keystore-protected installation key pair. Reinstall behavior and support recovery require product approval.

### 7.6 Persistence impact

Proposed additive logical models:

- `AuthChallenge` or purpose-specific registration/recovery challenge;
- `VerifiedContact` or verified-at fields with change history;
- `MobileInstallation`;
- `UserDeviceBinding`;
- `DeviceRecoveryRequest`.

Existing User, PasswordCredential, UserSession, SecurityEvent, and AuditEvent are reused. Exact schema and migration are a separate approved shared change.

### 7.7 Tests

- duplicate email/phone without account enumeration;
- OTP expiry, wrong attempts, resend, replay, and concurrent completion;
- Google token audience/issuer/email verification;
- same-device login/logout/relogin;
- different-device rejection with zero active sessions;
- recovery only after identity verification;
- session refresh rotation/replay/revocation;
- disabled/deleted user rejection;
- mobile platform recorded accurately rather than hard-coded `WEB`.

---

## 8. Learner profile, onboarding, exam date, and preferences

### Existing reuse

- `GET /api/student/me`
- `PATCH /api/student/me`
- public/authorized course APIs after catalogue policy approval
- existing membership and active-Academy APIs

### Proposed contracts

`GET /api/student/preferences`

```ts
type LearnerPreferences = {
  selectedCourseId: string | null;
  selectedCategoryId: string | null;
  examDate: string | null;
  examDatePrecision: "DAY" | "MONTH" | null;
  academyAdmissionReference: string | null;
  dailyTargetMinutes: number;
  timezone: string;
  locale: string;
  notificationPreferences: {
    studyReminders: boolean;
    announcements: boolean;
    purchases: boolean;
  };
  onboardingCompletedAt: string | null;
  version: number;
};
```

`PUT /api/student/preferences`

```ts
type UpdateLearnerPreferencesRequest = {
  selectedCourseId: string;
  examMonth: number;
  examYear: number;
  examDay?: number;
  academyAdmissionReference?: string;
  dailyTargetMinutes?: number;
  timezone: string;
  expectedVersion?: number;
};
```

Server validates the selected course is visible/selectable but does not create enrolment or entitlement merely from selection. Missing day normalizes to day 1 and records `examDatePrecision = MONTH`. Changing exam date emits an event for validity/planning/report recalculation under approved rules.

`PATCH /api/student/me` remains for permitted identity fields. Email/phone changes require re-verification and should use dedicated contact-change challenges rather than a direct patch.

### Persistence impact

Add a learner-preference record keyed one-to-one with User, referencing Course and optionally Academy. Do not add course name/category text copies. Academy ID, where applicable, must be validated from membership/admission rather than trusted input.

### Tests

- invalid/archived/foreign-Academy course rejected;
- month/year with no day stores first day and MONTH precision;
- leap-year and past-date policy;
- course selection does not grant access;
- concurrent preference update returns `STALE_VERSION`;
- timezone validation and date-boundary behavior.

---

## 9. Academy context and admissions

### Existing endpoints to reuse

- `GET /api/student/memberships`
- `GET /api/student/active-academy`
- `PUT /api/student/active-academy`
- `POST /api/student/admissions/qr/claim`
- `POST /api/student/admissions/codes/claim`

### Plan

- Do not add another mobile Academy-membership table.
- Use existing server tenant resolution and membership state.
- Academy switch invalidates all Academy/course/content/question/notification/plan caches.
- Admission QR remains opaque; mobile passes the token unchanged.
- Admission code is normalized and resolved server-side.
- Preserve a pasted-token/code fallback if it is part of the approved UI; do not claim camera scanning until a scanner exists.
- Successful claim refreshes memberships and active Academy but does not infer course enrolment unless the admission contract explicitly created it.

### Tests

- Academy A user cannot select Academy B;
- expired/consumed/capacity-exhausted admission rejected;
- concurrent/replayed claim is idempotent or rejected predictably;
- QR payload cannot authorize embedded client Academy ID;
- cache switches cleanly between valid memberships.

---

## 10. Courses, catalogue, hierarchy, and discovery

### Existing endpoints to reuse after approval

- `GET /api/catalog`
- `GET /api/catalog/courses/:courseId`
- `GET /api/catalog/packages/:packageId`
- `GET /api/catalog/collections/:key`
- `GET /api/student/courses`
- `GET /api/student/courses/:courseId`
- `GET /api/student/courses/:courseId/content`

### Required shared corrections

The public catalogue must consistently exclude deleted, inactive/archived, and unauthorized Academy-scoped resources. Because that behavior can alter the web storefront, it is Class B and requires approval before editing.

The plan does not rely on the broken/unpopulated public `user-courses` personalization contract. Authenticated student course access comes from `/api/student/courses`; public discovery remains public metadata.

### Proposed mobile-facing query

`GET /api/student/library/catalog?type=NOTE|PACKAGE|QUESTION_BANK&courseId=&subjectId=&search=&page=&limit=`

```ts
type StudentCatalogItem = {
  id: string;
  type: "NOTE" | "PACKAGE" | "QUESTION_BANK";
  title: string;
  subtitle: string | null;
  course: { id: string; name: string };
  subject: { id: string; name: string } | null;
  access: {
    state: "FREE" | "OWNED" | "LOCKED" | "EXPIRED";
    expiresAt: string | null;
    reason: string | null;
  };
  price: { amountMinor: number; currency: string } | null;
  publicationUpdatedAt: string;
};
```

This is an authorized projection built from existing Course/Subject/ContentItem/Package/Entitlement/Enrollment records, not a duplicate table. It powers Notes and Library cards without exposing storage paths.

### Content hierarchy DTO

Existing hierarchical content remains canonical. Normalize a stable mobile DTO:

```ts
type ContentNode = {
  id: string;
  parentId: string | null;
  kind: "FOLDER" | "FILE";
  title: string;
  mimeType: string | null;
  childCount: number;
  access: { state: "FREE" | "OWNED" | "LOCKED" | "EXPIRED" };
};
```

No signed URL/storage path appears in list responses.

### Tests

- platform and Academy catalogue visibility;
- inactive/archived/deleted exclusion;
- unenrolled and entitled combinations;
- stable pagination and search normalization;
- another Academy's IDs return 404/403 without information leakage;
- API failure produces no fixture fallback.

---

## 11. Notes library, reading state, packages, and locked-material actions

### 11.1 Library query

`GET /api/student/notes?courseId=&subjectId=&status=ALL|IN_PROGRESS|COMPLETED&favourite=&search=&page=&limit=`

Response uses the catalog projection plus:

```ts
type NoteReadingState = {
  lastOpenedAt: string | null;
  progressPercent: number;
  completedAt: string | null;
  favourite: boolean;
  revisionCount: number;
  lastRevisedAt: string | null;
  nextRevisionAt: string | null;
  version: number;
};
```

Convenience read projections:

- `GET /api/student/notes/recent?limit=3`
- `GET /api/student/notes/favourites?limit=&cursor=`
- packages use the authorized catalogue query rather than a duplicate mock collection.

### 11.2 Metadata actions

- `PUT /api/student/notes/:contentId/favourite` body `{ favourite, expectedVersion? }`
- `PUT /api/student/notes/:contentId/completion` body `{ completed, expectedVersion? }`
- `POST /api/student/notes/:contentId/revisions` body `{ source: "MANUAL" | "READER" }`
- opening a protected reader records recent activity server-side after access succeeds.

Product rule: favourite/completed/revision metadata may be recorded for visible locked paid material without granting read access. The backend keeps reading metadata separate from Entitlement. If a student later purchases the material, the metadata remains unless product rejects this default.

### 11.3 Persistence

Add one user/content reading-state record with a unique `(userId, contentItemId)` key, timestamps, progress, favourite, completion, revision summary, and optimistic version. Append revision events if historical revision analytics are required; do not rely only on a mutable counter.

### 11.4 Authorization

- Student must be allowed to discover the content in their platform/Academy/course context.
- Metadata actions on locked items do not pass the stronger `canOpen` check.
- Reader access always re-evaluates publication, enrolment, entitlement, expiry, and revocation.
- Another user's state is never addressable by request parameter.

### 11.5 Tests

- locked-note favourite/completion does not unlock PDF;
- metadata survives later entitlement;
- another Academy's undiscoverable content cannot receive metadata;
- recent top 3 sorted by authoritative opened timestamp;
- optimistic concurrency and idempotent toggle/revision behavior;
- refund/expiry locks reader but preserves approved metadata.

---

## 12. Protected PDF viewer and storage access

### Existing reuse

- `ContentItem.storagePath` and publication/access metadata.
- existing entitlement checks in student content access service.
- existing private S3-compatible adapter and short signed URL support.

### Proposed contracts

`POST /api/student/content/:contentId/view-sessions`

```ts
type CreateViewSessionRequest = {
  installationId: string;
  clientCapabilities: { continuousScroll: boolean; pinchZoom: boolean };
};
type ProtectedViewSession = {
  id: string;
  contentId: string;
  delivery: {
    mode: "WATERMARKED_PDF" | "PAGE_STREAM";
    url: string;
    expiresAt: string;
    headers?: Record<string, string>;
  };
  watermark: { label: string; appliedByServer: true };
  policy: { download: false; print: false; offline: false };
};
```

`POST /api/student/content/view-sessions/:sessionId/heartbeat` optionally records active reading and last page/progress without extending access beyond entitlement.

`DELETE /api/student/content/view-sessions/:sessionId` closes the view session.

### Delivery design

Preferred first implementation: generate/cache a short-lived personalized derivative with repeated normalized user-email watermark, then issue a short-lived delivery URL. Cache key includes source object version and a non-reversible user marker; derivative storage is private and expires by lifecycle job. If transformation cost/latency is unacceptable, page-streaming is the alternative but requires more server complexity.

The mobile reader retains continuous scrolling and pinch zoom and omits download/print/page-next/percentage controls. Android secure-window/iOS capture detection are client best-effort additions and do not replace backend authorization.

### Security requirements

- no raw object path/bucket/provider metadata;
- access rechecked on every session creation;
- session bound to user, content, installation, entitlement and short expiry;
- URLs not persisted in AsyncStorage or logs;
- `Cache-Control: no-store, private` where delivery allows;
- watermark and access issuance audited;
- closed/expired/refunded/disabled state rejects new sessions;
- rate limit derivative generation.

### Persistence/jobs

Add protected view-session/access audit and optional derivative metadata. Add background cleanup for expired derivatives/sessions. Do not store rendered PDF bytes in PostgreSQL.

### Tests

- watermark contains the authenticated user's email, never a client email;
- user A cannot use user B's session;
- URL/session expiry and entitlement revocation;
- archived/deleted content denial;
- storage disabled returns `STORAGE_UNAVAILABLE` with no fallback sample;
- raw PDF key never appears in JSON/logs;
- transformation dedupe and cleanup.

---

## 13. Entitlements, expiry, orders, receipts, and website purchase reflection

### Existing endpoints/models to reuse

- `GET /api/student/orders`
- `GET /api/student/orders/:orderId`
- `GET /api/student/content/:contentId/access` as an internal/reference policy, replaced or extended for protected viewing
- `POST /api/checkout` on the website path after contract mismatch is separately resolved
- Order, OrderItem, Payment, PaymentRefund, Coupon, CouponRedemption, Entitlement

### Proposed read-only mobile contracts

`GET /api/student/access-summary`

```ts
type AccessSummary = {
  planLabel: "FREE" | "PAID";
  ownedCount: number;
  freePurchaseCount: number;
  paidPurchaseCount: number;
  expiringSoonCount: number;
  computedAt: string;
};
```

`GET /api/student/entitlements?resourceType=&status=ACTIVE|EXPIRED|REVOKED&page=&limit=`

`GET /api/student/entitlements/:id`

`GET /api/student/orders/:orderId/receipt` returns authoritative immutable receipt fields and a safe share/view representation. Mobile never generates totals or payment status.

### Website purchase handoff

If product approves web checkout from mobile:

1. Mobile requests a safe storefront URL/deep link for a product.
2. Website performs existing server-authoritative checkout/payment.
3. Provider webhook completes order and entitlement.
4. Return link contains only an order/reference identifier, never “paid=true”.
5. Mobile polls/refetches its own order and entitlement until PAID/FAILED/timeout.
6. Resource unlocks only from effective server entitlement.

Proposed endpoint: `POST /api/student/purchase-links` body `{ resourceType, resourceId, returnUri }`. It validates resource visibility and returns a signed short-lived web URL. This does not process payment.

### Expiry policy

Entitlement remains canonical. Effective expiry is stored/derived server-side from the Admin validity rule and learner exam date. Changing exam date must not silently extend a purchased entitlement unless explicitly approved. Recommended safe rule: snapshot effective expiry when entitlement is granted; later exam-date changes require an audited policy decision.

### Tests

- local return URI cannot grant access;
- pending/failed/refunded order remains locked;
- valid complimentary/Admin entitlement opens resource;
- expiry uses server time;
- full refund revokes as intended; partial-refund policy tested;
- order/receipt IDOR rejected;
- duplicate webhook/return/poll is idempotent.

---

## 14. Home aggregate, focus sessions, daily target, and syllabus progress

### 14.1 Home aggregate

`GET /api/student/home?date=YYYY-MM-DD`

```ts
type StudentHome = {
  greeting: { displayName: string; serverTime: string };
  focus: { activeSessionId: string | null; elapsedSeconds: number; todaySeconds: number; targetSeconds: number };
  exam: { courseName: string | null; examDate: string | null; daysRemaining: number | null };
  syllabus: { completed: number; total: number; percent: number };
  streak: { currentDays: number; todayQualified: boolean };
  rewards: { points: number; hearts: number };
  plan: { completed: number; total: number };
};
```

The 365-to-actual countdown is a mobile animation; the backend returns only the authoritative actual days. Syllabus completion derives from approved curriculum/progress definitions, not a fixed percentage.

### 14.2 Focus-session contracts

- `POST /api/student/focus-sessions` body `{ clientStartedAt?, idempotencyKey }`
- `GET /api/student/focus-sessions/active`
- `POST /api/student/focus-sessions/:id/heartbeat` body `{ observedAt }`
- `POST /api/student/focus-sessions/:id/complete` body `{ idempotencyKey }`
- `POST /api/student/focus-sessions/:id/abandon` for explicit discard if approved
- `GET /api/student/focus-sessions?from=&to=&page=&limit=`

Server start/end time and accepted duration are authoritative. Heartbeats help cap abandoned/background time; client elapsed time is display-only. Completion returns session summary, qualifying minutes, streak result, and reward transaction for the appreciation animation.

### 14.3 Persistence

Add FocusSession and daily learner activity aggregation. Store raw lifecycle timestamps/status plus accepted duration; do not update a single client-controlled total. Daily aggregates can be recomputed from sessions and note/practice qualifying events.

### 14.4 Tests

- duplicate start and complete idempotency;
- two simultaneous active sessions prevented/reconciled;
- app kill/network resume;
- client clock manipulation ignored;
- day boundary/timezone split;
- disabled/device-mismatch cannot continue heartbeat;
- home aggregate contains only current user/Academy data.

---

## 15. Streaks, points, hearts, calendar, and appreciation result

### Server-owned policy

- A qualifying day is calculated from accepted learning activity in the learner's timezone.
- Proposed point policy follows the current requirement: qualifying activity below target awards 10 points; activity at/above target awards 20. Minimum qualifying duration/event remains a blocking product decision.
- Hearts are streak-recovery instruments with an approved monthly maximum of three; acquisition rule remains pending.
- Every award/use is an append-only ledger transaction with unique source/idempotency identity.

### Contracts

- `GET /api/student/streak?month=YYYY-MM`
- `GET /api/student/rewards/wallet`
- `GET /api/student/rewards/ledger?cursor=&limit=`
- `POST /api/student/streak/recoveries` body `{ missedDate, heartId?, idempotencyKey }`

```ts
type StreakMonth = {
  month: string;
  currentStreak: number;
  longestStreak: number;
  days: Array<{
    date: string;
    status: "QUALIFIED" | "MISSED" | "RECOVERED" | "FUTURE";
    qualifyingMinutes: number;
  }>;
};

type RewardWallet = {
  points: number;
  hearts: number;
  monthlyHeartLimit: number;
  monthlyHeartsUsed: number;
  version: number;
};
```

Focus completion response includes an `appreciation` DTO with streak day, accepted time, awarded points, reward transaction ID, and a presentation-safe message key. The elaborate fire/rocket animation remains client-owned.

### Persistence/jobs

- daily activity/streak state or recomputable projection;
- RewardAccount and immutable RewardTransaction;
- StreakRecovery transaction;
- idempotency unique constraints;
- nightly reconciliation job for affected days only, not an unbounded full-history recalculation.

### Tests

- below/at/above target boundaries;
- duplicate focus completion cannot double-award;
- missed, recovered, and timezone-boundary days;
- maximum hearts and month rollover;
- wallet cannot go negative;
- local point/heart edits have no server effect;
- deterministic recomputation matches ledger.

---

## 16. Manual to-do and deterministic adaptive study plan

### 16.1 Inputs

- learner course/category/exam date/timezone/daily target;
- authoritative curriculum/topic prerequisites;
- Admin-estimated minutes per topic;
- reading completion/revision state;
- practice attempts and weak-concept signals;
- recent workload and overdue plan items;
- resource visibility/entitlement.

The engine is deterministic and explainable. It does not require AI. A repeated wrong-answer rule can emit a weak-concept signal because each Question references taxonomy. Planning cannot work accurately unless Admin-authored topic estimates and question-to-topic mappings are complete.

### 16.2 Contracts

- `GET /api/student/tasks?date=YYYY-MM-DD&status=`
- `POST /api/student/tasks` body `{ title, estimatedMinutes?, dueDate?, linkedResource? }`
- `PATCH /api/student/tasks/:id` body `{ title?, completed?, dueDate?, expectedVersion }`
- `DELETE /api/student/tasks/:id`
- `GET /api/student/study-plan?date=YYYY-MM-DD`
- `POST /api/student/study-plan/:date/regenerate` body `{ reason, idempotencyKey }`
- `POST /api/student/study-plan/items/:id/complete`
- `POST /api/student/study-plan/items/:id/reschedule` body `{ targetDate }`
- `POST /api/student/study-plan/items/:id/dismiss` body `{ reason }`

```ts
type StudyPlanItem = {
  id: string;
  source: "CURRICULUM" | "WEAK_CONCEPT" | "REVISION" | "USER_TASK";
  title: string;
  estimatedMinutes: number;
  priority: number;
  linkedResource: { type: string; id: string } | null;
  reason: { code: string; message: string; evidence?: Record<string, number> };
  status: "PENDING" | "COMPLETED" | "RESCHEDULED" | "DISMISSED";
};
```

### 16.3 Scheduling rules

1. Exclude inaccessible, archived, completed, or prerequisite-blocked resources.
2. Reserve capacity for overdue work according to a capped carry-forward policy.
3. Prioritize exam relevance and prerequisite order.
4. Raise concepts crossing the configured wrong-answer threshold.
5. Add due revision items.
6. Fill, but do not materially exceed, the learner's daily capacity.
7. Persist the generated plan and input/policy version so it remains explainable.
8. Recalculate only on meaningful events or explicit regenerate, with throttling.

### 16.4 Admin dependency

Admin topic estimated minutes, prerequisites, and optional priority require web Admin authoring changes. Those Class D changes are **not approved** by this plan and must be proposed separately before implementation. Backend schema may be added first only if it remains unused/default-safe for the Admin website.

### 16.5 Tests

- same inputs/policy produce same plan;
- plan fits capacity within tolerance;
- inaccessible paid material never assigned;
- repeated wrong answers raise the mapped topic, not arbitrary text;
- missing estimates use an approved fallback and show reduced-confidence reason;
- exam-date and capacity change behavior;
- complete/dismiss/reschedule concurrency;
- no duplicate plan/reward on job retry.

---

## 17. Practice catalogue, question banks, filters, and authorization

### 17.1 Required source model

The current Question schema has taxonomy but no complete question-bank/PYQ/RTP/MTP/year product model. Proposed logical additions:

- QuestionBank/edition with course/subject, Academy ownership, publication, access product linkage;
- QuestionBankQuestion join to permit a question in multiple banks;
- source classification: `PYQ`, `RTP`, `MTP`, `ORIGINAL`;
- exam year for Archive questions;
- entitlement resource mapping for paid banks.

Exact schema must reuse existing Package/Entitlement where possible. Whether a question bank is a Package subtype or a distinct resource is a blocking schema decision.

### 17.2 Source contracts

- `GET /api/student/practice/sources`
- `GET /api/student/practice/sources/:sourceId/filters`
- `POST /api/student/practice/sets/preview`

```ts
type PracticeSource = {
  id: string;
  kind: "ARCHIVE" | "QUESTION_BANK";
  title: string;
  access: { state: "FREE" | "OWNED" | "LOCKED" | "EXPIRED" };
  filters: {
    supportsYear: boolean;
    supportsCollections: Array<"PYQ" | "RTP" | "MTP">;
    formats: Array<"MCQ" | "DESCRIPTIVE" | "CASE_STUDY">;
  };
};
```

Archive is free for eligible students and exposes year. Paid Question Bank requires entitlement and does not expose a year filter; it may expose PYQ/RTP/MTP collection choices configured within that bank. Server rejects unsupported filter combinations even if a modified client submits them.

`PracticeSetPreviewRequest` contains source ID, subject/chapter/collection/year/format, standard versus Solve & Earn mode, and desired timer. Response contains eligible question count, estimated duration, challenge reward if applicable, and normalized selections—never answers.

### 17.3 Existing unsafe endpoint migration

Do not build sessions from the current `GET /api/student/questions` response because it exposes `answerHtml` and lacks bank entitlement. Add secure practice session endpoints that return prompt/options only. Changing/deprecating the existing endpoint is Class B and requires Admin/web-team impact review.

### 17.4 Authorization

- validate active Student and Academy context;
- validate course visibility/enrolment where required;
- Archive eligibility from approved free-course policy;
- paid bank effective entitlement and expiry;
- published question and bank only;
- server constrains query to source IDs; client filters never widen scope.

### 17.5 Tests

- Archive exposes year and bank rejects year;
- locked/expired bank denied;
- another Academy's bank/question denied;
- draft/archived/deleted question excluded;
- answer/correct option/explanation absent from prompt DTO;
- pagination/filter counts cannot enumerate unauthorized data.

---

## 18. Practice sessions, answers, navigator, retry, explanation, and timer

### 18.1 Session contracts

- `POST /api/student/practice/sessions`
- `GET /api/student/practice/sessions/:id`
- `POST /api/student/practice/sessions/:id/answers`
- `PUT /api/student/practice/sessions/:id/questions/:questionId/review`
- `POST /api/student/practice/sessions/:id/complete`
- `POST /api/student/practice/sessions/:id/abandon`

Create request references the normalized preview/filter selection and timer mode. The server selects and snapshots `n` authorized question IDs, policy version, start/deadline, and challenge terms. It returns the first/current prompt and navigator summary.

```ts
type PracticePrompt = {
  questionId: string;
  sequence: number;
  total: number;
  kind: "MCQ" | "DESCRIPTIVE" | "CASE_STUDY";
  promptHtml: string;
  options?: Array<{ id: string; html: string }>;
  navigatorState: "UNANSWERED" | "ANSWERED" | "MARKED_REVIEW" | "WRONG_LOCKED";
  policy: { canSubmit: boolean; canRetry: boolean; canViewExplanation: boolean };
};
```

Answer request includes question ID, attempt idempotency key, selected option/response, and expected attempt number. Server evaluates MCQ/case objective parts and returns:

```ts
type AnswerResult = {
  attemptId: string;
  correctness: "CORRECT" | "INCORRECT" | null;
  evaluated: boolean; // false for descriptive/free-text submissions
  navigatorState: string;
  canRetry: boolean;
  explanation: { html: string } | null;
  progress: { answered: number; total: number; percent: number };
};
```

### 18.2 Free/Paid policy

- Free: incorrect attempt becomes wrong-locked and cannot be submitted again; explanation remains unavailable until policy permits it (proposed: only correct answers).
- Paid/current bank entitlement: incorrect question can be retried; every submitted attempt is retained; explanation is returned after each answer.
- Capabilities come from server response, never local `user.plan`.
- An entitlement expiring mid-session follows a product-approved snapshot policy; recommended: allow the already-started session for a short maximum duration, deny new sessions/retries after expiry.

### 18.3 Descriptive/case policy

Objective subquestions can be evaluated by their configured answer keys. Free-text descriptive responses are stored as ungraded submissions only; descriptive evaluation, review queues, correctness and scoring are outside scope. The client must not fabricate correctness or points.

### 18.4 Timer

Custom timer selection is stored with the session. Server deadline is authoritative for Solve & Earn; standard practice may continue after timer with an “expired” state if product approves. Mobile stopwatch animation can run locally but reconciles to server time on resume.

### 18.5 Persistence

- PracticeSession and snapshotted questions/order/policy;
- PracticeAttempt with append-only attempt number/answer/evaluation;
- per-session question state/review flag;
- timestamps/deadline/completion status;
- no correct answer copied to a client-readable session field.

### 18.6 Tests

- modified Free client cannot retry or fetch explanation;
- Paid entitlement checked server-side;
- append-only retries preserve history;
- duplicate answer idempotency;
- wrong session/question IDOR;
- navigator counts and n-question progress;
- timer resume, deadline, client clock change;
- answer content never leaks before permitted result;
- descriptive responses remain stored and ungraded, with no evaluation workflow.

---

## 19. Solve & Earn challenges

### Contracts

- challenge terms are returned by practice preview;
- `POST /api/student/practice/challenges/:challengeId/sessions` creates a challenge-bound practice session;
- normal answer/session endpoints are reused;
- completion atomically evaluates eligibility and awards points;
- `GET /api/student/practice/challenges/history?cursor=` supports audit/history.

```ts
type ChallengeTerms = {
  challengeId: string;
  chapterId: string;
  questionCount: number;
  timeLimitSeconds: number;
  rewardPoints: number;
  availableUntil: string | null;
  remainingAttempts: number;
  policyVersion: number;
};
```

Server verifies all required questions were answered, completion occurred before authoritative deadline, the result meets the configured success rule, and the challenge was not already rewarded. Reward ledger and challenge result commit in one transaction or through an idempotent outbox/job design.

### Admin dependency

Challenge authoring—question count, time, reward, success threshold, frequency, course/chapter, validity—belongs to the web Admin Console. A shared backend model can be planned, but Admin UI changes require a separate Class D approval.

### Tests

- time exceeded, incomplete, failed threshold, duplicate completion;
- reward transaction exactly once under retries/concurrency;
- inaccessible chapter/bank rejected;
- client cannot choose reward value/time/question count;
- expired challenge and attempt-frequency enforcement.

---

## 20. Practice tracker and concept-wise weak areas

### Contracts

- `GET /api/student/practice/analytics/overview?from=&to=`
- `GET /api/student/practice/analytics/subjects`
- `GET /api/student/practice/analytics/chapters?subjectId=`
- `GET /api/student/practice/weak-areas?courseId=&limit=`

```ts
type ChapterPracticeMetric = {
  chapterId: string;
  chapterName: string;
  solved: number;
  correct: number;
  incorrect: number;
  wrongLocked: number;
  accuracyPercent: number | null;
  lastAttemptAt: string | null;
};

type WeakArea = {
  topicId: string;
  topicName: string;
  wrongAttempts: number;
  totalAttempts: number;
  severity: "WATCH" | "WEAK" | "CRITICAL";
  reasonCode: string;
  recommendedAction: { type: "STUDY" | "PRACTICE" | "REVISE"; resourceId: string | null };
};
```

Metrics derive from authoritative attempts. Weak-area logic is deterministic, versioned, and based on taxonomy IDs—not NLP over question text. Paid-only visibility, if retained, is enforced at the endpoint; the study planner's internal use for Free users is a separate product decision.

### Computation

- Simple aggregates may query attempts with indexes.
- Larger monthly/course aggregates should be materialized by background job or snapshot table.
- Late corrections/reviews emit recalculation events for affected user/topic/month.

### Tests

- chapter counts reconcile exactly with attempts;
- retries counted according to approved reporting rule;
- no divide-by-zero misleading accuracy;
- weak threshold/window determinism;
- Paid gate enforced server-side;
- another user's analytics inaccessible.

---

## 21. Tracker, consistency, revision tracker, and monthly reports

### 21.1 Tracker

- `GET /api/student/tracker/overview?from=&to=`
- `GET /api/student/tracker/consistency?days=7|30|90`
- streak calendar reuses section 15.

The existing graph UI is retained. Backend returns date buckets and accepted focus/study seconds; mobile only scales bars.

```ts
type ConsistencyBucket = { date: string; studySeconds: number; targetSeconds: number };
```

### 21.2 Revision tracker

- `GET /api/student/revisions/overview`
- `GET /api/student/revisions/chapters?courseId=&status=`
- `GET /api/student/revisions/chapters/:chapterId`
- `POST /api/student/revisions/items/:id/complete`

Chapter timeline stages derive from approved spaced-revision policy and append-only revision events. The Tracker page shows a stylish summary/button; full detail remains on the dedicated Revision Tracker page.

### 21.3 Monthly reports

- `GET /api/student/reports/months`
- `GET /api/student/reports/monthly/:yyyyMm`

```ts
type MonthlyReport = {
  month: string;
  generatedAt: string;
  policyVersion: number;
  totals: { studySeconds: number; questions: number; correct: number; notesCompleted: number; revisions: number };
  consistency: Array<ConsistencyBucket>;
  strongestTopics: Array<{ topicId: string; label: string; score: number }>;
  weakAreas: WeakArea[];
  comparison: { previousMonthPercent: number | null };
};
```

Reports are proposed as immutable/versioned snapshots generated after month close, with a controlled regeneration path for corrected data. Paid entitlement is checked at read time according to approved policy. Free returns an explicit feature capability/403, never static sample data.

### Tests

- consistency matches focus/activity records and timezone;
- revision stage spacing has no UI-induced gaps/errors;
- monthly boundaries, missing month, partial current month policy;
- report snapshot repeatability and regeneration audit;
- Paid access and expired/refunded behavior;
- another user's report ID/month inaccessible.

---

## 22. Notifications, broadcasts, read state, and push

### Existing endpoints to reuse

- `GET /api/student/notifications`
- `GET /api/student/notifications/unread-count`
- `PATCH /api/student/notifications/:id/read`

### Proposed mobile inbox projection

`GET /api/student/inbox?cursor=&limit=&unreadOnly=` returns discriminated items from existing Notification and eligible Broadcast records without merging source tables.

`PATCH /api/student/inbox/:type/:id/read`

`POST /api/student/inbox/:type/:id/acknowledge` where acknowledgement is required.

Audience is computed server-side from platform target, Academy membership, course enrolment, package/entitlement, and publication/delivery state. Mobile cannot submit an Academy/audience to widen results.

### Push installation contracts

- `PUT /api/student/installations/:installationId/push-token`
- `DELETE /api/student/installations/:installationId/push-token`
- `PATCH /api/student/notification-preferences`

Push is only a delivery hint. Opening the app fetches the database inbox. Token records are environment/platform/installation scoped and are disabled on logout, invalid-token provider response, or device recovery.

### Shared Admin dependency

Academy notification-management router source exists but is unmounted. Mounting it changes the other team's Admin backend and requires separate approval. Mobile inbox can be planned against existing persisted notifications, but end-to-end Admin creation cannot be declared complete until that router decision is made.

### Tests

- platform, Academy A, Academy B and course audience isolation;
- unread/read/ack idempotency;
- broadcast scheduled state not delivered early;
- disabled membership removes Academy audience;
- push token cannot be registered to another installation/user;
- duplicate job delivery and invalid-token cleanup.

---

## 23. Proposed persistence changes

This is a logical schema plan only. Exact Prisma definitions, names, indexes, migration SQL, backfill, and rollback require a separately approved Class C proposal.

### 23.1 Reuse unchanged

- User, Role, Permission, RolePermission;
- UserSession, PasswordCredential;
- Academy, AcademyMembership, AcademyCourseEnrollment, admissions;
- Course, Subject, ContentItem, Package, PackageItem, taxonomy;
- Question, QuestionOption, CaseSubQuestion;
- Order, Payment, Refund, Coupon, Entitlement;
- Notification/Broadcast families;
- BackgroundJob, IdempotencyRecord, Audit/Security events, StorageUpload.

### 23.2 Additive logical records

| Domain | Proposed records | Core constraints/indexes |
|---|---|---|
| Auth | AuthChallenge, MobileInstallation, DeviceBinding, DeviceRecovery | unique active binding per user; challenge hash/expiry/consumed indexes |
| Profile | LearnerPreference | unique user; FK Course/Academy; optimistic version |
| Notes | LearnerContentState, ContentRevisionEvent | unique user+content; user+recent/favourite indexes |
| Protected content | ContentViewSession, ContentAccessEvent, optional WatermarkDerivative | user/content/expiry; source version/user marker dedupe |
| Activity | FocusSession, LearnerDailyActivity | max one active session/user; user+date unique aggregate |
| Rewards | RewardAccount, RewardTransaction, StreakRecovery | unique user wallet; unique source/idempotency; append-only ledger |
| Tasks/plans | LearnerTask, StudyPlan, StudyPlanItem, TopicStudyEstimate, TopicPrerequisite | user+date; plan policy/input version; topic uniqueness |
| Question banks | QuestionBank, QuestionBankQuestion, source metadata | Academy/course/publication; bank+question unique; source/year indexes |
| Practice | PracticeSession, PracticeSessionQuestion, PracticeAttempt, PracticeChallenge, ChallengeResult | session sequence unique; attempt number; reward exactly once |
| Analytics | WeakAreaProjection, RevisionPlan/Item/Event, MonthlyReportSnapshot | user+topic/version; user+month/version |
| Push | InstallationPushToken, NotificationPreference | token unique per environment; user+installation |

### 23.3 Migration strategy

1. Confirm actual applied migration state in an approved disposable/staging environment.
2. Add tables/nullable fields/indexes only.
3. Deploy backend that tolerates missing/unpopulated new data where rolling deployment requires.
4. Backfill only from authoritative existing data; no fabricated user progress.
5. Enable writes behind a server feature flag.
6. Verify Admin/storefront regression.
7. Enable mobile read, then write features per cohort.
8. Tighten constraints only in a later migration after evidence.

Rollback disables feature flags and routes first. Additive tables remain until a separately approved cleanup; no destructive down migration against shared production data.

---

## 24. Background jobs and domain events

Reuse the durable BackgroundJob mechanism with bounded retries, leases, stale recovery, and dedupe.

### Proposed events/jobs

| Event | Consumers |
|---|---|
| `learner.exam_date_changed` | study-plan recalculation; entitlement review if policy allows |
| `focus_session.completed` | daily activity, streak, reward, tracker |
| `content.opened/completed/revised` | recent/progress, revision, syllabus, plan |
| `practice_attempt.recorded` | navigator, chapter metrics, weak areas, plan |
| `practice_session.completed` | challenge evaluation, analytics |
| `entitlement.granted/revoked/expired` | library/access cache invalidation, notifications |
| `order.paid/refunded` | entitlement reflection, receipt/inbox |
| `month.closed` | monthly report snapshot |
| `notification/broadcast.published` | recipient delivery/push |
| `user.disabled/session.revoked` | push disable and mobile forced logout on next contact |

Jobs carry IDs, not full sensitive documents/answers/tokens. Consumers re-read authoritative state, enforce tenant context, and are idempotent. Reward and entitlement side effects require database uniqueness or transactional outbox semantics.

---

## 25. Mobile cache and offline plan

### Allowed

- theme and display preferences;
- scoped query metadata and stale read-only summaries;
- manual task/answer drafts only where conflict behavior is defined;
- optimistic favourite/completion/read changes with rollback on server failure.

### Not allowed

- long-lived credentials outside SecureStore;
- paid PDF bytes/signed URLs;
- answer keys/unreleased explanations;
- authoritative rewards, entitlements, prices, receipts, timers, streaks, or plan access;
- production fixture fallback.

### Invalidation graph

- login/logout/account change -> clear all user caches;
- Academy switch -> clear Academy/course/content/practice/inbox/plan;
- entitlement event/purchase return/refund -> access/library/content/practice/report;
- content state mutation -> notes/recent/favourite/syllabus/revision/home;
- focus completion -> home/tracker/streak/rewards/plan;
- practice answer/completion -> navigator/practice tracker/weak areas/plan/report;
- exam preference -> countdown/plan and only approved entitlement calculations.

---

## 26. Test and security plan

### 26.1 Test layers

1. **Unit:** policy functions, date/timezone rules, OTP limits, access capabilities, streak/reward, scheduler, weak-area, expiry, DTO sanitization.
2. **Service integration:** disposable loopback PostgreSQL only, using the repository's integration guard; real Prisma transactions and constraints.
3. **Route contract:** authentication, validation, response/error shape, idempotency, pagination, and authorization.
4. **Provider boundary:** mocked/fake adapters for storage/payment/email/push; never production providers in ordinary tests.
5. **Mobile integration:** Mock Service Worker/local test server using actual contract fixtures; no ownership-success fallback.
6. **End-to-end:** approved local/staging environment from Admin-created record through DB/API/mobile.
7. **Security regression:** IDOR, cross-Academy, entitlement, answer leakage, replay, cache isolation, and local tampering.

### 26.2 Required identity/tenant matrix

- direct platform Student;
- Academy A Student;
- Academy B Student;
- multi-membership Student and active Academy switch;
- no-enrolment Student;
- active, disabled, deleted user;
- Free, Paid, expired, revoked/refunded entitlement;
- same bound device and different installation;
- Super Admin/Academy Admin attempting student-only routes;
- another user's IDs in every user-owned endpoint.

### 26.3 Required feature scenarios

- OTP expiry/resend/replay/concurrency and recovery;
- access/refresh expiry, rotation, replay, logout and forced logout;
- public/platform/Academy course visibility and archived lifecycle;
- locked/free/owned/expired content and watermark session expiry;
- favourite/completed/revise on locked material without unlock;
- website purchase reflected only after verified payment/entitlement;
- Free wrong-answer lock and explanation restriction with modified client;
- Paid retry/explanation with entitlement revoked mid-flow;
- Archive year filter and question-bank year rejection;
- Solve & Earn deadline, success threshold, and exactly-once reward;
- focus resume/complete and client clock tampering;
- streak timezone/missed/recovered calendar and heart monthly cap;
- deterministic daily plan capacity/prerequisites/weak-concept reason;
- practice/chapter/revision/monthly aggregate reconciliation;
- Notification/Broadcast audience/read isolation;
- offline/timeout/400/401/403/404/409/410/422/429/503 without false success.

### 26.4 Admin/web regression before shared release

- existing Admin login/RBAC/Academy tenant tests;
- course/content/question/package CRUD unaffected unless separately approved;
- storefront catalogue and checkout contract tests;
- payment/refund/entitlement lifecycle;
- Academy admissions, notifications, jobs, audit/security logs;
- existing API consumers verified against unchanged response shapes.

No shared integration test is run until the database URL is explicitly confirmed as disposable and the user approves the feature batch.

---

## 27. Implementation batches and approval checkpoints

Each batch is independently proposed, approved, implemented, tested, and reported. Do not implement all batches in one stretch.

### Batch 0 — shared safety decisions and contract freeze

- Confirm migration deployment and canonical Course/Content ownership.
- Approve role keys, Academy rules, commerce channel, OTP/device recovery, expiry, explanation/retry, timezone/reward policies.
- Approve shared changes for catalogue/question safety and web checkout mismatch.
- Freeze error envelope and DTO conventions.

**Code:** none until decisions are approved.

### Batch 1 — mobile API foundation and existing auth integration

- Central API client, SecureStore, refresh mutex, bootstrap, logout/cache clearing.
- Reuse existing auth/session/membership APIs.
- No schema change if bootstrap is initially composed client-side; additive aggregate route optional.

**Shared approval:** required before adding bootstrap or adjusting auth platform metadata.

### Batch 2 — OTP, recovery, installation binding, profile/onboarding

- Registration/recovery challenges, device binding, learner preferences.
- Additive migrations and routes.
- Preserve existing web password/Google flow until coordinated migration.

**Shared/Admin impact:** backend/schema; no Admin UI edit. Support recovery UI remains separate approval.

### Batch 3 — catalogue, entitlement, library, orders

- Safe student catalogue projections and authorized hierarchy.
- Entitlement/access summary and authoritative orders/receipts.
- Remove mobile fake purchase/access after real reads work.

**Shared impact:** catalogue policy correction needs web regression and explicit approval.

### Batch 4 — note state and protected PDF

- Reading state, recent/favourite/completed/revision.
- Protected view session, watermark derivative/page stream, audit and cleanup.

**Shared impact:** schema/storage/jobs; Admin content upload shape should remain unchanged.

### Batch 5 — focus, tracker base, streak, rewards

- Focus lifecycle, daily activity, home aggregate, consistency, streak, wallet/ledger, appreciation result.

**Shared impact:** additive backend/schema only; no Admin UI by default.

### Batch 6 — practice source and secure session core

- Question-bank/source metadata, authorization, secure prompts, sessions, answers, navigator, timer.
- Free/Paid policy enforcement.

**Shared/Admin impact:** question-bank metadata authoring and old question endpoint migration require explicit other-team approval.

### Batch 7 — Solve & Earn, practice analytics, weak areas

- Challenge, reward, chapter metrics, deterministic weak-concept signals.

**Shared/Admin impact:** challenge authoring needs separate Admin UI approval.

### Batch 8 — tasks, adaptive plan, revision, reports

- Manual tasks, topic estimates/prerequisites, scheduler, revision plan, monthly snapshots.

**Shared/Admin impact:** estimated-hours/prerequisite authoring needs separate Admin UI approval.

### Batch 9 — inbox, push, cleanup

- Notification/Broadcast mobile projection and push tokens.
- Decide/mount Academy notification Admin routes only with approval.
- Replace remaining mocks and then remove obsolete mobile Admin UI with approved scope.

---

## 28. Shared Admin/web compatibility approval matrix

| Planned work | Backend impact | Admin website impact | Storefront impact | Can proceed without explicit shared-code approval? |
|---|---|---|---|---|
| Mobile SecureStore/API client | None | None | None | Yes, after Gate 3 mobile batch approval |
| Student bootstrap aggregate | Additive route/service | None expected | None | No — shared backend edit |
| OTP/device/profile models | Additive schema/routes | Future support view optional | None | No |
| Catalogue lifecycle correction | Existing query behavior | Admin previews may differ | Visible products may change | No; coordinate first |
| Student catalogue projection | Additive route | None expected | None | No |
| Note reading state | Additive schema/routes | Analytics opportunity only | None | No |
| Protected watermark delivery | Additive service/storage/jobs | Upload flow should remain stable | None | No |
| Entitlement/access summary | Additive read route | None expected | None | No |
| Web purchase handoff | Additive route plus checkout alignment | None expected | Checkout URL/return behavior | No |
| Focus/rewards/plans | Additive schema/routes/jobs | Policy configuration may be needed | None | No |
| Question-bank/source schema | Additive/behavioral | Authoring/import changes required | Product listing may change | No; separate Admin approval |
| Secure practice endpoint | Additive replacement | Question preview may reuse DTO later | None | No |
| Deprecate unsafe questions endpoint | Existing route behavior | Possible consumers | Possible consumers | No; migrate consumers first |
| Solve & Earn authoring | Schema/routes | New Admin form required | Maybe product card | No; separate Admin approval |
| Topic hours/prerequisites | Schema/routes | New Admin form required | None | No; separate Admin approval |
| Unified mobile inbox | Additive projection | No UI change required initially | None | No |
| Mount Academy notification/settings/analytics | Existing server composition | Directly enables Admin pages/services | None | No; separate Admin approval |
| Remove mobile Admin UI | Mobile only after dependencies | None | None | Requires removal-scope approval |

This matrix is the working answer to “how can the same backend be implemented safely?”: mobile work is additive and isolated where possible, but every shared-repository edit is still reviewed before it is made.

---

## 29. Mobile screen-to-contract traceability

| Screen | Primary contracts |
|---|---|
| Welcome/Login | auth session/login/Google |
| Signup/OTP | registration + email/mobile challenges |
| Forgot/reset | recovery challenge/reset |
| Personalization | preferences + authorized courses + memberships/admissions |
| Home | bootstrap, home, focus, wallet, study plan/tasks |
| Notes | student catalogue/notes/recent/favourites |
| Subject/unit/topic | student course/content hierarchy |
| Note action menu | favourite/completion/revision |
| PDF lesson | protected view session/heartbeat/close |
| Practice | sources/filters/preview/session |
| Practice runner | prompt/answer/review/complete |
| Practice tracker | practice analytics/weak areas |
| Tracker | tracker overview/consistency/streak/revisions |
| Revision tracker | revision overview/chapters/items |
| Monthly reports | report months/detail |
| Library | access summary/entitlements/orders/catalogue |
| Purchase | purchase link then order/entitlement refresh; no local unlock |
| Receipt | authoritative receipt |
| Account | me/preferences/memberships/installations/notification preferences |
| Forced logout | stable auth/session/device errors and local secure cleanup |
| Mobile Admin routes | no production backend contract; remove later |

---

## 30. Gate 3 definition of done per feature

A feature is complete only when:

1. its shared-code proposal was approved;
2. contract and schema match this plan or an approved amendment;
3. authentication, ownership, Academy and entitlement checks are server-side;
4. unit/route/security tests pass;
5. disposable-database integration tests pass when persistence is involved;
6. existing web/Admin regressions pass for affected shared code;
7. mobile uses centralized API/secure storage/query cache;
8. loading, empty, error, offline and forced-logout states work in the existing UI;
9. mock/fallback-success behavior for that feature is removed;
10. cache invalidation and logout/account/Academy isolation are verified;
11. exact files, commands, tests and unresolved risks are reported;
12. no subsequent major batch starts without the requested approval.

---

## 31. Gate 2 approval checklist

Before Gate 3, approve or amend:

- [ ] compatibility-first shared-code workflow;
- [ ] read-only mobile commerce through website purchase;
- [ ] OTP and Google account completion behavior;
- [ ] permanent device binding and recovery policy;
- [ ] learner course selection versus enrolment semantics;
- [ ] exam-date and entitlement-expiry behavior;
- [ ] Free/Paid practice retry and explanation rules;
- [ ] question-bank representation and Archive/PYQ/RTP/MTP metadata;
- [ ] deterministic weak-area and study-plan approach;
- [ ] point, heart, streak, timezone and reward rules;
- [ ] protected watermark delivery and no offline PDF default;
- [ ] unified Notification/Broadcast mobile inbox;
- [ ] additive schema families and migration strategy;
- [ ] batch order and shared Admin/web approval checkpoints;
- [ ] eventual obsolete mobile Admin removal scope.

**End of Gate 2 plan. No backend or Admin code has been edited.**

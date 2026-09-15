# Parallax Flow backend integration backlog

## First-class Question Bank completion checkpoint — 2026-08-30

This is the latest approved model and supersedes every conflicting historical item below that treats a Question Bank only as a PDF/package or makes every Practice question universally free.

- Complete: normalized `QuestionBank` container and direct single-owner `Question.questionBankId` relation, separate from Excel imports, linked Content Files, website Purchases and Entitlements. The same wording in another bank is a distinct Question record.
- Complete: Admin, Super Admin and Academy Admin CRUD/lifecycle and Normal-MCQ or Case-MCQ manual/Excel authoring under existing RBAC, course and tenant boundaries.
- Complete: atomic Case-MCQ Excel validation/import with the finalized `Correct Explanation` column and persisted correct/wrong explanations plus file links.
- Complete: Student discovery, filter, preview, session, attempt, result and analytics paths enforce publication, selected course, tenant, linked-file access and exact paid entitlement. Free published banks remain course-accessible.
- Complete: Practice sessions persist `questionBankId`; unauthorized, expired, foreign-course and foreign-tenant bank questions remain hidden.
- Complete verification: Prisma validate/generate/migration status, server/web/mobile typechecks, server and website tests, builds, mobile lint, and an isolated real-PostgreSQL Question Bank integration path.
- Deferred scalability only: add pre-aggregated analytics/materialized views when real data volume demonstrates the need. This is not a functional blocker.

## Finalized Practice Studio checkpoint — 2026-08-29

This checkpoint supersedes the 26 August Practice correction and every conflicting Practice/Question Bank/Solve & Earn item below.

- Complete: MCQ, Case Study, entitled Question Bank and Wrong Answers modes across Prisma, API, Admin authoring and the authenticated mobile Practice screen.
- Complete: multi-file OR authorization, actual-data search, nested package entitlement expansion, locked/owned bank state, persisted multi-material sessions, server timer/evaluation, retries/explanations, navigator, resume and results.
- Complete: Admin manual/Excel Question Bank authoring using the existing question/file relationship and tenant/RBAC boundaries.
- Excluded: Solve & Earn and descriptive-answer grading.
- Remaining acceptance only: run the guarded data-mutating integration suite against a dedicated disposable local test database when desired; do not point it at shared developer or production data.

## Authoritative practice correction — 2026-08-26

This section supersedes every older Practice, Question Bank and Solve & Earn item later in this file.

- There is no Solve & Earn feature. Do not implement challenge policies, challenge rewards, challenge endpoints or Practice point awards.
- All published questions uploaded through the Admin Excel/question flow are free to learners who selected the matching course.
- Practice access never depends on purchasing a package, note or Question Bank.
- A purchasable “Question Bank” is a PDF note/package. It appears in Notes/Library after entitlement and opens through the protected PDF reader. It never supplies questions to Practice.
- Admin question metadata drives Practice filters: course, subject, chapter, optional lesson/topic, collection, answer format and optional year.
- Free/Paid status affects answer behavior only: Free wrong-answer lock and explanation rules versus Paid retry, explanations and detailed weak-topic analytics.
- Remaining backend work: retire/sanitize the legacy answer-leaking student questions endpoint, validate Admin Excel metadata/backfill, and add scalable analytics materialization when volume requires it.

## Tracker and revision checkpoint — 2026-08-26

The real Tracker consistency projection, chapter-wise revision projection and revision-history API are implemented and connected to real mobile sessions. They reuse `LearnerDailyActivity`, `LearnerStreakState`, `LearnerNoteState`, `NoteRevisionEvent` and the published `ContentItem` hierarchy. No migration or Admin change was required. Remaining related work belongs to the adaptive study-plan and monthly-report batches.

The proposed Admin-mobile backend batch is out of scope at the user's request. Do not build a parallel Admin API surface unless the user explicitly restores it.

## Mobile commerce scope correction — 2026-08-26

Purchasing is website-only. Remove mobile checkout, coupon-validation, order-creation, payment-confirmation and refund mutation work from the mobile backend roadmap. The mobile app only needs safe read projections for locked paid resources, active/expired entitlements, owned Library items, website-created order history and receipts. After a website purchase or grant, mobile must reflect access through normal refresh/session bootstrap without duplicating the commerce transaction.

This file records server-side work intentionally deferred while the React Native application is being reviewed as a UI-only prototype. The mobile UI may use local demo data for these states, but none of the rules below should be considered authoritative or secure until the backend enforces them.

## Subscription and entitlement

- Add an authoritative learner plan field (`free` or `paid`) sourced from completed payment/subscription records.
- Return current plan, activation date, renewal/end date and entitlement version with the authenticated user/session response.
- Never trust a plan value sent by the mobile client.
- Define upgrade, expiry, refund, cancellation and grace-period behavior.
- Add entitlement checks to protected notes, infographics, question banks, explanations, retries, weak-area analytics and monthly reports.

## Permanent single-device account binding

This policy is different from limiting concurrent sessions. After the first successful login, a learner account is permanently bound to that approved device until an authorized recovery/reset explicitly replaces the binding. Logging out, token expiry, app closure or having zero active sessions must not release the device binding.

### Required behavior

- On the first successful login, atomically create the account's one approved-device binding.
- Allow that same approved device to sign in, log out and sign in again any number of times.
- Reject login from every other device even when the approved device is logged out and no active access token exists.
- Apply the same binding policy to password login, OTP login, Google OAuth and any future authentication method.
- Keep device binding separate from session records:
  - logout revokes the current access/refresh tokens;
  - session expiry removes or expires the session;
  - neither action deletes or changes the approved-device binding.
- Prevent two simultaneous first-login requests from binding two devices by using a database uniqueness constraint and transaction/lock.
- Return an explicit safe error such as `ACCOUNT_BOUND_TO_ANOTHER_DEVICE`; do not reveal the approved device's sensitive identifiers.
- Show the learner a clear blocked-device message and the approved device's safe display metadata, such as device model and binding date, only after identity verification.

### Device identity and proof

- Do not use IMEI, phone number, MAC address, advertising ID or raw hardware serial numbers. Modern mobile operating systems restrict them, they create privacy risk and some can be spoofed.
- On first enrollment, generate a non-exportable asymmetric key pair in the Android Keystore or iOS Keychain/Secure Enclave where supported.
- Send only the public key, a server-issued installation identifier and safe device metadata to the backend.
- Require the device to sign a short-lived server challenge during later logins; verify the signature before issuing session tokens.
- Use Android Play Integrity and Apple App Attest/DeviceCheck as additional risk signals when production requirements permit, but do not treat attestation alone as the account binding.
- Store device fingerprint signals only as secondary fraud/risk evidence. They must not replace cryptographic device proof.
- Encrypt sensitive binding records at rest and restrict access to authentication/support services.

### Suggested binding record

- `bindingId`
- `userId` with a unique active-binding constraint
- `devicePublicKey`
- `deviceInstallationId`
- `platform`
- safe model/OS/app-version metadata
- `boundAt`, `lastVerifiedAt` and `lastLoginAt`
- `status`: `active`, `recovery_pending`, `revoked` or `replaced`
- replacement/revocation actor, reason and audit reference
- Never store access tokens or raw private keys in this record.

### Login and logout flow

1. Authenticate the user's password, OTP or OAuth identity.
2. If no device is bound, start an atomic device-enrollment challenge and bind the successfully verified device.
3. If a device is already bound, issue a short-lived challenge for the stored public key.
4. Issue access and refresh tokens only after the approved device signs the challenge successfully.
5. If the proof is missing or belongs to another device, reject the login regardless of active-session count.
6. On logout, revoke session tokens but leave the binding unchanged.

### Device replacement and recovery

- A permanent one-device policy requires a recovery path for lost, stolen, damaged, factory-reset or replaced devices. Without one, legitimate customers can be locked out permanently.
- Do not provide an automatic "use this new device" action after login failure.
- Recommended recovery requires strong identity verification, such as verified email and mobile OTP together, followed by a cooldown or Admin/support approval according to business policy.
- On approval, revoke the old binding, invalidate every old refresh token, create a replacement enrollment challenge and bind the new device.
- Notify the learner through verified email/mobile whenever a reset is requested, approved, cancelled or completed.
- Allow the learner/support team to immediately revoke a stolen approved device after identity verification.
- Record requester, approver, reason, timestamps, old/new safe device metadata and IP/risk information in an immutable audit trail.
- Apply rate limits and abuse detection to binding checks, recovery attempts and OTP requests.

### Important platform limitation

- No normal mobile app can identify the same physical device forever with absolute certainty. App reinstall, clearing application data, factory reset, OS security changes or lost Keystore/Keychain material can remove the device credential.
- After credential loss, the original physical device may appear to the backend as a new device. It must use the same controlled recovery/reset flow; silently rebinding it would weaken the one-device rule.
- Rooted/jailbroken devices and sophisticated emulators can reduce assurance. Define whether to block them or treat them as elevated risk.

### Suggested endpoints and errors

- `POST /auth/device/enroll/challenge`
- `POST /auth/device/enroll/complete`
- `POST /auth/device/verify/challenge`
- `POST /auth/device/verify/complete`
- `POST /auth/device-recovery/request`
- `POST /auth/device-recovery/verify`
- Admin/support-only device replacement approval and revocation endpoints.
- Standardize responses such as `DEVICE_ENROLLMENT_REQUIRED`, `DEVICE_PROOF_REQUIRED`, `DEVICE_PROOF_INVALID`, `ACCOUNT_BOUND_TO_ANOTHER_DEVICE`, `DEVICE_RECOVERY_PENDING` and `DEVICE_BINDING_REVOKED`.

### Acceptance and security tests

- First successful login binds exactly one device even under simultaneous requests.
- Repeated login/logout cycles on the approved device succeed.
- Logout and token expiry never clear the device binding.
- A second device is rejected when the first device is logged in, logged out or has no active session.
- Password reset and Google OAuth do not bypass the binding.
- Copied installation identifiers without the private key cannot authenticate.
- Reinstall/credential loss enters recovery instead of silently creating a second binding.
- Approved replacement revokes the old device and all old refresh tokens before the new device is enrolled.
- All enrollments, rejected devices, recovery attempts and binding changes are rate-limited, monitored and audited.

## Resource validity and expiry

Implementation checkpoint (2026-08-26): resource-level validity is complete in code for paid PDFs. Existing content defaults to permanent. The existing Admin upload and Edit Access forms gained one compact selector for `Permanent` or `Exam date + days`, with no redesign of the Admin workspace. Package-owned PDFs enforce their individual policies. Notes access derives the effective server expiry from the canonical learner exam date and uses the earlier of resource and entitlement/grant expiry; missing exam data and elapsed access fail closed. Protected viewer sessions cannot renew beyond that effective expiry. Notes, Library, course-content and adaptive-plan projections now carry or enforce the same rule. Public website catalogue reads expose validity terms before purchase. Admin validity edits are included in the existing content audit event. Migration `20260827110000_add_resource_validity_policy` is additive and has not been applied to the shared database.

Remaining production work:

- Decide whether fixed-duration-from-purchase or absolute resource end dates are actually required; do not add them without approved product rules.
- Add expiry-warning notification jobs and immutable learner expiry-event auditing if operational notifications are enabled.
- Add active/expiring/expired Admin catalogue filters and a learner-specific expiry preview if the Admin team requests them.
- Run the guarded end-to-end expiry matrix against a disposable PostgreSQL database before coordinated migration deployment.

## Practice permissions and explanations

Core Student practice session/attempt enforcement is implemented in Gate 3 Feature 8. Remaining work in this section includes Admin authoring, legacy endpoint retirement, richer concept tagging and production data migration.

- Model the public `Archive (PYQ)` separately from purchasable question banks; authenticated learners must be allowed to query Archive sets without a purchase entitlement.
- Give each question bank a stable resource ID and issue entitlements per learner and per bank. A generic Paid subscription must not imply ownership of every question bank.
- Authorize question-bank metadata, question lists, session creation and answer submission against the exact active, unexpired bank entitlement on every request.
- Store filterable question metadata for subject, chapter/topic, collection (`past_year`, `rtp`, `mtp`) and answer format (`mcq`, `descriptive`, `case_study`). Store exam year for Archive/PYQ records only; question-bank filtering must not expose a separate year selector.
- Provide server-side filtered session creation so the returned question count and questions actually match all chosen filters; never rely on mobile-only filtering for protected banks.
- Return an empty-combination response with available alternatives when a valid filter combination has no questions.
- Do not expose protected question text, answer keys or explanations in filter-count endpoints or locked-bank previews.
- Tag every question with course, category, subject, chapter/topic and concept identifiers.
- For Free users, return an explanation only after a correct response.
- For Paid users, return an explanation after every submitted response.
- For Free users, reject repeat attempts after an incorrect submission when the configured policy is one-attempt-only.
- For Paid users, allow repeat attempts and persist each attempt in order.
- Return attempt number, correctness, retry eligibility and explanation eligibility from the answer endpoint.
- Ensure restricted explanations are never included in payloads sent to ineligible Free users.

### Practice follow-ups requiring Admin-team approval

- Extend the existing Admin question create/edit UI and Admin question API contract to author `questionBankPackageId`, `practiceCollection` (`PYQ/RTP/MTP/ORIGINAL`) and Archive-only `practiceYear`. The database and Student read contract now support these fields, but this Gate intentionally did not edit Admin-owned code.
- Classify/backfill existing published questions. They currently migrate safely as `ORIGINAL` Archive questions with no year, so year-specific PYQ filters require curated metadata before launch.
- Migrate all mobile practice traffic to `/api/student/practice/*`, then deprecate or sanitize legacy `GET /api/student/questions`, which currently returns `answerHtml`. Do not expose that legacy route to production mobile clients.
- Decide whether “Paid user” means an active plan/subscription or any active non-complimentary purchase. The current compatibility rule follows the existing bootstrap convention: an active paid purchase/subscription enables Paid Archive retry/explanation, while Question Banks always require the exact package entitlement.

## Solve & Earn practice challenges

The current mobile screen is UI-only. Its chapter question count, time target and points preview are demo values derived locally. Production rewards must be configured, timed, validated and awarded only by the backend.

Implementation checkpoint (2026-08-26): the prerequisite reward wallet, server-minted claims, immutable ledger, idempotent claim endpoint and three-heart wallet cap are implemented in migration `20260827010000_add_reward_wallet_and_ledger`. Challenge policy authoring, timed challenge sessions, validation and source-specific claim creation below remain pending.

Focus/streak checkpoint (2026-08-26): server-timed focus sessions, learner-timezone daily totals, daily reward claims, current/longest streak, calendar projection, monthly three-heart refresh and missed-day recovery are implemented in migration `20260827030000_add_focus_daily_activity_and_streak` and connected to real-session Home/Tracker. Consistency aggregation beyond the current daily summary and the adaptive study plan remain separate future work.

- Add an Admin-managed challenge policy per course/category, question source, subject and chapter/topic with:
  - active date range and learner eligibility;
  - eligible question pool or immutable set version;
  - required number of questions;
  - authoritative time limit in seconds;
  - minimum correct-answer count or accuracy threshold;
  - points awarded, attempt limit and cooldown;
  - whether Archive and/or a specifically entitled Question Bank is eligible.
- Return filter metadata and challenge availability together so the mobile filter can display the authoritative question count, duration, points and unavailable reason for the selected chapter.
- Create a server-side challenge session before revealing questions. Return a signed session ID, server `startedAt`, `expiresAt`, question-set version and reward rules; never trust a timer started by the phone.
- Validate every submitted answer against that session and use server timestamps to determine whether it arrived before expiry.
- Decide and document completion semantics before launch. Recommended first rule: all required questions submitted within the time limit and the configured accuracy threshold met.
- Award points through an idempotent reward-ledger transaction only after the server validates completion. Replaying the completion request, reopening the app or changing device time must never duplicate points.
- Return explicit states: `available`, `active`, `completed`, `earned`, `failed_time`, `failed_accuracy`, `attempt_limit_reached`, `expired` and `ineligible`.
- Support reconnect/resume using the original server deadline. Offline time must continue to elapse and queued submissions received after expiry must not qualify for points.
- Enforce exact Question Bank ownership and validity before a bank-backed challenge is created. Archive challenges remain available according to the configured Free-user policy.
- Record challenge attempts, answer outcomes, duration, reward decision, ledger entry and policy version for learner history, Admin audit and abuse investigation.
- Add rate limits and anomaly checks for impossible response times, repeated answer patterns, concurrent sessions and modified clients.
- Suggested endpoints:
  - `GET /practice/challenges/preview?source=&subjectId=&topicId=&collection=`
  - `POST /practice/challenges/sessions`
  - `POST /practice/challenges/sessions/:sessionId/answers`
  - `POST /practice/challenges/sessions/:sessionId/complete`
  - `GET /practice/challenges/history`
- Acceptance tests must cover exact-deadline submissions, app background/foreground, disconnect/reconnect, duplicate completion calls, question-bank expiry during a session, changed Admin policy after session start and concurrent-device attempts.

## Concept-wise weak areas

- Persist answer history with question, concept, correctness, attempt number, response time and timestamp.
- Define the weakness score using accuracy, recency, attempt count and response time.
- Require a minimum sample size before labelling a concept weak.
- Expose subject/chapter/concept breakdowns and recommended next-practice targets.
- Recalculate analytics asynchronously after practice submissions.

## Adaptive daily to-do and study-plan engine

Implementation checkpoint (2026-08-26): deterministic v1 is complete in code and integrated with real-session Home. It persists stable daily plans and task history; packs carry-over, due revision, continue-note and unread-note work into the learner's daily capacity; supports manual/start/complete/reopen/skip/reschedule/hide/clear actions; excludes inaccessible paid resources; and consumes optional versioned `StudyWorkloadEstimate` values with an explicit fallback when Admin estimates are missing. Remaining work in this section is Practice-derived weak-concept input (paused), Admin authoring for workload estimates (approval required), weekday-specific availability/overrides, prerequisites/weightage, background pre-generation and production-scale monitoring.

This feature must be generated and enforced by the backend. The mobile app should only collect learner preferences, display the generated plan and send user actions such as complete, skip or reschedule.

### Required academic structure

- Store one canonical hierarchy: `course -> category/level -> subject -> unit/chapter -> topic -> concept`.
- Give every entity a stable server identifier; titles alone must never be used for relationships.
- Require every practice question to reference at least one topic and one primary concept.
- Allow optional secondary concepts for cross-topic questions, with one explicitly marked primary concept.
- Require every note, lesson, question bank and practice set to reference the same hierarchy.
- Do not infer concepts from question text in the first production version. Admin/content-team tagging is the reliable source of truth. AI-assisted tagging may be introduced later only with human review and confidence tracking.
- Validate tags during content publication so unclassified questions cannot silently affect learner recommendations.

### Practice-attempt data

- Persist each submitted attempt with learner, question, course, subject, topic, concept, selected answer, correctness, response time, attempt number, difficulty and timestamp.
- Preserve the original attempt even when a Paid learner retries a wrong question.
- Distinguish independent questions from repeated attempts so retries cannot artificially inflate either weakness or mastery.
- Use server timestamps and the learner timezone for recency calculations.
- Record whether an attempt occurred before or after the learner studied/revised that concept.

### Weak-concept detection

- Do not create a study task from one isolated wrong answer.
- Start with a transparent rule-based score rather than an opaque AI model.
- Require a configurable minimum evidence threshold, initially recommended as at least `3` distinct attempted questions in a concept.
- Use error rate over distinct questions rather than raw wrong-answer count, because concepts can contain different numbers of questions.
- Weight recent attempts more heavily than old attempts and reduce the effect of repeated attempts on the same question.
- Include question difficulty and response time only as secondary signals; a difficult question should not penalize a learner as strongly as an easy foundational question.
- Suggested initial weakness inputs:
  - distinct-question error rate;
  - recent consecutive mistakes;
  - performance after the latest revision;
  - question difficulty;
  - response-time anomaly;
  - evidence/sample-size confidence.
- Suggested first-version trigger: add a weak-topic recommendation only when the evidence threshold is met and the normalized weakness score crosses a configurable threshold.
- Store the calculated score, score version, contributing signals and calculation time so recommendations are explainable and reproducible.
- Remove or lower the recommendation after sufficient correct performance; do not leave resolved weak topics permanently in the to-do list.
- Add cooldown and deduplication rules so one concept cannot create several identical tasks on the same day.

### Admin-estimated study workload

- Let the Admin/content team specify estimated learning minutes for every topic. Use minutes as the canonical unit even if the UI displays hours.
- Prefer separate estimates for learning, note reading, practice and revision when available.
- Validate estimates with sensible minimum and maximum limits and record who changed them.
- Version workload estimates so an Admin edit does not unpredictably rewrite already-started plans.
- Treat the estimate as expected workload, not as the sole priority signal and not as a guarantee that every learner needs the same time.
- Later, compare estimated time with anonymized actual completion data and suggest estimate adjustments to Admins; do not silently change estimates without product approval.

### Learner planning inputs

- Store the learner's exam/course, exam date, timezone and available study minutes per weekday.
- Support temporary availability overrides for a specific date.
- Store completed topics, in-progress topics, syllabus prerequisites, recent revision history, weak concepts and incomplete prior tasks.
- Store course/exam weightage for subjects and topics when the content team provides it.
- Capture preferred session length or apply a safe default such as 25–45 minutes.
- Recalculate safely when a learner changes course, exam date or availability.

### Daily scheduling rules

- Do not build the plan from estimated hours alone.
- Calculate topic priority from a versioned, configurable formula combining:
  - exam importance/weightage;
  - weakness score and confidence;
  - urgency based on days remaining;
  - syllabus and prerequisite status;
  - time since last study/revision;
  - unfinished-task carry-over;
  - available time for the day.
- Split large topics into bounded sessions rather than creating one multi-hour task. Example task types are learn fundamentals, read notes, solve practice questions and review mistakes.
- Fill the learner's available minutes without substantially exceeding them.
- Reserve part of the day for revision and weak-area recovery instead of filling all time with new syllabus coverage.
- Respect prerequisite order unless an urgent revision task explicitly overrides it.
- Prefer a small achievable list over a long backlog. Configure a maximum number of daily tasks.
- Carry incomplete tasks forward with controlled priority; do not endlessly duplicate or increase their urgency.
- Avoid repeatedly recommending the same disliked/skipped topic without explaining why or offering a reschedule choice.
- Mark every generated plan with an algorithm/version identifier so behavior can be audited after scoring changes.

### To-do task model and lifecycle

- Persist generated plans by learner and local calendar date.
- Each task should include `taskId`, task type, course/subject/topic/concept IDs, title, reason, planned minutes, priority, source signals, status and due date.
- Recommended statuses: `planned`, `in_progress`, `completed`, `skipped`, `rescheduled`, `expired` and `replaced`.
- Store completion time and actual minutes separately from planned minutes.
- Preserve historical daily plans instead of regenerating them destructively.
- When recalculation is necessary, retain completed tasks and record which pending tasks were replaced and why.
- Make completion idempotent so repeated requests cannot double-award streak points or progress.

### Explainability returned to mobile

- Every recommended task must include a short reason suitable for UI display, for example:
  - `Needs attention: 4 of the last 5 questions were incorrect`;
  - `Continue your 45-minute unfinished session`;
  - `Exam-priority topic with 43 days remaining`;
  - `Revision due: last studied 12 days ago`.
- Return the planned duration, priority category and source (`weak_area`, `syllabus_plan`, `revision_due`, `carry_over` or `manual`).
- Never expose internal model parameters or other learners' data.

### Learner controls

- Allow the learner to mark a task complete, start it, skip it, reschedule it or add a manual task.
- Require a lightweight reason only when repeated skips would materially improve future scheduling; do not make every skip burdensome.
- Let learners adjust daily availability and regenerate only the remaining plan.
- Allow learners to disable adaptive weak-area tasks while still showing a clear consequence for plan quality.
- Provide an undo window for accidental completion where product rules allow it.

### Suggested backend endpoints

- `GET /learners/me/study-plan/today` — return today's stable generated plan and summary.
- `POST /learners/me/study-plan/generate` — generate when no plan exists or explicitly regenerate remaining tasks.
- `PATCH /learners/me/study-plan/tasks/:taskId` — start, complete, skip or reschedule one task.
- `GET /learners/me/weak-concepts` — paginated concept evidence and recommendation state.
- `GET/PATCH /learners/me/study-availability` — read or update recurring availability and date overrides.
- `GET /learners/me/study-plan/history` — paginated historical plans for reports.
- Protect all endpoints with the authenticated learner identity and never accept a learner ID from the client as authorization.

### Recalculation events and processing

- Recalculate weak-concept evidence asynchronously after a submitted practice answer.
- Generate the next daily plan shortly before the learner's day begins, or lazily on first open if no plan exists.
- Consider a bounded update to today's remaining tasks after a meaningful weakness change; do not reorder the plan after every single answer.
- Trigger a full future-plan recalculation after exam-date, course, syllabus, availability or Admin workload changes.
- Use idempotent jobs and locking so simultaneous app opens cannot create duplicate plans.
- Cache the current plan for fast app startup while keeping the database authoritative.

### Product safeguards and edge cases

- Handle new learners with no practice history by using syllabus order, prerequisites, exam weightage and available time.
- Handle insufficient weak-area evidence without presenting uncertain conclusions as facts.
- Handle missing Admin duration estimates with a clearly defined default and flag the content for correction.
- Handle exam dates in the past, missing timezone, zero available minutes and course changes.
- Avoid impossible schedules when remaining estimated workload exceeds remaining available time; show a realistic coverage warning instead.
- Do not punish learners for repeated technical retries, abandoned sessions or questions later invalidated by Admins.
- Exclude archived/deleted content from future plans while retaining historical references safely.

### Validation and acceptance criteria

- A single wrong answer does not immediately create a weak-topic to-do.
- Multiple wrong answers across distinct questions in the same concept can create one deduplicated recommendation after the configured threshold.
- Correct performance after study lowers the weakness score and eventually removes the recommendation.
- A topic estimated at several hours is split into multiple achievable sessions.
- Generated task minutes fit within the learner's configured daily availability, allowing only a small documented rounding tolerance.
- Completed tasks remain completed after regeneration and never award points twice.
- Free/Paid entitlements are applied consistently if adaptive analytics or reports differ by plan.
- Plans remain stable after an authorized device recovery/replacement and do not depend on local app storage.
- Unit tests cover scoring, thresholds, decay, deduplication, prerequisite ordering, available-time packing and carry-over.
- Integration tests cover practice submission through weak-area recalculation and next-plan generation.
- Load tests cover daily generation for the expected learner population.
- Add monitoring for generation failures, empty-plan rate, recommendation completion/skip rate and estimate-versus-actual duration error.

## Monthly reports

- [x] Aggregate study time, goal days, streak activity, notes completed, revisions, completed study-plan tasks and syllabus progress by learner calendar month.
- [x] Store immutable completed-month snapshots; compute the current month as a live partial report.
- [x] Provide a month archive and month-detail endpoint.
- [x] Handle learner timezone when assigning timestamped activity to a month.
- [x] Restrict report history to learners with an active Paid entitlement.
- [x] Define loading, empty, current-live, frozen-history and unavailable UI states.
- [ ] Add a scheduled month-close worker so snapshots are proactively created without waiting for the learner's first archive request.
- [ ] Add historical note-completion event provenance if the product must preserve completion followed by later reopening before the month is frozen.
- [ ] Add question counts, accuracy and weak-concept sections only after Practice development resumes; do not infer them from incomplete data.
- [ ] Add subject-level monthly drill-down only if the final report UX requires it.

## Exam-date normalization

- Keep exam month and year mandatory during learner personalization.
- If the exact day is omitted, normalize it to day `1` of the selected month.
- Validate the normalized date on the server and return one canonical ISO date.
- Recalculate resource expiry and exam countdown safely when a learner changes their exam date.
- Decide whether changing an exam date can extend already-issued paid entitlements and add abuse controls if required.

## Admin web work

- Add validity controls to the website resource-creation flow; mobile Admin remains read-only for uploads.
- Show a clear preview of how the selected validity policy resolves against a learner exam date.
- Add filters for active, expiring and expired resources.
- Add audit events for resource creation, validity edits, entitlement grants and revocations.
- Add required topic/concept tagging and validation to question creation/editing.
- Add estimated study-time fields to every topic, optionally split by learning, reading, practice and revision.
- Add exam-weightage and prerequisite controls where relevant.
- Add a preview explaining how content metadata can influence learner plans.
- Add audit history for topic duration, weightage, prerequisite and question-tag changes.

## Production verification

- Add authorization tests covering Free/Paid and active/expired combinations.
- Add clock-boundary tests around timezone, month-end, exam date and expiry timestamps.
- Add analytics aggregation tests and retry/explanation permission tests.
- Confirm API responses never expose protected content or explanations to ineligible users.

## Notifications and reminders — implemented in code, deployment pending

- [x] Register/revoke a learner's Expo push token per app installation.
- [x] Persist a learner notification inbox independently of device delivery.
- [x] Persist category preferences for broadcasts, daily plans, revisions, resource expiry, streak risk, security and account events.
- [x] Respect quiet hours in the learner timezone; urgent security alerts bypass quiet hours.
- [x] Fan out the existing Admin website Publish/Schedule broadcast workflow into learner inbox and durable push deliveries without replacing the Admin UI.
- [x] Generate deterministic daily-plan, revision-due, seven-day resource-expiry and streak-risk reminders.
- [x] Create security alerts for password/Google sign-in and account alerts for profile changes.
- [x] Retry failed push deliveries in the existing durable worker and revoke Expo tokens reported as `DeviceNotRegistered`.
- [x] Add mobile foreground presentation, notification-tap routing and Account preference controls.
- [ ] Review and apply migration `20260827130000_add_mobile_notifications` through the coordinated shared-database deployment process.
- [ ] Configure `EXPO_PUBLIC_EAS_PROJECT_ID`, Android FCM V1 credentials, iOS APNs credentials and optional `EXPO_ACCESS_TOKEN` in each deployed environment.
- [ ] Test remote push using an Expo development/release build; Android Expo Go cannot receive remote pushes on SDK 57.
- [ ] Add provider receipt reconciliation if production analytics must distinguish Expo ticket acceptance from final FCM/APNs delivery.

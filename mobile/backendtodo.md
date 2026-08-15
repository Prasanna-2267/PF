# Parallax Flow backend integration backlog

This file records server-side work intentionally deferred while the React Native application is being reviewed as a UI-only prototype. The mobile UI may use local demo data for these states, but none of the rules below should be considered authoritative or secure until the backend enforces them.

## Subscription and entitlement

- Add an authoritative learner plan field (`free` or `paid`) sourced from completed payment/subscription records.
- Return current plan, activation date, renewal/end date and entitlement version with the authenticated user/session response.
- Never trust a plan value sent by the mobile client.
- Define upgrade, expiry, refund, cancellation and grace-period behavior.
- Add entitlement checks to protected notes, infographics, question banks, explanations, retries, weak-area analytics and monthly reports.

## Resource validity and expiry

- Add resource types for standard notes, infographic notes and question banks.
- Add an Admin-configurable validity policy while creating a resource.
- Confirm the expiry formula: recommended default is `learner exam date + admin-configured offset days`; support explicit absolute expiry only if product policy requires it.
- Store the calculated authoritative `expiresAt` for every learner-resource entitlement.
- Enforce expiry on every resource metadata/content request; do not rely on device time or local storage.
- Return safe UI states: `active`, `expiring_soon`, `expired`, `revoked`, plus server time and `expiresAt`.
- Prevent expired secure PDFs/assets from being reused through stale signed URLs or cached authorization.
- Log Admin validity changes and learner expiry events in the audit trail.

## Practice permissions and explanations

- Tag every question with course, category, subject, chapter/topic and concept identifiers.
- For Free users, return an explanation only after a correct response.
- For Paid users, return an explanation after every submitted response.
- For Free users, reject repeat attempts after an incorrect submission when the configured policy is one-attempt-only.
- For Paid users, allow repeat attempts and persist each attempt in order.
- Return attempt number, correctness, retry eligibility and explanation eligibility from the answer endpoint.
- Ensure restricted explanations are never included in payloads sent to ineligible Free users.

## Concept-wise weak areas

- Persist answer history with question, concept, correctness, attempt number, response time and timestamp.
- Define the weakness score using accuracy, recency, attempt count and response time.
- Require a minimum sample size before labelling a concept weak.
- Expose subject/chapter/concept breakdowns and recommended next-practice targets.
- Recalculate analytics asynchronously after practice submissions.

## Adaptive daily to-do and study-plan engine

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
- Plans remain stable across devices and app reinstalls.
- Unit tests cover scoring, thresholds, decay, deduplication, prerequisite ordering, available-time packing and carry-over.
- Integration tests cover practice submission through weak-area recalculation and next-plan generation.
- Load tests cover daily generation for the expected learner population.
- Add monitoring for generation failures, empty-plan rate, recommendation completion/skip rate and estimate-versus-actual duration error.

## Monthly reports

- Aggregate study time, goal days, streak activity, notes completed, revisions, questions solved, accuracy and weak concepts by calendar month.
- Store immutable monthly snapshots so historical reports do not change unexpectedly.
- Provide a paginated month archive and a month-detail endpoint.
- Handle learner timezone when assigning activity to a month.
- Restrict full report history to Paid users according to entitlement policy.
- Define empty, partial-current-month and unavailable-data responses.

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

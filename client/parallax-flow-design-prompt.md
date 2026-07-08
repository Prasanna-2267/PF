# Parallax Flow --- MVP-Aware Product Design System & Master UI/UX Prompt

## 1. Product Reality

Design **Parallax Flow** around the product that exists today.

Parallax Flow is a mobile-first exam-preparation and secure digital
study-content platform. Students browse a hierarchical syllabus, open
free lessons, purchase paid PDF lessons or curated lesson packages,
study protected documents in a secure canvas-based viewer, track
completion and revision activity, run study sessions, monitor exam
readiness, answer practice questions, receive grading feedback, manage
purchases and receipts, and configure personal study targets.

The product also contains a full desktop-capable administration system
for managing the content hierarchy, lessons, packages, coupons,
questions, and audit history.

Do not design Parallax Flow as a generic video-course marketplace. The
MVP is primarily about:

1.  structured exam and syllabus navigation;
2.  secure PDF-based learning;
3.  paid lesson and package access;
4.  progress, revision, and study discipline;
5.  question practice and grading feedback;
6.  trustworthy payments and permanent entitlements;
7.  dense but usable content administration.

The visual system must support both focused studying and commerce
without making either side feel secondary.

------------------------------------------------------------------------

## 2. Experience Principles

Every design decision should reinforce these principles.

### Clarity before decoration

Students often arrive with a specific task: continue a lesson, find
notes for a subject, practise questions, revise completed material, or
check readiness. The UI must make these actions immediately visible.

### Progress should feel tangible

Completion, revisions, study minutes, streak, Momentum, syllabus
percentage, exam countdown, and pressure are real product concepts.
Present them as one coherent readiness system rather than unrelated
dashboard statistics.

### Security without hostility

The secure PDF viewer has strong anti-piracy controls. The visual
experience should still feel like a premium reading environment.
Security warnings should be calm, concise, and contextual.

### Commerce with trust

Clearly distinguish free lessons, individually purchasable lessons,
owned lessons, package access, discounts, pending orders, failed orders,
and paid orders.

### Mobile-first, desktop-native

Mobile is the primary interaction model. Desktop must become an
intentional information-dense workspace rather than a widened phone
layout.

------------------------------------------------------------------------

## 3. Brand Foundation

The visual identity comes from the existing Parallax Flow eye symbol and
navy/gold wordmark.

Brand attributes:

-   intelligent;
-   observant;
-   precise;
-   premium;
-   disciplined;
-   trustworthy;
-   focused;
-   modern;
-   calm under pressure.

Use the logo's visual language abstractly through:

-   eye-shaped arcs;
-   concentric progress rings;
-   lens-like circular framing;
-   perspective lines;
-   subtle radial gradients;
-   flowing navy curves;
-   small controlled gold highlights.

Do not place literal eye artwork repeatedly throughout the interface.

------------------------------------------------------------------------

## 4. Colour Tokens

### Core navy and indigo

  Token          Hex         Usage
  -------------- ----------- --------------------------------------
  `navy-950`     `#10162F`   deepest dark background
  `navy-900`     `#18234A`   dark cards, desktop navigation
  `navy-800`     `#252B69`   primary logo-derived brand colour
  `indigo-700`   `#343D86`   active navigation and pressed states
  `indigo-600`   `#4654A3`   primary interactive accent
  `indigo-500`   `#5B68BC`   secondary interactive accent
  `indigo-100`   `#E9ECF8`   selected surfaces
  `indigo-50`    `#F5F6FC`   subtle branded page surface

### Signature gold

  Token        Hex         Usage
  ------------ ----------- -----------------------
  `gold-700`   `#8E672B`   accessible gold text
  `gold-600`   `#A87935`   active premium accent
  `gold-500`   `#B38A4A`   primary logo gold
  `gold-400`   `#C9A76A`   decorative highlights
  `gold-100`   `#F4EAD8`   premium badge surface
  `gold-50`    `#FBF7EF`   subtle warm surface

### Neutral system

  Token           Hex
  --------------- -----------
  `ink-950`       `#11131A`
  `ink-800`       `#292D3A`
  `ink-600`       `#5F6677`
  `ink-500`       `#7B8292`
  `ink-400`       `#9BA1AF`
  `line-200`      `#E4E7EE`
  `line-100`      `#EEF0F5`
  `surface-100`   `#F7F8FB`
  `surface-50`    `#FBFBFD`
  `white`         `#FFFFFF`

### Semantic states

-   success: `#238A5A`
-   success surface: `#EAF7F0`
-   warning: `#B7791F`
-   warning surface: `#FFF7E5`
-   danger: `#C2414B`
-   danger surface: `#FDEDEF`
-   info: `#3569B8`
-   info surface: `#EAF1FC`

Pressure meter semantics:

-   Low: success family;
-   Medium: warning family;
-   High: danger family.

Never communicate pressure, payment status, publication status, or
question correctness by colour alone.

### Dark theme

Dark mode is a real platform feature and must be designed, not
automatically inverted.

Recommended foundation:

-   app background: `#0D1226`;
-   elevated surface: `#151C36`;
-   card surface: `#1B2342`;
-   primary text: `#F5F6FA`;
-   secondary text: `#B9C0D2`;
-   border: `#303958`;
-   primary accent: lighter indigo `#7C88DA`;
-   gold accent: `#C9A76A`.

PDF page content itself should preserve document rendering fidelity.
Dark theme may darken the surrounding reader chrome without
destructively recolouring the source document.

------------------------------------------------------------------------

## 5. Typography

Use a highly readable modern sans-serif such as **Manrope**, **Plus
Jakarta Sans**, or **Inter** for product UI.

The logo wordmark remains its own SVG asset.

Mobile hierarchy:

-   hero/display: 34--40px, 700;
-   page title: 28--32px, 700;
-   section heading: 20--24px, 650--700;
-   card title: 16--18px, 600--700;
-   body: 14--16px, 400--500;
-   metadata: 12--13px, 500;
-   badge: 11--12px, 600.

Desktop hierarchy:

-   hero: 48--64px;
-   page title: 36--44px;
-   section title: 24--30px;
-   card title: 17--20px;
-   body: 15--17px.

Use tabular numerals for timers, countdowns, scores, prices, and receipt
totals where supported.

------------------------------------------------------------------------

## 6. Responsive Layout System

### Phone: 320--767px

-   single-column primary flow;
-   16px page gutters, increasing to 20px on larger phones;
-   bottom navigation;
-   bottom sheets for filters and secondary actions;
-   sticky purchase bars where relevant;
-   44px absolute minimum touch targets;
-   48--52px preferred control height.

### Tablet: 768--1023px

-   24--32px gutters;
-   2-column catalogue layouts;
-   adaptive navigation;
-   side sheets where appropriate;
-   split layouts for selected lesson and tracker experiences.

### Desktop: 1024px+

-   12-column grid;
-   maximum content width around 1280--1440px;
-   top navigation or left sidebar depending on context;
-   persistent filter rail for catalogue-heavy pages;
-   3--5 column card grids;
-   split content/detail layouts;
-   sticky side panels;
-   data tables for admin operations.

### Wide desktop: 1440px+

Increase whitespace rather than endlessly widening forms, cards, or
reading content.

------------------------------------------------------------------------

## 7. Student Information Architecture

Primary student navigation:

1.  **Home**
2.  **Notes**
3.  **Practice**
4.  **Tracker**
5.  **Library**

Profile, settings, receipts, theme, and account controls live under the
account area.

On narrow mobile screens, consider four primary bottom items plus a
clearly labelled More/Profile destination if five items become cramped.
Do not use ambiguous icon-only navigation.

------------------------------------------------------------------------

## 8. Authentication and Account Flows

### Signup

Fields:

-   name;
-   email;
-   phone;
-   password with minimum-eight-character guidance.

Design a simple vertical mobile form with:

-   logo;
-   concise product value statement;
-   persistent field labels;
-   password visibility toggle;
-   validation near the relevant field;
-   primary Create Account action;
-   optional Continue with Google only when available;
-   Login link.

### OTP verification

The verification screen must communicate:

-   which email is being verified;
-   six-digit code input;
-   resend state and countdown;
-   clear invalid/expired code feedback;
-   safe recovery if browser-bound verification state is unavailable.

Do not expose implementation details such as the anti-takeover cookie in
ordinary UI copy.

### Login

Support:

-   email;
-   password;
-   Continue with Google when configured;
-   forgot password;
-   automatic routing to verification when needed.

### Session displacement

Because only one active device is permitted, create a dedicated
forced-logout state:

> Your account was signed in on another device.

Provide a clear **Sign in again** action. Avoid frightening security
language unless there is actual evidence of compromise.

### Phone gate

If a user reaches protected PDF content without a phone number, use a
focused completion flow explaining that a verified contact number is
required before secure content can open. Preserve the user's intended
destination and return them to the lesson after successful completion.

------------------------------------------------------------------------

## 9. Hierarchical Content Discovery

The real content structure is:

**Exam Category → Stage → Subject → nested Sub-subjects of unlimited
depth → Lessons**

The design must handle this hierarchy without assuming a fixed number of
subject levels.

### Mobile

Use:

-   compact Exam selector;
-   Stage selector;
-   expandable recursive subject tree;
-   breadcrumbs or contextual parent labels;
-   visible lesson count where useful;
-   clear selected-node treatment.

The recursive subject navigator should support deep nesting without
excessive horizontal indentation. After 2--3 visible levels, consider a
drill-in navigation model rather than continuously indenting content.

### Desktop

Use a three-region catalogue layout where useful:

-   left: category/stage and recursive subject tree;
-   centre: lessons/content;
-   optional right: contextual progress, package, or purchase
    information.

Keep the cascade consistent across Notes, Practice, Tracker, and admin
tools.

------------------------------------------------------------------------

## 10. Notes and Lesson Listing

Each lesson row/card may display:

-   title;
-   secured PDF or Government Link type;
-   page count or Government Link label;
-   Free price state;
-   ₹ price;
-   Owned state;
-   Locked state;
-   Done state;
-   revision count such as `3× revised`;
-   published visibility only for admin;
-   primary contextual action.

State priority must be obvious.

Recommended action logic:

-   free PDF → Open;
-   purchased PDF → Continue/Open;
-   paid unowned PDF → Buy;
-   external government link → Visit resource;
-   completed lesson → still allow Open and Revise;
-   locked state → explain how access is obtained.

Use compact horizontal lesson rows on mobile rather than oversized
visual course cards for every PDF.

------------------------------------------------------------------------

## 11. Lesson Detail and Purchase Context

Before purchase, provide enough information to decide:

-   lesson title;
-   location in Exam/Stage/Subject hierarchy;
-   PDF page count or external-link type;
-   price;
-   package inclusion if applicable;
-   ownership state;
-   concise description if content metadata supports it;
-   progress/revision state for owned lessons.

For package alternatives, clearly communicate:

> Buy this lesson for ₹X\
> or get it with Package Y for ₹Z

Do not manipulate students with artificial urgency.

------------------------------------------------------------------------

## 12. Secure PDF Viewer

The secure viewer is a core differentiator.

### Experience goals

The viewer must feel:

-   focused;
-   fast;
-   premium;
-   safe;
-   minimally distracting.

### Mobile viewer chrome

Top bar:

-   Back;
-   compact title;
-   page position;
-   overflow menu only for legitimate actions.

Reading controls:

-   zoom out;
-   current zoom value;
-   zoom in;
-   mark complete / undo completion;
-   Revise action where appropriate.

Pages load lazily and should have:

-   skeleton/loading state;
-   retry state;
-   clear unavailable state.

### Watermark-aware layout

The UI must account for per-user forensic watermarking across document
pages. Do not add competing decorative overlays over the document.

### Security deterrent UX

The implementation blocks or reacts to right-click, selection, drag,
save, print, screenshot attempts, devtools shortcuts, focus loss, and
tab switching.

Design requirements:

-   do not permanently fill the interface with aggressive anti-piracy
    warnings;
-   use one concise notice when the secure viewer is first opened;
-   when the view is intentionally obscured because focus is lost, show
    a calm privacy/security overlay;
-   if screenshot deterrence is triggered, recover predictably;
-   do not imply absolute screenshot prevention.

Suggested tone:

> Protected study material\
> This content is personalised and watermarked for your account.

### Desktop reader

Use:

-   central canvas column;
-   compact sticky toolbar;
-   page navigation;
-   zoom controls;
-   completion/revision actions;
-   optional collapsible page navigator if technically supported.

Do not add unsupported annotation, text search, or thumbnail features
merely because other PDF readers have them.

------------------------------------------------------------------------

## 13. Commerce and Checkout

The MVP supports:

-   individual lesson purchases;
-   admin-curated lesson packages;
-   percent coupons;
-   flat-value coupons;
-   scoped coupons;
-   zero-total coupon access;
-   Razorpay checkout;
-   buy-once, own-forever entitlement.

### Checkout UX

Show:

-   item or package;
-   included lesson count for packages;
-   subtotal;
-   coupon field;
-   discount;
-   final total;
-   access terms;
-   primary payment action.

If a coupon reduces the total to zero, change the primary action from
payment language to a clear access-grant action such as **Claim
access**.

### Payment states

Design explicit states for:

-   preparing checkout;
-   payment in progress;
-   payment confirmation pending;
-   paid;
-   failed;
-   retryable failure;
-   access granted by full discount.

Do not expose idempotency or webhook mechanics to students, but design
retry flows so repeated clicks do not appear to create multiple
purchases.

------------------------------------------------------------------------

## 14. Packages

Package cards must show:

-   package title;
-   lesson count;
-   relevant exam/stage context where available;
-   price;
-   owned state;
-   short list or preview of included lessons;
-   View Package action.

Package detail:

-   title;
-   price;
-   included lessons;
-   subject grouping;
-   ownership coverage;
-   Buy Package action;
-   clear indication if the user already owns some lessons, without
    promising prorated pricing unless implemented.

------------------------------------------------------------------------

## 15. Coupons

Coupon interaction should be simple.

States:

-   empty;
-   validating;
-   applied;
-   invalid;
-   expired;
-   usage limit reached;
-   not applicable to current item.

Show the exact financial effect after application.

Never make the coupon field visually more prominent than the purchase
itself.

------------------------------------------------------------------------

## 16. My Library and Orders

The current Library is commerce/history-oriented and must reflect actual
capabilities.

Top summary:

-   owned lesson count;
-   clear access to owned learning material;
-   order history.

Order rows/cards:

-   receipt number if available;
-   date/time;
-   item/package;
-   amount;
-   status: paid, created, failed;
-   View Receipt when available.

Mobile uses stacked order cards. Desktop uses a responsive table with a
detail view.

Avoid presenting a Saved/Favourites feature unless it is actually
implemented.

------------------------------------------------------------------------

## 17. Receipt Design

Receipt pages must feel immutable and trustworthy.

Include:

-   Parallax Flow identity;
-   receipt number such as `PF-2026-0042`;
-   payment date;
-   billed-to information;
-   line items;
-   subtotal;
-   discount;
-   final total;
-   payment reference;
-   Print / Save PDF action.

Design print CSS separately:

-   white background;
-   no navigation;
-   clean typography;
-   black/neutral body text;
-   brand colour used sparingly;
-   page-break-safe line items.

------------------------------------------------------------------------

## 18. Home Dashboard

The dashboard should answer:

1.  What should I study next?
2.  How much have I studied today?
3.  How close am I to my exam?
4.  How much of my syllabus is complete?
5.  Am I maintaining momentum?

Recommended mobile order:

1.  greeting and compact profile controls;
2.  exam countdown;
3.  Continue Studying;
4.  today's study target progress;
5.  Momentum;
6.  syllabus completion;
7.  streak and revisions;
8.  pressure indicator;
9.  relevant next lessons or practice entry points.

### Metric definitions shown in UI

-   Daily Target: today's studied minutes versus target;
-   Streak: consecutive study continuity;
-   Momentum: score from 0--100;
-   Syllabus: completed lessons / total lessons in active stage;
-   Revisions: cumulative revision count;
-   Pressure: Low, Medium, or High based on exam proximity and remaining
    syllabus.

Do not put all metrics into equal-sized colourful cards. Establish
hierarchy.

### Continue Studying

This should be one of the strongest dashboard actions and show:

-   last-opened lesson title;
-   subject context;
-   progress/completion state if available;
-   Resume action.

------------------------------------------------------------------------

## 19. Study Timer and Tracker

### Timer

The check-in/check-out model should feel like a focused study session.

Idle state:

-   today's accumulated minutes;
-   daily target;
-   Check In / Start Studying action.

Active state:

-   prominent elapsed timer;
-   current session state;
-   Check Out / End Session;
-   daily progress.

Because stale sessions auto-close after eight hours, design recovery
messaging for an automatically ended session without requiring technical
explanation.

### Tracker settings

Support:

-   exam date;
-   exam label;
-   daily target from 5--1440 minutes;
-   active stage.

Explain that active stage drives syllabus completion calculations.

Mobile: dedicated settings screen or bottom sheet depending on
complexity.

Desktop: side panel or settings card.

------------------------------------------------------------------------

## 20. Exam Countdown and Pressure

Treat countdown and pressure as related but distinct.

Countdown:

-   days remaining;
-   exam label;
-   date.

Pressure:

-   Low;
-   Medium;
-   High;
-   short contextual explanation.

Avoid anxiety-inducing animation, flashing red UI, or shame-oriented
language.

High pressure should encourage a concrete action, for example:

> 18 days left with 42% of the syllabus remaining. Continue your next
> incomplete subject.

------------------------------------------------------------------------

## 21. Practice Question Bank

The practice experience uses the same Exam → Stage → Subject filtering
model.

Question types:

-   MCQ;
-   Short Answer;
-   Long Answer.

### Practice landing

Show:

-   filters;
-   total attempts;
-   average score percentage;
-   MCQ accuracy;
-   question list or practice entry point.

### MCQ interaction

States:

-   unanswered;
-   selected;
-   submitting;
-   correct;
-   incorrect;
-   answered with explanation.

After submission:

-   clearly show selected answer;
-   clearly show correct answer;
-   reveal explanation if available;
-   provide Try Again.

### Written answers

For Short and Long Answer:

-   comfortable text input;
-   max score context;
-   submit state;
-   grading state;
-   result score;
-   AI graded or Auto graded label;
-   feedback;
-   optional model answer;
-   optional explanation;
-   Try Again.

Do not visually overstate AI certainty. The grading-source label should
be clear but secondary to actionable feedback.

------------------------------------------------------------------------

## 22. Practice Statistics

Use compact, meaningful metrics:

-   Total Attempts;
-   Average Score;
-   MCQ Accuracy.

Avoid decorative charts unless they add actual comparison or trend
information supported by data.

On mobile, use a compact metric strip or stacked summary. On desktop,
integrate stats with the question workspace rather than creating a
separate analytics dashboard without need.

------------------------------------------------------------------------

## 23. Theme Toggle

Light and dark themes exist everywhere.

Requirements:

-   persist preference;
-   respect OS preference before explicit user selection;
-   use a clear theme control in account/settings;
-   ensure all semantic states work in both themes;
-   ensure charts/progress bars retain contrast;
-   ensure PDF viewer chrome adapts independently from document content;
-   avoid pure black backgrounds for the main study experience.

------------------------------------------------------------------------

## 24. Admin Experience Overview

The admin system is a desktop-first operational workspace with
responsive support.

Separate admin authentication must be visually related to the brand but
clearly distinct from student login.

Admin navigation contains five primary areas:

1.  Content
2.  Packages
3.  Coupons
4.  Questions
5.  Audit

Admin and superadmin currently have equivalent capability. Do not design
permission-management screens that do not exist.

------------------------------------------------------------------------

## 25. Admin Content Management

The Content area must support the full hierarchy:

Exam Categories → Stages → Subjects → recursive Sub-subjects → Lessons.

### Desktop layout

Recommended:

-   left navigation/sidebar;
-   hierarchy tree panel;
-   main content table/panel;
-   contextual action toolbar;
-   drawer or dialog for create/edit operations.

### CRUD states

Support:

-   create;
-   rename/update;
-   publish;
-   unpublish;
-   delete;
-   blocked deletion when children exist.

Delete guards should explain the dependency:

> This subject cannot be deleted because it contains sub-subjects or
> lessons.

Do not use generic "Something went wrong" copy for known constraints.

------------------------------------------------------------------------

## 26. Admin Lesson Management

Per-subject lesson management supports:

-   PDF upload up to 50 MB;
-   automatic page count;
-   external link creation;
-   rename;
-   free/paid toggle;
-   price;
-   publish/unpublish;
-   delete.

### Upload UX

Include:

-   drag/drop on desktop;
-   file picker;
-   accepted PDF guidance;
-   50 MB maximum;
-   upload progress;
-   processing/page-count state;
-   success;
-   failure with retry.

External-link form must clearly distinguish the lesson type from PDF
upload.

Deletion should warn that associated student progress is removed when
that is the actual system behaviour.

------------------------------------------------------------------------

## 27. Admin Packages

Package management supports:

-   create package;
-   select lessons;
-   set price;
-   publish/unpublish;
-   delete.

Use a searchable lesson-selection interface that respects hierarchy.
Avoid a single giant checkbox list.

Package editor layout:

-   metadata form;
-   hierarchy browser;
-   selected-lessons panel;
-   price;
-   publication state;
-   summary.

------------------------------------------------------------------------

## 28. Admin Coupons

Coupon editor fields:

-   code;
-   percent or flat discount;
-   scope: all, packages, or subjects;
-   scoped target selection;
-   maximum uses;
-   expiry;
-   enabled/disabled.

Show status clearly:

-   Active;
-   Disabled;
-   Expired;
-   Usage limit reached;
-   Scheduled, if future activation semantics actually exist.

Do not invent coupon analytics not supported by the MVP.

------------------------------------------------------------------------

## 29. Admin Question Management

Question creation supports:

-   MCQ;
-   Short Answer;
-   Long Answer;
-   question text;
-   options for MCQ;
-   model answer;
-   difficulty;
-   maximum score;
-   publish/unpublish;
-   delete.

The editor should change contextually by question type.

MCQ editor:

-   add/remove options;
-   mark correct option;
-   validation requiring a valid answer.

Written question editor:

-   model answer;
-   max score;
-   explanation where supported.

Question deletion should clearly warn that attempts are purged.

------------------------------------------------------------------------

## 30. Admin Audit Log

Audit is read-only.

Display:

-   actor;
-   action;
-   resource;
-   status;
-   IP;
-   timestamp.

Support filtering by resource area.

Desktop: dense but readable table with sticky headers.

Mobile/tablet fallback: stacked audit records.

Use monospace selectively for technical identifiers and IP values.

Do not add edit/delete controls to audit records.

------------------------------------------------------------------------

## 31. Status Language System

Use consistent status badges.

### Lesson

-   Free
-   ₹ Price
-   Owned
-   Locked
-   Done
-   `N× revised`
-   PDF
-   Government Link

### Order

-   Paid
-   Created
-   Failed

### Publication

-   Published
-   Unpublished

### Coupon

-   Active
-   Disabled
-   Expired
-   Limit reached

### Question grading

-   AI graded
-   Auto graded

### Download/content

Only show download states if the student-facing implementation actually
supports offline download. Do not imply downloadable PDFs when secure
PDF access is intentionally canvas-based.

------------------------------------------------------------------------

## 32. Loading, Empty, Error, and Recovery States

Design intentional states for:

-   no published lessons;
-   no questions for current filters;
-   no orders;
-   no owned lessons;
-   invalid OTP;
-   expired reset code;
-   displaced session;
-   phone required;
-   PDF page load failed;
-   secure viewer unavailable;
-   payment failed;
-   payment confirmation pending;
-   invalid coupon;
-   tracker session auto-ended;
-   external provider unavailable;
-   AI grading fallback;
-   admin upload failed;
-   blocked hierarchy deletion.

Use skeletons for predictable content structures and spinners only for
short, contained operations.

------------------------------------------------------------------------

## 33. Motion

Use motion sparingly.

-   micro-interactions: 150--220ms;
-   sheets/dialogs: 220--320ms;
-   progress changes: smooth but restrained;
-   timer: no distracting pulsing;
-   correct/incorrect question feedback: subtle transition;
-   payment success: brief, professional confirmation;
-   reduced-motion support required.

Avoid decorative motion in the secure PDF reader.

------------------------------------------------------------------------

## 34. Accessibility

Target WCAG 2.2 AA principles.

Requirements:

-   44×44px minimum interactive targets;
-   visible keyboard focus;
-   persistent form labels;
-   accessible validation;
-   no colour-only state communication;
-   sufficient gold contrast;
-   logical headings;
-   semantic navigation;
-   keyboard-operable recursive trees;
-   accessible dialogs and sheets;
-   screen-reader labels for icon actions;
-   reduced-motion support;
-   zoom/text scaling support;
-   usable dark-mode contrast;
-   desktop tables with correct semantics.

------------------------------------------------------------------------

## 35. What Must Not Be Designed

Do not introduce unsupported product concepts into the MVP UI.

Do not design:

-   video-course playback;
-   live classes;
-   chat or student messaging;
-   social feeds;
-   educator storefronts unless backed by existing data;
-   ratings and reviews unless implemented;
-   favourites/saved notes unless implemented;
-   annotations inside PDFs unless implemented;
-   downloadable raw PDFs from secure lessons;
-   multiple-device session management;
-   role permission editor;
-   AI chat tutor;
-   unsupported analytics dashboards;
-   certificates;
-   gamified coins or XP;
-   arbitrary course completion certificates.

The design must improve the real MVP rather than silently inventing a
roadmap.

------------------------------------------------------------------------

## 36. Required Student Screen Set

Create designs for:

-   Splash
-   Login
-   Signup
-   OTP Verification
-   Forgot Password
-   Reset Password
-   Forced Logout / New Device Session
-   Phone Required
-   Home Dashboard
-   Notes Catalogue
-   Category and Stage Selection
-   Recursive Subject Navigation
-   Lesson List
-   Lesson Purchase Context
-   Package List
-   Package Detail
-   Checkout
-   Coupon States
-   Payment Processing
-   Payment Success
-   Payment Failure
-   Secure PDF Viewer
-   Secure Viewer Focus-Loss Overlay
-   Tracker
-   Active Study Session
-   Tracker Settings
-   Practice Landing
-   MCQ Question
-   Short Answer Question
-   Long Answer Question
-   Grading State
-   Grading Result
-   Library
-   Order History
-   Receipt
-   Profile
-   Account Settings
-   Theme Settings
-   Empty/Error/Loading states

Create representative mobile and desktop compositions for the major
flows.

------------------------------------------------------------------------

## 37. Required Admin Screen Set

Create:

-   Admin Login
-   Admin Shell
-   Content Hierarchy
-   Category CRUD
-   Stage CRUD
-   Recursive Subject CRUD
-   Lesson Management
-   PDF Upload
-   External Link Form
-   Package List
-   Package Editor
-   Coupon List
-   Coupon Editor
-   Question List
-   MCQ Editor
-   Written Question Editor
-   Audit Log
-   Delete Confirmation
-   Blocked Delete State
-   Upload Processing/Error states

Admin is desktop-first but must remain operational on tablet and narrow
screens.

------------------------------------------------------------------------

## 38. Component Inventory

Build a reusable component system containing:

-   App Header
-   Mobile Bottom Navigation
-   Desktop Navigation
-   Admin Sidebar
-   Breadcrumbs
-   Exam Selector
-   Stage Selector
-   Recursive Subject Tree
-   Lesson Row
-   Lesson State Badge
-   Price Display
-   Package Card
-   Metric Card
-   Momentum Indicator
-   Syllabus Progress
-   Daily Target Progress
-   Pressure Badge
-   Exam Countdown
-   Study Timer
-   Question Card
-   MCQ Option
-   Written Answer Field
-   Score Result
-   Feedback Panel
-   Checkout Summary
-   Coupon Input
-   Order Status Badge
-   Receipt Layout
-   PDF Viewer Toolbar
-   Secure Content Notice
-   Theme Toggle
-   OTP Input
-   Form Input
-   Password Input
-   Modal
-   Bottom Sheet
-   Drawer
-   Toast
-   Skeleton
-   Empty State
-   Error State
-   Data Table
-   Publish Toggle
-   File Upload
-   Audit Row

------------------------------------------------------------------------

## 39. Master Design Prompt

> Design a complete high-fidelity responsive product experience for
> **Parallax Flow**, a mobile-first exam-preparation platform built
> around structured syllabus navigation, secure paid PDF lessons, lesson
> packages, study tracking, revision tracking, question practice,
> grading feedback, payments, permanent content entitlement, receipts,
> and content administration.
>
> Design for the product that exists today. The content model is
> hierarchical: Exam Category → Stage → Subject → recursively nested
> Sub-subjects → Lessons. Student-facing areas are Home, Notes,
> Practice, Tracker, and Library. Lessons can be secured PDFs or free
> external government/ISM links. Secured PDF pages are delivered through
> a protected canvas viewer and contain personalised forensic
> watermarks. Students can complete lessons, undo completion, increment
> revision counts, purchase individual lessons or packages, apply
> coupons, view order history and immutable receipts, run study
> check-in/check-out sessions, configure an exam date and daily target,
> monitor streak, Momentum score, syllabus completion, revision total,
> exam countdown and Pressure level, and practise MCQ, short-answer, and
> long-answer questions with grading feedback.
>
> Use the existing Parallax Flow identity: deep navy `#252B69`, darker
> navy `#18234A`, supporting indigo `#4654A3`, restrained warm gold
> `#B38A4A`, deeper accessible gold `#8E672B`, white, and cool neutral
> surfaces. The visual personality is intelligent, observant, premium,
> disciplined, calm, and trustworthy. Translate the eye-logo idea into
> restrained arcs, rings, perspective lines, and lens-like forms rather
> than repeating literal eye graphics.
>
> Build true light and dark themes. Dark mode must use intentionally
> selected surfaces and text colours rather than automatic inversion.
> Keep PDF document rendering visually faithful while adapting
> surrounding viewer chrome.
>
> Prioritise 320--430px mobile screens with 16--20px gutters,
> thumb-friendly controls, 44px minimum targets, bottom navigation,
> bottom sheets, compact lesson rows, clear purchase actions, and strong
> vertical hierarchy. At desktop widths, transform the product into
> deliberate 12-column compositions with capped content width, proper
> navigation, recursive filter trees, split content/detail layouts,
> sticky contextual panels, dense admin tables, and keyboard-accessible
> interactions. Never render desktop as a centred mobile column.
>
> Make the Home dashboard action-oriented. Prioritise Continue Studying,
> exam countdown, today's target, Momentum, syllabus completion, streak,
> revisions, and Pressure. Do not create a wall of equal colourful
> statistic cards. Present readiness as a coherent system and use
> Pressure language responsibly.
>
> Make Notes discovery efficient. Reuse consistent Exam and Stage
> selectors plus a recursive subject navigation model. Lesson rows must
> clearly distinguish PDF versus Government Link, free versus priced,
> owned versus locked, completed state, revision count, and page count.
> Deep subject trees must remain usable at unlimited depth without
> endless indentation.
>
> Treat the secure PDF viewer as a core premium product surface. Use
> minimal reader chrome, clear page loading states, zoom from 0.5× to
> 3×, completion and revision actions, and calm protected-content
> messaging. Account for personalised watermarking. Provide a tasteful
> focus-loss privacy overlay and predictable recovery from security
> deterrent states. Do not claim impossible absolute screenshot
> prevention and do not add unsupported reader capabilities.
>
> Design trustworthy Razorpay purchase flows for individual lessons and
> packages. Support coupon application, percent and flat discounts,
> scoped coupons, zero-total access claims, pending confirmation,
> success, failure, and retry. Communicate buy-once, own-forever access
> clearly. Keep prices and discounts transparent.
>
> Design Library around actual owned lessons and order history. Show
> paid, created, and failed order states. Create a professional receipt
> view with sequential receipt number, billed-to information, line
> items, discount, final total, payment reference, and print/save-PDF
> action.
>
> Design Tracker around real check-in/check-out study sessions, today's
> minutes, target progress, active timer, stale-session recovery, exam
> date, exam label, daily target, active stage, streak, Momentum,
> syllabus percentage, revisions, countdown, and Pressure. Encourage
> useful next actions without anxiety-driven visuals.
>
> Design Practice around the shared Exam → Stage → Subject filters.
> Support MCQ instant grading with correct/incorrect feedback and
> Short/Long Answer submission with score, grading-source label,
> feedback, optional model answer, explanation, and Try Again. Show
> Total Attempts, Average Score, and MCQ Accuracy without inventing
> unsupported analytics.
>
> Create a separate desktop-first admin workspace with five areas:
> Content, Packages, Coupons, Questions, and Audit. Support full
> hierarchical content CRUD, publish/unpublish, guarded deletion, PDF
> upload up to 50 MB with processing and page count, external links,
> lesson pricing, package lesson selection, coupon configuration and
> scope, contextual MCQ/Short/Long question editors, and a read-only
> filterable audit log containing actor, action, resource, status, IP,
> and timestamp.
>
> Do not invent video learning, live classes, messaging, social feeds,
> ratings, favourites, PDF annotations, raw secure-PDF downloads,
> multi-device management, permission editors, AI tutors, certificates,
> or other roadmap features not present in the MVP.
>
> The final product should feel like a serious, premium exam-preparation
> platform: focused enough for long study sessions, efficient enough for
> frequent mobile use, trustworthy enough for payments and protected
> educational content, and structured enough for complex syllabus trees
> and operational administration.

------------------------------------------------------------------------

## 40. Final Review Checklist

Before approving a design, verify:

-   Is this screen based on an actual MVP capability?
-   Is the student's primary action obvious?
-   Does mobile work comfortably at 360px?
-   Is desktop intentionally recomposed?
-   Can the hierarchy handle arbitrary subject depth?
-   Are Free, Paid, Owned, Locked, Done, and Revised states
    distinguishable?
-   Does the PDF viewer feel focused rather than punitive?
-   Are security messages accurate and restrained?
-   Are payment and coupon states transparent?
-   Is permanent entitlement clear?
-   Does the dashboard prioritise action over decoration?
-   Are Momentum, Syllabus, Streak, Revisions, Countdown, and Pressure
    presented coherently?
-   Does Practice distinguish MCQ and written-answer behaviour?
-   Is AI grading represented without exaggerated certainty?
-   Does dark mode have intentional contrast?
-   Are admin workflows efficient for repeated operations?
-   Are destructive admin consequences clearly explained?
-   Are all controls keyboard accessible on desktop?
-   Are empty, loading, failure, and recovery states designed?
-   Has the design avoided unsupported roadmap features?
-   Does the result look unmistakably like Parallax Flow rather than a
    generic purple course app?

# Parallax Flow React Native rebuild

## Persistent handoff context

This repository contains the existing Parallax Flow web product in `client/` and its API in `server/`. The current task is to recreate the web UI as a React Native application, preserving real MVP behavior and the product visual identity rather than making a generic course app.

The mobile app will live in a new sibling folder, `mobile/`, so the existing Vite web client remains untouched and can continue to serve as the visual and behavior reference. It uses Expo, TypeScript, Expo Router, TanStack Query, Zustand, and React Native primitives. **The current delivery is UI-only:** local mock data and tappable prototype flows are used while visual design is reviewed. Server API, secure token storage, payments, realtime sessions, and other backend integration are intentionally deferred until UI approval.

### Existing product understood

- **Brand:** Parallax Flow; disciplined, calm, premium exam preparation. Deep navy `#252B69`, indigo `#4654A3`, warm gold `#B38A4A`, Manrope typography, intentional light and dark themes.
- **Student areas:** authentication; Home/Dashboard; Notes (exam → stage → recursive subjects → lessons); secure lesson viewer; Practice; Tracker; Library/orders/receipts; Account.
- **Student navigation:** mobile bottom tabs for Home, Notes, Practice, Tracker, and Library; account is reached from the top bar.
- **Core states:** free/paid/owned/locked lessons, completion/revisions, study check-in/out, countdown/targets/streaks, MCQ and written grading, purchase/coupon/payment states, immutable receipts, loading/empty/error/recovery states, displaced-session handling.
- **Admin:** separate administrative login and content, packages, coupons, questions, settings/broadcast, audit, students, and order workflows. It is desktop-first on the web; a native implementation will make operational screens usable on phone/tablet without inventing unsupported features.
- **Future server compatibility:** the existing client uses an authenticated Axios API client, Bearer access tokens, refresh endpoint, and socket-based single-device-session notification. Those contracts will be addressed only after the UI is finalised.

### Constraints and decisions

- Do not modify or replace `client/`; it is the source of truth for UI and interactions.
- Do not invent features excluded by the existing MVP, including video learning, chat, social feeds, raw secure-PDF downloads, annotations, certificates, or an AI tutor.
- Build in verified vertical slices. Each completed phase updates this file with concrete files, verification, and any decisions made, so another agent can resume without rediscovery.
- UI review must not require the backend. Each screen uses local, realistic Parallax Flow mock content and state transitions; mock data will later be replaced behind a stable UI-facing data boundary.
- Recreate native equivalents; web-only primitives such as DOM/CSS, browser local storage, HTML tables, and browser PDF/canvas cannot be copied verbatim.
- Final platform verification requires a JavaScript runtime/dependencies and, ideally, an Android/iOS emulator or device.

## Phased implementation plan

### Phase 0 — Discovery and project record (completed)

1. Inventory web routes, design tokens, shared UI components, assets, and API contracts.
2. Record the discovered context and phased plan in this file.
3. Confirm workspace cleanliness and decide the native project boundary.

**Exit criteria:** this document reflects the application scope and `mobile/` is confirmed as the implementation target.

### Phase 1 — Native app foundation (completed)

1. Scaffold the Expo + TypeScript app under `mobile/`.
2. Add navigation, query client, state store, local mock-data boundary, theme persistence, font loading, and environment configuration.
3. Implement brand tokens, reusable layout/safe-area handling, and baseline reusable components (button, card, input, badge, loading/empty/error states).
4. Make the visual prototype independently runnable without API configuration.

**Exit criteria:** the app starts, type-checks, and displays branded light/dark foundation screens without a running server.

### Phase 2 — Authentication and student shell (completed)

1. Implement splash, login, signup, OTP verification, password reset, and forced-logout screens with local UI state and demo entry actions.
2. Build native mobile top bar, bottom tabs, account entry, protected routes, and theme toggle.
3. Match validation, loading, error, and accessible control states from the web client.

**Exit criteria:** a reviewer can move through the authentication UI and reach the protected student shell without a backend.

### Phase 3 — Student dashboard and tracker (completed)

1. Recreate the action-oriented Home dashboard: study check-in/out, active timer, exam countdown, target progress, momentum/streak/revisions, notices, and primary actions.
2. Implement Tracker settings and active study-session behavior.
3. Use realistic mock tracker data and state transitions, retaining a replaceable data boundary for future API integration.

**Exit criteria:** tracker UI and state transitions render accurately on device without a server.

### Phase 4 — Notes, catalogue, and secure learning (completed)

1. Implement category/stage selection, recursive subject navigation, lesson rows, states, and lesson/package purchase entry points.
2. Recreate lesson viewer chrome and protected-content messaging with an appropriate native secure-document strategy.
3. Add completion/revision actions and focus-loss recovery where native APIs support it.

**Exit criteria:** reviewers can navigate a representative syllabus and open lessons with accurate visual entitlement states.

### Phase 5 — Practice, commerce, library, and account (completed)

1. Implement practice filters, MCQ answer feedback, written-answer submission/grading result, and statistics.
2. Implement lesson/package checkout, coupon states, payment processing/result surfaces, owned-library list, orders, and receipts.
3. Complete account/profile, avatar upload, phone number, study preference, appearance, and logout flows.

**Exit criteria:** all student tab flows are navigable with local mock data and consistent with the web experience.

### Phase 6 — Admin and production polish (completed for the UI-only prototype)

1. Implement native admin authentication and prioritized operational screens, adapting dense web tables into native lists and forms.
2. Add accessibility, responsive tablet layout, loading/error/empty audit, and platform-specific refinements.
3. Run type-check/lint/build checks, perform a manual visual comparison against `client/`, update this file, and document UI-only run instructions.

**Exit criteria:** the supported app scope builds cleanly, main paths are verified, and handoff documentation is current.

## Change log

| Date | Phase | Change | Verification |
| --- | --- | --- | --- |
| 2026-07-25 | 0 | Created persistent implementation context and phased plan. | Web client routes, design tokens, layouts, and representative page/API code inspected. |
| 2026-07-25 | 1 | Scaffolded `mobile/` as an Expo SDK 57 TypeScript app; added brand tokens, Manrope fonts, persistent theme provider, TanStack Query, Axios API client, auth state, and reusable native UI primitives. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Scope change | Switched delivery to a UI-only prototype with local mock data and no backend startup/configuration requirement. | Future API/auth/payment/realtime work is explicitly deferred until UI approval. |
| 2026-07-25 | 2 | Implemented UI-only login, signup, OTP, password recovery, forced-logout screens, a demo student session, branded student top bar, five-tab navigation, account/theme/logout controls, and representative tab previews. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed; web routes include all auth and student-shell paths. |
| 2026-07-25 | 3 | Recreated the action-oriented student dashboard and Tracker with a shared live mock study session, daily target, exam countdown/pressure, Momentum, streak, revision, syllabus, and Continue Studying/Practice surfaces. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Visual correction | Rebuilt the Home dashboard against the supplied final reference: full wordmark header, moon/avatar controls, proper outline tab icons, layered navy/gold check-in hero, overlapping orb, dotted action and exam-calendar cards, streak, notes CTA, and syllabus card. Added `expo-linear-gradient`, `react-native-svg`, and `lucide-react-native` for native visual fidelity. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Mobile refinement | Tightened the dashboard for phone scale: compacted all non-primary cards and header/nav, subdued background dots, constrained text to professional line breaks, and added spring, pulse, and Android-visible gold-halo feedback to the check-in control. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Hero correction | Reworked the check-in hero to match the supplied active-state reference: responsive 336px wide-screen hero, large layered blue orb, red square checkout affordance, unbroken single-line greeting, session-running copy, and restrained lower gold aura rather than an opaque yellow disc. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Card polish | Redesigned the Notes CTA to avoid overlapping visual elements, set readable dark-on-light syllabus tokens, and fixed action-card height/CTA baseline alignment. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | 4 | Built the UI-only Notes experience: selectors, resume context, subject catalogue, lesson free/owned/paid/locked/done/revised states, subject drill-in, protected-reader controls, and purchase context. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed; Notes, lesson, and purchase routes are bundled. |
| 2026-07-25 | 5 | Built local Practice MCQ/written feedback, owned Library and order history, receipts, purchase-success feedback, and expanded Account details/preferences. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed; receipt route is bundled. |
| 2026-07-25 | 6 | Built the UI-only admin workspace: admin entry, overview, content hierarchy, packages, coupons, questions, and audit log; added Account entry point and responsive admin navigation. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed; all admin routes are bundled. |
| 2026-07-25 | Focus-control redesign | Replaced the literal active check-in rendering with an original layered focus-session control: navy glass rings, restrained gold orbit, live-status chip, coral end-session action, and spring/pulse feedback. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Web control parity | Replaced the custom focus-control interpretation with a React Native translation of the existing web `SessionOrb`: target-derived gold progress ring, soft halo/sweep, nested navy shell, check-in/check-out label, round gold/red session button, and live clock. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Session-orb geometry fix | Corrected the React Native translation to use the web orb's measured mobile/large dimensions (196/228px shell and 180/212px ring) within an explicit centered inner canvas. This prevents the SVG progress ring from drifting over the timer and keeps all concentric layers aligned. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Exact SessionOrb hierarchy | Rebuilt the mobile control from the website component hierarchy: 196/228px gradient shell, 180/212px SVG progress ring, inset dashed lens ring, direct centered content, 64px gold/red session button, separately styled elapsed/target time, rotating gold sweep, idle/live glow, and local live clock. Removed the extra inner disc and the stale bare `glow` animation reference that crashed Expo Web. | `npm run lint` and `npx tsc --noEmit` passed with no warnings or errors. |
| 2026-07-25 | Expo Web compatibility | Replaced the progress circle's browser-incompatible SVG `rotation`/`origin` props with canvas rotation and numeric dash arrays, moved pointer events into styles, and disabled the native animation driver only on web. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Notes context cleanup | Removed the fixed UPSC and Prelims 2026 selector pills from Notes and the hardcoded course/category label in subject drill-in. Notes now communicate that they reflect the learner's selected course and category, ready for the selection context to supply catalogue data. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Protected PDF reader | Replaced the fake lesson page/zoom controls with one local five-page sample PDF. The reader scrolls continuously, supports pinch/double-tap zoom, removes manual page navigation and percentage controls, overlays the signed-in email watermark, and enables native screenshot/screen-recording protection while open. Native uses `react-native-pdf`; browser review uses the browser PDF surface. | `npm run lint`, `npx tsc --noEmit`, `npx expo export --platform web`, and `npx expo config --type public` passed. Native PDF rendering requires a development/production build because it includes native code. |
| 2026-07-25 | PDF action hardening | Replaced the browser PDF plugin with an in-app canvas renderer so it exposes no browser download, print, page-navigation, screenshot, or screen-recording controls. The web reader still scrolls and permits normal browser pinch zoom; native capture prevention stays active through Expo ScreenCapture. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Browser PDF worker fix | Replaced Expo-incompatible dynamic worker URL generation with the version-pinned worker source recommended by React-PDF, allowing the canvas reader to load in Expo Web without falling back to the browser PDF plugin. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Reader study actions | Added functional local reader actions: Mark as read toggles completion, Favourite toggles saved state, and Revise increments a revision count while marking the lesson read. State remains available when reopening a lesson in the UI demo. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Learner profile setup | Expanded Account to collect and save core study context: mobile reminder contact, exam name, category/stage, exam date, daily target, reminder time, study language, and timezone. Notes and subject headers now read the saved exam/category from shared local profile state. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Notes library | Rebuilt Notes as a document library with top-three recently opened lessons, a functional favourites area, full-note search, All/In progress/Completed filters, and a separate Notes/Packages switch. Opening a reader records it in Recents; reader favourite/read/revision actions feed the library state. | `npm run lint` and `npx tsc --noEmit` passed. A static web export was attempted but exceeded its build-time limit while compiling the existing PDF worker chunk. |
| 2026-07-25 | Reader action polish | Removed the oversized reader action bar. Mark read, Favourite, and Revise now live in a compact three-dot action sheet on the preceding subject-note list, while reader state still updates the Notes library and Recents. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Notes hierarchy correction | Replaced the flat Notes browsing flow with the intended Subject → Unit → Topic (when applicable) → PDF hierarchy. Notes with no topic level open directly from their unit. Recently opened and favourites remain quick access, and the three-dot study actions now live only beside final PDF rows. | `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` passed. |
| 2026-07-25 | Notes stability fix | Fixed the Web infinite render loop in `NoteActionSheet` by keeping Zustand selectors reference-stable; fallback reader status is now created outside the selector. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Practice session controls | Reworked MCQ Practice into a ten-question session with optional 5/10/15-minute timers, a live countdown, question navigator states (answered, unanswered, marked for review), direct question selection, and an answered-of-total progress bar. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Home learning dashboard | Added a polished 12-week, hours-based consistency heatmap and a three-item Recently opened panel to Home. Each recent item opens the same protected lesson URL as its originating Notes entry; check-in/out, streak, exam countdown, and syllabus cards remain in place. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Home layout simplification | Removed the redundant Continue Studying/Practice pair and Jump into your notes promo from Home. The focused dashboard order is now check-in, exam countdown, consistency, streak, recently opened, and syllabus completion; Notes and Practice remain available in the bottom navigation. | `npm run lint` and `npx tsc --noEmit` passed. |
| 2026-07-25 | Home study utilities | Added a live Today’s Plan card driven by the same study-session clock as check-in/out, with daily-target progress and a Tracker shortcut. Added a compact Revision Queue that takes the learner directly to the next due PDF. | `npm run lint` and `npx tsc --noEmit` passed. |

## Current status and next action

The UI-only prototype is complete through Phase 6. Future work begins only after UI approval: replace local mock data with the server API, secure native session storage, payment integration, real document rendering/security, realtime logout, and production accessibility/device QA.

## Active visual-correction note

On 2026-07-25, reference screenshots established a new visual acceptance target for the student Home dashboard. The existing Phase 3 dashboard is being replaced to match that target: spacious white header, eye/wordmark lock-up, outlined theme control and initials avatar, deep blue gradient hero, large overlapping check-in orb, dotted white/cream cards, two primary action cards, an exam calendar/pressure panel, streak, notes call-to-action, syllabus progress, and a tall icon-led bottom navigation. This reference target takes priority over the earlier compact dashboard composition.

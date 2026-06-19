# Parallax Flow — Architecture

> Source of truth for system design. Update this doc when architecture decisions change.

## 1. Overview

Parallax Flow is a MERN + TypeScript platform with three product surfaces for students (Home, Notes, Tracker, Question Bank, Store) and an Admin panel. Content is fully customizable by admins: exam categories (CA, NEET, JEE…), study stages, a subject/sub-subject tree, and lessons (secured PDFs or government links).

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  React SPA  │────▶│  Express API (TS)    │────▶│  MongoDB    │
│  Vite + TS  │◀────│                      │◀────│  (Mongoose) │
│  PDF.js     │     │  modules:            │     └─────────────┘
│             │     │   auth, content,     │     ┌─────────────┐
│  Socket.io  │◀───▶│   lessons, commerce, │────▶│  Redis      │
└─────────────┘     │   tracker, questions │     │ sessions,   │
                    │  services:           │     │ cache, rate │
                    │   pdf, watermark,    │     │ limit, OTP  │
                    │   payments, ai-grade │     └─────────────┘
                    └──────────┬───────────┘     ┌─────────────┐
                               └────────────────▶│ Cloudflare  │
                                                  │ R2 (private)│
                                                  └─────────────┘
```

## 2. Why no `shared/` package

The server is the **single source of truth** for validation (Zod schemas live in `server/`). The client validates forms independently. Sharing a package between a Vite (ESM) client and a Node server adds path-alias/ESM-CJS tooling friction that isn't worth it for a solo dev at this scale. Revisit only if duplication becomes painful.

## 3. Content hierarchy

```
ExamCategory (CA, NEET, JEE …)        ← admin-customizable
  └── Stage (Foundation, Inter, Final, SPOM …)   ← per category, admin-customizable
        └── Subject (Taxation …)                 ← wrapper; self-referencing tree
              └── Sub-subject (Direct Tax …)     ← parentSubjectId, unlimited nesting
                    └── Lesson (pdf | ism)        ← the studied unit
                          └── Progress / Revision (per user, per lesson)
```

- A **Subject** is a wrapper that can contain sub-subjects and/or lessons.
- A **Lesson** is either a secured `pdf` (paid, DRM-protected) or an `ism` government link (free, opens in a new tab).
- **Mark-as-complete, progress, and revision counts are per Lesson**, rolled up to subject → stage for syllabus %.

## 4. Data model (MongoDB collections)

| Collection | Key fields |
|-----------|-----------|
| **User** | name, email, passwordHash?, googleId?, phone?, role (student\|admin\|superadmin), emailVerified, activeStageId, createdAt |
| **ExamCategory** | name, slug, description, order, isActive |
| **Stage** | name, examCategoryId, order, isActive |
| **Subject** | name, stageId, parentSubjectId (null = top level), order, isActive |
| **Lesson** | title, subjectId, type (pdf\|ism), fileKey? (R2), externalUrl?, pageCount?, price, isFree, order, isActive, uploadedBy |
| **Progress** | userId, lessonId, status (not_started\|in_progress\|completed), completedAt |
| **Revision** | userId, lessonId, count, lastRevisedAt |
| **Package** | title, description, lessonIds[], price, isActive |
| **Order** | userId, items[] (lesson/package refs), amount, currency (INR), razorpayOrderId, razorpayPaymentId, status (created\|paid\|failed) |
| **Session** | userId, deviceId, refreshTokenHash, ip, userAgent, lastActiveAt |
| **StudySession** | userId, checkInAt, checkOutAt, durationMins, autoClosed |
| **CheckIn** | userId, date (one per day → streak) |
| **ExamDate** | userId, examDate, label |
| **Question** | examCategoryId, stageId, subjectId?, type (mcq\|short\|long), prompt, options?, correctOption?, modelAnswer? |
| **Answer** | userId, questionId, response, score, aiFeedback?, gradedBy (auto\|ai), createdAt |
| **AuditLog / AccessLog** | userId, action, resource, ip, userAgent, timestamp |

**Entitlements are computed, not stored**: a user may open a paid lesson if they own it directly (a paid `Order`) **or** own a `Package` that currently contains it. This means adding a lesson to a package later automatically grants it to existing package buyers.

## 5. Backend module layout

```
server/src/
├── index.ts              # process entry: connect DB/Redis, start HTTP + Socket.io
├── app.ts                # express app, middleware pipeline, route mounting
├── config/env.ts         # typed, validated env (Zod)
├── lib/                  # db (mongoose), redis, logger
├── middleware/           # auth, rbac, error handler, rate limit, single-device
├── modules/
│   ├── auth/             # signup, login, OTP, Google SSO, refresh, devices
│   ├── content/          # categories, stages, subjects tree (admin CRUD)
│   ├── lessons/          # lessons, progress, secure PDF streaming + watermark
│   ├── commerce/         # packages, orders, Razorpay, entitlements
│   ├── tracker/          # check-in/out, streaks, momentum, syllabus %, exam date
│   └── questions/        # question bank, attempts, OpenAI grading
└── services/             # pdf, watermark, payments(razorpay), ai-grade(openai), mail
```

Each module is `routes → controller → service → model`. Validation via Zod at the route boundary.

## 6. Frontend layout

```
client/src/
├── main.tsx, App.tsx, router
├── lib/            # api client (axios + React Query), socket, auth store (Zustand)
├── components/     # shared UI
├── features/       # auth, home, notes, viewer, tracker, questions, store, admin
└── pages/          # route-level screens
```

Server state via **React Query**; light client state via **Zustand**. Styling with **Tailwind**.

## 7. Key flows

- **Auth**: JWT access (short-lived) + refresh (httpOnly cookie). On login a new `deviceId` is issued and becomes the user's only valid device; the previous device is force-logged-out over Socket.io. See `SECURITY.md`.
- **Secure PDF**: never serve the raw file. API checks auth + single-device + entitlement, then streams **watermarked page images** behind short-lived signed tokens. See `SECURITY.md`.
- **Commerce**: Razorpay order created server-side → client checkout → webhook/verify → `Order` marked paid → entitlement check unlocks lessons.
- **Tracker**: unified check-in starts a `StudySession` and marks the daily `CheckIn` (streak); check-out (or auto check-out on inactivity/logout) closes the session and logs minutes against the daily target.
- **Question Bank**: MCQ graded instantly server-side; short/long answers graded by OpenAI comparing the student response to the admin `modelAnswer`.

## 8. Environments

- **Dev**: local MongoDB + local Redis; R2/Razorpay/OpenAI via test credentials in `.env`.
- **Prod**: MongoDB Atlas + managed Redis; secrets via host env vars. Never commit `.env`.

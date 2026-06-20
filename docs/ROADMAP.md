# Parallax Flow — Roadmap

> Phased delivery plan. Each phase ends with a working, reviewable increment and your sign-off before the next begins.

## Decisions locked

| Area | Decision |
|------|----------|
| Stack | MERN + TypeScript; Vite/React/Tailwind/PDF.js + Express/Mongoose |
| Structure | `client/` + `server/` + `docs/` (no `shared/`) |
| Auth | Email/password + email 6-digit OTP + Google SSO |
| Single device | New login kicks the old device (Socket.io) |
| PII / watermark | name + email + phone + userID (phone required before purchase/PDF open) |
| Commerce | Razorpay, INR; per-lesson + admin packages; computed entitlements |
| Storage | Cloudflare R2 (private), page-image streaming |
| AI grading | OpenAI GPT (short/long answers) |
| Scale | Small (<1k), single API server + MongoDB Atlas (Redis added later at scale) |
| Defaults | INR only; ISM gov links free; free lessons allowed; admin via seed; question bank free; MCQ auto-grade; revisions per-lesson; GST/refunds later |

## Phases

- **Phase 0 — Foundations** ✅: git, monorepo structure, server + client scaffold, this docs set.
- **Phase 1 — Auth** ✅: email+OTP, Google SSO, JWT access+refresh, RBAC, single-device enforcement, phone capture, forgot-password.
- **Phase 2 — Content model & Admin** ✅: ExamCategory, Stage, Subject/Sub-subject tree CRUD; admin panel; first-admin seed.
- **Phase 3 — Lessons & Secure PDF** ✅: lessons (pdf|ism), R2 upload, watermarked page-image streaming, anti-piracy stack, ISM links, mark-complete + progress, access logs.
- **Phase 4 — Commerce** ✅: Razorpay (idempotent orders, coupons), per-lesson + packages, orders, entitlements, Store/Checkout/My Library.
- **Phase 5 — Tracker & Home** ✅: unified check-in/out (+ auto check-out), streaks, momentum, exam countdown, syllabus %, revisions, pressure meter, home dashboard.
- **Phase 6 — Question Bank & AI grading** ✅: admin question CRUD, student practice view, MCQ auto-grade, OpenAI short/long grading (heuristic fallback), attempt history + stats.
- **Phase 7 — Hardening** ✅: rate limiting (auth/OTP/PDF/answers + global baseline), admin audit log + viewer, forensic verification CLI, security review, Docker/compose + nginx deployment config (see `DEPLOY.md`).

> Flat redesign + light/dark theming + reusable `components/ui` kit landed alongside Phases 4–5.

## Launch prerequisites (provide these, then deploy)

Real third-party credentials — all degrade gracefully until set: MongoDB Atlas URI + JWT secrets (required), Cloudflare R2 (PDF storage), Razorpay (payments), Resend (OTP email), OpenAI (AI grading), Google OAuth client ID (SSO). Hosting target is the remaining decision — see `DEPLOY.md` (Docker/VPS or managed PaaS).

## Decide-at-their-phase (defaults set, confirm when reached)

- OTP/email sending provider (Resend / AWS SES / Brevo) — Phase 1.
- UI/branding direction for Parallax Flow — start of frontend work.
- Deployment target/host — before Phase 7.

## Deferred (post-MVP)

Access expiry/revocation (entitlements are currently buy-once-own-forever), failed/stale-order cleanup sweep, entitlement caching (Redis at scale), broader notifications, global search, preview-pages-before-buy, multi-language, GST invoicing, refunds, native app for OS-level screenshot blocking.

> Payment **receipts** shipped post-Phase 7: an itemised, immutable receipt (`PF-YYYY-NNNN`) is generated when an order is paid (verify / webhook / full-coupon), emailed via Resend, listed in **My Library**, and printable at `/receipt/:id`.

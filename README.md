# Parallax Flow

A secure, India-first learning platform for competitive-exam students (CA, NEET, JEE, and more — fully admin-customizable). Students study from heavily DRM-protected PDF notes and official government links (ISM), track their progress and study habits, and practice from an AI-graded question bank.

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + TypeScript + Tailwind CSS + PDF.js |
| Backend | Node.js + Express + TypeScript + Mongoose |
| Database | MongoDB (local for dev, Atlas for prod) |
| Cache / sessions | Redis |
| Object storage | Cloudflare R2 (private) |
| Auth | JWT (access + refresh), Google OAuth, email OTP |
| Realtime | Socket.io (single-device enforcement) |
| Payments | Razorpay (INR) |
| AI grading | OpenAI GPT (short/long answers) |

## Repository layout

```
Parallax-Flow/
├── client/   # React + Vite + TypeScript SPA
├── server/   # Express + TypeScript API
└── docs/     # Architecture, security model, roadmap (source of truth)
```

> There is no `shared/` package by design — the server is the single source of truth for validation; the client validates independently. See `docs/ARCHITECTURE.md`.

## Getting started

See per-package READMEs in `client/` and `server/`. Start with `docs/ROADMAP.md` for the build plan and current phase.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, data model, modules
- [`docs/SECURITY.md`](docs/SECURITY.md) — auth, single-device, and the PDF anti-piracy model
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — phased delivery plan

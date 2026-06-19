# Parallax Flow — Server

Express + TypeScript API for Parallax Flow.

## Prerequisites

- Node.js 20+ (tested on 24)
- MongoDB and Redis running locally (optional in Phase 0; required from Phase 1)

## Setup

```bash
cd server
npm install
cp .env.example .env   # then fill in values as phases require
npm run dev
```

The API starts on `http://localhost:4000`. Health check: `GET /health`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm start` | Start once (tsx) |
| `npm run typecheck` | Type-check with tsc (no emit) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Structure

```
src/
├── index.ts        # entry: HTTP + Socket.io, DB/Redis connect, graceful shutdown
├── app.ts          # express app + middleware + route mounting
├── config/env.ts   # validated environment
├── lib/            # logger, db (mongoose), redis
├── middleware/     # error handling (auth/rbac/rate-limit added in Phase 1+)
├── modules/        # feature modules (added per phase)
└── services/       # pdf, watermark, payments, ai-grade, mail (added per phase)
```

See `../docs/ARCHITECTURE.md` and `../docs/SECURITY.md` for the full design.

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
| `npm run dev` | Dev with hot reload (tsx watch, `NODE_ENV=development`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`dist/index.js`) |
| `npm run start:prod` | Run the build with `NODE_ENV=production` |
| `npm run typecheck` | Type-check only (no emit) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |

## Environments (dev & prod)

Config is loaded layered, most-specific first (the host/script environment always
wins over files): `.env.<NODE_ENV>.local` → `.env.<NODE_ENV>` → `.env.local` → `.env`.

- **Dev**: `npm run dev` (uses safe localhost defaults; create `.env` or
  `.env.development` for overrides). Start MongoDB + Redis locally from Phase 1.
- **Prod**: `npm run build` then `npm run start:prod`. Provide secrets via host
  env vars or `.env.production` (never committed). `NODE_ENV=production` switches
  off pretty logging and enables prod behavior.

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

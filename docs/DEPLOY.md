# Parallax Flow — Deployment

Two supported paths. Both run the **API** (Node/Express) and the **client** (static SPA served by nginx, which also reverse-proxies `/api` + `/socket.io` to the API so everything is one origin — cookies and the single-device websocket work without CORS headaches).

---

## What you need first

| Service | Required? | Notes |
|---|---|---|
| **MongoDB Atlas** | Yes | Free tier is fine. Copy the `mongodb+srv://…` connection string. |
| JWT secrets | Yes | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` ×2 |
| Cloudflare R2 | Recommended | Private bucket for PDFs. Without it, files fall back to local disk (`/app/storage`). |
| Razorpay keys | For payments | Without them, checkout returns 503 (everything else works). |
| Resend (mail) | For real OTP email | Without it, OTPs are written to the server log. |
| OpenAI key | For AI grading | Without it, written answers fall back to the keyword heuristic. |
| Google OAuth client ID | For Google SSO | Optional. |

All optional services **degrade gracefully** — you can launch with just MongoDB + JWT secrets and add the rest later.

---

## Path A — Docker Compose (VPS / self-host)

Works on any box with Docker (DigitalOcean, Hetzner, EC2, a homelab…).

```bash
cp server/.env.example server/.env
# Edit server/.env: MONGODB_URI, JWT secrets, and set
#   CLIENT_ORIGIN=https://your-domain        (the public URL users hit)
docker compose up -d --build
```

- Client is published on port **8080** (map a real domain + TLS via a front proxy, see below).
- `CLIENT_ORIGIN` must equal the public origin — it's used for the Socket.io/CORS origin check and secure-cookie behavior.
- Seed the first admin (no public admin signup):
  ```bash
  docker compose exec server sh -lc 'ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me-12 npm run seed:admin'
  ```

### TLS
Put Caddy or nginx (or your cloud's load balancer) in front, terminating HTTPS and proxying to the client container on `:8080`. `NODE_ENV=production` makes the refresh cookie `Secure` and trusts the proxy's `X-Forwarded-Proto`, so HTTPS is required in prod for login to stick.

---

## Path B — Managed PaaS (Render / Railway / Fly)

Deploy the two as **separate services** from the same repo.

**API service**
- Root directory: `server`
- Build: `npm ci && npm run build`
- Start: `npm run start:prod`
- Health check path: `/health`
- Env vars: everything from `server/.env.example` (set `CLIENT_ORIGIN` to the client's public URL).

**Client service** (static site)
- Root directory: `client`
- Build: `npm ci && npm run build`
- Publish directory: `dist`
- Build-time env: `VITE_API_BASE_URL=https://your-api-host/api` (the API is on a different origin here), and `VITE_GOOGLE_CLIENT_ID` if using Google SSO.
- Add a SPA rewrite: all paths → `/index.html`.

Because the client and API are on different origins in this setup, the API's `CLIENT_ORIGIN` (CORS allowlist) **must** be the client's exact origin, and you're relying on cross-site cookies — prefer Path A (same-origin proxy) if you want the simplest cookie story. Alternatively, build the client Docker image (Path A's nginx) and deploy that as one service pointing at the API.

After deploy, seed the admin by running `npm run seed:admin` with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set (a one-off job/shell on the API service).

---

## Path C — Render Blueprint (recommended; no Docker, no server admin)

The simplest path: **one same-origin web service** where the Express API also
serves the built React SPA. Everything lives on a single `https://<name>.onrender.com`
URL, so auth cookies stay first-party and there's no CORS to configure. Defined
by `render.yaml` at the repo root.

1. Push this repo to GitHub.
2. Create a free **MongoDB Atlas** cluster and copy its `mongodb+srv://…` URI
   (add `0.0.0.0/0` to Atlas Network Access so Render can connect).
3. Go to **dashboard.render.com → New → Blueprint**, pick the repo. Render reads
   `render.yaml` and creates the service.
4. When prompted, paste `MONGODB_URI`. Leave the rest blank for now — they all
   degrade gracefully (JWT secrets are auto-generated). Deploy.
5. Seed the first admin: open the service's **Shell** tab and run
   ```bash
   cd server && ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=change-me-12 npm run seed:admin
   ```

`CLIENT_ORIGIN` is auto-derived from Render's injected `RENDER_EXTERNAL_URL`, so
there's nothing to set for cookies/websockets to work. Add R2 / Razorpay / Resend /
OpenAI / Google keys in the dashboard whenever you're ready — each triggers a
redeploy.

> **Notes.** The **free** plan spins down when idle (first request after a lull is
> slow) and its disk is **ephemeral** — set Cloudflare R2 before uploading real
> PDFs, or they vanish on redeploy. Bump to the **starter** plan to remove the
> spin-down.

---

## Path D — Oracle Cloud ARM VM (chosen host; Docker + auto-HTTPS)

A single always-free ARM VM running the **combined image** (API serves the SPA)
behind **Caddy** for automatic Let's Encrypt HTTPS. Files: root `Dockerfile`,
`docker-compose.prod.yml`, `Caddyfile`, `.env.example`.

**On the VM (Ubuntu), one-time:**
1. Install Docker: `curl -fsSL https://get.docker.com | sh` (then `sudo usermod -aG docker $USER` and re-login).
2. Open **80** and **443** — both in the VM firewall (`ufw`/`iptables`) **and** the Oracle **security list / NSG** for the subnet.
3. Point your domain's **DNS A record** at the VM's public IP.

**Deploy:**
```bash
git clone https://github.com/winnowms/parallax-flow.git && cd parallax-flow
cp .env.example .env      # set DOMAIN, MONGODB_URI, JWT secrets (+ optional keys)
docker compose -f docker-compose.prod.yml config   # sanity-check
docker compose -f docker-compose.prod.yml up -d --build
```
Caddy fetches the TLS cert automatically once DNS + ports 80/443 are live. Then
open `https://<your-domain>`.

**Update later:** `git pull && docker compose -f docker-compose.prod.yml up -d --build`.

- `CLIENT_ORIGIN` is derived from `DOMAIN` by the compose file — set `DOMAIN` once.
- Storage: the `storage` volume persists across redeploys, but **Cloudflare R2**
  is still recommended for real PDFs (backups, no VM disk pressure).
- ARM note: `mupdf` is WASM (arch-independent) and `@napi-rs/canvas` ships a
  `linux-arm64-gnu` prebuild, so the glibc `node:22-slim` image builds on Ampere.
- Ops (seed admin, forensic) run locally against Atlas, or on the VM:
  `docker compose -f docker-compose.prod.yml exec app node -e "..."` — but the
  seed script is TS; easiest is to run `npm run seed:admin` from your own machine.

---

## Post-deploy checklist

- [ ] `GET /health` returns `{ "status": "ok" }`.
- [ ] First admin seeded; can log in at `/admin/login`.
- [ ] Sign up a student → OTP arrives (email if Resend set, else server log).
- [ ] Upload a PDF lesson → open it → watermark shows your identity, Network tab shows only ciphertext.
- [ ] (If payments) a test purchase unlocks a paid lesson; set the Razorpay **webhook** to `https://your-domain/api/commerce/webhook` with `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Admin **Audit** tab shows your actions.

## Operations

- **Forensic trace** of a leaked page (read the ref code off the watermark):
  ```bash
  docker compose exec server sh -lc 'npm run forensic -- <REF_CODE>'
  ```
- **Smoke tests** (against an isolated `parallax_flow_test` DB): `npm run test:smoke:all` from `server/`.
- **Scaling note**: rate-limiting is in-memory, so it's per-instance. The current target is a single API instance (<1k users). To run multiple instances, move rate-limit + sessions to a shared store (Redis) first.

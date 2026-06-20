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

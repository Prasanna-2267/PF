# Parallax Flow — Security & Anti-Piracy Model

> Source of truth for the auth, single-device, and PDF-protection design. Read this before touching anything in `auth/`, `lessons/`, or the PDF pipeline.

## 1. Honest threat model for PDF protection

**On the web, you cannot truly prevent screenshots or someone photographing the screen with a phone.** There is no browser API to block the OS PrintScreen, Snipping Tool, screen recorders, or an external camera. Any claim otherwise on a pure web app is false.

So our strategy is **defense-in-depth + forensic traceability**, the same model used by serious document-protection platforms:

1. Make casual piracy genuinely hard (no raw file, no download/print, deterrents).
2. Make any leak **traceable to the exact account** via per-user watermarks (visible + invisible + metadata) and access logs.

The deterrent + traceability combination is what actually protects content. True screenshot-blocking would require a native mobile/desktop app (e.g. Android `FLAG_SECURE`) — out of scope for the web-only launch, and even that can't stop a phone camera.

## 2. PDF protection layers

| Layer | Mechanism |
|------|-----------|
| **No raw file** | PDFs live in a **private** Cloudflare R2 bucket. No public URLs, ever. The browser never receives a `.pdf` it can save. |
| **Page-image streaming** | Pages are rendered/served as images one at a time, behind **short-lived signed tokens** (expire in seconds, bound to user + session + page). |
| **Visible watermark** | Per-user watermark (name, email, phone, userID, timestamp) tiled diagonally, **baked into the pixels** server-side — not a CSS overlay that can be deleted via devtools. |
| **Invisible/forensic watermark** | Subtle per-user fingerprint embedded in the rendered output so a leaked page can be traced to the account. |
| **Metadata watermark** | User identity embedded in any served PDF/image metadata. |
| **Entitlement gate** | Stream only if the user owns the lesson (direct purchase or via package). |
| **Single-device gate** | Stream only if the request comes from the user's currently-active device. |
| **Client deterrents** | PDF.js/canvas render; right-click off; text-select off; Ctrl+S / Ctrl+P / PrintScreen intercepted; blur content on tab-blur / visibility-change / devtools-open. |
| **Access logging** | Every lesson open is written to `AccessLog` (user, ip, ua, time) for the forensic trail. |

These are **deterrents + traceability**, not a guarantee against a determined camera. That trade-off is accepted and documented.

## 3. Authentication

- **Methods**: email/password (with 6-digit email OTP verification) and Google SSO.
- **Tokens**: short-lived JWT access token + refresh token stored in an httpOnly, Secure, SameSite cookie.
- **Passwords**: hashed with bcrypt; never logged.
- **Signup model (takeover-safe)**: signup does **not** create a User. It stores a `PendingRegistration` (name, phone, hashed password, hashed OTP) bound to a one-time signup token set as an httpOnly `pf_signup` cookie. The OTP can only be verified by the **same browser** (cookie) that started signup, and the real User is created **only on successful verification**. This prevents pre-verification account takeover (an attacker re-registering a victim's email cannot influence the account the victim verifies). A pending row that already matches a login password can be rebound to the current browser (gated by the correct password).
- **OTP**: 6-digit, stored **hashed** on the pending registration in MongoDB with a TTL index (auto-expiry) + attempt limits.
- **Phone**: required for email signup; for Google SSO (which never provides a phone) the user is prompted after first login and **must add a phone before first purchase or first PDF open** so the watermark always carries it.
- **RBAC**: roles `student | admin | superadmin`. The first admin is created via a seed script — there is no public admin signup.

## 4. Single-device enforcement

Goal: a user account can be actively logged in on **one device at a time**.

- On each successful login, the server issues a new `deviceId` and keeps a single `Session` doc per user (existing sessions are deleted), so the previous device is no longer valid.
- Every authenticated request validates that the token's `deviceId` matches the current active device. A mismatch ⇒ 401 (logged in elsewhere).
- The **previous device is force-logged-out in real time** via Socket.io (chosen behavior: new login kicks the old device, so users who switch phones aren't locked out).

## 5. General hardening (Phase 7 — implemented)

- Input validation with Zod at every route boundary.
- Rate limiting (in-memory; per-instance) on auth, OTP, password-reset, payment, PDF-page, and answer-submission endpoints, plus a **global per-IP baseline** across `/api`. Redis-backed when we go multi-instance.
- Helmet, CORS allowlist, secure httpOnly cookies, `trust proxy` + HTTPS in prod, 1 MB body limit, graceful shutdown.
- Webhook signature verification for Razorpay (HMAC, timing-safe).
- JWT secrets fail-fast (process won't boot in prod without strong secrets).
- **Audit logging** — every admin create/update/delete is recorded to `AuditLog` (actor, role, method, path, resource id, status, IP, UA) via non-blocking middleware on the admin routers; viewable in the admin **Audit** tab (`GET /api/admin/audit`). Failed writes and reads are not recorded.
- **Forensic verification tooling** — `npm run forensic -- <REF_CODE>` traces a leaked page's watermark ref code back to the exact account/IP/time via `AccessLog`.
- Secrets only via env vars; `.env` is git-ignored. All third-party integrations degrade gracefully when unset.

Covered by smoke suites (`npm run test:smoke:all`): auth, content/RBAC, lessons, secure-PDF, realtime, commerce, payments, tracker, questions, audit.

## 6. Known limitations (state these plainly)

- Web cannot block screenshots or screen photography — mitigated by forensic watermarking + logging, not prevented.
- Client-side deterrents (devtools/blur detection) are bypassable; they raise effort, they don't guarantee.
- Strongest possible protection would need a native app (future phase).

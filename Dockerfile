# ─────────────────────────────────────────────────────────────────────────────
# Combined production image: the Express API also serves the built React SPA,
# so the whole app is ONE same-origin service on :4000. Put a TLS terminator
# (Caddy — see docker-compose.prod.yml) in front for HTTPS.
#
# Used for VPS / self-host deploys (e.g. Oracle Cloud ARM). Multi-arch: builds
# natively on both x86-64 and arm64 (node:*-slim is glibc, so @napi-rs/canvas
# pulls its linux-arm64-gnu prebuild; mupdf is WASM, arch-independent).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build the client (Vite) ───────────────────────────────────────
FROM node:22-slim AS client-build
WORKDIR /client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Baked into the client at build time. Leave VITE_API_BASE_URL unset → the app
# calls same-origin /api. VITE_GOOGLE_CLIENT_ID enables the Google button.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ── Stage 2: build the server (tsc) ─────────────────────────────────────────
FROM node:22-slim AS server-build
WORKDIR /server
COPY server/package*.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

# ── Stage 3: runtime ────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Fonts for the baked-in PDF watermark (@napi-rs/canvas text rendering).
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

# Production deps only. Run on the target arch so the correct @napi-rs/canvas
# native prebuild is fetched.
COPY server/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled server + built client (served by the API via CLIENT_DIST_DIR).
COPY --from=server-build /server/dist ./dist
COPY --from=client-build /client/dist ./client-dist
ENV CLIENT_DIST_DIR=/app/client-dist

# Local-disk storage fallback (only used if Cloudflare R2 isn't configured).
RUN mkdir -p /app/storage
VOLUME ["/app/storage"]

EXPOSE 4000
CMD ["node", "dist/index.js"]

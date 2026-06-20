# ── Build stage ────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runtime stage ──────────────────────────────────────────
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Fonts for the baked-in PDF watermark (@napi-rs/canvas text rendering).
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Local-disk storage fallback (only used if R2 isn't configured).
RUN mkdir -p /app/storage
VOLUME ["/app/storage"]

EXPOSE 4000
CMD ["node", "dist/index.js"]

# ── Build stage ────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Same-origin in prod: leave VITE_API_BASE_URL unset so the client calls /api,
# which nginx proxies to the server. Override only if the API is on another host.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ── Runtime stage (nginx serves static + proxies the API) ──
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

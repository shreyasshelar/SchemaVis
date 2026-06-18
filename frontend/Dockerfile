# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --quiet

COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy as a template so the official nginx image runs envsubst at startup.
# BACKEND_URL env var is substituted before nginx starts — used by Cloud Run.
# For Kubernetes the helm chart sets BACKEND_URL=http://schema-vis-backend:8080
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ || exit 1

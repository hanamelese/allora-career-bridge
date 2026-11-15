# Allora Accessibility Bridge - the API (with the embeddable widget) and the
# partner dashboard, from one multi-stage build.
#
#   docker compose up --build        (see docker-compose.yml and the README)
#
# Targets:
#   api  Node 22: the Express API, its migrations and the built widget.
#   web  nginx: the built dashboard, forwarding /api and /widget to the API.

ARG NODE_IMAGE=node:22-bookworm-slim

# ---- Everything installed, for building ----
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
# better-sqlite3 is native; these build it if no prebuilt binary fits.
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/form-engine/package.json packages/form-engine/
COPY API/package.json API/
COPY Frontend/package.json Frontend/
COPY widget/package.json widget/
RUN npm ci --no-audit --no-fund

# ---- The widget and the dashboard, built ----
FROM deps AS build
# Where the dashboard's embed tag points: the API's public address, as the
# partner's own website will reach it.
ARG VITE_PUBLIC_API_ORIGIN=http://localhost:3001
ENV VITE_PUBLIC_API_ORIGIN=${VITE_PUBLIC_API_ORIGIN}
COPY packages packages
COPY widget widget
COPY Frontend Frontend
RUN npm run build -w widget && npm run build -w frontend

# ---- Production dependencies of the API only ----
FROM deps AS api-deps
RUN npm ci --omit=dev --no-audit --no-fund -w api --include-workspace-root=false

# ---- API runtime ----
FROM ${NODE_IMAGE} AS api
ENV NODE_ENV=production \
    PORT=3001 \
    DATABASE_URL=/data/onboarding.db
WORKDIR /app
COPY --from=api-deps /app/node_modules node_modules
COPY package.json ./
COPY packages/contracts packages/contracts
COPY API/package.json API/package.json
COPY API/src API/src
COPY API/drizzle API/drizzle
COPY --from=build /app/widget/dist widget/dist
# The database lives on a volume mounted here, owned by the unprivileged user.
RUN mkdir -p /data && chown node:node /data
USER node
WORKDIR /app/API
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
# Migrations run as the server starts (see API/src/db/client.js).
CMD ["node", "src/server.js"]

# ---- Dashboard runtime ----
FROM nginx:1.29-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/Frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

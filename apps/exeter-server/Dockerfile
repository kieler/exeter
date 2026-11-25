ARG NODE_VERSION=24-alpine

# Minimal image that contains all dependencies (build deps and runtime deps).
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml kieler-klighd-instrumentation-0.1.0.tgz ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    corepack enable pnpm && pnpm install --frozen-lockfile

# Image that uses all deps to build the application
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV BETTER_AUTH_URL=http://localhost:3000

RUN corepack enable pnpm && \
    pnpm exec prisma generate && \
    pnpm build

# Image that contains what we need to run migrations against PG
FROM node:${NODE_VERSION} AS migrations
WORKDIR /app
ENV NODE_ENV=production

RUN chown node:node /app
USER node

RUN --mount=type=bind,source=package.json,target=/tmp/exeter-package.json \
    --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    prisma_version="$(node -p 'require("/tmp/exeter-package.json").dependencies.prisma')" && \
    npm install --save-exact --no-audit --no-fund "prisma@$prisma_version"

COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./prisma.config.ts
COPY --chown=node:node src/lib/env/load-env.ts ./src/lib/env/load-env.ts

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

# Image for the main exeter server
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache su-exec && mkdir -p diagram-sources

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/exeter-entrypoint

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/exeter-entrypoint"]
CMD ["node", "server.js"]

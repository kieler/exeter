FROM node:24-alpine AS build
WORKDIR /app
ENV CI=true

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY proxy.ts tsconfig.json ./
RUN pnpm run build && pnpm prune --prod

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 8000
CMD ["node", "dist/proxy.js"]

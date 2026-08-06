FROM node:26-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/core/package.json ./packages/core/
COPY packages/plugin-sdk/package.json ./packages/plugin-sdk/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 3000 3001
CMD ["./entrypoint.sh"]

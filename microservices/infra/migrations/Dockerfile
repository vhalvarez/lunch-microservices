###########
# Builder #
###########
FROM node:20-alpine AS builder
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

WORKDIR /repo

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY infra/migrations ./infra/migrations

RUN pnpm -w install
RUN pnpm install

RUN pnpm run build:shared
RUN pnpm -F migrations run build

RUN pnpm deploy --legacy --filter migrations --prod /opt/app

##########
# Runner #
##########
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /opt/app ./

CMD ["node", "dist/index.js", "up"]

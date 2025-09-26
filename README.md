# Lunch Day — Backend (Node.js + TS) monorepo

Automatiza la jornada de donación de almuerzos con arquitectura de microservicios, colas (RabbitMQ) y escalabilidad por workers.

## Arquitectura (MVP)
- **market-adapter-svc**: compra ingredientes en la plaza (`/api/farmers-market/buy`), reintentos + backoff.
- **packages/**
  - `@lunch/shared-kernel`: contratos/eventos (Zod).
  - `@lunch/messaging`: wrapper de RabbitMQ (publish/subscribe, prefetch, acks).
- **scripts/**: utilidades. Incluye `publish-purchase-requested.ts` para smoke tests.
- **infra/**: `docker-compose.yml` (RabbitMQ, Postgres, Redis).

## Requisitos
- Node 20+ y pnpm
- Docker (para infra local)

## Arranque rápido (local)
```bash
# 1) Infra
docker compose -f infra/docker-compose.yml up -d
# UI RabbitMQ: http://localhost:15672  (guest/guest)

# 2) Build de paquetes
pnpm -F @lunch/shared-kernel build
pnpm -F @lunch/messaging build

# 3) Ejecutar el market-adapter en dev
AMQP_URL=amqp://guest:guest@localhost pnpm -F market-adapter-svc dev

# 4) Publicar un evento de prueba (otra terminal)
AMQP_URL=amqp://guest:guest@localhost pnpm --filter @lunch/scripts run dev:publish

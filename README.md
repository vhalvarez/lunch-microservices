# Lunch Day – Backend (Node.js + TS, Microservicios)

Automatiza una jornada masiva de platos gratis. La cocina selecciona recetas; inventario reserva insumos; si faltan, se compran en la plaza; cuando todo está, se entrega.

## Arquitectura
- **Event-driven** con **RabbitMQ** (topic exchanges)
- **Postgres** (inventario), **Redis** (idempotencia rápida)
- **Monorepo** con **pnpm workspaces** (Node 20 + TypeScript)

## Paquetes compartidos
- **@lunch/shared-kernel**: contratos Zod, `Exchanges`, `RoutingKeys`
- **@lunch/messaging**: wrapper AMQP (`publish`/`subscribe`, prefetch, exchange topic)

## Microservicios (estado actual)
- **inventory-svc**
  - Escucha `inventory.reserve.requested` → intenta reservar desde `stock`
  - Si falta, publica `purchase.requested { plateId, shortages[] }`
  - Escucha `purchase.completed { purchased[] }` → suma a `stock`, completa reservas y publica `inventory.reserved`
  - **Idempotencia**: Redis (`idem:${messageId}`, TTL 1h) – *no* se usa tabla en DB
  - **Transacciones**: `pg.Pool` + `withTx` (un `PoolClient` por mensaje)
  - **Eventos se publican tras `COMMIT`** (evita “no transaction in progress”)
  - **Reconciler activo**: reintenta `pending` con backoff y marca `failed` al superar `MAX_RETRIES`

- **market-adapter-svc**
  - Escucha `purchase.requested`; llama a **/farmers-market/buy** con reintentos y backoff
  - Registra **cada intento** en `market_purchases (plate_id, ingredient, qty_requested, quantity_sold, created_at)`
  - Publica `purchase.completed` cuando cubre faltantes; si agota reintentos, `purchase.failed`

> Pendientes: `kitchen-svc`, `order-svc`.

## Eventos (routing keys)
- `inventory.reserve.requested` → `{ messageId, plateId, items: [{ingredient, qty}] }`
- `purchase.requested` → `{ messageId, plateId, shortages: [{ingredient, missing}] }`
- `purchase.completed` → `{ messageId, plateId, purchased: [{ingredient, qty}] }`
- `inventory.reserved` → `{ messageId, plateId, items: [{ingredient, qty}] }`
- `purchase.failed` → `{ messageId, plateId, ingredient, remaining }`

## Esquema de BD (tablas clave)
- `stock(ingredient PK, qty CHECK qty>=0)`
- `reservations(plate_id PK, status, retry_count, last_retry_at, prepared_at, created_at)`
- `reservation_items(plate_id, ingredient PK, needed, reserved, CHECK reserved>=0 AND reserved<=needed)`
- `market_purchases(id, plate_id, ingredient, qty_requested, quantity_sold, created_at)`
- ❌ **Eliminada**: `processed_messages` (idempotencia actual es solo con Redis)

## Cómo correr local

```bash
# 1) Infra
docker compose -f infra/docker-compose.yml up -d

# 2) Build de paquetes compartidos
pnpm -F @lunch/shared-kernel build
pnpm -F @lunch/messaging build

# 3) Migraciones / seed (Postgres)
pnpm -F inventory-svc run migrate

# 4) Servicios (terminales separadas)
# inventory-svc
pnpm -F inventory-svc dev

# market-adapter-svc
pnpm -F market-adapter-svc dev

# 5) Publicar N platos de prueba (ej. 100)
pnpm --filter @lunch/scripts dev:publish:inventory --plates 100

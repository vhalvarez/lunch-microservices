# Lunch Day – Backend (Node/TS, microservicios, event-driven)

Automatiza una jornada masiva de donación de comida. El gerente presiona un botón para generar **N** platos (recetas aleatorias).  
La cocina pide ingredientes a bodega; si faltan, se compran en la plaza de mercado; cuando están listos, se prepara y entrega.

Monorepo: **pnpm workspaces** (multi-paquete), con dependencias internas vía `workspace:*`. pnpm tiene soporte nativo para monorepos y archivo `pnpm-workspace.yaml`.
Mensajería: **RabbitMQ** (topic exchanges). Se usa **prefetch/QoS** para limitar mensajes *unacked* por consumidor.
Persistencia: **PostgreSQL**.  
Cache/Idempotencia: **Redis**.  
HTTP externo: **Alegra Farmers Market** (cliente **Undici**).  
API/BFF: **Fastify**.

---

- **order-svc**: publica lotes de órdenes (6 recetas aleatorias).
- **inventory-svc**: intenta reservar stock; si falta → emite `purchase.requested`; cuando logra reservar todo → publica `inventory.reserved` (tiene reconciler).
- **market-adapter-svc**: compra en la API pública y reporta `purchase.completed` / `purchase.failed`.
- **kitchen-svc**: al recibir `inventory.reserved`, simula preparación (`prepared_at`) y emite `plate.prepared`.
- **bff**: API para el gerente (botón de generar, dashboards y consultas).

---

## 📦 Estructura

```
apps/
  bff/
  inventory-svc/
  kitchen-svc/
  market-adapter-svc/
  order-svc/
packages/
  bus/ config/ db/ logger/ messaging/ recipes/ redis/ shared-kernel/ utils/
infra/ (docker-compose de RabbitMQ, Postgres, Redis)
```

> El monorepo se maneja con **pnpm workspaces**; el archivo `pnpm-workspace.yaml` define qué carpetas forman parte del workspace.

---

## 🧰 Stack

- **Node.js 20 + TypeScript**
- **RabbitMQ** (topic exchanges, colas durables, **prefetch** para controlar mensajes *in-flight* por consumidor).
- **PostgreSQL** (stock, reservas, items, compras, etc.)
- **Redis** (idempotencia por `messageId`)
- **Undici** (cliente HTTP moderno con **pooling/keep-alive**) para el adapter.
- **Fastify** (BFF/API)

---

## ▶️ Correr local

**Requisitos**: Docker, Node 20, pnpm.

1) **Infra** (RabbitMQ + Postgres + Redis)
```bash
docker compose -f infra/docker-compose.yml up -d
```

2) **Instalar dependencias**
```bash
pnpm -w install
```

3) **Build de paquetes compartidos**
```bash
pnpm run build:shared
```

4) **Migraciones + seed de inventario**
```bash
pnpm -F inventory-svc run migrate
```

5) **Levantar microservicios** (cada uno en su terminal)
```bash
pnpm -F inventory-svc dev
pnpm -F market-adapter-svc dev
pnpm -F kitchen-svc dev
pnpm -F order-svc dev   
pnpm -F bff dev
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del Proyecto

Sistema de gestión automatizada para eventos masivos de donación de comida gratis. Arquitectura de microservicios en Node.js + TypeScript con frontend Vue 3, que maneja desde la creación de órdenes hasta la entrega de platos, incluyendo control de inventario, compras automáticas al mercado y predicción con IA (Groq + Llama 3.1 8B).

## Comandos Principales

### Backend (desde `/microservices`)

```bash
# Desarrollo
pnpm dev                       # Ejecutar todos los microservicios en modo desarrollo
pnpm build                     # Construir todos los servicios y paquetes
pnpm build:shared              # Construir solo los paquetes compartidos

# Migraciones de Base de Datos
pnpm migrate:up                # Aplicar todas las migraciones
pnpm migrate:down              # Revertir última migración
pnpm migrate:status            # Ver estado de migraciones
pnpm migrate:rollback          # Rollback completo

# Testing
pnpm test                      # Ejecutar tests con watch mode
pnpm test:run                  # Ejecutar tests una vez
pnpm test:unit                 # Solo tests unitarios
pnpm test:integration          # Solo tests de integración
pnpm test:e2e                  # Solo tests E2E
pnpm test:coverage             # Coverage report

# Calidad de Código
pnpm lint                      # Ejecutar ESLint
pnpm typecheck                 # Verificar tipos TypeScript
pnpm fmt                       # Formatear código con Prettier
pnpm fmt:check                 # Verificar formato sin modificar

# Limpieza
pnpm clean:artifacts           # Limpiar dist, build, cache, etc.
pnpm clean:modules             # Eliminar node_modules
pnpm clean:all                 # Limpieza completa (artifacts + modules + store)
```

### Frontend (desde `/frontend`)

```bash
pnpm dev                       # Servidor de desarrollo (puerto 5173)
pnpm build                     # Build para producción
pnpm preview                   # Preview del build de producción
```

### Infraestructura (desde `/microservices/infra`)

```bash
# Docker Compose - Infraestructura completa
docker-compose -f docker-compose.prod.yml up --build -d   # Producción
docker-compose -f docker-compose.yml up                   # Solo infra (DB, RabbitMQ, Redis)

# Verificar estado de servicios
docker ps                                                  # Ver contenedores corriendo
docker logs -f <service-name>                             # Ver logs de un servicio
docker logs <service-name> | grep "keyword"               # Buscar en logs
```

## Arquitectura del Sistema

### Estructura del Monorepo

```
lunch-microservices/
├── microservices/           # Backend Node.js + TypeScript
│   ├── apps/               # Microservicios
│   │   ├── bff/           # API Gateway (Fastify, puerto 4000)
│   │   ├── order-svc/     # Worker RabbitMQ - Gestión de órdenes
│   │   ├── kitchen-svc/   # Worker RabbitMQ - Procesamiento de platos
│   │   ├── inventory-svc/ # Worker RabbitMQ - Control de inventario
│   │   ├── market-adapter-svc/  # Worker RabbitMQ - Integración con mercado
│   │   └── predictor-svc/ # Background Worker - Predicción IA
│   ├── packages/          # Paquetes compartidos (workspaces)
│   └── infra/             # Docker Compose y migraciones DB
└── frontend/              # Vue 3 + TypeScript + Vite
```

### Microservicios

**BFF (Backend For Frontend)**
- Único servicio con HTTP (Fastify, puerto 4000)
- API Gateway REST para el frontend
- Endpoints: `/health`, `/orders`, `/stats`, `/inventory`, `/predictions`, etc.

**Workers RabbitMQ** (sin puertos HTTP)
- `order-svc`: Crea órdenes y publica evento `order.created`
- `kitchen-svc`: Escucha `order.created`, selecciona receta, reserva ingredientes, coordina compras, prepara plato
- `inventory-svc`: Gestiona stock con sistema de reservas atómicas (con timeout)
- `market-adapter-svc`: Integración con API externa del mercado con retry automático
- `predictor-svc`: Análisis automático cada 5 minutos con IA (Groq + Llama 3.1 8B)

**Paquetes Compartidos** (`@lunch/*`)
- `shared-kernel`: Tipos y constantes compartidas
- `messaging`: Helpers de mensajería RabbitMQ
- `config`: Configuración centralizada
- `logger`: Logger estructurado (Pino)
- `db`: Pool de conexiones PostgreSQL
- `redis`: Cliente Redis compartido
- `bus`: Event bus (RabbitMQ)
- `recipes`: Definición de recetas de platos
- `recommender-ai`: Motor de predicción con Groq API
- `utils`: Utilidades comunes

### Stack Tecnológico

**Backend:**
- Node.js 18+, TypeScript 5.x, pnpm (workspaces)
- Fastify (solo BFF), RabbitMQ (AMQP), PostgreSQL 15, Redis 7
- Groq SDK + Llama 3.1 8B Instant, Zod (validación), Pino (logging)
- Vitest (testing)

**Frontend:**
- Vue 3 (Composition API), TypeScript, Vite
- TanStack Query (server state), Axios (HTTP client)
- Tailwind CSS, shadcn-vue (componentes UI)
- VueUse (composables), Lucide Vue (iconos)

**Infraestructura:**
- Docker + Docker Compose
- PostgreSQL (tablas principales: `orders`, `reservations`, `market_purchases`, `predictions`, `prediction_alerts`)

## Flujo de Procesamiento de Órdenes

```
Frontend → BFF (POST /orders)
         ↓
     Order Service (publica evento order.created)
         ↓
     Kitchen Service (escucha evento)
         ↓
     Inventory Service (reserva ingredientes con timeout)
         ↓
     Market Adapter (compra si falta stock)
         ↓
     Kitchen Service (prepara plato, publica plate.completed)
         ↓
     BFF (GET /stats, GET /inventory) → Frontend
```

## Sistema de Predicción con IA

**Algoritmo de Predicción:**
1. Cada 5 minutos analiza las últimas 100 órdenes
2. Calcula estadísticas (promedios, desviaciones, tendencias)
3. Aplica reglas basadas en thresholds (demanda alta, mercado poco confiable, etc.)
4. Envía prompt a Groq API (Llama 3.1 8B) con datos estructurados
5. Genera alertas con severidad (crítica/alta/media/baja) y recomendaciones

**Tipos de Alertas:**
- `high_demand`: Ingrediente usado en >50% de platos
- `market_unreliable`: Tasa de éxito del mercado <70%
- `frequent_purchases`: Stock insuficiente, compras cada <5 platos
- `potential_bottleneck`: Combinación crítica de factores
- `ai_prediction`: Análisis generado por IA

## Variables de Entorno Críticas

**Backend** (`microservices/.env`):
```env
DATABASE_URL=postgresql://lunch:lunch123@localhost:5432/lunch_db
RABBITMQ_URL=amqp://lunch:lunch123@localhost:5672
REDIS_URL=redis://localhost:6379
MARKET_API_URL=https://recruitment.alegra.com/api/farmers-market
GROQ_API_KEY=gsk_tu_key_aqui
GROQ_MODEL=llama-3.1-8b-instant
GROQ_ENABLED=true
FORCE_ANALYSIS_INTERVAL_MS=300000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:4000/api/v1
```

## Testing

### Configuración de Tests
- Framework: Vitest con configuración en `microservices/vitest.config.ts`
- Tipos: Unit, Integration, E2E
- Path aliases configurados para todos los paquetes `@lunch/*`
- Coverage con v8
- Testcontainers para PostgreSQL y RabbitMQ en tests de integración

### Ejecutar Tests Específicos
```bash
# Test de un paquete específico
cd microservices
pnpm test packages/bus/src/__tests__/

# Test de un archivo específico
pnpm test packages/db/src/__tests__/pool.test.ts

# Test con UI
pnpm test:ui
```

## Debugging y Monitoreo

### Health Check
```bash
# Solo el BFF expone HTTP
curl http://localhost:4000/health
```

### Logs de Workers
Los demás servicios son workers sin HTTP. Para verificar estado:
```bash
docker logs -f kitchen-svc --tail=50
docker logs inventory-svc | grep "ingredients reserved"
docker logs predictor-svc | grep "✅ Prediction completed"
```

### RabbitMQ Management
- URL: http://localhost:15672
- Credenciales: guest/guest

### PostgreSQL
```bash
docker exec -it lunch-pg psql -U postgres -d lunchday
# Consultas útiles:
# \dt                                          -- Listar tablas
# SELECT COUNT(*) FROM orders WHERE status = 'completed';
# SELECT * FROM prediction_alerts ORDER BY severity;
```

## Convenciones de Código

### Estructura de Microservicios
Cada microservicio en `apps/` sigue esta estructura:
```
<service-name>/
├── src/
│   ├── index.ts              # Entry point
│   ├── handlers/             # Event handlers o route handlers
│   ├── repositories/         # Acceso a datos (PostgreSQL)
│   └── __tests__/            # Tests del servicio
├── package.json
└── tsconfig.json
```

### Paquetes Compartidos
- Exportar desde `src/index.ts` principal
- Incluir `build` script en `package.json`
- Usar path aliases `@lunch/<package-name>` en imports

### Eventos RabbitMQ
- Formato de nombres: `entity.action` (ej: `order.created`, `plate.completed`)
- Payloads tipados con Zod schemas en `@lunch/shared-kernel`

### Reglas de Arquitectura (Backend)
> [!IMPORTANT]
> **Service-Repository Pattern**
> - **Repositories**: DEBEN encapsular TODA la lógica de SQL.
> - **Services**: NO DEBEN construir strings de SQL (`WHERE...`). Deben pasar objetos de criterios (`Criteria`) al repositorio.

### Reglas de Frontend
> [!TIP]
> **Manejo de Errores**
> - Usar siempre la clase `ApiError` definida en `shared/lib/http.ts` para errores HTTP.
> - Evitar el tipo `any` en bloques catch.

## Troubleshooting Común

### IA no funciona
1. Verificar `GROQ_API_KEY` en `.env`
2. Confirmar `GROQ_ENABLED=true`
3. Ver logs: `docker logs predictor-svc --tail=50`

### Migraciones fallan
```bash
pnpm migrate:status
# Si hay problemas, rollback y re-aplicar
pnpm migrate:down
pnpm migrate:up
```

### Tests fallan
- Asegurarse que los path aliases en `vitest.config.ts` estén actualizados
- Verificar que los paquetes compartidos estén construidos: `pnpm build:shared`
- Los tests de integración usan Testcontainers, requieren Docker corriendo

### RabbitMQ no conecta
```bash
docker ps | grep rabbitmq
docker logs lunch-rabbit
docker restart lunch-rabbit
```

## Notas Importantes

- **Solo el BFF expone HTTP**: Los otros 5 servicios son workers basados en eventos de RabbitMQ
- **Sistema de reservas**: Inventory usa reservas atómicas con timeout automático para evitar race conditions
- **Rate limiting IA**: Groq API tiene límite de 30 req/min en tier gratuito
- **Polling frontend**: Dashboard usa diferentes intervalos (stats: 2s, inventory: 3s, predictions: 30s)
- **Workspace monorepo**: Usar `pnpm -F <workspace>` para ejecutar comandos en workspaces específicos

## Restricciones Arquitectónicas

> [!IMPORTANT]
> **NO AUTENTICACIÓN/AUTORIZACIÓN**
>
> Este proyecto es una **prueba técnica/demo**, NO un sistema de producción.
>
> **REGLA ESTRICTA:** NO implementar autenticación JWT, tokens, OAuth, o cualquier sistema de auth/authz. Todas las APIs del BFF deben permanecer públicas y sin protección.
>
> Enfocarse en:
> - ✅ Observabilidad (tracing, métricas, logs)
> - ✅ Performance (indexes, caching, circuit breakers)
> - ✅ Resiliencia (retry logic, idempotency)
> - ✅ Calidad de código (tests, documentación)
>
> NO implementar:
> - ❌ JWT/tokens
> - ❌ User management
> - ❌ Role-based access control (RBAC)
> - ❌ Session management

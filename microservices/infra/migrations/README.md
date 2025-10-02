# 📦 Sistema Centralizado de Migraciones

## 🎯 Descripción

Sistema centralizado para gestionar todas las migraciones de base de datos del proyecto. Incluye una CLI basada en pnpm para uso local y una imagen Docker lista para ejecutarse en `docker-compose.prod`, garantizando que los servicios esperen a que la base de datos esté al día antes de arrancar.

---

## 🏗️ Estructura

```
infra/migrations/
├── 001_core_tables.ts           # Tablas core (stock, reservations, etc.)
├── 002_predictions_legacy.ts    # Tablas de predicciones (versión inicial)
├── 003_predictions_refactor.ts  # Refactor a modelo basado en órdenes
├── 004_add_purchasing_status.ts # Estados de compra y métricas extra
├── runner.ts                    # Motor de migraciones
├── index.ts                     # CLI principal (ESM)
├── package.json                 # Dependencias y scripts pnpm
├── tsconfig.json                # Configuración de TypeScript para build
├── Dockerfile                   # Imagen para ejecutar migraciones (prod)
└── README.md                    # Este archivo
```

---

## 🚀 Uso

### Local (CLI pnpm)

```bash
# Ubícate en la raíz del monorepo
cd microservices

# Ver estado
pnpm migrate:status

# Ejecutar todas las pendientes
pnpm migrate

# Atajo equivalente (up / down / rollback)
pnpm migrate:up
pnpm migrate:down
pnpm migrate:rollback
```

> Los scripts anteriores delegan en el paquete `infra/migrations` mediante `pnpm -F migrations …`, por lo que no es necesario entrar manualmente a la carpeta ni instalar dependencias por separado.

### Producción / Docker Compose

`infra/docker-compose.prod.yml` define el servicio **db-migrate**, el cual compila las migraciones y las ejecuta antes de iniciar el resto de servicios.

```bash
# Construir la imagen de migraciones
docker compose -f infra/docker-compose.prod.yml build db-migrate

# Ejecutar sólo las migraciones
docker compose -f infra/docker-compose.prod.yml up db-migrate

# Levantar todo el stack (las apps esperan al servicio de migraciones)
docker compose -f infra/docker-compose.prod.yml up --build
```

---

## 📋 Migraciones Disponibles

### 001 - Core Tables
**Tablas:**
- `stock`: Inventario de ingredientes
- `reservations`: Órdenes/platos
- `reservation_items`: Ingredientes por plato
- `market_purchases`: Compras en el mercado

**Seeds:**
- 10 ingredientes con stock inicial de 5 unidades

### 002 - Predictions Legacy
**Tablas:**
- `predictions`: Registro de predicciones
- `prediction_alerts`: Alertas de escasez
- `prediction_consumption_analysis`: Análisis de consumo

### 003 - Predictions Refactor
**Cambios:**
- ✅ Cambia `analysis_window_hours` → `analysis_window_orders`
- ✅ Elimina `predicted_shortage_at` y `hours_until_shortage`
- ✅ Agrega campos: `alert_type`, `orders_using_ingredient`, `purchase_frequency`, `market_success_rate`, `actionable`
- ✅ Nueva tabla: `prediction_purchase_analysis`
- ✅ Cambia `average_consumption_rate` → `average_consumption_per_order`

### 004 - Add Purchasing Status
**Cambios:**
- ✅ Campo `purchase_status` en `market_purchases` para evitar duplicados
- ✅ Métricas enriquecidas para seguimiento de reintentos y resultados
- ✅ Limpieza/seed de datos alineados al nuevo flujo de compras

---

## 🔧 Crear Nueva Migración

### 1. Crear archivo

```bash
cd microservices/infra/migrations
touch 005_mi_nueva_migracion.ts
```

### 2. Estructura del archivo

```typescript
import { getDbPool, closeDatabase } from '@lunch/db';
import { createLogger } from '@lunch/logger';

const log = createLogger('migration-005');

/**
 * Migración 005: Descripción de lo que hace
 */
export async function up() {
  const pool = getDbPool('migration-005');

  try {
    log.info('Running migration 005: Mi nueva migración');
    await pool.query('BEGIN');

    // Tus queries aquí
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mi_tabla (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL
      );
    `);

    await pool.query('COMMIT');
    log.info('✅ Migration 005 completed successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Migration 005 failed');
    throw error;
  } finally {
    await closeDatabase('migration-005');
  }
}

export async function down() {
  const pool = getDbPool('migration-005-down');

  try {
    log.info('Rolling back migration 005');
    await pool.query('BEGIN');
    await pool.query('DROP TABLE IF EXISTS mi_tabla CASCADE');
    await pool.query('COMMIT');

    log.info('✅ Migration 005 rolled back successfully');
  } catch (error) {
    await pool.query('ROLLBACK');
    log.error({ error }, '❌ Rollback 005 failed');
    throw error;
  } finally {
    await closeDatabase('migration-005-down');
  }
}
```

### 3. Registrar en `index.ts`

```typescript
import * as migration005 from './005_mi_nueva_migracion.js';

const migrations = [
  // ... migraciones existentes
  {
    id: '005',
    name: 'Mi nueva migración',
    up: migration005.up,
    down: migration005.down,
  },
];
```

> Nota: El archivo compilado vive en `dist/005_mi_nueva_migracion.js`, de ahí que el import use sufijo `.js`.

---

## 🗄️ Tabla de Control

Las migraciones aplicadas se rastrean en `schema_migrations`:

```sql
SELECT * FROM schema_migrations ORDER BY applied_at DESC;
```

| id | migration_id | migration_name | applied_at |
|----|--------------|----------------|------------|
| 4  | 004          | Add purchasing status... | 2025-10-01... |
| 3  | 003          | Predictions refactor... | 2025-10-01... |
| 2  | 002          | Predictions tables... | 2025-10-01... |
| 1  | 001          | Core tables... | 2025-10-01... |

---

## ⚠️ Mejores Prácticas

- Versiona nuevas migraciones con prefijo incremental (`005_`, `006_`, …).
- Usa transacciones (`BEGIN/COMMIT/ROLLBACK`) para garantizar consistencia.
- Cierra siempre el pool con `closeDatabase` en `finally`.
- Prueba las migraciones localmente antes de publicarlas (`pnpm migrate` + `pnpm migrate:rollback`).
- Si cambias seeds o datos, documenta claramente el impacto en los servicios.


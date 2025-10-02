# 🚀 Backend - Microservicios

Sistema de microservicios en Node.js + TypeScript para gestión automatizada de cocina en eventos masivos de donación de comida.

## 📋 Descripción

Backend basado en arquitectura de microservicios que maneja:

- ✅ Procesamiento de órdenes en alta demanda
- ✅ Gestión de inventario con reservas atómicas
- ✅ Compras automáticas al mercado externo
- ✅ Predicción de escasez con IA (Groq + Llama 3.1 8B)
- ✅ Comunicación asíncrona entre servicios (RabbitMQ)
- ✅ Cache distribuido (Redis)

## 🏗️ Arquitectura de Microservicios

```
microservices/
├── apps/
│   ├── bff/                    # Backend For Frontend - API Gateway
│   ├── order-svc/              # Gestión de órdenes
│   ├── kitchen-svc/            # Procesamiento de platos
│   ├── inventory-svc/          # Control de bodega e inventario
│   ├── market-adapter-svc/     # Integración con plaza de mercado
│   └── predictor-svc/          # Análisis predictivo con IA
│
├── packages/                   # Paquetes compartidos (DRY)
│   ├── bus/                    # Event bus (RabbitMQ)
│   ├── config/                 # Configuración centralizada
│   ├── db/                     # Pool de conexiones PostgreSQL
│   ├── logger/                 # Logger estructurado (Pino)
│   ├── messaging/              # Helpers de mensajería
│   ├── recipes/                # Definición de recetas
│   ├── recommender-ai/         # Motor de predicción con IA
│   ├── redis/                  # Cliente Redis compartido
│   ├── shared-kernel/          # Tipos y constantes compartidas
│   └── utils/                  # Utilidades comunes
│
└── infra/
    ├── migrations/             # Migraciones de base de datos
    └── docker-compose.*.yml    # Configuraciones Docker
```

## 🎯 Microservicios

### 1. BFF (Backend For Frontend)
**Puerto**: 4000 (HTTP - Fastify)

**Responsabilidades**:
- API Gateway para el frontend
- Agregación de datos de múltiples servicios
- Endpoints REST optimizados para la UI

**Endpoints principales**:
```
GET  /health                      # Health check
POST /orders                      # Crear órdenes (bulk)
GET  /orders                      # Listar órdenes
GET  /orders/:id                  # Detalle de orden
GET  /stats                       # Estadísticas de cocina
GET  /inventory                   # Estado del inventario
GET  /purchases                   # Historial de compras
GET  /recipes                     # Recetas disponibles
GET  /predictions/latest          # Última predicción
GET  /predictions/alerts          # Alertas activas
GET  /predictions/summary         # Resumen de predicciones
```

### 2. Order Service
**Tipo**: Worker (RabbitMQ)

**Responsabilidades**:
- Crear y gestionar órdenes
- Publicar eventos de nuevas órdenes
- Tracking de estado de órdenes

**Eventos que publica**:
- `order.created` - Nueva orden creada

### 3. Kitchen Service
**Tipo**: Worker (RabbitMQ)

**Responsabilidades**:
- Escuchar órdenes nuevas
- Seleccionar recetas aleatorias
- Reservar ingredientes en bodega
- Coordinar compras al mercado
- Preparar y entregar platos

**Eventos que escucha**:
- `order.created` - Procesar nueva orden

**Eventos que publica**:
- `plate.completed` - Plato completado
- `plate.failed` - Plato falló (falta de ingredientes)

### 4. Inventory Service
**Tipo**: Worker (RabbitMQ)

**Responsabilidades**:
- Gestión de stock en bodega
- Sistema de reservas atómicas
- Confirmación/liberación de ingredientes
- Inicialización de inventario (5 unidades por ingrediente)

**Características**:
- Reservas con timeout automático
- Operaciones atómicas con PostgreSQL
- Stock inicial configurable

### 5. Market Adapter Service
**Tipo**: Worker (RabbitMQ)

**Responsabilidades**:
- Integración con API externa del mercado
- Retry automático en caso de falla
- Registro de todas las compras
- Manejo de disponibilidad variable del mercado

**API Externa**:
```
POST https://recruitment.alegra.com/api/farmers-market/buy
Body: { "ingredient": "tomato" }
Response: { "quantitySold": 5 }
```

### 6. Predictor Service
**Tipo**: Background Worker (Sin puerto HTTP)

**Responsabilidades**:
- Análisis automático cada 5 minutos
- Recolección de datos históricos (consumo + compras)
- Análisis estadístico (promedios, desviaciones, tendencias)
- Predicción con IA usando Groq API
- Generación de alertas operacionales
- Almacenamiento de predicciones en DB

**Motor de IA**:
- **Groq API** (tier gratuito)
- **Modelo**: Llama 3.1 8B Instant
- **Análisis**: Predicción de escasez basada en patrones
- **Output**: JSON estructurado con reasoning y recomendaciones

## 🔧 Stack Tecnológico

### Core
- **Node.js** 18+
- **TypeScript** 5.x
- **pnpm** - Gestor de paquetes con workspaces

### Framework y Librerías
- **Fastify** - Framework HTTP de alto rendimiento (solo BFF)
- **Zod** - Validación de esquemas
- **Pino** - Logger JSON estructurado

### Bases de Datos y Persistencia
- **PostgreSQL** 15 - Base de datos principal
- **Redis** - Cache y coordinación distribuida

### Mensajería
- **RabbitMQ** - Message broker (AMQP)
- **amqplib** - Cliente RabbitMQ

### IA y Machine Learning
- **Groq SDK** - Cliente para Groq API
- **Llama 3.1 8B Instant** - Modelo de lenguaje

## 🚀 Configuración y Ejecución

### Variables de Entorno

Crea un archivo `.env` en la raíz de `microservices/`:

```env
# === Base de Datos ===
DATABASE_URL=postgresql://lunch:lunch123@localhost:5432/lunch_db

# === Message Broker ===
RABBITMQ_URL=amqp://lunch:lunch123@localhost:5672

# === Cache ===
REDIS_URL=redis://localhost:6379

# === API Externa ===
MARKET_API_URL=https://recruitment.alegra.com/api/farmers-market

# === Groq IA ===
GROQ_API_KEY=gsk_tu_key_aqui
GROQ_MODEL=llama-3.1-8b-instant
GROQ_ENABLED=true

# === Configuración del Predictor ===
FORCE_ANALYSIS_INTERVAL_MS=300000  # 5 minutos
ANALYSIS_WINDOW_HOURS=1
KEEP_PREDICTIONS_COUNT=100
```

### Instalación

```bash
# Instalar dependencias
pnpm install

# Construir todos los paquetes y servicios
pnpm build
```

### Migraciones de Base de Datos

```bash
# Aplicar migraciones
pnpm migrate:up

# Ver estado
pnpm migrate:status

# Revertir última migración
pnpm migrate:down
```

### Ejecución en Desarrollo

#### Opción A: Todos los servicios con Docker Compose

```bash
# Levantar infraestructura + todos los microservicios
docker-compose -f infra/docker-compose.dev.yml up

# Ver logs de un servicio específico
docker logs -f bff
docker logs -f predictor-svc
```

#### Opción B: Desarrollo local (sin Docker)

```bash
# Terminal 1: Infraestructura (DB, RabbitMQ, Redis)
docker-compose -f infra/docker-compose.infra.yml up

# Terminal 2: Todos los microservicios
pnpm dev
```

### Ejecución en Producción

```bash
# Construir y levantar todo
docker-compose -f infra/docker-compose.prod.yml up --build -d

# Ver logs
docker-compose -f infra/docker-compose.prod.yml logs -f

# Detener
docker-compose -f infra/docker-compose.prod.yml down
```

## 📊 Base de Datos

### Esquema Principal

#### Tabla: `orders`
```sql
id, created_at, status (pending | cooking | completed | failed)
```

#### Tabla: `reservations`
```sql
id, plate_id, ingredient, quantity, 
reserved_at, expires_at, confirmed, released
```

#### Tabla: `market_purchases`
```sql
id, plate_id, ingredient, quantity_requested, 
quantity_sold, created_at, purchasing_status
```

#### Tabla: `predictions`
```sql
id, generated_at, analysis_window_orders, 
total_orders_analyzed, critical_alerts_count, 
high_alerts_count, medium_alerts_count, low_alerts_count
```

#### Tabla: `prediction_alerts`
```sql
id, prediction_id, ingredient, alert_type, 
current_stock, severity, confidence, 
orders_using_ingredient, purchase_frequency, 
market_success_rate, recommended_reorder_qty, 
reason, actionable
```

## 🔄 Flujo de Procesamiento de Órdenes

```
Frontend → BFF (POST /orders)
         → Order Service (event)
         → Kitchen Service (escucha event)
         → Inventory Service (reserva)
         → Market Adapter (si falta stock)
         → Kitchen Service (prepara plato)
         → BFF (GET /stats) → Frontend
```

## 🤖 Sistema de Predicción con IA

### Algoritmo

1. **Recolección**: Últimas 100 órdenes + compras + stock actual
2. **Estadísticas**: Promedios, desviaciones, tendencias
3. **Reglas**: Alertas basadas en thresholds configurables
4. **IA (Groq)**: Análisis con Llama 3.1 8B
5. **Alertas**: Priorizadas por severidad + confidence

### Tipos de Alertas

| Tipo | Trigger |
|------|---------|
| `high_demand` | Ingrediente en >50% de platos |
| `market_unreliable` | Tasa éxito mercado <70% |
| `frequent_purchases` | Compra cada <5 platos |
| `potential_bottleneck` | Combinación crítica |
| `ai_prediction` | Análisis IA Llama 3.1 |

## 🔍 Monitoreo y Debugging

### Health Check

```bash
# Solo el BFF expone un endpoint HTTP
curl http://localhost:4000/health
```

**Importante**: Los demás servicios (order-svc, kitchen-svc, inventory-svc, market-adapter-svc, predictor-svc) son **workers basados en eventos** que solo escuchan RabbitMQ y **NO exponen puertos HTTP**.

Para verificar su estado:

```bash
# Ver logs de cada servicio
docker logs -f order-svc --tail=50
docker logs -f kitchen-svc --tail=50
docker logs -f inventory-svc --tail=50
docker logs -f market-adapter-svc --tail=50
docker logs -f predictor-svc --tail=50

# Verificar que estén procesando eventos
docker logs kitchen-svc | grep "plate prepared"
docker logs inventory-svc | grep "ingredients reserved"
docker logs predictor-svc | grep "✅ Prediction completed"
```

### Logs Estructurados

Todos los servicios usan Pino para logs JSON:

```bash
# Ver logs en tiempo real
docker logs -f bff --tail=100

# Filtrar por nivel de error
docker logs bff | grep '"level":50'

# Buscar por palabra clave
docker logs predictor-svc | grep "🤖"
```

### RabbitMQ Management

```
URL: http://localhost:15672
Usuario: lunch
Password: lunch123
```

### PostgreSQL

```bash
# Conectar a la base de datos
docker exec -it postgres psql -U lunch -d lunch_db

# Consultas útiles
SELECT COUNT(*) FROM orders WHERE status = 'completed';
SELECT * FROM prediction_alerts ORDER BY severity;
\q  # Salir
```

## 📈 Performance

### Capacidad
- **Órdenes simultáneas**: 100+ platos en <30 segundos
- **Throughput**: ~200-300 órdenes/minuto
- **Latencia API**: <100ms (p95)
- **Análisis IA**: ~2-3 segundos por ingrediente

### Optimizaciones
- ✅ Pool de conexiones a PostgreSQL
- ✅ Cache Redis para datos frecuentes
- ✅ Reservas con timeout automático
- ✅ Procesamiento asíncrono con RabbitMQ
- ✅ Bulk inserts en base de datos
- ✅ Rate limiting en Groq API (30 req/min)

## 🛠️ Troubleshooting

### La IA no funciona

```bash
# 1. Verificar API key
grep GROQ_API_KEY .env

# 2. Ver logs del predictor
docker logs predictor-svc --tail=50

# 3. Verificar que esté habilitado
grep GROQ_ENABLED .env  # Debe ser 'true'
```

### RabbitMQ no conecta

```bash
# 1. Verificar que RabbitMQ esté corriendo
docker ps | grep rabbitmq

# 2. Ver logs
docker logs rabbitmq

# 3. Reiniciar
docker restart rabbitmq
```

### Problemas con migraciones

```bash
# 1. Ver estado
pnpm migrate:status

# 2. Rollback y re-aplicar
pnpm migrate:down
pnpm migrate:up

# 3. Reset completo (⚠️ PERDERÁS DATOS)
docker-compose down -v
docker-compose up -d
pnpm migrate:up
```

## 📚 Recursos Adicionales

- [Groq API Documentation](https://console.groq.com/docs)
- [Fastify Documentation](https://www.fastify.io/)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Desarrollado con** ⚡ **Node.js + TypeScript + Microservicios**

# 🍽️ Jornada de Almuerzo Gratis - Sistema de Gestión de Cocina

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Fastify](https://img.shields.io/badge/fastify-%23000000.svg?style=for-the-badge&logo=fastify&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

<div align="center">
  <img src="kitchen-dashboard.gif" alt="Dashboard Demo" width="100%" />
</div>

<br/>

Sistema completo de gestión automatizada para eventos masivos de donación de comida, con análisis predictivo impulsado por IA.

## 📋 Descripción del Proyecto

Este sistema fue diseñado para manejar la operación de un restaurante durante un evento de **donación masiva de comida gratis**. El sistema automatiza todo el flujo desde que se solicita un plato hasta que se entrega al comensal, incluyendo:

- ✅ Gestión automática de órdenes
- ✅ Control de inventario en tiempo real
- ✅ Historial de compras detallado
- ✅ Predicciones de tráfico y eficiencia con IA
- ✅ Arquitectura de microservicios escalable

- ✅ Predicciones de tráfico y eficiencia con IA
- ✅ Arquitectura de microservicios escalable

## 🏗️ Arquitectura

```
lunch-alegra-monorepo/
├── microservices/          # Backend - Microservicios Node.js
│   ├── apps/
│   │   ├── bff/                    # Backend For Frontend
│   │   ├── order-svc/              # Servicio de órdenes
│   │   ├── kitchen-svc/            # Servicio de cocina
│   │   ├── inventory-svc/          # Servicio de inventario/bodega
│   │   ├── market-adapter-svc/     # Adaptador para plaza de mercado
│   │   └── predictor-svc/          # Servicio de predicción con IA
│   ├── packages/                   # Paquetes compartidos
│   └── infra/                      # Infraestructura y migraciones
│
└── frontend/               # Frontend - Vue 3 + TypeScript
    ├── src/
    │   ├── features/       # Módulos por funcionalidad
    │   ├── components/     # Componentes UI (shadcn-vue)
    │   └── widgets/        # Widgets compuestos
    └── public/
```

## 🚀 Tecnologías Principales

### Backend
- **Node.js** + **TypeScript** - Runtime y lenguaje
- **Fastify** - Framework HTTP de alto rendimiento
- **PostgreSQL** - Base de datos relacional
- **RabbitMQ** - Message broker para comunicación entre microservicios
- **Redis** - Cache y coordinación distribuida
- **Groq API + Llama 3.1 8B** - Motor de IA para predicciones

### Frontend
- **Vue 3** - Framework progresivo
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS v4** - Framework de utilidades CSS
- **shadcn-vue** - Componentes UI basados en Reka UI
- **TanStack Query** - Manejo de estado del servidor

### Infraestructura
- **Docker** + **Docker Compose** - Contenedores y orquestación
- **pnpm** - Gestor de paquetes eficiente
- **AWS EC2 t2.micro** - Servidor en la nube

## 📦 Requisitos Previos

- **Node.js** ≥ 18.x
- **pnpm** ≥ 8.x
- **Docker** + **Docker Compose**
- Cuenta en **Groq** (para IA - tier gratuito)

## 🎯 Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd lunch-alegra-monorepo
```

### 2. Instalar dependencias

```bash
# Backend
cd microservices
pnpm install

# Frontend (en otra terminal)
cd frontend
pnpm install
```

### 3. Configurar variables de entorno

**Backend** (`microservices/.env`):
```env
# Base de datos
DATABASE_URL=postgresql://lunch:lunch123@localhost:5432/lunch_db

# RabbitMQ
RABBITMQ_URL=amqp://lunch:lunch123@localhost:5672

# Redis
REDIS_URL=redis://localhost:6379

# Groq IA
GROQ_API_KEY=tu_api_key_aqui
GROQ_MODEL=llama-3.1-8b-instant
GROQ_ENABLED=true

# Servicios
FORCE_ANALYSIS_INTERVAL_MS=300000  # 5 minutos
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:4000/api/v1
```

### 4. Levantar el sistema

#### Opción A: Con Docker Compose (Recomendado)

```bash
# En la carpeta microservices
cd microservices/infra

# Levantar infraestructura + microservicios
docker-compose -f docker-compose.dev.yml up

# En otra terminal, levantar el frontend
cd ../../frontend
pnpm dev
```

#### Opción B: Desarrollo local

```bash
# Terminal 1: Infraestructura
cd microservices/infra
docker-compose -f docker-compose.infra.yml up

# Terminal 2: Aplicar migraciones
cd microservices
pnpm migrate:up

# Terminal 3: Backend
cd microservices
pnpm dev

# Terminal 4: Frontend
cd frontend
pnpm dev
```

**Acceder a**:
- Frontend: http://localhost:5173
- BFF API: http://localhost:4000/api/v1

## 🎮 Uso del Sistema

### Dashboard Principal

1. **Iniciar Órdenes**: Presiona el botón "Iniciar Pedido" e ingresa la cantidad de platos (1-100)
2. **Monitorear Cocina**: Observa en tiempo real las estadísticas de preparación
3. **Revisar Inventario**: Consulta el stock actual de ingredientes
4. **Ver Órdenes**: Lista de todas las órdenes procesadas con detalles

### Análisis IA (Pestaña "Análisis IA")

- **Alertas Operacionales**: Identifica ingredientes con problemas
- **Predicciones Inteligentes**: Recomendaciones basadas en IA
- **Gráficos de Salud**: Visualización del estado del inventario
- **Tráfico en Tiempo Real**: Gráfico de pedidos por hora vs capacidad
- **Eficiencia de Cocina**: Gauge de rendimiento operativo
- **Información del Sistema**: Detalles sobre Groq + Llama 3.1 8B

### Historial de Mercado
- Registro detallado de todas las transacciones de compra de ingredientes.
- Filtros por estado (Exitoso/Fallido) y paginación real.

## 🤖 Sistema de Predicción con IA

El sistema utiliza **Groq API** con el modelo **Llama 3.1 8B Instant** para:

### Análisis Automático
- Se ejecuta cada **5 minutos**
- Analiza hasta las últimas **100 órdenes**
- Calcula estadísticas avanzadas (promedios, desviaciones, tendencias)

### Tipos de Alertas
1. **Alta Demanda**: Ingrediente usado en +50% de los platos
2. **Mercado Poco Confiable**: Tasa de éxito del mercado <70%
3. **Compras Frecuentes**: Stock insuficiente
4. **Cuello de Botella**: Combinación crítica de factores
5. **Predicción IA**: Análisis generado por Llama 3.1

### Niveles de Severidad
- **Crítica**: Acción inmediata requerida
- **Alta**: Planificar solución pronto
- **Media**: Monitorear de cerca
- **Baja**: Información preventiva

## 📊 Scripts Disponibles

### Backend (microservices/)

```bash
# Desarrollo
pnpm dev                 # Todos los microservicios en modo desarrollo
pnpm build               # Construir todos los servicios

# Migraciones
pnpm migrate:up          # Aplicar migraciones
pnpm migrate:down        # Revertir última migración
pnpm migrate:status      # Ver estado de migraciones

# Utilidades
pnpm clean:all           # Limpieza completa (node_modules, dist, cache)
pnpm lint                # Ejecutar linter
pnpm typecheck           # Verificar tipos TypeScript
```

### Frontend (frontend/)

```bash
pnpm dev                 # Servidor de desarrollo
pnpm build               # Build para producción
pnpm preview             # Preview del build
```

### Docker Compose

```bash
# Desarrollo (microservices/infra/)
docker-compose -f docker-compose.dev.yml up        # Levantar todo
docker-compose -f docker-compose.dev.yml down      # Detener todo
docker-compose -f docker-compose.dev.yml logs -f   # Ver logs

# Solo infraestructura
docker-compose -f docker-compose.infra.yml up      # DB + RabbitMQ + Redis
```

## 🗄️ Base de Datos

### Migraciones

```bash
cd microservices

# Aplicar todas las migraciones
pnpm migrate:up

# Revertir última migración
pnpm migrate:down

# Ver estado
pnpm migrate:status
```

### Acceder a PostgreSQL

```bash
# Conectarse a la base de datos
docker exec -it postgres psql -U lunch -d lunch_db

# Comandos útiles
\dt                      # Listar tablas
\d orders                # Describir tabla
SELECT COUNT(*) FROM orders;  # Query de ejemplo
\q                       # Salir
```

### Tablas Principales

- **orders**: Órdenes de platos
- **reservations**: Reservas de ingredientes
- **market_purchases**: Compras en el mercado
- **predictions**: Análisis predictivos
- **prediction_alerts**: Alertas generadas por IA
- **prediction_consumption_analysis**: Análisis de consumo
- **prediction_purchase_analysis**: Análisis de compras

## 🔧 Troubleshooting

### El sistema no inicia

```bash
# Limpiar Docker
docker-compose down -v
docker system prune -f

# Reiniciar desde cero
cd microservices/infra
docker-compose -f docker-compose.dev.yml up --build
```

### La IA no funciona

1. Verifica tu `GROQ_API_KEY` en `microservices/.env`
2. Asegúrate que `GROQ_ENABLED=true`
3. Revisa logs del predictor:
```bash
docker logs -f predictor-svc
```

### Problemas con las migraciones

```bash
# Ver estado de migraciones
cd microservices
pnpm migrate:status

# Si hay problemas, conectar a DB y revisar
docker exec -it postgres psql -U lunch -d lunch_db
SELECT * FROM schema_migrations;
```

### Frontend no conecta con backend

1. Verifica que el backend esté corriendo: http://localhost:3000/health
2. Revisa `frontend/.env` que `VITE_API_URL=http://localhost:3000`
3. Revisa la consola del navegador para errores CORS

### Errores de Dependencias en Monorepo
Si al construir el BFF obtienes errores de tipos con `@lunch/messaging` u otros paquetes:
1. Ejecuta `pnpm install` en la raíz `microservices/` para refrescar symlinks.
2. Reconstruye el paquete específico: `pnpm --filter messaging build`.
3. Reintenta el build del servicio.

## 📈 Monitoreo

### Health Check

```bash
# Solo el BFF tiene health check HTTP
curl http://localhost:3000/health
```

**Nota**: Los demás servicios (order-svc, kitchen-svc, inventory-svc, market-adapter-svc, predictor-svc) son workers que escuchan eventos de RabbitMQ y no exponen endpoints HTTP. Para verificar su estado:

```bash
# Ver logs de servicios
docker logs -f order-svc
docker logs -f kitchen-svc
docker logs -f inventory-svc
docker logs -f market-adapter-svc
docker logs -f predictor-svc

# Verificar que están procesando eventos
docker logs bff | grep "orders created"
docker logs kitchen-svc | grep "plate prepared"
```

### RabbitMQ Management

```
URL: http://localhost:15672
Usuario: lunch
Password: lunch123
```

### PostgreSQL Health

```bash
docker exec postgres pg_isready -U lunch
```

## 🎨 Características del Frontend

- **Dashboard en tiempo real**: Actualización automática cada 2 segundos
- **Sistema de tabs**: Navegación entre Dashboard y Análisis IA
- **Diseño responsive**: Optimizado para desktop y tablet
- **Componentes modernos**: shadcn-vue con Tailwind CSS
- **Visualizaciones**: Gráficos de estado del inventario
- **Alertas inteligentes**: Badges de severidad con códigos de color

## 🔐 Seguridad

- Variables de entorno para credenciales sensibles
- Validación de datos con Zod
- CORS configurado para desarrollo
- PostgreSQL con usuario y contraseña dedicados

## 📝 Documentación Adicional

- [Backend README](./microservices/README.md) - Detalles de microservicios
- [Frontend README](./frontend/README.md) - Detalles de la aplicación Vue

## 🏆 Características Destacadas

### Arquitectura de Microservicios
- Cada servicio es independiente y escalable
- Comunicación asíncrona mediante RabbitMQ
- Despliegue independiente de servicios

### Sistema de Reservas
- Reservas atómicas de ingredientes con timeout
- Prevención de condiciones de carrera
- Confirmación/liberación automática

### Predicción con IA
- Análisis automático cada 5 minutos
- Modelo Llama 3.1 8B con respuestas estructuradas
- Combina reglas + IA para máxima precisión
- Recomendaciones accionables específicas

### Frontend Reactivo
- Polling inteligente con diferentes intervalos
- Cache automático con TanStack Query
- UI moderna con shadcn-vue
- Actualizaciones en tiempo real sin recargar

## 👥 Contribuciones

Este proyecto fue desarrollado con fines educativos y de demostración técnica.

## 📄 Licencia

Este proyecto es privado y fue creado con fines de evaluación técnica.

---

**Desarrollado con** ❤️

# Lunch Alegra - Monorepo

Este es el repositorio principal del proyecto Lunch Alegra, que contiene tanto los microservicios del backend como el frontend de la aplicación.

## Estructura del proyecto

```
lunch-alegra-monorepo/
├── microservices/          # Backend - Microservicios
│   ├── apps/              # Aplicaciones de microservicios
│   ├── packages/          # Paquetes compartidos
│   ├── infra/             # Infraestructura
│   └── scripts/           # Scripts de automatización
├── frontend/              # Frontend de la aplicación
└── docs/                  # Documentación del proyecto
```

## Comenzar

### Desarrollo con Docker (Recomendado)

#### 1. Instalación inicial
```bash
# Instalar dependencias de ambos proyectos
npm run install:all
```

#### 2. Desarrollo - Solo infraestructura + microservicios en modo desarrollo
```bash
# Levantar infraestructura (PostgreSQL, RabbitMQ, Redis) + microservicios en dev mode
npm run dev:microservices

# En otra terminal, ejecutar el frontend
npm run dev:frontend

# O ejecutar ambos simultáneamente
npm run dev:all
```

#### 3. Producción - Todos los servicios en Docker
```bash
# Construir y levantar todo el stack en modo producción
npm run prod:up

# Ver logs de todos los servicios
npm run prod:logs

# Detener todos los servicios
npm run prod:down
```

### Scripts disponibles

#### Desarrollo
- `npm run dev:infra` - Solo infraestructura (DB, RabbitMQ, Redis)
- `npm run dev:microservices` - Infraestructura + microservicios en modo dev
- `npm run dev:frontend` - Ejecutar frontend en modo desarrollo
- `npm run dev:all` - Ejecutar microservicios y frontend simultáneamente

#### Producción
- `npm run prod:up` - Levantar todo el stack en producción
- `npm run prod:down` - Detener el stack de producción
- `npm run prod:build` - Construir imágenes Docker
- `npm run prod:rebuild` - Reconstruir imágenes sin caché
- `npm run prod:logs` - Ver logs del stack de producción
- `npm run prod:restart` - Reiniciar stack de producción

#### Utilidades
- `npm run docker:clean` - Limpiar contenedores y volúmenes no utilizados
- `npm run docker:clean:all` - Limpieza profunda de Docker
- `npm run build:all` - Construir ambos proyectos
- `npm run test:all` - Ejecutar todas las pruebas
- `npm run lint:all` - Ejecutar linting en ambos proyectos

## Tecnologías utilizadas

### Backend
- Node.js
- Microservicios

### Frontend
- React/Vue/Angular (según tu stack)

## Contribuir

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

[Tu licencia aquí]
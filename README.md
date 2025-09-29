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

### Microservicios (Backend)

```bash
cd microservices
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

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
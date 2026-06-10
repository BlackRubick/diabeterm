# Diabeterm Evalúa

Sistema de preclasificación de pie diabético mediante imágenes térmicas y cuestionarios clínicos.

## Stack Tecnológico

- **Frontend**: Nuxt 4, Vue 3 Composition API, TypeScript, TailwindCSS, Pinia, VueUse, Nuxt UI 3
- **Backend**: Nuxt Server API (Nitro), Prisma ORM, MySQL, JWT (jose), bcryptjs
- **Validación**: Zod (cliente + servidor)

## Requisitos

- Node.js 20+
- MySQL 8+

## Instalación

```bash
# 1. Clonar e instalar dependencias
npm install --legacy-peer-deps

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y JWT_SECRET

# 3. Generar cliente Prisma y aplicar esquema
npx prisma generate
npx prisma db push

# 4. Cargar datos de prueba (opcional)
npm run db:seed

# 5. Iniciar en desarrollo
npm run dev
```

## Cuentas de demo (tras ejecutar seed)

| Rol     | Email                        | Contraseña   |
|---------|------------------------------|--------------|
| Doctor  | doctor@diabeterm.com         | doctor123    |
| Paciente| paciente@diabeterm.com       | paciente123  |

## Módulos

### Doctor
- `/dashboard` — Panel con estadísticas y últimas evaluaciones
- `/dashboard/pacientes` — Lista y búsqueda de pacientes
- `/dashboard/pacientes/nuevo` — Registro con cuestionario clínico en 2 pasos
- `/dashboard/pacientes/:id` — Historial, cuestionario y datos del paciente
- `/dashboard/evaluaciones/nueva` — Evaluación termográfica + motor de predicción
- `/dashboard/evaluaciones/:id` — Resultados detallados
- `/dashboard/reportes` — Distribución de riesgo y exportación

### Paciente
- `/paciente` — Panel con historial de evaluaciones
- `/paciente/evaluaciones/:id` — Detalle de evaluación y PDF

## Motor de Predicción

El endpoint `POST /api/prediccion` está preparado para integrar un modelo ML:

```json
{
  "evaluationId": "...",
  "pieDerecho": "/uploads/imagen.jpg",
  "pieIzquierdo": "/uploads/imagen.jpg",
  "respuestas": { ... }
}
```

Actualmente calcula el riesgo mediante factores clínicos del cuestionario. Para integrar un modelo de IA, reemplazar la función `calculateRiskScore` en `server/services/evaluationService.ts`.

## Dark Mode

Botón en el header para alternar entre modo claro y oscuro. Persiste entre sesiones.

## Estructura del proyecto

```
app/          — Frontend (Nuxt source dir)
  pages/      — Rutas de la app
  components/ — Componentes reutilizables
  composables/— Lógica reutilizable
  layouts/    — Layouts (auth, dashboard)
  middleware/ — Guards de ruta
  stores/     — Estado global (Pinia)
  plugins/    — Plugin de autenticación SSR

server/       — Backend (Nitro)
  api/        — Rutas de API REST
  middleware/ — Auth middleware (JWT)
  repositories/ — Capa de acceso a datos
  services/   — Lógica de negocio
  utils/      — JWT, bcrypt, Prisma client

prisma/       — Esquema y seed de la DB
public/       — Archivos estáticos e imágenes subidas
```

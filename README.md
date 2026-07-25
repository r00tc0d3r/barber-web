# Style Dealers — Barbería Online 🪒

Agendá tu turno online con los mejores barberos. Corte, barba, degradado y más servicios. Sin vueltas, sin llamadas.

## Stack

| Capa | Tecnología |
| --- | --- |
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + Tailwind CSS 4 |
| **Lenguaje** | TypeScript 5 (strict mode) |
| **Base de datos** | PostgreSQL (Neon serverless) |
| **ORM** | Prisma 7 |
| **Autenticación** | NextAuth 5 beta (Google OAuth + Credentials) |
| **Validación** | Zod 4 |
| **Calendar** | Google Calendar API |
| **Notificaciones** | Web Push API (Service Worker) |
| **Tiempo real** | WebSockets (ws) |
| **Logging** | Pino |
| **Testing** | Vitest (unit + integration) + Playwright (E2E) |

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  Next.js App Router                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Server      │  │ Server       │  │ Client     │  │
│  │ Components  │  │ Actions      │  │ Components │  │
│  └─────────────┘  └──────┬───────┘  └────────────┘  │
│                          │                          │
│                    ┌─────▼──────┐                   │
│                    │  Domain    │                   │
│                    │  Layer     │                   │
│                    │  (DDD)     │                   │
│                    └─────┬──────┘                   │
│                          │                          │
│                    ┌─────▼──────┐                   │
│                    │  Prisma/   │                   │
│                    │  Neon DB   │                   │
│                    └────────────┘                   │
└─────────────────────────────────────────────────────┘
```

El proyecto usa una arquitectura híbrida:

- **Domain Layer parcial** con DDD para el núcleo de turnos (Appointment entity, value objects, repository pattern)
- **Server Actions** para la capa de presentación (CRUD, auth, validación)
- **Capa de infraestructura** para Prisma, Google Calendar, notificaciones

Ver [`docs/architecture.md`](docs/architecture.md) para detalle completo.

## Setup Local

### Requisitos

- Node.js 22+
- pnpm 11+
- PostgreSQL (o cuenta en [Neon](https://neon.tech))
- Google Cloud project (para Calendar API, opcional)

### Instalación

```bash
# Clonar
git clone <repo-url>
cd barber-web

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Inicializar base de datos
pnpm exec prisma generate
pnpm exec prisma db push

# Poblar con datos de prueba
pnpm seed

# Iniciar dev server
pnpm dev
```

## Scripts

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Dev server en <http://localhost:3000> |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir build de producción |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type check |
| `pnpm test` | Tests unitarios + integración (Vitest) |
| `pnpm test:watch` | Tests en modo watch |
| `pnpm test:e2e` | Tests E2E (Playwright) |
| `pnpm seed` | Poblar DB con datos iniciales |

## Variables de Entorno

| Variable | Descripción | Requerida |
| --- | --- | --- |
| `DATABASE_URL` | URL de conexión PostgreSQL (Neon) | ✅ |
| `NEXTAUTH_SECRET` | Secreto para NextAuth | ✅ |
| `NEXTAUTH_URL` | URL base de la app (<http://localhost:3000> en dev) | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Para login Google |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Para login Google |
| `GOOGLE_CALENDAR_ID` | ID del calendario de Google | Para Calendar |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email | Para Calendar |
| `GOOGLE_PRIVATE_KEY` | Private key del service account | Para Calendar |
| `VAPID_PUBLIC_KEY` | VAPID public key (push notifications) | Para notificaciones |
| `VAPID_PRIVATE_KEY` | VAPID private key (push notifications) | Para notificaciones |

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Login (Google OAuth + credentials)
│   ├── admin/              # Admin panel (barberos, servicios, turnos, galería)
│   ├── agendar/            # Booking wizard + cancelación
│   ├── api/                # API routes (auth, push, health)
│   ├── perfil/             # Perfil del usuario
│   ├── offline/            # Offline fallback page
│   ├── layout.tsx          # Root layout (nav, footer, PWA)
│   ├── page.tsx            # Homepage
│   └── manifest.ts         # PWA manifest
├── components/             # UI components (navbar, footer, gallery, barber-card)
├── domain/                 # Domain layer (DDD)
│   ├── appointment/        # Appointment entity, service, repository, value objects
│   └── shared/             # Result pattern, error types
├── infrastructure/         # Implementaciones concretas
│   ├── prisma/             # PrismaAppointmentRepository
│   └── calendar/           # CalendarService impl
├── lib/                    # Utilidades
│   ├── auth.ts             # NextAuth config
│   ├── auth-guard.ts       # Authorization guard
│   ├── calendar.ts         # Google Calendar API
│   ├── env.ts              # Env validation
│   ├── format.ts           # Format helpers
│   ├── logger.ts           # Pino logger
│   ├── notifications.ts    # Push notifications
│   ├── prisma.ts           # Prisma client singleton
│   ├── rate-limit.ts       # Rate limiter
│   └── validations.ts      # Zod schemas
├── types/                  # TypeScript types
└── middleware.ts           # Security headers + CSP
```

## Testing

```bash
# Unit tests (domain layer) — no necesita DB
pnpm test

# Integration tests — necesita DATABASE_URL configurada
pnpm test

# E2E tests — necesita dev server corriendo + DB seed
pnpm test:e2e
```

## Licencia

MIT

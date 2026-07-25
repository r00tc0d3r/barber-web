# Architecture Guide — Style Dealers

## Domain Layer (DDD)

El domain layer sigue una arquitectura dirigida por dominio parcial, aplicada al núcleo del negocio: la gestión de turnos.

### Appointment Entity

`src/domain/appointment/appointment.ts`

Núcleo del sistema. Encapsula invariantes y operaciones de negocio:

```
Appointment
├── Factory: Appointment.create(data) → Result<Appointment, Error>
├── Getters: id, barberId, serviceId, status, date, etc.
├── Status transitions: confirm(), start(), complete(), cancel(), markNoShow()
├── Queries: isCancellable, isPast, isActive, durationMinutes
├── Serialization: toJSON(), toSummary()
└── Mutations: withNotes(), withGoogleCalendarEventId()
```

### Status Machine

```
PENDING ──────► CONFIRMED ──────► IN_PROGRESS ──┬──► COMPLETED
    │                │                           └──► NO_SHOW
    └──► CANCELLED   └──► CANCELLED
```

Transiciones validadas por `canTransition()` en value-objects. Estados terminales: COMPLETED, CANCELLED, NO_SHOW.

### Value Objects

`src/domain/appointment/value-objects.ts`

- **Branded types:** AppointmentId, BarberId, ServiceId, UserId, CancelToken (typado nominal via cruces de tipo)
- **AppointmentDateTime:** Validación y cálculo de start/end con timezone
- **ContactInfo:** Validación de datos de contacto vía Zod
- **AvailabilitySlot:** Ventana de disponibilidad del barbero (dayOfWeek, startTime, endTime)
- **Slot:** Time slot para la UI (time, available)
- **Price:** Value object con formato ARS

### Result Pattern

`src/domain/shared/result.ts`

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Permite manejar errores sin excepciones en el domain layer. Tipado discriminado para narrowing automático.

### Repository Pattern

`src/domain/appointment/appointment.repository.ts`

Interfaz (port) para persistencia:

- `findById`, `findByCancelToken`, `findMany`
- `findByBarberAndDate`, `findAppointmentsByBarberAndDate`
- `findAvailabilityByBarberAndDay`
- `isSlotAvailable`
- `create`, `updateStatus`, `setGoogleCalendarEventId`
- `count`

### Application Service

`src/domain/appointment/appointment.service.ts`

Orquesta casos de uso:

- `createAppointment`: valida input → crea entity → persiste → crea evento calendar (best-effort)
- `cancelAppointment`: busca por ID o token → cancela → persiste → actualiza calendar
- `updateStatus`: busca → valida transición → persiste → actualiza calendar
- `getAvailableSlots`: consulta disponibilidad del barbero → genera slots → filtra ocupados
- `getAppointment`: busca por ID

### Calendar Service Interface

`src/domain/appointment/calendar-service.ts`

Port para integración con calendarios externos:

- `createEvent`, `updateEventStatus`, `deleteEvent`

Implementación concreta: `src/infrastructure/calendar/calendar-service.impl.ts` (adapta Google Calendar API).

## Infrastructure Layer

### Prisma Repository

`src/infrastructure/prisma/prisma-appointment.repository.ts`

Implementación concreta de `AppointmentRepository` usando Prisma. Único punto de contacto con la base de datos.

Métodos privados:

- `getAvailableSlots()`: cálculo de slots internos para el método `isSlotAvailable`
- `toDomain()`: mapeo de registros Prisma → Appointment entity

### Calendar Implementation

`src/infrastructure/calendar/calendar-service.impl.ts`

Adapta las funciones de `src/lib/calendar.ts` a la interfaz `CalendarService`.

## Server Actions

### Agendar Actions

`src/app/agendar/actions.ts`

- `getAvailableSlots(barberId, serviceId, dateStr)`: consulta disponibilidad + genera slots
- `createAppointment(data)`: rate-limited (5/min por IP), valida slot contra race condition, crea turno + evento calendar

### Admin Actions

`src/app/admin/actions.ts`

- **Barberos:** `createBarber`, `updateBarber`, `deleteBarber` — CRUD directo vía Prisma
- **Servicios:** `createService`, `updateService`, `deleteService` — CRUD directo vía Prisma
- **Turnos:** `updateAppointmentStatus` — delega en `AppointmentService` + auth guard

### Auth Actions

`src/lib/auth.ts` — Configuración de NextAuth 5 con Google OAuth + Credentials.
`src/lib/auth-guard.ts` — Guard para rutas admin.

## Presentation Layer

### Booking Wizard

`src/app/agendar/booking-wizard.tsx`

Multi-step wizard con `useReducer`:

```
Barber ──► Service ──► DateTime ──► Info ──► Confirmed
```

Steps progresivos con indicador visual. Cada paso depende del anterior:

1. **Barber:** selecciona barbero → filtra servicios disponibles
2. **Service:** selecciona servicio → muestra duración y precio
3. **DateTime:** date picker → carga slots vía server action → selecciona horario
4. **Info:** formulario de contacto + resumen → submit
5. **Confirmed:** muestra detalle + opción de suscribirse a push notifications

### Admin Panel

`src/app/admin/layout.tsx`

Layout protegido con sidebar (desktop) + tabs (mobile). Rutas:

- `/admin` — Dashboard con KPIs
- `/admin/turnos` — Lista de turnos con change de estado
- `/admin/barberos` — CRUD de barberos
- `/admin/servicios` — CRUD de servicios
- `/admin/calendar` — Vista calendario
- `/admin/galeria` — Gestión de imágenes de galería
- `/admin/settings` — Configuración key-value

### Homepage

`src/app/page.tsx`

Server component que carga:

- Hero section con imagen de fondo
- Stats (cantidad de barberos y servicios)
- Próximos turnos del usuario logueado
- Galería de imágenes
- Lista de barberos con BarberCard
- CTA final

### PWA

- Service Worker (`public/sw.js`) con cacheo de assets
- Manifest (`src/app/manifest.ts`)
- Offline fallback page (`src/app/offline/page.tsx`)
- Install prompt component
- Push subscription component

## Security

`src/middleware.ts` aplica:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`: camera, microphone, geolocation deshabilitados
- `Strict-Transport-Security`: 2 años (solo production)
- `Content-Security-Policy`: restrictivo con `'unsafe-inline'` para scripts y styles

## Data Model

### Core Entities

```
User ───┬── Appointment ──── Barber
         │                      │
         └── PushSubscription   │
                    Barber ─────┤
                    Service ────┤
                                │
Barber ─── Availability (weekly schedule)
Barber ─── BarberService (N:N con Service)
```

### Appointment Status Flow

```
PENDING (al crear)
  │
  ├──► CONFIRMED (admin confirma)
  │       │
  │       ├──► IN_PROGRESS (barbero arranca)
  │       │       │
  │       │       ├──► COMPLETED
  │       │       └──► NO_SHOW
  │       │
  │       └──► CANCELLED
  │
  └──► CANCELLED
```

## Test Strategy

### Unit Tests (Vitest)

Cobertura del domain layer puro — sin dependencias externas:

- `appointment.test.ts`: 36 tests (entity behavior, transitions, invariants)
- `value-objects.test.ts`: 23 tests (date/time, status transitions, validation)

### Integration Tests (Vitest + PostgreSQL)

Requieren `DATABASE_URL` configurada:

- `prisma-appointment.repository.test.ts`: 5 tests (CRUD, queries)
- `agendar/actions.test.ts`: 3 tests (slot generation, appointment creation)
- `admin/actions.test.ts`: 3 tests (CRUD, auth guard)

Ejecutan con `describeIfDb` que skipea automáticamente si no hay DB disponible.

### E2E Tests (Playwright)

Requieren dev server corriendo:

- `booking.spec.ts`: 5 tests (homepage, wizard steps, cancel page)
- `admin.spec.ts`: 5 tests (auth, login, dashboard, appointments)

Corren con `pnpm test:e2e`.

## Decisiones Técnicas

### ¿Por qué DDD parcial?

El domain layer completo solo para el核心 de negocio (turnos). Admin CRUD (barberos, servicios, galería) usa Prisma directo porque no tienen lógica de negocio compleja. Pragmatismo sobre pureza arquitectónica.

### ¿Por qué Result pattern en vez de excepciones?

Las excepciones en el domain layer rompen el flujo de control y son difíciles de tipar. Result pattern fuerza al caller a manejar todos los casos (ok/err) explícitamente.

### ¿Por qué branded types?

`AppointmentId`, `BarberId`, etc. son branded types que previenen mezclar IDs de diferentes entidades en tiempo de compilación. El casting `as any` en los bordes (tests, server actions) es un trade-off aceptable.

### ¿Por qué Next.js 16?

Latest stable con soporte para React 19, Turbopack, y server components. El proyecto arrancó con create-next-app y se mantiene actualizado.

### Rate Limiting

Server actions de booking tienen rate limit de 5 requests/minuto por IP para prevenir abuso. Implementado con un Map en memoria (se pierde al reiniciar el server, suficiente para esta escala).

# SDD Explore — Refactorizar Booking Wizard

**Date**: 2026-07-26
**Status**: Complete

---

## Executive Summary

El `booking-wizard.tsx` es el componente más complejo del proyecto (complexity 32, 531 líneas). Es un monolito que contiene 5 pasos de un wizard de agendamiento, un reducer de estado, y toda la lógica de presentación en un solo archivo. El refactor busca descomponerlo en componentes más chicos, agregar validación client-side, mejorar la integración con la capa de dominio, y cubrir con tests.

---

## Current State

### Component Structure

```
booking-wizard.tsx (531 lines, complexity 32)
├── Types (Step, BookingResult, BookingState, BookingAction, Props)
├── bookingReducer (complexity 13, 12 action types)
├── BookingWizard component
│   ├── Progress indicator (inline)
│   ├── Step 1: Barber selection (inline)
│   ├── Step 2: Service selection (inline)
│   ├── Step 3: Date/time selection (inline)
│   ├── Step 4: Client info form (inline)
│   └── Step 5: Done screen (inline)
```

### State Machine

```
barber → service → datetime → info → done
  ↑         ↑         ↑        ↑
  └─ GO_BACK ┘─────────┘────────┘
```

**12 action types**: SELECT_BARBER, SELECT_SERVICE, SET_DATE, SET_SLOTS, LOADING_SLOTS, SELECT_TIME, SET_FIELD, SUBMITTING, SET_ERROR, SUCCESS, GO_BACK, RESET

### Data Flow

```
page.tsx (Server Component)
  → prisma.barber.findMany + prisma.service.findMany
  → BookingWizard (Client Component)
    → getAvailableSlots (Server Action → Prisma)
    → createAppointment (Server Action → Prisma + Google Calendar)
```

---

## Findings

### F1: Monolito de 531 líneas

**Severity**: High
**Evidence**: Un solo archivo contiene 5 pasos del wizard, el reducer, tipos, y toda la lógica de presentación.

**Impact**:

- Difícil de mantener y testear
- Cambios en un paso pueden romper otros
- No se pueden reutilizar pasos individuales

### F2: Sin validación client-side

**Severity**: High
**Evidence**: El formulario del paso 4 ("Tus datos") solo tiene `required` HTML attribute. No hay validación de formato de teléfono, email, ni nombre antes del submit.

**Impact**:

- El usuario ve errores del servidor después de submit
- Peor UX: el error llega tarde
- El server action hace Zod parse, pero el client no valida antes

### F3: Reducer complejo (complexity 13)

**Severity**: Medium
**Evidence**: 12 action types, manejo de estado asíncrono (loading slots, submitting), y lógica de negocio mezclada con UI state.

**Impact**:

- Difícil de testear (reducer puro, pero mucha superficie)
- Hardcoded step transitions en el reducer

### F4: Date/time handling frágil

**Severity**: Medium
**Evidence**: Fechas se manejan como strings (`"2026-07-26"`), se concatenan con hora para crear `Date` objects: `new Date(date + "T" + time)`. No hay timezone handling.

**Impact**:

- Bugs potenciales con timezone del servidor vs cliente
- Difícil de extender para features como recordatorios

### F5: Server action bypass domain layer

**Severity**: Medium
**Evidence**: `createAppointment` en `actions.ts` hace queries directas a Prisma, duplicando lógica que ya existe en `AppointmentService`. El domain service tiene validación, Result pattern, y calendar integration — pero no se usa.

**Impact**:

- Duplicated business logic
- No hay consistencia en cómo se crean turnos
- El domain layer no se puede testear desde el wizard

### F6: Tipos duplicados

**Severity**: Low
**Evidence**: `Slot` type definido en `actions.ts` (línea 9) y en `types/models.ts` (línea 109).

**Impact**:

- Confusión sobre cuál importar
- Divergencia potencial

### F7: Sin tests

**Severity**: Medium
**Evidence**: No hay archivos de test para el booking wizard. Los tests existentes cubren `admin/actions.ts` y `agendar/actions.ts` (server actions), pero no el componente.

**Impact**:

- Sin regressión protection
- Refactor sin red de seguridad

### F8: Loading states incompletos

**Severity**: Low
**Evidence**: Solo hay `loadingSlots` para el paso de fecha/hora. No hay loading state para la selección de barbero/servicio, ni para el submit (excepto el botón).

**Impact**:

- UX inconsistente

---

## Opportunities

### O1: Descomponer en componentes por paso

Crear un componente por paso: `BarberStep`, `ServiceStep`, `DateTimeStep`, `InfoStep`, `DoneStep`. El wizard orquesta los pasos y maneja el state.

### O2: Agregar validación client-side con Zod

Usar los schemas existentes en `lib/validations.ts` para validar en el cliente antes del submit. Mostrar errores inline.

### O3: Integrar con AppointmentService

Que el server action use el domain service en lugar de hacer queries directas a Prisma.

### O4: Extraer hooks custom

`useBookingWizard` para la lógica de estado, `useAvailableSlots` para la carga de slots.

### O5: Agregar tests

Tests unitarios para el reducer, tests de integración para cada paso, tests E2E para el flujo completo.

### O6: Mejorar date/time handling

Usar una librería de fechas (o Temporal API) para manejar timezone correctamente.

---

## Risks

| Risk | Severity | Mitigation |
| ------ | ---------- | ------------ |
| Romper el flujo de booking existente | High | TDD estricto: RED → GREEN → REFACTOR |
| Performance regression por más componentes | Low | React Compiler (React 19) maneja re-renders |
| Merge conflicts con otros cambios | Medium | Trabajar en feature branch, PRs encadenados |
| Domain service no cubre todos los casos | Medium | Verificar AppointmentService antes de integrar |

---

## Metrics

| Metric | Current | Target |
| -------- | --------- | -------- |
| Lines of code | 531 | ~100 (wizard) + ~80×4 (steps) |
| Complexity | 32 | <15 per component |
| Test coverage | 0% | >80% |
| Client-side validation | None | Zod schemas |
| Components | 1 | 6+ |

---

## Next Recommended

**Proposal phase**: Definir el alcance exacto del refactor, priorizar qué opportunities implementar, y establecer non-goals.

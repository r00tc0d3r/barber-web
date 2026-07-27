# SDD Proposal — Refactorizar Booking Wizard

**Date**: 2026-07-26
**Status**: Complete

---

## Problem Statement

El `booking-wizard.tsx` es el componente más complejo del proyecto (531 líneas, complexity 32). Es un monolito que contiene 5 pasos de un wizard de agendamiento, un reducer de estado, y toda la lógica de presentación en un solo archivo. Esto genera:

- **Mantenibilidad baja**: cambios en un paso pueden romper otros
- **Sin tests**: 0% de cobertura, sin regressión protection
- **UX deficiente**: sin validación client-side, loading states incompletos, sin transiciones
- **Arquitectura inconsistente**: el server action bypassa el domain layer (AppointmentService)
- **Sin features esperadas**: no se puede reprogramar turnos, no hay selección por especialidad, no hay recordatorios

## Target Users

- **Clientes**: personas que agendan turnos de barbería online
- **Barberos**: reciben las notificaciones y gestionan su disponibilidad
- **Admins**: supervisan el sistema completo

## Business Rules

1. Un cliente debe poder agendar un turno en ≤60 segundos (3-4 clicks)
2. La validación debe ser inline, no al final del formulario
3. Los horarios disponibles se actualizan en tiempo real al cambiar de fecha
4. El flujo debe funcionar en mobile (responsive)
5. El wizard debe ser accesible (keyboard navigation, screen readers)

## Current State vs Desired State

| Aspecto      | Current                              | Desired                                              |
| ------------ | ------------------------------------ | ---------------------------------------------------- |
| Estructura   | 1 archivo, 531 líneas                | 6+ archivos, ~100 líneas cada uno                    |
| Validación   | HTML required + server Zod           | Zod client-side + server Zod                         |
| Domain layer | Bypass (Prisma directo)              | AppointmentService integrado                         |
| Tests        | 0%                                   | >80% (unit + integration + E2E)                      |
| UX           | Sin loading states, sin transiciones | Loading por paso, transiciones suaves                |
| Features     | Solo agendar                         | Agendar + reprogramar + especialidad + recordatorios |

## Proposed Features

### F1: Refactor de estructura ( Maintainability )

- Descomponer en componentes por paso: `BarberStep`, `ServiceStep`, `DateTimeStep`, `InfoStep`, `DoneStep`
- Extraer hooks: `useBookingWizard`, `useAvailableSlots`
- Eliminar tipos duplicados (`Slot`)
- Wizard orquestador: maneja state y transiciones

### F2: Validación client-side ( UX )

- Usar schemas Zod existentes de `lib/validations.ts`
- Errores inline en cada campo del formulario
- Deshabilitar botón "Confirmar" hasta que el form sea válido
- Validación en tiempo real (onChange)

### F3: Domain layer integration ( Architecture )

- Server action `createAppointment` usa `AppointmentService.createAppointment()`
- Consistencia con el resto del proyecto
- Domain logic testeable independientemente del UI

### F4: UX improvements ( UX )

- Loading states por paso (skeleton o spinner)
- Transiciones CSS entre pasos (fade/slide)
- Better error messages (contextuales, no genéricos)
- Resumen visual del turno antes de confirmar
- Accessibility: keyboard navigation, ARIA labels

### F5: Reprogramar turno ( Feature )

- Desde el perfil del usuario, seleccionar un turno existente
- Wizard simplificado: solo fecha/hora (mismo barbero y servicio)
- Validar que el nuevo horario esté disponible
- Actualizar el turno en DB + Google Calendar

### F6: Selección por especialidad ( Feature )

- En el paso 1, filtrar barberos por especialidad
- Tags/clips de especialidades: "Degradados", "Barba", "Clásicos"
- Click en especialidad filtra la lista de barberos

### F7: Recordatorios ( Feature )

- 24h antes del turno: push notification
- 1h antes del turno: push notification
- Opción de opt-out en el perfil
- Implementación: cron job o serverless function

### F8: Full test coverage ( Quality )

- Unit tests: reducer, hooks, validación
- Integration tests: cada paso del wizard
- E2E tests: flujo completo de agendamiento
- TDD estricto para features nuevas

## Non-Goals

- **No** se cambia el backend (Prisma schema, API routes)
- **No** se agrega pago online
- **No** se implementa chat en tiempo real
- **No** se cambia el diseño visual (colores, tipografía)
- **No** se migran otros componentes del proyecto
- **No** se agrega internacionalización (i18n)

## Implications & Impact

### Positive

- Mantenibilidad significativamente mejorada
- UX más fluida y profesional
- Tests protegen contra regressiones
- Domain layer consistente en todo el proyecto
- Base para features futuras (pagos, chat, etc.)

### Risks

- Alto scope: 8 features/ mejoras
- Posibles merge conflicts con otros cambios
- Performance: más componentes = más re-renders (mitigado por React Compiler)

### Mitigations

- PRs encadenados (force-chained): dividir en 4-5 PRs chicos
- TDD estricto: cada cambio tiene test antes
- Feature flags si es necesario

## First Slice Scope

El primer PR debe incluir:

1. Refactor de estructura (componentes por paso)
2. Validación client-side
3. Tests del reducer y componentes

Esto establece la base sin cambiar features ni UX.

## Decisions (Resolved)

| Decisión      | Resolución                                 | Razón                                                                      |
| ------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Animación     | CSS transitions via Tailwind               | Zero cost, zero bundle, native. Ya usamos Tailwind.                        |
| Recordatorios | Vercel Cron Jobs + web-push                | Free tier de Vercel (1 cron/día), web-push ya instalado en el proyecto.    |
| Reprogramar   | Solo fecha/hora (mismo barbero y servicio) | Más simple, menos edge cases. Si quiere otro barbero, cancela y re-agenda. |

## Dependencies

- Zod 4 (ya instalado)
- React 19 Compiler (ya activo)
- Prisma 7 (ya configurado)
- Google Calendar API (ya integrado)

---

## Next Recommended

**Spec phase**: Definir APIs, data models, contratos técnicos, y pseudocódigo de los componentes principales.

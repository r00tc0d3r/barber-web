# Task for gentle-ai-worker

## Task: Implementar Domain Layer para barber-web

Necesito que crees la capa de dominio para el proyecto barber-web. Esta es la foundation para todos los refactors posteriores.

### Contexto del Proyecto
Es una barbería web con turnos (appointments), barberos, servicios. Stack: Next.js 16, React 19, Prisma 7, Neon PostgreSQL.

### Archivos a Crear

#### 1. `src/domain/shared/result.ts`
Implementar Result type (Either pattern) para manejo de errores controlado:
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

// Helpers: ok(), err(), isOk(), isErr()
```

#### 2. `src/domain/shared/error.ts`
Crear base error classes:
```typescript
class DomainError extends Error {
  code: string;
  statusCode: number;
}

// Subclasses: ValidationError, NotFoundError, UnauthorizedError, ConflictError
```

#### 3. `src/domain/appointment/appointment.ts`
Entity con invariantes de dominio:
```typescript
// Value Objects: AppointmentId, BarberId, ServiceId, AppointmentDate, AppointmentStatus
// Entity: Appointment con invariantes:
//   - date debe ser futuro
//   - endTime > date
//   - status transitions válidas (PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED)
//   - cancel solo desde PENDING o CONFIRMED
```

#### 4. `src/domain/appointment/appointment.service.ts`
Use cases (Application Service):
```typescript
// createAppointment(data) -> Result<Appointment, ValidationError | ConflictError>
//   - Validar disponibilidad
//   - Verificar race condition
//   - Crear en DB
//   - Crear evento en Google Calendar (con retry)
//
// cancelAppointment(id) -> Result<Appointment, NotFoundError | ConflictError>
//   - Validar estado actual
//   - Actualizar estado
//   - Actualizar Google Calendar
//
// updateAppointmentStatus(id, newStatus) -> Result<Appointment, ...>
//   - Validar transición de estado
//   - Actualizar DB y Calendar
```

#### 5. `src/domain/appointment/appointment.repository.ts`
Interface (port) para persistencia:
```typescript
interface AppointmentRepository {
  findById(id: string): Promise<Appointment | null>;
  findByBarberAndDate(barberId: string, date: Date): Promise<Appointment[]>;
  create(data: CreateAppointmentData): Promise<Appointment>;
  update(id: string, data: UpdateAppointmentData): Promise<Appointment>;
}
```

#### 6. `src/infrastructure/prisma/prisma-appointment.repository.ts`
Implementación con Prisma:
```typescript
class PrismaAppointmentRepository implements AppointmentRepository {
  // Implementar todos los métodos usando Prisma
}
```

### Reglas
- Todo en TypeScript estricto
- Sin `any` types
- Usar Result type en vez de throws para errores de dominio
- Invariantes validadas en el dominio, no en la UI
- Repository pattern para abstraer Prisma
- Seguir convenciones del proyecto existente

### Directorio de Trabajo
/Users/k3l0d3v/Projects/barber-web

### Evidence Required
- Archivos creados con su contenido
- Verificar que compila sin errores de TypeScript

## Acceptance Contract
Acceptance level: verified
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, validation-output, residual-risks, no-staged-files

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```
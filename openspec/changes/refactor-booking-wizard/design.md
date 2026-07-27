# SDD Design — Refactorizar Booking Wizard

**Date**: 2026-07-26
**Status**: Complete

---

## 1. Architecture Overview

### 1.1 Current Architecture

```
page.tsx (Server)
  └── BookingWizard (Client, 531 lines)
        ├── useReducer (12 actions, complexity 13)
        ├── 5 inline step renders
        └── Server Actions (Prisma direct)
```

### 1.2 Proposed Architecture

```
page.tsx (Server)
  └── BookingWizard (Client, orchestrator)
        ├── useBookingWizard (state machine hook)
        │     ├── bookingReducer (pure function)
        │     └── useAvailableSlots (async hook)
        ├── ProgressIndicator
        ├── Step Router (conditional render)
        │     ├── BarberStep → specialty-filter
        │     ├── ServiceStep
        │     ├── DateTimeStep → slot-picker
        │     ├── InfoStep (form + Zod validation)
        │     └── DoneStep → push-subscriber
        └── CSS transitions (Tailwind)
```

### 1.3 Data Flow

```
User Action
  → Step Component dispatches BookingAction
    → useBookingWizard reducer updates state
      → BookingWizard re-renders with new step
        → Step component reads state, renders UI

Async Operations (slots, submit):
  → Step calls hook method
    → Hook calls Server Action
      → Server Action uses AppointmentService
        → Domain layer → Repository → Prisma → DB
```

---

## 2. Component Design

### 2.1 BookingWizard (Orchestrator)

**Pattern**: Thin orchestrator — no logic, just wiring.

```typescript
export function BookingWizard({ barbers, services, userId }: Props) {
  const wizard = useBookingWizard(barbers, services, userId);
  const { state, currentStepIndex } = wizard;

  // Done screen is special (no progress bar)
  if (state.step === "done" && state.result) {
    return <DoneStep result={state.result} barber={state.barber} service={state.service} onReset={() => wizard.dispatch({ type: "RESET" })} />;
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
      <ProgressIndicator currentStep={currentStepIndex} />
      
      <ErrorBanner error={state.error} />
      
      {/* Step with CSS transition wrapper */}
      <div className="transition-all duration-200">
        {state.step === "barber" && <BarberStep ... />}
        {state.step === "service" && <ServiceStep ... />}
        {state.step === "datetime" && <DateTimeStep ... />}
        {state.step === "info" && <InfoStep ... />}
      </div>
    </div>
  );
}
```

**Key decisions**:

- Step rendering is conditional (not dynamic import) — simpler, React Compiler handles optimization
- Error banner is shared across all steps
- Transition wrapper uses Tailwind classes

### 2.2 useBookingWizard Hook

**Pattern**: Encapsulates reducer + side effects.

```typescript
export function useBookingWizard(barbers, services, userId) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const slots = useAvailableSlots();

  // Derived state
  const currentStepIndex = PROGRESS_STEPS.indexOf(state.step);
  const canGoBack = state.step !== "barber" && state.step !== "done";

  // Side effect: fetch slots when date changes in datetime step
  useEffect(() => {
    if (state.step === "datetime" && state.date && state.barber && state.service) {
      slots.fetchSlots(state.barber.id, state.service.id, state.date);
    }
  }, [state.step, state.date, state.barber?.id, state.service?.id]);

  // Sync slots back to state
  useEffect(() => {
    if (slots.slots.length > 0) {
      dispatch({ type: "SET_SLOTS", slots: slots.slots });
    }
  }, [slots.slots]);

  return { state, dispatch, canGoBack, currentStepIndex };
}
```

**Key decisions**:

- Two separate hooks for state and async operations (separation of concerns)
- Side effects are in the orchestrator hook, not in step components
- Steps are pure presentational — they dispatch actions and receive state

### 2.3 useAvailableSlots Hook

**Pattern**: Async operation with cache.

```typescript
export function useAvailableSlots() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<string, Slot[]>());

  const fetchSlots = useCallback(async (barberId, serviceId, date) => {
    const key = `${barberId}:${serviceId}:${date}`;
    
    // Check cache
    if (cache.current.has(key)) {
      setSlots(cache.current.get(key)!);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getAvailableSlots(barberId, serviceId, date);
      cache.current.set(key, result);
      setSlots(result);
    } catch {
      setError("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, error, fetchSlots };
}
```

**Key decisions**:

- In-memory cache via `useRef` (Map) — avoids refetching for same date
- Cache is per session (resets on page reload) — acceptable for booking flow
- No stale-while-revalidate — slots are fresh per date selection

### 2.4 Step Components

**Pattern**: Pure presentational, receive state + callbacks.

Each step is a function component that:

1. Receives data via props
2. Renders UI
3. Calls `onSelect` / `onFieldChange` / `onSubmit` callbacks
4. Never fetches data directly
5. Never manages its own state (except local UI state like hover)

Example — `InfoStep`:

```typescript
type InfoStepProps = {
  barber: BookingBarber;
  service: BookingService;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  onFieldChange: (field: "clientName" | "clientPhone" | "clientEmail", value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  submitting: boolean;
  errors: Record<string, string>;
};

export function InfoStep({ barber, service, date, time, name, phone, email, onFieldChange, onSubmit, onBack, submitting, errors }: InfoStepProps) {
  // Pure presentational — no side effects
  return (
    <div>
      <button onClick={onBack} className="...">← Cambiar horario</button>
      <h2>Tus datos</h2>
      <BookingSummary barber={barber} service={service} date={date} time={time} />
      <form onSubmit={onSubmit}>
        <FormField label="Nombre" error={errors.clientName}>
          <input value={name} onChange={e => onFieldChange("clientName", e.target.value)} />
        </FormField>
        <FormField label="Teléfono" error={errors.clientPhone}>
          <input value={phone} onChange={e => onFieldChange("clientPhone", e.target.value)} />
        </FormField>
        <FormField label="Email (opcional)" error={errors.clientEmail}>
          <input value={email} onChange={e => onFieldChange("clientEmail", e.target.value)} />
        </FormField>
        <button type="submit" disabled={submitting}>
          {submitting ? "Reservando..." : "Confirmar turno"}
        </button>
      </form>
    </div>
  );
}
```

---

## 3. State Machine Diagram

```
                    ┌─────────────────────────────────────┐
                    │              RESET                   │
                    │  (from any step via "Agendar otro")  │
                    └─────────────────────────────────────┘
                                      │
                                      ▼
┌─────────┐   SELECT_BARBER   ┌──────────┐   SELECT_SERVICE   ┌──────────┐
│ barber  │ ─────────────────▶│ service  │ ─────────────────▶│ datetime │
└─────────┘                   └──────────┘                   └──────────┘
     ▲                              ▲                              │
     │          GO_BACK             │          GO_BACK             │
     └──────────────────────────────┴──────────────────────────────┘

┌──────────┐   SELECT_TIME    ┌──────────┐   SUCCESS     ┌──────────┐
│ datetime │ ─────────────────▶│   info   │ ─────────────▶│   done   │
└──────────┘                   └──────────┘               └──────────┘
                                    │
                                    │  GO_BACK
                                    ▼
                              ┌──────────┐
                              │ datetime │
                              └──────────┘
```

---

## 4. Integration Plan

### 4.1 Domain Layer Integration

**Current gap**: `createAppointment` server action bypasses `AppointmentService`.

**Integration steps**:

1. **Wire dependencies** in server action:

   ```typescript
   import { AppointmentService } from "@/domain/appointment/appointment.service";
   import { PrismaAppointmentRepository } from "@/infrastructure/prisma/prisma-appointment-repository";
   import { CalendarService } from "@/infrastructure/calendar/calendar-service";
   
   function createAppointmentService() {
     const repository = new PrismaAppointmentRepository(prisma);
     const calendar = new CalendarService(/* config */);
     return new AppointmentService(repository, calendar);
   }
   ```

2. **Refactor `createAppointment`** to use domain service (see Spec §4.1)

3. **Verify `AppointmentService.createAppointment`** handles:
   - Input validation ✓
   - Date/time value object creation ✓
   - Repository create ✓
   - Calendar event creation (best effort) ✓
   - Result pattern ✓

4. **Add missing**: `AppointmentService` needs `getAvailableSlots` to use repository instead of direct Prisma query (already partially done in domain layer)

### 4.2 Reprogramar Integration

**New flow**:

```
Perfil → Select appointment → RescheduleWizard → DateTimeStep only → Update DB + Calendar
```

**Implementation**:

1. New page: `src/app/perfil/reprogramar/page.tsx`
2. Simplified wizard: reuse `DateTimeStep` component
3. New server action: `rescheduleAppointment` (see Spec §4.2)
4. Reuse `useAvailableSlots` hook

### 4.3 Recordatorios Integration

**Implementation**:

1. New route: `src/app/api/cron/reminders/route.ts`
2. Vercel config: `vercel.json` with cron schedule
3. Reuse existing `sendPushNotification` from `lib/notifications.ts`
4. Environment variable: `CRON_SECRET` for auth

---

## 5. Risk Mitigation

### 5.1 Breaking Existing Flow

**Risk**: Refactoring the wizard could break the booking flow for production users.

**Mitigation**:

- TDD: write tests FIRST, then refactor
- Feature branch: all changes in `feature/refactor-booking-wizard`
- PRs encadenados: each PR is independently testable and deployable
- No changes to server action contract (same input/output types)

### 5.2 Performance Regression

**Risk**: More components = more re-renders.

**Mitigation**:

- React Compiler (React 19) auto-memoizes
- Step components are pure — no unnecessary re-renders
- `useCallback` on handlers passed to steps
- Slots cached in `useAvailableSlots`

### 5.3 Domain Layer Mismatch

**Risk**: `AppointmentService` might not cover all cases the server action handles.

**Mitigation**:

- Audit `AppointmentService.createAppointment` before integration
- Add missing validation/logic to domain layer if needed
- Keep server action as thin wrapper — domain logic stays in domain

### 5.4 Timezone Issues

**Risk**: Date strings ("YYYY-MM-DD") might not handle timezone correctly.

**Mitigation**:

- Server actions parse dates as UTC
- Client sends date strings, server converts to Date objects
- No timezone-dependent logic in client components
- Future: consider Temporal API when stable

---

## 6. Implementation Order (PRs)

### PR1: Structure Refactor + Tests

- Extract hooks (`useBookingWizard`, `useAvailableSlots`)
- Extract step components
- Extract shared components (`ProgressIndicator`, `SlotPicker`)
- Add unit tests for reducer
- Add integration tests for each step
- **No behavior changes** — pure refactor

### PR2: Domain Integration + UX

- Refactor `createAppointment` to use `AppointmentService`
- Add client-side Zod validation
- Add CSS transitions
- Add loading states
- Add accessibility (ARIA labels, keyboard nav)

### PR3: New Features

- Specialty filter in `BarberStep`
- Reschedule flow (`/perfil/reprogramar`)
- E2E tests for full flow

### PR4: Reminders

- Cron job route
- Vercel config
- Push notification logic

---

## 7. Acceptance Criteria

### PR1 (Structure)

- [ ] All step components extracted to separate files
- [ ] Hooks extracted and working
- [ ] Reducer tests pass
- [ ] Integration tests for each step pass
- [ ] No behavior changes (same UX as before)

### PR2 (Domain + UX)

- [ ] `createAppointment` uses `AppointmentService`
- [ ] Client-side validation with inline errors
- [ ] CSS transitions between steps
- [ ] Loading states for slot fetching
- [ ] Keyboard navigation works
- [ ] Screen reader announces step changes

### PR3 (Features)

- [ ] Specialty filter works in barber step
- [ ] Reschedule flow complete
- [ ] E2E tests pass for full booking flow
- [ ] E2E tests pass for reschedule flow

### PR4 (Reminders)

- [ ] Cron job sends reminders at 24h and 1h
- [ ] Push notifications work
- [ ] Cron secret auth works

---

## Next Recommended

**Tasks phase**: Break down into concrete implementation tasks with file paths, estimated lines, and dependencies.

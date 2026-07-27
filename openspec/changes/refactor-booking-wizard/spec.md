# SDD Spec — Refactorizar Booking Wizard

**Date**: 2026-07-26
**Status**: Complete

---

## 1. File Structure (Proposed)

```
src/app/agendar/
├── page.tsx                    # Server Component (不变)
├── booking-wizard.tsx          # Wizard orchestrator (refactored, ~120 lines)
├── hooks/
│   ├── use-booking-wizard.ts   # State machine + handlers
│   └── use-available-slots.ts  # Slot fetching + caching
├── steps/
│   ├── barber-step.tsx         # Step 1: Barber selection + specialty filter
│   ├── service-step.tsx        # Step 2: Service selection
│   ├── datetime-step.tsx       # Step 3: Date/time picker
│   ├── info-step.tsx           # Step 4: Client info form
│   └── done-step.tsx           # Step 5: Confirmation screen
├── components/
│   ├── progress-indicator.tsx  # Step progress bar
│   ├── slot-picker.tsx         # Time slot grid
│   └── specialty-filter.tsx    # Specialty tag filter
├── actions.ts                  # Server actions (refactored)
└── __tests__/
    ├── booking-wizard.test.tsx
    ├── use-booking-wizard.test.ts
    ├── barber-step.test.tsx
    ├── service-step.test.tsx
    ├── datetime-step.test.tsx
    ├── info-step.test.tsx
    └── actions.test.ts

src/app/perfil/
├── reprogramar/
│   ├── page.tsx                # Reprogramar entry point
│   ├── reprogramar-wizard.tsx  # Simplified wizard (date/time only)
│   └── actions.ts              # Server action for reschedule

src/app/api/cron/
└── reminders/route.ts          # Vercel cron endpoint for push reminders
```

## 2. Type Contracts

### 2.1 Booking State (reducer)

```typescript
// src/app/agendar/hooks/use-booking-wizard.ts

type Step = "barber" | "service" | "datetime" | "info" | "done";

type BookingState = {
  step: Step;
  barber: BookingBarber | null;
  service: BookingService | null;
  date: string;           // "YYYY-MM-DD"
  time: string;           // "HH:MM"
  slots: Slot[];
  loadingSlots: boolean;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  error: string | null;
  submitting: boolean;
  result: BookingResult | null;
};

type BookingAction =
  | { type: "SELECT_BARBER"; barber: BookingBarber }
  | { type: "SELECT_SERVICE"; service: BookingService }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_SLOTS"; slots: Slot[] }
  | { type: "LOADING_SLOTS"; loading: boolean }
  | { type: "SELECT_TIME"; time: string }
  | { type: "SET_FIELD"; field: "clientName" | "clientPhone" | "clientEmail"; value: string }
  | { type: "SET_ERRORS"; errors: Record<string, string> }
  | { type: "CLEAR_ERRORS" }
  | { type: "SUBMITTING"; submitting: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SUCCESS"; result: BookingResult }
  | { type: "GO_BACK"; step: Step }
  | { type: "RESET" };
```

### 2.2 Server Action Contracts

```typescript
// src/app/agendar/actions.ts

// Already exists, keep signature
export async function getAvailableSlots(
  barberId: string,
  serviceId: string,
  dateStr: string
): Promise<Slot[]>

// Refactored: now uses AppointmentService
export async function createAppointment(data: CreateAppointmentInput): Promise<BookingResult>

// NEW: Reschedule
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
  cancelToken: string  // for auth
): Promise<{ id: string; date: string; time: string }>

// NEW: Get appointment for reschedule
export async function getAppointmentForReschedule(
  appointmentId: string,
  cancelToken: string
): Promise<{ barber: BookingBarber; service: BookingService; date: string; time: string }>
```

### 2.3 Validation Schemas (Zod)

```typescript
// src/lib/validations.ts (additions)

// Client-side form validation (info step)
export const clientInfoSchema = z.object({
  clientName: z.string().min(1, "Nombre requerido").max(100),
  clientPhone: z.string().min(1, "Teléfono requerido").max(20),
  clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
});

// Reschedule validation
export const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  cancelToken: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});
```

## 3. Component Contracts

### 3.1 BookingWizard (orchestrator)

```typescript
// src/app/agendar/booking-wizard.tsx

type Props = {
  barbers: BookingBarber[];
  services: BookingService[];
  userId: string;
};

export function BookingWizard({ barbers, services, userId }: Props)
```

**Responsibilities**:

- Renders progress indicator
- Renders current step component
- Manages state via `useBookingWizard` hook
- Handles step transitions

### 3.2 useBookingWizard hook

```typescript
// src/app/agendar/hooks/use-booking-wizard.ts

type UseBookingWizardReturn = {
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  canGoBack: boolean;
  currentStepIndex: number;
  totalSteps: number;
};

export function useBookingWizard(
  barbers: BookingBarber[],
  services: BookingService[],
  userId: string
): UseBookingWizardReturn
```

**Responsibilities**:

- Wraps `useReducer` with `bookingReducer`
- Provides derived state (canGoBack, currentStepIndex)
- Handles side effects (slot fetching via `useAvailableSlots`)

### 3.3 useAvailableSlots hook

```typescript
// src/app/agendar/hooks/use-available-slots.ts

type UseAvailableSlotsReturn = {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  fetchSlots: (barberId: string, serviceId: string, date: string) => Promise<void>;
};

export function useAvailableSlots(): UseAvailableSlotsReturn
```

**Responsibilities**:

- Calls `getAvailableSlots` server action
- Manages loading/error state
- Caches slots per date (avoid refetching)

### 3.4 Step Components

Each step follows this contract:

```typescript
type StepProps<T> = {
  data: T;
  onSelect: (value: string) => void;
  onBack?: () => void;
  error?: string | null;
};
```

| Component | Props | Output |
| ----------- | ------- | -------- |
| `BarberStep` | `{ barbers, selected?, onSelect, specialtyFilter }` | Dispatches `SELECT_BARBER` |
| `ServiceStep` | `{ services, barberServices, selected?, onSelect, onBack }` | Dispatches `SELECT_SERVICE` |
| `DateTimeStep` | `{ date, time, slots, loading, onDateChange, onSelect, onBack }` | Dispatches `SET_DATE`, `SELECT_TIME` |
| `InfoStep` | `{ barber, service, date, time, name, phone, email, onFieldChange, onSubmit, submitting, errors }` | Dispatches `SET_FIELD`, calls submit |
| `DoneStep` | `{ result, barber, service, onReset }` | Shows confirmation |

## 4. Server Action Refactoring

### 4.1 createAppointment (current → refactored)

**Current** (bypasses domain):

```typescript
export async function createAppointment(data: unknown) {
  const parsed = createAppointmentSchema.parse(data);
  // ... direct Prisma queries ...
  const appointment = await prisma.appointment.create({ ... });
  const eventId = await createCalendarEvent({ ... });
  return { id, cancelToken, date, time };
}
```

**Refactored** (uses domain):

```typescript
export async function createAppointment(data: unknown) {
  const parsed = createAppointmentSchema.parse(data);
  
  // Get service duration
  const service = await prisma.service.findUnique({ where: { id: parsed.serviceId } });
  if (!service) throw new Error("Servicio no encontrado");
  
  // Use domain service
  const service = new AppointmentService(repository, calendarService);
  const result = await service.createAppointment({
    barberId: parsed.barberId,
    serviceId: parsed.serviceId,
    userId: parsed.userId,
    date: parsed.date,
    time: parsed.time,
    clientName: parsed.clientName,
    clientPhone: parsed.clientPhone,
    clientEmail: parsed.clientEmail,
  }, Number(service.duration));
  
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
```

### 4.2 rescheduleAppointment (new)

```typescript
export async function rescheduleAppointment(
  appointmentId: string,
  newDate: string,
  newTime: string,
  cancelToken: string
) {
  // Validate token
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, cancelToken, status: { notIn: ["CANCELLED", "NO_SHOW"] } }
  });
  if (!appointment) throw new Error("Turno no encontrado");
  
  // Check new slot availability
  const slots = await getAvailableSlots(appointment.barberId, appointment.serviceId, newDate);
  const slot = slots.find(s => s.time === newTime);
  if (!slot?.available) throw new Error("Ese horario ya no está disponible");
  
  // Calculate new end time
  const service = await prisma.service.findUnique({ where: { id: appointment.serviceId } });
  const startDate = new Date(`${newDate}T${newTime}:00`);
  const endDate = new Date(startDate.getTime() + Number(service!.duration) * 60 * 1000);
  
  // Update appointment
  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { date: startDate, endTime: endDate }
  });
  
  // Update Google Calendar (best effort)
  if (updated.googleCalendarEventId) {
    try {
      await updateCalendarEvent(updated.googleCalendarEventId, startDate, endDate);
    } catch { /* log but don't fail */ }
  }
  
  return { id: updated.id, date: newDate, time: newTime };
}
```

## 5. Cron Job (Reminders)

### 5.1 Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 5.2 Reminder Route

```typescript
// src/app/api/cron/reminders/route.ts

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in1h = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Find appointments needing reminders
  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      date: { gte: now, lte: in24h },
      user: { pushSubscriptions: { some: {} } }
    },
    include: { barber: true, service: true, user: { include: { pushSubscriptions: true } } }
  });
  
  for (const apt of appointments) {
    const aptDate = new Date(apt.date);
    const hoursUntil = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // 24h reminder
    if (hoursUntil >= 23 && hoursUntil <= 25) {
      await sendPushNotification(apt.user.pushSubscriptions, {
        title: "Recordatorio de turno",
        body: `Mañana tenés turno con ${apt.barber.name} a las ${formatTime(apt.date)}`,
        data: { appointmentId: apt.id }
      });
    }
    
    // 1h reminder
    if (hoursUntil >= 0.5 && hoursUntil <= 1.5) {
      await sendPushNotification(apt.user.pushSubscriptions, {
        title: "Turno en 1 hora",
        body: `Tu turno con ${apt.barber.name} es en 1 hora. ¡No lo olvides!`,
        data: { appointmentId: apt.id }
      });
    }
  }
  
  return Response.json({ processed: appointments.length });
}
```

## 6. Accessibility Contract

All step components must:

- Use semantic HTML (`<button>`, `<form>`, `<label>`, `<input>`)
- Have `aria-label` on interactive elements
- Support keyboard navigation (Tab, Enter, Escape for back)
- Announce step changes to screen readers (`aria-live="polite"`)
- Have visible focus indicators
- Color contrast ≥ 4.5:1 (already met with current dark theme)

## 7. CSS Transitions

```css
/* Tailwind classes for step transitions */
.step-enter {
  opacity: 0;
  transform: translateX(20px);
}
.step-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.step-exit {
  opacity: 1;
  transform: translateX(0);
}
.step-exit-active {
  opacity: 0;
  transform: translateX(-20px);
  transition: opacity 150ms ease-in, transform 150ms ease-in;
}
```

Applied via Tailwind's `transition-all duration-200` on step wrappers.

## 8. Test Contracts

### 8.1 Unit Tests

| Test | Target | Assertions |
| ------ | -------- | ------------ |
| Reducer: SELECT_BARBER | `bookingReducer` | Sets barber, clears service/date/time, moves to "service" |
| Reducer: SET_FIELD | `bookingReducer` | Updates correct field, doesn't touch others |
| Reducer: GO_BACK | `bookingReducer` | Moves to specified step, clears error |
| Reducer: RESET | `bookingReducer` | Returns to initialState |
| Validation: clientInfoSchema | Zod schema | Rejects empty name, invalid email, short phone |
| Validation: rescheduleSchema | Zod schema | Rejects invalid date format, missing token |

### 8.2 Integration Tests

| Test | Target | Setup |
| ------ | -------- | ------- |
| BarberStep renders barbers | `<BarberStep>` | Mock barbers array |
| ServiceStep filters by barber | `<ServiceStep>` | Mock barber with services |
| DateTimeStep loads slots | `<DateTimeStep>` | Mock `getAvailableSlots` |
| InfoStep validates on submit | `<InfoStep>` | Render form, submit empty |
| Full wizard flow | `<BookingWizard>` | Mock all server actions |

### 8.3 E2E Tests

```typescript
// e2e/booking.spec.ts
test("complete booking flow", async ({ page }) => {
  await page.goto("/agendar");
  
  // Step 1: Select barber
  await page.click("button:has-text('Carlos')");
  
  // Step 2: Select service
  await page.click("button:has-text('Corte')");
  
  // Step 3: Select date and time
  await page.fill("input[type='date']", "2026-08-01");
  await page.click("button:has-text('10:00')");
  
  // Step 4: Fill info
  await page.fill("input[placeholder='Tu nombre']", "Juan");
  await page.fill("input[placeholder='11 1234 5678']", "11 5555 1234");
  await page.click("button:has-text('Confirmar turno')");
  
  // Step 5: Verify confirmation
  await expect(page.locator("text=Turno confirmado")).toBeVisible();
});
```

---

## Next Recommended

**Design phase**: Architecture decisions, component diagrams, integration plan, and risk mitigation strategies.

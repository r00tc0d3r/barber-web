# SDD Tasks — Refactorizar Booking Wizard

**Date**: 2026-07-26
**Status**: Complete

---

## PR1: Structure Refactor + Tests

**Goal**: Extract components, hooks, and add tests. No behavior changes.

### Task 1.1: Create hooks directory and useAvailableSlots

- **File**: `src/app/agendar/hooks/use-available-slots.ts`
- **Lines**: ~45
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/use-available-slots.test.ts` (~30 lines)
- **Acceptance**: Hook fetches slots, caches by key, handles loading/error states

### Task 1.2: Create useBookingWizard hook

- **File**: `src/app/agendar/hooks/use-booking-wizard.ts`
- **Lines**: ~80
- **Dependencies**: Task 1.1
- **Tests**: `src/app/agendar/__tests__/use-booking-wizard.test.ts` (~60 lines)
- **Acceptance**: Hook wraps reducer, provides derived state (canGoBack, currentStepIndex), syncs slots

### Task 1.3: Extract bookingReducer to separate file

- **File**: `src/app/agendar/booking-reducer.ts`
- **Lines**: ~70
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/booking-reducer.test.ts` (~120 lines)
- **Acceptance**: All 12 action types tested, reducer is pure function

### Task 1.4: Extract shared types to types file

- **File**: `src/app/agendar/types.ts`
- **Lines**: ~30
- **Dependencies**: None
- **Acceptance**: Step, BookingState, BookingAction, BookingResult, Props types defined

### Task 1.5: Create ProgressIndicator component

- **File**: `src/app/agendar/components/progress-indicator.tsx`
- **Lines**: ~50
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/progress-indicator.test.tsx` (~40 lines)
- **Acceptance**: Renders step numbers, highlights current, shows labels on sm+

### Task 1.6: Create SlotPicker component

- **File**: `src/app/agendar/components/slot-picker.tsx`
- **Lines**: ~40
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/slot-picker.test.tsx` (~50 lines)
- **Acceptance**: Renders slot grid, disables unavailable, highlights selected

### Task 1.7: Create SpecialtyFilter component

- **File**: `src/app/agendar/components/specialty-filter.tsx`
- **Lines**: ~35
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/specialty-filter.test.tsx` (~40 lines)
- **Acceptance**: Renders unique specialties as tags, toggles filter, multi-select

### Task 1.8: Extract BarberStep component

- **File**: `src/app/agendar/steps/barber-step.tsx`
- **Lines**: ~60
- **Dependencies**: Tasks 1.5, 1.7
- **Tests**: `src/app/agendar/__tests__/barber-step.test.tsx` (~50 lines)
- **Acceptance**: Renders barbers filtered by specialty, dispatches SELECT_BARBER

### Task 1.9: Extract ServiceStep component

- **File**: `src/app/agendar/steps/service-step.tsx`
- **Lines**: ~50
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/service-step.test.tsx` (~50 lines)
- **Acceptance**: Renders services for selected barber, dispatches SELECT_SERVICE

### Task 1.10: Extract DateTimeStep component

- **File**: `src/app/agendar/steps/datetime-step.tsx`
- **Lines**: ~70
- **Dependencies**: Tasks 1.6
- **Tests**: `src/app/agendar/__tests__/datetime-step.test.tsx` (~60 lines)
- **Acceptance**: Renders date input + slot grid, dispatches SET_DATE and SELECT_TIME

### Task 1.11: Extract InfoStep component

- **File**: `src/app/agendar/steps/info-step.tsx`
- **Lines**: ~90
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/info-step.test.tsx` (~70 lines)
- **Acceptance**: Renders form with summary, dispatches SET_FIELD, calls onSubmit

### Task 1.12: Extract DoneStep component

- **File**: `src/app/agendar/steps/done-step.tsx`
- **Lines**: ~50
- **Dependencies**: None
- **Tests**: `src/app/agendar/__tests__/done-step.test.tsx` (~40 lines)
- **Acceptance**: Shows confirmation, barber/service details, push subscriber, reset button

### Task 1.13: Refactor BookingWizard orchestrator

- **File**: `src/app/agendar/booking-wizard.tsx` (rewrite)
- **Lines**: ~80
- **Dependencies**: Tasks 1.1-1.12
- **Tests**: `src/app/agendar/__tests__/booking-wizard.test.tsx` (~80 lines)
- **Acceptance**: Thin orchestrator, wires hooks + steps, shared error banner

### Task 1.14: Clean up duplicate types

- **File**: `src/types/models.ts` (remove duplicate Slot)
- **Lines**: -5
- **Dependencies**: Task 1.4
- **Acceptance**: Slot type only in `agendar/types.ts`, imports updated

### PR1 Total: ~14 files, ~740 lines added, ~15 removed

---

## PR2: Domain Integration + UX

**Goal**: Integrate AppointmentService, add validation, transitions, accessibility.

### Task 2.1: Audit AppointmentService compatibility

- **File**: `src/domain/appointment/appointment.service.ts` (read-only)
- **Lines**: 0
- **Dependencies**: None
- **Acceptance**: Document gaps between domain service and server action

### Task 2.2: Create repository adapter if needed

- **File**: `src/infrastructure/prisma/prisma-appointment-repository.ts`
- **Lines**: ~100 (if new) or 0 (if exists)
- **Dependencies**: Task 2.1
- **Acceptance**: Repository implements AppointmentRepository interface

### Task 2.3: Refactor createAppointment server action

- **File**: `src/app/agendar/actions.ts`
- **Lines**: ~30 (modify existing ~90)
- **Dependencies**: Tasks 2.1, 2.2
- **Acceptance**: Uses AppointmentService, same input/output contract

### Task 2.4: Add client-side Zod validation to InfoStep

- **File**: `src/app/agendar/steps/info-step.tsx`
- **Lines**: +20
- **Dependencies**: Task 1.11
- **Tests**: Update `info-step.test.tsx` (+30 lines)
- **Acceptance**: Validates on submit, shows inline errors, disables button when invalid

### Task 2.5: Add CSS transitions between steps

- **File**: `src/app/agendar/booking-wizard.tsx`
- **Lines**: +15
- **Dependencies**: Task 1.13
- **Acceptance**: Steps fade/slide in/out, 200ms duration

### Task 2.6: Add loading states

- **File**: `src/app/agendar/steps/datetime-step.tsx`
- **Lines**: +15
- **Dependencies**: Task 1.10
- **Acceptance**: Skeleton/spinner while fetching slots

### Task 2.7: Add keyboard navigation

- **File**: All step components
- **Lines**: +5 per component (~25 total)
- **Dependencies**: Tasks 1.8-1.12
- **Acceptance**: Tab order correct, Enter selects, Escape goes back

### Task 2.8: Add ARIA labels

- **File**: All step components
- **Lines**: +3 per component (~15 total)
- **Dependencies**: Tasks 1.8-1.12
- **Acceptance**: aria-label on buttons, aria-live on error/success, role on form

### Task 2.9: Add focus indicators

- **File**: `src/app/agendar/components/` (shared styles)
- **Lines**: +10
- **Dependencies**: None
- **Acceptance**: Visible focus ring on all interactive elements

### PR2 Total: ~6 files modified, ~230 lines added

---

## PR3: New Features

**Goal**: Specialty filter, reschedule flow, E2E tests.

### Task 3.1: Integrate SpecialtyFilter in BarberStep

- **File**: `src/app/agendar/steps/barber-step.tsx`
- **Lines**: +15
- **Dependencies**: Tasks 1.7, 1.8
- **Tests**: Update `barber-step.test.tsx` (+20 lines)
- **Acceptance**: Filter works, filters barber list by specialty

### Task 3.2: Create reschedule page

- **File**: `src/app/perfil/reprogramar/page.tsx`
- **Lines**: ~60
- **Dependencies**: None
- **Tests**: None (server component)
- **Acceptance**: Loads appointment, renders RescheduleWizard

### Task 3.3: Create RescheduleWizard component

- **File**: `src/app/perfil/reprogramar/reprogramar-wizard.tsx`
- **Lines**: ~80
- **Dependencies**: Tasks 1.6, 1.10 (reuse DateTimeStep)
- **Tests**: `src/app/perfil/reprogramar/__tests__/reprogramar-wizard.test.tsx` (~60 lines)
- **Acceptance**: Simplified wizard (date/time only), validates availability, submits

### Task 3.4: Create reschedule server action

- **File**: `src/app/perfil/reprogramar/actions.ts`
- **Lines**: ~70
- **Dependencies**: None
- **Tests**: `src/app/perfil/reprogramar/__tests__/actions.test.ts` (~50 lines)
- **Acceptance**: Validates token, checks availability, updates DB + Calendar

### Task 3.5: Add reschedule button to profile

- **File**: `src/app/perfil/page.tsx`
- **Lines**: +15
- **Dependencies**: Task 3.2
- **Acceptance**: "Reprogramar" button on upcoming appointments

### Task 3.6: Write E2E test for full booking flow

- **File**: `e2e/booking.spec.ts`
- **Lines**: ~80
- **Dependencies**: Tasks PR1, PR2
- **Acceptance**: Complete flow from barber selection to confirmation

### Task 3.7: Write E2E test for reschedule flow

- **File**: `e2e/reschedule.spec.ts`
- **Lines**: ~60
- **Dependencies**: Tasks 3.2-3.5
- **Acceptance**: Reschedule flow from profile to confirmation

### PR3 Total: ~5 new files, ~440 lines, 2 modified files

---

## PR4: Reminders

**Goal**: Cron job for push notifications at 24h and 1h before appointments.

### Task 4.1: Create cron route

- **File**: `src/app/api/cron/reminders/route.ts`
- **Lines**: ~80
- **Dependencies**: None
- **Tests**: `src/app/api/cron/__tests__/reminders.test.ts` (~60 lines)
- **Acceptance**: Auth check, finds appointments, sends push at 24h and 1h

### Task 4.2: Add Vercel cron config

- **File**: `vercel.json` (create or modify)
- **Lines**: ~10
- **Dependencies**: None
- **Acceptance**: Cron schedule `0 * * * *` (hourly)

### Task 4.3: Add CRON_SECRET to env

- **File**: `.env.example` (add line)
- **Lines**: +1
- **Dependencies**: None
- **Acceptance**: Documented in env example

### Task 4.4: Add opt-out setting to profile

- **File**: `src/app/admin/settings/settings-form.tsx` or `src/app/perfil/page.tsx`
- **Lines**: +20
- **Dependencies**: None
- **Acceptance**: Toggle to enable/disable reminders

### PR4 Total: ~2 new files, ~170 lines

---

## Dependency Graph

```
PR1 (no deps)
  ├── 1.1 (useAvailableSlots)
  ├── 1.2 (useBookingWizard) → depends on 1.1
  ├── 1.3 (bookingReducer)
  ├── 1.4 (types)
  ├── 1.5 (ProgressIndicator)
  ├── 1.6 (SlotPicker)
  ├── 1.7 (SpecialtyFilter)
  ├── 1.8 (BarberStep) → depends on 1.5, 1.7
  ├── 1.9 (ServiceStep)
  ├── 1.10 (DateTimeStep) → depends on 1.6
  ├── 1.11 (InfoStep)
  ├── 1.12 (DoneStep)
  ├── 1.13 (BookingWizard) → depends on all above
  └── 1.14 (cleanup) → depends on 1.4

PR2 (depends on PR1)
  ├── 2.1 (audit) → depends on PR1
  ├── 2.2 (repository) → depends on 2.1
  ├── 2.3 (refactor action) → depends on 2.2
  ├── 2.4 (validation) → depends on 1.11
  ├── 2.5 (transitions) → depends on 1.13
  ├── 2.6 (loading) → depends on 1.10
  ├── 2.7 (keyboard) → depends on 1.8-1.12
  ├── 2.8 (ARIA) → depends on 1.8-1.12
  └── 2.9 (focus) → no deps

PR3 (depends on PR2)
  ├── 3.1 (specialty) → depends on 1.7, 1.8
  ├── 3.2-3.5 (reschedule) → depends on PR2
  └── 3.6-3.7 (E2E) → depends on PR1, PR2

PR4 (no deps on PR1-PR3, can run in parallel)
  ├── 4.1 (cron route)
  ├── 4.2 (vercel config)
  ├── 4.3 (env)
  └── 4.4 (opt-out)
```

---

## Summary

| PR | Files | Lines Added | Lines Removed | Net |
| ---- | ------- | ------------- | --------------- | ----- |
| PR1 | 14 new | 740 | 15 | +725 |
| PR2 | 6 modified | 230 | 0 | +230 |
| PR3 | 5 new, 2 modified | 440 | 0 | +440 |
| PR4 | 2 new, 2 modified | 170 | 0 | +170 |
| **Total** | **~25 files** | **1,580** | **15** | **+1,565** |

---

## Next Recommended

**Apply phase**: Start implementing PR1 with strict TDD.

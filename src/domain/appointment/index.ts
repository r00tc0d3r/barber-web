/**
 * Appointment Domain
 * 
 * Re-exports for cleaner imports.
 */

// Entity
export { Appointment } from './appointment';
export type { AppointmentData, CreateAppointmentData } from './appointment';

// Value Objects
export {
  AppointmentIdSchema,
  BarberIdSchema,
  ServiceIdSchema,
  UserIdSchema,
  CancelTokenSchema,
  createAppointmentId,
  createBarberId,
  createServiceId,
  generateAppointmentId,
  generateBarberId,
  generateServiceId,
  generateCancelToken,
  AppointmentStatusSchema,
  VALID_STATUS_TRANSITIONS,
  canTransition,
  AppointmentDateSchema,
  createAppointmentDateTime,
  ContactInfoSchema,
  createPrice,
  formatPrice,
} from './value-objects';

export type {
  AppointmentId,
  BarberId,
  ServiceId,
  UserId,
  CancelToken,
  AppointmentStatus,
  AppointmentDateInput,
  AppointmentDateTime,
  ContactInfo,
  Price,
} from './value-objects';

// Repository
export type { AppointmentRepository, FindAppointmentsQuery } from './appointment.repository';

// Service
export { AppointmentService } from './appointment.service';
export type {
  CreateAppointmentInput,
  CancelAppointmentInput,
  UpdateStatusInput,
  AppointmentResult,
  CalendarService,
} from './appointment.service';

/**
 * Appointment Repository Interface
 * 
 * Port for persistence layer. Implementations can use Prisma, raw SQL, or in-memory.
 * Domain layer depends on this interface, not on Prisma directly.
 */

import type { Result } from '../shared/result';
import type { NotFoundError, ConflictError } from '../shared/error';
import type { Appointment } from './appointment';
import type { AppointmentId, BarberId, AppointmentStatus } from './value-objects';

// ── Query Filters ────────────────────────────────────────────

export interface FindAppointmentsQuery {
  barberId?: BarberId;
  status?: AppointmentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface FindAvailableSlotsQuery {
  barberId: BarberId;
  serviceId: string;
  date: string; // YYYY-MM-DD
}

// ── Repository Interface ─────────────────────────────────────

export interface AppointmentRepository {
  /**
   * Find appointment by ID
   */
  findById(id: AppointmentId): Promise<Result<Appointment | null, NotFoundError>>;

  /**
   * Find appointment by cancel token
   */
  findByCancelToken(token: string): Promise<Result<Appointment | null, NotFoundError>>;

  /**
   * Find multiple appointments with filters
   */
  findMany(query: FindAppointmentsQuery): Promise<Appointment[]>;

  /**
   * Find existing appointments for a barber on a specific date
   */
  findByBarberAndDate(
    barberId: BarberId,
    date: string
  ): Promise<Appointment[]>;

  /**
   * Check if a slot is available
   */
  isSlotAvailable(
    barberId: BarberId,
    serviceId: string,
    date: string,
    time: string
  ): Promise<boolean>;

      /**
       * Create a new appointment
       */
      create(
        data: {
          barberId: BarberId;
          serviceId: string;
          userId: string | null;
          contact: {
            clientName: string;
            clientPhone: string;
            clientEmail?: string;
          };
          dateTime: {
            start: Date;
            end: Date;
          };
        },
        durationMinutes: number
      ): Promise<Result<Appointment, ConflictError>>;

  /**
   * Update appointment status
   */
  updateStatus(
    id: AppointmentId,
    status: AppointmentStatus
  ): Promise<Result<Appointment, NotFoundError | ConflictError>>;

  /**
   * Set Google Calendar event ID
   */
  setGoogleCalendarEventId(
    id: AppointmentId,
    eventId: string
  ): Promise<Result<void, NotFoundError>>;

  /**
   * Count appointments
   */
  count(query?: FindAppointmentsQuery): Promise<number>;
}

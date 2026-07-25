/**
 * Appointment Entity
 * 
 * Core domain entity with invariant validation.
 * This is the heart of the appointment booking system.
 */

import { ok, err, type Result } from '../shared/result';
import {
  ConflictError,
  InvalidStatusTransitionError,
  AppointmentAlreadyCancelledError,
} from '../shared/error';
import {
  type AppointmentId,
  type BarberId,
  type ServiceId,
  type UserId,
  type CancelToken,
  type AppointmentStatus,
  type ContactInfo,
  type AppointmentDateTime,
  canTransition,
} from './value-objects';

// ── Appointment Data Shape ───────────────────────────────────

export interface AppointmentData {
  id: AppointmentId;
  barberId: BarberId;
  serviceId: ServiceId;
  userId: UserId | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  date: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes: string | null;
  cancelToken: CancelToken;
  googleCalendarEventId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Create Data (for new appointments) ───────────────────────

export interface CreateAppointmentData {
  barberId: BarberId;
  serviceId: ServiceId;
  userId: UserId | null;
  contact: ContactInfo;
  dateTime: AppointmentDateTime;
  cancelToken: CancelToken;
}

// ── Appointment Entity ───────────────────────────────────────

export class Appointment {
  private constructor(private readonly data: AppointmentData) {}

  // ── Factory Method ──────────────────────────────────────────

  static create(data: AppointmentData): Result<Appointment, ConflictError> {
    const appointment = new Appointment(data);
    
    // Validate invariants
    const validation = appointment.validateInvariants();
    if (!validation.ok) return validation;

    return ok(appointment);
  }

  // ── Getters ──────────────────────────────────────────────────

  get id(): AppointmentId {
    return this.data.id;
  }

  get barberId(): BarberId {
    return this.data.barberId;
  }

  get serviceId(): ServiceId {
    return this.data.serviceId;
  }

  get userId(): UserId | null {
    return this.data.userId;
  }

  get clientName(): string {
    return this.data.clientName;
  }

  get clientPhone(): string {
    return this.data.clientPhone;
  }

  get clientEmail(): string | null {
    return this.data.clientEmail;
  }

  get date(): Date {
    return this.data.date;
  }

  get endTime(): Date {
    return this.data.endTime;
  }

  get status(): AppointmentStatus {
    return this.data.status;
  }

  get notes(): string | null {
    return this.data.notes;
  }

  get cancelToken(): CancelToken {
    return this.data.cancelToken;
  }

  get googleCalendarEventId(): string | null {
    return this.data.googleCalendarEventId;
  }

  get createdAt(): Date {
    return this.data.createdAt;
  }

  get updatedAt(): Date {
    return this.data.updatedAt;
  }

  // ── Domain Operations ────────────────────────────────────────

  /**
   * Check if this appointment can be cancelled
   */
  get isCancellable(): boolean {
    return ['PENDING', 'CONFIRMED'].includes(this.data.status);
  }

  /**
   * Check if this appointment is in the past
   */
  get isPast(): boolean {
    return this.data.endTime < new Date();
  }

  /**
   * Check if this appointment is currently active
   */
  get isActive(): boolean {
    const now = new Date();
    return this.data.date <= now && this.data.endTime >= now;
  }

  /**
   * Get duration in minutes
   */
  get durationMinutes(): number {
    return (this.data.endTime.getTime() - this.data.date.getTime()) / (1000 * 60);
  }

  /**
   * Transition to a new status
   */
  transitionTo(newStatus: AppointmentStatus): Result<Appointment, InvalidStatusTransitionError | ConflictError> {
    if (!canTransition(this.data.status, newStatus)) {
      return err(new InvalidStatusTransitionError(this.data.status, newStatus));
    }

    const newData: AppointmentData = {
      ...this.data,
      status: newStatus,
      updatedAt: new Date(),
    };

    return Appointment.create(newData);
  }

  /**
   * Cancel this appointment
   */
  cancel(): Result<Appointment, AppointmentAlreadyCancelledError | InvalidStatusTransitionError | ConflictError> {
    if (!this.isCancellable) {
      if (this.data.status === 'CANCELLED') {
        return err(new AppointmentAlreadyCancelledError(this.data.id));
      }
      return err(new InvalidStatusTransitionError(this.data.status, 'CANCELLED'));
    }

    return this.transitionTo('CANCELLED');
  }

  /**
   * Confirm this appointment
   */
  confirm(): Result<Appointment, InvalidStatusTransitionError | ConflictError> {
    return this.transitionTo('CONFIRMED');
  }

  /**
   * Start this appointment (mark as in progress)
   */
  start(): Result<Appointment, InvalidStatusTransitionError | ConflictError> {
    return this.transitionTo('IN_PROGRESS');
  }

  /**
   * Complete this appointment
   */
  complete(): Result<Appointment, InvalidStatusTransitionError | ConflictError> {
    return this.transitionTo('COMPLETED');
  }

  /**
   * Mark as no-show
   */
  markNoShow(): Result<Appointment, InvalidStatusTransitionError | ConflictError> {
    return this.transitionTo('NO_SHOW');
  }

  /**
   * Set Google Calendar event ID
   */
  withGoogleCalendarEventId(eventId: string): Appointment {
    const result = Appointment.create({
      ...this.data,
      googleCalendarEventId: eventId,
      updatedAt: new Date(),
    });
    if (result.ok) return result.value;
    throw result.error;
  }

  /**
   * Set notes
   */
  withNotes(notes: string): Appointment {
    const result = Appointment.create({
      ...this.data,
      notes,
      updatedAt: new Date(),
    });
    if (result.ok) return result.value;
    throw result.error;
  }

  // ── Serialization ────────────────────────────────────────────

  toJSON(): AppointmentData {
    return { ...this.data };
  }

  toSummary() {
    return {
      id: this.data.id,
      clientName: this.data.clientName,
      barberId: this.data.barberId,
      serviceId: this.data.serviceId,
      date: this.data.date,
      status: this.data.status,
    };
  }

  // ── Private Methods ──────────────────────────────────────────

  private validateInvariants(): Result<void, ConflictError> {
    // endTime must be after date
    if (this.data.endTime <= this.data.date) {
      return err(new ConflictError('End time must be after start time'));
    }

    // date should be in the past or present (for existing appointments)
    // Future validation is handled at booking time

    return ok(undefined);
  }
}

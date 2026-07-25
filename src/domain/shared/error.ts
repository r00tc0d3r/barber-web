/**
 * Domain Error Hierarchy
 * 
 * Typed errors with codes for precise error handling.
 * Base class for all domain errors.
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// ── Specific Domain Errors ───────────────────────────────────

export class ValidationError extends DomainError {
  readonly code: string = 'VALIDATION_ERROR';
  readonly statusCode = 400;

  constructor(
    message: string,
    public readonly field?: string,
    public readonly constraints?: Record<string, unknown>
  ) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(
    public readonly resource: string,
    public readonly resourceId?: string
  ) {
    super(
      resourceId
        ? `${resource} with id '${resourceId}' not found`
        : `${resource} not found`
    );
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message = 'Unauthorized') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message = 'Forbidden') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(
    message: string,
    public readonly conflictType?: string
  ) {
    super(message);
  }
}

export class InternalError extends DomainError {
  readonly code = 'INTERNAL_ERROR';
  readonly statusCode = 500;

  constructor(message = 'Internal server error', options?: ErrorOptions) {
    super(message, options);
  }
}

// ── Appointment-Specific Errors ──────────────────────────────

export class AppointmentValidationError extends ValidationError {
  override readonly code: string = 'APPOINTMENT_VALIDATION_ERROR';

  constructor(message: string, field?: string) {
    super(message, field);
  }
}

export class SlotNotAvailableError extends ConflictError {
  readonly conflictType = 'SLOT_NOT_AVAILABLE';

  constructor(date: string, time: string) {
    super(`Slot ${time} on ${date} is not available`);
  }
}

export class InvalidStatusTransitionError extends ConflictError {
  readonly conflictType = 'INVALID_STATUS_TRANSITION';

  constructor(from: string, to: string) {
    super(`Cannot transition from '${from}' to '${to}'`);
  }
}

export class AppointmentAlreadyCancelledError extends ConflictError {
  readonly conflictType = 'ALREADY_CANCELLED';

  constructor(appointmentId: string) {
    super(`Appointment ${appointmentId} is already cancelled`);
  }
}

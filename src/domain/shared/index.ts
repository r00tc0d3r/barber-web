/**
 * Shared Domain Layer
 * 
 * Re-exports for cleaner imports.
 */

export type { Result } from './result';
export { ok, err, isOk, isErr, map, mapErr, flatMap, unwrap, unwrapOr, all } from './result';
export {
  DomainError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalError,
  AppointmentValidationError,
  SlotNotAvailableError,
  InvalidStatusTransitionError,
  AppointmentAlreadyCancelledError,
} from './error';

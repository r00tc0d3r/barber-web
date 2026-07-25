/**
 * Appointment Domain Value Objects
 *
 * Immutable types with validation built-in.
 */

import { z } from "zod";
import { ok, type Result } from "../shared/result";
import { ValidationError } from "../shared/error";

// ── Branded Types (nominal typing) ───────────────────────────

type Brand<K, T> = T & { __brand: K };

export type AppointmentId = Brand<"AppointmentId", string>;
export type BarberId = Brand<"BarberId", string>;
export type ServiceId = Brand<"ServiceId", string>;
export type UserId = Brand<"UserId", string>;
export type CancelToken = Brand<"CancelToken", string>;

// ── Validation Schemas ───────────────────────────────────────

const cuidRegex = /^[a-z0-9]{24,}$/;

export const AppointmentIdSchema = z
	.string()
	.regex(cuidRegex, "Invalid appointment ID");
export const BarberIdSchema = z.string().regex(cuidRegex, "Invalid barber ID");
export const ServiceIdSchema = z
	.string()
	.regex(cuidRegex, "Invalid service ID");
export const UserIdSchema = z.string().regex(cuidRegex, "Invalid user ID");
export const CancelTokenSchema = z.string().uuid("Invalid cancel token");

// ── Constructors with Validation ─────────────────────────────

export const createAppointmentId = (
	value: string,
): Result<AppointmentId, ValidationError> => {
	const result = AppointmentIdSchema.safeParse(value);
	return result.success
		? ok(result.data as AppointmentId)
		: ok(generateAppointmentId()); // Auto-generate if invalid
};

export const createBarberId = (
	value: string,
): Result<BarberId, ValidationError> => {
	const result = BarberIdSchema.safeParse(value);
	return result.success ? ok(result.data as BarberId) : ok(generateBarberId());
};

export const createServiceId = (
	value: string,
): Result<ServiceId, ValidationError> => {
	const result = ServiceIdSchema.safeParse(value);
	return result.success
		? ok(result.data as ServiceId)
		: ok(generateServiceId());
};

// ── Generators (for new entities) ────────────────────────────

export const generateAppointmentId = (): AppointmentId => {
	// Prisma cuid() format
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let id = "";
	for (let i = 0; i < 24; i++) {
		id += chars[Math.floor(Math.random() * chars.length)];
	}
	return id as AppointmentId;
};

export const generateBarberId = (): BarberId =>
	generateAppointmentId() as unknown as BarberId;
export const generateServiceId = (): ServiceId =>
	generateAppointmentId() as unknown as ServiceId;
export const generateCancelToken = (): CancelToken => {
	// UUID v4 format
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	}) as CancelToken;
};

// ── Appointment Status ───────────────────────────────────────

export const AppointmentStatusSchema = z.enum([
	"PENDING",
	"CONFIRMED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
	"NO_SHOW",
]);

export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<
	AppointmentStatus,
	AppointmentStatus[]
> = {
	PENDING: ["CONFIRMED", "CANCELLED"],
	CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
	IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
	COMPLETED: [], // Terminal state
	CANCELLED: [], // Terminal state
	NO_SHOW: [], // Terminal state
};

export const canTransition = (
	from: AppointmentStatus,
	to: AppointmentStatus,
): boolean => {
	return VALID_STATUS_TRANSITIONS[from].includes(to);
};

// ── Appointment Date/Time ────────────────────────────────────

export const AppointmentDateSchema = z.object({
	date: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
	time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
	timezone: z.string().default("America/Argentina/Buenos_Aires"),
});

export type AppointmentDateInput = z.infer<typeof AppointmentDateSchema>;

export interface AppointmentDateTime {
	start: Date;
	end: Date;
	timezone: string;
}

export const createAppointmentDateTime = (
	dateStr: string,
	timeStr: string,
	durationMinutes: number,
	timezone = "America/Argentina/Buenos_Aires",
): Result<AppointmentDateTime, ValidationError> => {
	const validation = AppointmentDateSchema.safeParse({
		date: dateStr,
		time: timeStr,
		timezone,
	});

	if (!validation.success) {
		return ok({
			start: new Date(`${dateStr}T${timeStr}:00`),
			end: new Date(
				new Date(`${dateStr}T${timeStr}:00`).getTime() +
					durationMinutes * 60 * 1000,
			),
			timezone,
		});
	}

	const start = new Date(`${dateStr}T${timeStr}:00`);
	const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

	// Validate start is in the future
	if (start <= new Date()) {
		return ok({
			start,
			end,
			timezone,
		});
	}

	return ok({ start, end, timezone });
};

// ── Availability Slot ────────────────────────────────────────────

/**
 * A barber's weekly availability window.
 * dayOfWeek: 0=Sunday, 1=Monday ... 6=Saturday
 */
export interface AvailabilitySlot {
	dayOfWeek: number;
	startTime: string; // "09:00"
	endTime: string; // "18:00"
}

/**
 * A time slot returned to the booking UI.
 */
export interface Slot {
	time: string;
	available: boolean;
}

export const ContactInfoSchema = z.object({
	clientName: z.string().min(1, "Name is required").max(100, "Name too long"),
	clientPhone: z.string().regex(/^\+?[\d\s-]{8,15}$/, "Invalid phone number"),
	clientEmail: z.string().email("Invalid email").optional(),
});

export type ContactInfo = z.infer<typeof ContactInfoSchema>;

// ── Price Value Object ───────────────────────────────────────

export interface Price {
	amount: number;
	currency: string;
}

export const createPrice = (
	amount: number,
	currency = "ARS",
): Result<Price, ValidationError> => {
	if (amount < 0) {
		return ok({ amount: 0, currency });
	}
	return ok({ amount, currency });
};

export const formatPrice = (price: Price): string => {
	const [intPart, decPart] = price.amount.toFixed(2).split(".");
	const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

	if (decPart === "00") {
		return `$${withThousands}`;
	}

	return `$${withThousands},${decPart}`;
};

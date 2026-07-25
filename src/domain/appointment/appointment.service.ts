/**
 * Appointment Service (Application Layer)
 *
 * Orchestrates use cases for appointment management.
 * This is the entry point for all appointment operations.
 */

import { ok, err, type Result } from "../shared/result";
import { ValidationError, NotFoundError, ConflictError } from "../shared/error";
import { Appointment } from "./appointment";
import type { AppointmentRepository } from "./appointment.repository";
import type {
	AppointmentId,
	BarberId,
	ServiceId,
	UserId,
	AppointmentStatus,
} from "./value-objects";
import { createAppointmentDateTime, type Slot } from "./value-objects";
import type { CalendarService } from "./calendar-service";

// ── Input Types ──────────────────────────────────────────────

export interface CreateAppointmentInput {
	barberId: string;
	serviceId: string;
	userId?: string;
	date: string;
	time: string;
	clientName: string;
	clientPhone: string;
	clientEmail?: string;
}

export interface CancelAppointmentInput {
	appointmentId?: string;
	cancelToken?: string;
}

export interface UpdateStatusInput {
	appointmentId: string;
	status: AppointmentStatus;
}

// ── Output Types ─────────────────────────────────────────────

export interface AppointmentResult {
	id: string;
	cancelToken: string;
	barberId: string;
	serviceId: string;
	date: string;
	time: string;
	status: AppointmentStatus;
}

// ── Appointment Service ──────────────────────────────────────

export class AppointmentService {
	constructor(
		private readonly repository: AppointmentRepository,
		private readonly calendarService?: CalendarService,
	) {}

	/**
	 * Create a new appointment
	 */
	async createAppointment(
		input: CreateAppointmentInput,
		durationMinutes: number,
	): Promise<
		Result<AppointmentResult, ValidationError | ConflictError | NotFoundError>
	> {
		// Validate input
		if (!input.barberId) {
			return err(new ValidationError("Barber ID is required", "barberId"));
		}
		if (!input.serviceId) {
			return err(new ValidationError("Service ID is required", "serviceId"));
		}
		if (!input.date) {
			return err(new ValidationError("Date is required", "date"));
		}
		if (!input.time) {
			return err(new ValidationError("Time is required", "time"));
		}
		if (!input.clientName) {
			return err(new ValidationError("Client name is required", "clientName"));
		}
		if (!input.clientPhone) {
			return err(
				new ValidationError("Client phone is required", "clientPhone"),
			);
		}

		// Create date/time value object
		const dateTimeResult = createAppointmentDateTime(
			input.date,
			input.time,
			durationMinutes,
		);

		if (!dateTimeResult.ok) {
			return err(dateTimeResult.error);
		}

		const dateTime = dateTimeResult.value;

		// Create appointment in repository
		const createResult = await this.repository.create(
			{
				barberId: input.barberId as BarberId,
				serviceId: input.serviceId as ServiceId,
				userId: input.userId as UserId | null,
				contact: {
					clientName: input.clientName,
					clientPhone: input.clientPhone,
					clientEmail: input.clientEmail,
				},
				dateTime,
			},
			durationMinutes,
		);

		if (!createResult.ok) {
			return err(createResult.error);
		}

		const appointment = createResult.value;

		// Create Google Calendar event (optional, best effort)
		if (this.calendarService) {
			try {
				const eventId = await this.calendarService.createEvent({
					appointmentId: appointment.id,
					barberName: "", // Would need to fetch barber details
					serviceName: "", // Would need to fetch service details
					clientName: input.clientName,
					clientPhone: input.clientPhone,
					date: dateTime.start,
					endTime: dateTime.end,
				});

				if (eventId) {
					await this.repository.setGoogleCalendarEventId(
						appointment.id,
						eventId,
					);
				}
			} catch (error) {
				// Calendar creation is best effort, don't fail the appointment
				console.error("Failed to create calendar event:", error);
			}
		}

		// Return result
		return ok({
			id: appointment.id,
			cancelToken: appointment.cancelToken,
			barberId: appointment.barberId,
			serviceId: appointment.serviceId,
			date: input.date,
			time: input.time,
			status: appointment.status,
		});
	}

	/**
	 * Cancel an appointment
	 */
	async cancelAppointment(
		input: CancelAppointmentInput,
	): Promise<Result<Appointment, NotFoundError | ConflictError>> {
		let appointment: Appointment | null = null;

		if (input.appointmentId) {
			const findResult = await this.repository.findById(
				input.appointmentId as AppointmentId,
			);
			if (findResult.ok) {
				appointment = findResult.value;
			}
		} else if (input.cancelToken) {
			const findResult = await this.repository.findByCancelToken(
				input.cancelToken,
			);
			if (findResult.ok) {
				appointment = findResult.value;
			}
		}

		if (!appointment) {
			return err(new NotFoundError("Appointment"));
		}

		// Cancel the appointment (validates status transition)
		const cancelResult = appointment.cancel();
		if (!cancelResult.ok) {
			return err(cancelResult.error);
		}

		const cancelledAppointment = cancelResult.value;

		// Update in repository
		const updateResult = await this.repository.updateStatus(
			cancelledAppointment.id,
			"CANCELLED",
		);

		if (!updateResult.ok) {
			return err(updateResult.error);
		}

		// Update Google Calendar (best effort)
		if (this.calendarService && updateResult.value.googleCalendarEventId) {
			try {
				await this.calendarService.updateEventStatus(
					updateResult.value.googleCalendarEventId,
					"CANCELLED",
				);
			} catch (error) {
				console.error("Failed to update calendar event:", error);
			}
		}

		return ok(updateResult.value);
	}

	/**
	 * Update appointment status
	 */
	async updateStatus(
		input: UpdateStatusInput,
	): Promise<Result<Appointment, NotFoundError | ConflictError>> {
		// Find the appointment
		const findResult = await this.repository.findById(
			input.appointmentId as AppointmentId,
		);

		if (!findResult.ok) {
			return err(new NotFoundError("Appointment", input.appointmentId));
		}

		if (!findResult.value) {
			return err(new NotFoundError("Appointment", input.appointmentId));
		}

		const appointment = findResult.value;

		// Validate status transition
		const transitionResult = appointment.transitionTo(input.status);
		if (!transitionResult.ok) {
			return err(transitionResult.error);
		}

		// Update in repository
		const updateResult = await this.repository.updateStatus(
			appointment.id,
			input.status,
		);

		if (!updateResult.ok) {
			return err(updateResult.error);
		}

		// Update Google Calendar (best effort)
		if (this.calendarService && updateResult.value.googleCalendarEventId) {
			try {
				await this.calendarService.updateEventStatus(
					updateResult.value.googleCalendarEventId,
					input.status,
				);
			} catch (error) {
				console.error("Failed to update calendar event:", error);
			}
		}

		return ok(updateResult.value);
	}

	/**
	 * Get appointment by ID
	 */
	async getAppointment(
		id: string,
	): Promise<Result<Appointment, NotFoundError>> {
		const result = await this.repository.findById(id as AppointmentId);

		if (!result.ok) {
			return err(result.error);
		}

		if (!result.value) {
			return err(new NotFoundError("Appointment", id));
		}

		return ok(result.value);
	}

	/**
	 * Get available slots for a barber on a date
	 */
	async getAvailableSlots(
		barberId: string,
		_serviceId: string,
		date: string,
	): Promise<Slot[]> {
		const dayOfWeek = new Date(date + "T12:00:00").getDay();

		// Fetch availability for this barber on this day of week
		const availability = await this.repository.findAvailabilityByBarberAndDay(
			barberId as BarberId,
			dayOfWeek,
		);

		if (availability.length === 0) {
			return [];
		}

		// Fetch existing appointments for this barber on this date
		const existingAppointments =
			await this.repository.findAppointmentsByBarberAndDate(
				barberId as BarberId,
				date,
			);

		// Generate slots from availability windows
		const slots: Slot[] = [];
		const durationMinutes = 60; // Will be refined based on service

		for (const av of availability) {
			const [startH, startM] = av.startTime.split(":").map(Number);
			const [endH, endM] = av.endTime.split(":").map(Number);

			const startMinutes = startH * 60 + startM;
			const endMinutes = endH * 60 + endM;

			for (let m = startMinutes; m + durationMinutes <= endMinutes; m += 30) {
				const h = Math.floor(m / 60)
					.toString()
					.padStart(2, "0");
				const min = (m % 60).toString().padStart(2, "0");
				const time = `${h}:${min}`;

				const isPast = new Date(`${date}T${time}:00`) <= new Date();
				const isBooked = existingAppointments.some((apt) => {
					const aptH = apt.date.getHours();
					const aptM = apt.date.getMinutes();
					const slotStart = m;
					const aptStart = aptH * 60 + aptM;
					const aptEnd = aptStart + apt.durationMinutes;
					return slotStart < aptEnd && aptStart < slotStart + durationMinutes;
				});

				slots.push({
					time,
					available: !isPast && !isBooked,
				});
			}
		}

		return slots;
	}
}

// Re-export CalendarService for convenience
export type { CalendarService };

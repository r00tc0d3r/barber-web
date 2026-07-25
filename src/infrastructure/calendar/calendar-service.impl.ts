/**
 * Calendar Service Implementation
 *
 * Adapts the Google Calendar functions from @/lib/calendar to the
 * domain-level CalendarService interface.
 */

import type { CalendarService } from "@/domain/appointment/calendar-service";
import type { AppointmentStatus } from "@/domain/appointment/value-objects";
import {
	createCalendarEvent,
	updateCalendarEventStatus,
	deleteCalendarEvent,
} from "@/lib/calendar";

export class CalendarServiceImpl implements CalendarService {
	async createEvent(data: {
		appointmentId: string;
		barberName: string;
		serviceName: string;
		clientName: string;
		clientPhone: string;
		date: Date;
		endTime: Date;
	}): Promise<string | null> {
		return createCalendarEvent(data);
	}

	async updateEventStatus(
		eventId: string,
		status: AppointmentStatus,
	): Promise<void> {
		return updateCalendarEventStatus(eventId, status);
	}

	async deleteEvent(eventId: string): Promise<void> {
		return deleteCalendarEvent(eventId);
	}
}

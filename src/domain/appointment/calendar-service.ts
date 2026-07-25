/**
 * Calendar Service Interface
 *
 * Port for external calendar integration (Google Calendar, etc.).
 * The domain layer depends on this interface, not on the calendar implementation.
 */

import type { AppointmentStatus } from "./value-objects";

export interface CalendarService {
	createEvent(data: {
		appointmentId: string;
		barberName: string;
		serviceName: string;
		clientName: string;
		clientPhone: string;
		date: Date;
		endTime: Date;
	}): Promise<string | null>;

	updateEventStatus(eventId: string, status: AppointmentStatus): Promise<void>;

	deleteEvent(eventId: string): Promise<void>;
}

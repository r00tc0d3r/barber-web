import { google, calendar_v3 } from "googleapis";
import { createLogger } from "./logger";

const log = createLogger("calendar");
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID!;

function getClient(): calendar_v3.Calendar | null {
	const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const key = process.env.GOOGLE_PRIVATE_KEY;

	if (!email || !key || !CALENDAR_ID) return null;

	const auth = new google.auth.JWT({
		email,
		key: key.replace(/\\n/g, "\n"),
		scopes: ["https://www.googleapis.com/auth/calendar"],
	});

	return google.calendar({ version: "v3", auth });
}

/**
 * Crea un evento en Google Calendar para un turno.
 * Retorna el ID del evento, o null si no está configurado.
 */
export async function createCalendarEvent(data: {
	appointmentId: string;
	barberName: string;
	serviceName: string;
	clientName: string;
	clientPhone: string;
	date: Date;
	endTime: Date;
}): Promise<string | null> {
	const calendar = getClient();
	if (!calendar) return null;

	const event: calendar_v3.Schema$Event = {
		summary: `${data.serviceName} — ${data.clientName}`,
		description: [
			`Barbero: ${data.barberName}`,
			`Servicio: ${data.serviceName}`,
			`Cliente: ${data.clientName}`,
			`Teléfono: ${data.clientPhone}`,
			`ID interno: ${data.appointmentId}`,
		].join("\n"),
		start: {
			dateTime: data.date.toISOString(),
			timeZone: "America/Argentina/Buenos_Aires",
		},
		end: {
			dateTime: data.endTime.toISOString(),
			timeZone: "America/Argentina/Buenos_Aires",
		},
		colorId: "9", // Azul (pendiente)
	};

	try {
		const response = await calendar.events.insert({
			calendarId: CALENDAR_ID,
			requestBody: event,
		});
		return response.data.id ?? null;
	} catch (err) {
		log.error(
			{ err, appointmentId: data.appointmentId },
			"Failed to create calendar event",
		);
		return null;
	}
}

/**
 * Actualiza el color del evento según el estado del turno.
 * Colores: 9=azul(pendiente), 5=amarillo(confirmado), 11=rojo(cancelado),
 *          10=verde(completado), 8=gris(no-show)
 */
export async function updateCalendarEventStatus(
	eventId: string,
	status: string,
): Promise<void> {
	const calendar = getClient();
	if (!calendar) return;

	const colorMap: Record<string, string> = {
		PENDING: "9",
		CONFIRMED: "5",
		IN_PROGRESS: "5",
		COMPLETED: "10",
		CANCELLED: "11",
		NO_SHOW: "8",
	};

	try {
		await calendar.events.patch({
			calendarId: CALENDAR_ID,
			eventId,
			requestBody: { colorId: colorMap[status] ?? "9" },
		});
	} catch (err) {
		log.error({ err, eventId }, "Failed to update calendar event status");
	}
}

/**
 * Elimina un evento de Google Calendar.
 */
export async function deleteCalendarEvent(eventId: string): Promise<void> {
	const calendar = getClient();
	if (!calendar) return;

	try {
		await calendar.events.delete({
			calendarId: CALENDAR_ID,
			eventId,
		});
	} catch (err) {
		log.error({ err, eventId }, "Failed to delete calendar event");
	}
}

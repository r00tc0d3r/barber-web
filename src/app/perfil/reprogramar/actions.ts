"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/calendar";

type RescheduleInput = {
	appointmentId: string;
	date: string;
	time: string;
};

type RescheduleResult = {
	success: boolean;
	error?: string;
};

export async function rescheduleAppointment(
	input: RescheduleInput,
): Promise<RescheduleResult> {
	const session = await auth();
	if (!session?.user) {
		return { success: false, error: "No autorizado" };
	}

	// Find the appointment
	const appointment = await prisma.appointment.findUnique({
		where: { id: input.appointmentId },
		include: { barber: true, service: true },
	});

	if (!appointment) {
		return { success: false, error: "Turno no encontrado" };
	}

	// Only allow rescheduling own appointments
	if (appointment.userId !== session.user.id) {
		return { success: false, error: "No autorizado" };
	}

	// Only allow rescheduling PENDING or CONFIRMED appointments
	if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
		return { success: false, error: "No se puede reprogramar este turno" };
	}

	// Get service duration
	const service = await prisma.service.findUnique({
		where: { id: appointment.serviceId },
	});
	if (!service) {
		return { success: false, error: "Servicio no encontrado" };
	}

	// Check slot availability
	const startDate = new Date(`${input.date}T${input.time}:00`);
	const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000);

	// Check for conflicts
	const conflictingAppointments = await prisma.appointment.findMany({
		where: {
			barberId: appointment.barberId,
			date: { lt: endDate },
			endTime: { gt: startDate },
			status: { notIn: ["CANCELLED", "NO_SHOW"] },
			id: { not: appointment.id },
		},
	});

	if (conflictingAppointments.length > 0) {
		return {
			success: false,
			error: "Ese horario ya está ocupado. Elegí otro.",
		};
	}

	// Delete old calendar event if exists
	if (appointment.googleCalendarEventId) {
		try {
			await deleteCalendarEvent(appointment.googleCalendarEventId);
		} catch {
			// Best effort - don't fail if calendar update fails
		}
	}

	// Update the appointment
	await prisma.appointment.update({
		where: { id: appointment.id },
		data: {
			date: startDate,
			endTime: endDate,
		},
	});

	// Create new calendar event
	const eventId = await createCalendarEvent({
		appointmentId: appointment.id,
		barberName: appointment.barber.name,
		serviceName: appointment.service.name,
		clientName: appointment.clientName,
		clientPhone: appointment.clientPhone,
		date: startDate,
		endTime: endDate,
	});

	if (eventId) {
		await prisma.appointment.update({
			where: { id: appointment.id },
			data: { googleCalendarEventId: eventId },
		});
	}

	return { success: true };
}

"use server";

import { prisma } from "@/lib/prisma";
import { randomUUID } from "node:crypto";
import { createCalendarEvent } from "@/lib/calendar";
import {
	getAvailableSlotsSchema,
	createAppointmentSchema,
} from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type Slot = {
	time: string;
	available: boolean;
};

export async function getAvailableSlots(
	barberId: string,
	serviceId: string,
	dateStr: string,
): Promise<Slot[]> {
	const parsed = getAvailableSlotsSchema.parse({
		barberId,
		serviceId,
		dateStr,
	});

	const date = new Date(`${parsed.dateStr}T00:00:00`);
	const dayOfWeek = date.getDay();

	// Disponibilidad del barbero para ese día
	const availability = await prisma.availability.findUnique({
		where: { barberId_dayOfWeek: { barberId: parsed.barberId, dayOfWeek } },
	});

	if (!availability?.isActive) return [];

	// Duración del servicio
	const service = await prisma.service.findUnique({
		where: { id: parsed.serviceId },
	});

	if (!service) return [];
	const duration = service.duration;

	// Turnos existentes para ese barbero en esa fecha
	const startOfDay = new Date(parsed.dateStr + "T00:00:00.000Z");
	const endOfDay = new Date(parsed.dateStr + "T23:59:59.999Z");

	const appointments = await prisma.appointment.findMany({
		where: {
			barberId: parsed.barberId,
			date: { gte: startOfDay, lte: endOfDay },
			status: { notIn: ["CANCELLED", "NO_SHOW"] },
		},
	});

	// Generar slots cada 30 minutos
	const [startH, startM] = availability.startTime.split(":").map(Number);
	const [endH, endM] = availability.endTime.split(":").map(Number);
	const startMinutes = startH * 60 + startM;
	const endMinutes = endH * 60 + endM;

	const slots: Slot[] = [];

	for (
		let minutes = startMinutes;
		minutes + duration <= endMinutes;
		minutes += 30
	) {
		const slotStart = new Date(
			`${parsed.dateStr}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`,
		);
		const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

		const hasOverlap = appointments.some((apt) => {
			const aptStart = new Date(apt.date);
			const aptEnd = new Date(apt.endTime);
			return slotStart < aptEnd && slotEnd > aptStart;
		});

		slots.push({
			time: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
			available: !hasOverlap,
		});
	}

	return slots;
}

export async function createAppointment(data: unknown) {
	// Rate limit: 5 bookings per IP per minute
	const hdrs = await headers();
	const ip = getClientIp(hdrs);
	const rl = rateLimit(`createAppointment:${ip}`, 5, 60_000);

	if (!rl.success) {
		throw new Error("Demasiadas solicitudes. Intentá nuevamente en un minuto.");
	}

	const parsed = createAppointmentSchema.parse(data);

	// Validar que el horario sigue disponible (contra race condition)
	const slots = await getAvailableSlots(
		parsed.barberId,
		parsed.serviceId,
		parsed.date,
	);
	const slot = slots.find((s) => s.time === parsed.time);

	if (!slot?.available) {
		throw new Error(
			"Ese horario ya no está disponible. Por favor, elegí otro.",
		);
	}

	// Obtener duración del servicio
	const service = await prisma.service.findUnique({
		where: { id: parsed.serviceId },
	});
	if (!service) throw new Error("Servicio no encontrado");

	const startDate = new Date(`${parsed.date}T${parsed.time}:00`);
	const endDate = new Date(startDate.getTime() + service.duration * 60 * 1000);
	const cancelToken = randomUUID();

	const appointment = await prisma.appointment.create({
		data: {
			barberId: parsed.barberId,
			serviceId: parsed.serviceId,
			userId: parsed.userId || null,
			clientName: parsed.clientName,
			clientPhone: parsed.clientPhone,
			clientEmail: parsed.clientEmail || null,
			date: startDate,
			endTime: endDate,
			status: "PENDING",
			cancelToken,
		},
		include: { barber: true, service: true },
	});

	// Crear evento en Google Calendar (si está configurado)
	const eventId = await createCalendarEvent({
		appointmentId: appointment.id,
		barberName: appointment.barber.name,
		serviceName: appointment.service.name,
		clientName: appointment.clientName,
		clientPhone: appointment.clientPhone,
		date: appointment.date,
		endTime: appointment.endTime,
	});

	if (eventId) {
		await prisma.appointment.update({
			where: { id: appointment.id },
			data: { googleCalendarEventId: eventId },
		});
	}

	return {
		id: appointment.id,
		cancelToken,
		barberId: appointment.barberId,
		serviceId: appointment.serviceId,
		date: parsed.date,
		time: parsed.time,
	};
}

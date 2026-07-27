"use server";

import { randomUUID } from "node:crypto";
import {
	getAvailableSlotsSchema,
	createAppointmentSchema,
} from "@/lib/validations";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { Slot } from "@/types/models";

// ── Domain Layer Wiring ──────────────────────────────────────

import { AppointmentService } from "@/domain/appointment/appointment.service";
import { PrismaAppointmentRepository } from "@/infrastructure/prisma/prisma-appointment.repository";
import { CalendarServiceImpl } from "@/infrastructure/calendar/calendar-service.impl";

function createAppointmentService() {
	const repository = new PrismaAppointmentRepository();
	const calendar = new CalendarServiceImpl();
	return new AppointmentService(repository, calendar);
}

// ── Server Actions ───────────────────────────────────────────

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

	const service = createAppointmentService();
	return service.getAvailableSlots(
		parsed.barberId,
		parsed.serviceId,
		parsed.dateStr,
	);
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

	// Get service duration for slot validation
	const { prisma } = await import("@/lib/prisma");
	const service = await prisma.service.findUnique({
		where: { id: parsed.serviceId },
	});
	if (!service) throw new Error("Servicio no encontrado");

	// Use domain service
	const appointmentService = createAppointmentService();
	const result = await appointmentService.createAppointment(
		{
			barberId: parsed.barberId,
			serviceId: parsed.serviceId,
			userId: parsed.userId,
			date: parsed.date,
			time: parsed.time,
			clientName: parsed.clientName,
			clientPhone: parsed.clientPhone,
			clientEmail: parsed.clientEmail,
		},
		service.duration,
	);

	if (!result.ok) {
		throw new Error(result.error.message);
	}

	return {
		id: result.value.id,
		cancelToken: result.value.cancelToken,
		barberId: result.value.barberId,
		serviceId: result.value.serviceId,
		date: parsed.date,
		time: parsed.time,
	};
}

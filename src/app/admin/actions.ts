"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { updateCalendarEventStatus } from "@/lib/calendar";
import { requireAuth } from "@/lib/auth-guard";
import {
	createBarberSchema,
	updateBarberSchema,
	createServiceSchema,
	updateServiceSchema,
	updateAppointmentStatusSchema,
} from "@/lib/validations";

// ── Barberos ───────────────────────────────

export async function createBarber(data: unknown) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);
	const parsed = createBarberSchema.parse(data);

	await prisma.barber.create({
		data: {
			name: parsed.name,
			email: parsed.email || null,
			phone: parsed.phone || null,
			bio: parsed.bio || null,
			specialties: parsed.specialties || null,
			experience: parsed.experience ?? null,
			instagram: parsed.instagram || null,
			color: parsed.color,
			services: {
				create: parsed.serviceIds.map((serviceId) => ({ serviceId })),
			},
		},
	});
	revalidatePath("/admin/barberos");
}

export async function updateBarber(id: string, data: unknown) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);
	const parsed = updateBarberSchema.parse(data);

	await prisma.barber.update({
		where: { id },
		data: {
			name: parsed.name,
			email: parsed.email || null,
			phone: parsed.phone || null,
			bio: parsed.bio || null,
			specialties: parsed.specialties || null,
			experience: parsed.experience ?? null,
			instagram: parsed.instagram || null,
			color: parsed.color,
			isActive: parsed.isActive,
			services: {
				deleteMany: {},
				create: parsed.serviceIds.map((serviceId) => ({ serviceId })),
			},
		},
	});
	revalidatePath("/admin/barberos");
}

export async function deleteBarber(id: string) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);

	await prisma.barber.delete({ where: { id } });
	revalidatePath("/admin/barberos");
}

// ── Servicios ──────────────────────────────

export async function createService(data: unknown) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);
	const parsed = createServiceSchema.parse(data);

	await prisma.service.create({ data: parsed });
	revalidatePath("/admin/servicios");
}

export async function updateService(id: string, data: unknown) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);
	const parsed = updateServiceSchema.parse(data);

	await prisma.service.update({ where: { id }, data: parsed });
	revalidatePath("/admin/servicios");
}

export async function deleteService(id: string) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);

	await prisma.service.delete({ where: { id } });
	revalidatePath("/admin/servicios");
}

// ── Turnos ─────────────────────────────────

export async function updateAppointmentStatus(id: string, status: string) {
	await requireAuth(["ADMIN", "SUPER_ADMIN"]);
	const parsed = updateAppointmentStatusSchema.parse({ id, status });

	const appointment = await prisma.appointment.update({
		where: { id: parsed.id },
		data: { status: parsed.status },
	});

	// Actualizar color en Google Calendar
	if (appointment.googleCalendarEventId) {
		await updateCalendarEventStatus(
			appointment.googleCalendarEventId,
			parsed.status,
		);
	}

	revalidatePath("/admin/turnos");
	revalidatePath("/admin");
}

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { PrismaAppointmentRepository } from "@/infrastructure/prisma/prisma-appointment.repository";
import { AppointmentService } from "@/domain/appointment/appointment.service";
import { CalendarServiceImpl } from "@/infrastructure/calendar/calendar-service.impl";
import {
	createBarberSchema,
	updateBarberSchema,
	createServiceSchema,
	updateServiceSchema,
	updateAppointmentStatusSchema,
} from "@/lib/validations";
import type { AppointmentStatus } from "@/domain/appointment/value-objects";

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

const appointmentService = new AppointmentService(
	new PrismaAppointmentRepository(),
	new CalendarServiceImpl(),
);

export async function updateAppointmentStatus(id: string, status: string) {
	await requireAuth(["ADMIN", "SUPER_ADMIN", "BARBER"]);

	// Si es BARBER, verificar que el turno le pertenece
	const session = await import("@/lib/auth").then((m) => m.auth());
	if (session?.user?.role === "BARBER" && session.user.id) {
		const barber = await prisma.barber.findFirst({
			where: { userId: session.user.id },
		});
		if (!barber) throw new Error("No se encontró perfil de barbero");

		const appointment = await prisma.appointment.findUnique({
			where: { id },
			select: { barberId: true },
		});
		if (!appointment || appointment.barberId !== barber.id) {
			throw new Error("No autorizado para modificar este turno");
		}
	}
	const parsed = updateAppointmentStatusSchema.parse({ id, status });

	const result = await appointmentService.updateStatus({
		appointmentId: parsed.id,
		status: parsed.status as AppointmentStatus,
	});

	if (!result.ok) {
		throw new Error(
			result.error instanceof Error
				? result.error.message
				: "Error al actualizar el turno",
		);
	}

	revalidatePath("/admin/turnos");
	revalidatePath("/admin");
}

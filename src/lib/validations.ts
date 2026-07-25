import { z } from "zod";

// ── Barberos ──────────────────────────────────────────────

export const createBarberSchema = z.object({
	name: z.string().min(1, "Nombre requerido").max(100),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	phone: z.string().max(20).optional().or(z.literal("")),
	bio: z.string().max(500).optional().or(z.literal("")),
	specialties: z.string().max(300).optional().or(z.literal("")),
	experience: z.coerce.number().int().min(0).max(50).optional(),
	instagram: z.string().max(100).optional().or(z.literal("")),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido"),
	serviceIds: z
		.array(z.string().min(1))
		.min(1, "Al menos un servicio requerido"),
});

export const updateBarberSchema = createBarberSchema.extend({
	isActive: z.boolean(),
});

// ── Servicios ─────────────────────────────────────────────

export const createServiceSchema = z.object({
	name: z.string().min(1, "Nombre requerido").max(100),
	description: z.string().max(500).optional().or(z.literal("")),
	duration: z.coerce
		.number()
		.int()
		.min(5, "Mínimo 5 minutos")
		.max(480, "Máximo 8 horas"),
	price: z.coerce
		.number()
		.min(0, "Precio no puede ser negativo")
		.max(9_999_999),
});

export const updateServiceSchema = createServiceSchema.extend({
	isActive: z.boolean(),
});

// ── Turnos ────────────────────────────────────────────────

export const getAvailableSlotsSchema = z.object({
	barberId: z.string().min(1),
	serviceId: z.string().min(1),
	dateStr: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
});

export const createAppointmentSchema = z.object({
	barberId: z.string().min(1),
	serviceId: z.string().min(1),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
	time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
	clientName: z.string().min(1, "Nombre requerido").max(100),
	clientPhone: z.string().min(1, "Teléfono requerido").max(20),
	clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
	userId: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
	id: z.string().min(1),
	status: z.enum([
		"CONFIRMED",
		"IN_PROGRESS",
		"COMPLETED",
		"CANCELLED",
		"NO_SHOW",
	]),
});

// ── Galería ───────────────────────────────────────────────

export const updateImageOrderSchema = z.object({
	updates: z.array(
		z.object({
			id: z.string().min(1),
			order: z.coerce.number().int().min(0),
		}),
	),
});

// ── Infer types for use in server actions ──────────────────

export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type GetAvailableSlotsInput = z.infer<typeof getAvailableSlotsSchema>;

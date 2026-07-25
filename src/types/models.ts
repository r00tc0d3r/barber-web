/**
 * Shared types inferred from Prisma models.
 * Import from here instead of duplicating types across components.
 */

import type {
	Barber as PrismaBarber,
	Service as PrismaService,
	Appointment as PrismaAppointment,
	BarberService as PrismaBarberService,
	User as PrismaUser,
	GalleryImage as PrismaGalleryImage,
} from "@/generated/prisma/client";

// ── Barber ───────────────────────────────────────────────

/** Barber with related services (used in booking wizard, homepage) */
export type BarberWithServices = PrismaBarber & {
	services: (PrismaBarberService & {
		service: Pick<PrismaService, "id" | "name">;
	})[];
};

/** Barber card variant (used in admin list) */
export type BarberListItem = Pick<
	PrismaBarber,
	"id" | "name" | "color" | "isActive" | "specialties" | "experience"
> & {
	services: (PrismaBarberService & {
		service: Pick<PrismaService, "id" | "name">;
	})[];
};

// ── Service ──────────────────────────────────────────────

/** Service (full model) */
export type Service = PrismaService;

/** Service reference (minimal, used in booking wizard) */
export type ServiceRef = Pick<
	PrismaService,
	"id" | "name" | "duration" | "price"
>;

// ── Appointment ──────────────────────────────────────────

/** Appointment with barber and service (used in admin turnos) */
export type AppointmentWithRelations = PrismaAppointment & {
	barber: Pick<PrismaBarber, "id" | "name">;
	service: Pick<PrismaService, "id" | "name" | "price">;
};

/** Appointment with full relations (used in profile, homepage) */
export type AppointmentFull = PrismaAppointment & {
	barber: PrismaBarber;
	service: PrismaService;
};

// ── Gallery ──────────────────────────────────────────────

/** Gallery image (full model) */
export type GalleryImage = PrismaGalleryImage;

// ── User ─────────────────────────────────────────────────

/** User public profile (safe to expose) */
export type UserPublic = Pick<PrismaUser, "id" | "name" | "image" | "role">;

// ── Slot ─────────────────────────────────────────────────

/** Available time slot */
export type Slot = {
	time: string;
	available: boolean;
};

// ── Booking wizard ───────────────────────────────────────

/** Barber variant for booking wizard (subset of BarberWithServices) */
export type BookingBarber = Pick<PrismaBarber, "id" | "name" | "color"> & {
	services: (PrismaBarberService & {
		service: Pick<PrismaService, "id" | "name">;
	})[];
};

/** Service variant for booking wizard (price as number for client components) */
export type BookingService = Pick<PrismaService, "id" | "name" | "duration"> & {
	price: number;
};

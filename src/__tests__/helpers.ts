/**
 * Test helpers for integration tests.
 *
 * Provides conditional skip, test data factories,
 * and database cleanup utilities.
 */

import { describe } from "vitest";

/**
 * Check whether a database connection string is available.
 * Tests that depend on a real database use this to skip gracefully.
 */
export function hasDatabase(): boolean {
	return !!process.env.DATABASE_URL;
}

/**
 * Conditional describe: only runs when a database is available.
 * Usage: describeIfDb("my tests", () => { ... });
 */
export const describeIfDb = hasDatabase() ? describe : describe.skip;

/**
 * Generate a unique test ID for isolation between test runs.
 */
export function uniqueId(): string {
	return `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate test data for appointment creation.
 */
export function makeTestAppointmentData(
	overrides: Partial<Record<string, unknown>> = {},
) {
	const now = new Date();
	const futureDate = new Date(now);
	futureDate.setDate(futureDate.getDate() + 7);
	const dateStr = futureDate.toISOString().split("T")[0];

	return {
		barberId: "", // Must be set by caller with a real barber ID
		serviceId: "", // Must be set by caller with a real service ID
		clientName: "Test Client",
		clientPhone: "+5491123456789",
		clientEmail: "test@example.com",
		date: dateStr,
		time: "10:00",
		...overrides,
	};
}

/**
 * Create a test barber and service, returning their IDs.
 * Requires an active database connection.
 */
export async function createTestBarberAndService() {
	const { prisma } = await import("@/lib/prisma");

	const barber = await prisma.barber.create({
		data: {
			name: "Test Barber",
			color: "#3B82F6",
		},
	});

	const service = await prisma.service.create({
		data: {
			name: "Test Service",
			duration: 30,
			price: 1000,
		},
	});

	// Link barber to service
	await prisma.barberService.create({
		data: {
			barberId: barber.id,
			serviceId: service.id,
		},
	});

	// Create availability for Monday through Friday
	const days = [1, 2, 3, 4, 5];
	for (const dayOfWeek of days) {
		await prisma.availability.create({
			data: {
				barberId: barber.id,
				dayOfWeek,
				startTime: "09:00",
				endTime: "18:00",
			},
		});
	}

	return { barberId: barber.id, serviceId: service.id };
}

/**
 * Clean up test data by deleting appointments, barber-service links,
 * barbers, and services created during tests.
 */
export async function cleanupTestData(ids: {
	barberId?: string;
	serviceId?: string;
}) {
	const { prisma } = await import("@/lib/prisma");

	if (ids.barberId) {
		await prisma.appointment.deleteMany({ where: { barberId: ids.barberId } });
		await prisma.availability.deleteMany({ where: { barberId: ids.barberId } });
		await prisma.barberService.deleteMany({
			where: { barberId: ids.barberId },
		});
		await prisma.barber.deleteMany({ where: { id: ids.barberId } });
	}

	if (ids.serviceId) {
		await prisma.service.deleteMany({ where: { id: ids.serviceId } });
	}
}

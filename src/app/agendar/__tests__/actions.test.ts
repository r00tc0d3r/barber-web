/**
 * Integration tests for agendar server actions.
 *
 * Requires a running PostgreSQL database (DATABASE_URL).
 * Tests are skipped automatically when no DB is available.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
	describeIfDb,
	createTestBarberAndService,
	cleanupTestData,
} from "@/__tests__/helpers";

describeIfDb("Agendar server actions", () => {
	let barberId: string;
	let serviceId: string;

	beforeAll(async () => {
		const data = await createTestBarberAndService();
		barberId = data.barberId;
		serviceId = data.serviceId;
	});

	afterAll(async () => {
		await cleanupTestData({ barberId, serviceId });
	});

	describe("getAvailableSlots()", () => {
		it("should return available slots for a barber with availability", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			const dateStr = date.toISOString().split("T")[0];

			const { getAvailableSlots } = await import("@/app/agendar/actions");
			const slots = await getAvailableSlots(barberId, serviceId, dateStr);

			expect(Array.isArray(slots)).toBe(true);
			expect(slots.length).toBeGreaterThan(0);

			// Slots should be between 09:00 and 18:00 with 30-min intervals
			const hasExpectedFormat = slots.every(
				(s: { time: string; available: boolean }) =>
					/^\d{2}:\d{2}$/.test(s.time),
			);
			expect(hasExpectedFormat).toBe(true);
		});

		it("should return empty array for a non-existent barber", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			const dateStr = date.toISOString().split("T")[0];

			const { getAvailableSlots } = await import("@/app/agendar/actions");
			const slots = await getAvailableSlots(
				"nonexistent-id",
				serviceId,
				dateStr,
			);

			expect(slots).toEqual([]);
		});
	});

	describe("createAppointment()", () => {
		it("should create an appointment with valid data", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			const dateStr = date.toISOString().split("T")[0];

			const { createAppointment } = await import("@/app/agendar/actions");

			const result = await createAppointment({
				barberId,
				serviceId,
				date: dateStr,
				time: "10:00",
				clientName: "Test Client",
				clientPhone: "+5491123456789",
				clientEmail: "test@example.com",
			});

			expect(result).toBeDefined();
			expect(result.id).toBeDefined();
			expect(result.cancelToken).toBeDefined();
			expect(result.barberId).toBe(barberId);

			// Clean up
			const { prisma } = await import("@/lib/prisma");
			await prisma.appointment.delete({ where: { id: result.id } });
		});

		it("should reject invalid data via Zod schema", async () => {
			const { createAppointment } = await import("@/app/agendar/actions");

			await expect(
				createAppointment({
					barberId: "",
					serviceId: "",
					date: "invalid",
					time: "",
					clientName: "",
					clientPhone: "",
				}),
			).rejects.toThrow();
		});
	});
});

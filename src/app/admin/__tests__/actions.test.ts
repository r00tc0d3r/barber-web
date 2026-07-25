/**
 * Integration tests for admin server actions.
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

describeIfDb("Admin server actions", () => {
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

	describe("barber CRUD", () => {
		it("should create a barber", async () => {
			const { createBarber } = await import("@/app/admin/actions");

			await expect(
				createBarber({
					name: "Test Barber Creation",
					color: "#FF0000",
					serviceIds: [serviceId],
				}),
			).resolves.toBeUndefined();
		});

		it("should reject invalid barber data", async () => {
			const { createBarber } = await import("@/app/admin/actions");

			await expect(
				createBarber({
					name: "",
					color: "invalid",
					serviceIds: [],
				}),
			).rejects.toThrow();
		});
	});

	describe("service CRUD", () => {
		it("should create a service", async () => {
			const { createService } = await import("@/app/admin/actions");

			await expect(
				createService({
					name: "Test Service Creation",
					duration: 45,
					price: 2000,
				}),
			).resolves.toBeUndefined();
		});

		it("should reject invalid service data", async () => {
			const { createService } = await import("@/app/admin/actions");

			await expect(
				createService({
					name: "",
					duration: -1,
					price: -100,
				}),
			).rejects.toThrow();
		});
	});

	describe("updateAppointmentStatus()", () => {
		it("should require authentication", async () => {
			// Without auth session, the action should throw
			const { updateAppointmentStatus } = await import("@/app/admin/actions");

			await expect(
				updateAppointmentStatus("some-id", "CONFIRMED"),
			).rejects.toThrow();
		});
	});
});

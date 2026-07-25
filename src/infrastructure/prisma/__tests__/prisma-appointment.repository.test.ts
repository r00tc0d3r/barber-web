/**
 * Integration tests for PrismaAppointmentRepository.
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

describeIfDb("PrismaAppointmentRepository", () => {
	let barberId: string;
	let serviceId: string;
	let repository: import("@/infrastructure/prisma/prisma-appointment.repository").PrismaAppointmentRepository;

	beforeAll(async () => {
		const data = await createTestBarberAndService();
		barberId = data.barberId;
		serviceId = data.serviceId;

		const { PrismaAppointmentRepository } = await import(
			"@/infrastructure/prisma/prisma-appointment.repository"
		);
		repository = new PrismaAppointmentRepository();
	});

	afterAll(async () => {
		await cleanupTestData({ barberId, serviceId });
	});

	// ── create ──────────────────────────────────────────────────────

	describe("create()", () => {
		it("should create an appointment with valid data", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			const endDate = new Date(date);
			endDate.setMinutes(endDate.getMinutes() + 30);

			const result = await repository.create(
				{
					barberId:
						barberId as import("@/domain/appointment/value-objects").BarberId,
					serviceId,
					userId: null,
					contact: {
						clientName: "Integration Test",
						clientPhone: "+5491123456789",
						clientEmail: "integration@test.com",
					},
					dateTime: { start: date, end: endDate },
				},
				30,
			);

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.clientName).toBe("Integration Test");
			expect(result.value.status).toBe("PENDING");
			expect(result.value.cancelToken).toBeDefined();

			// Clean up
			await (await import("@/lib/prisma")).prisma.appointment.delete({
				where: { id: result.value.id },
			});
		});
	});

	// ── findById ────────────────────────────────────────────────────

	describe("findById()", () => {
		it("should find an appointment by ID", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			const endDate = new Date(date);
			endDate.setMinutes(endDate.getMinutes() + 30);

			const createResult = await repository.create(
				{
					barberId:
						barberId as import("@/domain/appointment/value-objects").BarberId,
					serviceId,
					userId: null,
					contact: { clientName: "Find Test", clientPhone: "+5491123456789" },
					dateTime: { start: date, end: endDate },
				},
				30,
			);

			expect(createResult.ok).toBe(true);
			if (!createResult.ok) return;

			const findResult = await repository.findById(createResult.value.id);
			expect(findResult.ok).toBe(true);
			if (!findResult.ok) return;
			expect(findResult.value).not.toBeNull();
			expect(findResult.value!.id).toBe(createResult.value.id);

			await (await import("@/lib/prisma")).prisma.appointment.delete({
				where: { id: createResult.value.id },
			});
		});

		it("should return null for non-existent ID", async () => {
			const nonExistentId =
				"nonexistent" as import("@/domain/appointment/value-objects").AppointmentId;
			const result = await repository.findById(nonExistentId);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value).toBeNull();
		});
	});

	// ── findByBarberAndDate ─────────────────────────────────────────

	describe("findByBarberAndDate()", () => {
		it("should return appointments for a barber on a specific date", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 14);
			const dateStr = date.toISOString().split("T")[0];
			const endDate = new Date(date);
			endDate.setMinutes(endDate.getMinutes() + 30);

			const createResult = await repository.create(
				{
					barberId:
						barberId as import("@/domain/appointment/value-objects").BarberId,
					serviceId,
					userId: null,
					contact: { clientName: "Date Test", clientPhone: "+5491123456789" },
					dateTime: { start: date, end: endDate },
				},
				30,
			);

			expect(createResult.ok).toBe(true);
			if (!createResult.ok) return;

			const appointments = await repository.findByBarberAndDate(
				barberId as import("@/domain/appointment/value-objects").BarberId,
				dateStr,
			);
			expect(appointments.length).toBeGreaterThanOrEqual(1);
			expect(appointments.some((a) => a.id === createResult.value.id)).toBe(
				true,
			);

			await (await import("@/lib/prisma")).prisma.appointment.delete({
				where: { id: createResult.value.id },
			});
		});
	});

	// ── updateStatus ────────────────────────────────────────────────

	describe("updateStatus()", () => {
		it("should update appointment status", async () => {
			const date = new Date();
			date.setDate(date.getDate() + 7);
			const endDate = new Date(date);
			endDate.setMinutes(endDate.getMinutes() + 30);

			const createResult = await repository.create(
				{
					barberId:
						barberId as import("@/domain/appointment/value-objects").BarberId,
					serviceId,
					userId: null,
					contact: { clientName: "Status Test", clientPhone: "+5491123456789" },
					dateTime: { start: date, end: endDate },
				},
				30,
			);

			expect(createResult.ok).toBe(true);
			if (!createResult.ok) return;

			const confirmedStatus =
				"CONFIRMED" as import("@/domain/appointment/value-objects").AppointmentStatus;
			const updateResult = await repository.updateStatus(
				createResult.value.id,
				confirmedStatus,
			);
			expect(updateResult.ok).toBe(true);
			if (!updateResult.ok) return;
			expect(updateResult.value.status).toBe("CONFIRMED");

			await (await import("@/lib/prisma")).prisma.appointment.delete({
				where: { id: createResult.value.id },
			});
		});
	});

	// ── count ───────────────────────────────────────────────────────

	describe("count()", () => {
		it("should return the number of appointments", async () => {
			const count = await repository.count();
			expect(typeof count).toBe("number");
			expect(count).toBeGreaterThanOrEqual(0);
		});
	});
});

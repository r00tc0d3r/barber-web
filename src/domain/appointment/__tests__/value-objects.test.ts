/**
 * Unit tests for appointment domain value objects.
 *
 * Covers createAppointmentDateTime, canTransition, and branded type constructors.
 */

import { describe, it, expect } from "vitest";
import {
	createAppointmentDateTime,
	canTransition,
	AppointmentDateSchema,
} from "../value-objects";

// ── Appointment Date/Time ────────────────────────────────────────

describe("createAppointmentDateTime", () => {
	it("should create valid date/time for a future appointment", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);
		const dateStr = futureDate.toISOString().split("T")[0];

		const result = createAppointmentDateTime(dateStr, "10:00", 30);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.start.getHours()).toBe(10);
		expect(result.value.start.getMinutes()).toBe(0);
		expect(result.value.end.getHours()).toBe(10);
		expect(result.value.end.getMinutes()).toBe(30);
		expect(result.value.timezone).toBe("America/Argentina/Buenos_Aires");
	});

	it("should create date/time with custom timezone", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);
		const dateStr = futureDate.toISOString().split("T")[0];

		const result = createAppointmentDateTime(
			dateStr,
			"14:00",
			60,
			"America/New_York",
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.timezone).toBe("America/New_York");
	});

	it("should calculate end time correctly for different durations", () => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);
		const dateStr = futureDate.toISOString().split("T")[0];

		const result = createAppointmentDateTime(dateStr, "09:00", 90);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.start.getHours()).toBe(9);
		expect(result.value.start.getMinutes()).toBe(0);
		expect(result.value.end.getHours()).toBe(10);
		expect(result.value.end.getMinutes()).toBe(30);
	});
});

// ── Status Transitions ───────────────────────────────────────────

describe("canTransition", () => {
	describe("from PENDING", () => {
		it("should allow transition to CONFIRMED", () => {
			expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
		});

		it("should allow transition to CANCELLED", () => {
			expect(canTransition("PENDING", "CANCELLED")).toBe(true);
		});

		it("should NOT allow transition to IN_PROGRESS", () => {
			expect(canTransition("PENDING", "IN_PROGRESS")).toBe(false);
		});

		it("should NOT allow transition to COMPLETED", () => {
			expect(canTransition("PENDING", "COMPLETED")).toBe(false);
		});

		it("should NOT allow transition to NO_SHOW", () => {
			expect(canTransition("PENDING", "NO_SHOW")).toBe(false);
		});
	});

	describe("from CONFIRMED", () => {
		it("should allow transition to IN_PROGRESS", () => {
			expect(canTransition("CONFIRMED", "IN_PROGRESS")).toBe(true);
		});

		it("should allow transition to CANCELLED", () => {
			expect(canTransition("CONFIRMED", "CANCELLED")).toBe(true);
		});

		it("should NOT allow transition to PENDING", () => {
			expect(canTransition("CONFIRMED", "PENDING")).toBe(false);
		});

		it("should NOT allow transition to COMPLETED", () => {
			expect(canTransition("CONFIRMED", "COMPLETED")).toBe(false);
		});
	});

	describe("from IN_PROGRESS", () => {
		it("should allow transition to COMPLETED", () => {
			expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
		});

		it("should allow transition to NO_SHOW", () => {
			expect(canTransition("IN_PROGRESS", "NO_SHOW")).toBe(true);
		});

		it("should NOT allow transition to PENDING", () => {
			expect(canTransition("IN_PROGRESS", "PENDING")).toBe(false);
		});

		it("should NOT allow transition to CANCELLED", () => {
			expect(canTransition("IN_PROGRESS", "CANCELLED")).toBe(false);
		});
	});

	describe("from terminal states", () => {
		it.each(["COMPLETED", "CANCELLED", "NO_SHOW"] as const)(
			"should reject all transitions from %s",
			(state) => {
				const transitions = [
					"PENDING",
					"CONFIRMED",
					"IN_PROGRESS",
					"COMPLETED",
					"CANCELLED",
					"NO_SHOW",
				] as const;

				for (const target of transitions) {
					expect(canTransition(state, target)).toBe(false);
				}
			},
		);
	});
});

// ── Validation Schemas ───────────────────────────────────────────

describe("AppointmentDateSchema", () => {
	it("should accept valid YYYY-MM-DD format", () => {
		const validDates = [
			{ date: "2026-08-15", time: "10:00" },
			{ date: "2024-01-01", time: "00:00" },
			{ date: "2025-12-31", time: "23:59" },
		];

		for (const input of validDates) {
			const result = AppointmentDateSchema.safeParse(input);
			expect(result.success).toBe(true);
		}
	});

	it("should reject invalid date formats", () => {
		const invalidDates = [
			{ date: "15-08-2026", time: "10:00" },
			{ date: "2026/08/15", time: "10:00" },
			{ date: "not-a-date", time: "10:00" },
			{ date: "", time: "10:00" },
		];

		for (const input of invalidDates) {
			const result = AppointmentDateSchema.safeParse(input);
			expect(result.success).toBe(false);
		}
	});

	it("should reject invalid time formats", () => {
		const invalidTimes = [
			{ date: "2026-08-15", time: "10-00" },
			{ date: "2026-08-15", time: "1000" },
			{ date: "2026-08-15", time: "" },
			{ date: "2026-08-15", time: "10:0" },
			{ date: "2026-08-15", time: "1:00" },
		];

		for (const input of invalidTimes) {
			const result = AppointmentDateSchema.safeParse(input);
			expect(result.success).toBe(false);
		}
	});

	it("should default timezone to America/Argentina/Buenos_Aires", () => {
		const result = AppointmentDateSchema.safeParse({
			date: "2026-08-15",
			time: "10:00",
		});

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.timezone).toBe("America/Argentina/Buenos_Aires");
	});
});

/**
 * Unit tests for the Appointment entity.
 *
 * Covers factory method, invariants, status transitions,
 * and domain operations.
 */

import { describe, it, expect } from "vitest";
import { Appointment } from "../appointment";
import {
	generateAppointmentId,
	generateCancelToken,
	type AppointmentStatus,
	type BarberId,
	type ServiceId,
} from "../value-objects";

// ── Helpers ──────────────────────────────────────────────────────

function makeBarberId(): BarberId {
	return generateAppointmentId() as unknown as BarberId;
}

function makeServiceId(): ServiceId {
	return generateAppointmentId() as unknown as ServiceId;
}

function makeValidData(
	overrides: Partial<Parameters<typeof Appointment.create>[0]> = {},
) {
	return {
		id: generateAppointmentId(),
		barberId: makeBarberId(),
		serviceId: makeServiceId(),
		userId: null,
		clientName: "Juan Pérez",
		clientPhone: "+5491123456789",
		clientEmail: "juan@example.com",
		date: new Date("2026-08-15T10:00:00.000Z"),
		endTime: new Date("2026-08-15T10:30:00.000Z"),
		status: "PENDING" as AppointmentStatus,
		notes: null,
		cancelToken: generateCancelToken(),
		googleCalendarEventId: null,
		createdAt: new Date("2026-08-10T00:00:00.000Z"),
		updatedAt: new Date("2026-08-10T00:00:00.000Z"),
		...overrides,
	};
}

// ── Tests ────────────────────────────────────────────────────────

describe("Appointment entity", () => {
	describe("create (factory method)", () => {
		it("should create an appointment with valid data", () => {
			const data = makeValidData();
			const result = Appointment.create(data);

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.id).toBe(data.id);
			expect(result.value.clientName).toBe("Juan Pérez");
			expect(result.value.status).toBe("PENDING");
		});

		it("should fail when endTime is before startTime", () => {
			const data = makeValidData({
				date: new Date("2026-08-15T10:00:00.000Z"),
				endTime: new Date("2026-08-15T09:00:00.000Z"),
			});

			const result = Appointment.create(data);
			expect(result.ok).toBe(false);
		});

		it("should fail when endTime equals startTime", () => {
			const data = makeValidData({
				date: new Date("2026-08-15T10:00:00.000Z"),
				endTime: new Date("2026-08-15T10:00:00.000Z"),
			});

			const result = Appointment.create(data);
			expect(result.ok).toBe(false);
		});
	});

	describe("getters", () => {
		it("should expose all properties via getters", () => {
			const data = makeValidData();
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const apt = result.value;
			expect(apt.id).toBe(data.id);
			expect(apt.barberId).toBe(data.barberId);
			expect(apt.serviceId).toBe(data.serviceId);
			expect(apt.clientName).toBe("Juan Pérez");
			expect(apt.clientPhone).toBe("+5491123456789");
			expect(apt.clientEmail).toBe("juan@example.com");
			expect(apt.date).toEqual(data.date);
			expect(apt.endTime).toEqual(data.endTime);
			expect(apt.status).toBe("PENDING");
			expect(apt.notes).toBeNull();
			expect(apt.cancelToken).toBe(data.cancelToken);
			expect(apt.googleCalendarEventId).toBeNull();
			expect(apt.createdAt).toEqual(data.createdAt);
			expect(apt.updatedAt).toEqual(data.updatedAt);
		});

		it("should allow null userId", () => {
			const data = makeValidData({ userId: null });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.userId).toBeNull();
		});

		it("should allow null clientEmail", () => {
			const data = makeValidData({ clientEmail: null });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.clientEmail).toBeNull();
		});
	});

	describe("isCancellable", () => {
		it.each(["PENDING", "CONFIRMED"] as AppointmentStatus[])(
			"should be cancellable when status is %s",
			(status) => {
				const data = makeValidData({ status });
				const result = Appointment.create(data);
				expect(result.ok).toBe(true);
				if (!result.ok) return;
				expect(result.value.isCancellable).toBe(true);
			},
		);

		it.each([
			"IN_PROGRESS",
			"COMPLETED",
			"CANCELLED",
			"NO_SHOW",
		] as AppointmentStatus[])(
			"should NOT be cancellable when status is %s",
			(status) => {
				const data = makeValidData({ status });
				const result = Appointment.create(data);
				expect(result.ok).toBe(true);
				if (!result.ok) return;
				expect(result.value.isCancellable).toBe(false);
			},
		);
	});

	describe("isPast", () => {
		it("should be true when endTime is in the past", () => {
			const data = makeValidData({
				date: new Date("2020-01-01T09:00:00.000Z"),
				endTime: new Date("2020-01-01T09:30:00.000Z"),
			});
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.isPast).toBe(true);
		});

		it("should be false when endTime is in the future", () => {
			const farFuture = new Date();
			farFuture.setFullYear(farFuture.getFullYear() + 10);

			const data = makeValidData({
				endTime: farFuture,
			});
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.isPast).toBe(false);
		});
	});

	describe("isActive", () => {
		it("should be true when current time is between start and end", () => {
			const now = new Date();
			const data = makeValidData({
				date: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
				endTime: new Date(now.getTime() + 25 * 60 * 1000), // 25 min from now
			});
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.isActive).toBe(true);
		});

		it("should be false when appointment hasn't started", () => {
			const future = new Date();
			future.setFullYear(future.getFullYear() + 1);

			const data = makeValidData({
				date: future,
				endTime: new Date(future.getTime() + 30 * 60 * 1000),
			});
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.isActive).toBe(false);
		});
	});

	describe("durationMinutes", () => {
		it("should calculate duration correctly", () => {
			const data = makeValidData({
				date: new Date("2026-08-15T10:00:00.000Z"),
				endTime: new Date("2026-08-15T11:30:00.000Z"),
			});
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.durationMinutes).toBe(90);
		});
	});

	describe("cancel()", () => {
		it("should cancel a PENDING appointment", () => {
			const data = makeValidData({ status: "PENDING" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const cancelResult = result.value.cancel();
			expect(cancelResult.ok).toBe(true);
			if (!cancelResult.ok) return;
			expect(cancelResult.value.status).toBe("CANCELLED");
		});

		it("should cancel a CONFIRMED appointment", () => {
			const data = makeValidData({ status: "CONFIRMED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const cancelResult = result.value.cancel();
			expect(cancelResult.ok).toBe(true);
			if (!cancelResult.ok) return;
			expect(cancelResult.value.status).toBe("CANCELLED");
		});

		it("should fail when cancelling an already CANCELLED appointment", () => {
			const data = makeValidData({ status: "CANCELLED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const cancelResult = result.value.cancel();
			expect(cancelResult.ok).toBe(false);
		});

		it("should fail when cancelling a COMPLETED appointment", () => {
			const data = makeValidData({ status: "COMPLETED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const cancelResult = result.value.cancel();
			expect(cancelResult.ok).toBe(false);
		});
	});

	describe("confirm()", () => {
		it("should confirm a PENDING appointment", () => {
			const data = makeValidData({ status: "PENDING" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const confirmResult = result.value.confirm();
			expect(confirmResult.ok).toBe(true);
			if (!confirmResult.ok) return;
			expect(confirmResult.value.status).toBe("CONFIRMED");
		});

		it("should fail when confirming from COMPLETED", () => {
			const data = makeValidData({ status: "COMPLETED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const confirmResult = result.value.confirm();
			expect(confirmResult.ok).toBe(false);
		});
	});

	describe("start()", () => {
		it("should start a CONFIRMED appointment", () => {
			const data = makeValidData({ status: "CONFIRMED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const startResult = result.value.start();
			expect(startResult.ok).toBe(true);
			if (!startResult.ok) return;
			expect(startResult.value.status).toBe("IN_PROGRESS");
		});

		it("should fail when starting from PENDING", () => {
			const data = makeValidData({ status: "PENDING" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const startResult = result.value.start();
			expect(startResult.ok).toBe(false);
		});
	});

	describe("complete()", () => {
		it("should complete an IN_PROGRESS appointment", () => {
			const data = makeValidData({ status: "IN_PROGRESS" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const completeResult = result.value.complete();
			expect(completeResult.ok).toBe(true);
			if (!completeResult.ok) return;
			expect(completeResult.value.status).toBe("COMPLETED");
		});

		it("should fail when completing from PENDING", () => {
			const data = makeValidData({ status: "PENDING" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const completeResult = result.value.complete();
			expect(completeResult.ok).toBe(false);
		});
	});

	describe("markNoShow()", () => {
		it("should mark IN_PROGRESS as NO_SHOW", () => {
			const data = makeValidData({ status: "IN_PROGRESS" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const noShowResult = result.value.markNoShow();
			expect(noShowResult.ok).toBe(true);
			if (!noShowResult.ok) return;
			expect(noShowResult.value.status).toBe("NO_SHOW");
		});

		it("should fail when marking COMPLETED as NO_SHOW", () => {
			const data = makeValidData({ status: "COMPLETED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const noShowResult = result.value.markNoShow();
			expect(noShowResult.ok).toBe(false);
		});
	});

	describe("transitionTo()", () => {
		it("should allow valid transitions", () => {
			const data = makeValidData({ status: "PENDING" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const transitionResult = result.value.transitionTo("CONFIRMED");
			expect(transitionResult.ok).toBe(true);
		});

		it("should reject invalid transitions", () => {
			const data = makeValidData({ status: "PENDING" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const transitionResult = result.value.transitionTo("COMPLETED");
			expect(transitionResult.ok).toBe(false);
		});

		it("should reject transitions from terminal states", () => {
			const data = makeValidData({ status: "COMPLETED" });
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const transitionResult = result.value.transitionTo("PENDING");
			expect(transitionResult.ok).toBe(false);
		});
	});

	describe("toJSON()", () => {
		it("should return all data fields", () => {
			const data = makeValidData();
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const json = result.value.toJSON();
			expect(json.id).toBe(data.id);
			expect(json.clientName).toBe("Juan Pérez");
			expect(json.status).toBe("PENDING");
			expect(json.cancelToken).toBe(data.cancelToken);
		});
	});

	describe("toSummary()", () => {
		it("should return a summary with key fields", () => {
			const data = makeValidData();
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const summary = result.value.toSummary();
			expect(summary.id).toBe(data.id);
			expect(summary.clientName).toBe("Juan Pérez");
			expect(summary.status).toBe("PENDING");
			// Summary should not include sensitive fields
			expect(summary).not.toHaveProperty("cancelToken");
			expect(summary).not.toHaveProperty("clientPhone");
		});
	});

	describe("withGoogleCalendarEventId()", () => {
		it("should set the Google Calendar event ID", () => {
			const data = makeValidData();
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const updated = result.value.withGoogleCalendarEventId("cal-event-123");
			expect(updated.googleCalendarEventId).toBe("cal-event-123");
			// Original should be unchanged (immutability)
			expect(result.value.googleCalendarEventId).toBeNull();
		});
	});

	describe("withNotes()", () => {
		it("should set notes on the appointment", () => {
			const data = makeValidData();
			const result = Appointment.create(data);
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const updated = result.value.withNotes("Cliente prefiere tijera");
			expect(updated.notes).toBe("Cliente prefiere tijera");
		});
	});
});

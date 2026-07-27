import { describe, it, expect } from "vitest";
import { bookingReducer, initialState } from "../booking-reducer";
import type { BookingState } from "../types";
import type { BookingBarber, BookingService } from "@/types/models";

// ── Fixtures ───────────────────────────────────────────

const mockBarber: BookingBarber = {
	id: "barber-1",
	name: "Carlos",
	color: "#3B82F6",
	specialties: "Degradados",
	services: [
		{
			barberId: "barber-1",
			serviceId: "service-1",
			service: { id: "service-1", name: "Corte" },
		},
	],
};

const mockService: BookingService = {
	id: "service-1",
	name: "Corte",
	duration: 30,
	price: 5000,
};

// ── Tests ──────────────────────────────────────────────

describe("bookingReducer", () => {
	describe("SELECT_BARBER", () => {
		it("sets barber and moves to service step", () => {
			const result = bookingReducer(initialState, {
				type: "SELECT_BARBER",
				barber: mockBarber,
			});

			expect(result.step).toBe("service");
			expect(result.barber).toEqual(mockBarber);
		});

		it("clears service, date, time, and slots", () => {
			const stateWithSelection: BookingState = {
				...initialState,
				service: mockService,
				date: "2026-08-01",
				time: "10:00",
				slots: [{ time: "10:00", available: true }],
			};

			const result = bookingReducer(stateWithSelection, {
				type: "SELECT_BARBER",
				barber: mockBarber,
			});

			expect(result.service).toBeNull();
			expect(result.date).toBe("");
			expect(result.time).toBe("");
			expect(result.slots).toEqual([]);
		});
	});

	describe("SELECT_SERVICE", () => {
		it("sets service and moves to datetime step", () => {
			const state: BookingState = {
				...initialState,
				step: "service",
				barber: mockBarber,
			};

			const result = bookingReducer(state, {
				type: "SELECT_SERVICE",
				service: mockService,
			});

			expect(result.step).toBe("datetime");
			expect(result.service).toEqual(mockService);
		});

		it("clears date, time, and slots", () => {
			const state: BookingState = {
				...initialState,
				step: "service",
				barber: mockBarber,
				date: "2026-08-01",
				time: "10:00",
				slots: [{ time: "10:00", available: true }],
			};

			const result = bookingReducer(state, {
				type: "SELECT_SERVICE",
				service: mockService,
			});

			expect(result.date).toBe("");
			expect(result.time).toBe("");
			expect(result.slots).toEqual([]);
		});
	});

	describe("SET_DATE", () => {
		it("sets date and clears time and slots", () => {
			const state: BookingState = {
				...initialState,
				step: "datetime",
				time: "10:00",
				slots: [{ time: "10:00", available: true }],
			};

			const result = bookingReducer(state, {
				type: "SET_DATE",
				date: "2026-08-01",
			});

			expect(result.date).toBe("2026-08-01");
			expect(result.time).toBe("");
			expect(result.slots).toEqual([]);
		});
	});

	describe("SET_SLOTS", () => {
		it("sets slots and clears loadingSlots", () => {
			const state: BookingState = {
				...initialState,
				loadingSlots: true,
			};

			const result = bookingReducer(state, {
				type: "SET_SLOTS",
				slots: [
					{ time: "09:00", available: true },
					{ time: "09:30", available: false },
				],
			});

			expect(result.slots).toHaveLength(2);
			expect(result.loadingSlots).toBe(false);
		});
	});

	describe("LOADING_SLOTS", () => {
		it("sets loadingSlots flag", () => {
			const result = bookingReducer(initialState, {
				type: "LOADING_SLOTS",
				loading: true,
			});

			expect(result.loadingSlots).toBe(true);
		});
	});

	describe("SELECT_TIME", () => {
		it("sets time and moves to info step", () => {
			const state: BookingState = {
				...initialState,
				step: "datetime",
			};

			const result = bookingReducer(state, {
				type: "SELECT_TIME",
				time: "10:00",
			});

			expect(result.time).toBe("10:00");
			expect(result.step).toBe("info");
		});
	});

	describe("SET_FIELD", () => {
		it("sets clientName", () => {
			const result = bookingReducer(initialState, {
				type: "SET_FIELD",
				field: "clientName",
				value: "Juan",
			});

			expect(result.clientName).toBe("Juan");
		});

		it("sets clientPhone", () => {
			const result = bookingReducer(initialState, {
				type: "SET_FIELD",
				field: "clientPhone",
				value: "11 5555 1234",
			});

			expect(result.clientPhone).toBe("11 5555 1234");
		});

		it("sets clientEmail", () => {
			const result = bookingReducer(initialState, {
				type: "SET_FIELD",
				field: "clientEmail",
				value: "juan@example.com",
			});

			expect(result.clientEmail).toBe("juan@example.com");
		});

		it("does not touch other fields", () => {
			const state: BookingState = {
				...initialState,
				clientName: "Carlos",
				clientPhone: "11 1111 1111",
			};

			const result = bookingReducer(state, {
				type: "SET_FIELD",
				field: "clientName",
				value: "Juan",
			});

			expect(result.clientName).toBe("Juan");
			expect(result.clientPhone).toBe("11 1111 1111");
		});
	});

	describe("SUBMITTING", () => {
		it("sets submitting flag", () => {
			const result = bookingReducer(initialState, {
				type: "SUBMITTING",
				submitting: true,
			});

			expect(result.submitting).toBe(true);
		});
	});

	describe("SET_ERROR", () => {
		it("sets error message", () => {
			const result = bookingReducer(initialState, {
				type: "SET_ERROR",
				error: "Something went wrong",
			});

			expect(result.error).toBe("Something went wrong");
		});

		it("clears error when null", () => {
			const state: BookingState = {
				...initialState,
				error: "Previous error",
			};

			const result = bookingReducer(state, {
				type: "SET_ERROR",
				error: null,
			});

			expect(result.error).toBeNull();
		});
	});

	describe("SUCCESS", () => {
		it("sets result and moves to done step", () => {
			const state: BookingState = {
				...initialState,
				submitting: true,
			};

			const result = bookingReducer(state, {
				type: "SUCCESS",
				result: {
					id: "apt-1",
					cancelToken: "token-1",
					date: "2026-08-01",
					time: "10:00",
				},
			});

			expect(result.step).toBe("done");
			expect(result.result).toEqual({
				id: "apt-1",
				cancelToken: "token-1",
				date: "2026-08-01",
				time: "10:00",
			});
			expect(result.submitting).toBe(false);
		});
	});

	describe("GO_BACK", () => {
		it("moves to specified step", () => {
			const state: BookingState = {
				...initialState,
				step: "service",
				error: "Some error",
			};

			const result = bookingReducer(state, {
				type: "GO_BACK",
				step: "barber",
			});

			expect(result.step).toBe("barber");
		});

		it("clears error", () => {
			const state: BookingState = {
				...initialState,
				step: "service",
				error: "Some error",
			};

			const result = bookingReducer(state, {
				type: "GO_BACK",
				step: "barber",
			});

			expect(result.error).toBeNull();
		});
	});

	describe("RESET", () => {
		it("returns to initial state", () => {
			const dirtyState: BookingState = {
				step: "info",
				barber: mockBarber,
				service: mockService,
				date: "2026-08-01",
				time: "10:00",
				slots: [{ time: "10:00", available: true }],
				loadingSlots: false,
				clientName: "Juan",
				clientPhone: "11 5555 1234",
				clientEmail: "juan@example.com",
				error: "Some error",
				submitting: true,
				result: null,
			};

			const result = bookingReducer(dirtyState, { type: "RESET" });

			expect(result).toEqual(initialState);
		});
	});

	describe("initialState", () => {
		it("has correct default values", () => {
			expect(initialState).toEqual({
				step: "barber",
				barber: null,
				service: null,
				date: "",
				time: "",
				slots: [],
				loadingSlots: false,
				clientName: "",
				clientPhone: "",
				clientEmail: "",
				error: null,
				submitting: false,
				result: null,
			});
		});
	});
});

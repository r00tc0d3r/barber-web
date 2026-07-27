// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookingWizard } from "../hooks/use-booking-wizard";
import type { BookingBarber, BookingService } from "@/types/models";

// Mock server actions
vi.mock("../actions", () => ({
	getAvailableSlots: vi.fn().mockResolvedValue([]),
	createAppointment: vi.fn(),
}));

// ── Fixtures ───────────────────────────────────────────

const mockBarbers: BookingBarber[] = [
	{
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
	},
	{
		id: "barber-2",
		name: "Luis",
		color: "#10B981",
		specialties: "Barba",
		services: [
			{
				barberId: "barber-2",
				serviceId: "service-2",
				service: { id: "service-2", name: "Barba" },
			},
		],
	},
];

const mockServices: BookingService[] = [
	{ id: "service-1", name: "Corte", duration: 30, price: 5000 },
	{ id: "service-2", name: "Barba", duration: 20, price: 3000 },
];

// ── Tests ──────────────────────────────────────────────

describe("useBookingWizard", () => {
	it("initializes with barber step", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		expect(result.current.state.step).toBe("barber");
		expect(result.current.currentStepIndex).toBe(0);
		expect(result.current.canGoBack).toBe(false);
	});

	it("canGoBack is false on first step", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		expect(result.current.canGoBack).toBe(false);
	});

	it("canGoBack is true after first step", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		act(() => {
			result.current.dispatch({
				type: "SELECT_BARBER",
				barber: mockBarbers[0],
			});
		});

		expect(result.current.state.step).toBe("service");
		expect(result.current.canGoBack).toBe(true);
		expect(result.current.currentStepIndex).toBe(1);
	});

	it("advances through all steps", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		// Step 1: Barber
		act(() => {
			result.current.dispatch({
				type: "SELECT_BARBER",
				barber: mockBarbers[0],
			});
		});
		expect(result.current.state.step).toBe("service");
		expect(result.current.currentStepIndex).toBe(1);

		// Step 2: Service
		act(() => {
			result.current.dispatch({
				type: "SELECT_SERVICE",
				service: mockServices[0],
			});
		});
		expect(result.current.state.step).toBe("datetime");
		expect(result.current.currentStepIndex).toBe(2);

		// Step 3: DateTime
		act(() => {
			result.current.dispatch({ type: "SET_DATE", date: "2026-08-01" });
		});
		act(() => {
			result.current.dispatch({ type: "SELECT_TIME", time: "10:00" });
		});
		expect(result.current.state.step).toBe("info");
		expect(result.current.currentStepIndex).toBe(3);
	});

	it("goes back to previous step", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		// Advance to service
		act(() => {
			result.current.dispatch({
				type: "SELECT_BARBER",
				barber: mockBarbers[0],
			});
		});
		expect(result.current.state.step).toBe("service");

		// Go back
		act(() => {
			result.current.dispatch({ type: "GO_BACK", step: "barber" });
		});
		expect(result.current.state.step).toBe("barber");
		expect(result.current.currentStepIndex).toBe(0);
	});

	it("resets to initial state", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		// Advance to service
		act(() => {
			result.current.dispatch({
				type: "SELECT_BARBER",
				barber: mockBarbers[0],
			});
		});

		// Reset
		act(() => {
			result.current.dispatch({ type: "RESET" });
		});

		expect(result.current.state.step).toBe("barber");
		expect(result.current.state.barber).toBeNull();
		expect(result.current.currentStepIndex).toBe(0);
		expect(result.current.canGoBack).toBe(false);
	});

	it("canGoBack is false on done step", () => {
		const { result } = renderHook(() =>
			useBookingWizard(mockBarbers, mockServices, "user-1"),
		);

		// Go to done
		act(() => {
			result.current.dispatch({
				type: "SELECT_BARBER",
				barber: mockBarbers[0],
			});
		});
		act(() => {
			result.current.dispatch({
				type: "SELECT_SERVICE",
				service: mockServices[0],
			});
		});
		act(() => {
			result.current.dispatch({ type: "SET_DATE", date: "2026-08-01" });
		});
		act(() => {
			result.current.dispatch({ type: "SELECT_TIME", time: "10:00" });
		});
		act(() => {
			result.current.dispatch({
				type: "SUCCESS",
				result: {
					id: "apt-1",
					cancelToken: "t",
					date: "2026-08-01",
					time: "10:00",
				},
			});
		});

		expect(result.current.state.step).toBe("done");
		expect(result.current.canGoBack).toBe(false);
	});
});

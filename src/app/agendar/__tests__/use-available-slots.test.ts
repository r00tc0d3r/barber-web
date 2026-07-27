// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAvailableSlots } from "../hooks/use-available-slots";

// Mock server action
vi.mock("../actions", () => ({
	getAvailableSlots: vi.fn(),
}));

import { getAvailableSlots } from "../actions";
const mockGetAvailableSlots = vi.mocked(getAvailableSlots);

// ── Tests ──────────────────────────────────────────────

describe("useAvailableSlots", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty slots initially", () => {
		const { result } = renderHook(() => useAvailableSlots());

		expect(result.current.slots).toEqual([]);
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
	});

	it("fetches slots and updates state", async () => {
		const mockSlots = [
			{ time: "09:00", available: true },
			{ time: "09:30", available: false },
			{ time: "10:00", available: true },
		];
		mockGetAvailableSlots.mockResolvedValue(mockSlots);

		const { result } = renderHook(() => useAvailableSlots());

		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		expect(result.current.slots).toEqual(mockSlots);
		expect(result.current.loading).toBe(false);
		expect(result.current.error).toBeNull();
		expect(mockGetAvailableSlots).toHaveBeenCalledWith(
			"barber-1",
			"service-1",
			"2026-08-01",
		);
	});

	it("sets loading to true while fetching", async () => {
		let resolvePromise!: (
			value: Awaited<ReturnType<typeof getAvailableSlots>>,
		) => void;
		const promise = new Promise<Awaited<ReturnType<typeof getAvailableSlots>>>(
			(resolve) => {
				resolvePromise = resolve;
			},
		);
		mockGetAvailableSlots.mockReturnValue(promise);

		const { result } = renderHook(() => useAvailableSlots());

		act(() => {
			result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		expect(result.current.loading).toBe(true);

		await act(async () => {
			resolvePromise!([]);
		});

		expect(result.current.loading).toBe(false);
	});

	it("sets error on failure", async () => {
		mockGetAvailableSlots.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => useAvailableSlots());

		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		expect(result.current.error).toBe("Error al cargar horarios");
		expect(result.current.loading).toBe(false);
		expect(result.current.slots).toEqual([]);
	});

	it("caches slots by key", async () => {
		const mockSlots = [{ time: "09:00", available: true }];
		mockGetAvailableSlots.mockResolvedValue(mockSlots);

		const { result } = renderHook(() => useAvailableSlots());

		// First fetch
		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		expect(mockGetAvailableSlots).toHaveBeenCalledTimes(1);

		// Second fetch with same key — should use cache
		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		expect(mockGetAvailableSlots).toHaveBeenCalledTimes(1);
		expect(result.current.slots).toEqual(mockSlots);
	});

	it("fetches fresh slots for different dates", async () => {
		const slots1 = [{ time: "09:00", available: true }];
		const slots2 = [{ time: "14:00", available: true }];
		mockGetAvailableSlots
			.mockResolvedValueOnce(slots1)
			.mockResolvedValueOnce(slots2);

		const { result } = renderHook(() => useAvailableSlots());

		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-02");
		});

		expect(mockGetAvailableSlots).toHaveBeenCalledTimes(2);
		expect(result.current.slots).toEqual(slots2);
	});

	it("fetches fresh slots for different barbers", async () => {
		const slots1 = [{ time: "09:00", available: true }];
		const slots2 = [{ time: "10:00", available: true }];
		mockGetAvailableSlots
			.mockResolvedValueOnce(slots1)
			.mockResolvedValueOnce(slots2);

		const { result } = renderHook(() => useAvailableSlots());

		await act(async () => {
			await result.current.fetchSlots("barber-1", "service-1", "2026-08-01");
		});

		await act(async () => {
			await result.current.fetchSlots("barber-2", "service-1", "2026-08-01");
		});

		expect(mockGetAvailableSlots).toHaveBeenCalledTimes(2);
		expect(result.current.slots).toEqual(slots2);
	});
});

"use client";

import { useState, useCallback, useRef } from "react";
import { getAvailableSlots } from "../actions";
import type { Slot } from "@/types/models";

type UseAvailableSlotsReturn = {
	slots: Slot[];
	loading: boolean;
	error: string | null;
	fetchSlots: (
		barberId: string,
		serviceId: string,
		date: string,
	) => Promise<void>;
};

export function useAvailableSlots(): UseAvailableSlotsReturn {
	const [slots, setSlots] = useState<Slot[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const cache = useRef(new Map<string, Slot[]>());

	const fetchSlots = useCallback(
		async (barberId: string, serviceId: string, date: string) => {
			const key = `${barberId}:${serviceId}:${date}`;

			// Check cache
			const cached = cache.current.get(key);
			if (cached) {
				setSlots(cached);
				return;
			}

			setLoading(true);
			setError(null);

			try {
				const result = await getAvailableSlots(barberId, serviceId, date);
				cache.current.set(key, result);
				setSlots(result);
			} catch {
				setError("Error al cargar horarios");
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return { slots, loading, error, fetchSlots };
}

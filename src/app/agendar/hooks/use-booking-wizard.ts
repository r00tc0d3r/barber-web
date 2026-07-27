"use client";

import { useReducer, useEffect } from "react";
import { bookingReducer, initialState } from "../booking-reducer";
import { useAvailableSlots } from "./use-available-slots";
import { PROGRESS_STEPS } from "../types";
import type { BookingAction } from "../types";
import type { BookingBarber, BookingService } from "@/types/models";

type UseBookingWizardReturn = {
	state: ReturnType<typeof bookingReducer>;
	dispatch: React.Dispatch<BookingAction>;
	canGoBack: boolean;
	currentStepIndex: number;
	totalSteps: number;
};

export function useBookingWizard(
	_barbers: BookingBarber[],
	_services: BookingService[],
	_userId: string,
): UseBookingWizardReturn {
	const [state, dispatch] = useReducer(bookingReducer, initialState);
	const availableSlots = useAvailableSlots();

	// Derived state
	const currentStepIndex = PROGRESS_STEPS.indexOf(state.step);
	const canGoBack = state.step !== "barber" && state.step !== "done";
	const totalSteps = PROGRESS_STEPS.length;

	// Fetch slots when date changes in datetime step
	useEffect(() => {
		if (
			state.step === "datetime" &&
			state.date &&
			state.barber &&
			state.service
		) {
			availableSlots.fetchSlots(state.barber.id, state.service.id, state.date);
		}
	}, [
		state.step,
		state.date,
		state.barber?.id,
		state.service?.id,
		availableSlots.fetchSlots,
	]);

	// Sync slots back to state
	useEffect(() => {
		if (availableSlots.slots.length > 0 && state.loadingSlots === false) {
			// Only dispatch if slots actually changed
			const slotsKey = availableSlots.slots.map((s) => s.time).join(",");
			const stateKey = state.slots.map((s) => s.time).join(",");
			if (slotsKey !== stateKey) {
				dispatch({ type: "SET_SLOTS", slots: availableSlots.slots });
			}
		}
	}, [availableSlots.slots, state.loadingSlots, state.slots]);

	// Sync loading state
	useEffect(() => {
		if (availableSlots.loading !== state.loadingSlots) {
			dispatch({ type: "LOADING_SLOTS", loading: availableSlots.loading });
		}
	}, [availableSlots.loading, state.loadingSlots]);

	// Sync error state
	useEffect(() => {
		if (availableSlots.error !== state.error) {
			dispatch({ type: "SET_ERROR", error: availableSlots.error });
		}
	}, [availableSlots.error, state.error]);

	return {
		state,
		dispatch,
		canGoBack,
		currentStepIndex,
		totalSteps,
	};
}

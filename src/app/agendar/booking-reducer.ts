import type { BookingState, BookingAction } from "./types";

export const initialState: BookingState = {
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
};

export function bookingReducer(
	state: BookingState,
	action: BookingAction,
): BookingState {
	switch (action.type) {
		case "SELECT_BARBER":
			return {
				...state,
				barber: action.barber,
				service: null,
				date: "",
				time: "",
				slots: [],
				step: "service",
			};

		case "SELECT_SERVICE":
			return {
				...state,
				service: action.service,
				date: "",
				time: "",
				slots: [],
				step: "datetime",
			};

		case "SET_DATE":
			return { ...state, date: action.date, time: "", slots: [] };

		case "SET_SLOTS":
			return { ...state, slots: action.slots, loadingSlots: false };

		case "LOADING_SLOTS":
			return { ...state, loadingSlots: action.loading };

		case "SELECT_TIME":
			return { ...state, time: action.time, step: "info" };

		case "SET_FIELD":
			return { ...state, [action.field]: action.value };

		case "SUBMITTING":
			return { ...state, submitting: action.submitting };

		case "SET_ERROR":
			return { ...state, error: action.error };

		case "SUCCESS":
			return {
				...state,
				result: action.result,
				step: "done",
				submitting: false,
			};

		case "GO_BACK":
			return { ...state, step: action.step, error: null };

		case "RESET":
			return initialState;

		default:
			return state;
	}
}

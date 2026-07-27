import type { BookingBarber, BookingService, Slot } from "@/types/models";

// ── Steps ──────────────────────────────────────────────

export type Step = "barber" | "service" | "datetime" | "info" | "done";

export const PROGRESS_STEPS: Step[] = ["barber", "service", "datetime", "info"];

export const STEP_LABELS: Record<Step, string> = {
	barber: "Barbero",
	service: "Servicio",
	datetime: "Horario",
	info: "Tus datos",
	done: "Confirmado",
};

// ── Booking Result ─────────────────────────────────────

export type BookingResult = {
	id: string;
	cancelToken: string;
	date: string;
	time: string;
};

// ── Booking State ──────────────────────────────────────

export type BookingState = {
	step: Step;
	barber: BookingBarber | null;
	service: BookingService | null;
	date: string;
	time: string;
	slots: Slot[];
	loadingSlots: boolean;
	clientName: string;
	clientPhone: string;
	clientEmail: string;
	error: string | null;
	submitting: boolean;
	result: BookingResult | null;
};

// ── Booking Actions ────────────────────────────────────

export type BookingAction =
	| { type: "SELECT_BARBER"; barber: BookingBarber }
	| { type: "SELECT_SERVICE"; service: BookingService }
	| { type: "SET_DATE"; date: string }
	| { type: "SET_SLOTS"; slots: Slot[] }
	| { type: "LOADING_SLOTS"; loading: boolean }
	| { type: "SELECT_TIME"; time: string }
	| {
			type: "SET_FIELD";
			field: "clientName" | "clientPhone" | "clientEmail";
			value: string;
	  }
	| { type: "SUBMITTING"; submitting: boolean }
	| { type: "SET_ERROR"; error: string | null }
	| { type: "SUCCESS"; result: BookingResult }
	| { type: "GO_BACK"; step: Step }
	| { type: "RESET" };

// ── Props ──────────────────────────────────────────────

export type Props = {
	barbers: BookingBarber[];
	services: BookingService[];
	userId: string;
};

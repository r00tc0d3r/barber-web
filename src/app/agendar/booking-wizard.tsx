"use client";

import { useReducer, useCallback } from "react";
import { getAvailableSlots, createAppointment } from "./actions";
import { PushSubscriber } from "@/components/push-subscriber";
import { formatPrice } from "@/lib/format";
import type { BookingBarber, BookingService, Slot } from "@/types/models";

// ── Types ────────────────────────────────────────────────

type Step = "barber" | "service" | "datetime" | "info" | "done";

type BookingResult = {
	id: string;
	cancelToken: string;
	date: string;
	time: string;
};

type BookingState = {
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

type BookingAction =
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

// ── Reducer ──────────────────────────────────────────────

const initialState: BookingState = {
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

function bookingReducer(
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

// ── Component ────────────────────────────────────────────

type Props = {
	barbers: BookingBarber[];
	services: BookingService[];
	userId: string;
};

const STEP_LABELS: Record<Step, string> = {
	barber: "Barbero",
	service: "Servicio",
	datetime: "Horario",
	info: "Tus datos",
	done: "Confirmado",
};

const PROGRESS_STEPS: Step[] = ["barber", "service", "datetime", "info"];

export function BookingWizard({ barbers, services, userId }: Props) {
	const [state, dispatch] = useReducer(bookingReducer, initialState);

	const {
		step,
		barber,
		service,
		date,
		time,
		slots,
		loadingSlots,
		clientName,
		clientPhone,
		clientEmail,
		error,
		submitting,
		result,
	} = state;

	// Derived: services for selected barber
	const barberServices = barber
		? services.filter((s) =>
				barber.services.some((bs) => bs.service.id === s.id),
			)
		: [];

	// ── Handlers ─────────────────────────────────

	const handleDateChange = useCallback(
		async (dateStr: string) => {
			dispatch({ type: "SET_DATE", date: dateStr });
			if (!barber || !service) return;

			dispatch({ type: "LOADING_SLOTS", loading: true });
			dispatch({ type: "SET_ERROR", error: null });

			try {
				const available = await getAvailableSlots(
					barber.id,
					service.id,
					dateStr,
				);
				dispatch({ type: "SET_SLOTS", slots: available });
			} catch {
				dispatch({ type: "SET_ERROR", error: "Error al cargar horarios" });
				dispatch({ type: "LOADING_SLOTS", loading: false });
			}
		},
		[barber, service],
	);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!barber || !service || !date || !time) return;

			dispatch({ type: "SUBMITTING", submitting: true });
			dispatch({ type: "SET_ERROR", error: null });

			try {
				const res = await createAppointment({
					barberId: barber.id,
					serviceId: service.id,
					date,
					time,
					clientName,
					clientPhone,
					clientEmail: clientEmail || undefined,
					userId,
				});
				dispatch({ type: "SUCCESS", result: res });
			} catch (err) {
				dispatch({
					type: "SET_ERROR",
					error: err instanceof Error ? err.message : "Error al reservar",
				});
				dispatch({ type: "SUBMITTING", submitting: false });
			}
		},
		[barber, service, date, time, clientName, clientPhone, clientEmail, userId],
	);

	// ── Done screen ──────────────────────────────

	if (step === "done" && result) {
		return (
			<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
				<div className="mb-4 text-5xl">✅</div>
				<h2 className="text-2xl font-bold text-white">Turno confirmado</h2>
				<p className="mt-2 text-neutral-400">
					{barber?.name} te espera el{" "}
					<strong className="text-white">
						{new Date(result.date + "T" + result.time).toLocaleDateString(
							"es-AR",
							{
								weekday: "long",
								day: "numeric",
								month: "long",
							},
						)}
					</strong>{" "}
					a las <strong className="text-white">{result.time}hs</strong>
				</p>
				<div className="mt-6">
					<PushSubscriber />
				</div>
				<button
					onClick={() => dispatch({ type: "RESET" })}
					className="mt-8 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
				>
					Agendar otro turno
				</button>
			</div>
		);
	}

	// ── Progress indicator ───────────────────────

	const currentStepIndex = PROGRESS_STEPS.indexOf(step);

	return (
		<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
			<div className="mb-8 flex items-center justify-center gap-2 text-sm">
				{PROGRESS_STEPS.map((s, i) => (
					<div key={s} className="flex items-center gap-2">
						<span
							className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
								i <= currentStepIndex
									? "bg-blue-600 text-white"
									: "bg-neutral-800 text-neutral-500"
							}`}
						>
							{i + 1}
						</span>
						<span
							className={`hidden sm:inline ${
								i <= currentStepIndex ? "text-white" : "text-neutral-500"
							}`}
						>
							{STEP_LABELS[s]}
						</span>
						{i < PROGRESS_STEPS.length - 1 && (
							<span className="text-neutral-700">—</span>
						)}
					</div>
				))}
			</div>

			{error && (
				<div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400">
					{error}
				</div>
			)}

			{/* ── Step 1: Barbero ──────────────── */}
			{step === "barber" && (
				<div>
					<h2 className="mb-6 text-xl font-semibold text-white">
						Elegí tu barbero
					</h2>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{barbers.map((b) => (
							<button
								key={b.id}
								onClick={() => dispatch({ type: "SELECT_BARBER", barber: b })}
								className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-left transition-all hover:border-neutral-600 hover:bg-neutral-900"
							>
								<div
									className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
									style={{ backgroundColor: b.color }}
								>
									{b.name.charAt(0)}
								</div>
								<h3 className="font-medium text-white">{b.name}</h3>
							</button>
						))}
					</div>
				</div>
			)}

			{/* ── Step 2: Servicio ─────────────── */}
			{step === "service" && (
				<div>
					<button
						onClick={() => dispatch({ type: "GO_BACK", step: "barber" })}
						className="mb-4 text-sm text-neutral-500 transition-colors hover:text-white"
					>
						← Cambiar barbero
					</button>
					<h2 className="mb-6 text-xl font-semibold text-white">
						Elegí el servicio
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{barberServices.map((s) => (
							<button
								key={s.id}
								onClick={() => dispatch({ type: "SELECT_SERVICE", service: s })}
								className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-left transition-all hover:border-neutral-600 hover:bg-neutral-900"
							>
								<div className="flex items-center justify-between">
									<h3 className="font-medium text-white">{s.name}</h3>
									<span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-sm font-medium text-blue-400">
										{formatPrice(s.price)}
									</span>
								</div>
								<p className="mt-1 text-sm text-neutral-500">
									{s.duration} min
								</p>
							</button>
						))}
					</div>
				</div>
			)}

			{/* ── Step 3: Fecha y hora ─────────── */}
			{step === "datetime" && (
				<div>
					<button
						onClick={() => dispatch({ type: "GO_BACK", step: "service" })}
						className="mb-4 text-sm text-neutral-500 transition-colors hover:text-white"
					>
						← Cambiar servicio
					</button>
					<h2 className="mb-6 text-xl font-semibold text-white">
						Elegí día y horario
					</h2>

					<div className="mb-6">
						<label className="mb-2 block text-sm text-neutral-400">Día</label>
						<input
							type="date"
							value={date}
							onChange={(e) => handleDateChange(e.target.value)}
							min={new Date().toISOString().split("T")[0]}
							className="block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
						/>
					</div>

					{loadingSlots && (
						<p className="text-sm text-neutral-500">Buscando horarios...</p>
					)}

					{!loadingSlots && date && slots.length === 0 && (
						<p className="text-sm text-neutral-500">
							No hay horarios disponibles para este día. Probá con otra fecha.
						</p>
					)}

					{!loadingSlots && slots.length > 0 && (
						<div>
							<label className="mb-2 block text-sm text-neutral-400">
								Horario
							</label>
							<div className="flex flex-wrap gap-2">
								{slots.map((slot) => (
									<button
										key={slot.time}
										disabled={!slot.available}
										onClick={() =>
											dispatch({ type: "SELECT_TIME", time: slot.time })
										}
										className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
											time === slot.time
												? "border-blue-500 bg-blue-600 text-white"
												: slot.available
													? "border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800"
													: "cursor-not-allowed border-neutral-800 text-neutral-700"
										}`}
									>
										{slot.time}
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{/* ── Step 4: Datos del cliente ────── */}
			{step === "info" && (
				<div>
					<button
						onClick={() => dispatch({ type: "GO_BACK", step: "datetime" })}
						className="mb-4 text-sm text-neutral-500 transition-colors hover:text-white"
					>
						← Cambiar horario
					</button>
					<h2 className="mb-6 text-xl font-semibold text-white">Tus datos</h2>

					<div className="mb-6 rounded-lg border border-neutral-700 bg-neutral-950 p-4 text-sm">
						<p className="text-neutral-400">
							<span className="text-white">{barber?.name}</span> —{" "}
							{service?.name} — {formatPrice(service?.price ?? 0)}
						</p>
						<p className="mt-1 text-neutral-500">
							{new Date(date + "T" + time).toLocaleDateString("es-AR", {
								weekday: "long",
								day: "numeric",
								month: "long",
							})}{" "}
							a las {time}hs
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-neutral-300">
								Nombre
							</label>
							<input
								type="text"
								required
								value={clientName}
								onChange={(e) =>
									dispatch({
										type: "SET_FIELD",
										field: "clientName",
										value: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="Tu nombre"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-neutral-300">
								Teléfono
							</label>
							<input
								type="tel"
								required
								value={clientPhone}
								onChange={(e) =>
									dispatch({
										type: "SET_FIELD",
										field: "clientPhone",
										value: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="11 1234 5678"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-neutral-300">
								Email <span className="text-neutral-500">(opcional)</span>
							</label>
							<input
								type="email"
								value={clientEmail}
								onChange={(e) =>
									dispatch({
										type: "SET_FIELD",
										field: "clientEmail",
										value: e.target.value,
									})
								}
								className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								placeholder="tumail@ejemplo.com"
							/>
						</div>

						<button
							type="submit"
							disabled={submitting}
							className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{submitting ? "Reservando..." : "Confirmar turno"}
						</button>
					</form>
				</div>
			)}
		</div>
	);
}

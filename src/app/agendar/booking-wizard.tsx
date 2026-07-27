"use client";

import { useBookingWizard } from "./hooks/use-booking-wizard";
import { ProgressIndicator } from "./components/progress-indicator";
import { BarberStep } from "./steps/barber-step";
import { ServiceStep } from "./steps/service-step";
import { DateTimeStep } from "./steps/datetime-step";
import { InfoStep } from "./steps/info-step";
import { DoneStep } from "./steps/done-step";
import { formatPrice } from "@/lib/format";
import type { Props } from "./types";

export function BookingWizard({ barbers, services, userId }: Props) {
	const { state, dispatch, canGoBack, currentStepIndex } = useBookingWizard(
		barbers,
		services,
		userId,
	);

	// Done screen (no progress bar)
	if (state.step === "done" && state.result) {
		return (
			<DoneStep
				result={state.result}
				barber={state.barber!}
				service={state.service!}
				onReset={() => dispatch({ type: "RESET" })}
			/>
		);
	}

	// Filter services for selected barber
	const barberServices = state.barber
		? services.filter((s) =>
				state.barber!.services.some((bs) => bs.service.id === s.id),
			)
		: [];

	return (
		<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
			<ProgressIndicator currentStep={currentStepIndex} />

			{state.error && (
				<div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400">
					{state.error}
				</div>
			)}

			{/* Step 1: Barbero */}
			{state.step === "barber" && (
				<BarberStep
					barbers={barbers}
					selected={state.barber?.id ?? null}
					onSelect={(barber) => dispatch({ type: "SELECT_BARBER", barber })}
				/>
			)}

			{/* Step 2: Servicio */}
			{state.step === "service" && state.barber && (
				<ServiceStep
					barber={state.barber}
					services={barberServices}
					selected={state.service?.id ?? null}
					onSelect={(service) => dispatch({ type: "SELECT_SERVICE", service })}
					onBack={() => dispatch({ type: "GO_BACK", step: "barber" })}
				/>
			)}

			{/* Step 3: Fecha y hora */}
			{state.step === "datetime" && (
				<DateTimeStep
					date={state.date}
					time={state.time || null}
					slots={state.slots}
					loading={state.loadingSlots}
					onDateChange={(date) => dispatch({ type: "SET_DATE", date })}
					onSelect={(time) => dispatch({ type: "SELECT_TIME", time })}
					onBack={() => dispatch({ type: "GO_BACK", step: "service" })}
				/>
			)}

			{/* Step 4: Datos del cliente */}
			{state.step === "info" && state.barber && state.service && (
				<InfoStep
					barber={state.barber}
					service={state.service}
					date={state.date}
					time={state.time}
					name={state.clientName}
					phone={state.clientPhone}
					email={state.clientEmail}
					onFieldChange={(field, value) =>
						dispatch({ type: "SET_FIELD", field, value })
					}
					onSubmit={async (e) => {
						e.preventDefault();
						if (!state.barber || !state.service || !state.date || !state.time)
							return;

						dispatch({ type: "SUBMITTING", submitting: true });
						dispatch({ type: "SET_ERROR", error: null });

						try {
							const { createAppointment } = await import("./actions");
							const res = await createAppointment({
								barberId: state.barber.id,
								serviceId: state.service.id,
								date: state.date,
								time: state.time,
								clientName: state.clientName,
								clientPhone: state.clientPhone,
								clientEmail: state.clientEmail || undefined,
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
					}}
					onBack={() => dispatch({ type: "GO_BACK", step: "datetime" })}
					submitting={state.submitting}
					errors={{}}
				/>
			)}
		</div>
	);
}

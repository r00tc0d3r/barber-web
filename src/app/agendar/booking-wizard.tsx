"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import { useBookingWizard } from "./hooks/use-booking-wizard";
import { ProgressIndicator } from "./components/progress-indicator";
import { BarberStep } from "./steps/barber-step";
import { ServiceStep } from "./steps/service-step";
import { DateTimeStep } from "./steps/datetime-step";
import { InfoStep } from "./steps/info-step";
import { DoneStep } from "./steps/done-step";
import type { Props } from "./types";

// Client-side validation schema
const clientInfoSchema = z.object({
	clientName: z.string().min(1, "Nombre requerido").max(100),
	clientPhone: z.string().min(1, "Teléfono requerido").max(20),
	clientEmail: z.string().email("Email inválido").optional().or(z.literal("")),
});

type ClientInfoErrors = {
	clientName?: string;
	clientPhone?: string;
	clientEmail?: string;
};

export function BookingWizard({ barbers, services, userId }: Props) {
	const { state, dispatch, currentStepIndex } = useBookingWizard(
		barbers,
		services,
		userId,
	);
	const [fieldErrors, setFieldErrors] = useState<ClientInfoErrors>({});

	// Validate a single field on blur
	const validateField = useCallback(
		(field: "clientName" | "clientPhone" | "clientEmail", value: string) => {
			const result = clientInfoSchema.shape[field].safeParse(value);
			setFieldErrors((prev) => ({
				...prev,
				[field]: result.success ? undefined : result.error.issues[0]?.message,
			}));
		},
		[],
	);

	// Validate all fields before submit
	const validateAll = useCallback((): boolean => {
		const result = clientInfoSchema.safeParse({
			clientName: state.clientName,
			clientPhone: state.clientPhone,
			clientEmail: state.clientEmail || "",
		});

		if (result.success) {
			setFieldErrors({});
			return true;
		}

		const errors: ClientInfoErrors = {};
		for (const issue of result.error.issues) {
			const field = issue.path[0] as keyof ClientInfoErrors;
			if (field && !errors[field]) {
				errors[field] = issue.message;
			}
		}
		setFieldErrors(errors);
		return false;
	}, [state.clientName, state.clientPhone, state.clientEmail]);

	// Done screen (no progress bar)
	if (state.step === "done" && state.result) {
		return (
			<div className="animate-in fade-in duration-200">
				<DoneStep
					result={state.result}
					barber={state.barber!}
					service={state.service!}
					onReset={() => dispatch({ type: "RESET" })}
				/>
			</div>
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
				<div
					role="alert"
					aria-live="assertive"
					className="mb-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400"
				>
					{state.error}
				</div>
			)}

			{/* Step content with transition */}
			<div
				key={state.step}
				className="animate-in fade-in slide-in-from-bottom-2 duration-200"
			>
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
						onSelect={(service) =>
							dispatch({ type: "SELECT_SERVICE", service })
						}
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
						onFieldChange={(field, value) => {
							dispatch({ type: "SET_FIELD", field, value });
							// Clear error when user types
							if (fieldErrors[field]) {
								setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
							}
						}}
						onBlur={validateField}
						onSubmit={async (e) => {
							e.preventDefault();
							if (!state.barber || !state.service || !state.date || !state.time)
								return;

							// Validate before submit
							if (!validateAll()) return;

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
									error:
										err instanceof Error ? err.message : "Error al reservar",
								});
								dispatch({ type: "SUBMITTING", submitting: false });
							}
						}}
						onBack={() => dispatch({ type: "GO_BACK", step: "datetime" })}
						submitting={state.submitting}
						errors={fieldErrors}
					/>
				)}
			</div>
		</div>
	);
}

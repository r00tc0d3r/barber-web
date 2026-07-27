"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateTimeStep } from "@/app/agendar/steps/datetime-step";
import { useAvailableSlots } from "@/app/agendar/hooks/use-available-slots";

type Props = {
	appointment: {
		id: string;
		barberId: string;
		serviceId: string;
		barberName: string;
		serviceName: string;
		currentDate: string;
		currentTime: string;
	};
};

export function RescheduleWizard({ appointment }: Props) {
	const router = useRouter();
	const [date, setDate] = useState(
		new Date(appointment.currentDate).toISOString().split("T")[0],
	);
	const [time, setTime] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { slots, loading, fetchSlots } = useAvailableSlots();

	// Fetch slots when date changes
	useEffect(() => {
		if (date) {
			fetchSlots(appointment.barberId, appointment.serviceId, date);
		}
	}, [date, appointment.barberId, appointment.serviceId, fetchSlots]);

	const handleSubmit = useCallback(async () => {
		if (!time) return;

		setSubmitting(true);
		setError(null);

		try {
			const { rescheduleAppointment } = await import("./actions");
			const result = await rescheduleAppointment({
				appointmentId: appointment.id,
				date,
				time,
			});

			if (result.success) {
				router.push("/perfil");
				router.refresh();
			} else {
				setError(result.error || "Error al reprogramar");
				setSubmitting(false);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al reprogramar");
			setSubmitting(false);
		}
	}, [appointment.id, date, time, router]);

	return (
		<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 sm:p-8">
			{/* Current appointment info */}
			<div className="mb-6 rounded-lg border border-neutral-700 bg-neutral-950 p-4 text-sm">
				<p className="text-neutral-400">
					<span className="text-white">{appointment.barberName}</span> —{" "}
					{appointment.serviceName}
				</p>
				<p className="mt-1 text-neutral-500">
					Turno actual:{" "}
					{new Date(appointment.currentDate).toLocaleDateString("es-AR", {
						weekday: "long",
						day: "numeric",
						month: "long",
					})}{" "}
					a las {appointment.currentTime}hs
				</p>
			</div>

			{error && (
				<div
					role="alert"
					className="mb-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-400"
				>
					{error}
				</div>
			)}

			<DateTimeStep
				date={date}
				time={time}
				slots={slots}
				loading={loading}
				onDateChange={setDate}
				onSelect={setTime}
				onBack={() => router.back()}
			/>

			{/* Confirm button */}
			<div className="mt-6 flex gap-3">
				<button
					onClick={() => router.back()}
					className="flex-1 rounded-lg border border-neutral-700 px-4 py-3 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
				>
					Cancelar
				</button>
				<button
					onClick={handleSubmit}
					disabled={!time || submitting}
					className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? "Reprogramando..." : "Confirmar nuevo horario"}
				</button>
			</div>
		</div>
	);
}

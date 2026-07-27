"use client";

import { useTransition } from "react";
import { updateAppointmentStatus } from "./actions";

const statusTransitions: Record<
	string,
	{ label: string; next: string; color: string }[]
> = {
	PENDING: [
		{
			label: "Confirmar",
			next: "CONFIRMED",
			color: "bg-green-600 hover:bg-green-700",
		},
		{
			label: "Cancelar",
			next: "CANCELLED",
			color: "bg-red-600/80 hover:bg-red-700",
		},
	],
	CONFIRMED: [
		{
			label: "Iniciar",
			next: "IN_PROGRESS",
			color: "bg-blue-600 hover:bg-blue-700",
		},
		{
			label: "Cancelar",
			next: "CANCELLED",
			color: "bg-red-600/80 hover:bg-red-700",
		},
	],
	IN_PROGRESS: [
		{
			label: "Completar",
			next: "COMPLETED",
			color: "bg-emerald-600 hover:bg-emerald-700",
		},
	],
};

export function AppointmentActions({
	appointmentId,
	status,
	isBarber,
}: {
	appointmentId: string;
	status: string;
	isBarber: boolean;
}) {
	const [isPending, startTransition] = useTransition();

	const transitions = statusTransitions[status] ?? [];

	if (transitions.length === 0) return null;

	const handleStatusChange = (nextStatus: string) => {
		startTransition(async () => {
			await updateAppointmentStatus(
				appointmentId,
				nextStatus as "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
			);
		});
	};

	return (
		<div className="flex gap-2">
			{transitions.map((t) => (
				<button
					key={t.next}
					onClick={() => handleStatusChange(t.next)}
					disabled={isPending}
					className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 ${t.color}`}
				>
					{isPending ? "..." : t.label}
				</button>
			))}
		</div>
	);
}

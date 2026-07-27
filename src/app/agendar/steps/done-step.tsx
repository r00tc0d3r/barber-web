import { PushSubscriber } from "@/components/push-subscriber";
import type { BookingBarber, BookingService } from "@/types/models";
import type { BookingResult } from "../types";

type Props = {
	result: BookingResult;
	barber: BookingBarber;
	service: BookingService;
	onReset: () => void;
};

export function DoneStep({ result, barber, service, onReset }: Props) {
	const formattedDate = new Date(
		result.date + "T" + result.time,
	).toLocaleDateString("es-AR", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	return (
		<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
			<div className="mb-4 text-5xl">✅</div>
			<h2 className="text-2xl font-bold text-white">Turno confirmado</h2>
			<p className="mt-2 text-neutral-400">
				{barber.name} te espera el{" "}
				<strong className="text-white">{formattedDate}</strong> a las{" "}
				<strong className="text-white">{result.time}hs</strong>
			</p>
			<div className="mt-6">
				<PushSubscriber />
			</div>
			<button
				onClick={onReset}
				className="mt-8 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
			>
				Agendar otro turno
			</button>
		</div>
	);
}

import { formatPrice } from "@/lib/format";
import type { BookingBarber, BookingService } from "@/types/models";

type Props = {
	barber: BookingBarber;
	services: BookingService[];
	selected: string | null;
	onSelect: (service: BookingService) => void;
	onBack: () => void;
};

export function ServiceStep({
	barber,
	services,
	selected,
	onSelect,
	onBack,
}: Props) {
	// Filter services to only those the barber offers
	const barberServiceIds = new Set(barber.services.map((bs) => bs.serviceId));
	const barberServices = services.filter((s) => barberServiceIds.has(s.id));

	const handleKeyDown = (e: React.KeyboardEvent, service: BookingService) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(service);
		}
	};

	return (
		<div>
			<button
				onClick={onBack}
				className="mb-4 text-sm text-neutral-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
			>
				← Cambiar barbero
			</button>
			<h2 className="mb-6 text-xl font-semibold text-white">
				Elegí el servicio
			</h2>
			<div
				role="radiogroup"
				aria-label="Servicios disponibles"
				className="grid gap-4 sm:grid-cols-2"
			>
				{barberServices.map((s) => (
					<button
						key={s.id}
						role="radio"
						aria-checked={selected === s.id}
						aria-label={`Servicio: ${s.name}, ${formatPrice(s.price)}, ${s.duration} minutos`}
						onClick={() => onSelect(s)}
						onKeyDown={(e) => handleKeyDown(e, s)}
						className={`rounded-xl border bg-neutral-950 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
							selected === s.id
								? "border-blue-500"
								: "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900"
						}`}
					>
						<div className="flex items-center justify-between">
							<h3 className="font-medium text-white">{s.name}</h3>
							<span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-sm font-medium text-blue-400">
								{formatPrice(s.price)}
							</span>
						</div>
						<p className="mt-1 text-sm text-neutral-500">{s.duration} min</p>
					</button>
				))}
			</div>
		</div>
	);
}

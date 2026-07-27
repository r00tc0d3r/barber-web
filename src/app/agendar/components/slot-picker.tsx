import type { Slot } from "@/types/models";

type Props = {
	slots: Slot[];
	selected: string | null;
	onSelect: (time: string) => void;
};

export function SlotPicker({ slots, selected, onSelect }: Props) {
	if (slots.length === 0) {
		return (
			<p className="text-sm text-neutral-500">
				No hay horarios disponibles para este día.
			</p>
		);
	}

	const handleKeyDown = (
		e: React.KeyboardEvent,
		time: string,
		available: boolean,
	) => {
		if (!available) return;
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(time);
		}
	};

	return (
		<div
			role="radiogroup"
			aria-label="Horarios disponibles"
			className="flex flex-wrap gap-2"
		>
			{slots.map((slot) => (
				<button
					key={slot.time}
					role="radio"
					aria-checked={selected === slot.time}
					aria-disabled={!slot.available}
					aria-label={`Horario: ${slot.time}${!slot.available ? ", no disponible" : ""}`}
					disabled={!slot.available}
					onClick={() => onSelect(slot.time)}
					onKeyDown={(e) => handleKeyDown(e, slot.time, slot.available)}
					className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
						selected === slot.time
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
	);
}

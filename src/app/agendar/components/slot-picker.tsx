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

	return (
		<div className="flex flex-wrap gap-2">
			{slots.map((slot) => (
				<button
					key={slot.time}
					disabled={!slot.available}
					onClick={() => onSelect(slot.time)}
					className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
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

import type { BookingBarber } from "@/types/models";

type Props = {
	barbers: BookingBarber[];
	selected: string[];
	onToggle: (specialty: string) => void;
};

export function SpecialtyFilter({ barbers, selected, onToggle }: Props) {
	// Extract unique specialties from all barbers
	const specialties = [
		...new Set(
			barbers
				.flatMap((b) => b.specialties?.split(",").map((s) => s.trim()) ?? [])
				.filter(Boolean),
		),
	];

	if (specialties.length === 0) return null;

	return (
		<div className="mb-4 flex flex-wrap gap-2">
			{specialties.map((specialty) => (
				<button
					key={specialty}
					onClick={() => onToggle(specialty)}
					className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
						selected.includes(specialty)
							? "bg-blue-600 text-white"
							: "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
					}`}
				>
					{specialty}
				</button>
			))}
		</div>
	);
}

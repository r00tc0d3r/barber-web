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

	const handleKeyDown = (e: React.KeyboardEvent, specialty: string) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onToggle(specialty);
		}
	};

	return (
		<div
			role="group"
			aria-label="Filtrar por especialidad"
			className="mb-4 flex flex-wrap gap-2"
		>
			{specialties.map((specialty) => {
				const isSelected = selected.includes(specialty);
				return (
					<button
						key={specialty}
						role="checkbox"
						aria-checked={isSelected}
						aria-label={`Especialidad: ${specialty}`}
						onClick={() => onToggle(specialty)}
						onKeyDown={(e) => handleKeyDown(e, specialty)}
						className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
							isSelected
								? "bg-blue-600 text-white"
								: "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
						}`}
					>
						{specialty}
					</button>
				);
			})}
		</div>
	);
}

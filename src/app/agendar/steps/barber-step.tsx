import { SpecialtyFilter } from "../components/specialty-filter";
import { useState, useMemo } from "react";
import type { BookingBarber } from "@/types/models";

type Props = {
	barbers: BookingBarber[];
	selected: string | null;
	onSelect: (barber: BookingBarber) => void;
	specialtyFilter?: string[];
};

export function BarberStep({ barbers, selected, onSelect }: Props) {
	const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

	const filteredBarbers = useMemo(() => {
		if (selectedSpecialties.length === 0) return barbers;
		return barbers.filter((b) => {
			const specialties = b.specialties?.split(",").map((s) => s.trim()) ?? [];
			return selectedSpecialties.some((sel) => specialties.includes(sel));
		});
	}, [barbers, selectedSpecialties]);

	const handleToggle = (specialty: string) => {
		setSelectedSpecialties((prev) =>
			prev.includes(specialty)
				? prev.filter((s) => s !== specialty)
				: [...prev, specialty],
		);
	};

	const handleKeyDown = (e: React.KeyboardEvent, barber: BookingBarber) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(barber);
		}
	};

	return (
		<div>
			<h2 className="mb-6 text-xl font-semibold text-white">
				Elegí tu barbero
			</h2>
			<SpecialtyFilter
				barbers={barbers}
				selected={selectedSpecialties}
				onToggle={handleToggle}
			/>
			<div
				role="radiogroup"
				aria-label="Barberos disponibles"
				className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
			>
				{filteredBarbers.map((b) => (
					<button
						key={b.id}
						role="radio"
						aria-checked={selected === b.id}
						aria-label={`Barbero: ${b.name}`}
						onClick={() => onSelect(b)}
						onKeyDown={(e) => handleKeyDown(e, b)}
						className={`rounded-xl border bg-neutral-950 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 ${
							selected === b.id
								? "border-blue-500"
								: "border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900"
						}`}
					>
						<div
							className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
							style={{ backgroundColor: b.color }}
						>
							{b.name.charAt(0)}
						</div>
						<h3 className="font-medium text-white">{b.name}</h3>
					</button>
				))}
			</div>
		</div>
	);
}

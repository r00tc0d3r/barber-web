import { SlotPicker } from "../components/slot-picker";
import type { Slot } from "@/types/models";

type Props = {
	date: string;
	time: string | null;
	slots: Slot[];
	loading: boolean;
	onDateChange: (date: string) => void;
	onSelect: (time: string) => void;
	onBack: () => void;
};

export function DateTimeStep({
	date,
	time,
	slots,
	loading,
	onDateChange,
	onSelect,
	onBack,
}: Props) {
	return (
		<div>
			<button
				onClick={onBack}
				className="mb-4 text-sm text-neutral-500 transition-colors hover:text-white"
			>
				← Cambiar servicio
			</button>
			<h2 className="mb-6 text-xl font-semibold text-white">
				Elegí día y horario
			</h2>

			<div className="mb-6">
				<label htmlFor="date" className="mb-2 block text-sm text-neutral-400">
					Día
				</label>
				<input
					id="date"
					type="date"
					value={date}
					onChange={(e) => onDateChange(e.target.value)}
					min={new Date().toISOString().split("T")[0]}
					className="block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
				/>
			</div>

			{loading && (
				<p className="text-sm text-neutral-500">Buscando horarios...</p>
			)}

			{!loading && date && slots.length === 0 && (
				<p className="text-sm text-neutral-500">
					No hay horarios disponibles para este día. Probá con otra fecha.
				</p>
			)}

			{!loading && slots.length > 0 && (
				<div>
					<label className="mb-2 block text-sm text-neutral-400">Horario</label>
					<SlotPicker slots={slots} selected={time} onSelect={onSelect} />
				</div>
			)}
		</div>
	);
}

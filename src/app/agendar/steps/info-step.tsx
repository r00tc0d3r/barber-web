import { formatPrice } from "@/lib/format";
import type { BookingBarber, BookingService } from "@/types/models";

type Props = {
	barber: BookingBarber;
	service: BookingService;
	date: string;
	time: string;
	name: string;
	phone: string;
	email: string;
	onFieldChange: (
		field: "clientName" | "clientPhone" | "clientEmail",
		value: string,
	) => void;
	onBlur: (
		field: "clientName" | "clientPhone" | "clientEmail",
		value: string,
	) => void;
	onSubmit: (e: React.FormEvent) => void;
	onBack: () => void;
	submitting: boolean;
	errors: Record<string, string | undefined>;
};

export function InfoStep({
	barber,
	service,
	date,
	time,
	name,
	phone,
	email,
	onFieldChange,
	onBlur,
	onSubmit,
	onBack,
	submitting,
	errors,
}: Props) {
	const formattedDate = new Date(date + "T" + time).toLocaleDateString(
		"es-AR",
		{
			weekday: "long",
			day: "numeric",
			month: "long",
		},
	);

	return (
		<div>
			<button
				onClick={onBack}
				className="mb-4 text-sm text-neutral-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
			>
				← Cambiar horario
			</button>
			<h2 className="mb-6 text-xl font-semibold text-white">Tus datos</h2>

			<div
				aria-label="Resumen de la reserva"
				className="mb-6 rounded-lg border border-neutral-700 bg-neutral-950 p-4 text-sm"
			>
				<p className="text-neutral-400">
					<span className="text-white">{barber.name}</span> — {service.name} —{" "}
					{formatPrice(service.price)}
				</p>
				<p className="mt-1 text-neutral-500">
					{formattedDate} a las {time}hs
				</p>
			</div>

			<form onSubmit={onSubmit} className="space-y-4" noValidate>
				<div>
					<label
						htmlFor="clientName"
						className="block text-sm font-medium text-neutral-300"
					>
						Nombre
					</label>
					<input
						id="clientName"
						type="text"
						required
						value={name}
						onChange={(e) => onFieldChange("clientName", e.target.value)}
						onBlur={() => onBlur("clientName", name)}
						aria-invalid={!!errors.clientName}
						aria-describedby={
							errors.clientName ? "clientName-error" : undefined
						}
						className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						placeholder="Tu nombre"
					/>
					{errors.clientName && (
						<p
							id="clientName-error"
							role="alert"
							className="mt-1 text-sm text-red-400"
						>
							{errors.clientName}
						</p>
					)}
				</div>
				<div>
					<label
						htmlFor="clientPhone"
						className="block text-sm font-medium text-neutral-300"
					>
						Teléfono
					</label>
					<input
						id="clientPhone"
						type="tel"
						required
						value={phone}
						onChange={(e) => onFieldChange("clientPhone", e.target.value)}
						onBlur={() => onBlur("clientPhone", phone)}
						aria-invalid={!!errors.clientPhone}
						aria-describedby={
							errors.clientPhone ? "clientPhone-error" : undefined
						}
						className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						placeholder="11 1234 5678"
					/>
					{errors.clientPhone && (
						<p
							id="clientPhone-error"
							role="alert"
							className="mt-1 text-sm text-red-400"
						>
							{errors.clientPhone}
						</p>
					)}
				</div>
				<div>
					<label
						htmlFor="clientEmail"
						className="block text-sm font-medium text-neutral-300"
					>
						Email <span className="text-neutral-500">(opcional)</span>
					</label>
					<input
						id="clientEmail"
						type="email"
						value={email}
						onChange={(e) => onFieldChange("clientEmail", e.target.value)}
						onBlur={() => onBlur("clientEmail", email)}
						aria-invalid={!!errors.clientEmail}
						aria-describedby={
							errors.clientEmail ? "clientEmail-error" : undefined
						}
						className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-white placeholder-neutral-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						placeholder="tumail@ejemplo.com"
					/>
					{errors.clientEmail && (
						<p
							id="clientEmail-error"
							role="alert"
							className="mt-1 text-sm text-red-400"
						>
							{errors.clientEmail}
						</p>
					)}
				</div>

				<button
					type="submit"
					disabled={submitting}
					aria-busy={submitting}
					className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? "Reservando..." : "Confirmar turno"}
				</button>
			</form>
		</div>
	);
}

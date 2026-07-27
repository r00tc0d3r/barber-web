import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "./status-badge";
import { AppointmentActions } from "./appointment-actions";

export default async function AdminDashboard() {
	const session = await auth();
	if (!session?.user || session.user.role === "CLIENT") redirect("/login");

	const isBarber = session.user.role === "BARBER";
	let barberId: string | null = null;

	// Si es BARBER, buscar su perfil de barbero vinculado
	if (isBarber && session.user.id) {
		const barber = await prisma.barber.findFirst({
			where: { userId: session.user.id },
		});
		barberId = barber?.id ?? null;
	}

	// Turnos de hoy
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	// Próximos 7 días
	const nextWeek = new Date(today);
	nextWeek.setDate(nextWeek.getDate() + 7);

	const todayAppointments = await prisma.appointment.findMany({
		where: {
			date: { gte: today, lt: tomorrow },
			...(barberId ? { barberId } : {}),
		},
		include: { barber: true, service: true },
		orderBy: { date: "asc" },
	});

	const upcomingAppointments = await prisma.appointment.findMany({
		where: {
			date: { gte: tomorrow, lt: nextWeek },
			status: { in: ["PENDING", "CONFIRMED"] },
			...(barberId ? { barberId } : {}),
		},
		include: { barber: true, service: true },
		orderBy: { date: "asc" },
		take: 20,
	});

	// Stats
	const [activeBarbers, servicesCount] = isBarber
		? [1, 0]
		: await Promise.all([
				prisma.barber.count({ where: { isActive: true } }),
				prisma.service.count({ where: { isActive: true } }),
			]);

	const pendingCount = await prisma.appointment.count({
		where: {
			status: "PENDING",
			...(barberId ? { barberId } : {}),
		},
	});

	return (
		<div>
			<h1 className="mb-8 text-2xl font-bold text-white">
				{isBarber ? "Mis Turnos" : "Dashboard"}
			</h1>

			{/* Stats */}
			<div className="mb-8 grid gap-4 sm:grid-cols-3">
				<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
					<p className="text-sm text-neutral-500">
						{isBarber ? "Turnos hoy" : "Barberos activos"}
					</p>
					<p className="mt-1 text-2xl font-bold text-white">
						{isBarber ? todayAppointments.length : activeBarbers}
					</p>
				</div>
				<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
					<p className="text-sm text-neutral-500">Pendientes</p>
					<p className="mt-1 text-2xl font-bold text-white">{pendingCount}</p>
				</div>
				<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
					<p className="text-sm text-neutral-500">
						{isBarber ? "Esta semana" : "Servicios"}
					</p>
					<p className="mt-1 text-2xl font-bold text-white">
						{isBarber
							? todayAppointments.length + upcomingAppointments.length
							: servicesCount}
					</p>
				</div>
			</div>

			{/* Turnos del día */}
			<h2 className="mb-4 text-lg font-semibold text-white">
				Turnos de hoy —{" "}
				{today.toLocaleDateString("es-AR", {
					weekday: "long",
					day: "numeric",
					month: "long",
				})}
			</h2>

			{todayAppointments.length === 0 ? (
				<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-sm text-neutral-500">
					{isBarber ? "No tenés turnos para hoy" : "No hay turnos para hoy"}
				</div>
			) : (
				<div className="space-y-3">
					{todayAppointments.map((apt) => (
						<div
							key={apt.id}
							className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
						>
							<div className="flex items-center justify-between">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="font-mono text-sm font-medium text-white">
											{apt.date.toLocaleTimeString("es-AR", {
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
										<StatusBadge status={apt.status} />
									</div>
									<p className="mt-1 text-sm text-white">{apt.clientName}</p>
									<p className="text-xs text-neutral-500">
										{apt.service.name}
										{!isBarber && ` — ${apt.barber.name}`}
										{apt.clientPhone && ` — ${apt.clientPhone}`}
									</p>
								</div>
								<AppointmentActions
									appointmentId={apt.id}
									status={apt.status}
									isBarber={isBarber}
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Próximos turnos */}
			{upcomingAppointments.length > 0 && (
				<>
					<h2 className="mb-4 mt-8 text-lg font-semibold text-white">
						Próximos turnos
					</h2>
					<div className="space-y-3">
						{upcomingAppointments.map((apt) => (
							<div
								key={apt.id}
								className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
							>
								<div className="flex items-center justify-between">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="text-xs text-neutral-500">
												{apt.date.toLocaleDateString("es-AR", {
													weekday: "short",
													day: "numeric",
												})}
											</span>
											<span className="font-mono text-sm font-medium text-white">
												{apt.date.toLocaleTimeString("es-AR", {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
											<StatusBadge status={apt.status} />
										</div>
										<p className="mt-1 text-sm text-white">{apt.clientName}</p>
										<p className="text-xs text-neutral-500">
											{apt.service.name}
											{!isBarber && ` — ${apt.barber.name}`}
										</p>
									</div>
									<AppointmentActions
										appointmentId={apt.id}
										status={apt.status}
										isBarber={isBarber}
									/>
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

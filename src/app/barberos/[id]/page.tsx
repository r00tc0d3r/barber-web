import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function BarberProfilePage({ params }: Props) {
	const { id } = await params;

	const barber = await prisma.barber.findUnique({
		where: { id, isActive: true },
		include: {
			services: {
				include: { service: true },
			},
			appointments: {
				where: {
					date: { gte: new Date() },
					status: { in: ["PENDING", "CONFIRMED"] },
				},
				include: { service: true },
				orderBy: { date: "asc" },
				take: 5,
			},
		},
	});

	if (!barber) notFound();

	// Get a count of completed appointments for this barber
	const totalCuts = await prisma.appointment.count({
		where: {
			barberId: barber.id,
			status: "COMPLETED",
		},
	});

	// Get gallery images (all images, the barber doesn't have personal gallery yet)
	const galleryImages = await prisma.galleryImage.findMany({
		orderBy: { order: "asc" },
		take: 6,
	});

	return (
		<div className="min-h-screen">
			{/* ── Hero ── */}
			<section
				className="relative overflow-hidden border-b border-neutral-800"
				style={{
					background: `linear-gradient(135deg, ${barber.color}22 0%, transparent 70%)`,
				}}
			>
				<div
					className="absolute inset-0 opacity-[0.03]"
					style={{
						backgroundImage:
							"radial-gradient(circle, white 1px, transparent 1px)",
						backgroundSize: "32px 32px",
					}}
				/>

				<div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
					<div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
						{/* Avatar */}
						<div
							className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full text-4xl font-bold text-white ring-4 ring-white/20 sm:h-36 sm:w-36 sm:text-5xl"
							style={{ backgroundColor: barber.color }}
						>
							{barber.name.charAt(0)}
						</div>

						{/* Info */}
						<div className="text-center sm:text-left">
							<h1 className="text-3xl font-bold text-white sm:text-4xl">
								{barber.name}
							</h1>

							{barber.bio && (
								<p className="mt-2 text-lg text-neutral-400">{barber.bio}</p>
							)}

							{/* Stats row */}
							<div className="mt-4 flex flex-wrap justify-center gap-4 sm:justify-start">
								{barber.experience && (
									<div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-center">
										<p className="text-2xl font-bold text-white">
											{barber.experience}
										</p>
										<p className="text-xs text-neutral-500">Años</p>
									</div>
								)}
								<div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-center">
									<p className="text-2xl font-bold text-white">{totalCuts}</p>
									<p className="text-xs text-neutral-500">Cortes</p>
								</div>
								<div className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-2 text-center">
									<p className="text-2xl font-bold text-white">
										{barber.services.length}
									</p>
									<p className="text-xs text-neutral-500">Servicios</p>
								</div>
							</div>

							{/* Tags + Instagram */}
							<div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
								{barber.instagram && (
									<a
										href={`https://instagram.com/${barber.instagram.replace("@", "")}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-pink-400 transition-colors hover:bg-neutral-800"
									>
										<svg
											className="h-4 w-4"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
										</svg>
										{barber.instagram.replace("@", "")}
									</a>
								)}
								<span className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-green-400">
									<span className="relative flex h-2 w-2">
										<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
										<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
									</span>
									Disponible
								</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div className="mx-auto max-w-6xl px-4 py-12">
				<div className="grid gap-12 lg:grid-cols-3">
					{/* Main content */}
					<div className="lg:col-span-2 space-y-12">
						{/* Specialties */}
						{barber.specialties && (
							<section>
								<h2 className="text-xl font-semibold text-white">
									Especialidades
								</h2>
								<div className="mt-4 flex flex-wrap gap-2">
									{barber.specialties.split(",").map((s, i) => (
										<span
											key={i}
											className="rounded-full border border-neutral-700 bg-neutral-900 px-4 py-1.5 text-sm text-neutral-300"
										>
											{s.trim()}
										</span>
									))}
								</div>
							</section>
						)}

						{/* Services */}
						<section>
							<h2 className="text-xl font-semibold text-white">Servicios</h2>
							<div className="mt-4 grid gap-3 sm:grid-cols-2">
								{barber.services.map((bs) => (
									<div
										key={bs.service.id}
										className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
									>
										<div className="flex items-center justify-between">
											<h3 className="font-medium text-white">
												{bs.service.name}
											</h3>
											<span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-sm font-medium text-blue-400">
												${Number(bs.service.price).toLocaleString("es-AR")}
											</span>
										</div>
										<p className="mt-1 text-sm text-neutral-500">
											{bs.service.duration} min
										</p>
										{bs.service.description && (
											<p className="mt-2 text-sm text-neutral-400">
												{bs.service.description}
											</p>
										)}
									</div>
								))}
							</div>
						</section>

						{/* Gallery */}
						{galleryImages.length > 0 && (
							<section>
								<h2 className="text-xl font-semibold text-white">
									Trabajos recientes
								</h2>
								<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
									{galleryImages.map((img) => (
										<div
											key={img.id}
											className="group relative overflow-hidden rounded-xl"
										>
											<img
												src={img.src}
												alt={img.alt}
												className="h-48 w-full object-cover transition-all duration-500 group-hover:scale-105"
											/>
											<div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/30" />
										</div>
									))}
								</div>
							</section>
						)}
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* CTA Card */}
						<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center">
							<h3 className="text-lg font-semibold text-white">
								¿Listo para tu corte?
							</h3>
							<p className="mt-2 text-sm text-neutral-400">
								Reservá con {barber.name.split(" ")[0]} y asegurate tu horario.
							</p>
							<Link
								href={`/agendar`}
								className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
							>
								Agendar turno
								<svg
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</svg>
							</Link>
						</div>

						{/* Upcoming appointments (public, just count) */}
						{barber.appointments.length > 0 && (
							<div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
								<h3 className="text-sm font-medium text-neutral-400">
									Próximos turnos
								</h3>
								<p className="mt-2 text-2xl font-bold text-white">
									{barber.appointments.length}
								</p>
								<p className="text-sm text-neutral-500">
									turnos agendados para los próximos días
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

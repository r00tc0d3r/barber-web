"use client";

import { useState } from "react";
import Link from "next/link";

type Barber = {
	id: string;
	name: string;
	bio: string | null;
	specialties: string | null;
	experience: number | null;
	instagram: string | null;
	color: string;
	services: { service: { id: string; name: string } }[];
};

export function BarberCard({ barber }: { barber: Barber }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div
			className={`group cursor-pointer rounded-xl border transition-all ${
				expanded
					? "border-blue-500/40 bg-blue-950/10"
					: "border-neutral-800 bg-neutral-900/50 hover:border-neutral-600 hover:bg-neutral-900"
			} p-6`}
			onClick={() => setExpanded(!expanded)}
		>
			{/* ── Compact view (always visible) ── */}
			<div className="flex items-start gap-4">
				<div
					className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white/10 transition-all ${
						expanded ? "h-20 w-20 text-2xl" : "h-16 w-16 text-xl"
					}`}
					style={{ backgroundColor: barber.color }}
				>
					{barber.name.charAt(0)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<h3 className="text-lg font-semibold text-white">{barber.name}</h3>
						<svg
							className={`h-5 w-5 shrink-0 text-neutral-600 transition-transform ${
								expanded ? "rotate-180" : ""
							}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>

					{barber.bio && !expanded && (
						<p className="mt-0.5 text-sm text-neutral-400">{barber.bio}</p>
					)}

					{!expanded && barber.specialties && (
						<div className="mt-2 flex flex-wrap gap-1.5">
							{barber.specialties.split(",").map((s, i) => (
								<span
									key={i}
									className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-300"
								>
									{s.trim()}
								</span>
							))}
						</div>
					)}

					{!expanded && (
						<div className="mt-3 flex items-center gap-3 text-xs text-neutral-500">
							{barber.experience && (
								<span className="flex items-center gap-1">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-3.5 w-3.5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
										/>
									</svg>
									{barber.experience} años
								</span>
							)}
							<span className="flex items-center gap-1">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
								</span>
								Disponible
							</span>
						</div>
					)}
				</div>
			</div>

			{/* ── Expanded view ── */}
			{expanded && (
				<div className="mt-5 space-y-4 border-t border-neutral-800 pt-4">
					{/* Bio completa */}
					{barber.bio && (
						<p className="text-sm leading-relaxed text-neutral-400">
							{barber.bio}
						</p>
					)}

					{/* Especialidades */}
					{barber.specialties && (
						<div>
							<p className="mb-1.5 text-xs font-medium text-neutral-500">
								Especialidades
							</p>
							<div className="flex flex-wrap gap-1.5">
								{barber.specialties.split(",").map((s, i) => (
									<span
										key={i}
										className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300"
									>
										{s.trim()}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Servicios que ofrece */}
					{barber.services.length > 0 && (
						<div>
							<p className="mb-1.5 text-xs font-medium text-neutral-500">
								Servicios
							</p>
							<div className="flex flex-wrap gap-1.5">
								{barber.services.map((bs) => (
									<span
										key={bs.service.id}
										className="rounded-full bg-blue-950/50 px-3 py-1 text-xs text-blue-400"
									>
										{bs.service.name}
									</span>
								))}
							</div>
						</div>
					)}

					{/* Stats row */}
					<div className="flex items-center gap-4 text-xs text-neutral-500">
						{barber.experience && (
							<span className="flex items-center gap-1">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									strokeWidth={2}
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
									/>
								</svg>
								{barber.experience} años de experiencia
							</span>
						)}
						<span className="flex items-center gap-1">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
							</span>
							Disponible ahora
						</span>
					</div>

					{/* Instagram */}
					{barber.instagram && (
						<a
							href={`https://instagram.com/${barber.instagram.replace("@", "")}`}
							target="_blank"
							rel="noopener noreferrer"
							onClick={(e) => e.stopPropagation()}
							className="flex items-center gap-1.5 text-sm text-pink-400 transition-colors hover:text-pink-300"
						>
							<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
							</svg>
							@{barber.instagram.replace("@", "")}
						</a>
					)}

					{/* CTA */}
					<Link
						href={`/agendar`}
						onClick={(e) => e.stopPropagation()}
						className="mt-2 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						Agendar con {barber.name.split(" ")[0]}
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

					{/* Ver perfil */}
					<Link
						href={`/barberos/${barber.id}`}
						onClick={(e) => e.stopPropagation()}
						className="mt-2 inline-flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-white"
					>
						Ver perfil completo
						<svg
							className="h-3.5 w-3.5"
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
			)}
		</div>
	);
}

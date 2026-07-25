"use client";

import { useEffect } from "react";

export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Admin panel error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[40vh] items-center justify-center px-4">
			<div className="max-w-md text-center">
				<div className="mb-6 text-5xl">⚠️</div>
				<h1 className="text-xl font-bold text-white">
					Error en el panel admin
				</h1>
				<p className="mt-3 text-sm text-neutral-400">
					No se pudo cargar esta sección. Intentá recargar la página.
				</p>
				{error.digest && (
					<p className="mt-2 font-mono text-xs text-neutral-600">
						{error.digest}
					</p>
				)}
				<div className="mt-6 flex justify-center gap-3">
					<button
						onClick={reset}
						className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
					>
						Reintentar
					</button>
					<button
						onClick={() => (window.location.href = "/admin")}
						className="rounded-lg border border-neutral-700 px-5 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800"
					>
						Volver al dashboard
					</button>
				</div>
			</div>
		</div>
	);
}

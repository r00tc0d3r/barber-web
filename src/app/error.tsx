"use client";

import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log to external error service in production
		console.error("Unhandled error:", error);
	}, [error]);

	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="max-w-md text-center">
				<div className="mb-6 text-6xl">💥</div>
				<h1 className="text-2xl font-bold text-white">Algo salió mal</h1>
				<p className="mt-3 text-neutral-400">
					Ocurrió un error inesperado. Si persiste, contactá al administrador.
				</p>
				{error.digest && (
					<p className="mt-2 font-mono text-xs text-neutral-600">
						Error ID: {error.digest}
					</p>
				)}
				<button
					onClick={reset}
					className="mt-6 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
				>
					Intentar de nuevo
				</button>
			</div>
		</div>
	);
}

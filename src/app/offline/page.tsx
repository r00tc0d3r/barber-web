"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="text-2xl font-bold text-white">Sin conexión</h1>
        <p className="mt-2 text-neutral-400">
          Parece que no tenés internet. No te preocupes, cuando vuelvas a estar
          conectado podés seguir usando Style Dealers con normalidad.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

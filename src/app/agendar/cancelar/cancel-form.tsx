"use client";

import { useState } from "react";
import { cancelAppointment } from "./actions";
import { useRouter } from "next/navigation";

export function CancelForm({ appointmentId }: { appointmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      await cancelAppointment(appointmentId);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div>
        <div className="mb-2 text-green-400">✅ Turno cancelado correctamente</div>
        <button
          onClick={() => router.push("/")}
          className="mt-4 rounded-lg bg-neutral-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        onClick={handleCancel}
        disabled={loading}
        className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Cancelando..." : "Sí, cancelar turno"}
      </button>
    </div>
  );
}

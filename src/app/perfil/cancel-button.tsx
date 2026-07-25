"use client";

import { useState } from "react";
import { cancelAppointment } from "../agendar/cancelar/actions";
import { useRouter } from "next/navigation";

export function CancelButton({
  appointmentId,
  cancelToken,
}: {
  appointmentId: string;
  cancelToken: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirm("¿Estás seguro de que querés cancelar este turno?")) return;

    setLoading(true);
    try {
      await cancelAppointment(appointmentId);
      router.refresh();
    } catch {
      alert("Error al cancelar el turno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="shrink-0 rounded-lg border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "..." : "Cancelar"}
    </button>
  );
}

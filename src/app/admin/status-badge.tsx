const styles: Record<string, string> = {
  PENDING: "bg-yellow-950 text-yellow-400",
  CONFIRMED: "bg-blue-950 text-blue-400",
  IN_PROGRESS: "bg-green-950 text-green-400",
  COMPLETED: "bg-neutral-800 text-neutral-400",
  CANCELLED: "bg-red-950 text-red-400",
  NO_SHOW: "bg-red-950 text-red-400",
};

const labels: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_SHOW: "No asistió",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

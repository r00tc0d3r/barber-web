import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CancelButton } from "./cancel-button";
import { PushSubscriber } from "@/components/push-subscriber";
import { LogoutButton } from "@/components/logout-button";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/perfil");

  const appointments = await prisma.appointment.findMany({
    where: { userId: session.user.id },
    include: {
      barber: true,
      service: true,
    },
    orderBy: { date: "desc" },
  });

  const isAdmin = session.user.role !== "CLIENT";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Mi perfil</h1>
          <p className="mt-2 text-neutral-400">{session.user.email}</p>
          {isAdmin && (
            <a
              href="/admin"
              className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300"
            >
              Ir al panel de administración →
            </a>
          )}
        </div>
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </div>

      <div className="mb-8">
        <PushSubscriber />
      </div>

      <h2 className="mb-4 text-xl font-semibold text-white">Mis turnos</h2>

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <p className="text-neutral-500">No tenés turnos agendados.</p>
          <a
            href="/agendar"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Agendar turno
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const canCancel =
              apt.status === "PENDING" || apt.status === "CONFIRMED";
            const isPast = new Date(apt.date) < new Date();

            return (
              <div
                key={apt.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-white">
                      {apt.service.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-400">
                      con {apt.barber.name}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {apt.date.toLocaleDateString("es-AR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      a las{" "}
                      {apt.date.toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      hs
                    </p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        apt.status === "CANCELLED"
                          ? "bg-red-950 text-red-400"
                          : apt.status === "COMPLETED"
                            ? "bg-green-950 text-green-400"
                            : "bg-blue-950 text-blue-400"
                      }`}
                    >
                      {statusLabel(apt.status)}
                    </span>
                  </div>

                  {canCancel && !isPast && (
                    <CancelButton
                      appointmentId={apt.id}
                      cancelToken={apt.cancelToken}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    CONFIRMED: "Confirmado",
    IN_PROGRESS: "En curso",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
    NO_SHOW: "No asistió",
  };
  return labels[status] ?? status;
}

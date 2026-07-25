import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "./status-badge";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role === "CLIENT") redirect("/login");

  // Turnos de hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
    },
    include: { barber: true, service: true },
    orderBy: { date: "asc" },
  });

  const [barbersCount, servicesCount, activeBarbers] = await Promise.all([
    prisma.barber.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.barber.count({ where: { isActive: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Dashboard</h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-sm text-neutral-500">Barberos activos</p>
          <p className="mt-1 text-2xl font-bold text-white">{activeBarbers}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-sm text-neutral-500">Servicios</p>
          <p className="mt-1 text-2xl font-bold text-white">{servicesCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-sm text-neutral-500">Turnos hoy</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {todayAppointments.length}
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
          No hay turnos para hoy
        </div>
      ) : (
        <div className="space-y-3">
          {todayAppointments.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
            >
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
                  {apt.service.name} — {apt.barber.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

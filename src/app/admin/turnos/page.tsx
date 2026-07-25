import { prisma } from "@/lib/prisma";
import { AppointmentManager } from "./appointment-manager";

export default async function TurnosPage(props: {
  searchParams: Promise<{ fecha?: string; barbero?: string; estado?: string }>;
}) {
  const searchParams = await props.searchParams;

  const barbers = await prisma.barber.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const where: Record<string, unknown> = {};

  if (searchParams.barbero) {
    where.barberId = searchParams.barbero;
  }
  if (searchParams.estado) {
    where.status = searchParams.estado;
  }
  if (searchParams.fecha) {
    const date = new Date(searchParams.fecha + "T00:00:00");
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { gte: date, lt: nextDay };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { barber: true, service: true },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Turnos</h1>
      <AppointmentManager
        appointments={appointments.map((a) => ({
          ...a,
          service: { ...a.service, price: Number(a.service.price) },
        }))}
        barbers={barbers}
        searchParams={searchParams}
      />
    </div>
  );
}

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookingWizard } from "./booking-wizard";

export default async function AgendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/agendar");

  const [barbers, services] = await Promise.all([
    prisma.barber.findMany({
      where: { isActive: true },
      include: {
        services: {
          include: { service: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serializar todo a objetos planos (Prisma Decimal no viaja a Client Components)
  const normalizedServices = services.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  const normalizedBarbers = barbers.map((b) => ({
    ...b,
    services: b.services.map((bs) => ({
      ...bs,
      service: { id: bs.service.id, name: bs.service.name },
    })),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Agendá tu turno</h1>
        <p className="mt-2 text-neutral-400">
          Elegí tu barbero, servicio, horario y confirmá en segundos.
        </p>
      </div>

      <BookingWizard
        barbers={normalizedBarbers}
        services={normalizedServices}
        userId={session.user.id}
      />
    </div>
  );
}

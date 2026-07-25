import { prisma } from "@/lib/prisma";
import { BarberList } from "./barber-list";

export default async function BarberosPage() {
  const [barbers, services] = await Promise.all([
    prisma.barber.findMany({
      include: {
        services: { include: { service: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serializar todo a objetos planos (Prisma Decimal no viaja a Client Components)
  const serializedBarbers = barbers.map((b) => ({
    ...b,
    services: b.services.map((bs) => ({
      ...bs,
      service: { id: bs.service.id, name: bs.service.name },
    })),
  }));

  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Barberos</h1>
      <BarberList barbers={serializedBarbers} services={serializedServices} />
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { ServiceList } from "./service-list";

export default async function ServiciosPage() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  const normalized = services.map((s) => ({ ...s, price: Number(s.price) }));

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-white">Servicios</h1>
      <ServiceList services={normalized} />
    </div>
  );
}

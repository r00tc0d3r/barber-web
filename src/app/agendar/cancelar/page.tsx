import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CancelForm } from "./cancel-form";

export default async function CancelarPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    redirect("/");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: {
      barber: true,
      service: true,
    },
  });

  if (!appointment) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Link inválido</h1>
        <p className="mt-2 text-neutral-400">
          Este link de cancelación no es válido o el turno ya fue cancelado.
        </p>
      </div>
    );
  }

  if (appointment.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h1 className="text-2xl font-bold text-white">
          Turno ya cancelado
        </h1>
        <p className="mt-2 text-neutral-400">
          Este turno ya fue cancelado anteriormente.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
        <div className="mb-4 text-4xl">✂️</div>
        <h1 className="text-2xl font-bold text-white">
          Cancelar turno
        </h1>

        <div className="my-6 rounded-lg border border-neutral-700 bg-neutral-950 p-4 text-left text-sm">
          <p className="text-neutral-400">
            <span className="text-white">{appointment.clientName}</span> —{" "}
            {appointment.service.name} con {appointment.barber.name}
          </p>
          <p className="mt-1 text-neutral-400">
            {appointment.date.toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            a las{" "}
            {appointment.date.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            hs
          </p>
        </div>

        <CancelForm appointmentId={appointment.id} />
      </div>
    </div>
  );
}

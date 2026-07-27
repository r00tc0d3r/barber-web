import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { RescheduleWizard } from "./reschedule-wizard";

type Props = {
	searchParams: Promise<{ id?: string }>;
};

export default async function ReschedulePage({ searchParams }: Props) {
	const session = await auth();
	if (!session?.user) redirect("/login?callbackUrl=/perfil");

	const { id } = await searchParams;
	if (!id) notFound();

	const appointment = await prisma.appointment.findUnique({
		where: { id },
		include: { barber: true, service: true },
	});

	// Only allow rescheduling own appointments
	if (!appointment || appointment.userId !== session.user.id) {
		notFound();
	}

	// Only allow rescheduling PENDING or CONFIRMED appointments
	if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
		redirect("/perfil");
	}

	return (
		<div className="mx-auto max-w-3xl px-4 py-12">
			<h1 className="mb-8 text-3xl font-bold text-white">Reprogramar turno</h1>
			<RescheduleWizard
				appointment={{
					id: appointment.id,
					barberId: appointment.barberId,
					serviceId: appointment.serviceId,
					barberName: appointment.barber.name,
					serviceName: appointment.service.name,
					currentDate: appointment.date.toISOString(),
					currentTime: appointment.date.toLocaleTimeString("es-AR", {
						hour: "2-digit",
						minute: "2-digit",
					}),
				}}
			/>
		</div>
	);
}

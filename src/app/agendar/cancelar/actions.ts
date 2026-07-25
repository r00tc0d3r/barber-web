"use server";

import { prisma } from "@/lib/prisma";
import { updateCalendarEventStatus } from "@/lib/calendar";

export async function cancelAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { barber: true, service: true },
  });

  if (!appointment) {
    throw new Error("Turno no encontrado");
  }

  if (appointment.status === "CANCELLED") {
    throw new Error("El turno ya fue cancelado");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED" },
  });

  // Actualizar color en Google Calendar (rojo)
  if (appointment.googleCalendarEventId) {
    await updateCalendarEventStatus(
      appointment.googleCalendarEventId,
      "CANCELLED",
    );
  }
}

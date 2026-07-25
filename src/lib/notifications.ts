import webpush from "web-push";
import { prisma } from "./prisma";
import { createLogger } from "./logger";

const log = createLogger("notifications");

webpush.setVapidDetails(
	process.env.VAPID_SUBJECT!,
	process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
	process.env.VAPID_PRIVATE_KEY!,
);

export async function subscribeUser(
	userId: string,
	subscription: PushSubscriptionJSON,
) {
	if (!subscription.endpoint || !subscription.keys) {
		throw new Error("Invalid subscription");
	}

	await prisma.pushSubscription.upsert({
		where: { endpoint: subscription.endpoint },
		update: {
			authKey: subscription.keys.auth!,
			p256dhKey: subscription.keys.p256dh!,
			userId,
		},
		create: {
			userId,
			endpoint: subscription.endpoint,
			authKey: subscription.keys.auth!,
			p256dhKey: subscription.keys.p256dh!,
		},
	});
}

export async function unsubscribeUser(endpoint: string) {
	await prisma.pushSubscription.deleteMany({
		where: { endpoint },
	});
}

export async function sendNotification(
	userId: string,
	title: string,
	body: string,
) {
	const subscriptions = await prisma.pushSubscription.findMany({
		where: { userId },
	});

	const results = await Promise.allSettled(
		subscriptions.map((sub) =>
			webpush.sendNotification(
				{
					endpoint: sub.endpoint,
					keys: { auth: sub.authKey, p256dh: sub.p256dhKey },
				},
				JSON.stringify({ title, body }),
			),
		),
	);

	// Clean up invalid subscriptions
	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		if (result.status === "rejected") {
			const err = result.reason as Error;
			if (err.message?.includes("410") || err.message?.includes("404")) {
				await prisma.pushSubscription.delete({
					where: { id: subscriptions[i].id },
				});
				log.debug(
					{ endpoint: subscriptions[i].endpoint },
					"Removed invalid push subscription",
				);
			}
		}
	}
}

export async function sendAppointmentReminder(
	appointmentId: string,
	clientName: string,
) {
	const appointment = await prisma.appointment.findUnique({
		where: { id: appointmentId },
		include: { barber: true, service: true },
	});

	if (!appointment?.userId) return;

	const dateStr = appointment.date.toLocaleDateString("es-AR", {
		day: "numeric",
		month: "long",
	});
	const timeStr = appointment.date.toLocaleTimeString("es-AR", {
		hour: "2-digit",
		minute: "2-digit",
	});

	await sendNotification(
		appointment.userId,
		"Recordatorio de turno",
		`Hola ${clientName}! Tenés ${appointment.service.name} con ${appointment.barber.name} el ${dateStr} a las ${timeStr}`,
	);
}

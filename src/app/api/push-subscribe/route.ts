import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { subscribeUser, unsubscribeUser } from "@/lib/notifications";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("push-subscribe");

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	// Rate limit: 5 subscriptions per user per minute
	const ip = getClientIp(request.headers);
	const rl = rateLimit(`push-sub:${session.user.id}:${ip}`, 5, 60_000);
	if (!rl.success) {
		return NextResponse.json(
			{ error: "Demasiadas solicitudes" },
			{ status: 429 },
		);
	}

	try {
		const subscription = (await request.json()) as PushSubscriptionJSON;
		await subscribeUser(session.user.id, subscription);
		return NextResponse.json({ ok: true });
	} catch (error) {
		log.error(
			{ err: error, userId: session.user.id },
			"Failed to subscribe to push",
		);
		return NextResponse.json({ error: "Error al suscribir" }, { status: 400 });
	}
}

export async function DELETE(request: Request) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "No autorizado" }, { status: 401 });
	}

	try {
		const { endpoint } = (await request.json()) as { endpoint: string };
		await unsubscribeUser(endpoint);
		return NextResponse.json({ ok: true });
	} catch (error) {
		log.error(
			{ err: error, userId: session.user.id },
			"Failed to unsubscribe from push",
		);
		return NextResponse.json(
			{ error: "Error al desuscribir" },
			{ status: 400 },
		);
	}
}

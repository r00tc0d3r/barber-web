import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const checks: Record<string, string> = {};
	let healthy = true;

	// Database connectivity check
	try {
		await prisma.$queryRaw`SELECT 1`;
		checks.database = "ok";
	} catch (err) {
		checks.database = "error";
		healthy = false;
	}

	const status = healthy ? 200 : 503;

	return NextResponse.json(
		{
			status: healthy ? "healthy" : "degraded",
			timestamp: new Date().toISOString(),
			checks,
		},
		{ status },
	);
}

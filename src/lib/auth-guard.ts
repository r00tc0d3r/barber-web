import { auth } from "@/lib/auth";
import { AuthError } from "next-auth";

type AllowedRoles = "CLIENT" | "BARBER" | "ADMIN" | "SUPER_ADMIN";

/**
 * Server-side guard that validates NextAuth session and optional role.
 * Throw this at the top of any server action that requires authentication.
 *
 * @example
 * export async function createBarber(data: {...}) {
 *   await requireAuth(["ADMIN", "SUPER_ADMIN"]);
 *   // ... rest of logic
 * }
 */
export async function requireAuth(allowedRoles?: AllowedRoles[]) {
	const session = await auth();

	if (!session?.user) {
		throw new AuthError("No autorizado");
	}

	if (
		allowedRoles &&
		allowedRoles.length > 0 &&
		!allowedRoles.includes(session.user.role as AllowedRoles)
	) {
		throw new AuthError("No autorizado");
	}

	return session;
}

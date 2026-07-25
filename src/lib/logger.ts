import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Structured logger for the application.
 * In development: pretty-printed output.
 * In production: JSON for log aggregation services.
 *
 * @example
 * import { logger } from "@/lib/logger";
 * logger.info({ appointmentId: "abc" }, "Appointment created");
 * logger.error({ err, userId }, "Failed to send notification");
 */
export const logger = pino({
	level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
	transport: isDev
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:HH:MM:ss",
					ignore: "pid,hostname",
				},
			}
		: undefined,
});

/**
 * Create a child logger with fixed context (e.g. module name).
 *
 * @example
 * const log = logger.child({ module: "calendar" });
 * log.info("Event created");
 */
export function createLogger(module: string) {
	return logger.child({ module });
}

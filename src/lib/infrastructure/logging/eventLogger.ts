/**
 * Purpose:
 * This file adapts application event logging onto the shared logger.
 *
 * Why this structure is good:
 * The application layer can emit structured events without knowing about the
 * underlying logging library or payload conventions.
 */
import type { EventLogger } from "$lib/application/ports";
import { logger } from "$lib/infrastructure/logging/logger";

/** Event logger implementation backed by the shared pino logger. */
export class PinoEventLogger implements EventLogger {
    /** Writes a normalized event payload for auditing and troubleshooting. */
    log(eventName: string, byUser: string, details: Record<string, unknown> | null): void {
        logger.info({
            log_schema_version: 1.0,
            event_name: eventName,
            by: byUser,
            on_date: new Date().toISOString(),
            details,
        });
    }
}

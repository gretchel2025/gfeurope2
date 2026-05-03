import type { EventLogger } from "$lib/application/ports";
import { logger } from "$lib/infrastructure/logging/logger";

export class PinoEventLogger implements EventLogger {
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

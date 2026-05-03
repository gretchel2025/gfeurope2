import type { User } from "$lib/domain/user";
import { appConfig } from "$lib/infrastructure/config/env.server";
import { connectMongo } from "$lib/infrastructure/db/mongo/client";
import { logger } from "$lib/infrastructure/logging/logger";
import { ticketCounterService, userService } from "$lib/server/http/services";

export async function bootstrapApplication(): Promise<void> {
    logger.info("[INFO] bootstrapApplication() initializing app...");

    const connected = await connectMongo();
    if (!connected) {
        logger.warn("[WARN] skipping DB bootstrap because the database connection is unavailable");
        return;
    }

    await ensureCounters();
    await ensureLocalAdminUsers();

    logger.info("[INFO] bootstrapApplication() initialization done");
}

async function ensureCounters(): Promise<void> {
    const counters = [
        {
            id: ticketCounterService.getStandardCounterId(),
            available: appConfig.bootstrap.standardTicketsInitialAvailable,
        },
        {
            id: ticketCounterService.getVipCounterId(),
            available: appConfig.bootstrap.vipTicketsInitialAvailable,
        },
        {
            id: ticketCounterService.getYouthCounterId(),
            available: appConfig.bootstrap.youthTicketsInitialAvailable,
        },
    ];

    for (const counter of counters) {
        const existing = await ticketCounterService.getById(counter.id);
        if (existing) {
            continue;
        }

        await ticketCounterService.create(counter.id, {
            available: counter.available,
            reserved: 0,
            sold: 0,
        });
        logger.info(`[INFO] bootstrap: created counter ${counter.id} with available=${counter.available}`);
    }
}

async function ensureLocalAdminUsers(): Promise<void> {
    for (const email of appConfig.localAdminEmails) {
        const existing = await userService.getById(email);
        if (existing) {
            continue;
        }

        const user: User = {
            _id: email,
            roles: ["admin", "superuser"],
        };
        await userService.insert(user);
        logger.info(`[INFO] bootstrap: created local admin user ${email}`);
    }
}

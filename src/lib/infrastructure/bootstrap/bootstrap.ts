/**
 * Purpose:
 * This file bootstraps runtime prerequisites such as Mongo connectivity,
 * and inventory counters.
 *
 * Why this structure is good:
 * Startup behavior is centralized here instead of being spread across hooks and
 * repositories. That makes local setup, empty-database handling, and future
 * initialization logic easier to reason about.
 */
import { appConfig } from '$lib/infrastructure/config/env.server';
import { connectMongo } from '$lib/infrastructure/db/mongo/client';
import { logger } from '$lib/infrastructure/logging/logger';
import { ticketCounterService } from '$lib/server/http/services';

/** Initializes runtime infrastructure that the app expects to exist. */
export async function bootstrapApplication(): Promise<void> {
	logger.info('[INFO] bootstrapApplication() initializing app...');

	const connected = await connectMongo();
	if (!connected) {
		logger.warn('[WARN] skipping DB bootstrap because the database connection is unavailable');
		return;
	}

	await ensureCounters();

	logger.info('[INFO] bootstrapApplication() initialization done');
}

/** Ensures ticket counters exist so the app can run against an empty database. */
async function ensureCounters(): Promise<void> {
	const counters = [
		{
			id: ticketCounterService.getStandardCounterId(),
			available: appConfig.bootstrap.standardTicketsInitialAvailable
		},
		{
			id: ticketCounterService.getVipCounterId(),
			available: appConfig.bootstrap.vipTicketsInitialAvailable
		},
		{
			id: ticketCounterService.getYouthCounterId(),
			available: appConfig.bootstrap.youthTicketsInitialAvailable
		}
	];

	for (const counter of counters) {
		const existing = await ticketCounterService.getById(counter.id);
		if (existing) {
			continue;
		}

		await ticketCounterService.create(counter.id, {
			available: counter.available,
			reserved: 0,
			sold: 0
		});
		logger.info(
			`[INFO] bootstrap: created counter ${counter.id} with available=${counter.available}`
		);
	}
}

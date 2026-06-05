/**
 * Purpose:
 * This file bootstraps runtime prerequisites such as inventory counters.
 *
 * Why this structure is good:
 * Startup behavior is centralized here instead of being spread across hooks and
 * repositories. That makes local setup, empty-database handling, and future
 * initialization logic easier to reason about.
 */
import { appConfig, assertCloudinaryConfigured } from '$lib/infrastructure/config/env.server';
import { logger } from '$lib/infrastructure/logging/logger';
import { createEventServices } from '$lib/server/http/services';

/** Initializes runtime infrastructure that the app expects to exist. */
export async function bootstrapApplication(): Promise<void> {
	logger.info('[INFO] bootstrapApplication() initializing app...');

	assertCloudinaryConfigured();
	await ensureCounters();

	logger.info('[INFO] bootstrapApplication() initialization done');
}

/** Ensures ticket counters exist so the app can run against an empty database. */
async function ensureCounters(): Promise<void> {
	const { ticketCounterService } = createEventServices(appConfig.appEventId);
	const counters = [
		{
			id: ticketCounterService.getStandardCounterId(),
			available: appConfig.bootstrap.standardTicketsInitialAvailable
		},
		{
			id: ticketCounterService.getGrandFeastPlusCounterId(),
			available: appConfig.bootstrap.grandFeastPlusTicketsInitialAvailable
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

/**
 * Purpose:
 * This file wires together concrete infrastructure adapters and application services.
 *
 * Why this structure is good:
 * Composition happens in one place, which makes the rest of the app import ready
 * to use services instead of repeatedly constructing dependencies by hand.
 */
import { BookingService } from '$lib/application/services/bookingService';
import { NotificationService } from '$lib/application/services/notificationService';
import { ReportingService } from '$lib/application/services/reportingService';
import { SystemService } from '$lib/application/services/systemService';
import { TicketCounterService } from '$lib/application/services/ticketCounterService';
import { TicketService } from '$lib/application/services/ticketService';
import {
	MongoBookingRepository,
	MongoTicketCounterRepository,
	MongoTicketRepository
} from '$lib/infrastructure/db/mongo/repositories';
import { PostmarkEmailSender } from '$lib/infrastructure/email/postmarkEmailSender';
import { CloudinaryImageStorage } from '$lib/infrastructure/media/cloudinaryImageStorage';
import { DefaultQrCodeGenerator } from '$lib/infrastructure/media/qrCodeGenerator';
import { PinoEventLogger } from '$lib/infrastructure/logging/eventLogger';
import { InMemorySystemSettingsStore } from '$lib/infrastructure/system/inMemorySystemSettingsStore';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { customAlphabet } from 'nanoid/non-secure';

/** Shared id generator used for booking and ticket ids. */
const randomIdGenerator = customAlphabet('23456789ABCDEFGHJKLMNPRSTUVWXYZ', 10);

/** Repository implementations used by the service layer. */
const bookingRepository = new MongoBookingRepository();
const ticketRepository = new MongoTicketRepository();
const ticketCounterRepository = new MongoTicketCounterRepository();

/** Infrastructure adapters used by the service layer. */
const emailSender = new PostmarkEmailSender();
const imageStorage = new CloudinaryImageStorage();
const qrCodeGenerator = new DefaultQrCodeGenerator();
const eventLogger = new PinoEventLogger();
const systemSettingsStore = new InMemorySystemSettingsStore();

/** Ready-to-use application services imported by SvelteKit routes. */
export const ticketCounterService = new TicketCounterService(ticketCounterRepository);
export const notificationService = new NotificationService(
	bookingRepository,
	ticketRepository,
	emailSender
);
export const ticketService = new TicketService(
	bookingRepository,
	ticketRepository,
	imageStorage,
	qrCodeGenerator,
	eventLogger,
	appConfig.appBaseUrl,
	(size) => randomIdGenerator(size)
);
export const bookingService = new BookingService(
	bookingRepository,
	ticketCounterService,
	ticketService,
	notificationService,
	eventLogger,
	(size) => randomIdGenerator(size)
);
export const reportingService = new ReportingService();
export const systemService = new SystemService(systemSettingsStore);

/** Raw repository exports for the occasional place that needs direct repository access. */
export const repositories = {
	bookingRepository,
	ticketRepository,
	ticketCounterRepository
};

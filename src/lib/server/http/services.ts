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
import { TicketTypeService } from '$lib/application/services/ticketTypeService';
import {
	SupabaseBookingRepository,
	SupabaseEventRepository,
	SupabaseTicketCounterRepository,
	SupabaseTicketRepository,
	SupabaseTicketTypeRepository
} from '$lib/infrastructure/db/supabase/repositories';
import { ResendEmailSender } from '$lib/infrastructure/email/resendEmailSender';
import { CloudinaryImageStorage } from '$lib/infrastructure/media/cloudinaryImageStorage';
import { CloudinaryPaymentProofStorage } from '$lib/infrastructure/media/cloudinaryPaymentProofStorage';
import { DefaultQrCodeGenerator } from '$lib/infrastructure/media/qrCodeGenerator';
import { PinoEventLogger } from '$lib/infrastructure/logging/eventLogger';
import { InMemorySystemSettingsStore } from '$lib/infrastructure/system/inMemorySystemSettingsStore';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { customAlphabet } from 'nanoid/non-secure';

/** Shared id generator used for booking and ticket ids. */
const randomIdGenerator = customAlphabet('23456789ABCDEFGHJKLMNPRSTUVWXYZ', 10);

const eventRepository = new SupabaseEventRepository();
const ticketTypeRepository = new SupabaseTicketTypeRepository();

/** Infrastructure adapters used by the service layer. */
const emailSender = new ResendEmailSender();
const imageStorage = new CloudinaryImageStorage();
const paymentProofStorage = new CloudinaryPaymentProofStorage();
const qrCodeGenerator = new DefaultQrCodeGenerator();
const eventLogger = new PinoEventLogger();
const systemSettingsStore = new InMemorySystemSettingsStore();

export const ticketTypeService = new TicketTypeService(ticketTypeRepository);
export const reportingService = new ReportingService();
export const systemService = new SystemService(systemSettingsStore);
export { paymentProofStorage };

export type EventServices = ReturnType<typeof createEventServices>;

export function createEventServices(eventId: string) {
	const bookingRepository = new SupabaseBookingRepository(undefined, eventId);
	const ticketRepository = new SupabaseTicketRepository(undefined, eventId);
	const ticketCounterRepository = new SupabaseTicketCounterRepository(undefined, eventId);
	const ticketCounterService = new TicketCounterService(ticketCounterRepository);
	const notificationService = new NotificationService(
		bookingRepository,
		ticketRepository,
		emailSender
	);
	const ticketService = new TicketService(
		bookingRepository,
		ticketRepository,
		imageStorage,
		qrCodeGenerator,
		eventLogger,
		appConfig.appBaseUrl,
		eventId,
		(size) => randomIdGenerator(size)
	);
	const bookingService = new BookingService(
		bookingRepository,
		eventRepository,
		ticketCounterService,
		ticketTypeService,
		ticketService,
		notificationService,
		eventLogger,
		(size) => randomIdGenerator(size)
	);

	return {
		bookingRepository,
		ticketRepository,
		ticketCounterRepository,
		ticketCounterService,
		notificationService,
		ticketService,
		bookingService,
		ticketTypeService
	};
}

/** Raw repository exports for the occasional place that needs direct repository access. */
export const repositories = {
	eventRepository,
	ticketTypeRepository
};

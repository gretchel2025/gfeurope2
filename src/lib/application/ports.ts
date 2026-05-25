/**
 * Purpose:
 * This file declares the ports used by the application layer.
 *
 * Why this structure is good:
 * The services depend on interfaces instead of concrete Mongo, email, or media
 * implementations. That keeps business logic easier to test, easier to replace,
 * and easier to read because the dependencies are described by capability.
 */
import type { Booking } from '$lib/domain/booking';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketCounter, TicketCounterDelta } from '$lib/domain/ticketCounter';
import type { BookingPaymentStatus, TicketStatus } from '$lib/domain/shared/enums';

/** A transport-friendly representation of an outbound email. */
export type EmailMessage = {
	from: string;
	to: string;
	subject: string;
	message: string;
};

/** Persistence contract for booking records. */
export interface BookingRepository {
	insert(booking: Booking): Promise<Booking>;
	findByReferenceNo(referenceNo: string): Promise<Booking | null>;
	list(): Promise<Booking[]>;
	updatePaymentStatus(referenceNo: string, value: BookingPaymentStatus): Promise<void>;
	appendTicketId(referenceNo: string, ticketId: string): Promise<void>;
}

/** Persistence contract for ticket records. */
export interface TicketRepository {
	insert(ticket: Ticket): Promise<string>;
	findByTicketId(ticketId: string): Promise<Ticket | null>;
	list(): Promise<Ticket[]>;
	updateStatus(ticketId: string, status: TicketStatus): Promise<void>;
	deleteByTicketId(ticketId: string): Promise<void>;
}

/** Persistence contract for ticket inventory counters. */
export interface TicketCounterRepository {
	create(counterId: string, values?: TicketCounterDelta): Promise<void>;
	findById(id: string): Promise<TicketCounter | null>;
	set(id: string, values: TicketCounterDelta): Promise<void>;
	increment(id: string, values: TicketCounterDelta): Promise<void>;
}

/** Outbound email delivery contract. */
export interface EmailSender {
	send(message: EmailMessage): Promise<void>;
}

/** Image upload contract used for QR code assets. */
export interface ImageStorage {
	uploadImage(imageData: string): Promise<string>;
}

/** QR code generation contract. */
export interface QrCodeGenerator {
	generate(url: string): Promise<string>;
}

/** Structured event logging contract. */
export interface EventLogger {
	log(eventName: string, byUser: string, details: Record<string, unknown> | null): void;
}

/** Minimal contract for app-wide mutable system settings. */
export interface SystemSettingsStore {
	getNewBookingsAllowed(): boolean;
	setNewBookingsAllowed(enabled: boolean): void;
}

/**
 * Purpose:
 * This file declares the ports used by the application layer.
 *
 * Why this structure is good:
 * The services depend on interfaces instead of concrete database, email, or media
 * implementations. That keeps business logic easier to test, easier to replace,
 * and easier to read because the dependencies are described by capability.
 */
import type { Booking } from '$lib/domain/booking';
import type { Event } from '$lib/domain/event';
import type {
	CreateMerchProductInput,
	CreateMerchReservationInput,
	MerchProduct,
	MerchReservation,
	UpdateMerchProductInput
} from '$lib/domain/merchandise';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketCounter, TicketCounterDelta } from '$lib/domain/ticketCounter';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import type { AdminUser } from '$lib/domain/adminUser';
import type { BookingConfirmationEmailStatus, TicketStatus } from '$lib/domain/shared/enums';
import type {
	AuditEntityType,
	AuditEvent,
	AuditEventListOptions,
	CreateAuditEventInput
} from '$lib/domain/auditEvent';

/** A transport-friendly representation of an outbound email. */
export type EmailMessage = {
	to: string;
	subject: string;
	message: string;
	from?: string;
	replyTo?: string;
};

export type EmailSendResult = {
	status: 'SENT' | 'SKIPPED';
	providerMessageId?: string;
};

/** Persistence contract for booking records. */
export interface BookingRepository {
	insertReservation(booking: Booking): Promise<Booking>;
	findByReferenceNo(referenceNo: string): Promise<Booking | null>;
	list(): Promise<Booking[]>;
	markPaid(referenceNo: string): Promise<void>;
	cancelReservation(referenceNo: string): Promise<void>;
	appendTicketId(referenceNo: string, ticketId: string): Promise<void>;
	updateGuestDetails(referenceNo: string, guests: string[], contactName?: string): Promise<void>;
	markTicketsSentToClient(referenceNo: string): Promise<void>;
	updateBookingConfirmationEmailStatus(
		referenceNo: string,
		status: BookingConfirmationEmailStatus,
		errorMessage?: string,
		providerMessageId?: string
	): Promise<void>;
}

/** Persistence contract for append-only domain audit events. */
export interface AuditEventRepository {
	insert(input: CreateAuditEventInput): Promise<AuditEvent>;
	listByEvent(eventId: string, options?: AuditEventListOptions): Promise<AuditEvent[]>;
	listByEntity(
		eventId: string,
		entityType: AuditEntityType,
		entityId: string,
		options?: AuditEventListOptions
	): Promise<AuditEvent[]>;
}

/** Persistence contract for event records. */
export interface EventRepository {
	findById(eventId: string): Promise<Event | null>;
	list(): Promise<Event[]>;
}

/** Persistence contract for ticket records. */
export interface TicketRepository {
	insert(ticket: Ticket): Promise<string>;
	findByTicketId(ticketId: string): Promise<Ticket | null>;
	list(): Promise<Ticket[]>;
	updateName(ticketId: string, name: string): Promise<void>;
	updateStatus(ticketId: string, status: TicketStatus): Promise<void>;
	deleteByTicketId(ticketId: string): Promise<void>;
}

/** Persistence contract for ticket inventory counters. */
export interface TicketCounterRepository {
	create(counterId: string, values?: TicketCounterDelta): Promise<void>;
	findById(id: string): Promise<TicketCounter | null>;
	list(): Promise<TicketCounter[]>;
	set(id: string, values: TicketCounterDelta): Promise<void>;
	increment(id: string, values: TicketCounterDelta): Promise<void>;
}

/** Persistence contract for ticket type configuration. */
export interface TicketTypeRepository {
	findById(eventId: string, ticketTypeId: string): Promise<TicketTypeConfig | null>;
	list(eventId: string): Promise<TicketTypeConfig[]>;
	listActive(eventId: string): Promise<TicketTypeConfig[]>;
}

/** Persistence contract for event merchandise products. */
export interface MerchProductRepository {
	insert(input: CreateMerchProductInput): Promise<MerchProduct>;
	update(eventId: string, input: UpdateMerchProductInput): Promise<MerchProduct>;
	softDelete(eventId: string, productId: string): Promise<void>;
	findById(eventId: string, productId: string): Promise<MerchProduct | null>;
	list(eventId: string): Promise<MerchProduct[]>;
	listAvailable(eventId: string): Promise<MerchProduct[]>;
}

/** Persistence contract for public merchandise reservations. */
export interface MerchReservationRepository {
	insertReservation(
		input: CreateMerchReservationInput,
		reservationId: string
	): Promise<MerchReservation>;
	findById(eventId: string, reservationId: string): Promise<MerchReservation | null>;
	list(eventId: string): Promise<MerchReservation[]>;
	delete(eventId: string, reservationId: string): Promise<void>;
	updateConfirmationEmailStatus(
		eventId: string,
		reservationId: string,
		status: MerchReservation['confirmation_email_status'],
		errorMessage?: string,
		providerMessageId?: string
	): Promise<void>;
}

/** Server-only contract for Supabase Auth admin user visibility. */
export interface AdminUserRepository {
	list(): Promise<AdminUser[]>;
}

/** Outbound email delivery contract. */
export interface EmailSender {
	send(message: EmailMessage): Promise<EmailSendResult>;
}

/** Image upload contract used for QR code assets. */
export interface ImageStorage {
	uploadImage(imageData: string): Promise<string>;
}

/** Upload contract for visitor payment proof files. */
export interface PaymentProofStorage {
	uploadProof(file: File): Promise<string>;
}

/** Upload contract for admin-managed merchandise product images. */
export interface MerchProductImageStorage {
	uploadProductImages(eventId: string, productId: string, files: File[]): Promise<string[]>;
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

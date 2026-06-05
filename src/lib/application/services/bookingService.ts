/**
 * Purpose:
 * This service owns the booking lifecycle: create, pay, cancel, and ticket generation.
 *
 * Why this structure is good:
 * Booking orchestration lives in one application service instead of being split
 * across routes, database modules, and UI handlers. That makes business flows
 * easier to follow and gives routes a thin adapter role.
 */
import { NotFoundError, ValidationError } from '$lib/application/errors';
import type { BookingRepository, EventLogger, EventRepository } from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import type { Booking, CreateBookingInput, TicketWithQRCode } from '$lib/domain/booking';
import {
	AuditAction,
	AuditEntityType,
	systemAuditActor,
	type AuditActor
} from '$lib/domain/auditEvent';
import {
	canCancelBooking,
	canGenerateTickets,
	canMarkBookingPaid,
	getTopCitiesByCountOfTicketsBooked
} from '$lib/domain/booking';
import type { Ticket } from '$lib/domain/ticket';
import { normalizeTicketType } from '$lib/domain/ticket';
import { BookingPaymentStatus } from '$lib/domain/shared/enums';
import type { TicketCounterService } from '$lib/application/services/ticketCounterService';
import type { TicketService } from '$lib/application/services/ticketService';
import type { NotificationService } from '$lib/application/services/notificationService';
import type { TicketTypeService } from '$lib/application/services/ticketTypeService';

/** Coordinates booking-related use cases across repositories and other services. */
export class BookingService {
	constructor(
		private readonly bookingRepository: BookingRepository,
		private readonly eventRepository: EventRepository,
		private readonly ticketCounterService: TicketCounterService,
		private readonly ticketTypeService: TicketTypeService,
		private readonly ticketService: TicketService,
		private readonly notificationService: NotificationService,
		private readonly eventLogger: EventLogger,
		private readonly auditEventService: AuditEventService,
		private readonly randomIdGenerator: (size: number) => string
	) {}

	/** Creates a new booking and reserves inventory in one database lifecycle call. */
	async createNew(
		input: CreateBookingInput,
		actor: AuditActor = systemAuditActor
	): Promise<Booking> {
		if (input.quantity < 1 || input.quantity > 10) {
			throw new ValidationError('validation failed: quantity must be between 1 and 10');
		}

		const ticketType = normalizeTicketType(input.ticket_type);
		if (input.guests.length !== input.quantity) {
			throw new ValidationError('validation failed: guest count must match quantity');
		}

		const event = await this.eventRepository.findById(input.event_id);
		if (!event) {
			throw new NotFoundError('event not found');
		}

		const now = new Date();
		const ticketTypeConfig = await this.ticketTypeService.getAvailableForBooking(
			input.event_id,
			ticketType,
			now
		);
		const counter = await this.ticketCounterService.getByTicketType(ticketType);
		if (!counter) {
			throw new NotFoundError('ticket counter is missing');
		}
		if (counter.available < input.quantity) {
			throw new ValidationError(`Only ${counter.available} ${ticketType} tickets are available`);
		}

		const booking: Booking = {
			event_id: input.event_id,
			reference_no: this.generateBookingReferenceNo(),
			name: input.name,
			email: input.email,
			city: input.city,
			ticket_type: ticketType,
			book_date: now.toISOString(),
			payment_status: BookingPaymentStatus.UNPAID,
			amount_total: this.ticketTypeService.computePricing(
				ticketTypeConfig,
				input.guests.length,
				now
			).totalAmount,
			guests: input.guests,
			ticket_ids: [],
			payment_proof_url: input.payment_proof_url
		};

		const createdBooking = await this.bookingRepository.insertReservation(booking);
		await this.auditEventService.record({
			...actor,
			event_id: createdBooking.event_id,
			action: AuditAction.BookingCreated,
			entity_type: AuditEntityType.Booking,
			entity_id: createdBooking.reference_no,
			metadata: {
				booking_reference_no: createdBooking.reference_no,
				email: createdBooking.email,
				ticket_type: createdBooking.ticket_type,
				quantity: createdBooking.guests.length,
				amount_total: createdBooking.amount_total,
				payment_status: createdBooking.payment_status
			}
		});
		await this.notificationService.sendBookingConfirmation(createdBooking);

		this.eventLogger.log('BOOKING_RESERVATION_CREATED', createdBooking.email, {
			booking_reference_no: createdBooking.reference_no,
			count: createdBooking.guests.length,
			ticket_type: createdBooking.ticket_type,
			payment_proof_url: input.payment_proof_url
		});

		return createdBooking;
	}

	/** Loads a booking by reference number when callers can handle a missing result. */
	async getById(referenceNo: string): Promise<Booking | null> {
		return await this.bookingRepository.findByReferenceNo(referenceNo);
	}

	/** Loads a booking by reference number and fails loudly when it must exist. */
	async getRequiredById(referenceNo: string): Promise<Booking> {
		const booking = await this.getById(referenceNo);
		if (!booking) {
			throw new NotFoundError('booking not found');
		}
		return booking;
	}

	/** Returns all stored bookings for admin and reporting screens. */
	async list(): Promise<Booking[]> {
		return await this.bookingRepository.list();
	}

	/** Searches bookings by visitor-facing fields and exact ticket id. */
	async search(query: string): Promise<Booking[]> {
		const trimmedQuery = query.trim();
		if (!trimmedQuery) {
			return [];
		}

		const normalizedQuery = trimmedQuery.toLowerCase();
		const matchesQuery = (value: string): boolean => value.toLowerCase().includes(normalizedQuery);
		const resultsByReferenceNo = new Map<string, Booking>();

		const bookings = await this.list();
		for (const booking of bookings) {
			if (
				matchesQuery(booking.reference_no) ||
				matchesQuery(booking.email) ||
				matchesQuery(booking.name) ||
				booking.guests.some(matchesQuery)
			) {
				resultsByReferenceNo.set(booking.reference_no, booking);
			}
		}

		const ticket = await this.ticketService.getById(trimmedQuery);
		if (ticket) {
			const relatedBooking = await this.getById(ticket.booking_reference_no);
			if (relatedBooking) {
				resultsByReferenceNo.set(relatedBooking.reference_no, relatedBooking);
			}
		}

		return Array.from(resultsByReferenceNo.values());
	}

	/** Marks an unpaid booking as paid and moves reserved inventory into sold inventory. */
	async markPaid(referenceNo: string, actor: AuditActor = systemAuditActor): Promise<void> {
		const booking = await this.getRequiredById(referenceNo);
		if (!canMarkBookingPaid(booking)) {
			throw new ValidationError('Booking cannot be further marked as paid');
		}

		await this.bookingRepository.markPaid(booking.reference_no);
		await this.auditEventService.record({
			...actor,
			event_id: booking.event_id,
			action: AuditAction.BookingMarkedPaid,
			entity_type: AuditEntityType.Booking,
			entity_id: booking.reference_no,
			metadata: {
				booking_reference_no: booking.reference_no,
				email: booking.email,
				previous_payment_status: booking.payment_status,
				payment_status: BookingPaymentStatus.PAID,
				ticket_type: booking.ticket_type,
				quantity: booking.guests.length,
				amount_total: booking.amount_total
			}
		});

		this.eventLogger.log('BOOKING_MARKED_AS_PAID', 'system', {
			booking_reference_no: booking.reference_no,
			email: booking.email,
			payment_status: BookingPaymentStatus.PAID
		});
	}

	/** Creates any missing tickets for a paid booking without duplicating existing ones. */
	async generateRelatedTickets(
		referenceNo: string,
		actor: AuditActor = systemAuditActor
	): Promise<string[]> {
		const booking = await this.getRequiredById(referenceNo);
		if (!canGenerateTickets(booking)) {
			throw new ValidationError('Booking is in a state where it cannot generate tickets');
		}

		if (booking.ticket_ids.length >= booking.guests.length) {
			return [];
		}

		const ticketIds: string[] = [];
		const guestsWithoutTickets = booking.guests.slice(booking.ticket_ids.length);
		for (const guest of guestsWithoutTickets) {
			const ticket = await this.ticketService.createNew(
				{
					name: guest,
					ticket_type: booking.ticket_type,
					description: '',
					booking_reference_no: referenceNo,
					is_paid: true
				},
				actor
			);

			await this.bookingRepository.appendTicketId(referenceNo, ticket.ticket_id);
			ticketIds.push(ticket.ticket_id);
			this.eventLogger.log('TICKET_APPENDED_TO_BOOKING', 'system', {
				booking_reference_no: booking.reference_no,
				booking_email: booking.email,
				related_ticket_id: ticket.ticket_id,
				related_ticket_guest_name: ticket.name
			});
		}

		if (ticketIds.length > 0) {
			await this.auditEventService.record({
				...actor,
				event_id: booking.event_id,
				action: AuditAction.BookingTicketsGenerated,
				entity_type: AuditEntityType.Booking,
				entity_id: booking.reference_no,
				metadata: {
					booking_reference_no: booking.reference_no,
					email: booking.email,
					ticket_type: booking.ticket_type,
					quantity: ticketIds.length,
					ticket_ids: ticketIds
				}
			});
		}

		return ticketIds;
	}

	/** Resolves all tickets referenced by a booking. */
	async getRelatedTickets(referenceNo: string): Promise<Ticket[]> {
		const booking = await this.getRequiredById(referenceNo);
		const tickets = await Promise.all(
			booking.ticket_ids.map(async (ticketId) => await this.ticketService.getById(ticketId))
		);
		return tickets.filter((ticket): ticket is Ticket => Boolean(ticket));
	}

	/** Enriches booking tickets with QR code payloads for email or detail screens. */
	async getRelatedTicketsWithCheckinQRCode(referenceNo: string): Promise<TicketWithQRCode[]> {
		const tickets = await this.getRelatedTickets(referenceNo);
		return await Promise.all(
			tickets.map(async (ticket) => ({
				ticket,
				qrCodeData: await this.ticketService.getCheckinQRCode(ticket.ticket_id, referenceNo)
			}))
		);
	}

	/** Cancels an unpaid reservation and returns its reserved inventory to availability. */
	async cancelBookingReservation(
		referenceNo: string,
		actor: AuditActor = systemAuditActor
	): Promise<void> {
		const booking = await this.getRequiredById(referenceNo);
		if (!canCancelBooking(booking)) {
			throw new ValidationError('Only UNPAID Bookings can be cancelled');
		}

		await this.bookingRepository.cancelReservation(referenceNo);
		await this.auditEventService.record({
			...actor,
			event_id: booking.event_id,
			action: AuditAction.BookingCancelled,
			entity_type: AuditEntityType.Booking,
			entity_id: booking.reference_no,
			metadata: {
				booking_reference_no: booking.reference_no,
				email: booking.email,
				ticket_type: booking.ticket_type,
				quantity: booking.guests.length,
				previous_payment_status: booking.payment_status,
				payment_status: BookingPaymentStatus.BOOKING_RESERVATION_CANCELLED
			}
		});

		this.eventLogger.log('BOOKING_RESERVATION_CANCELLED', 'system', {
			booking_reference_no: booking.reference_no,
			booking_email: booking.email,
			ticket_type: booking.ticket_type,
			count: booking.guests.length
		});
	}

	/** Delegates city aggregation to the domain so reporting logic stays reusable. */
	getTopCitiesByCountOfTicketsBooked(bookings: Booking[]) {
		return getTopCitiesByCountOfTicketsBooked(bookings);
	}

	/** Generates the booking reference format used throughout the app. */
	private generateBookingReferenceNo(): string {
		const part1 = this.randomIdGenerator(3);
		const part2 = this.randomIdGenerator(4);
		return `B${part1}${part2}`;
	}
}

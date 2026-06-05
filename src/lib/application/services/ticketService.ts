/**
 * Purpose:
 * This service owns ticket creation and check-in/check-out behavior.
 *
 * Why this structure is good:
 * Ticket workflows combine domain rules, persistence, QR generation, storage,
 * and logging. Keeping that orchestration in one application service makes the
 * route layer thinner and keeps infrastructure details out of domain code.
 */
import { NotFoundError, ValidationError } from '$lib/application/errors';
import type {
	BookingRepository,
	EventLogger,
	ImageStorage,
	QrCodeGenerator,
	TicketRepository
} from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import {
	AuditAction,
	AuditEntityType,
	systemAuditActor,
	type AuditActor
} from '$lib/domain/auditEvent';
import type { CreateTicketInput, QRCode, Ticket } from '$lib/domain/ticket';
import { canCheckInTicket, canCheckOutTicket, normalizeTicketType } from '$lib/domain/ticket';
import { TicketStatus } from '$lib/domain/shared/enums';

/** Coordinates ticket lifecycle use cases and related side effects. */
export class TicketService {
	constructor(
		private readonly bookingRepository: BookingRepository,
		private readonly ticketRepository: TicketRepository,
		private readonly imageStorage: ImageStorage,
		private readonly qrCodeGenerator: QrCodeGenerator,
		private readonly eventLogger: EventLogger,
		private readonly auditEventService: AuditEventService,
		private readonly appBaseUrl: string,
		private readonly eventId: string,
		private readonly randomIdGenerator: (size: number) => string
	) {}

	/** Creates a ticket, generates its QR code, and stores its check-in asset. */
	async createNew(input: CreateTicketInput, actor: AuditActor = systemAuditActor): Promise<Ticket> {
		const ticketType = normalizeTicketType(input.ticket_type);
		const ticketId = this.generateTicketId();
		const qrCode = await this.getCheckinQRCode(ticketId, input.booking_reference_no);
		const qrCodeImageUrl = await this.imageStorage.uploadImage(qrCode.imageData);

		const ticket: Ticket = {
			ticket_id: ticketId,
			name: input.name,
			ticket_type: ticketType,
			description: input.description,
			status: TicketStatus.CREATED,
			is_paid: input.is_paid,
			booking_reference_no: input.booking_reference_no,
			checkin_qr_code_image_url: qrCodeImageUrl
		};

		await this.ticketRepository.insert(ticket);
		await this.auditEventService.record({
			...actor,
			event_id: this.eventId,
			action: AuditAction.TicketCreated,
			entity_type: AuditEntityType.Ticket,
			entity_id: ticket.ticket_id,
			metadata: {
				ticket_id: ticket.ticket_id,
				ticket_guest_name: ticket.name,
				ticket_type: ticket.ticket_type,
				booking_reference_no: ticket.booking_reference_no,
				status: ticket.status
			}
		});
		this.eventLogger.log('TICKET_CREATED', 'system', {
			ticket_id: ticket.ticket_id,
			ticket_guest_name: ticket.name,
			related_booking_reference_no: ticket.booking_reference_no
		});

		return ticket;
	}

	/** Loads a ticket when callers can handle a missing result. */
	async getById(ticketId: string): Promise<Ticket | null> {
		return await this.ticketRepository.findByTicketId(ticketId);
	}

	/** Loads a ticket and throws when the id must be valid. */
	async getRequiredById(ticketId: string): Promise<Ticket> {
		const ticket = await this.getById(ticketId);
		if (!ticket) {
			throw new NotFoundError('ticket not found');
		}
		return ticket;
	}

	/** Returns all tickets for admin screens and reporting. */
	async getAll(): Promise<Ticket[]> {
		return await this.ticketRepository.list();
	}

	/** Deletes a ticket by id. */
	async deleteById(ticketId: string): Promise<void> {
		await this.ticketRepository.deleteByTicketId(ticketId);
	}

	/** Checks in a ticket if the booking and ticket state allow it. */
	async checkIn(ticketId: string, actor: AuditActor = systemAuditActor): Promise<void> {
		const { ticket, booking } = await this.getTicketAndBooking(ticketId);
		if (!canCheckInTicket(booking, ticket)) {
			throw new ValidationError('ticket state is not allowed for check in');
		}

		await this.ticketRepository.updateStatus(ticketId, TicketStatus.CHECKED_IN);
		await this.auditEventService.record({
			...actor,
			event_id: this.eventId,
			action: AuditAction.TicketCheckedIn,
			entity_type: AuditEntityType.Ticket,
			entity_id: ticket.ticket_id,
			metadata: {
				ticket_id: ticket.ticket_id,
				ticket_guest_name: ticket.name,
				ticket_type: ticket.ticket_type,
				booking_reference_no: ticket.booking_reference_no,
				previous_status: ticket.status,
				status: TicketStatus.CHECKED_IN
			}
		});
		this.eventLogger.log('TICKET_CHECKED_IN', 'system', {
			ticket_id: ticket.ticket_id,
			ticket_guest_name: ticket.name,
			related_booking_reference_no: ticket.booking_reference_no
		});
	}

	/** Checks out a previously checked-in ticket when allowed by state. */
	async checkOut(ticketId: string, actor: AuditActor = systemAuditActor): Promise<void> {
		const { ticket, booking } = await this.getTicketAndBooking(ticketId);
		if (!canCheckOutTicket(booking, ticket)) {
			throw new ValidationError('ticket state is not allowed for check out');
		}

		await this.ticketRepository.updateStatus(ticketId, TicketStatus.CHECKED_OUT);
		await this.auditEventService.record({
			...actor,
			event_id: this.eventId,
			action: AuditAction.TicketCheckedOut,
			entity_type: AuditEntityType.Ticket,
			entity_id: ticket.ticket_id,
			metadata: {
				ticket_id: ticket.ticket_id,
				ticket_guest_name: ticket.name,
				ticket_type: ticket.ticket_type,
				booking_reference_no: ticket.booking_reference_no,
				previous_status: ticket.status,
				status: TicketStatus.CHECKED_OUT
			}
		});
		this.eventLogger.log('TICKET_CHECKED_OUT', 'system', {
			ticket_id: ticket.ticket_id,
			ticket_guest_name: ticket.name,
			related_booking_reference_no: ticket.booking_reference_no
		});
	}

	/** Builds the app URL and QR payload used for ticket check-in. */
	async getCheckinQRCode(ticketId: string, bookingReferenceNo: string): Promise<QRCode> {
		const encodedToken = Buffer.from(`${bookingReferenceNo}:${ticketId}`).toString('base64');
		const encodedEventId = encodeURIComponent(this.eventId);
		const encodedTicketId = encodeURIComponent(ticketId);
		const url = `${this.appBaseUrl}/admin/events/${encodedEventId}/tickets/${encodedTicketId}/checkin?token=${encodedToken}`;
		const qrCodeImage = await this.qrCodeGenerator.generate(url);

		return {
			imageData: qrCodeImage,
			targetURL: url
		};
	}

	/** Loads the ticket together with its parent booking for state validation. */
	private async getTicketAndBooking(ticketId: string) {
		const ticket = await this.getRequiredById(ticketId);
		const booking = await this.bookingRepository.findByReferenceNo(ticket.booking_reference_no);
		if (!booking) {
			throw new NotFoundError('booking not found');
		}
		return { ticket, booking };
	}

	/** Generates the user-visible ticket id format. */
	private generateTicketId(): string {
		const part1 = this.randomIdGenerator(3);
		const part2 = this.randomIdGenerator(4);
		return `T${part1}-${part2}`;
	}
}

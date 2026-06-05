import { describe, expect, it, vi } from 'vitest';
import type {
	BookingRepository,
	EventLogger,
	ImageStorage,
	QrCodeGenerator,
	TicketRepository
} from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import { TicketService } from '$lib/application/services/ticketService';
import { AuditAction, AuditActorType, AuditEntityType } from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
	return {
		event_id: 'gfeu2026',
		reference_no: 'BREF001',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		city: 'Dublin',
		ticket_type: TicketType.STANDARD,
		book_date: '2026-01-01T00:00:00.000Z',
		payment_status: BookingPaymentStatus.PAID,
		amount_total: 35,
		guests: ['Ada Lovelace'],
		ticket_ids: ['TICKET123'],
		...overrides
	};
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
	return {
		ticket_id: 'TICKET123',
		name: 'Ada Lovelace',
		ticket_type: TicketType.STANDARD,
		description: '',
		status: TicketStatus.CREATED,
		is_paid: true,
		booking_reference_no: 'BREF001',
		checkin_qr_code_image_url: 'https://example.com/qr.png',
		...overrides
	};
}

function makeService(ticket: Ticket = makeTicket(), booking: Booking = makeBooking()) {
	const bookingRepository = {
		findByReferenceNo: vi.fn(async () => booking)
	} as unknown as BookingRepository;
	const ticketRepository = {
		insert: vi.fn(async () => ticket.ticket_id),
		findByTicketId: vi.fn(async () => ticket),
		list: vi.fn(),
		updateStatus: vi.fn(),
		deleteByTicketId: vi.fn()
	} satisfies TicketRepository;
	const imageStorage = {
		uploadImage: vi.fn(async () => 'https://example.com/qr.png')
	} satisfies ImageStorage;
	const qrCodeGenerator = {
		generate: vi.fn(async () => 'data:image/png;base64,qr')
	} satisfies QrCodeGenerator;
	const eventLogger = { log: vi.fn() } satisfies EventLogger;
	const auditEventService = { record: vi.fn() } as unknown as AuditEventService;

	const service = new TicketService(
		bookingRepository,
		ticketRepository,
		imageStorage,
		qrCodeGenerator,
		eventLogger,
		auditEventService,
		'https://example.com',
		'gfeu2026',
		() => 'ABC'
	);

	return {
		service,
		ticketRepository,
		auditEventService: auditEventService as AuditEventService & {
			record: ReturnType<typeof vi.fn>;
		}
	};
}

describe('TicketService audit events', () => {
	it('records ticket.created after ticket insert succeeds', async () => {
		const { service, auditEventService } = makeService();

		const ticket = await service.createNew({
			name: 'Ada Lovelace',
			ticket_type: TicketType.STANDARD,
			description: '',
			booking_reference_no: 'BREF001',
			is_paid: true
		});

		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.TicketCreated,
				entity_type: AuditEntityType.Ticket,
				entity_id: ticket.ticket_id,
				metadata: expect.objectContaining({
					booking_reference_no: 'BREF001',
					ticket_type: TicketType.STANDARD,
					status: TicketStatus.CREATED
				})
			})
		);
	});

	it('records ticket.checked_in after status update succeeds', async () => {
		const { service, ticketRepository, auditEventService } = makeService();

		await service.checkIn('TICKET123', {
			actor_type: AuditActorType.Admin,
			actor_email: 'admin@example.test'
		});

		expect(ticketRepository.updateStatus).toHaveBeenCalledWith(
			'TICKET123',
			TicketStatus.CHECKED_IN
		);
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				action: AuditAction.TicketCheckedIn,
				actor_type: AuditActorType.Admin,
				entity_type: AuditEntityType.Ticket,
				entity_id: 'TICKET123',
				metadata: expect.objectContaining({
					previous_status: TicketStatus.CREATED,
					status: TicketStatus.CHECKED_IN
				})
			})
		);
	});

	it('records ticket.checked_out after status update succeeds', async () => {
		const ticket = makeTicket({ status: TicketStatus.CHECKED_IN });
		const { service, auditEventService } = makeService(ticket);

		await service.checkOut('TICKET123', {
			actor_type: AuditActorType.Admin,
			actor_email: 'admin@example.test'
		});

		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.TicketCheckedOut,
				entity_type: AuditEntityType.Ticket,
				entity_id: 'TICKET123',
				metadata: expect.objectContaining({
					previous_status: TicketStatus.CHECKED_IN,
					status: TicketStatus.CHECKED_OUT
				})
			})
		);
	});
});

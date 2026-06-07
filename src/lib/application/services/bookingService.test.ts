import { describe, expect, it, vi } from 'vitest';
import { AppError } from '$lib/application/errors';
import { BookingService } from '$lib/application/services/bookingService';
import type { NotificationService } from '$lib/application/services/notificationService';
import type { TicketCounterService } from '$lib/application/services/ticketCounterService';
import type { TicketService } from '$lib/application/services/ticketService';
import type { TicketTypeService } from '$lib/application/services/ticketTypeService';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import type { BookingRepository, EventLogger, EventRepository } from '$lib/application/ports';
import { AuditAction, AuditEntityType } from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import type { Event } from '$lib/domain/event';
import {
	BookingConfirmationEmailStatus,
	BookingPaymentStatus,
	TicketStatus,
	TicketType
} from '$lib/domain/shared/enums';
import type { CreateTicketInput, Ticket } from '$lib/domain/ticket';
import { computeTicketPricing, type TicketTypeConfig } from '$lib/domain/ticketType';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
	return {
		event_id: 'gfeu2026',
		reference_no: 'BREF001',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		city: 'Dublin',
		ticket_type: TicketType.STANDARD,
		book_date: '2026-01-01T00:00:00.000Z',
		payment_status: BookingPaymentStatus.UNPAID,
		amount_total: 35,
		guests: ['Ada Lovelace'],
		ticket_ids: [],
		tickets_sent_to_client: false,
		booking_confirmation_email_status: BookingConfirmationEmailStatus.UNKNOWN,
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

function makeEvent(overrides: Partial<Event> = {}): Event {
	return {
		event_id: 'gfeu2026',
		title: 'Together 2026',
		short_description: 'A Grand Feast event.',
		country: 'Ireland',
		venue: "St. Helen's Hotel",
		datetime: '2026-10-03T11:00:00.000Z',
		timezone: 'Europe/Dublin',
		theme_main_color: '#005B72',
		theme_sub_color: '#E7F6F9',
		theme_highlight_color: '#D99A32',
		theme_on_main_color: '#FFFFFF',
		...overrides
	};
}

function makeTicketType(overrides: Partial<TicketTypeConfig> = {}): TicketTypeConfig {
	return {
		event_id: 'gfeu2026',
		ticket_type_id: TicketType.STANDARD,
		label: 'Standard',
		description: 'General admission',
		base_price: 35,
		currency: 'EUR',
		sort_order: 10,
		is_active: true,
		...overrides
	};
}

function makeService(
	bookings: Booking[],
	tickets: Ticket[] = [],
	events: Event[] = [makeEvent()],
	ticketTypes: TicketTypeConfig[] = [makeTicketType()]
) {
	const bookingRepository = {
		insertReservation: vi.fn(async (booking: Booking) => booking),
		findByReferenceNo: vi.fn(
			async (referenceNo: string) =>
				bookings.find((booking) => booking.reference_no === referenceNo) ?? null
		),
		list: vi.fn(async () => bookings),
		markPaid: vi.fn(),
		cancelReservation: vi.fn(),
		appendTicketId: vi.fn(),
		markTicketsSentToClient: vi.fn(),
		updateBookingConfirmationEmailStatus: vi.fn()
	} satisfies BookingRepository;

	const eventRepository = {
		findById: vi.fn(
			async (eventId: string) => events.find((event) => event.event_id === eventId) ?? null
		),
		list: vi.fn(async () => events)
	} satisfies EventRepository;

	const ticketService = {
		getById: vi.fn(
			async (ticketId: string) => tickets.find((ticket) => ticket.ticket_id === ticketId) ?? null
		),
		createNew: vi.fn(async (input: CreateTicketInput) =>
			makeTicket({
				ticket_id: `TICKET${input.name.replace(/\s+/g, '').toUpperCase()}`,
				name: input.name,
				ticket_type: input.ticket_type as TicketType,
				booking_reference_no: input.booking_reference_no
			})
		)
	} as unknown as TicketService;
	const ticketCounterService = {
		getByTicketType: vi.fn(async () => ({
			_id: 'STANDARD',
			available: 10,
			reserved: 0,
			sold: 0
		}))
	} as unknown as TicketCounterService;
	const ticketTypeService = {
		getAvailableForBooking: vi.fn(async (eventId: string, ticketTypeId: string) => {
			const ticketType = ticketTypes.find(
				(candidate) => candidate.event_id === eventId && candidate.ticket_type_id === ticketTypeId
			);
			if (!ticketType) throw new Error('ticket type not found');
			if (!ticketType.is_active) throw new Error('ticket type is not available');
			return ticketType;
		}),
		computePricing: vi.fn((ticketType: TicketTypeConfig, quantity: number) =>
			computeTicketPricing(ticketType, quantity)
		)
	} as unknown as TicketTypeService;
	const notificationService = {
		sendBookingConfirmation: vi.fn(async () => ({
			status: 'SENT' as const,
			providerMessageId: 'email_123'
		}))
	} as unknown as NotificationService;
	const auditEventService = {
		record: vi.fn()
	} as unknown as AuditEventService;

	const service = new BookingService(
		bookingRepository,
		eventRepository,
		ticketCounterService,
		ticketTypeService,
		ticketService,
		notificationService,
		{ log: vi.fn() } satisfies EventLogger,
		auditEventService,
		() => 'ABC'
	);

	return {
		service,
		bookingRepository,
		eventRepository,
		ticketTypeService: ticketTypeService as TicketTypeService & {
			getAvailableForBooking: ReturnType<typeof vi.fn>;
		},
		ticketService: ticketService as TicketService & {
			createNew: ReturnType<typeof vi.fn>;
			getById: ReturnType<typeof vi.fn>;
		},
		notificationService: notificationService as NotificationService & {
			sendBookingConfirmation: ReturnType<typeof vi.fn>;
		},
		auditEventService: auditEventService as AuditEventService & {
			record: ReturnType<typeof vi.fn>;
		}
	};
}

describe('BookingService.search', () => {
	it('finds by exact booking reference', async () => {
		const booking = makeBooking({ reference_no: 'BREF777' });
		const { service } = makeService([booking]);

		await expect(service.search('BREF777')).resolves.toEqual([booking]);
	});

	it('finds by email case-insensitively', async () => {
		const booking = makeBooking({ email: 'Ada.Example@GrandFeast.eu' });
		const { service } = makeService([booking]);

		await expect(service.search('ada.example@grandfeast.eu')).resolves.toEqual([booking]);
	});

	it('finds by booking name case-insensitively', async () => {
		const booking = makeBooking({ name: 'Grace Hopper' });
		const { service } = makeService([booking]);

		await expect(service.search('grace')).resolves.toEqual([booking]);
	});

	it('finds by any guest name, including non-primary guests', async () => {
		const booking = makeBooking({ name: 'Ada Lovelace', guests: ['Ada Lovelace', 'Mary Jackson'] });
		const { service } = makeService([booking]);

		await expect(service.search('mary')).resolves.toEqual([booking]);
	});

	it('finds by exact ticket id and resolves the related booking', async () => {
		const booking = makeBooking({ reference_no: 'BREF555', ticket_ids: ['TICKET123'] });
		const ticket = makeTicket({ ticket_id: 'TICKET123', booking_reference_no: 'BREF555' });
		const { service } = makeService([booking], [ticket]);

		await expect(service.search('TICKET123')).resolves.toEqual([booking]);
	});

	it('deduplicates when a query matches booking fields and a related ticket', async () => {
		const booking = makeBooking({ reference_no: 'TICKET123', ticket_ids: ['TICKET123'] });
		const ticket = makeTicket({ ticket_id: 'TICKET123', booking_reference_no: 'TICKET123' });
		const { service } = makeService([booking], [ticket]);

		await expect(service.search('TICKET123')).resolves.toEqual([booking]);
	});

	it('returns an empty array for blank or unmatched queries', async () => {
		const booking = makeBooking();
		const { service, bookingRepository } = makeService([booking]);

		await expect(service.search('   ')).resolves.toEqual([]);
		expect(bookingRepository.list).not.toHaveBeenCalled();
		await expect(service.search('not-present')).resolves.toEqual([]);
	});
});

describe('BookingService.createNew', () => {
	it('persists the uploaded payment proof URL with the booking', async () => {
		const { service, bookingRepository, auditEventService } = makeService([]);

		const booking = await service.createNew({
			event_id: 'gfeu2026',
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			city: 'Dublin',
			ticket_type: TicketType.STANDARD,
			quantity: 1,
			guests: ['Ada Lovelace'],
			payment_proof_url: 'https://res.cloudinary.com/demo/proof.pdf'
		});

		expect(booking.payment_proof_url).toBe('https://res.cloudinary.com/demo/proof.pdf');
		expect(bookingRepository.insertReservation).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				payment_proof_url: 'https://res.cloudinary.com/demo/proof.pdf'
			})
		);
		expect(bookingRepository.updateBookingConfirmationEmailStatus).toHaveBeenCalledWith(
			booking.reference_no,
			BookingConfirmationEmailStatus.SENT,
			undefined,
			'email_123'
		);
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				action: AuditAction.BookingCreated,
				entity_type: AuditEntityType.Booking,
				entity_id: booking.reference_no,
				metadata: expect.not.objectContaining({
					payment_proof_url: expect.anything()
				})
			})
		);
	});

	it('records a failed confirmation email without losing the booking', async () => {
		const { service, bookingRepository, notificationService } = makeService([]);
		notificationService.sendBookingConfirmation.mockRejectedValueOnce(
			new AppError('email svc: failed to send email:invalid recipient', 422, 'EMAIL_ERROR')
		);

		const booking = await service.createNew({
			event_id: 'gfeu2026',
			name: 'Ada Lovelace',
			email: 'typo@example.invalid',
			city: 'Dublin',
			ticket_type: TicketType.STANDARD,
			quantity: 1,
			guests: ['Ada Lovelace']
		});

		expect(booking.booking_confirmation_email_status).toBe(BookingConfirmationEmailStatus.FAILED);
		expect(booking.booking_confirmation_email_error).toContain('invalid recipient');
		expect(bookingRepository.insertReservation).toHaveBeenCalled();
		expect(bookingRepository.updateBookingConfirmationEmailStatus).toHaveBeenCalledWith(
			booking.reference_no,
			BookingConfirmationEmailStatus.FAILED,
			'email svc: failed to send email:invalid recipient'
		);
	});

	it('uses DB-backed ticket type pricing when creating the booking', async () => {
		const { service, bookingRepository } = makeService(
			[],
			[],
			[makeEvent()],
			[
				makeTicketType({
					early_bird_discount_available_until: '2099-08-31T23:59:59+01:00',
					early_bird_discount_amount: 5
				})
			]
		);

		await service.createNew({
			event_id: 'gfeu2026',
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			city: 'Dublin',
			ticket_type: TicketType.STANDARD,
			quantity: 2,
			guests: ['Ada Lovelace', 'Grace Hopper']
		});

		expect(bookingRepository.insertReservation).toHaveBeenCalledWith(
			expect.objectContaining({
				amount_total: 60
			})
		);
	});

	it('fails before reserving inventory when the event does not exist', async () => {
		const { service, bookingRepository, eventRepository } = makeService([], [], []);

		await expect(
			service.createNew({
				event_id: 'missing-event',
				name: 'Ada Lovelace',
				email: 'ada@example.com',
				city: 'Dublin',
				ticket_type: TicketType.STANDARD,
				quantity: 1,
				guests: ['Ada Lovelace']
			})
		).rejects.toThrow('event not found');

		expect(eventRepository.findById).toHaveBeenCalledWith('missing-event');
		expect(bookingRepository.insertReservation).not.toHaveBeenCalled();
	});

	it('fails before reserving inventory when the ticket type is missing', async () => {
		const { service, bookingRepository, ticketTypeService } = makeService(
			[],
			[],
			[makeEvent()],
			[]
		);

		await expect(
			service.createNew({
				event_id: 'gfeu2026',
				name: 'Ada Lovelace',
				email: 'ada@example.com',
				city: 'Dublin',
				ticket_type: TicketType.STANDARD,
				quantity: 1,
				guests: ['Ada Lovelace']
			})
		).rejects.toThrow('ticket type not found');

		expect(ticketTypeService.getAvailableForBooking).toHaveBeenCalledWith(
			'gfeu2026',
			TicketType.STANDARD,
			expect.any(Date)
		);
		expect(bookingRepository.insertReservation).not.toHaveBeenCalled();
	});

	it('fails before reserving inventory when the ticket type is inactive', async () => {
		const { service, bookingRepository } = makeService(
			[],
			[],
			[makeEvent()],
			[makeTicketType({ is_active: false })]
		);

		await expect(
			service.createNew({
				event_id: 'gfeu2026',
				name: 'Ada Lovelace',
				email: 'ada@example.com',
				city: 'Dublin',
				ticket_type: TicketType.STANDARD,
				quantity: 1,
				guests: ['Ada Lovelace']
			})
		).rejects.toThrow('ticket type is not available');

		expect(bookingRepository.insertReservation).not.toHaveBeenCalled();
	});
});

describe('BookingService audit events', () => {
	it('records booking.marked_paid after payment state changes', async () => {
		const booking = makeBooking();
		const { service, auditEventService } = makeService([booking]);

		await service.markPaid(booking.reference_no);

		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				action: AuditAction.BookingMarkedPaid,
				entity_type: AuditEntityType.Booking,
				entity_id: booking.reference_no,
				metadata: expect.objectContaining({
					previous_payment_status: BookingPaymentStatus.UNPAID,
					payment_status: BookingPaymentStatus.PAID
				})
			})
		);
	});

	it('records booking.cancelled after reservation cancellation', async () => {
		const booking = makeBooking();
		const { service, auditEventService } = makeService([booking]);

		await service.cancelBookingReservation(booking.reference_no);

		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				action: AuditAction.BookingCancelled,
				entity_type: AuditEntityType.Booking,
				entity_id: booking.reference_no,
				metadata: expect.objectContaining({
					previous_payment_status: BookingPaymentStatus.UNPAID,
					payment_status: BookingPaymentStatus.BOOKING_RESERVATION_CANCELLED
				})
			})
		);
	});

	it('records booking.tickets_generated after missing tickets are appended', async () => {
		const booking = makeBooking({
			payment_status: BookingPaymentStatus.PAID,
			guests: ['Ada Lovelace', 'Grace Hopper'],
			ticket_ids: []
		});
		const { service, auditEventService, bookingRepository } = makeService([booking]);

		const ticketIds = await service.generateRelatedTickets(booking.reference_no);

		expect(ticketIds).toEqual(['TICKETADALOVELACE', 'TICKETGRACEHOPPER']);
		expect(bookingRepository.appendTicketId).toHaveBeenCalledTimes(2);
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.BookingTicketsGenerated,
				entity_type: AuditEntityType.Booking,
				entity_id: booking.reference_no,
				metadata: expect.objectContaining({
					quantity: 2,
					ticket_ids: ticketIds
				})
			})
		);
	});
});

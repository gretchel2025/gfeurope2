import { describe, expect, it, vi } from 'vitest';
import { BookingService } from '$lib/application/services/bookingService';
import type { NotificationService } from '$lib/application/services/notificationService';
import type { TicketCounterService } from '$lib/application/services/ticketCounterService';
import type { TicketService } from '$lib/application/services/ticketService';
import type { BookingRepository, EventLogger } from '$lib/application/ports';
import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
	return {
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

function makeService(bookings: Booking[], tickets: Ticket[] = []) {
	const bookingRepository = {
		insertReservation: vi.fn(),
		findByReferenceNo: vi.fn(
			async (referenceNo: string) =>
				bookings.find((booking) => booking.reference_no === referenceNo) ?? null
		),
		list: vi.fn(async () => bookings),
		markPaid: vi.fn(),
		cancelReservation: vi.fn(),
		appendTicketId: vi.fn()
	} satisfies BookingRepository;

	const ticketService = {
		getById: vi.fn(
			async (ticketId: string) => tickets.find((ticket) => ticket.ticket_id === ticketId) ?? null
		)
	} as unknown as TicketService;

	const service = new BookingService(
		bookingRepository,
		{} as TicketCounterService,
		ticketService,
		{} as NotificationService,
		{ log: vi.fn() } satisfies EventLogger,
		() => 'ABC'
	);

	return {
		service,
		bookingRepository,
		ticketService: ticketService as TicketService & { getById: ReturnType<typeof vi.fn> }
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

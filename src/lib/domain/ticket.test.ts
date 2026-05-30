import { describe, expect, it } from 'vitest';
import type { Booking } from '$lib/domain/booking';
import {
	canCheckInTicket,
	canCheckOutTicket,
	normalizeTicketType,
	type Ticket
} from '$lib/domain/ticket';
import {
	BookingPaymentStatus,
	TicketPrice,
	TicketStatus,
	TicketType
} from '$lib/domain/shared/enums';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
	return {
		event_id: 'gfeu2026',
		reference_no: 'BTEST001',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		city: 'Berlin',
		ticket_type: TicketType.STANDARD,
		book_date: '2026-01-01T00:00:00.000Z',
		payment_status: BookingPaymentStatus.PAID,
		amount_total: TicketPrice.STANDARD,
		guests: ['Ada'],
		ticket_ids: ['TTEST001'],
		...overrides
	};
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
	return {
		ticket_id: 'TTEST001',
		name: 'Ada Lovelace',
		ticket_type: TicketType.STANDARD,
		description: '',
		status: TicketStatus.CREATED,
		is_paid: true,
		booking_reference_no: 'BTEST001',
		checkin_qr_code_image_url: 'https://example.com/qr.png',
		...overrides
	};
}

describe('ticket domain rules', () => {
	it('normalizes known ticket type input and defaults unknown input to standard', () => {
		expect(normalizeTicketType('GRAND_FEAST_PLUS')).toBe(TicketType.GRAND_FEAST_PLUS);
		expect(normalizeTicketType('vip')).toBe(TicketType.GRAND_FEAST_PLUS);
		expect(normalizeTicketType('YOUTH')).toBe(TicketType.STANDARD);
		expect(normalizeTicketType('surprise-me')).toBe(TicketType.STANDARD);
	});

	it('checks in only paid booking tickets that are not already checked in', () => {
		expect(canCheckInTicket(makeBooking(), makeTicket({ status: TicketStatus.CREATED }))).toBe(
			true
		);
		expect(canCheckInTicket(makeBooking(), makeTicket({ status: TicketStatus.CHECKED_IN }))).toBe(
			false
		);
		expect(
			canCheckInTicket(
				makeBooking({ payment_status: BookingPaymentStatus.UNPAID }),
				makeTicket({ status: TicketStatus.CREATED })
			)
		).toBe(false);
	});

	it('checks out only paid booking tickets that are currently checked in', () => {
		expect(canCheckOutTicket(makeBooking(), makeTicket({ status: TicketStatus.CHECKED_IN }))).toBe(
			true
		);
		expect(canCheckOutTicket(makeBooking(), makeTicket({ status: TicketStatus.CREATED }))).toBe(
			false
		);
		expect(
			canCheckOutTicket(
				makeBooking({ payment_status: BookingPaymentStatus.UNPAID }),
				makeTicket({ status: TicketStatus.CHECKED_IN })
			)
		).toBe(false);
	});
});

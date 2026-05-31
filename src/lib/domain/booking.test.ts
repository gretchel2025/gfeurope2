import { describe, expect, it } from 'vitest';
import {
	canCancelBooking,
	canGenerateTickets,
	canMarkBookingPaid,
	getTopCitiesByCountOfTicketsBooked,
	type Booking
} from '$lib/domain/booking';
import { BookingPaymentStatus, TicketType } from '$lib/domain/shared/enums';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
	return {
		event_id: 'gfeu2026',
		reference_no: 'BTEST001',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		city: 'Berlin',
		ticket_type: TicketType.STANDARD,
		book_date: '2026-01-01T00:00:00.000Z',
		payment_status: BookingPaymentStatus.UNPAID,
		amount_total: 35,
		guests: ['Ada'],
		ticket_ids: [],
		...overrides
	};
}

describe('booking domain rules', () => {
	it('only allows unpaid bookings to be marked paid or cancelled', () => {
		const unpaidBooking = makeBooking({ payment_status: BookingPaymentStatus.UNPAID });
		const paidBooking = makeBooking({ payment_status: BookingPaymentStatus.PAID });

		expect(canMarkBookingPaid(unpaidBooking)).toBe(true);
		expect(canCancelBooking(unpaidBooking)).toBe(true);
		expect(canMarkBookingPaid(paidBooking)).toBe(false);
		expect(canCancelBooking(paidBooking)).toBe(false);
	});

	it('generates tickets only for paid bookings with missing ticket ids', () => {
		expect(canGenerateTickets(makeBooking({ payment_status: BookingPaymentStatus.UNPAID }))).toBe(
			false
		);
		expect(canGenerateTickets(makeBooking({ payment_status: BookingPaymentStatus.PAID }))).toBe(
			true
		);
		expect(
			canGenerateTickets(
				makeBooking({
					payment_status: BookingPaymentStatus.PAID,
					guests: ['Ada'],
					ticket_ids: ['TICKET-1']
				})
			)
		).toBe(false);
	});

	it('normalizes city reporting aliases and counts tickets, not booking rows', () => {
		const stats = getTopCitiesByCountOfTicketsBooked([
			makeBooking({
				city: 'Belrin',
				guests: ['Ada', 'Grace'],
				payment_status: BookingPaymentStatus.PAID
			}),
			makeBooking({
				city: 'Bruxelles',
				guests: ['Linus'],
				payment_status: BookingPaymentStatus.UNPAID
			}),
			makeBooking({
				city: 'Feast Brussels',
				guests: ['Katherine'],
				payment_status: BookingPaymentStatus.PAID
			})
		]);

		expect(stats).toEqual([
			expect.objectContaining({
				cityName: 'berlin',
				totalBookings: 2,
				totalPaidBookings: 2,
				totalUnpaidBookings: 0
			}),
			expect.objectContaining({
				cityName: 'brussels',
				totalBookings: 2,
				totalPaidBookings: 1,
				totalUnpaidBookings: 1
			})
		]);
	});
});

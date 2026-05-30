import { describe, expect, it } from 'vitest';
import {
	canCancelBooking,
	canGenerateTickets,
	canMarkBookingPaid,
	computeFamilyDiscountAmount,
	computeTotalAmountDue,
	getTicketUnitPrice,
	getTopCitiesByCountOfTicketsBooked,
	type Booking
} from '$lib/domain/booking';
import { BookingPaymentStatus, TicketPrice, TicketType } from '$lib/domain/shared/enums';

function makeBooking(overrides: Partial<Booking> = {}): Booking {
	return {
		reference_no: 'BTEST001',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		city: 'Berlin',
		ticket_type: TicketType.STANDARD,
		book_date: '2026-01-01T00:00:00.000Z',
		payment_status: BookingPaymentStatus.UNPAID,
		amount_total: TicketPrice.STANDARD,
		guests: ['Ada'],
		ticket_ids: [],
		...overrides
	};
}

describe('booking domain rules', () => {
	it('computes totals from ticket type and quantity', () => {
		const earlyBirdDate = new Date('2026-08-01T12:00:00+01:00');
		const standardDate = new Date('2026-09-01T12:00:00+01:00');

		expect(getTicketUnitPrice(TicketType.STANDARD, earlyBirdDate)).toBe(
			TicketPrice.STANDARD_EARLY_BIRD
		);
		expect(getTicketUnitPrice(TicketType.STANDARD, standardDate)).toBe(TicketPrice.STANDARD);
		expect(computeTotalAmountDue(TicketType.STANDARD, 2, earlyBirdDate)).toBe(60);
		expect(computeTotalAmountDue(TicketType.GRAND_FEAST_PLUS, 3, earlyBirdDate)).toBe(195);
	});

	it('applies family discount to paid ticket purchases of five or more', () => {
		const earlyBirdDate = new Date('2026-08-01T12:00:00+01:00');
		const standardDate = new Date('2026-09-01T12:00:00+01:00');

		expect(computeFamilyDiscountAmount(TicketType.STANDARD, 4, earlyBirdDate)).toBe(0);
		expect(computeFamilyDiscountAmount(TicketType.STANDARD, 5, earlyBirdDate)).toBe(0);
		expect(computeTotalAmountDue(TicketType.STANDARD, 5, earlyBirdDate)).toBe(150);
		expect(computeFamilyDiscountAmount(TicketType.STANDARD, 4, standardDate)).toBe(0);
		expect(computeFamilyDiscountAmount(TicketType.STANDARD, 5, standardDate)).toBe(17.5);
		expect(computeTotalAmountDue(TicketType.STANDARD, 5, standardDate)).toBe(157.5);
		expect(computeFamilyDiscountAmount(TicketType.GRAND_FEAST_PLUS, 5, earlyBirdDate)).toBe(32.5);
		expect(computeTotalAmountDue(TicketType.GRAND_FEAST_PLUS, 5, earlyBirdDate)).toBe(292.5);
	});

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

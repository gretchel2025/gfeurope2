import { describe, expect, it } from 'vitest';
import type { Booking } from '$lib/domain/booking';
import {
	BookingConfirmationEmailStatus,
	BookingPaymentStatus,
	TicketStatus,
	TicketType
} from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';
import {
	getCityTicketSalesExportRows,
	getGeneratedTicketReportRows
} from '$lib/application/services/reportingService';

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
		ticket_ids: ['T001'],
		tickets_sent_to_client: false,
		booking_confirmation_email_status: BookingConfirmationEmailStatus.UNKNOWN,
		...overrides
	};
}

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
	return {
		ticket_id: 'T001',
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

describe('reportingService report rows', () => {
	it('builds sorted city sales rows with normalized city names and a grand total', () => {
		const rows = getCityTicketSalesExportRows([
			makeBooking({
				reference_no: 'BREF001',
				city: 'belrin',
				amount_total: 70,
				guests: ['Ada Lovelace', 'Grace Hopper']
			}),
			makeBooking({
				reference_no: 'BREF002',
				city: 'Berlin',
				amount_total: 35,
				guests: ['Katherine Johnson']
			}),
			makeBooking({
				reference_no: 'BREF003',
				city: 'bruxelles',
				amount_total: 35,
				guests: ['Dorothy Vaughan']
			}),
			makeBooking({
				reference_no: 'BREF004',
				city: 'Dublin',
				payment_status: BookingPaymentStatus.UNPAID,
				amount_total: 35,
				guests: ['Mary Jackson']
			})
		]);

		expect(rows).toEqual([
			{
				rank: 1,
				cityName: 'Berlin',
				ticketsSold: 3,
				paidBookings: 2,
				amountPaid: 105,
				percentOfPaidTickets: 0.75,
				isGrandTotal: false
			},
			{
				rank: 2,
				cityName: 'Brussels',
				ticketsSold: 1,
				paidBookings: 1,
				amountPaid: 35,
				percentOfPaidTickets: 0.25,
				isGrandTotal: false
			},
			{
				rank: '',
				cityName: 'Grand total',
				ticketsSold: 4,
				paidBookings: 3,
				amountPaid: 140,
				percentOfPaidTickets: 1,
				isGrandTotal: true
			}
		]);
	});

	it('returns only a zero grand total row when there are no paid bookings', () => {
		const rows = getCityTicketSalesExportRows([
			makeBooking({
				payment_status: BookingPaymentStatus.UNPAID,
				amount_total: 35,
				guests: ['Ada Lovelace']
			})
		]);

		expect(rows).toEqual([
			{
				rank: '',
				cityName: 'Grand total',
				ticketsSold: 0,
				paidBookings: 0,
				amountPaid: 0,
				percentOfPaidTickets: 0,
				isGrandTotal: true
			}
		]);
	});

	it('builds generated ticket rows joined to booking city and sorted for registration', () => {
		const bookings = [
			makeBooking({ reference_no: 'BREF001', city: 'belrin' }),
			makeBooking({ reference_no: 'BREF002', city: 'feast brussels' })
		];
		const rows = getGeneratedTicketReportRows(
			[
				makeTicket({
					ticket_id: 'T003',
					name: 'Zoe Keating',
					ticket_type: TicketType.GRAND_FEAST_PLUS,
					is_paid: false,
					booking_reference_no: 'BREF002'
				}),
				makeTicket({
					ticket_id: 'T002',
					name: 'Ada Lovelace',
					booking_reference_no: 'BREF002'
				}),
				makeTicket({
					ticket_id: 'T001',
					name: 'Ada Lovelace',
					booking_reference_no: 'BREF001'
				})
			],
			bookings
		);

		expect(rows).toEqual([
			{
				rowNumber: 1,
				ticketId: 'T001',
				guestName: 'Ada Lovelace',
				ticketType: 'Standard',
				status: TicketStatus.CREATED,
				paid: 'Yes',
				bookingReferenceNo: 'BREF001',
				cityName: 'Berlin'
			},
			{
				rowNumber: 2,
				ticketId: 'T002',
				guestName: 'Ada Lovelace',
				ticketType: 'Standard',
				status: TicketStatus.CREATED,
				paid: 'Yes',
				bookingReferenceNo: 'BREF002',
				cityName: 'Brussels'
			},
			{
				rowNumber: 3,
				ticketId: 'T003',
				guestName: 'Zoe Keating',
				ticketType: 'GrandFeast Plus',
				status: TicketStatus.CREATED,
				paid: 'No',
				bookingReferenceNo: 'BREF002',
				cityName: 'Brussels'
			}
		]);
	});
});

import { describe, expect, it } from 'vitest';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import {
	mapBooking,
	mapEvent,
	mapTicket,
	mapTicketCounter
} from '$lib/infrastructure/db/supabase/mappers';

describe('Supabase persistence mappers', () => {
	it('maps booking rows into domain bookings', () => {
		expect(
			mapBooking({
				event_id: 'gfeu2026',
				reference_no: 'B123',
				name: 'Ada',
				email: 'ada@example.com',
				city: null,
				ticket_type: 'GRAND_FEAST_PLUS',
				book_date: '2026-01-01T00:00:00.000Z',
				payment_status: 'PAID',
				amount_total: '65.00',
				guests: ['Ada'],
				ticket_ids: ['T123'],
				payment_proof_url: 'https://res.cloudinary.com/demo/proof.pdf'
			})
		).toEqual({
			event_id: 'gfeu2026',
			reference_no: 'B123',
			name: 'Ada',
			email: 'ada@example.com',
			city: '',
			ticket_type: TicketType.GRAND_FEAST_PLUS,
			book_date: '2026-01-01T00:00:00.000Z',
			payment_status: BookingPaymentStatus.PAID,
			amount_total: 65,
			guests: ['Ada'],
			ticket_ids: ['T123'],
			payment_proof_url: 'https://res.cloudinary.com/demo/proof.pdf'
		});
	});

	it('maps event rows into domain events', () => {
		expect(
			mapEvent({
				event_id: 'gfeu2026',
				title: 'Together 2026',
				short_description: 'A Grand Feast event.',
				country: 'Ireland',
				venue: "St. Helen's Hotel",
				datetime: '2026-10-03T12:00:00+01:00',
				timezone: 'Europe/Dublin'
			})
		).toEqual({
			event_id: 'gfeu2026',
			title: 'Together 2026',
			short_description: 'A Grand Feast event.',
			country: 'Ireland',
			venue: "St. Helen's Hotel",
			datetime: '2026-10-03T11:00:00.000Z',
			timezone: 'Europe/Dublin'
		});
	});

	it('maps ticket and counter rows into domain objects', () => {
		expect(
			mapTicket({
				ticket_id: 'T123',
				name: 'Ada',
				ticket_type: 'STANDARD',
				description: null,
				status: 'CREATED',
				is_paid: true,
				booking_reference_no: 'B123',
				checkin_qr_code_image_url: null
			})
		).toEqual({
			ticket_id: 'T123',
			name: 'Ada',
			ticket_type: TicketType.STANDARD,
			description: '',
			status: TicketStatus.CREATED,
			is_paid: true,
			booking_reference_no: 'B123',
			checkin_qr_code_image_url: ''
		});

		expect(
			mapTicketCounter({
				counter_id: 'standard_tickets',
				available: 10,
				reserved: 2,
				sold: 3
			})
		).toEqual({
			_id: 'standard_tickets',
			available: 10,
			reserved: 2,
			sold: 3
		});
	});
});

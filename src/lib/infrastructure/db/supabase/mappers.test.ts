import { describe, expect, it } from 'vitest';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import { mapBooking, mapTicket, mapTicketCounter } from '$lib/infrastructure/db/supabase/mappers';

describe('Supabase persistence mappers', () => {
	it('maps booking rows into domain bookings', () => {
		expect(
			mapBooking({
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

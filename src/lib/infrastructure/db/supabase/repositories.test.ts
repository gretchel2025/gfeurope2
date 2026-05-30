import { describe, expect, it } from 'vitest';
import { InfrastructureError } from '$lib/application/errors';
import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';
import { SupabaseBookingRepository } from '$lib/infrastructure/db/supabase/bookingRepository';
import { SupabaseTicketCounterRepository } from '$lib/infrastructure/db/supabase/ticketCounterRepository';
import { SupabaseTicketRepository } from '$lib/infrastructure/db/supabase/ticketRepository';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Supabase repositories', () => {
	const booking: Booking = {
		reference_no: 'B123',
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		city: 'London',
		ticket_type: TicketType.STANDARD,
		book_date: '2026-01-01T00:00:00.000Z',
		payment_status: BookingPaymentStatus.UNPAID,
		amount_total: 40,
		guests: ['Ada Lovelace', 'Grace Hopper'],
		ticket_ids: [],
		payment_proof_url: 'https://res.cloudinary.com/demo/proof.pdf'
	};
	const ticket: Ticket = {
		ticket_id: 'T123',
		name: 'Ada Lovelace',
		ticket_type: TicketType.STANDARD,
		description: '',
		status: TicketStatus.CREATED,
		is_paid: true,
		booking_reference_no: 'B123',
		checkin_qr_code_image_url: ''
	};

	it('scopes booking lookups by event id', async () => {
		const calls: Array<[string, unknown]> = [];
		const query = {
			select: (value: string) => {
				calls.push(['select', value]);
				return query;
			},
			eq: (key: string, value: unknown) => {
				calls.push([key, value]);
				return query;
			},
			maybeSingle: async () => ({ data: null, error: null })
		};
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			from: (table: string) => {
				calls.push(['from', table]);
				return query;
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseBookingRepository(client, 'event-test');
		await repository.findByReferenceNo('B123');

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'bookings']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['reference_no', 'B123']);
	});

	it('creates booking reservations through the atomic lifecycle rpc', async () => {
		const calls: Array<[string, unknown]> = [];
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			rpc: async (name: string, params: Record<string, unknown>) => {
				calls.push([name, params]);
				return {
					data: {
						reference_no: booking.reference_no,
						name: booking.name,
						email: booking.email,
						city: booking.city,
						ticket_type: booking.ticket_type,
						book_date: booking.book_date,
						payment_status: booking.payment_status,
						amount_total: booking.amount_total,
						guests: booking.guests,
						ticket_ids: booking.ticket_ids,
						payment_proof_url: booking.payment_proof_url
					},
					error: null
				};
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseBookingRepository(client, 'event-test');
		await repository.insertReservation(booking);

		expect(calls).toEqual([
			['schema', 'grandfeasteu'],
			[
				'create_booking_reservation',
				{
					p_event_id: 'event-test',
					p_reference_no: 'B123',
					p_name: 'Ada Lovelace',
					p_email: 'ada@example.com',
					p_city: 'London',
					p_ticket_type: TicketType.STANDARD,
					p_book_date: '2026-01-01T00:00:00.000Z',
					p_amount_total: 40,
					p_guests: ['Ada Lovelace', 'Grace Hopper'],
					p_payment_proof_url: 'https://res.cloudinary.com/demo/proof.pdf'
				}
			]
		]);
	});

	it('moves paid and cancelled bookings through event-scoped lifecycle rpcs', async () => {
		const calls: Array<[string, unknown]> = [];
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			rpc: async (name: string, params: Record<string, unknown>) => {
				calls.push([name, params]);
				return { data: null, error: null };
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseBookingRepository(client, 'event-test');
		await repository.markPaid('B123');
		await repository.cancelReservation('B124');

		expect(calls).toEqual([
			['schema', 'grandfeasteu'],
			[
				'mark_booking_paid',
				{
					p_event_id: 'event-test',
					p_reference_no: 'B123'
				}
			],
			['schema', 'grandfeasteu'],
			[
				'cancel_booking_reservation',
				{
					p_event_id: 'event-test',
					p_reference_no: 'B124'
				}
			]
		]);
	});

	it('appends generated ticket ids to the event-scoped booking', async () => {
		const calls: Array<[string, unknown]> = [];
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			rpc: async (name: string, params: Record<string, unknown>) => {
				calls.push([name, params]);
				return { data: null, error: null };
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseBookingRepository(client, 'event-test');
		await repository.appendTicketId('B123', 'T123');

		expect(calls).toEqual([
			['schema', 'grandfeasteu'],
			[
				'append_booking_ticket_id',
				{
					p_event_id: 'event-test',
					p_reference_no: 'B123',
					p_ticket_id: 'T123'
				}
			]
		]);
	});

	it('passes event id to atomic ticket counter increments', async () => {
		const calls: Array<[string, unknown]> = [];
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			rpc: async (name: string, params: Record<string, unknown>) => {
				calls.push([name, params]);
				return { data: null, error: null };
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseTicketCounterRepository(client, 'event-test');
		await repository.increment('standard_tickets', { available: -1, reserved: 1, sold: 0 });

		expect(calls).toEqual([
			['schema', 'grandfeasteu'],
			[
				'increment_ticket_counter',
				{
					p_event_id: 'event-test',
					p_counter_id: 'standard_tickets',
					p_available_delta: -1,
					p_reserved_delta: 1,
					p_sold_delta: 0
				}
			]
		]);
	});

	it('scopes ticket counter lookups to the app schema and event id', async () => {
		const calls: Array<[string, unknown]> = [];
		const query = {
			select: (value: string) => {
				calls.push(['select', value]);
				return query;
			},
			eq: (key: string, value: unknown) => {
				calls.push([key, value]);
				return query;
			},
			maybeSingle: async () => ({ data: null, error: null })
		};
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			from: (table: string) => {
				calls.push(['from', table]);
				return query;
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseTicketCounterRepository(client, 'event-test');
		await repository.findById('standard_tickets');

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'ticket_counters']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['counter_id', 'standard_tickets']);
	});

	it('inserts tickets into the app schema with event id scoping', async () => {
		const calls: Array<[string, unknown]> = [];
		const query = {
			insert: async (value: Record<string, unknown>) => {
				calls.push(['insert', value]);
				return { data: null, error: null };
			}
		};
		const client = {
			schema: (schema: string) => {
				calls.push(['schema', schema]);
				return client;
			},
			from: (table: string) => {
				calls.push(['from', table]);
				return query;
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseTicketRepository(client, 'event-test');
		await repository.insert(ticket);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'tickets']);
		expect(calls).toContainEqual([
			'insert',
			expect.objectContaining({
				event_id: 'event-test',
				ticket_id: 'T123'
			})
		]);
	});

	it('wraps failed counter increments as infrastructure errors', async () => {
		const client = {
			schema: () => client,
			rpc: async () => ({ data: null, error: { message: 'negative inventory' } })
		} as unknown as SupabaseClient;

		const repository = new SupabaseTicketCounterRepository(client, 'event-test');

		await expect(
			repository.increment('standard_tickets', { available: -100, reserved: 0, sold: 0 })
		).rejects.toBeInstanceOf(InfrastructureError);
	});
});

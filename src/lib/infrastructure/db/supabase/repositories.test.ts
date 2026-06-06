import { describe, expect, it } from 'vitest';
import { InfrastructureError } from '$lib/application/errors';
import { AuditAction, AuditActorType, AuditEntityType } from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';
import { SupabaseAuditEventRepository } from '$lib/infrastructure/db/supabase/auditEventRepository';
import { SupabaseBookingRepository } from '$lib/infrastructure/db/supabase/bookingRepository';
import { SupabaseEventRepository } from '$lib/infrastructure/db/supabase/eventRepository';
import { SupabaseTicketCounterRepository } from '$lib/infrastructure/db/supabase/ticketCounterRepository';
import { SupabaseTicketRepository } from '$lib/infrastructure/db/supabase/ticketRepository';
import { SupabaseTicketTypeRepository } from '$lib/infrastructure/db/supabase/ticketTypeRepository';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('Supabase repositories', () => {
	const booking: Booking = {
		event_id: 'event-test',
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
		tickets_sent_to_client: false,
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
						event_id: booking.event_id,
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
						tickets_sent_to_client: booking.tickets_sent_to_client,
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

	it('marks event-scoped booking tickets as sent to the client', async () => {
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
		await repository.markTicketsSentToClient('B123');

		expect(calls).toEqual([
			['schema', 'grandfeasteu'],
			[
				'mark_booking_tickets_sent_to_client',
				{
					p_event_id: 'event-test',
					p_reference_no: 'B123'
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
		await repository.increment('STANDARD', { available: -1, reserved: 1, sold: 0 });

		expect(calls).toEqual([
			['schema', 'grandfeasteu'],
			[
				'increment_ticket_counter',
				{
					p_event_id: 'event-test',
					p_counter_id: 'STANDARD',
					p_available_delta: -1,
					p_reserved_delta: 1,
					p_sold_delta: 0
				}
			]
		]);
	});

	it('looks up events in the app schema by event id', async () => {
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
			maybeSingle: async () => ({
				data: {
					event_id: 'event-test',
					title: 'Test Event',
					short_description: 'A test event.',
					country: 'Ireland',
					venue: 'Test Venue',
					datetime: '2026-10-03T12:00:00+01:00',
					timezone: 'Europe/Dublin',
					theme_main_color: '#005B72',
					theme_sub_color: '#E7F6F9',
					theme_highlight_color: '#D99A32',
					theme_on_main_color: '#FFFFFF'
				},
				error: null
			})
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

		const repository = new SupabaseEventRepository(client);
		await expect(repository.findById('event-test')).resolves.toEqual(
			expect.objectContaining({ event_id: 'event-test', timezone: 'Europe/Dublin' })
		);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'events']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
	});

	it('lists events from the app schema ordered newest first', async () => {
		const calls: Array<[string, unknown]> = [];
		const query = {
			select: (value: string) => {
				calls.push(['select', value]);
				return query;
			},
			order: async (key: string, value: unknown) => {
				calls.push(['order', [key, value]]);
				return {
					data: [
						{
							event_id: 'gfeu2026',
							title: 'Together 2026',
							short_description: 'A Grand Feast event.',
							country: 'Ireland',
							venue: 'St. Helen',
							datetime: '2026-10-03T12:00:00+01:00',
							timezone: 'Europe/Dublin',
							theme_main_color: '#005B72',
							theme_sub_color: '#E7F6F9',
							theme_highlight_color: '#D99A32',
							theme_on_main_color: '#FFFFFF'
						}
					],
					error: null
				};
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

		const repository = new SupabaseEventRepository(client);
		await expect(repository.list()).resolves.toEqual([
			expect.objectContaining({ event_id: 'gfeu2026', title: 'Together 2026' })
		]);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'events']);
		expect(calls).toContainEqual(['order', ['datetime', { ascending: false }]]);
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
		await repository.findById('STANDARD');

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'ticket_counters']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['counter_id', 'STANDARD']);
	});

	it('lists ticket counters in the app schema by event id', async () => {
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
			order: async (key: string, value: unknown) => {
				calls.push(['order', [key, value]]);
				return {
					data: [
						{
							counter_id: 'STANDARD',
							available: 10,
							reserved: 2,
							sold: 3
						},
						{
							counter_id: 'VIP',
							available: 4,
							reserved: 1,
							sold: 0
						}
					],
					error: null
				};
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

		const repository = new SupabaseTicketCounterRepository(client, 'event-test');
		await expect(repository.list()).resolves.toEqual([
			{
				_id: 'STANDARD',
				available: 10,
				reserved: 2,
				sold: 3
			},
			{
				_id: 'VIP',
				available: 4,
				reserved: 1,
				sold: 0
			}
		]);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'ticket_counters']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['order', ['counter_id', { ascending: true }]]);
	});

	it('lists all ticket types in the app schema by event id', async () => {
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
			order: async (key: string, value: unknown) => {
				calls.push(['order', [key, value]]);
				return {
					data: [
						{
							event_id: 'event-test',
							ticket_type_id: 'STANDARD',
							label: 'Standard',
							description: 'General admission',
							base_price: '35.00',
							currency: 'EUR',
							available_from: null,
							available_until: null,
							early_bird_discount_available_until: null,
							early_bird_discount_rate: null,
							early_bird_discount_amount: null,
							bulk_purchase_discount_min_quantity: null,
							bulk_purchase_discount_rate: null,
							bulk_purchase_discount_amount: null,
							sort_order: 10,
							is_active: true
						},
						{
							event_id: 'event-test',
							ticket_type_id: 'GRAND_FEAST_PLUS',
							label: 'GrandFeast Plus',
							description: 'Inactive legacy type',
							base_price: '65.00',
							currency: 'EUR',
							available_from: null,
							available_until: null,
							early_bird_discount_available_until: null,
							early_bird_discount_rate: null,
							early_bird_discount_amount: null,
							bulk_purchase_discount_min_quantity: null,
							bulk_purchase_discount_rate: null,
							bulk_purchase_discount_amount: null,
							sort_order: 40,
							is_active: false
						}
					],
					error: null
				};
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

		const repository = new SupabaseTicketTypeRepository(client);
		await expect(repository.list('event-test')).resolves.toEqual([
			expect.objectContaining({ ticket_type_id: 'STANDARD', is_active: true }),
			expect.objectContaining({ ticket_type_id: 'GRAND_FEAST_PLUS', is_active: false })
		]);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'ticket_types']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).not.toContainEqual(['is_active', true]);
		expect(calls).toContainEqual(['order', ['sort_order', { ascending: true }]]);
	});

	it('lists active ticket types in the app schema by event id', async () => {
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
			order: async (key: string, value: unknown) => {
				calls.push(['order', [key, value]]);
				return {
					data: [
						{
							event_id: 'event-test',
							ticket_type_id: 'STANDARD',
							label: 'Standard',
							description: 'General admission',
							base_price: '35.00',
							currency: 'EUR',
							available_from: null,
							available_until: null,
							early_bird_discount_available_until: null,
							early_bird_discount_rate: null,
							early_bird_discount_amount: null,
							bulk_purchase_discount_min_quantity: null,
							bulk_purchase_discount_rate: null,
							bulk_purchase_discount_amount: null,
							sort_order: 10,
							is_active: true
						}
					],
					error: null
				};
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

		const repository = new SupabaseTicketTypeRepository(client);
		await expect(repository.listActive('event-test')).resolves.toEqual([
			expect.objectContaining({ ticket_type_id: 'STANDARD', base_price: 35 })
		]);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'ticket_types']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['is_active', true]);
		expect(calls).toContainEqual(['order', ['sort_order', { ascending: true }]]);
	});

	it('looks up a ticket type by event and ticket type id', async () => {
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
			maybeSingle: async () => ({
				data: {
					event_id: 'event-test',
					ticket_type_id: 'STANDARD',
					label: 'Standard',
					description: 'General admission',
					base_price: '35.00',
					currency: 'EUR',
					available_from: null,
					available_until: null,
					early_bird_discount_available_until: null,
					early_bird_discount_rate: null,
					early_bird_discount_amount: null,
					bulk_purchase_discount_min_quantity: null,
					bulk_purchase_discount_rate: null,
					bulk_purchase_discount_amount: null,
					sort_order: 10,
					is_active: true
				},
				error: null
			})
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

		const repository = new SupabaseTicketTypeRepository(client);
		await expect(repository.findById('event-test', 'STANDARD')).resolves.toEqual(
			expect.objectContaining({ event_id: 'event-test', ticket_type_id: 'STANDARD' })
		);

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'ticket_types']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['ticket_type_id', 'STANDARD']);
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
			repository.increment('STANDARD', { available: -100, reserved: 0, sold: 0 })
		).rejects.toBeInstanceOf(InfrastructureError);
	});

	it('inserts audit events into the app schema', async () => {
		const calls: Array<[string, unknown]> = [];
		const query = {
			insert: (value: Record<string, unknown>) => {
				calls.push(['insert', value]);
				return query;
			},
			select: (value: string) => {
				calls.push(['select', value]);
				return query;
			},
			single: async () => ({
				data: {
					audit_event_id: '00000000-0000-0000-0000-000000000001',
					event_id: 'event-test',
					action: 'booking.created',
					actor_type: 'public',
					actor_id: null,
					actor_email: 'ada@example.com',
					entity_type: 'booking',
					entity_id: 'B123',
					occurred_at: '2026-01-01T00:00:00.000Z',
					metadata: { quantity: 1 },
					created_at: '2026-01-01T00:00:00.000Z'
				},
				error: null
			})
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

		const repository = new SupabaseAuditEventRepository(client);
		await expect(
			repository.insert({
				event_id: 'event-test',
				action: AuditAction.BookingCreated,
				actor_type: AuditActorType.Public,
				actor_email: 'ada@example.com',
				entity_type: AuditEntityType.Booking,
				entity_id: 'B123',
				metadata: { quantity: 1 }
			})
		).resolves.toEqual(expect.objectContaining({ action: AuditAction.BookingCreated }));

		expect(calls).toContainEqual(['schema', 'grandfeasteu']);
		expect(calls).toContainEqual(['from', 'audit_events']);
		expect(calls).toContainEqual([
			'insert',
			expect.objectContaining({
				event_id: 'event-test',
				action: AuditAction.BookingCreated,
				entity_type: AuditEntityType.Booking,
				entity_id: 'B123'
			})
		]);
	});

	it('lists audit events by event and entity newest first', async () => {
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
			order: (key: string, value: unknown) => {
				calls.push(['order', [key, value]]);
				return query;
			},
			limit: async (value: number) => {
				calls.push(['limit', value]);
				return { data: [], error: null };
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

		const repository = new SupabaseAuditEventRepository(client);
		await repository.listByEvent('event-test', { limit: 20 });
		await repository.listByEntity('event-test', AuditEntityType.Ticket, 'T123', { limit: 10 });

		expect(calls).toContainEqual(['from', 'audit_events']);
		expect(calls).toContainEqual(['event_id', 'event-test']);
		expect(calls).toContainEqual(['entity_type', AuditEntityType.Ticket]);
		expect(calls).toContainEqual(['entity_id', 'T123']);
		expect(calls).toContainEqual(['order', ['occurred_at', { ascending: false }]]);
		expect(calls).toContainEqual(['limit', 20]);
		expect(calls).toContainEqual(['limit', 10]);
	});
});

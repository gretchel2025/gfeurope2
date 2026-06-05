import { describe, expect, it, vi } from 'vitest';
import type { TicketCounterRepository } from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import {
	buildTicketCounterDashboardItems,
	TicketCounterService
} from '$lib/application/services/ticketCounterService';
import { AuditAction, AuditActorType, AuditEntityType } from '$lib/domain/auditEvent';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import type { TicketTypeConfig } from '$lib/domain/ticketType';

describe('TicketCounterService audit events', () => {
	it('records ticket_counter.available_added after manual available inventory is added', async () => {
		const counterRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			list: vi.fn(),
			set: vi.fn(),
			increment: vi.fn()
		} satisfies TicketCounterRepository;
		const auditEventService = {
			record: vi.fn()
		} as unknown as AuditEventService;
		const service = new TicketCounterService(counterRepository, auditEventService, 'gfeu2026');

		await service.addAvailableTickets('STANDARD', 10, {
			actor_type: AuditActorType.Admin,
			actor_email: 'admin@example.test'
		});

		expect(counterRepository.increment).toHaveBeenCalledWith('STANDARD', {
			available: 10,
			reserved: 0,
			sold: 0
		});
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				action: AuditAction.TicketCounterAvailableAdded,
				actor_type: AuditActorType.Admin,
				entity_type: AuditEntityType.TicketCounter,
				entity_id: 'STANDARD',
				metadata: {
					ticket_type: 'STANDARD',
					quantity_added: 10
				}
			})
		);
	});
});

describe('TicketCounterService.list', () => {
	it('delegates to the event-scoped counter repository', async () => {
		const counters: TicketCounter[] = [
			{
				_id: 'STANDARD',
				available: 10,
				reserved: 1,
				sold: 2
			}
		];
		const counterRepository = {
			create: vi.fn(),
			findById: vi.fn(),
			list: vi.fn(async () => counters),
			set: vi.fn(),
			increment: vi.fn()
		} satisfies TicketCounterRepository;
		const auditEventService = {
			record: vi.fn()
		} as unknown as AuditEventService;
		const service = new TicketCounterService(counterRepository, auditEventService, 'gfeu2026');

		await expect(service.list()).resolves.toEqual(counters);
		expect(counterRepository.list).toHaveBeenCalledOnce();
	});
});

describe('buildTicketCounterDashboardItems', () => {
	const makeCounter = (id: string): TicketCounter => ({
		_id: id,
		available: 10,
		reserved: 0,
		sold: 0
	});
	const makeTicketType = (
		ticketTypeId: string,
		label: string,
		sortOrder: number,
		isActive = true
	): TicketTypeConfig => ({
		event_id: 'gfeu2025',
		ticket_type_id: ticketTypeId,
		label,
		description: '',
		base_price: 0,
		currency: 'EUR',
		sort_order: sortOrder,
		is_active: isActive
	});

	it('uses DB labels, includes inactive counters, and sorts by ticket type order', () => {
		const items = buildTicketCounterDashboardItems(
			[
				makeCounter('GRAND_FEAST_PLUS'),
				makeCounter('YOUTH'),
				makeCounter('STANDARD'),
				makeCounter('VIP')
			],
			[
				makeTicketType('STANDARD', 'Standard', 10),
				makeTicketType('VIP', 'Premium', 20),
				makeTicketType('YOUTH', 'Child', 30),
				makeTicketType('GRAND_FEAST_PLUS', 'GrandFeast Plus', 40, false)
			]
		);

		expect(items.map((item) => item.title)).toEqual([
			'Standard Tickets',
			'Premium Tickets',
			'Child Tickets',
			'GrandFeast Plus Tickets'
		]);
		expect(items.map((item) => item.counter._id)).toEqual([
			'STANDARD',
			'VIP',
			'YOUTH',
			'GRAND_FEAST_PLUS'
		]);
		expect(items[3].isActive).toBe(false);
	});

	it('falls back to a formatted counter id when ticket type metadata is missing', () => {
		const [item] = buildTicketCounterDashboardItems([makeCounter('VIP')], []);

		expect(item.title).toBe('Premium Tickets');
		expect(item.isActive).toBe(true);
	});
});

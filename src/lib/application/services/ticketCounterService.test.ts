import { describe, expect, it, vi } from 'vitest';
import type { TicketCounterRepository } from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import { TicketCounterService } from '$lib/application/services/ticketCounterService';
import { AuditAction, AuditActorType, AuditEntityType } from '$lib/domain/auditEvent';

describe('TicketCounterService audit events', () => {
	it('records ticket_counter.available_added after manual available inventory is added', async () => {
		const counterRepository = {
			create: vi.fn(),
			findById: vi.fn(),
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

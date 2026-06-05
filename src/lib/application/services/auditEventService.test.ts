import { describe, expect, it, vi } from 'vitest';
import type { AuditEventRepository } from '$lib/application/ports';
import { AuditEventService } from '$lib/application/services/auditEventService';
import { AuditAction, AuditActorType, AuditEntityType } from '$lib/domain/auditEvent';

describe('AuditEventService', () => {
	it('records audit events through the repository', async () => {
		const repository = {
			insert: vi.fn(async (input) => ({
				audit_event_id: '00000000-0000-0000-0000-000000000001',
				occurred_at: '2026-01-01T00:00:00.000Z',
				created_at: '2026-01-01T00:00:00.000Z',
				...input,
				metadata: input.metadata ?? {}
			})),
			listByEvent: vi.fn(),
			listByEntity: vi.fn()
		} satisfies AuditEventRepository;
		const service = new AuditEventService(repository);

		await service.record({
			event_id: 'gfeu2026',
			action: AuditAction.BookingCreated,
			actor_type: AuditActorType.Public,
			actor_email: 'ada@example.com',
			entity_type: AuditEntityType.Booking,
			entity_id: 'B123'
		});

		expect(repository.insert).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AuditAction.BookingCreated,
				entity_type: AuditEntityType.Booking,
				entity_id: 'B123'
			})
		);
	});

	it('logs and continues when audit insert fails', async () => {
		const caught = new Error('insert failed');
		const repository = {
			insert: vi.fn(async () => {
				throw caught;
			}),
			listByEvent: vi.fn(),
			listByEntity: vi.fn()
		} satisfies AuditEventRepository;
		const handleInsertFailure = vi.fn();
		const service = new AuditEventService(repository, handleInsertFailure);
		const input = {
			event_id: 'gfeu2026',
			action: AuditAction.BookingMarkedPaid,
			actor_type: AuditActorType.Admin,
			entity_type: AuditEntityType.Booking,
			entity_id: 'B123'
		};

		await expect(service.record(input)).resolves.toBeUndefined();

		expect(handleInsertFailure).toHaveBeenCalledWith(caught, input);
	});
});

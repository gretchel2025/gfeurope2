import { describe, expect, it, vi } from 'vitest';
import type {
	EventLogger,
	EventRepository,
	MerchProductRepository,
	MerchReservationRepository
} from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import { MerchandiseService } from '$lib/application/services/merchandiseService';
import type { NotificationService } from '$lib/application/services/notificationService';
import { AuditAction, AuditActorType, AuditEntityType } from '$lib/domain/auditEvent';
import type { Event } from '$lib/domain/event';
import {
	MerchReservationEmailStatus,
	MerchReservationStatus,
	type MerchReservation
} from '$lib/domain/merchandise';

function makeEvent(): Event {
	return {
		event_id: 'gfeu2026',
		title: 'Together 2026',
		short_description: 'Grand Feast Europe 2026',
		country: 'Ireland',
		venue: 'Dublin',
		datetime: '2026-10-03T12:00:00.000Z',
		timezone: 'Europe/Dublin',
		theme_main_color: '#0f766e',
		theme_sub_color: '#e0f2fe',
		theme_highlight_color: '#facc15',
		theme_on_main_color: '#ffffff'
	};
}

function makeReservation(overrides: Partial<MerchReservation> = {}): MerchReservation {
	return {
		event_id: 'gfeu2026',
		reservation_id: 'MR-TEST123',
		customer_name: 'Codex Test Customer',
		email: 'codex@example.test',
		mobile: '+3530000000',
		reserved_at: '2026-06-16T09:30:00.000Z',
		status: MerchReservationStatus.Reserved,
		amount_total: 27.5,
		currency: 'EUR',
		confirmation_email_status: MerchReservationEmailStatus.Sent,
		items: [
			{
				event_id: 'gfeu2026',
				reservation_id: 'MR-TEST123',
				product_id: 'MP-TEST',
				product_name: 'Codex Test Mug',
				quantity: 2,
				unit_price: 13.75,
				currency: 'EUR',
				selected_size: 'One Size',
				selected_color: 'Gold'
			}
		],
		...overrides
	};
}

function makeService(reservation = makeReservation()) {
	const merchProductRepository = {} as MerchProductRepository;
	const merchReservationRepository = {
		insertReservation: vi.fn(),
		findById: vi.fn(async () => reservation),
		list: vi.fn(),
		delete: vi.fn(),
		updateConfirmationEmailStatus: vi.fn()
	} satisfies MerchReservationRepository;
	const eventRepository = {
		findById: vi.fn(async () => makeEvent()),
		list: vi.fn()
	} satisfies EventRepository;
	const notificationService = {} as NotificationService;
	const eventLogger = { log: vi.fn() } satisfies EventLogger;
	const auditEventService = { record: vi.fn() } as unknown as AuditEventService;

	const service = new MerchandiseService(
		merchProductRepository,
		merchReservationRepository,
		eventRepository,
		notificationService,
		eventLogger,
		auditEventService,
		() => 'TEST1234'
	);

	return {
		service,
		merchReservationRepository,
		eventLogger,
		auditEventService: auditEventService as AuditEventService & {
			record: ReturnType<typeof vi.fn>;
		}
	};
}

describe('MerchandiseService reservation deletion', () => {
	it('deletes a merch reservation and records an audit event', async () => {
		const { service, merchReservationRepository, auditEventService, eventLogger } = makeService();

		await service.deleteReservation('gfeu2026', 'MR-TEST123', {
			actor_type: AuditActorType.Admin,
			actor_email: 'admin@example.test'
		});

		expect(merchReservationRepository.findById).toHaveBeenCalledWith('gfeu2026', 'MR-TEST123');
		expect(merchReservationRepository.delete).toHaveBeenCalledWith('gfeu2026', 'MR-TEST123');
		expect(auditEventService.record).toHaveBeenCalledWith(
			expect.objectContaining({
				event_id: 'gfeu2026',
				action: AuditAction.MerchReservationDeleted,
				actor_type: AuditActorType.Admin,
				entity_type: AuditEntityType.MerchReservation,
				entity_id: 'MR-TEST123',
				metadata: expect.objectContaining({
					reservation_id: 'MR-TEST123',
					customer_name: 'Codex Test Customer',
					email: 'codex@example.test',
					item_count: 1
				})
			})
		);
		expect(eventLogger.log).toHaveBeenCalledWith(
			'MERCH_RESERVATION_DELETED',
			'admin@example.test',
			expect.objectContaining({
				event_id: 'gfeu2026',
				reservation_id: 'MR-TEST123'
			})
		);
	});
});

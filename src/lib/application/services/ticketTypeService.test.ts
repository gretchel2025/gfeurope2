import { describe, expect, it, vi } from 'vitest';
import type { TicketTypeRepository } from '$lib/application/ports';
import { TicketTypeService } from '$lib/application/services/ticketTypeService';
import type { TicketTypeConfig } from '$lib/domain/ticketType';

describe('TicketTypeService.list', () => {
	it('delegates to the repository and includes inactive ticket types', async () => {
		const ticketTypes: TicketTypeConfig[] = [
			{
				event_id: 'gfeu2025',
				ticket_type_id: 'GRAND_FEAST_PLUS',
				label: 'GrandFeast Plus',
				description: 'Legacy counter retained for compatibility',
				base_price: 65,
				currency: 'EUR',
				sort_order: 40,
				is_active: false
			}
		];
		const repository = {
			findById: vi.fn(),
			list: vi.fn(async () => ticketTypes),
			listActive: vi.fn()
		} satisfies TicketTypeRepository;
		const service = new TicketTypeService(repository);

		await expect(service.list('gfeu2025')).resolves.toEqual(ticketTypes);
		expect(repository.list).toHaveBeenCalledWith('gfeu2025');
		expect(repository.listActive).not.toHaveBeenCalled();
	});
});

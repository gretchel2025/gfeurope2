import { describe, expect, it } from 'vitest';
import {
	computeTicketPricing,
	isTicketTypeAvailable,
	type TicketTypeConfig
} from '$lib/domain/ticketType';

function makeTicketType(overrides: Partial<TicketTypeConfig> = {}): TicketTypeConfig {
	return {
		event_id: 'gfeu2026',
		ticket_type_id: 'STANDARD',
		label: 'Standard',
		description: 'General admission',
		base_price: 35,
		currency: 'EUR',
		sort_order: 10,
		is_active: true,
		...overrides
	};
}

describe('ticket type pricing', () => {
	it('applies early bird flat discount amount before bulk discount', () => {
		const ticketType = makeTicketType({
			early_bird_discount_available_until: '2026-08-31T23:59:59+01:00',
			early_bird_discount_amount: 5,
			bulk_purchase_discount_min_quantity: 5,
			bulk_purchase_discount_rate: 0.1
		});

		expect(computeTicketPricing(ticketType, 1, new Date('2026-08-01T12:00:00+01:00'))).toEqual(
			expect.objectContaining({
				unitPrice: 30,
				subtotalAmount: 35,
				discountAmount: 5,
				totalAmount: 30,
				earlyBirdDiscountActive: true,
				bulkDiscountActive: false
			})
		);
	});

	it('uses base price after early bird expires', () => {
		const ticketType = makeTicketType({
			early_bird_discount_available_until: '2026-08-31T23:59:59+01:00',
			early_bird_discount_amount: 5
		});

		expect(computeTicketPricing(ticketType, 1, new Date('2026-09-01T12:00:00+01:00'))).toEqual(
			expect.objectContaining({
				unitPrice: 35,
				subtotalAmount: 35,
				discountAmount: 0,
				totalAmount: 35
			})
		);
	});

	it('applies the GrandFeast Plus early bird flat discount before expiry', () => {
		const ticketType = makeTicketType({
			ticket_type_id: 'GRAND_FEAST_PLUS',
			label: 'GrandFeast Plus',
			base_price: 65,
			early_bird_discount_available_until: '2026-08-31T23:59:59+01:00',
			early_bird_discount_amount: 5
		});

		expect(computeTicketPricing(ticketType, 1, new Date('2026-08-01T12:00:00+01:00'))).toEqual(
			expect.objectContaining({
				unitPrice: 60,
				subtotalAmount: 65,
				discountAmount: 5,
				totalAmount: 60,
				earlyBirdDiscountActive: true
			})
		);
	});

	it('applies bulk discount rate when minimum quantity is reached', () => {
		const ticketType = makeTicketType({
			ticket_type_id: 'GRAND_FEAST_PLUS',
			base_price: 65,
			bulk_purchase_discount_min_quantity: 5,
			bulk_purchase_discount_rate: 0.1
		});

		expect(computeTicketPricing(ticketType, 5, new Date('2026-09-01T12:00:00+01:00'))).toEqual(
			expect.objectContaining({
				subtotalAmount: 325,
				discountAmount: 32.5,
				totalAmount: 292.5,
				bulkDiscountActive: true
			})
		);
	});

	it('prefers rate discount over flat amount when both are present', () => {
		const ticketType = makeTicketType({
			base_price: 100,
			bulk_purchase_discount_min_quantity: 5,
			bulk_purchase_discount_rate: 0.1,
			bulk_purchase_discount_amount: 99
		});

		expect(computeTicketPricing(ticketType, 5, new Date('2026-09-01T12:00:00+01:00'))).toEqual(
			expect.objectContaining({
				discountAmount: 50,
				totalAmount: 450
			})
		);
	});

	it('rejects inactive and out-of-window ticket types', () => {
		expect(isTicketTypeAvailable(makeTicketType({ is_active: false }))).toBe(false);
		expect(
			isTicketTypeAvailable(
				makeTicketType({ available_from: '2026-10-01T00:00:00+01:00' }),
				new Date('2026-09-01T12:00:00+01:00')
			)
		).toBe(false);
		expect(
			isTicketTypeAvailable(
				makeTicketType({ available_until: '2026-08-31T23:59:59+01:00' }),
				new Date('2026-09-01T12:00:00+01:00')
			)
		).toBe(false);
	});
});

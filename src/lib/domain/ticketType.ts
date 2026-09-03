/**
 * Purpose:
 * This file defines DB-backed ticket type configuration and pricing rules.
 *
 * Why this structure is good:
 * Pricing belongs to the domain, while the values come from persistence. Keeping
 * the math here lets routes and services compute the same totals from one rule set.
 */
export type TicketTypeConfig = {
	event_id: string;
	ticket_type_id: string;
	label: string;
	description: string;
	base_price: number;
	currency: string;
	available_from?: string;
	available_until?: string;
	early_bird_discount_available_until?: string;
	early_bird_discount_rate?: number;
	early_bird_discount_amount?: number;
	bulk_purchase_discount_min_quantity?: number;
	bulk_purchase_discount_rate?: number;
	bulk_purchase_discount_amount?: number;
	sort_order: number;
	is_active: boolean;
};

export type PublicTicketTypeConfig = TicketTypeConfig & {
	available: number;
};

export type TicketPricing = {
	unitPrice: number;
	subtotalAmount: number;
	discountAmount: number;
	totalAmount: number;
	earlyBirdDiscountActive: boolean;
	bulkDiscountActive: boolean;
};

/** Whether the ticket type may currently be sold. */
export function isTicketTypeAvailable(
	ticketType: TicketTypeConfig,
	now: Date = new Date()
): boolean {
	if (!ticketType.is_active) {
		return false;
	}

	if (ticketType.available_from && now.getTime() < Date.parse(ticketType.available_from)) {
		return false;
	}

	if (ticketType.available_until && now.getTime() > Date.parse(ticketType.available_until)) {
		return false;
	}

	return true;
}

/** Computes unit price, discounts, and total for a ticket type and quantity. */
export function computeTicketPricing(
	ticketType: TicketTypeConfig,
	quantity: number,
	now: Date = new Date()
): TicketPricing {
	const subtotalAmount = roundCurrency(ticketType.base_price * quantity);
	const earlyBirdDiscountActive = isEarlyBirdDiscountActive(ticketType, now);
	const bulkDiscountActive =
		!earlyBirdDiscountActive &&
		Boolean(ticketType.bulk_purchase_discount_min_quantity) &&
		quantity >= (ticketType.bulk_purchase_discount_min_quantity ?? Number.POSITIVE_INFINITY) &&
		hasDiscount(ticketType.bulk_purchase_discount_rate, ticketType.bulk_purchase_discount_amount);

	const discountAmount = earlyBirdDiscountActive
		? computeDiscountAmount(
				subtotalAmount,
				quantity,
				ticketType.early_bird_discount_rate,
				ticketType.early_bird_discount_amount
			)
		: bulkDiscountActive
			? computeDiscountAmount(
					subtotalAmount,
					quantity,
					ticketType.bulk_purchase_discount_rate,
					ticketType.bulk_purchase_discount_amount
				)
			: 0;
	const totalAmount = roundCurrency(subtotalAmount - discountAmount);
	const unitPrice = quantity > 0 ? roundCurrency(totalAmount / quantity) : ticketType.base_price;

	return {
		unitPrice,
		subtotalAmount,
		discountAmount,
		totalAmount,
		earlyBirdDiscountActive,
		bulkDiscountActive
	};
}

export function isEarlyBirdDiscountActive(
	ticketType: TicketTypeConfig,
	now: Date = new Date()
): boolean {
	return (
		Boolean(ticketType.early_bird_discount_available_until) &&
		now.getTime() <= Date.parse(ticketType.early_bird_discount_available_until ?? '') &&
		hasDiscount(ticketType.early_bird_discount_rate, ticketType.early_bird_discount_amount)
	);
}

function computeDiscountAmount(
	subtotalAmount: number,
	quantity: number,
	rate?: number,
	amount?: number
): number {
	if (rate !== undefined) {
		return roundCurrency(subtotalAmount * rate);
	}

	if (amount !== undefined) {
		return roundCurrency(amount * quantity);
	}

	return 0;
}

function hasDiscount(rate?: number, amount?: number): boolean {
	return rate !== undefined || amount !== undefined;
}

function roundCurrency(value: number): number {
	return Math.round(value * 100) / 100;
}

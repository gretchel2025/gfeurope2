/**
 * Purpose:
 * This file contains shared domain enums and constant values.
 *
 * Why this structure is good:
 * Shared business constants are easier to keep consistent when they live in a
 * single domain-focused module instead of being duplicated across routes,
 * repositories, and services.
 */
/** The states a booking's payment lifecycle can be in. */
export enum BookingPaymentStatus {
	UNPAID = 'UNPAID',
	PAID = 'PAID',
	BOOKING_RESERVATION_CANCELLED = 'BOOKING_RESERVATION_CANCELLED'
}

/** The states a ticket can move through during event operations. */
export enum TicketStatus {
	CREATED = 'CREATED',
	CHECKED_IN = 'CHECKED_IN',
	CHECKED_OUT = 'CHECKED_OUT'
}

/** Supported ticket classes sold by the application. */
export enum TicketType {
	STANDARD = 'STANDARD',
	GRAND_FEAST_PLUS = 'GRAND_FEAST_PLUS',
	VIP = 'VIP',
	YOUTH = 'YOUTH'
}

/** User-facing ticket labels. */
export function formatTicketTypeLabel(ticketType: TicketType | string): string {
	switch (ticketType) {
		case TicketType.GRAND_FEAST_PLUS:
			return 'GrandFeast Plus';
		case TicketType.VIP:
			return 'Premium';
		case TicketType.YOUTH:
			return 'Child';
		case TicketType.STANDARD:
			return 'Standard';
		default:
			return String(ticketType);
	}
}

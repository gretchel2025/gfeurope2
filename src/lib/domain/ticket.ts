/**
 * Purpose:
 * This file defines ticket-centric domain types and state rules.
 *
 * Why this structure is good:
 * Ticket rules belong in the domain layer because they describe allowed
 * business transitions, not HTTP or database behavior.
 */
import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';

/** Canonical ticket shape used throughout the app. */
export type Ticket = {
	ticket_id: string;
	name: string;
	ticket_type: TicketType;
	description: string;
	status: TicketStatus;
	is_paid: boolean;
	booking_reference_no: string;
	checkin_qr_code_image_url: string;
};

/** QR code payload returned by the ticket service. */
export type QRCode = {
	imageData: string;
	targetURL: string;
};

/** Input required before the system mints a real ticket id and QR asset. */
export type CreateTicketInput = {
	name: string;
	ticket_type: string;
	description: string;
	booking_reference_no: string;
	is_paid: boolean;
};

/** Whether the current booking and ticket state allow check-in. */
export function canCheckInTicket(booking: Booking, ticket: Ticket): boolean {
	return (
		booking.payment_status === BookingPaymentStatus.PAID &&
		ticket.status !== TicketStatus.CHECKED_IN
	);
}

/** Whether the current booking and ticket state allow check-out. */
export function canCheckOutTicket(booking: Booking, ticket: Ticket): boolean {
	return (
		booking.payment_status === BookingPaymentStatus.PAID &&
		ticket.status === TicketStatus.CHECKED_IN
	);
}

/** Normalizes free-form input into one of the supported ticket types. */
export function normalizeTicketType(input: string): TicketType {
	const standardizedInput = input ? input.toUpperCase() : '';

	switch (standardizedInput) {
		case TicketType.STANDARD:
			return TicketType.STANDARD;
		case TicketType.GRAND_FEAST_PLUS:
		case 'VIP':
			return TicketType.GRAND_FEAST_PLUS;
		case 'YOUTH':
			return TicketType.STANDARD;
		default:
			return TicketType.STANDARD;
	}
}

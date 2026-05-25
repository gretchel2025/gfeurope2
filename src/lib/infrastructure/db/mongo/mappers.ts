/**
 * Purpose:
 * This file maps Mongo/Mongoose records into canonical domain objects.
 *
 * Why this structure is good:
 * Mapping is a boundary concern. Keeping it separate makes repository query
 * code cleaner and makes persistence-to-domain conversion easy to audit.
 */
import type { Booking } from '$lib/domain/booking';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import type { User, UserRole } from '$lib/domain/user';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';

/** Maps a Mongoose booking document into the canonical domain shape. */
export function mapBooking(record: Record<string, unknown>): Booking {
	return {
		reference_no: String(record.reference_no),
		name: String(record.name),
		email: String(record.email),
		city: String(record.city ?? ''),
		ticket_type: record.ticket_type as TicketType,
		book_date: new Date(record.book_date as string | Date).toISOString(),
		payment_status: record.payment_status as BookingPaymentStatus,
		amount_total: Number(record.amount_total),
		guests: Array.isArray(record.guests) ? record.guests.map(String) : [],
		ticket_ids: Array.isArray(record.ticket_ids) ? record.ticket_ids.map(String) : []
	};
}

/** Maps a Mongoose ticket document into the canonical domain shape. */
export function mapTicket(record: Record<string, unknown>): Ticket {
	return {
		ticket_id: String(record.ticket_id),
		name: String(record.name),
		ticket_type: record.ticket_type as TicketType,
		description: String(record.description ?? ''),
		status: record.status as TicketStatus,
		is_paid: Boolean(record.is_paid),
		booking_reference_no: String(record.booking_reference_no),
		checkin_qr_code_image_url: String(record.checkin_qr_code_image_url)
	};
}

/** Maps a Mongoose counter document into the canonical domain shape. */
export function mapTicketCounter(record: Record<string, unknown>): TicketCounter {
	return {
		_id: String(record._id),
		available: Number(record.available),
		reserved: Number(record.reserved),
		sold: Number(record.sold)
	};
}

/** Maps a Mongoose user document into the canonical domain shape. */
export function mapUser(record: Record<string, unknown>): User {
	return {
		_id: String(record._id),
		roles: Array.isArray(record.roles) ? (record.roles.map(String) as UserRole[]) : []
	};
}

import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketCounter } from '$lib/domain/ticketCounter';

export type SupabaseBookingRow = {
	reference_no: string;
	name: string;
	email: string;
	city: string | null;
	ticket_type: string;
	book_date: string;
	payment_status: string;
	amount_total: number | string;
	guests: string[] | null;
	ticket_ids: string[] | null;
	payment_proof_url?: string | null;
};

export type SupabaseTicketRow = {
	ticket_id: string;
	name: string;
	ticket_type: string;
	description: string | null;
	status: string;
	is_paid: boolean;
	booking_reference_no: string;
	checkin_qr_code_image_url: string | null;
};

export type SupabaseTicketCounterRow = {
	counter_id: string;
	available: number;
	reserved: number;
	sold: number;
};

export function mapBooking(row: SupabaseBookingRow): Booking {
	return {
		reference_no: row.reference_no,
		name: row.name,
		email: row.email,
		city: row.city ?? '',
		ticket_type: row.ticket_type as TicketType,
		book_date: new Date(row.book_date).toISOString(),
		payment_status: row.payment_status as BookingPaymentStatus,
		amount_total: Number(row.amount_total),
		guests: row.guests ?? [],
		ticket_ids: row.ticket_ids ?? [],
		payment_proof_url: row.payment_proof_url ?? undefined
	};
}

export function mapTicket(row: SupabaseTicketRow): Ticket {
	return {
		ticket_id: row.ticket_id,
		name: row.name,
		ticket_type: row.ticket_type as TicketType,
		description: row.description ?? '',
		status: row.status as TicketStatus,
		is_paid: row.is_paid,
		booking_reference_no: row.booking_reference_no,
		checkin_qr_code_image_url: row.checkin_qr_code_image_url ?? ''
	};
}

export function mapTicketCounter(row: SupabaseTicketCounterRow): TicketCounter {
	return {
		_id: row.counter_id,
		available: Number(row.available),
		reserved: Number(row.reserved),
		sold: Number(row.sold)
	};
}

export function ticketToRow(ticket: Ticket, eventId: string) {
	return {
		event_id: eventId,
		ticket_id: ticket.ticket_id,
		name: ticket.name,
		ticket_type: ticket.ticket_type,
		description: ticket.description,
		status: ticket.status,
		is_paid: ticket.is_paid,
		booking_reference_no: ticket.booking_reference_no,
		checkin_qr_code_image_url: ticket.checkin_qr_code_image_url
	};
}

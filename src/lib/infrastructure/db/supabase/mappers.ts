import type { Booking } from '$lib/domain/booking';
import type { Event } from '$lib/domain/event';
import { BookingPaymentStatus, TicketStatus, TicketType } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import type { TicketTypeConfig } from '$lib/domain/ticketType';

export type SupabaseBookingRow = {
	event_id: string;
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

export type SupabaseEventRow = {
	event_id: string;
	title: string;
	short_description: string;
	country: string;
	venue: string;
	datetime: string;
	timezone: string;
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

export type SupabaseTicketTypeRow = {
	event_id: string;
	ticket_type_id: string;
	label: string;
	description: string | null;
	base_price: number | string;
	currency: string;
	available_from: string | null;
	available_until: string | null;
	early_bird_discount_available_until: string | null;
	early_bird_discount_rate: number | string | null;
	early_bird_discount_amount: number | string | null;
	bulk_purchase_discount_min_quantity: number | null;
	bulk_purchase_discount_rate: number | string | null;
	bulk_purchase_discount_amount: number | string | null;
	sort_order: number;
	is_active: boolean;
};

export function mapBooking(row: SupabaseBookingRow): Booking {
	return {
		event_id: row.event_id,
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

export function mapEvent(row: SupabaseEventRow): Event {
	return {
		event_id: row.event_id,
		title: row.title,
		short_description: row.short_description,
		country: row.country,
		venue: row.venue,
		datetime: new Date(row.datetime).toISOString(),
		timezone: row.timezone
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

export function mapTicketType(row: SupabaseTicketTypeRow): TicketTypeConfig {
	return {
		event_id: row.event_id,
		ticket_type_id: row.ticket_type_id,
		label: row.label,
		description: row.description ?? '',
		base_price: Number(row.base_price),
		currency: row.currency,
		available_from: row.available_from ?? undefined,
		available_until: row.available_until ?? undefined,
		early_bird_discount_available_until: row.early_bird_discount_available_until ?? undefined,
		early_bird_discount_rate:
			row.early_bird_discount_rate === null ? undefined : Number(row.early_bird_discount_rate),
		early_bird_discount_amount:
			row.early_bird_discount_amount === null ? undefined : Number(row.early_bird_discount_amount),
		bulk_purchase_discount_min_quantity: row.bulk_purchase_discount_min_quantity ?? undefined,
		bulk_purchase_discount_rate:
			row.bulk_purchase_discount_rate === null
				? undefined
				: Number(row.bulk_purchase_discount_rate),
		bulk_purchase_discount_amount:
			row.bulk_purchase_discount_amount === null
				? undefined
				: Number(row.bulk_purchase_discount_amount),
		sort_order: Number(row.sort_order),
		is_active: row.is_active
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

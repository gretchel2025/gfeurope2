import type { Booking } from '$lib/domain/booking';
import type { Event } from '$lib/domain/event';
import type { MerchProduct, MerchReservation, MerchReservationItem } from '$lib/domain/merchandise';
import {
	BookingConfirmationEmailStatus,
	BookingPaymentStatus,
	TicketStatus,
	TicketType
} from '$lib/domain/shared/enums';
import { MerchReservationEmailStatus, MerchReservationStatus } from '$lib/domain/merchandise';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import {
	AuditActorType,
	AuditEntityType,
	type AuditAction,
	type AuditEvent,
	type CreateAuditEventInput
} from '$lib/domain/auditEvent';

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
	tickets_sent_to_client?: boolean | null;
	booking_confirmation_email_status?: string | null;
	booking_confirmation_email_attempted_at?: string | null;
	booking_confirmation_email_status_updated_at?: string | null;
	booking_confirmation_email_provider_id?: string | null;
	booking_confirmation_email_error?: string | null;
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
	theme_main_color: string;
	theme_sub_color: string;
	theme_highlight_color: string;
	theme_on_main_color: string;
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

export type SupabaseMerchProductRow = {
	event_id: string;
	product_id: string;
	name: string;
	description: string | null;
	category: string;
	unit_price: number | string;
	currency: string;
	stock_count: number;
	sizes: string[] | null;
	colors: string[] | null;
	image_urls: string[] | null;
	is_active: boolean;
	deleted_at: string | null;
	created_at?: string | null;
	updated_at?: string | null;
};

export type SupabaseMerchReservationRow = {
	event_id: string;
	reservation_id: string;
	customer_name: string;
	email: string;
	mobile: string;
	reserved_at: string;
	status: string;
	amount_total: number | string;
	currency: string;
	confirmation_email_status: string;
	confirmation_email_attempted_at: string | null;
	confirmation_email_provider_id: string | null;
	confirmation_email_error: string | null;
	created_at?: string | null;
	updated_at?: string | null;
};

export type SupabaseMerchReservationItemRow = {
	item_id: string;
	event_id: string;
	reservation_id: string;
	product_id: string;
	product_name: string;
	quantity: number;
	unit_price: number | string;
	currency: string;
	selected_size: string | null;
	selected_color: string | null;
	created_at?: string | null;
};

export type SupabaseAuditEventRow = {
	audit_event_id: string;
	event_id: string | null;
	action: string;
	actor_type: string;
	actor_id: string | null;
	actor_email: string | null;
	entity_type: string;
	entity_id: string;
	occurred_at: string;
	metadata: Record<string, unknown> | null;
	created_at: string;
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
		tickets_sent_to_client: row.tickets_sent_to_client ?? false,
		booking_confirmation_email_status:
			(row.booking_confirmation_email_status as BookingConfirmationEmailStatus | null) ??
			BookingConfirmationEmailStatus.UNKNOWN,
		booking_confirmation_email_attempted_at:
			row.booking_confirmation_email_attempted_at === null ||
			row.booking_confirmation_email_attempted_at === undefined
				? undefined
				: new Date(row.booking_confirmation_email_attempted_at).toISOString(),
		booking_confirmation_email_status_updated_at:
			row.booking_confirmation_email_status_updated_at === null ||
			row.booking_confirmation_email_status_updated_at === undefined
				? undefined
				: new Date(row.booking_confirmation_email_status_updated_at).toISOString(),
		booking_confirmation_email_provider_id: row.booking_confirmation_email_provider_id ?? undefined,
		booking_confirmation_email_error: row.booking_confirmation_email_error ?? undefined,
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
		timezone: row.timezone,
		theme_main_color: row.theme_main_color,
		theme_sub_color: row.theme_sub_color,
		theme_highlight_color: row.theme_highlight_color,
		theme_on_main_color: row.theme_on_main_color
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

export function mapMerchProduct(row: SupabaseMerchProductRow): MerchProduct {
	return {
		event_id: row.event_id,
		product_id: row.product_id,
		name: row.name,
		description: row.description ?? '',
		category: row.category,
		unit_price: Number(row.unit_price),
		currency: row.currency,
		stock_count: Number(row.stock_count),
		sizes: row.sizes ?? [],
		colors: row.colors ?? [],
		image_urls: row.image_urls ?? [],
		is_active: row.is_active,
		deleted_at: row.deleted_at ? new Date(row.deleted_at).toISOString() : undefined,
		created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
		updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
	};
}

export function mapMerchReservationItem(
	row: SupabaseMerchReservationItemRow
): MerchReservationItem {
	return {
		item_id: row.item_id,
		event_id: row.event_id,
		reservation_id: row.reservation_id,
		product_id: row.product_id,
		product_name: row.product_name,
		quantity: Number(row.quantity),
		unit_price: Number(row.unit_price),
		currency: row.currency,
		selected_size: row.selected_size ?? undefined,
		selected_color: row.selected_color ?? undefined
	};
}

export function mapMerchReservation(
	row: SupabaseMerchReservationRow,
	items: MerchReservationItem[] = []
): MerchReservation {
	return {
		event_id: row.event_id,
		reservation_id: row.reservation_id,
		customer_name: row.customer_name,
		email: row.email,
		mobile: row.mobile,
		reserved_at: new Date(row.reserved_at).toISOString(),
		status: row.status as MerchReservationStatus,
		amount_total: Number(row.amount_total),
		currency: row.currency,
		confirmation_email_status: row.confirmation_email_status as MerchReservationEmailStatus,
		confirmation_email_attempted_at: row.confirmation_email_attempted_at
			? new Date(row.confirmation_email_attempted_at).toISOString()
			: undefined,
		confirmation_email_provider_id: row.confirmation_email_provider_id ?? undefined,
		confirmation_email_error: row.confirmation_email_error ?? undefined,
		items,
		created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
		updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : undefined
	};
}

export function merchProductToRow(input: {
	event_id: string;
	product_id?: string;
	name: string;
	description: string;
	category: string;
	unit_price: number;
	currency?: string;
	stock_count: number;
	sizes?: string[];
	colors?: string[];
	image_urls?: string[];
	is_active?: boolean;
}) {
	return {
		event_id: input.event_id,
		...(input.product_id ? { product_id: input.product_id } : {}),
		name: input.name,
		description: input.description,
		category: input.category,
		unit_price: input.unit_price,
		currency: input.currency ?? 'EUR',
		stock_count: input.stock_count,
		sizes: input.sizes ?? [],
		colors: input.colors ?? [],
		image_urls: input.image_urls ?? [],
		is_active: input.is_active ?? true
	};
}

export function mapAuditEvent(row: SupabaseAuditEventRow): AuditEvent {
	return {
		audit_event_id: row.audit_event_id,
		event_id: row.event_id,
		action: row.action as AuditAction,
		actor_type: row.actor_type as AuditActorType,
		actor_id: row.actor_id,
		actor_email: row.actor_email,
		entity_type: row.entity_type as AuditEntityType,
		entity_id: row.entity_id,
		occurred_at: new Date(row.occurred_at).toISOString(),
		metadata: row.metadata ?? {},
		created_at: new Date(row.created_at).toISOString()
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

export function auditEventToRow(input: CreateAuditEventInput) {
	return {
		event_id: input.event_id,
		action: input.action,
		actor_type: input.actor_type,
		actor_id: input.actor_id ?? null,
		actor_email: input.actor_email ?? null,
		entity_type: input.entity_type,
		entity_id: input.entity_id,
		metadata: input.metadata ?? {}
	};
}

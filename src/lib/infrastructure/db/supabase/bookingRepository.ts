import type { BookingRepository } from '$lib/application/ports';
import type { Booking } from '$lib/domain/booking';
import { BookingConfirmationEmailStatus } from '$lib/domain/shared/enums';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import { mapBooking, type SupabaseBookingRow } from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'bookings';

export class SupabaseBookingRepository implements BookingRepository {
	constructor(
		private readonly clientOverride: SupabaseClient | undefined,
		private readonly eventId: string
	) {}

	async insertReservation(booking: Booking): Promise<Booking> {
		const { data, error } = await this.schema.rpc('create_booking_reservation', {
			p_event_id: booking.event_id,
			p_reference_no: booking.reference_no,
			p_name: booking.name,
			p_email: booking.email,
			p_city: booking.city,
			p_ticket_type: booking.ticket_type,
			p_book_date: booking.book_date,
			p_amount_total: booking.amount_total,
			p_guests: booking.guests,
			p_payment_proof_url: booking.payment_proof_url ?? null
		});

		if (error) throwSupabaseError('booking reservation insert failed', error);
		return mapBooking(data as SupabaseBookingRow);
	}

	async findByReferenceNo(referenceNo: string): Promise<Booking | null> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', this.eventId)
			.eq('reference_no', referenceNo)
			.maybeSingle();

		if (error) throwSupabaseError('booking lookup failed', error);
		return data ? mapBooking(data as SupabaseBookingRow) : null;
	}

	async list(): Promise<Booking[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', this.eventId);

		if (error) throwSupabaseError('booking list failed', error);
		return (data ?? []).map((row) => mapBooking(row as SupabaseBookingRow));
	}

	async markPaid(referenceNo: string): Promise<void> {
		const { error } = await this.schema.rpc('mark_booking_paid', {
			p_event_id: this.eventId,
			p_reference_no: referenceNo
		});

		if (error) throwSupabaseError('booking paid update failed', error);
	}

	async cancelReservation(referenceNo: string): Promise<void> {
		const { error } = await this.schema.rpc('cancel_booking_reservation', {
			p_event_id: this.eventId,
			p_reference_no: referenceNo
		});

		if (error) throwSupabaseError('booking reservation cancellation failed', error);
	}

	async appendTicketId(referenceNo: string, ticketId: string): Promise<void> {
		const { error } = await this.schema.rpc('append_booking_ticket_id', {
			p_event_id: this.eventId,
			p_reference_no: referenceNo,
			p_ticket_id: ticketId
		});

		if (error) throwSupabaseError('booking ticket append failed', error);
	}

	async updateGuestDetails(
		referenceNo: string,
		guests: string[],
		contactName?: string
	): Promise<void> {
		const values: { guests: string[]; name?: string } = { guests };
		if (contactName !== undefined) {
			values.name = contactName;
		}

		const { error } = await this.schema
			.from(tableName)
			.update(values)
			.eq('event_id', this.eventId)
			.eq('reference_no', referenceNo);

		if (error) throwSupabaseError('booking guest details update failed', error);
	}

	async markTicketsSentToClient(referenceNo: string): Promise<void> {
		const { error } = await this.schema.rpc('mark_booking_tickets_sent_to_client', {
			p_event_id: this.eventId,
			p_reference_no: referenceNo
		});

		if (error) throwSupabaseError('booking tickets sent update failed', error);
	}

	async updateBookingConfirmationEmailStatus(
		referenceNo: string,
		status: BookingConfirmationEmailStatus,
		errorMessage?: string,
		providerMessageId?: string
	): Promise<void> {
		const { error } = await this.schema.rpc('update_booking_confirmation_email_status', {
			p_event_id: this.eventId,
			p_reference_no: referenceNo,
			p_status: status,
			p_error: errorMessage ?? null,
			p_provider_message_id: providerMessageId ?? null
		});

		if (error) throwSupabaseError('booking confirmation email status update failed', error);
	}

	async updateBookingConfirmationEmailDeliveryStatusByProviderMessageId(
		providerMessageId: string,
		status: BookingConfirmationEmailStatus.DELIVERED | BookingConfirmationEmailStatus.FAILED,
		errorMessage?: string,
		providerEventAt?: string
	): Promise<void> {
		const { error } = await this.schema.rpc('update_booking_confirmation_email_delivery_status', {
			p_provider_message_id: providerMessageId,
			p_status: status,
			p_error: errorMessage ?? null,
			p_provider_event_at: providerEventAt ?? null
		});

		if (error)
			throwSupabaseError('booking confirmation email delivery status update failed', error);
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

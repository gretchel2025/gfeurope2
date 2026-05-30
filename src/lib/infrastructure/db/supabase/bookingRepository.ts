import type { BookingRepository } from '$lib/application/ports';
import type { Booking } from '$lib/domain/booking';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import { mapBooking, type SupabaseBookingRow } from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'bookings';

export class SupabaseBookingRepository implements BookingRepository {
	constructor(
		private readonly clientOverride?: SupabaseClient,
		private readonly eventId: string = appConfig.appEventId
	) {}

	async insertReservation(booking: Booking): Promise<Booking> {
		const { data, error } = await this.schema.rpc('create_booking_reservation', {
			p_event_id: this.eventId,
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

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

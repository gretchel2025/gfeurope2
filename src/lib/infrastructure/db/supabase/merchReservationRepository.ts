import type { CreateMerchReservationInput, MerchReservation } from '$lib/domain/merchandise';
import type { MerchReservationRepository } from '$lib/application/ports';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import {
	mapMerchReservation,
	mapMerchReservationItem,
	type SupabaseMerchReservationItemRow,
	type SupabaseMerchReservationRow
} from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const reservationsTableName = 'merch_reservations';
const reservationItemsTableName = 'merch_reservation_items';

export class SupabaseMerchReservationRepository implements MerchReservationRepository {
	constructor(private readonly clientOverride?: SupabaseClient) {}

	async insertReservation(
		input: CreateMerchReservationInput,
		reservationId: string
	): Promise<MerchReservation> {
		const { data, error } = await this.schema.rpc('create_merch_reservation', {
			p_event_id: input.event_id,
			p_reservation_id: reservationId,
			p_customer_name: input.customer_name,
			p_email: input.email,
			p_mobile: input.mobile,
			p_items: input.items
		});

		if (error) throwSupabaseError('merch reservation insert failed', error);
		const reservation = mapMerchReservation(data as SupabaseMerchReservationRow);
		return (await this.findById(input.event_id, reservation.reservation_id)) ?? reservation;
	}

	async findById(eventId: string, reservationId: string): Promise<MerchReservation | null> {
		const { data, error } = await this.schema
			.from(reservationsTableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('reservation_id', reservationId)
			.maybeSingle();

		if (error) throwSupabaseError('merch reservation lookup failed', error);
		if (!data) return null;

		return mapMerchReservation(
			data as SupabaseMerchReservationRow,
			await this.listItems(eventId, reservationId)
		);
	}

	async list(eventId: string): Promise<MerchReservation[]> {
		const { data, error } = await this.schema
			.from(reservationsTableName)
			.select('*')
			.eq('event_id', eventId)
			.order('reserved_at', { ascending: false });

		if (error) throwSupabaseError('merch reservation list failed', error);
		const reservations = await Promise.all(
			(data ?? []).map(async (row) => {
				const reservation = row as SupabaseMerchReservationRow;
				return mapMerchReservation(
					reservation,
					await this.listItems(eventId, reservation.reservation_id)
				);
			})
		);
		return reservations;
	}

	async delete(eventId: string, reservationId: string): Promise<void> {
		const { error } = await this.schema
			.from(reservationsTableName)
			.delete()
			.eq('event_id', eventId)
			.eq('reservation_id', reservationId);

		if (error) throwSupabaseError('merch reservation delete failed', error);
	}

	async updateConfirmationEmailStatus(
		eventId: string,
		reservationId: string,
		status: MerchReservation['confirmation_email_status'],
		errorMessage?: string,
		providerMessageId?: string
	): Promise<void> {
		const { error } = await this.schema.rpc('update_merch_reservation_confirmation_email_status', {
			p_event_id: eventId,
			p_reservation_id: reservationId,
			p_status: status,
			p_error: errorMessage ?? null,
			p_provider_message_id: providerMessageId ?? null
		});

		if (error) throwSupabaseError('merch reservation email status update failed', error);
	}

	private async listItems(eventId: string, reservationId: string) {
		const { data, error } = await this.schema
			.from(reservationItemsTableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('reservation_id', reservationId)
			.order('created_at', { ascending: true });

		if (error) throwSupabaseError('merch reservation items lookup failed', error);
		return (data ?? []).map((row) =>
			mapMerchReservationItem(row as SupabaseMerchReservationItemRow)
		);
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

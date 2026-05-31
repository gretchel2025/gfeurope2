import type { TicketTypeRepository } from '$lib/application/ports';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import { mapTicketType, type SupabaseTicketTypeRow } from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'ticket_types';

export class SupabaseTicketTypeRepository implements TicketTypeRepository {
	constructor(private readonly clientOverride?: SupabaseClient) {}

	async findById(eventId: string, ticketTypeId: string): Promise<TicketTypeConfig | null> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('ticket_type_id', ticketTypeId)
			.maybeSingle();

		if (error) throwSupabaseError('ticket type lookup failed', error);
		return data ? mapTicketType(data as SupabaseTicketTypeRow) : null;
	}

	async listActive(eventId: string): Promise<TicketTypeConfig[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('is_active', true)
			.order('sort_order', { ascending: true });

		if (error) throwSupabaseError('ticket type list failed', error);
		return (data ?? []).map((row) => mapTicketType(row as SupabaseTicketTypeRow));
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

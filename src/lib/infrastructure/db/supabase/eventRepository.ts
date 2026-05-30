import type { EventRepository } from '$lib/application/ports';
import type { Event } from '$lib/domain/event';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import { mapEvent, type SupabaseEventRow } from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'events';

export class SupabaseEventRepository implements EventRepository {
	constructor(private readonly clientOverride?: SupabaseClient) {}

	async findById(eventId: string): Promise<Event | null> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.maybeSingle();

		if (error) throwSupabaseError('event lookup failed', error);
		return data ? mapEvent(data as SupabaseEventRow) : null;
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

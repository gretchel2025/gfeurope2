import type { TicketCounterRepository } from '$lib/application/ports';
import type { TicketCounter, TicketCounterDelta } from '$lib/domain/ticketCounter';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import {
	mapTicketCounter,
	type SupabaseTicketCounterRow
} from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'ticket_counters';

export class SupabaseTicketCounterRepository implements TicketCounterRepository {
	constructor(
		private readonly clientOverride?: SupabaseClient,
		private readonly eventId: string = appConfig.appEventId
	) {}

	async create(counterId: string, values?: TicketCounterDelta): Promise<void> {
		const { error } = await this.schema.from(tableName).insert({
			event_id: this.eventId,
			counter_id: counterId,
			available: values?.available ?? 0,
			reserved: values?.reserved ?? 0,
			sold: values?.sold ?? 0
		});

		if (error) throwSupabaseError('ticket counter create failed', error);
	}

	async findById(id: string): Promise<TicketCounter | null> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', this.eventId)
			.eq('counter_id', id)
			.maybeSingle();

		if (error) throwSupabaseError('ticket counter lookup failed', error);
		return data ? mapTicketCounter(data as SupabaseTicketCounterRow) : null;
	}

	async set(id: string, values: TicketCounterDelta): Promise<void> {
		const { error } = await this.schema
			.from(tableName)
			.update(values)
			.eq('event_id', this.eventId)
			.eq('counter_id', id);

		if (error) throwSupabaseError('ticket counter set failed', error);
	}

	async increment(id: string, values: TicketCounterDelta): Promise<void> {
		const { error } = await this.schema.rpc('increment_ticket_counter', {
			p_event_id: this.eventId,
			p_counter_id: id,
			p_available_delta: values.available,
			p_reserved_delta: values.reserved,
			p_sold_delta: values.sold
		});

		if (error) throwSupabaseError('ticket counter update failed', error);
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

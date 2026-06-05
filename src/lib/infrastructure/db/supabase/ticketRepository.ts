import type { TicketRepository } from '$lib/application/ports';
import type { TicketStatus } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import {
	mapTicket,
	ticketToRow,
	type SupabaseTicketRow
} from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'tickets';

export class SupabaseTicketRepository implements TicketRepository {
	constructor(
		private readonly clientOverride: SupabaseClient | undefined,
		private readonly eventId: string
	) {}

	async insert(ticket: Ticket): Promise<string> {
		const { error } = await this.schema.from(tableName).insert(ticketToRow(ticket, this.eventId));

		if (error) throwSupabaseError('ticket insert failed', error);
		return ticket.ticket_id;
	}

	async findByTicketId(ticketId: string): Promise<Ticket | null> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', this.eventId)
			.eq('ticket_id', ticketId)
			.maybeSingle();

		if (error) throwSupabaseError('ticket lookup failed', error);
		return data ? mapTicket(data as SupabaseTicketRow) : null;
	}

	async list(): Promise<Ticket[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', this.eventId);

		if (error) throwSupabaseError('ticket list failed', error);
		return (data ?? []).map((row) => mapTicket(row as SupabaseTicketRow));
	}

	async updateStatus(ticketId: string, status: TicketStatus): Promise<void> {
		const { error } = await this.schema
			.from(tableName)
			.update({ status })
			.eq('event_id', this.eventId)
			.eq('ticket_id', ticketId);

		if (error) throwSupabaseError('ticket status update failed', error);
	}

	async deleteByTicketId(ticketId: string): Promise<void> {
		const { error } = await this.schema
			.from(tableName)
			.delete()
			.eq('event_id', this.eventId)
			.eq('ticket_id', ticketId);

		if (error) throwSupabaseError('ticket delete failed', error);
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

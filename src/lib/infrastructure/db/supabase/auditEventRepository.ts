import type { AuditEventRepository } from '$lib/application/ports';
import type {
	AuditEntityType,
	AuditEvent,
	AuditEventListOptions,
	CreateAuditEventInput
} from '$lib/domain/auditEvent';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import {
	auditEventToRow,
	mapAuditEvent,
	type SupabaseAuditEventRow
} from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'audit_events';
const defaultLimit = 100;

export class SupabaseAuditEventRepository implements AuditEventRepository {
	constructor(private readonly clientOverride?: SupabaseClient) {}

	async insert(input: CreateAuditEventInput): Promise<AuditEvent> {
		const { data, error } = await this.schema
			.from(tableName)
			.insert(auditEventToRow(input))
			.select('*')
			.single();

		if (error) throwSupabaseError('audit event insert failed', error);
		return mapAuditEvent(data as SupabaseAuditEventRow);
	}

	async listByEvent(eventId: string, options: AuditEventListOptions = {}): Promise<AuditEvent[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.order('occurred_at', { ascending: false })
			.limit(options.limit ?? defaultLimit);

		if (error) throwSupabaseError('audit event list failed', error);
		return (data ?? []).map((row) => mapAuditEvent(row as SupabaseAuditEventRow));
	}

	async listByEntity(
		eventId: string,
		entityType: AuditEntityType,
		entityId: string,
		options: AuditEventListOptions = {}
	): Promise<AuditEvent[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('entity_type', entityType)
			.eq('entity_id', entityId)
			.order('occurred_at', { ascending: false })
			.limit(options.limit ?? defaultLimit);

		if (error) throwSupabaseError('audit event entity list failed', error);
		return (data ?? []).map((row) => mapAuditEvent(row as SupabaseAuditEventRow));
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

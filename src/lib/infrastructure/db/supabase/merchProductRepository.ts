import type {
	CreateMerchProductInput,
	MerchProduct,
	UpdateMerchProductInput
} from '$lib/domain/merchandise';
import type { MerchProductRepository } from '$lib/application/ports';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import { throwSupabaseError } from '$lib/infrastructure/db/supabase/errors';
import {
	mapMerchProduct,
	merchProductToRow,
	type SupabaseMerchProductRow
} from '$lib/infrastructure/db/supabase/mappers';
import { appDataSchema } from '$lib/infrastructure/db/supabase/schema';
import type { SupabaseClient } from '@supabase/supabase-js';

const tableName = 'merch_products';

export class SupabaseMerchProductRepository implements MerchProductRepository {
	constructor(private readonly clientOverride?: SupabaseClient) {}

	async insert(input: CreateMerchProductInput): Promise<MerchProduct> {
		const { data, error } = await this.schema
			.from(tableName)
			.insert(merchProductToRow(input))
			.select('*')
			.single();

		if (error) throwSupabaseError('merch product insert failed', error);
		return mapMerchProduct(data as SupabaseMerchProductRow);
	}

	async update(eventId: string, input: UpdateMerchProductInput): Promise<MerchProduct> {
		const { data, error } = await this.schema
			.from(tableName)
			.update({
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
			})
			.eq('event_id', eventId)
			.eq('product_id', input.product_id)
			.is('deleted_at', null)
			.select('*')
			.single();

		if (error) throwSupabaseError('merch product update failed', error);
		return mapMerchProduct(data as SupabaseMerchProductRow);
	}

	async softDelete(eventId: string, productId: string): Promise<void> {
		const { error } = await this.schema
			.from(tableName)
			.update({
				is_active: false,
				deleted_at: new Date().toISOString()
			})
			.eq('event_id', eventId)
			.eq('product_id', productId)
			.is('deleted_at', null);

		if (error) throwSupabaseError('merch product delete failed', error);
	}

	async findById(eventId: string, productId: string): Promise<MerchProduct | null> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('product_id', productId)
			.is('deleted_at', null)
			.maybeSingle();

		if (error) throwSupabaseError('merch product lookup failed', error);
		return data ? mapMerchProduct(data as SupabaseMerchProductRow) : null;
	}

	async list(eventId: string): Promise<MerchProduct[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.is('deleted_at', null)
			.order('category', { ascending: true })
			.order('name', { ascending: true });

		if (error) throwSupabaseError('merch product list failed', error);
		return (data ?? []).map((row) => mapMerchProduct(row as SupabaseMerchProductRow));
	}

	async listAvailable(eventId: string): Promise<MerchProduct[]> {
		const { data, error } = await this.schema
			.from(tableName)
			.select('*')
			.eq('event_id', eventId)
			.eq('is_active', true)
			.gt('stock_count', 0)
			.is('deleted_at', null)
			.order('category', { ascending: true })
			.order('name', { ascending: true });

		if (error) throwSupabaseError('available merch product list failed', error);
		return (data ?? []).map((row) => mapMerchProduct(row as SupabaseMerchProductRow));
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}

	private get schema() {
		return this.client.schema(appDataSchema);
	}
}

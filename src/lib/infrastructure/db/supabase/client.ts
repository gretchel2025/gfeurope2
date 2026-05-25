import { InfrastructureError } from '$lib/application/errors';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let dataClient: SupabaseClient | null = null;

export function getSupabaseDataClient(): SupabaseClient {
	if (dataClient) {
		return dataClient;
	}

	if (!appConfig.supabaseUrl || !appConfig.supabaseServiceRoleKey) {
		throw new InfrastructureError('Supabase data access is not configured');
	}

	dataClient = createClient(appConfig.supabaseUrl, appConfig.supabaseServiceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	return dataClient;
}

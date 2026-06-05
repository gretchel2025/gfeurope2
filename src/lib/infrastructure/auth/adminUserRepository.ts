import { InfrastructureError } from '$lib/application/errors';
import type { AdminUserRepository } from '$lib/application/ports';
import type { AdminUser } from '$lib/domain/adminUser';
import { normalizeEventRoles, normalizeUserRoles } from '$lib/domain/user';
import { getSupabaseDataClient } from '$lib/infrastructure/db/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';

const perPage = 1000;
const maxPages = 20;

export class SupabaseAdminUserRepository implements AdminUserRepository {
	constructor(private readonly clientOverride?: SupabaseClient) {}

	async list(): Promise<AdminUser[]> {
		const users: User[] = [];

		for (let page = 1; page <= maxPages; page += 1) {
			const pageUsers = await this.listPage(page);
			users.push(...pageUsers);

			if (pageUsers.length < perPage) {
				return users.map(mapSupabaseAuthUser);
			}
		}

		throw new InfrastructureError(`auth user list exceeded ${maxPages * perPage} users`);
	}

	private async listPage(page: number): Promise<User[]> {
		try {
			const { data, error } = await this.client.auth.admin.listUsers({ page, perPage });
			if (error) {
				throw new InfrastructureError(`auth user list failed: ${error.message}`);
			}

			return data.users ?? [];
		} catch (caught) {
			if (caught instanceof InfrastructureError) {
				throw caught;
			}

			const message = caught instanceof Error ? caught.message : String(caught);
			throw new InfrastructureError(`auth user list failed: ${message}`);
		}
	}

	private get client(): SupabaseClient {
		return this.clientOverride ?? getSupabaseDataClient();
	}
}

function mapSupabaseAuthUser(user: User): AdminUser {
	return {
		_id: user.id,
		email: user.email ?? '',
		roles: normalizeUserRoles(user.app_metadata?.roles),
		event_roles: normalizeEventRoles(user.app_metadata?.event_roles),
		confirmed_at: user.confirmed_at ?? user.email_confirmed_at ?? null,
		created_at: user.created_at,
		last_sign_in_at: user.last_sign_in_at ?? null
	};
}

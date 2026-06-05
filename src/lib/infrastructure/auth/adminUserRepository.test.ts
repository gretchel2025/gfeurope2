import { describe, expect, it, vi } from 'vitest';
import { SupabaseAdminUserRepository } from '$lib/infrastructure/auth/adminUserRepository';
import type { SupabaseClient, User } from '@supabase/supabase-js';

describe('SupabaseAdminUserRepository.list', () => {
	it('lists Supabase Auth users through the server-side admin API', async () => {
		const listUsers = vi.fn(async () => ({
			data: {
				users: [
					authUser({
						id: 'user-1',
						email: 'admin@example.test',
						app_metadata: {
							roles: ['tester', 'unsupported'],
							event_roles: {
								gfeu2026: ['admin'],
								gfeu2025: ['viewer']
							}
						},
						email_confirmed_at: '2026-01-02T00:00:00.000Z'
					})
				]
			},
			error: null
		}));
		const client = {
			auth: {
				admin: {
					listUsers
				}
			}
		} as unknown as SupabaseClient;

		const repository = new SupabaseAdminUserRepository(client);

		await expect(repository.list()).resolves.toEqual([
			{
				_id: 'user-1',
				email: 'admin@example.test',
				roles: ['tester'],
				event_roles: {
					gfeu2026: ['admin']
				},
				confirmed_at: '2026-01-02T00:00:00.000Z',
				created_at: '2026-01-01T00:00:00.000Z',
				last_sign_in_at: null
			}
		]);
		expect(listUsers).toHaveBeenCalledWith({ page: 1, perPage: 1000 });
	});
});

function authUser(overrides: Partial<User>): User {
	return {
		id: 'user-id',
		email: 'user@example.test',
		app_metadata: {},
		user_metadata: {},
		aud: 'authenticated',
		created_at: '2026-01-01T00:00:00.000Z',
		...overrides
	};
}

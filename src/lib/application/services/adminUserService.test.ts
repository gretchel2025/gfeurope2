import { describe, expect, it, vi } from 'vitest';
import type { AdminUserRepository } from '$lib/application/ports';
import { AdminUserService } from '$lib/application/services/adminUserService';
import type { AdminUser } from '$lib/domain/adminUser';

describe('AdminUserService.listDirectoryUsers', () => {
	it('filters to tester/admin users and sorts by email', async () => {
		const users: AdminUser[] = [
			makeUser('regular@example.com'),
			makeUser('zara@example.com', { roles: ['tester'] }),
			makeUser('ada@example.com', { event_roles: { gfeu2026: ['admin'] } }),
			makeUser('bob@example.com', { roles: ['superuser'] }),
			makeUser('carol@example.com', { roles: ['admin'] })
		];
		const repository = {
			list: vi.fn(async () => users)
		} satisfies AdminUserRepository;

		const service = new AdminUserService(repository);

		await expect(service.listDirectoryUsers()).resolves.toEqual([
			users[2],
			users[3],
			users[4],
			users[1]
		]);
		expect(repository.list).toHaveBeenCalledOnce();
	});
});

function makeUser(
	email: string,
	overrides: Partial<Pick<AdminUser, 'roles' | 'event_roles'>> = {}
): AdminUser {
	return {
		_id: `user-${email}`,
		email,
		roles: overrides.roles ?? [],
		event_roles: overrides.event_roles ?? {},
		confirmed_at: null,
		created_at: '2026-01-01T00:00:00.000Z',
		last_sign_in_at: null
	};
}

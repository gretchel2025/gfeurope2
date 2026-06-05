import type { AdminUserRepository } from '$lib/application/ports';
import {
	compareAdminUsers,
	shouldShowInAdminUserDirectory,
	type AdminUser
} from '$lib/domain/adminUser';

export class AdminUserService {
	constructor(private readonly adminUserRepository: AdminUserRepository) {}

	async listDirectoryUsers(): Promise<AdminUser[]> {
		const users = await this.adminUserRepository.list();
		return users.filter(shouldShowInAdminUserDirectory).sort(compareAdminUsers);
	}
}

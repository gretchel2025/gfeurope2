/**
 * Purpose:
 * This service owns user/admin lookup behavior.
 *
 * Why this structure is good:
 * Even though the logic is small today, it gives auth and admin flows a stable
 * application entry point instead of binding them directly to Mongo.
 */
import type { UserRepository } from "$lib/application/ports";
import type { User } from "$lib/domain/user";

/** Application facade for persisted users/admins. */
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    /** Loads a user by id, which in this app is typically the normalized email. */
    async getById(id: string): Promise<User | null> {
        return await this.userRepository.findById(id);
    }

    /** Inserts a user record, usually during local bootstrap or admin setup. */
    async insert(user: User): Promise<void> {
        await this.userRepository.insert(user);
    }
}

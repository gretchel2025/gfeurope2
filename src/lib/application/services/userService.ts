import type { UserRepository } from "$lib/application/ports";
import type { User } from "$lib/domain/user";

export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async getById(id: string): Promise<User | null> {
        return await this.userRepository.findById(id);
    }

    async insert(user: User): Promise<void> {
        await this.userRepository.insert(user);
    }
}

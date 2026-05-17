/**
 * Purpose:
 * This file contains the Mongo-backed admin/user repository.
 *
 * Why this structure is good:
 * User persistence is small today, but isolating it prevents auth-related
 * changes from being hidden inside a broad database adapter file.
 */
import type { UserRepository } from '$lib/application/ports';
import type { User } from '$lib/domain/user';
import { UserModel } from '$lib/infrastructure/db/mongo/models';
import { mapUser } from '$lib/infrastructure/db/mongo/mappers';

/** Mongo implementation of the user repository port. */
export class MongoUserRepository implements UserRepository {
	/** Inserts a user/admin record. */
	async insert(user: User): Promise<void> {
		await UserModel.create(user);
	}

	/** Loads a user/admin record by id. */
	async findById(id: string): Promise<User | null> {
		const record = await UserModel.findOne({ _id: id });
		return record ? mapUser(record) : null;
	}
}

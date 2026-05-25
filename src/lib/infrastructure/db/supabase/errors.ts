import { InfrastructureError } from '$lib/application/errors';

export function throwSupabaseError(action: string, error: { message: string }): never {
	throw new InfrastructureError(`${action}: ${error.message}`);
}

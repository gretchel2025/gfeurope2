import type { AdminUser } from '$lib/domain/adminUser';
import { getAuthSession } from '$lib/infrastructure/auth/session';
import { adminUserService } from '$lib/server/http/services';
import { requireSuperUserSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';
import type { PageServerLoad } from './$types';

export type ServerData = {
	users: AdminUser[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const session = await getAuthSession(event);
	await requireSuperUserSession(session);

	return {
		users: await adminUserService.listDirectoryUsers()
	};
});

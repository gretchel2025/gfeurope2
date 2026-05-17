import type { LayoutServerLoad } from './$types';
import { getAuthSession } from '$lib/infrastructure/auth/session';
import { requireAdminSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';

export const load: LayoutServerLoad = withKitErrors(async (event) => {
	const session = await getAuthSession(event);
	const auth = await requireAdminSession(session);

	return {
		session: auth.session,
		my_user: auth.user
	};
});

import type { LayoutServerLoad } from './$types';
import { requireAdminSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';

export const load: LayoutServerLoad = withKitErrors(async (event) => {
	const session = await event.locals.auth();
	const auth = await requireAdminSession(session);

	return {
		session: auth.session,
		my_user: auth.user
	};
});

import { getAuthSession } from '$lib/infrastructure/auth/session';
import { requireSuperUserSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = withKitErrors(async (event) => {
	const session = await getAuthSession(event);
	const auth = await requireSuperUserSession(session);

	return {
		my_user: auth.user
	};
});

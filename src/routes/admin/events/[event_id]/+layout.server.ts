import type { LayoutServerLoad } from './$types';
import { getAuthSession } from '$lib/infrastructure/auth/session';
import { getEventContext } from '$lib/server/http/eventContext';
import { requireAdminSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';

export const load: LayoutServerLoad = withKitErrors(async (event) => {
	const { event: eventRecord, eventId } = await getEventContext(event);
	const session = await getAuthSession(event);
	const auth = await requireAdminSession(session, eventId);

	return {
		event: eventRecord,
		eventId,
		session: auth.session,
		my_user: auth.user
	};
});

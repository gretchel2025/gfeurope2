import type { Event } from '$lib/domain/event';
import { getAuthSession } from '$lib/infrastructure/auth/session';
import { requireSuperUserSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';
import { repositories } from '$lib/server/http/services';
import type { PageServerLoad } from './$types';

export type ServerData = {
	events: Event[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const session = await getAuthSession(event);
	await requireSuperUserSession(session);

	return {
		events: await repositories.eventRepository.list()
	};
});

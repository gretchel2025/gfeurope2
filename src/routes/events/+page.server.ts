import type { PageServerLoad } from './$types';
import { getPublicEventPage, groupEventsByYear, type EventYearGroup } from '$lib/publicEvents';
import { repositories } from '$lib/server/http/services';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	eventGroups: EventYearGroup[];
};

export const load: PageServerLoad = withKitErrors(async (): Promise<ServerData> => {
	const events = await repositories.eventRepository.list();
	const publicEvents = events.filter((event) => getPublicEventPage(event.event_id));

	return {
		eventGroups: groupEventsByYear(publicEvents)
	};
});

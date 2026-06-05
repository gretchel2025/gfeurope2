import type { LayoutServerLoad } from './$types';
import { getEventContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';

export const load: LayoutServerLoad = withKitErrors(async (event) => {
	const { event: eventRecord, eventId } = await getEventContext(event);

	return {
		event: eventRecord,
		eventId
	};
});

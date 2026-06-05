import type { PageServerLoad } from './$types';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { getEventContext } from '$lib/server/http/eventContext';
import { createEventServices } from '$lib/server/http/services';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	ticketTypes: TicketTypeConfig[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const { eventId } = await getEventContext(event);
	const { ticketTypeService } = createEventServices(eventId);

	return {
		ticketTypes: await ticketTypeService.listActive(eventId)
	};
});

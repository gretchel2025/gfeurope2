import type { PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { MerchProduct } from '$lib/domain/merchandise';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { getPublicEventPage, type PublicEventPageConfig } from '$lib/publicEvents';
import { getEventContext } from '$lib/server/http/eventContext';
import { createEventServices } from '$lib/server/http/services';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	ticketTypes: TicketTypeConfig[];
	merchProducts: MerchProduct[];
	publicEventPage: PublicEventPageConfig;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const { eventId } = await getEventContext(event);
	const { merchandiseService, ticketTypeService } = createEventServices(eventId);
	const publicEventPage = getPublicEventPage(eventId);
	if (!publicEventPage) {
		throw new NotFoundError('public event page not found');
	}

	return {
		ticketTypes: await ticketTypeService.listActive(eventId),
		merchProducts: await merchandiseService.listAvailableProducts(eventId),
		publicEventPage
	};
});

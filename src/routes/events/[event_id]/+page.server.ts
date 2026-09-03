import type { PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { MerchProduct } from '$lib/domain/merchandise';
import type { PublicTicketTypeConfig } from '$lib/domain/ticketType';
import { getPublicEventPage, type PublicEventPageConfig } from '$lib/publicEvents';
import { getEventContext } from '$lib/server/http/eventContext';
import { createEventServices } from '$lib/server/http/services';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	ticketTypes: PublicTicketTypeConfig[];
	merchProducts: MerchProduct[];
	publicEventPage: PublicEventPageConfig;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const { eventId } = await getEventContext(event);
	const { merchandiseService, ticketCounterService, ticketTypeService } =
		createEventServices(eventId);
	const publicEventPage = getPublicEventPage(eventId);
	if (!publicEventPage) {
		throw new NotFoundError('public event page not found');
	}
	const [ticketTypes, merchProducts] = await Promise.all([
		ticketTypeService.listActive(eventId),
		merchandiseService.listAvailableProducts(eventId)
	]);
	const ticketCounters = await Promise.all(
		ticketTypes.map(async (ticketType) => ({
			id: ticketType.ticket_type_id,
			counter: await ticketCounterService.getById(ticketType.ticket_type_id)
		}))
	);
	const ticketCountersById = new Map(
		ticketCounters.map((ticketCounter) => [ticketCounter.id, ticketCounter.counter])
	);

	return {
		ticketTypes: ticketTypes.map((ticketType) => ({
			...ticketType,
			available: ticketCountersById.get(ticketType.ticket_type_id)?.available ?? 0
		})),
		merchProducts,
		publicEventPage
	};
});

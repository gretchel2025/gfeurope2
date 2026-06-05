import type { Actions, PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	ticketCounter: TicketCounter;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		services: { ticketCounterService }
	} = await getEventServiceContext(event);
	const ticketCounter = await ticketCounterService.getById(event.params.counter_id);
	if (!ticketCounter) {
		throw new NotFoundError('ticket counter does not exist');
	}

	return {
		ticketCounter
	};
});

export const actions: Actions = {
	incrementAvailableCount: adminAction(async (event) => {
		const {
			services: { ticketCounterService }
		} = await getEventServiceContext(event);
		const counterId = requireRouteParam(event.params, 'counter_id');
		await ticketCounterService.incrementTickets(counterId, { available: 10, reserved: 0, sold: 0 });
	})
};

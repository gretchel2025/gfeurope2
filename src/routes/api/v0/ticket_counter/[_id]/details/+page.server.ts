import type { Actions, PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';
import { ticketCounterService } from '$lib/server/http/services';

export type ServerData = {
	ticketCounter: TicketCounter;
};

export const load: PageServerLoad = withKitErrors(
	async ({ params }: Parameters<PageServerLoad>[0]): Promise<ServerData> => {
		const ticketCounter = await ticketCounterService.getById(params._id);
		if (!ticketCounter) {
			throw new NotFoundError('ticket counter does not exist');
		}

		return {
			ticketCounter
		};
	}
);

export const actions: Actions = {
	incrementAvailableCount: adminAction(async ({ params }) => {
		const counterId = requireRouteParam(params, '_id');
		await ticketCounterService.incrementTickets(counterId, { available: 10, reserved: 0, sold: 0 });
	})
};

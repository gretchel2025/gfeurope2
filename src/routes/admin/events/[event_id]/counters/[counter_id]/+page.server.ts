import type { Actions, PageServerLoad } from './$types';
import { NotFoundError, ValidationError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

const minTicketsToAdd = 1;
const maxTicketsToAdd = 100;

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
		const quantity = parseAvailableTicketQuantity(await event.request.formData());
		await ticketCounterService.addAvailableTickets(
			counterId,
			quantity,
			await adminRequestAuditActor(event)
		);
	})
};

function parseAvailableTicketQuantity(formData: FormData): number {
	const value = formData.get('quantity');
	const quantity = typeof value === 'string' ? Number(value) : Number.NaN;
	if (!Number.isInteger(quantity) || quantity < minTicketsToAdd || quantity > maxTicketsToAdd) {
		throw new ValidationError(`choose between ${minTicketsToAdd} and ${maxTicketsToAdd} tickets`);
	}

	return quantity;
}

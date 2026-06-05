import type { Actions, PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	standardTicketCounter: TicketCounter;
	grandFeastPlusTicketCounter: TicketCounter;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		services: { ticketCounterService }
	} = await getEventServiceContext(event);
	const [standardTicketCounter, grandFeastPlusTicketCounter] = await Promise.all([
		ticketCounterService.getStandardTickets(),
		ticketCounterService.getGrandFeastPlusTickets()
	]);

	if (!standardTicketCounter) throw new NotFoundError('standard ticket counter is missing');
	if (!grandFeastPlusTicketCounter)
		throw new NotFoundError('GrandFeast Plus ticket counter is missing');

	return {
		standardTicketCounter,
		grandFeastPlusTicketCounter
	};
});

export const actions: Actions = {
	add10ToAvailableStandardTickets: adminAction(async (event) => {
		const {
			services: { ticketCounterService }
		} = await getEventServiceContext(event);
		await ticketCounterService.incrementStandardTickets({ available: 10, reserved: 0, sold: 0 });
	}),
	add10ToAvailableGrandFeastPlusTickets: adminAction(async (event) => {
		const {
			services: { ticketCounterService }
		} = await getEventServiceContext(event);
		await ticketCounterService.incrementGrandFeastPlusTickets({
			available: 10,
			reserved: 0,
			sold: 0
		});
	})
};

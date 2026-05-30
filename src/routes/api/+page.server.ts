import type { Actions } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';
import { ticketCounterService } from '$lib/server/http/services';

export type ServerData = {
	standardTicketCounter: TicketCounter;
	grandFeastPlusTicketCounter: TicketCounter;
};

export const load = withKitErrors(async (): Promise<ServerData> => {
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
	add10ToAvailableStandardTickets: adminAction(async () => {
		await ticketCounterService.incrementStandardTickets({ available: 10, reserved: 0, sold: 0 });
	}),
	add10ToAvailableGrandFeastPlusTickets: adminAction(async () => {
		await ticketCounterService.incrementGrandFeastPlusTickets({
			available: 10,
			reserved: 0,
			sold: 0
		});
	})
};

import type { Actions } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';
import { ticketCounterService } from '$lib/server/http/services';

export type ServerData = {
	standardTicketCounter: TicketCounter;
	vipTicketCounter: TicketCounter;
	youthTicketCounter: TicketCounter;
};

export const load = withKitErrors(async (): Promise<ServerData> => {
	const [standardTicketCounter, vipTicketCounter, youthTicketCounter] = await Promise.all([
		ticketCounterService.getStandardTickets(),
		ticketCounterService.getVipTickets(),
		ticketCounterService.getYouthTickets()
	]);

	if (!standardTicketCounter) throw new NotFoundError('standard ticket counter is missing');
	if (!vipTicketCounter) throw new NotFoundError('vip ticket counter is missing');
	if (!youthTicketCounter) throw new NotFoundError('youth ticket counter is missing');

	return {
		standardTicketCounter,
		vipTicketCounter,
		youthTicketCounter
	};
});

export const actions: Actions = {
	add10ToAvailableStandardTickets: adminAction(async () => {
		await ticketCounterService.incrementStandardTickets({ available: 10, reserved: 0, sold: 0 });
	}),
	add10ToAvailableVIPTickets: adminAction(async () => {
		await ticketCounterService.incrementVipTickets({ available: 10, reserved: 0, sold: 0 });
	}),
	add10ToAvailableYouthTickets: adminAction(async () => {
		await ticketCounterService.incrementYouthTickets({ available: 10, reserved: 0, sold: 0 });
	})
};

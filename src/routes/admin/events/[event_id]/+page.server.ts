import type { Actions, PageServerLoad } from './$types';
import {
	buildTicketCounterDashboardItems,
	type TicketCounterDashboardItem
} from '$lib/application/services/ticketCounterService';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	ticketCounters: TicketCounterDashboardItem[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { ticketCounterService, ticketTypeService }
	} = await getEventServiceContext(event);
	const [ticketCounters, ticketTypes] = await Promise.all([
		ticketCounterService.list(),
		ticketTypeService.list(eventId)
	]);

	return {
		ticketCounters: buildTicketCounterDashboardItems(ticketCounters, ticketTypes)
	};
});

export const actions: Actions = {
	add10ToAvailableStandardTickets: adminAction(async (event) => {
		const {
			services: { ticketCounterService }
		} = await getEventServiceContext(event);
		await ticketCounterService.addAvailableStandardTickets(10, await adminRequestAuditActor(event));
	}),
	add10ToAvailableGrandFeastPlusTickets: adminAction(async (event) => {
		const {
			services: { ticketCounterService }
		} = await getEventServiceContext(event);
		await ticketCounterService.addAvailableGrandFeastPlusTickets(
			10,
			await adminRequestAuditActor(event)
		);
	})
};

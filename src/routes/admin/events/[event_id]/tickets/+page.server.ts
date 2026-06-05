import type { Ticket } from '$lib/domain/ticket';
import { getEventServiceContext } from '$lib/server/http/eventContext';

export type ServerData = {
	tickets: Ticket[];
};

export async function load(event): Promise<ServerData> {
	const {
		services: { ticketService }
	} = await getEventServiceContext(event);
	return {
		tickets: await ticketService.getAll()
	};
}

import { appConfig } from '$lib/infrastructure/config/env.server';
import { ticketTypeService } from '$lib/server/http/services';
import type { TicketTypeConfig } from '$lib/domain/ticketType';

export type ServerData = {
	ticketTypes: TicketTypeConfig[];
};

export async function load(): Promise<ServerData> {
	return {
		ticketTypes: await ticketTypeService.listActive(appConfig.appEventId)
	};
}

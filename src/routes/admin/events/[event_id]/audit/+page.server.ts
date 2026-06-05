import type { PageServerLoad } from './$types';
import type { AuditEvent } from '$lib/domain/auditEvent';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	auditEvents: AuditEvent[];
	historyLoaded: boolean;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { auditEventService }
	} = await getEventServiceContext(event);
	const historyLoaded = event.url.searchParams.get('load_history') === 'true';

	return {
		auditEvents: historyLoaded ? await auditEventService.listByEvent(eventId) : [],
		historyLoaded
	};
});

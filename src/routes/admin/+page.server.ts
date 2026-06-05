import type { Event } from '$lib/domain/event';
import {
	getAuthSession,
	getSessionEventRoles,
	getSessionRoles
} from '$lib/infrastructure/auth/session';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { canAccessGlobalAdmin, getAccessibleAdminEvents } from '$lib/navigation/adminDirectory';
import { repositories } from '$lib/server/http/services';
import { requireAnyAdminSession } from '$lib/server/http/guards';
import { withKitErrors } from '$lib/server/http/handlers';
import type { PageServerLoad } from './$types';

export type AdminEventRoute = Pick<Event, 'event_id' | 'title' | 'country' | 'datetime'> & {
	href: string;
};

export type ServerData = {
	eventRoutes: AdminEventRoute[];
	canAccessGlobalAdmin: boolean;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const session = await getAuthSession(event);
	await requireAnyAdminSession(session);

	const roles = getSessionRoles(session);
	const eventRoles = getSessionEventRoles(session);
	const events = await repositories.eventRepository.list();
	const accessibleEvents = getAccessibleAdminEvents(events, roles, eventRoles);

	return {
		eventRoutes: accessibleEvents.map((eventRecord) => ({
			event_id: eventRecord.event_id,
			title: eventRecord.title,
			country: eventRecord.country,
			datetime: eventRecord.datetime,
			href: adminRoutes(eventRecord.event_id).home
		})),
		canAccessGlobalAdmin: canAccessGlobalAdmin(roles)
	};
});

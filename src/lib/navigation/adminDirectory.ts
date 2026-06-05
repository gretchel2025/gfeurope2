import type { Event } from '$lib/domain/event';
import { isSuperUser, type EventRoleMap, type UserRole } from '$lib/domain/user';

export function getAccessibleAdminEvents(
	events: Event[],
	roles: UserRole[],
	eventRoles: EventRoleMap
): Event[] {
	if (isSuperUser(roles)) {
		return events;
	}

	return events.filter((event) => eventRoles[event.event_id]?.includes('admin') ?? false);
}

export function canAccessGlobalAdmin(roles: UserRole[]): boolean {
	return isSuperUser(roles);
}

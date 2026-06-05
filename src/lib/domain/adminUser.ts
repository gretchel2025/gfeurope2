import {
	hasAdminAccess,
	hasAnyEventAdminAccess,
	hasTesterAccess,
	type EventRoleMap,
	type UserRole
} from '$lib/domain/user';

export type AdminUser = {
	_id: string;
	email: string;
	roles: UserRole[];
	event_roles: EventRoleMap;
	confirmed_at: string | null;
	created_at: string;
	last_sign_in_at: string | null;
};

export function shouldShowInAdminUserDirectory(user: Pick<AdminUser, 'roles' | 'event_roles'>) {
	return (
		hasTesterAccess(user.roles) ||
		hasAdminAccess(user.roles) ||
		hasAnyEventAdminAccess(user.event_roles)
	);
}

export function compareAdminUsers(
	a: Pick<AdminUser, '_id' | 'email'>,
	b: Pick<AdminUser, '_id' | 'email'>
) {
	const emailComparison = a.email.localeCompare(b.email, undefined, { sensitivity: 'base' });
	if (emailComparison !== 0) {
		return emailComparison;
	}

	return a._id.localeCompare(b._id);
}

/**
 * Purpose:
 * This file defines persisted user/admin shapes plus session-facing user helpers.
 *
 * Why this structure is good:
 * Splitting domain user concepts from auth infrastructure keeps access rules
 * explicit and gives the rest of the app one place to ask user-related questions.
 */
/** Access roles supported by hosted and local user records. */
export type UserRole = 'tester' | 'admin' | 'superuser';

/** Persisted admin/user record stored in the database. */
export type User = {
	_id: string;
	roles: UserRole[];
};

/** Auth-derived user shape used by guarded routes after session resolution. */
export type SessionUser = {
	_id: string;
	userName: string;
	isASuperUser: boolean;
	wasFound: boolean;
};

/** Helper for role membership checks used by the guard layer. */
export function hasUserRole(user: User | null, role: UserRole): boolean {
	return Boolean(user?.roles.includes(role));
}

/** Tester access grants entry to the live development site. */
export function hasTesterAccess(user: User | null): boolean {
	return hasUserRole(user, 'tester');
}

/** Admin access grants entry to admin routes outside the live development site. */
export function hasAdminAccess(user: User | null): boolean {
	return hasUserRole(user, 'admin') || isSuperUser(user);
}

/** Helper for role-based access checks used by the guard layer. */
export function isSuperUser(user: User | null): boolean {
	return hasUserRole(user, 'superuser');
}

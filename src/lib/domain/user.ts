/**
 * Purpose:
 * This file defines authorization roles plus session-facing user helpers.
 *
 * Why this structure is good:
 * Splitting domain user concepts from auth infrastructure keeps access rules explicit
 * without tying the app to a specific auth provider's raw field shapes.
 */
/** Access roles supported by Supabase Auth app metadata. */
export type UserRole = 'tester' | 'admin' | 'superuser';

/** Auth-derived user shape used by guarded routes after session resolution. */
export type SessionUser = {
	_id: string;
	userName: string;
	isASuperUser: boolean;
	wasFound: boolean;
};

const supportedRoles = new Set<UserRole>(['tester', 'admin', 'superuser']);

/** Returns only supported role names from provider-owned authorization metadata. */
export function normalizeUserRoles(value: unknown): UserRole[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isUserRole);
}

/** Type guard for supported application roles. */
export function isUserRole(value: unknown): value is UserRole {
	return typeof value === 'string' && supportedRoles.has(value as UserRole);
}

/** Helper for role membership checks used by the guard layer. */
export function hasUserRole(roles: UserRole[], role: UserRole): boolean {
	return roles.includes(role);
}

/** Tester access grants entry to the live development site. */
export function hasTesterAccess(roles: UserRole[]): boolean {
	return hasUserRole(roles, 'tester');
}

/** Admin access grants entry to admin routes outside the live development site. */
export function hasAdminAccess(roles: UserRole[]): boolean {
	return hasUserRole(roles, 'admin') || isSuperUser(roles);
}

/** Helper for role-based access checks used by the guard layer. */
export function isSuperUser(roles: UserRole[]): boolean {
	return hasUserRole(roles, 'superuser');
}

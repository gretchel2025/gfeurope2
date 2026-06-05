/**
 * Purpose:
 * This file contains HTTP-facing auth and authorization guards.
 *
 * Why this structure is good:
 * Route-level access checks stay consistent when they are centralized here
 * instead of being reimplemented differently across many pages and actions.
 */
import type { RequestEvent } from '@sveltejs/kit';
import { AuthenticationRequiredError, PermissionDeniedError } from '$lib/application/errors';
import type { SessionUser } from '$lib/domain/user';
import { hasEventAdminAccess, isSuperUser } from '$lib/domain/user';
import {
	getAuthSession,
	getSessionEventRoles,
	getSessionRoles,
	type AppSession
} from '$lib/infrastructure/auth/session';
import { getPathEventId } from '$lib/infrastructure/auth/accessPolicy';
import { getSessionUser } from '$lib/infrastructure/auth/sessionUser';

/** Requires an authenticated admin session and returns the normalized session user. */
export async function requireAdminSession(
	session: AppSession | null,
	eventId: string | null
): Promise<{ session: AppSession; user: SessionUser }> {
	const currentUser = getSessionUser(session);
	if (!currentUser.wasFound || !session) {
		throw new AuthenticationRequiredError('sign in required');
	}

	const roles = getSessionRoles(session);
	const eventRoles = getSessionEventRoles(session);
	if (!hasEventAdminAccess(roles, eventRoles, eventId)) {
		throw new PermissionDeniedError(`user ${currentUser._id} unauthorized`);
	}

	return {
		session,
		user: {
			...currentUser,
			isASuperUser: isSuperUser(roles)
		}
	};
}

/** Requires a signed-in superuser session. */
export async function requireSuperUserSession(
	session: AppSession | null
): Promise<{ session: AppSession; user: SessionUser }> {
	const result = await requireAdminSession(session, null);
	if (!result.user.isASuperUser) {
		throw new PermissionDeniedError('unauthorized, must be a superuser');
	}
	return result;
}

/** RequestEvent wrapper for admin-only route handlers. */
export async function requireAdminRequest(
	event: RequestEvent
): Promise<{ session: AppSession; user: SessionUser }> {
	return await requireAdminSession(await getAuthSession(event), getPathEventId(event.url.pathname));
}

/** RequestEvent wrapper for superuser-only route handlers. */
export async function requireSuperUserRequest(
	event: RequestEvent
): Promise<{ session: AppSession; user: SessionUser }> {
	return await requireSuperUserSession(await getAuthSession(event));
}

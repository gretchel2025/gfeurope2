import type { RequestEvent } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { normalizeUserRoles, type UserRole } from '$lib/domain/user';
import { logger } from '$lib/infrastructure/logging/logger';

export type AppSession = Session;

export async function getAuthSession(event: RequestEvent): Promise<AppSession | null> {
	let sessionResult;
	try {
		sessionResult = await event.locals.safeGetSession();
	} catch (caught) {
		logger.warn(
			{
				err: caught,
				path: event.url.pathname
			},
			'[WARN] Supabase session lookup failed'
		);
		return null;
	}

	const { session, user } = sessionResult;

	if (!session || !user) {
		return null;
	}

	return {
		...session,
		user
	};
}

export function getSessionRoles(session: AppSession | null): UserRole[] {
	return normalizeUserRoles(session?.user?.app_metadata?.roles);
}

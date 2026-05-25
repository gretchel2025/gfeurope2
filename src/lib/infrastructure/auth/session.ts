import type { RequestEvent } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { normalizeUserRoles, type UserRole } from '$lib/domain/user';

export type AppSession = Session;

export async function getAuthSession(event: RequestEvent): Promise<AppSession | null> {
	const { session, user } = await event.locals.safeGetSession();

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

/**
 * Purpose:
 * This file converts an auth session into the app's internal SessionUser shape.
 *
 * Why this structure is good:
 * Translating third-party session data once keeps the rest of the codebase from
 * depending directly on auth provider field shapes.
 */
import type { AppSession } from '$lib/infrastructure/auth/session';
import type { SessionUser } from '$lib/domain/user';

/** Maps a Supabase Auth session into the app's normalized session user shape. */
export function getSessionUser(session: AppSession | null): SessionUser {
	const email = session?.user?.email?.trim().toLowerCase();
	const metadataName = session?.user?.user_metadata?.name;
	const name =
		typeof metadataName === 'string' && metadataName.trim() ? metadataName : (email ?? '');

	if (!email) {
		return {
			userName: '',
			_id: '',
			isASuperUser: false,
			wasFound: false
		};
	}

	return {
		userName: name,
		_id: email,
		isASuperUser: false,
		wasFound: true
	};
}

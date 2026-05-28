import type { PageServerLoad } from './$types';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { getRuntimeAccessMode, sanitizeRedirectTo } from '$lib/infrastructure/auth/accessPolicy';

export type ServerData = {
	hasGoogleAuth: boolean;
	allowLocalPasswordAuth: boolean;
	callbackURL: string;
	authError: boolean;
};

export const load: PageServerLoad = (event): ServerData => {
	const mode = getRuntimeAccessMode({
		dev: appConfig.dev,
		hostname: event.url.hostname,
		netlifyBranch: appConfig.netlifyBranch
	});
	const redirectTo = sanitizeRedirectTo(event.url.searchParams.get('redirectTo'));

	return {
		hasGoogleAuth: Boolean(appConfig.supabaseUrl && appConfig.supabasePublishableKey),
		allowLocalPasswordAuth: mode === 'local' && isLocalSupabaseUrl(appConfig.supabaseUrl),
		callbackURL: redirectTo ?? (mode === 'live-dev' ? '/' : '/api'),
		authError: event.url.searchParams.has('error')
	};
};

function isLocalSupabaseUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return (
			url.protocol === 'http:' &&
			(url.hostname === '127.0.0.1' || url.hostname === 'localhost') &&
			url.port === '54321'
		);
	} catch {
		return false;
	}
}

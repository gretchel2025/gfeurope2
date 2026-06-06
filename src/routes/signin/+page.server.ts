import type { PageServerLoad } from './$types';
import { appConfig } from '$lib/infrastructure/config/env.server';
import {
	getPasswordAuthMode,
	getRuntimeAccessMode,
	sanitizeRedirectTo,
	type PasswordAuthMode
} from '$lib/infrastructure/auth/accessPolicy';
import { publicRoutes } from '$lib/navigation/adminRoutes';

export type ServerData = {
	hasGoogleAuth: boolean;
	passwordAuthMode: PasswordAuthMode;
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
		passwordAuthMode: getPasswordAuthMode({
			mode,
			supabaseUrl: appConfig.supabaseUrl,
			enableEmailPasswordAuth: appConfig.enableEmailPasswordAuth
		}),
		callbackURL: redirectTo ?? publicRoutes(appConfig.appEventId).home,
		authError: event.url.searchParams.has('error')
	};
};

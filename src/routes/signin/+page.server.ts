import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { getRuntimeAccessMode, sanitizeRedirectTo } from '$lib/infrastructure/auth/accessPolicy';
import {
	auth,
	betterAuthUserExists,
	localAdminAuthPassword,
	markBetterAuthUserEmailVerified
} from '$lib/infrastructure/auth/authConfig';

export type ServerData = {
	hasGoogleAuth: boolean;
	hasLocalDevAuth: boolean;
	callbackURL: string;
};

export const load: PageServerLoad = (event): ServerData => {
	const mode = getRuntimeAccessMode({
		dev: appConfig.dev,
		hostname: event.url.hostname,
		netlifyBranch: appConfig.netlifyBranch
	});
	const redirectTo = sanitizeRedirectTo(event.url.searchParams.get('redirectTo'));

	return {
		hasGoogleAuth: Boolean(appConfig.googleClientId && appConfig.googleClientSecret),
		hasLocalDevAuth: appConfig.dev && appConfig.localAdminEmails.length > 0,
		callbackURL: redirectTo ?? (mode === 'live-dev' ? '/' : '/api')
	};
};

export const actions: Actions = {
	localAdminSignIn: async ({ request }) => {
		if (!appConfig.dev || appConfig.localAdminEmails.length === 0) {
			return fail(404, {
				message: 'Local admin sign-in is not enabled'
			});
		}

		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase() ?? '';
		const redirectTo = sanitizeRedirectTo(data.get('redirectTo')?.toString() ?? null) ?? '/api';

		if (!email || !appConfig.localAdminEmails.includes(email)) {
			return fail(400, {
				message: 'Enter a configured local admin email'
			});
		}

		if (!(await betterAuthUserExists(email))) {
			await auth.api.signUpEmail({
				body: {
					email,
					name: email,
					password: localAdminAuthPassword
				}
			});
		}

		await markBetterAuthUserEmailVerified(email);

		await auth.api.signInEmail({
			body: {
				email,
				password: localAdminAuthPassword,
				callbackURL: redirectTo
			}
		});

		throw redirect(303, redirectTo);
	}
};

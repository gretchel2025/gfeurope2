import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { appConfig } from '$lib/infrastructure/config/env.server';
import {
	auth,
	betterAuthUserExists,
	localAdminAuthPassword,
	markBetterAuthUserEmailVerified
} from '$lib/infrastructure/auth/authConfig';

export type ServerData = {
	hasGoogleAuth: boolean;
	hasLocalDevAuth: boolean;
};

export function load(): ServerData {
	return {
		hasGoogleAuth: Boolean(appConfig.googleClientId && appConfig.googleClientSecret),
		hasLocalDevAuth: appConfig.dev && appConfig.localAdminEmails.length > 0
	};
}

export const actions: Actions = {
	localAdminSignIn: async ({ request }) => {
		if (!appConfig.dev || appConfig.localAdminEmails.length === 0) {
			return fail(404, {
				message: 'Local admin sign-in is not enabled'
			});
		}

		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase() ?? '';

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
				callbackURL: '/api'
			}
		});

		throw redirect(303, '/api');
	}
};

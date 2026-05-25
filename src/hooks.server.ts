import { bootstrapApplication } from '$lib/infrastructure/bootstrap/bootstrap';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { auth } from './auth';
import { appConfig } from '$lib/infrastructure/config/env.server';
import {
	buildRedirectTo,
	evaluateAccess,
	getRequiredAccess,
	getRuntimeAccessMode
} from '$lib/infrastructure/auth/accessPolicy';
import { getAuthSession } from '$lib/infrastructure/auth/session';
import { getSessionUser } from '$lib/infrastructure/auth/sessionUser';
import { userService } from '$lib/server/http/services';

await bootstrapApplication();

export const handle: Handle = async ({ event, resolve }) => {
	const mode = getRuntimeAccessMode({
		dev: appConfig.dev,
		hostname: event.url.hostname,
		netlifyBranch: appConfig.netlifyBranch
	});
	const requiredAccess = getRequiredAccess({
		mode,
		pathname: event.url.pathname
	});

	if (!requiredAccess.bypass && (requiredAccess.requiresTester || requiredAccess.requiresAdmin)) {
		const session = await getAuthSession(event);
		const sessionUser = getSessionUser(session);
		const dbUser = sessionUser.wasFound ? await userService.getById(sessionUser._id) : null;
		const access = evaluateAccess({
			requiredAccess,
			signedIn: Boolean(session),
			roles: dbUser?.roles ?? []
		});

		if (!access.allowed && access.reason === 'sign-in-required') {
			const redirectTo = encodeURIComponent(buildRedirectTo(event.url));
			throw redirect(303, `/signin?redirectTo=${redirectTo}`);
		}

		if (!access.allowed) {
			throw redirect(303, '/unauthorized');
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

import { bootstrapApplication } from '$lib/infrastructure/bootstrap/bootstrap';
import { building } from '$app/environment';
import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
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

	if (isAuthRequest(event.url.pathname)) {
		return auth.handler(buildPublicOriginAuthRequest(event));
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

function isAuthRequest(pathname: string): boolean {
	return pathname === '/api/auth' || pathname.startsWith('/api/auth/');
}

function buildPublicOriginAuthRequest(event: RequestEvent): Request {
	const publicOrigin = event.request.headers.get('x-grandfeast-public-origin');
	if (!publicOrigin) {
		return event.request;
	}

	const publicUrl = new URL(event.request.url);
	const originUrl = new URL(publicOrigin);
	publicUrl.protocol = originUrl.protocol;
	publicUrl.host = originUrl.host;

	const headers = new Headers(event.request.headers);
	headers.set('host', originUrl.host);
	headers.set('x-forwarded-host', originUrl.host);
	headers.set('x-forwarded-proto', originUrl.protocol.replace(':', ''));

	const init: RequestInit & { duplex?: 'half' } = {
		method: event.request.method,
		headers,
		body: event.request.body,
		redirect: event.request.redirect
	};

	if (event.request.body) {
		init.duplex = 'half';
	}

	return new Request(publicUrl, init);
}

import { bootstrapApplication } from '$lib/infrastructure/bootstrap/bootstrap';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { assertAllowedFormOrigin } from '$lib/infrastructure/auth/csrfOrigin';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { logger } from '$lib/infrastructure/logging/logger';
import {
	buildRedirectTo,
	evaluateAccess,
	getRequiredAccess,
	getRuntimeAccessMode
} from '$lib/infrastructure/auth/accessPolicy';
import { getAuthSession, getSessionRoles } from '$lib/infrastructure/auth/session';

await bootstrapApplication();

const emptySession = { session: null, user: null };

export const handle: Handle = async ({ event, resolve }) => {
	assertAllowedFormOrigin(event, appConfig.appBaseUrl);

	event.locals.supabase =
		appConfig.supabaseUrl && appConfig.supabasePublishableKey
			? createServerClient(appConfig.supabaseUrl, appConfig.supabasePublishableKey, {
					cookies: {
						getAll: () => event.cookies.getAll(),
						setAll: (cookiesToSet) => {
							cookiesToSet.forEach(({ name, value, options }) => {
								event.cookies.set(name, value, { ...options, path: '/' });
							});
						}
					}
				})
			: undefined;

	event.locals.safeGetSession = async () => {
		if (!event.locals.supabase) {
			return emptySession;
		}

		try {
			const {
				data: { user },
				error
			} = await event.locals.supabase.auth.getUser();

			if (error || !user) {
				return emptySession;
			}

			const {
				data: { session },
				error: sessionError
			} = await event.locals.supabase.auth.getSession();

			if (sessionError || !session) {
				return emptySession;
			}

			return { session, user };
		} catch (caught) {
			logger.warn(
				{
					err: caught,
					path: event.url.pathname
				},
				'[WARN] Supabase session lookup failed'
			);
			return emptySession;
		}
	};

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
		const access = evaluateAccess({
			requiredAccess,
			signedIn: Boolean(session),
			roles: getSessionRoles(session)
		});

		if (!access.allowed && access.reason === 'sign-in-required') {
			const redirectTo = encodeURIComponent(buildRedirectTo(event.url));
			throw redirect(303, `/signin?redirectTo=${redirectTo}`);
		}

		if (!access.allowed) {
			throw redirect(303, '/unauthorized');
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

export const handleError: HandleServerError = ({ error, event, message, status }) => {
	const mode = getRuntimeAccessMode({
		dev: appConfig.dev,
		hostname: event.url.hostname,
		netlifyBranch: appConfig.netlifyBranch
	});
	logger.error(
		{
			err: error,
			status,
			message,
			path: event.url.pathname
		},
		'[ERROR] Unhandled SvelteKit request error'
	);

	if (mode !== 'production') {
		return {
			message,
			code: getErrorCode(error),
			name: getErrorName(error),
			path: event.url.pathname,
			stack: getErrorStack(error),
			cause: getErrorCause(error),
			timestamp: new Date().toISOString()
		};
	}

	return { message };
};

function getErrorCode(error: unknown): string | undefined {
	return getErrorRecord(error).code;
}

function getErrorName(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.name;
	}

	return getErrorRecord(error).name;
}

function getErrorStack(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.stack;
	}

	return getErrorRecord(error).stack;
}

function getErrorCause(error: unknown): string | undefined {
	if (!(error instanceof Error) || error.cause === undefined) {
		return getErrorRecord(error).cause;
	}

	if (error.cause instanceof Error) {
		return `${error.cause.name}: ${error.cause.message}`;
	}

	return String(error.cause);
}

function getErrorRecord(error: unknown): Record<string, string | undefined> {
	if (!error || typeof error !== 'object') {
		return {};
	}

	const record = error as Record<string, unknown>;
	return {
		code: typeof record.code === 'string' ? record.code : undefined,
		name: typeof record.name === 'string' ? record.name : undefined,
		stack: typeof record.stack === 'string' ? record.stack : undefined,
		cause: typeof record.cause === 'string' ? record.cause : undefined
	};
}

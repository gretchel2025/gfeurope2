/**
 * Purpose:
 * This file provides small wrappers for SvelteKit route handlers and actions.
 *
 * Why this structure is good:
 * New server routes can reuse the same auth and error-handling flow instead of
 * copying try/catch blocks. That gives future feature work a reliable template.
 */
import type { RequestEvent } from '@sveltejs/kit';
import { ValidationError } from '$lib/application/errors';
import { rethrowAsKitError } from '$lib/server/http/appError';
import { requireAdminRequest, requireSuperUserRequest } from '$lib/server/http/guards';

type MaybePromise<T> = T | Promise<T>;

/** Runs any route callback and translates application errors at the SvelteKit edge. */
export function withKitErrors<TEvent, TResult>(
	handler: (event: TEvent) => MaybePromise<TResult>
): (event: TEvent) => Promise<TResult> {
	return async (event: TEvent): Promise<TResult> => {
		try {
			return await handler(event);
		} catch (caught) {
			rethrowAsKitError(caught);
		}
	};
}

/** Wraps a form action that only needs the shared error translation. */
export function kitAction<TResult>(
	handler: (event: RequestEvent) => MaybePromise<TResult>
): (event: RequestEvent) => Promise<TResult> {
	return withKitErrors(handler);
}

/** Wraps a form action that requires an authenticated admin. */
export function adminAction<TResult>(
	handler: (event: RequestEvent) => MaybePromise<TResult>
): (event: RequestEvent) => Promise<TResult> {
	return withKitErrors(async (event: RequestEvent): Promise<TResult> => {
		await requireAdminRequest(event);
		return await handler(event);
	});
}

/** Wraps a form action that requires a signed-in superuser. */
export function superUserAction<TResult>(
	handler: (event: RequestEvent) => MaybePromise<TResult>
): (event: RequestEvent) => Promise<TResult> {
	return withKitErrors(async (event: RequestEvent): Promise<TResult> => {
		await requireSuperUserRequest(event);
		return await handler(event);
	});
}

/** Reads a required route parameter from a broad SvelteKit RequestEvent. */
export function requireRouteParam(params: Partial<Record<string, string>>, key: string): string {
	const value = params[key];
	if (!value) {
		throw new ValidationError(`missing route parameter: ${key}`);
	}

	return value;
}

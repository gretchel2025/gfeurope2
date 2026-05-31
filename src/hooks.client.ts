import type { HandleClientError } from '@sveltejs/kit';

const storageKey = 'grandfeast:last-client-error';

export const handleError: HandleClientError = ({ error, event, message, status }) => {
	const diagnostic = {
		message,
		status,
		code: getErrorCode(error),
		name: getErrorName(error),
		path: event.url.pathname,
		url: event.url.href,
		routeId: event.route.id,
		stack: getErrorStack(error),
		cause: getErrorCause(error),
		userAgent: navigator.userAgent,
		timestamp: new Date().toISOString()
	};

	recordClientError({
		type: 'sveltekit-client-error',
		...diagnostic
	});

	return diagnostic;
};

function recordClientError(payload: Record<string, unknown>) {
	try {
		window.__grandfeastLastClientError = payload;
		sessionStorage.setItem(storageKey, JSON.stringify(payload));
	} catch {
		// Best effort only. Error handling must not create another error.
	}
}

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

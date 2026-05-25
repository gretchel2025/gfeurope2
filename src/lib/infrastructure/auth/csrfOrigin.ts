import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const formContentTypes = new Set([
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain'
]);

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const deploymentOrigins = new Set([
	'https://grandfeast.eu',
	'https://www.grandfeast.eu',
	'https://dev.grandfeast.eu',
	'https://dev--grand-feast-uk-x-europe.netlify.app'
]);

export type CsrfOriginInput = {
	method: string;
	contentType: string | null;
	origin: string | null;
	requestOrigin: string;
	appBaseUrl: string;
};

export function assertAllowedFormOrigin(event: RequestEvent, appBaseUrl: string): void {
	const result = evaluateFormOrigin({
		method: event.request.method,
		contentType: event.request.headers.get('content-type'),
		origin: event.request.headers.get('origin'),
		requestOrigin: event.url.origin,
		appBaseUrl
	});

	if (!result.allowed) {
		throw error(403, `Cross-site ${event.request.method} form submissions are forbidden`);
	}
}

export function evaluateFormOrigin(input: CsrfOriginInput): { allowed: boolean } {
	if (!requiresOriginCheck(input.method, input.contentType)) {
		return { allowed: true };
	}

	const origin = normalizeOrigin(input.origin);
	if (!origin) {
		return { allowed: false };
	}

	if (origin === normalizeOrigin(input.requestOrigin)) {
		return { allowed: true };
	}

	return {
		allowed: buildTrustedOrigins(input.appBaseUrl).has(origin)
	};
}

function requiresOriginCheck(method: string, contentType: string | null): boolean {
	return unsafeMethods.has(method.toUpperCase()) && isFormContentType(contentType);
}

function isFormContentType(contentType: string | null): boolean {
	const [type] = contentType?.toLowerCase().split(';', 1) ?? [];
	return formContentTypes.has(type);
}

function buildTrustedOrigins(appBaseUrl: string): Set<string> {
	const origins = new Set(deploymentOrigins);
	const appOrigin = normalizeOrigin(appBaseUrl);

	if (appOrigin) {
		origins.add(appOrigin);
	}

	return origins;
}

function normalizeOrigin(value: string | null): string | null {
	if (!value) {
		return null;
	}

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

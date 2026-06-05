import {
	hasAnyAdminAccess,
	hasEventAdminAccess,
	hasTesterAccess,
	isSuperUser,
	type EventRoleMap,
	type UserRole
} from '$lib/domain/user';

export type RuntimeAccessMode = 'local' | 'production' | 'live-dev';
export type AccessDenialReason = 'sign-in-required' | 'permission-denied';
export type PasswordAuthMode = 'none' | 'local' | 'live-dev';
export type AdminAccessScope = 'none' | 'directory' | 'event' | 'global';

export type RuntimeAccessInput = {
	dev: boolean;
	hostname: string;
	netlifyBranch?: string;
};

export type RequiredAccess = {
	mode: RuntimeAccessMode;
	pathname: string;
	eventId: string | null;
	adminAccessScope: AdminAccessScope;
	bypass: boolean;
	requiresTester: boolean;
	requiresAdmin: boolean;
};

export type AccessEvaluation = {
	allowed: boolean;
	reason?: AccessDenialReason;
};

const liveDevHostnames = new Set(['dev.grandfeast.eu', 'dev--grand-feast-uk-x-europe.netlify.app']);

const staticAssetExtensions = new Set([
	'.avif',
	'.css',
	'.gif',
	'.ico',
	'.jpg',
	'.jpeg',
	'.js',
	'.json',
	'.map',
	'.mov',
	'.mp4',
	'.png',
	'.svg',
	'.txt',
	'.webmanifest',
	'.woff',
	'.woff2'
]);

export function getRuntimeAccessMode(input: RuntimeAccessInput): RuntimeAccessMode {
	if (input.dev) {
		return 'local';
	}

	if (isLiveDevHost(input.hostname) || input.netlifyBranch === 'dev') {
		return 'live-dev';
	}

	return 'production';
}

export function getPasswordAuthMode(input: {
	mode: RuntimeAccessMode;
	supabaseUrl: string;
	enableLiveDevPasswordAuth: boolean;
}): PasswordAuthMode {
	if (input.mode === 'local' && isLocalSupabaseUrl(input.supabaseUrl)) {
		return 'local';
	}

	if (input.mode === 'live-dev' && input.enableLiveDevPasswordAuth) {
		return 'live-dev';
	}

	return 'none';
}

export function getRequiredAccess(input: {
	mode: RuntimeAccessMode;
	pathname: string;
}): RequiredAccess {
	const bypass = isAuthBypassPath(input.pathname);
	const adminAccessScope = getAdminAccessScope(input.pathname);
	const eventId = getPathEventId(input.pathname);

	return {
		mode: input.mode,
		pathname: input.pathname,
		eventId,
		adminAccessScope,
		bypass,
		requiresTester: !bypass && input.mode === 'live-dev',
		requiresAdmin: !bypass && adminAccessScope !== 'none'
	};
}

export function evaluateAccess(input: {
	requiredAccess: RequiredAccess;
	signedIn: boolean;
	roles: UserRole[];
	eventRoles: EventRoleMap;
}): AccessEvaluation {
	if (input.requiredAccess.bypass) {
		return { allowed: true };
	}

	if (!input.requiredAccess.requiresTester && input.requiredAccess.adminAccessScope === 'none') {
		return { allowed: true };
	}

	if (!input.signedIn) {
		return {
			allowed: false,
			reason: 'sign-in-required'
		};
	}

	if (input.requiredAccess.requiresTester && !hasTesterAccess(input.roles)) {
		return {
			allowed: false,
			reason: 'permission-denied'
		};
	}

	if (input.requiredAccess.requiresAdmin) {
		if (
			input.requiredAccess.adminAccessScope === 'directory' &&
			!hasAnyAdminAccess(input.roles, input.eventRoles)
		) {
			return {
				allowed: false,
				reason: 'permission-denied'
			};
		}

		if (input.requiredAccess.adminAccessScope === 'global' && !isSuperUser(input.roles)) {
			return {
				allowed: false,
				reason: 'permission-denied'
			};
		}

		if (
			input.requiredAccess.adminAccessScope === 'event' &&
			!hasEventAdminAccess(input.roles, input.eventRoles, input.requiredAccess.eventId)
		) {
			return {
				allowed: false,
				reason: 'permission-denied'
			};
		}
	}

	return { allowed: true };
}

export function isLiveDevHost(hostname: string): boolean {
	return liveDevHostnames.has(normalizeHostname(hostname));
}

export function isLocalSupabaseUrl(value: string): boolean {
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

export function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function getAdminAccessScope(pathname: string): AdminAccessScope {
	if (pathname === '/admin') {
		return 'directory';
	}

	if (pathname === '/admin/global' || pathname.startsWith('/admin/global/')) {
		return 'global';
	}

	if (pathname.startsWith('/admin/')) {
		return 'event';
	}

	return 'none';
}

export function isAuthBypassPath(pathname: string): boolean {
	if (
		pathname === '/signin' ||
		pathname === '/unauthorized' ||
		pathname === '/auth/callback' ||
		pathname.startsWith('/_app/')
	) {
		return true;
	}

	return hasStaticAssetExtension(pathname);
}

export function sanitizeRedirectTo(value: string | null): string | null {
	if (!value?.startsWith('/')) {
		return null;
	}

	if (value.startsWith('//')) {
		return null;
	}

	return value;
}

export function buildRedirectTo(url: URL): string {
	return `${url.pathname}${url.search}`;
}

export function getPathEventId(pathname: string): string | null {
	const segments = pathname.split('/').filter(Boolean);
	if (segments[0] === 'events' && segments[1]) {
		return decodeURIComponent(segments[1]);
	}
	if (segments[0] === 'admin' && segments[1] === 'events' && segments[2]) {
		return decodeURIComponent(segments[2]);
	}
	return null;
}

function hasStaticAssetExtension(pathname: string): boolean {
	const lastSegment = pathname.split('/').pop() ?? '';
	const extensionIndex = lastSegment.lastIndexOf('.');
	if (extensionIndex === -1) {
		return false;
	}

	return staticAssetExtensions.has(lastSegment.slice(extensionIndex).toLowerCase());
}

function normalizeHostname(hostname: string): string {
	return hostname.toLowerCase().replace(/:\d+$/, '');
}

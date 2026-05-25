import type { UserRole } from '$lib/domain/user';

export type RuntimeAccessMode = 'local' | 'production' | 'live-dev';
export type AccessDenialReason = 'sign-in-required' | 'permission-denied';

export type RuntimeAccessInput = {
	dev: boolean;
	hostname: string;
	netlifyBranch?: string;
};

export type RequiredAccess = {
	mode: RuntimeAccessMode;
	pathname: string;
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

export function getRequiredAccess(input: {
	mode: RuntimeAccessMode;
	pathname: string;
}): RequiredAccess {
	const bypass = isAuthBypassPath(input.pathname);
	const adminPath = isAdminPath(input.pathname);

	return {
		mode: input.mode,
		pathname: input.pathname,
		bypass,
		requiresTester: !bypass && input.mode === 'live-dev',
		requiresAdmin: !bypass && adminPath
	};
}

export function evaluateAccess(input: {
	requiredAccess: RequiredAccess;
	signedIn: boolean;
	roles: UserRole[];
}): AccessEvaluation {
	if (input.requiredAccess.bypass) {
		return { allowed: true };
	}

	if (!input.requiredAccess.requiresTester && !input.requiredAccess.requiresAdmin) {
		return { allowed: true };
	}

	if (!input.signedIn) {
		return {
			allowed: false,
			reason: 'sign-in-required'
		};
	}

	if (input.requiredAccess.requiresTester && !input.roles.includes('tester')) {
		return {
			allowed: false,
			reason: 'permission-denied'
		};
	}

	if (input.requiredAccess.requiresAdmin && !hasAdminRole(input.roles)) {
		return {
			allowed: false,
			reason: 'permission-denied'
		};
	}

	return { allowed: true };
}

export function isLiveDevHost(hostname: string): boolean {
	return liveDevHostnames.has(normalizeHostname(hostname));
}

export function isAdminPath(pathname: string): boolean {
	return pathname === '/api' || pathname.startsWith('/api/');
}

export function isAuthBypassPath(pathname: string): boolean {
	if (
		pathname === '/signin' ||
		pathname === '/unauthorized' ||
		pathname.startsWith('/api/auth/') ||
		pathname === '/api/auth' ||
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

function hasAdminRole(roles: UserRole[]): boolean {
	return roles.includes('admin') || roles.includes('superuser');
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

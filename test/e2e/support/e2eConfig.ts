import fs from 'node:fs';
import path from 'node:path';

export type E2eEnvironment = 'local' | 'live-dev' | 'prod';

export type AdminCredentials = {
	email: string;
	password: string;
};

const fileEnv = loadDotEnvFile(path.resolve(process.cwd(), '.env'));
const defaultBaseUrls: Record<E2eEnvironment, string> = {
	local: 'http://localhost:5173',
	'live-dev': 'https://dev.grandfeast.eu',
	prod: 'https://www.grandfeast.eu'
};

export const e2eConfig = {
	environment: readEnvironment(),
	baseURL: readEnv('E2E_BASE_URL') || defaultBaseUrls[readEnvironment()],
	eventId: readEnv('E2E_EVENT_ID') || 'gfeu2026',
	allowProdMutation: readEnv('E2E_ALLOW_PROD_MUTATION') === 'true',
	requiresAuthForPublicPages: readEnvironment() === 'live-dev'
};

export function shouldRunMutatingBooking(): boolean {
	return e2eConfig.environment !== 'prod' || e2eConfig.allowProdMutation;
}

export function requireAdminCredentials(): AdminCredentials {
	const email = readAdminEmail();
	const password = readAdminPassword();

	if (!email || !password) {
		throw new Error(
			`E2E admin credentials are required for ${e2eConfig.environment}. Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.`
		);
	}

	return { email, password };
}

export function makeBookingIdentity(): {
	email: string;
	name: string;
	runId: string;
} {
	const runId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const baseEmail = readEnv('E2E_BOOKING_EMAIL') || readDefaultBookingEmail();
	return {
		email: addEmailTag(baseEmail, runId),
		name: `E2E Booking ${runId}`,
		runId
	};
}

export function eventPath(pathname = ''): string {
	return `/events/${encodeURIComponent(e2eConfig.eventId)}${pathname}`;
}

export function adminEventPath(pathname = ''): string {
	return `/admin/events/${encodeURIComponent(e2eConfig.eventId)}${pathname}`;
}

export function expectPath(pathname: string): RegExp {
	return new RegExp(`${escapeRegExp(pathname)}(?:[/?#]|$)`);
}

function readEnvironment(): E2eEnvironment {
	const raw = readEnv('E2E_ENV') || 'local';
	if (raw === 'local' || raw === 'live-dev' || raw === 'prod') {
		return raw;
	}
	throw new Error(`Unsupported E2E_ENV "${raw}". Use local, live-dev, or prod.`);
}

function readAdminEmail(): string {
	if (e2eConfig.environment === 'local') {
		return readEnv('E2E_ADMIN_EMAIL') || 'admin';
	}

	if (e2eConfig.environment === 'live-dev') {
		return readEnv('E2E_ADMIN_EMAIL') || readEnv('LIVE_DEV_CODEX_ADMIN_EMAIL') || '';
	}

	return readEnv('E2E_ADMIN_EMAIL') || readEnv('PROD_CODEX_SUPERUSER_EMAIL') || '';
}

function readAdminPassword(): string {
	if (e2eConfig.environment === 'local') {
		return readEnv('E2E_ADMIN_PASSWORD') || 'password';
	}

	if (e2eConfig.environment === 'live-dev') {
		return readEnv('E2E_ADMIN_PASSWORD') || readEnv('LIVE_DEV_CODEX_ADMIN_PASSWORD') || '';
	}

	return readEnv('E2E_ADMIN_PASSWORD') || readEnv('PROD_CODEX_SUPERUSER_PASSWORD') || '';
}

function readDefaultBookingEmail(): string {
	if (e2eConfig.environment === 'local') {
		return 'e2e@grandfeast.test';
	}

	return requireAdminCredentials().email;
}

function addEmailTag(email: string, tag: string): string {
	const atIndex = email.indexOf('@');
	if (atIndex === -1) {
		throw new Error(`E2E booking email "${email}" must be a valid email address.`);
	}

	return `${email.slice(0, atIndex)}+${tag}${email.slice(atIndex)}`;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readEnv(key: string): string | undefined {
	return process.env[key] ?? fileEnv[key];
}

function loadDotEnvFile(filePath: string): Record<string, string> {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const result: Record<string, string> = {};

	for (const line of content.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) {
			continue;
		}

		const separatorIndex = trimmed.indexOf('=');
		if (separatorIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, separatorIndex).trim();
		let value = trimmed.slice(separatorIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		result[key] = value;
	}

	return result;
}

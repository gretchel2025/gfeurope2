/**
 * Purpose:
 * This file reads and normalizes server-side environment configuration.
 *
 * Why this structure is good:
 * Centralized config keeps env parsing out of feature code and gives the rest
 * of the app one typed source of truth for runtime settings.
 */
import { dev } from '$app/environment';
import fs from 'node:fs';
import path from 'node:path';

const fileEnv = loadDotEnvFile(path.resolve(process.cwd(), '.env'));
const cloudinaryUrlConfig = parseCloudinaryUrl(readEnv('CLOUDINARY_URL'));

/** Typed runtime configuration used by infrastructure and service composition. */
export type AppConfig = {
	dev: boolean;
	appBaseUrl: string;
	netlifyContext: string;
	netlifyBranch: string;
	supabaseUrl: string;
	supabasePublishableKey: string;
	supabaseServiceRoleKey: string;
	appEventId: string;
	enableLiveDevPasswordAuth: boolean;
	bootstrap: {
		standardTicketsInitialAvailable: number;
		grandFeastPlusTicketsInitialAvailable: number;
	};
	integrations: {
		resendApiKey: string;
		emailFrom: string;
		emailReplyTo: string;
		cloudinaryCloudName: string;
		cloudinaryApiKey: string;
		cloudinaryApiSecret: string;
	};
};

/** The single normalized configuration object for the server side of the app. */
export const appConfig: AppConfig = {
	dev,
	appBaseUrl: readEnv('APP_BASE_URL') || 'http://localhost:5173',
	netlifyContext: readEnv('CONTEXT') || '',
	netlifyBranch: readEnv('BRANCH') || '',
	supabaseUrl: readEnv('PUBLIC_SUPABASE_URL') || '',
	supabasePublishableKey: readEnv('PUBLIC_SUPABASE_PUBLISHABLE_KEY') || '',
	supabaseServiceRoleKey: readEnv('SUPABASE_SERVICE_ROLE_KEY') || '',
	appEventId: readEnv('APP_EVENT_ID') || 'gfeu2026',
	enableLiveDevPasswordAuth: parseBoolean(readEnv('ENABLE_LIVE_DEV_PASSWORD_AUTH')),
	bootstrap: {
		standardTicketsInitialAvailable: parsePositiveInt(
			readEnv('STANDARD_TICKETS_INITIAL_AVAILABLE'),
			100
		),
		grandFeastPlusTicketsInitialAvailable: parsePositiveInt(
			readEnv('GRAND_FEAST_PLUS_TICKETS_INITIAL_AVAILABLE'),
			50
		)
	},
	integrations: {
		resendApiKey: readEnv('RESEND_API_KEY') || '',
		emailFrom: readEnv('EMAIL_FROM') || '',
		emailReplyTo: readEnv('EMAIL_REPLY_TO') || '',
		cloudinaryCloudName: readEnv('CLOUDINARY_CLOUD_NAME') || cloudinaryUrlConfig.cloudName || '',
		cloudinaryApiKey: readEnv('CLOUDINARY_API_KEY') || cloudinaryUrlConfig.apiKey || '',
		cloudinaryApiSecret: readEnv('CLOUDINARY_API_SECRET') || cloudinaryUrlConfig.apiSecret || ''
	}
};

/** Fails startup when Cloudinary uploads cannot work. */
export function assertCloudinaryConfigured(): void {
	const missing = getMissingCloudinaryEnvVars();
	if (missing.length > 0) {
		throw new Error(`Cloudinary configuration is missing: ${missing.join(', ')}`);
	}
}

function getMissingCloudinaryEnvVars(): string[] {
	const missing: string[] = [];
	if (!appConfig.integrations.cloudinaryCloudName) missing.push('CLOUDINARY_CLOUD_NAME');
	if (!appConfig.integrations.cloudinaryApiKey) missing.push('CLOUDINARY_API_KEY');
	if (!appConfig.integrations.cloudinaryApiSecret) missing.push('CLOUDINARY_API_SECRET');
	return missing;
}

/** Parses a non-negative integer with a sensible fallback. */
function parsePositiveInt(raw: string | undefined, fallback: number): number {
	if (!raw) {
		return fallback;
	}

	const parsed = Number.parseInt(raw, 10);
	if (!Number.isFinite(parsed) || parsed < 0) {
		return fallback;
	}

	return parsed;
}

function parseBoolean(raw: string | undefined): boolean {
	if (!raw) {
		return false;
	}

	return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

/** Reads an env value from process.env first, then from the local .env file snapshot. */
function readEnv(key: string): string | undefined {
	return process.env[key] ?? fileEnv[key];
}

function parseCloudinaryUrl(raw: string | undefined) {
	if (!raw) {
		return {};
	}

	try {
		const parsed = new URL(raw);
		if (parsed.protocol !== 'cloudinary:') {
			return {};
		}

		return {
			cloudName: parsed.hostname,
			apiKey: decodeURIComponent(parsed.username),
			apiSecret: decodeURIComponent(parsed.password)
		};
	} catch {
		return {};
	}
}

/** Minimal .env parser used to support local development without extra runtime tooling. */
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

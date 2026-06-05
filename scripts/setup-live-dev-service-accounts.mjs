#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const liveDevProjectUrl = 'https://guoqhigzyfisvtnlrbjw.supabase.co';
const supportedRoles = new Set(['tester', 'superuser']);
const supportedEventRoles = new Set(['admin']);
const fileEnv = loadDotEnvFile(path.resolve(process.cwd(), '.env'));

const supabaseUrl = readLiveDevEnv('LIVE_DEV_SUPABASE_URL');
const serviceRoleKey = readLiveDevEnv('LIVE_DEV_SUPABASE_SERVICE_ROLE_KEY');
const accounts = [
	{
		label: 'tester',
		email: readLiveDevEnv('LIVE_DEV_CODEX_TESTER_EMAIL') || 'codex-tester@grandfeast.eu',
		password: readLiveDevEnv('LIVE_DEV_CODEX_TESTER_PASSWORD'),
		roles: ['tester'],
		eventRoles: {}
	},
	{
		label: 'admin',
		email: readLiveDevEnv('LIVE_DEV_CODEX_ADMIN_EMAIL') || 'codex-admin@grandfeast.eu',
		password: readLiveDevEnv('LIVE_DEV_CODEX_ADMIN_PASSWORD'),
		roles: ['tester'],
		eventRoles: {
			gfeu2026: ['admin']
		}
	}
];

if (normalizeOrigin(supabaseUrl) !== liveDevProjectUrl) {
	console.error(
		`Refusing to manage live-dev auth users because LIVE_DEV_SUPABASE_URL is not ${liveDevProjectUrl}.`
	);
	process.exit(1);
}

if (!serviceRoleKey) {
	console.error('LIVE_DEV_SUPABASE_SERVICE_ROLE_KEY is required.');
	process.exit(1);
}

for (const account of accounts) {
	validateAccount(account);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

for (const account of accounts) {
	await upsertAccount(account);
}

async function upsertAccount(account) {
	const existingUser = await findUserByEmail(account.email);
	const appMetadata = { roles: account.roles, event_roles: account.eventRoles };

	if (existingUser) {
		const { error } = await runAuthAdminRequest(
			() =>
				supabase.auth.admin.updateUserById(existingUser.id, {
					password: account.password,
					email_confirm: true,
					app_metadata: {
						...(existingUser.app_metadata ?? {}),
						...appMetadata
					}
				}),
			`update ${account.label} service account`
		);

		if (error) {
			console.error(`Failed to update ${account.label} service account: ${error.message}`);
			process.exit(1);
		}

		console.log(`Updated live-dev ${account.label} service account ${account.email}.`);
		return;
	}

	const { error } = await runAuthAdminRequest(
		() =>
			supabase.auth.admin.createUser({
				email: account.email,
				password: account.password,
				email_confirm: true,
				app_metadata: appMetadata
			}),
		`create ${account.label} service account`
	);

	if (error) {
		console.error(`Failed to create ${account.label} service account: ${error.message}`);
		process.exit(1);
	}

	console.log(`Created live-dev ${account.label} service account ${account.email}.`);
}

async function findUserByEmail(targetEmail) {
	const normalizedTarget = targetEmail.toLowerCase();
	const perPage = 1000;
	for (let page = 1; page <= 20; page += 1) {
		const { data, error } = await runAuthAdminRequest(
			() => supabase.auth.admin.listUsers({ page, perPage }),
			'list live-dev auth users'
		);

		if (error) {
			console.error(`Failed to list live-dev auth users: ${error.message}`);
			process.exit(1);
		}

		const user = data.users.find(
			(candidate) => candidate.email?.toLowerCase() === normalizedTarget
		);
		if (user) {
			return user;
		}

		if (data.users.length < perPage) {
			return null;
		}
	}

	console.error('Stopped after scanning 20,000 live-dev auth users.');
	process.exit(1);
}

async function runAuthAdminRequest(request, action) {
	try {
		return await request();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Failed to ${action}: ${message}`);
		process.exit(1);
	}
}

function validateAccount(account) {
	if (!account.email || !account.email.includes('@')) {
		console.error(`LIVE_DEV_CODEX_${account.label.toUpperCase()}_EMAIL must be a valid email.`);
		process.exit(1);
	}

	if (!account.password || account.password.length < 12) {
		console.error(
			`LIVE_DEV_CODEX_${account.label.toUpperCase()}_PASSWORD must be at least 12 characters.`
		);
		process.exit(1);
	}

	const unsupportedRoles = account.roles.filter((role) => !supportedRoles.has(role));
	if (unsupportedRoles.length > 0) {
		console.error(`Unsupported role(s): ${unsupportedRoles.join(', ')}`);
		process.exit(1);
	}

	for (const [eventId, roles] of Object.entries(account.eventRoles)) {
		if (!eventId.trim()) {
			console.error('Event role event ids must be non-empty.');
			process.exit(1);
		}
		const unsupportedEventRoles = roles.filter((role) => !supportedEventRoles.has(role));
		if (unsupportedEventRoles.length > 0) {
			console.error(`Unsupported event role(s): ${unsupportedEventRoles.join(', ')}`);
			process.exit(1);
		}
	}
}

function readLiveDevEnv(key) {
	return process.env[key] ?? fileEnv[key] ?? '';
}

function normalizeOrigin(value) {
	try {
		return new URL(value).origin;
	} catch {
		return '';
	}
}

function loadDotEnvFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const result = {};

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

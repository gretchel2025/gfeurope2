#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

const supportedRoles = new Set(['tester', 'admin', 'superuser']);
const fileEnv = loadDotEnvFile(path.resolve(process.cwd(), '.env'));

const email = normalizeLocalLogin(
	process.argv[2] || process.env.LOCAL_DEV_AUTH_EMAIL || fileEnv.LOCAL_DEV_AUTH_EMAIL || 'admin'
);
const password =
	process.argv[3] ||
	process.env.LOCAL_DEV_AUTH_PASSWORD ||
	fileEnv.LOCAL_DEV_AUTH_PASSWORD ||
	'password';
const requestedRoles =
	process.argv[4] ||
	process.env.LOCAL_DEV_AUTH_ROLES ||
	fileEnv.LOCAL_DEV_AUTH_ROLES ||
	'tester,admin,superuser';
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || fileEnv.PUBLIC_SUPABASE_URL || '';
const serviceRoleKey =
	process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY || '';

if (!email || !password) {
	console.error(
		'Usage: make setup-local-auth [EMAIL=admin PASSWORD=password ROLES=tester,admin,superuser]'
	);
	console.error('You can also set LOCAL_DEV_AUTH_EMAIL and LOCAL_DEV_AUTH_PASSWORD in .env.');
	process.exit(1);
}

if (password.length < 6) {
	console.error('Local auth password must be at least 6 characters.');
	process.exit(1);
}

if (!isLocalSupabaseUrl(supabaseUrl)) {
	console.error(
		`Refusing to manage auth user because PUBLIC_SUPABASE_URL is not local: ${supabaseUrl || '<empty>'}`
	);
	process.exit(1);
}

if (!serviceRoleKey) {
	console.error('SUPABASE_SERVICE_ROLE_KEY is required for local auth setup.');
	process.exit(1);
}

const roles = requestedRoles
	.split(',')
	.map((role) => role.trim())
	.filter(Boolean);

const unsupportedRoles = roles.filter((role) => !supportedRoles.has(role));
if (unsupportedRoles.length > 0) {
	console.error(`Unsupported role(s): ${unsupportedRoles.join(', ')}`);
	console.error(`Supported roles: ${Array.from(supportedRoles).join(', ')}`);
	process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

const existingUser = await findUserByEmail(email);
const appMetadata = { roles };

if (existingUser) {
	const { error } = await runAuthAdminRequest(
		() =>
			supabase.auth.admin.updateUserById(existingUser.id, {
				password,
				app_metadata: {
					...(existingUser.app_metadata ?? {}),
					...appMetadata
				}
			}),
		'update local auth user'
	);

	if (error) {
		console.error(`Failed to update local auth user: ${error.message}`);
		process.exit(1);
	}

	console.log(`Updated local auth user ${email} with roles: ${roles.join(', ')}`);
} else {
	const { error } = await runAuthAdminRequest(
		() =>
			supabase.auth.admin.createUser({
				email,
				password,
				email_confirm: true,
				app_metadata: appMetadata
			}),
		'create local auth user'
	);

	if (error) {
		console.error(`Failed to create local auth user: ${error.message}`);
		process.exit(1);
	}

	console.log(`Created local auth user ${email} with roles: ${roles.join(', ')}`);
}

async function findUserByEmail(targetEmail) {
	const perPage = 1000;
	for (let page = 1; page <= 20; page += 1) {
		const { data, error } = await runAuthAdminRequest(
			() => supabase.auth.admin.listUsers({ page, perPage }),
			'list local auth users'
		);

		if (error) {
			console.error(`Failed to list local auth users: ${error.message}`);
			process.exit(1);
		}

		const user = data.users.find((candidate) => candidate.email?.toLowerCase() === targetEmail);
		if (user) {
			return user;
		}

		if (data.users.length < perPage) {
			return null;
		}
	}

	console.error('Stopped after scanning 20,000 local auth users.');
	process.exit(1);
}

async function runAuthAdminRequest(request, action) {
	try {
		return await request();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Failed to ${action}: ${message}`);
		console.error('Confirm local Supabase is running and PUBLIC_SUPABASE_URL points to it.');
		process.exit(1);
	}
}

function isLocalSupabaseUrl(value) {
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

function normalizeLocalLogin(value) {
	const trimmed = value.trim().toLowerCase();
	return trimmed === 'admin' ? 'admin@example.test' : trimmed;
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

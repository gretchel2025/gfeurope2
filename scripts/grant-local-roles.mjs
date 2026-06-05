#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const supportedRoles = new Set(['tester', 'admin', 'superuser']);
const supportedEventRoles = new Set(['admin']);
const email = process.argv[2]?.trim();
const requestedRoles = process.argv[3]?.trim() || 'tester,admin,superuser';
const requestedEventRoles = process.argv[4]?.trim() || 'gfeu2026:admin';

if (!email) {
	console.error('Usage: node scripts/grant-local-roles.mjs <email> [comma-separated-roles]');
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

if (roles.length === 0) {
	console.error('At least one role is required.');
	process.exit(1);
}

const emailSql = email.replaceAll("'", "''");
const metadataJson = JSON.stringify({ roles }).replaceAll("'", "''");
const eventRoles = parseEventRoles(requestedEventRoles);
const eventRolesJson = JSON.stringify({ event_roles: eventRoles }).replaceAll("'", "''");

runSupabaseQuery(
	`
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '${metadataJson}'::jsonb || '${eventRolesJson}'::jsonb
where email = '${emailSql}';
`,
	{ failIfNoRowsUpdated: true }
);

runSupabaseQuery(`
select email, raw_app_meta_data->'roles' as roles
	, raw_app_meta_data->'event_roles' as event_roles
from auth.users
where email = '${emailSql}';
`);

function runSupabaseQuery(sql, options = {}) {
	const result = spawnSync('npx', ['supabase', 'db', 'query', sql], {
		encoding: 'utf8'
	});

	if (result.stdout) {
		process.stdout.write(result.stdout);
	}

	if (result.stderr) {
		process.stderr.write(result.stderr);
	}

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	if (options.failIfNoRowsUpdated && result.stdout.includes('UPDATE 0')) {
		console.error(`No local Supabase Auth user found for ${email}. Sign in once, then rerun this.`);
		process.exit(1);
	}
}

function parseEventRoles(value) {
	const trimmed = value.trim();
	if (!trimmed) {
		return {};
	}

	if (trimmed.startsWith('{')) {
		try {
			return validateEventRoles(JSON.parse(trimmed));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`Invalid event roles JSON: ${message}`);
			process.exit(1);
		}
	}

	const result = {};
	for (const entry of trimmed.split(';')) {
		const [eventId, rolesText] = entry.split(':');
		const eventRoles = (rolesText ?? '')
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean);
		if (eventId?.trim()) {
			result[eventId.trim()] = eventRoles;
		}
	}

	return validateEventRoles(result);
}

function validateEventRoles(value) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		console.error('Event roles must be an object or event_id:role list.');
		process.exit(1);
	}

	for (const [eventId, roles] of Object.entries(value)) {
		if (!eventId.trim() || !Array.isArray(roles)) {
			console.error('Event roles must map event ids to role arrays.');
			process.exit(1);
		}
		const unsupported = roles.filter((role) => !supportedEventRoles.has(role));
		if (unsupported.length > 0) {
			console.error(`Unsupported event role(s): ${unsupported.join(', ')}`);
			console.error(`Supported event roles: ${Array.from(supportedEventRoles).join(', ')}`);
			process.exit(1);
		}
	}

	return value;
}

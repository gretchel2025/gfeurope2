#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const supportedRoles = new Set(['tester', 'admin', 'superuser']);
const email = process.argv[2]?.trim();
const requestedRoles = process.argv[3]?.trim() || 'tester,admin,superuser';

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

runSupabaseQuery(
	`
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '${metadataJson}'::jsonb
where email = '${emailSql}';
`,
	{ failIfNoRowsUpdated: true }
);

runSupabaseQuery(`
select email, raw_app_meta_data->'roles' as roles
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

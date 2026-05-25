import { describe, expect, it } from 'vitest';
import type { AppSession } from './session';
import { getSessionRoles } from './session';
import { getSessionUser } from './sessionUser';

function sessionWith(input: {
	email?: string | null;
	name?: unknown;
	roles?: unknown;
}): AppSession {
	return {
		user: {
			id: 'supabase-user-id',
			email: input.email,
			app_metadata: {
				roles: input.roles
			},
			user_metadata: {
				name: input.name
			},
			aud: 'authenticated',
			created_at: new Date(0).toISOString()
		}
	} as unknown as AppSession;
}

describe('Supabase session mapping', () => {
	it('treats a missing session as signed out', () => {
		expect(getSessionUser(null)).toEqual({
			userName: '',
			_id: '',
			isASuperUser: false,
			wasFound: false
		});
		expect(getSessionRoles(null)).toEqual([]);
	});

	it('requires an email before returning a session user', () => {
		expect(getSessionUser(sessionWith({ email: null }))).toEqual({
			userName: '',
			_id: '',
			isASuperUser: false,
			wasFound: false
		});
	});

	it('reads supported roles from Supabase app metadata', () => {
		const session = sessionWith({
			email: 'Admin@Example.com',
			name: 'Admin User',
			roles: ['tester', 'admin', 'unsupported', 123, 'superuser']
		});

		expect(getSessionUser(session)).toEqual({
			userName: 'Admin User',
			_id: 'admin@example.com',
			isASuperUser: false,
			wasFound: true
		});
		expect(getSessionRoles(session)).toEqual(['tester', 'admin', 'superuser']);
	});

	it('ignores invalid role metadata', () => {
		expect(getSessionRoles(sessionWith({ email: 'admin@example.com', roles: 'admin' }))).toEqual(
			[]
		);
		expect(getSessionRoles(sessionWith({ email: 'admin@example.com', roles: null }))).toEqual([]);
	});
});

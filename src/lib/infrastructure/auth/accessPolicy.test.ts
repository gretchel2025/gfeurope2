import { describe, expect, it } from 'vitest';
import {
	evaluateAccess,
	getPathEventId,
	getPasswordAuthMode,
	getRequiredAccess,
	getRuntimeAccessMode,
	isAuthBypassPath
} from './accessPolicy';
import type { EventRoleMap, UserRole } from '$lib/domain/user';

function accessFor(input: {
	dev?: boolean;
	hostname?: string;
	netlifyBranch?: string;
	pathname: string;
	signedIn?: boolean;
	roles?: UserRole[];
	eventRoles?: EventRoleMap;
}) {
	const mode = getRuntimeAccessMode({
		dev: input.dev ?? false,
		hostname: input.hostname ?? 'www.grandfeast.eu',
		netlifyBranch: input.netlifyBranch
	});

	return evaluateAccess({
		requiredAccess: getRequiredAccess({
			mode,
			pathname: input.pathname
		}),
		signedIn: input.signedIn ?? false,
		roles: input.roles ?? [],
		eventRoles: input.eventRoles ?? {}
	});
}

describe('access policy', () => {
	it('keeps production and local public pages open', () => {
		expect(accessFor({ hostname: 'www.grandfeast.eu', pathname: '/' })).toEqual({
			allowed: true
		});
		expect(
			accessFor({ dev: true, hostname: 'localhost', pathname: '/events/gfeu2026/newbooking' })
		).toEqual({
			allowed: true
		});
	});

	it('requires event admin roles for production and local admin routes', () => {
		expect(accessFor({ pathname: '/admin/events/gfeu2026', signedIn: false })).toEqual({
			allowed: false,
			reason: 'sign-in-required'
		});
		expect(
			accessFor({
				pathname: '/admin/events/gfeu2026',
				signedIn: true,
				roles: ['tester'],
				eventRoles: { gfeu2025: ['admin'] }
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				pathname: '/admin/events/gfeu2026',
				signedIn: true,
				roles: ['tester'],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				dev: true,
				hostname: 'localhost',
				pathname: '/admin/events/gfeu2025',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
	});

	it('allows the admin directory for any admin-level account', () => {
		expect(accessFor({ pathname: '/admin', signedIn: false })).toEqual({
			allowed: false,
			reason: 'sign-in-required'
		});
		expect(
			accessFor({
				pathname: '/admin',
				signedIn: true,
				roles: []
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				pathname: '/admin',
				signedIn: true,
				roles: ['admin']
			})
		).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				pathname: '/admin',
				signedIn: true,
				roles: [],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				pathname: '/admin',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
	});

	it('keeps event and global admin routes scoped to their specific permissions', () => {
		expect(
			accessFor({
				pathname: '/admin/events/gfeu2026',
				signedIn: true,
				roles: ['admin'],
				eventRoles: {}
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				pathname: '/admin/global/events',
				signedIn: true,
				roles: ['admin'],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				pathname: '/admin/global/users',
				signedIn: true,
				roles: ['admin'],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				pathname: '/admin/global/events',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				pathname: '/admin/global/users',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
	});

	it('requires tester roles for live dev public pages', () => {
		expect(accessFor({ hostname: 'dev.grandfeast.eu', pathname: '/events/gfeu2026' })).toEqual({
			allowed: false,
			reason: 'sign-in-required'
		});
		expect(
			accessFor({
				hostname: 'dev.grandfeast.eu',
				pathname: '/events/gfeu2026',
				signedIn: true,
				roles: []
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				hostname: 'dev.grandfeast.eu',
				pathname: '/events/gfeu2026',
				signedIn: true,
				roles: ['tester']
			})
		).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				hostname: 'dev.grandfeast.eu',
				pathname: '/events/gfeu2026',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
	});

	it('requires tester plus event admin roles for live dev admin routes', () => {
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/admin/events/gfeu2026/bookings',
				signedIn: true,
				roles: ['tester'],
				eventRoles: {}
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/admin/events/gfeu2026/bookings',
				signedIn: true,
				roles: [],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/admin/events/gfeu2026/bookings',
				signedIn: true,
				roles: ['tester'],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/admin/events/gfeu2025/bookings',
				signedIn: true,
				roles: ['tester'],
				eventRoles: { gfeu2026: ['admin'] }
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/admin/events/gfeu2025/bookings',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
	});

	it('treats Netlify dev branch as live dev regardless of host', () => {
		expect(
			accessFor({
				hostname: 'preview.example.netlify.app',
				netlifyBranch: 'dev',
				pathname: '/events/gfeu2026',
				signedIn: true,
				roles: ['tester']
			})
		).toEqual({
			allowed: true
		});
	});

	it('bypasses auth endpoints and assets required for sign-in', () => {
		expect(isAuthBypassPath('/signin')).toBe(true);
		expect(isAuthBypassPath('/unauthorized')).toBe(true);
		expect(isAuthBypassPath('/auth/callback')).toBe(true);
		expect(isAuthBypassPath('/_app/immutable/entry/app.js')).toBe(true);
		expect(isAuthBypassPath('/favicon.png')).toBe(true);
		expect(isAuthBypassPath('/admin/events/gfeu2026/bookings')).toBe(false);
	});

	it('extracts event ids from public and admin routes', () => {
		expect(getPathEventId('/events/gfeu2026/newbooking')).toBe('gfeu2026');
		expect(getPathEventId('/admin/events/gfeu2025/bookings')).toBe('gfeu2025');
		expect(getPathEventId('/signin')).toBeNull();
	});

	it('enables password auth for local Supabase or flagged hosted deployments', () => {
		expect(
			getPasswordAuthMode({
				mode: 'local',
				supabaseUrl: 'http://127.0.0.1:54321',
				enableEmailPasswordAuth: false
			})
		).toBe('local');

		expect(
			getPasswordAuthMode({
				mode: 'live-dev',
				supabaseUrl: 'https://guoqhigzyfisvtnlrbjw.supabase.co',
				enableEmailPasswordAuth: true
			})
		).toBe('deployment');

		expect(
			getPasswordAuthMode({
				mode: 'production',
				supabaseUrl: 'https://erhrykkyhsygnonyfbis.supabase.co',
				enableEmailPasswordAuth: true
			})
		).toBe('deployment');
	});

	it('keeps password auth disabled outside the approved modes', () => {
		expect(
			getPasswordAuthMode({
				mode: 'live-dev',
				supabaseUrl: 'https://guoqhigzyfisvtnlrbjw.supabase.co',
				enableEmailPasswordAuth: false
			})
		).toBe('none');

		expect(
			getPasswordAuthMode({
				mode: 'production',
				supabaseUrl: 'https://erhrykkyhsygnonyfbis.supabase.co',
				enableEmailPasswordAuth: false
			})
		).toBe('none');

		expect(
			getPasswordAuthMode({
				mode: 'local',
				supabaseUrl: 'https://guoqhigzyfisvtnlrbjw.supabase.co',
				enableEmailPasswordAuth: true
			})
		).toBe('none');
	});
});

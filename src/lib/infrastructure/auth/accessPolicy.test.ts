import { describe, expect, it } from 'vitest';
import {
	evaluateAccess,
	getPasswordAuthMode,
	getRequiredAccess,
	getRuntimeAccessMode,
	isAuthBypassPath
} from './accessPolicy';
import type { UserRole } from '$lib/domain/user';

function accessFor(input: {
	dev?: boolean;
	hostname?: string;
	netlifyBranch?: string;
	pathname: string;
	signedIn?: boolean;
	roles?: UserRole[];
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
		roles: input.roles ?? []
	});
}

describe('access policy', () => {
	it('keeps production and local public pages open', () => {
		expect(accessFor({ hostname: 'www.grandfeast.eu', pathname: '/' })).toEqual({
			allowed: true
		});
		expect(accessFor({ dev: true, hostname: 'localhost', pathname: '/newbooking' })).toEqual({
			allowed: true
		});
	});

	it('requires admin roles for production and local admin routes', () => {
		expect(accessFor({ pathname: '/api', signedIn: false })).toEqual({
			allowed: false,
			reason: 'sign-in-required'
		});
		expect(accessFor({ pathname: '/api', signedIn: true, roles: ['tester'] })).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(accessFor({ pathname: '/api', signedIn: true, roles: ['admin'] })).toEqual({
			allowed: true
		});
		expect(
			accessFor({
				dev: true,
				hostname: 'localhost',
				pathname: '/api',
				signedIn: true,
				roles: ['superuser']
			})
		).toEqual({
			allowed: true
		});
	});

	it('requires tester roles for live dev public pages', () => {
		expect(accessFor({ hostname: 'dev.grandfeast.eu', pathname: '/' })).toEqual({
			allowed: false,
			reason: 'sign-in-required'
		});
		expect(
			accessFor({ hostname: 'dev.grandfeast.eu', pathname: '/', signedIn: true, roles: ['admin'] })
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({ hostname: 'dev.grandfeast.eu', pathname: '/', signedIn: true, roles: ['tester'] })
		).toEqual({
			allowed: true
		});
	});

	it('requires tester plus admin roles for live dev admin routes', () => {
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/api',
				signedIn: true,
				roles: ['tester']
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/api',
				signedIn: true,
				roles: ['admin']
			})
		).toEqual({
			allowed: false,
			reason: 'permission-denied'
		});
		expect(
			accessFor({
				hostname: 'dev--grand-feast-uk-x-europe.netlify.app',
				pathname: '/api',
				signedIn: true,
				roles: ['tester', 'admin']
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
				pathname: '/',
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
		expect(isAuthBypassPath('/api/v0/booking/list')).toBe(false);
	});

	it('enables password auth only for local Supabase or flagged live dev', () => {
		expect(
			getPasswordAuthMode({
				mode: 'local',
				supabaseUrl: 'http://127.0.0.1:54321',
				enableLiveDevPasswordAuth: false
			})
		).toBe('local');

		expect(
			getPasswordAuthMode({
				mode: 'live-dev',
				supabaseUrl: 'https://guoqhigzyfisvtnlrbjw.supabase.co',
				enableLiveDevPasswordAuth: true
			})
		).toBe('live-dev');
	});

	it('keeps password auth disabled outside the approved modes', () => {
		expect(
			getPasswordAuthMode({
				mode: 'live-dev',
				supabaseUrl: 'https://guoqhigzyfisvtnlrbjw.supabase.co',
				enableLiveDevPasswordAuth: false
			})
		).toBe('none');

		expect(
			getPasswordAuthMode({
				mode: 'production',
				supabaseUrl: 'https://erhrykkyhsygnonyfbis.supabase.co',
				enableLiveDevPasswordAuth: true
			})
		).toBe('none');

		expect(
			getPasswordAuthMode({
				mode: 'local',
				supabaseUrl: 'https://guoqhigzyfisvtnlrbjw.supabase.co',
				enableLiveDevPasswordAuth: true
			})
		).toBe('none');
	});
});

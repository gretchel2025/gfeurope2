import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sanitizeRedirectTo } from '$lib/infrastructure/auth/accessPolicy';

export const GET: RequestHandler = async (event) => {
	const code = event.url.searchParams.get('code');
	const next = sanitizeRedirectTo(event.url.searchParams.get('next')) ?? '/';

	if (code && event.locals.supabase) {
		const { error } = await event.locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/signin?error=auth');
};

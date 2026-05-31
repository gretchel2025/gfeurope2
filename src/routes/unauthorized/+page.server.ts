import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getAuthSession, toPublicSession } from '$lib/infrastructure/auth/session';

export const load: PageServerLoad = async (event) => {
	const session = await getAuthSession(event);

	if (!session) {
		throw redirect(303, '/signin');
	}

	return {
		session: toPublicSession(session)
	};
};

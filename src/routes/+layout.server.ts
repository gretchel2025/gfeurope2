import type { LayoutServerLoad } from './$types';
import { getAuthSession, toPublicSession } from '$lib/infrastructure/auth/session';
import { appConfig } from '$lib/infrastructure/config/env.server';

export const load: LayoutServerLoad = async (event) => {
	const session = await getAuthSession(event);

	return {
		session: toPublicSession(session),
		supabaseAuth: {
			url: appConfig.supabaseUrl,
			publishableKey: appConfig.supabasePublishableKey
		}
	};
};

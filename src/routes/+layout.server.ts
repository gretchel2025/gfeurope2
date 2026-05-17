import type { LayoutServerLoad } from './$types';
import { getAuthSession } from '$lib/infrastructure/auth/session';

export const load: LayoutServerLoad = async (event) => {
	const session = await getAuthSession(event);

	return {
		session
	};
};

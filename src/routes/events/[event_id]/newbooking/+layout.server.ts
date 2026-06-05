import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { isPublicBookingOpen } from '$lib/publicEvents';

export const load: LayoutServerLoad = async ({ params }) => {
	const eventId = params.event_id;
	if (!isPublicBookingOpen(eventId)) {
		throw redirect(303, publicRoutes(eventId).home);
	}
};

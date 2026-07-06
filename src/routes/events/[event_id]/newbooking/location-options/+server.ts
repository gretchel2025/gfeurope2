import { json } from '@sveltejs/kit';
import { isPublicBookingOpen } from '$lib/publicEvents';
import { getCityOptionsForCountry } from '$lib/server/http/locationOptions';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	if (!isPublicBookingOpen(params.event_id)) {
		return json({ cities: [] }, { status: 404 });
	}

	return json({
		cities: getCityOptionsForCountry(
			url.searchParams.get('country') ?? '',
			url.searchParams.get('search') ?? ''
		)
	});
};

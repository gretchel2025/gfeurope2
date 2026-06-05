import type { Booking } from '$lib/domain/booking';
import type { Actions } from './$types';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction } from '$lib/server/http/handlers';

export type ServerData = {
	bookings: Booking[];
	noneFound: boolean;
	query: string;
};

export const load = async (event): Promise<ServerData> => {
	const {
		services: { bookingService }
	} = await getEventServiceContext(event);
	const rawQuery =
		event.url.searchParams.get('query') ?? event.url.searchParams.get('reference_no') ?? '';
	const query = rawQuery.trim();
	if (!query) {
		return {
			bookings: [],
			noneFound: false,
			query: ''
		};
	}

	const bookings = await bookingService.search(query);

	return {
		bookings,
		noneFound: bookings.length === 0,
		query
	};
};

// actions handle Form Actions
export const actions: Actions = {
	markPaid: adminAction(async (event) => {
		const {
			services: { bookingService }
		} = await getEventServiceContext(event);
		const formData = await event.request.formData();

		const referenceNo = formData.get('reference_no');
		if (typeof referenceNo === 'string' && referenceNo.trim()) {
			await bookingService.markPaid(referenceNo.trim());
		}
	})
};

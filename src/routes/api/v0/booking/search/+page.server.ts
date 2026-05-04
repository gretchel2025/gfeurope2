import type { Booking } from '$lib/domain/booking';
import type { Actions } from './$types';
import { rethrowAsKitError } from '$lib/server/http/appError';
import { requireAdminRequest } from '$lib/server/http/guards';
import { bookingService } from '$lib/server/http/services';

export type ServerData = {
	bookings: Booking[];
	noneFound: boolean;
};

export const load = async (event): Promise<ServerData> => {
	const referenceNo = event.url.searchParams.get('reference_no');
	if (!referenceNo) {
		return {
			bookings: [],
			noneFound: false
		};
	}

	const aBooking = await bookingService.getById(referenceNo);
	if (!aBooking) {
		return {
			bookings: [],
			noneFound: true
		};
	}

	// return result
	const result: Booking[] = [aBooking];

	return {
		bookings: result,
		noneFound: false
	};
};

// actions handle Form Actions
export const actions: Actions = {
	markPaid: async (event) => {
		try {
			await requireAdminRequest(event);
			const formData = await event.request.formData();

			const referenceNo = formData.get('reference_no');
			if (typeof referenceNo === 'string' && referenceNo.trim()) {
				await bookingService.markPaid(referenceNo.trim());
			}
		} catch (caught) {
			rethrowAsKitError(caught);
		}
	}
};

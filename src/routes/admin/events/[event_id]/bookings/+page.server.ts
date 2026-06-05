import type { Booking } from '$lib/domain/booking';
import { sortBookingsByDateDescending } from '$lib/domain/booking';
import { getEventServiceContext } from '$lib/server/http/eventContext';

export type ServerData = {
	bookings: Booking[];
};

export async function load(event): Promise<ServerData> {
	const {
		services: { bookingService }
	} = await getEventServiceContext(event);
	const bookings: Booking[] = await bookingService.list();
	return {
		bookings: bookings.sort(sortBookingsByDateDescending)
	};
}

import type { Booking } from '$lib/domain/booking';
import {
	getTopTicketSalesByCity,
	getUnpaidBookingsByCity,
	type CityTicketSalesReport,
	type UnpaidBookingsByCityReport
} from '$lib/application/services/reportingService';
import { getEventServiceContext } from '$lib/server/http/eventContext';

export type ServerData = {
	topTicketSalesByCity: CityTicketSalesReport[];
	unpaidBookingsByCity: UnpaidBookingsByCityReport[];
};

export async function load(event): Promise<ServerData> {
	const {
		services: { bookingService }
	} = await getEventServiceContext(event);
	const bookings = (await bookingService.list()) as Booking[];

	return {
		topTicketSalesByCity: getTopTicketSalesByCity(bookings),
		unpaidBookingsByCity: getUnpaidBookingsByCity(bookings)
	};
}

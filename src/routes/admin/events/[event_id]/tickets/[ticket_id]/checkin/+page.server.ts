import type { Ticket } from '$lib/domain/ticket';
import type { Booking } from '$lib/domain/booking';
import type { Actions, PageServerLoad } from './$types';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	aTicket: Ticket;
	aBooking: Booking;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		services: { bookingService, ticketService }
	} = await getEventServiceContext(event);
	const aTicket = await ticketService.getRequiredById(event.params.ticket_id);
	const aBooking = await bookingService.getRequiredById(aTicket.booking_reference_no);
	return {
		aTicket,
		aBooking
	};
});

export const actions: Actions = {
	checkIn: adminAction(async (event) => {
		const {
			services: { ticketService }
		} = await getEventServiceContext(event);
		const { params } = event;
		const ticketId = requireRouteParam(params, 'ticket_id');
		await ticketService.checkIn(ticketId);
	}),
	checkOut: adminAction(async (event) => {
		const {
			services: { ticketService }
		} = await getEventServiceContext(event);
		const { params } = event;
		const ticketId = requireRouteParam(params, 'ticket_id');
		await ticketService.checkOut(ticketId);
	})
};

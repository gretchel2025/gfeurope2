import type { Ticket } from '$lib/domain/ticket';
import type { Booking } from '$lib/domain/booking';
import type { Actions, PageServerLoad } from './$types';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';
import { bookingService, ticketService } from '$lib/server/http/services';

export type ServerData = {
	aTicket: Ticket;
	aBooking: Booking;
};

export const load: PageServerLoad = withKitErrors(
	async ({ params }: Parameters<PageServerLoad>[0]): Promise<ServerData> => {
		const aTicket = await ticketService.getRequiredById(params.ticket_id);
		const aBooking = await bookingService.getRequiredById(aTicket.booking_reference_no);
		return {
			aTicket,
			aBooking
		};
	}
);

export const actions: Actions = {
	checkIn: adminAction(async ({ params }) => {
		const ticketId = requireRouteParam(params, 'ticket_id');
		await ticketService.checkIn(ticketId);
	}),
	checkOut: adminAction(async ({ params }) => {
		const ticketId = requireRouteParam(params, 'ticket_id');
		await ticketService.checkOut(ticketId);
	})
};

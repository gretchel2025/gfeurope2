import type { PageServerLoad } from './$types';
import type { Booking, TicketWithQRCode } from '$lib/domain/booking';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	booking: Booking | null;
	ticketsData: TicketWithQRCode[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		services: { bookingService }
	} = await getEventServiceContext(event);
	const booking = await bookingService.getRequiredById(event.params.reference_no);
	const ticketsData = await bookingService.getRelatedTicketsWithCheckinQRCode(
		event.params.reference_no
	);
	return {
		booking,
		ticketsData
	};
});

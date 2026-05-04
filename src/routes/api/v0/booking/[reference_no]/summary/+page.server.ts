import type { PageServerLoad } from './$types';
import type { Booking, TicketWithQRCode } from '$lib/domain/booking';
import { withKitErrors } from '$lib/server/http/handlers';
import { bookingService } from '$lib/server/http/services';

export type ServerData = {
	booking: Booking | null;
	ticketsData: TicketWithQRCode[];
};

export const load: PageServerLoad = withKitErrors(
	async ({ params }: Parameters<PageServerLoad>[0]): Promise<ServerData> => {
		const booking = await bookingService.getRequiredById(params.reference_no);
		const ticketsData = await bookingService.getRelatedTicketsWithCheckinQRCode(
			params.reference_no
		);
		return {
			booking,
			ticketsData
		};
	}
);

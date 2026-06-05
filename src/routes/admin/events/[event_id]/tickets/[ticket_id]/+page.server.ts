import type { PageServerLoad } from './$types';
import type { Ticket, QRCode } from '$lib/domain/ticket';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	aTicket: Ticket;
	checkin: QRCode;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		services: { ticketService }
	} = await getEventServiceContext(event);
	const aTicket = await ticketService.getRequiredById(event.params.ticket_id);
	const qrCode = await ticketService.getCheckinQRCode(
		aTicket.ticket_id,
		aTicket.booking_reference_no
	);
	return {
		aTicket,
		checkin: qrCode
	};
});

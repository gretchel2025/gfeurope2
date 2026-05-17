import type { PageServerLoad } from './$types';
import type { Ticket, QRCode } from '$lib/domain/ticket';
import { withKitErrors } from '$lib/server/http/handlers';
import { ticketService } from '$lib/server/http/services';

export type ServerData = {
	aTicket: Ticket;
	checkin: QRCode;
};

export const load: PageServerLoad = withKitErrors(
	async ({ params }: Parameters<PageServerLoad>[0]): Promise<ServerData> => {
		const aTicket = await ticketService.getRequiredById(params.ticket_id);
		const qrCode = await ticketService.getCheckinQRCode(
			aTicket.ticket_id,
			aTicket.booking_reference_no
		);
		return {
			aTicket,
			checkin: qrCode
		};
	}
);

import type { PageServerLoad } from './$types';
import { AuditEntityType, type AuditEvent } from '$lib/domain/auditEvent';
import type { Ticket, QRCode } from '$lib/domain/ticket';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	aTicket: Ticket;
	checkin: QRCode;
	auditEvents: AuditEvent[];
	historyLoaded: boolean;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { auditEventService, ticketService }
	} = await getEventServiceContext(event);
	const ticketId = requireRouteParam(event.params, 'ticket_id');
	const historyLoaded = event.url.searchParams.get('load_history') === 'true';
	const aTicket = await ticketService.getRequiredById(ticketId);
	const qrCode = await ticketService.getCheckinQRCode(
		aTicket.ticket_id,
		aTicket.booking_reference_no
	);
	return {
		aTicket,
		checkin: qrCode,
		auditEvents: historyLoaded
			? await auditEventService.listByEntity(eventId, AuditEntityType.Ticket, ticketId)
			: [],
		historyLoaded
	};
});

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ValidationError } from '$lib/application/errors';
import { AuditEntityType, type AuditEvent } from '$lib/domain/auditEvent';
import type { Ticket, QRCode } from '$lib/domain/ticket';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	aTicket: Ticket;
	checkin: QRCode;
	auditEvents: AuditEvent[];
	historyLoaded: boolean;
	nameEditMode: boolean;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { auditEventService, ticketService }
	} = await getEventServiceContext(event);
	const ticketId = requireRouteParam(event.params, 'ticket_id');
	const historyLoaded = event.url.searchParams.get('load_history') === 'true';
	const nameEditMode = event.url.searchParams.get('edit_name') === 'true';
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
		historyLoaded,
		nameEditMode
	};
});

export const actions: Actions = {
	updateName: adminAction(async (event) => {
		const {
			eventId,
			services: { ticketService }
		} = await getEventServiceContext(event);
		const ticketId = requireRouteParam(event.params, 'ticket_id');
		const formData = await event.request.formData();
		const name = readTicketName(formData);

		await ticketService.updateName(ticketId, name, await adminRequestAuditActor(event));
		throw redirect(303, adminRoutes(eventId).ticket.details(ticketId));
	})
};

function readTicketName(formData: FormData): string {
	const value = formData.get('name');
	if (typeof value !== 'string' || value.trim() === '') {
		throw new ValidationError('ticket name is required');
	}
	return value;
}

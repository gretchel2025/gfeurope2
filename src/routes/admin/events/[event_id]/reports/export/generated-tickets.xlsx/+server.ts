import type { RequestHandler } from '@sveltejs/kit';
import { getGeneratedTicketReportRows } from '$lib/application/services/reportingService';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';
import { requireAdminRequest } from '$lib/server/http/guards';
import {
	createGeneratedTicketsWorkbookBuffer,
	datedXlsxFilename,
	xlsxAttachmentResponse
} from '$lib/server/http/reportWorkbook';

export const GET: RequestHandler = withKitErrors(async (event) => {
	await requireAdminRequest(event);
	const {
		eventId,
		services: { bookingService, ticketService }
	} = await getEventServiceContext(event);
	const [bookings, tickets] = await Promise.all([bookingService.list(), ticketService.getAll()]);
	const rows = getGeneratedTicketReportRows(tickets, bookings);
	const workbook = await createGeneratedTicketsWorkbookBuffer(rows);

	return xlsxAttachmentResponse(workbook, datedXlsxFilename(eventId, 'generated-tickets'));
});

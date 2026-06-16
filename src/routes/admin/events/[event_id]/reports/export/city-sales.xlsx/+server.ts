import type { RequestHandler } from '@sveltejs/kit';
import { getCityTicketSalesExportRows } from '$lib/application/services/reportingService';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';
import {
	createCitySalesWorkbookBuffer,
	datedXlsxFilename,
	xlsxAttachmentResponse
} from '$lib/server/http/reportWorkbook';
import { requireAdminRequest } from '$lib/server/http/guards';

export const GET: RequestHandler = withKitErrors(async (event) => {
	await requireAdminRequest(event);
	const {
		eventId,
		services: { bookingService }
	} = await getEventServiceContext(event);
	const bookings = await bookingService.list();
	const rows = getCityTicketSalesExportRows(bookings);
	const workbook = await createCitySalesWorkbookBuffer(rows);

	return xlsxAttachmentResponse(workbook, datedXlsxFilename(eventId, 'city-sales'));
});

import type { RequestHandler } from '@sveltejs/kit';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';
import { requireAdminRequest } from '$lib/server/http/guards';
import {
	createMerchReservationsWorkbookBuffer,
	datedXlsxFilename,
	xlsxAttachmentResponse
} from '$lib/server/http/reportWorkbook';

export const GET: RequestHandler = withKitErrors(async (event) => {
	await requireAdminRequest(event);
	const {
		eventId,
		services: { merchandiseService }
	} = await getEventServiceContext(event);
	const reservations = await merchandiseService.listReservations(eventId);
	const workbook = await createMerchReservationsWorkbookBuffer(reservations);

	return xlsxAttachmentResponse(workbook, datedXlsxFilename(eventId, 'merch-reservations'));
});

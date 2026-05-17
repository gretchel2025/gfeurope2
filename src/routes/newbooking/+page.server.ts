import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { parseCreateBookingForm } from '$lib/server/http/forms';
import { kitAction, withKitErrors } from '$lib/server/http/handlers';
import { bookingService, ticketCounterService } from '$lib/server/http/services';

export type ServerData = {
	standardTicketCounter: TicketCounter;
	vipTicketCounter: TicketCounter;
	youthTicketCounter: TicketCounter;
};

export const load = withKitErrors(async (): Promise<ServerData> => {
	const [standardTicketCounter, vipTicketCounter, youthTicketCounter] = await Promise.all([
		ticketCounterService.getStandardTickets(),
		ticketCounterService.getVipTickets(),
		ticketCounterService.getYouthTickets()
	]);

	if (!standardTicketCounter) throw new NotFoundError('standard ticket counter is missing');
	if (!vipTicketCounter) throw new NotFoundError('vip ticket counter is missing');
	if (!youthTicketCounter) throw new NotFoundError('youth ticket counter is missing');

	if (
		standardTicketCounter.available <= 0 &&
		vipTicketCounter.available <= 0 &&
		youthTicketCounter.available <= 0
	) {
		throw redirect(303, publicRoutes.newBookingSoldOut);
	}

	return {
		standardTicketCounter,
		vipTicketCounter,
		youthTicketCounter
	};
});

export const actions: Actions = {
	default: kitAction(async ({ request }) => {
		const formData = await request.formData();
		const input = await parseCreateBookingForm(formData);
		await bookingService.createNew(input);
		throw redirect(303, publicRoutes.newBookingSuccess);
	})
};

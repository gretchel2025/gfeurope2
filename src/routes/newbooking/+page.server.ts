import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { parseCreateBookingForm, parsePaymentProofFile } from '$lib/server/http/forms';
import { kitAction, withKitErrors } from '$lib/server/http/handlers';
import {
	bookingService,
	paymentProofStorage,
	ticketCounterService
} from '$lib/server/http/services';

export type ServerData = {
	standardTicketCounter: TicketCounter;
	grandFeastPlusTicketCounter: TicketCounter;
};

export const load = withKitErrors(async (): Promise<ServerData> => {
	const [standardTicketCounter, grandFeastPlusTicketCounter] = await Promise.all([
		ticketCounterService.getStandardTickets(),
		ticketCounterService.getGrandFeastPlusTickets()
	]);

	if (!standardTicketCounter) throw new NotFoundError('standard ticket counter is missing');
	if (!grandFeastPlusTicketCounter)
		throw new NotFoundError('GrandFeast Plus ticket counter is missing');

	if (standardTicketCounter.available <= 0 && grandFeastPlusTicketCounter.available <= 0) {
		throw redirect(303, publicRoutes.newBookingSoldOut);
	}

	return {
		standardTicketCounter,
		grandFeastPlusTicketCounter
	};
});

export const actions: Actions = {
	default: kitAction(async ({ request }) => {
		const formData = await request.formData();
		const input = await parseCreateBookingForm(formData);
		const paymentProofFile = parsePaymentProofFile(formData);
		const paymentProofUrl = await paymentProofStorage.uploadProof(paymentProofFile);
		await bookingService.createNew({
			...input,
			payment_proof_url: paymentProofUrl,
			payment_proof_filename: paymentProofFile.name
		});
		throw redirect(303, publicRoutes.newBookingSuccess);
	})
};

import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Booking } from '$lib/domain/booking';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';
import { bookingService, notificationService } from '$lib/server/http/services';

export const load: PageServerLoad = withKitErrors(
	async ({ params }: Parameters<PageServerLoad>[0]): Promise<{ aRecord: Booking | null }> => {
		return {
			aRecord: await bookingService.getRequiredById(params.reference_no)
		};
	}
);

export const actions: Actions = {
	markPaid: adminAction(async ({ params }) => {
		const referenceNo = requireRouteParam(params, 'reference_no');
		await bookingService.markPaid(referenceNo);
		throw redirect(303, adminRoutes.booking.details(referenceNo));
	}),
	generateTickets: adminAction(async ({ params }) => {
		const referenceNo = requireRouteParam(params, 'reference_no');
		await bookingService.generateRelatedTickets(referenceNo);
		throw redirect(303, adminRoutes.booking.details(referenceNo));
	}),
	sendTicketsEmail: adminAction(async ({ params }) => {
		const referenceNo = requireRouteParam(params, 'reference_no');
		await notificationService.sendTicketsEmail(referenceNo);
		throw redirect(303, adminRoutes.booking.emailSuccess(referenceNo));
	}),
	sendPaymentReminderEmail: adminAction(async ({ params }) => {
		const referenceNo = requireRouteParam(params, 'reference_no');
		await notificationService.sendPaymentReminder(referenceNo);
		throw redirect(303, adminRoutes.booking.emailSuccess(referenceNo));
	})
};

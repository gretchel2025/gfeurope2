import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Booking } from '$lib/domain/booking';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

export const load: PageServerLoad = withKitErrors(
	async (event): Promise<{ aRecord: Booking | null }> => {
		const {
			services: { bookingService }
		} = await getEventServiceContext(event);
		return {
			aRecord: await bookingService.getRequiredById(event.params.reference_no)
		};
	}
);

export const actions: Actions = {
	markPaid: adminAction(async (event) => {
		const {
			eventId,
			services: { bookingService }
		} = await getEventServiceContext(event);
		const routes = adminRoutes(eventId);
		const { params } = event;
		const referenceNo = requireRouteParam(params, 'reference_no');
		await bookingService.markPaid(referenceNo);
		throw redirect(303, routes.booking.details(referenceNo));
	}),
	generateTickets: adminAction(async (event) => {
		const {
			eventId,
			services: { bookingService }
		} = await getEventServiceContext(event);
		const routes = adminRoutes(eventId);
		const { params } = event;
		const referenceNo = requireRouteParam(params, 'reference_no');
		await bookingService.generateRelatedTickets(referenceNo);
		throw redirect(303, routes.booking.details(referenceNo));
	}),
	sendTicketsEmail: adminAction(async (event) => {
		const {
			eventId,
			services: { notificationService }
		} = await getEventServiceContext(event);
		const routes = adminRoutes(eventId);
		const { params } = event;
		const referenceNo = requireRouteParam(params, 'reference_no');
		await notificationService.sendTicketsEmail(referenceNo);
		throw redirect(303, routes.booking.emailSuccess(referenceNo));
	}),
	sendPaymentReminderEmail: adminAction(async (event) => {
		const {
			eventId,
			services: { notificationService }
		} = await getEventServiceContext(event);
		const routes = adminRoutes(eventId);
		const { params } = event;
		const referenceNo = requireRouteParam(params, 'reference_no');
		await notificationService.sendPaymentReminder(referenceNo);
		throw redirect(303, routes.booking.emailSuccess(referenceNo));
	})
};

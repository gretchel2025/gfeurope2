import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { AuditEntityType, type AuditEvent } from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, requireRouteParam, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	aRecord: Booking;
	auditEvents: AuditEvent[];
	historyLoaded: boolean;
	paymentProofImageLoaded: boolean;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { auditEventService, bookingService }
	} = await getEventServiceContext(event);
	const referenceNo = requireRouteParam(event.params, 'reference_no');
	const historyLoaded = event.url.searchParams.get('load_history') === 'true';
	const paymentProofImageLoaded = event.url.searchParams.get('show_payment_proof_image') === 'true';

	return {
		aRecord: await bookingService.getRequiredById(referenceNo),
		auditEvents: historyLoaded
			? await auditEventService.listByEntity(eventId, AuditEntityType.Booking, referenceNo)
			: [],
		historyLoaded,
		paymentProofImageLoaded
	};
});

export const actions: Actions = {
	markPaid: adminAction(async (event) => {
		const {
			eventId,
			services: { bookingService }
		} = await getEventServiceContext(event);
		const routes = adminRoutes(eventId);
		const { params } = event;
		const referenceNo = requireRouteParam(params, 'reference_no');
		await bookingService.markPaid(referenceNo, await adminRequestAuditActor(event));
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
		await bookingService.generateRelatedTickets(referenceNo, await adminRequestAuditActor(event));
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
		await notificationService.sendTicketsEmail(referenceNo, await adminRequestAuditActor(event));
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
		await notificationService.sendPaymentReminder(referenceNo, await adminRequestAuditActor(event));
		throw redirect(303, routes.booking.emailSuccess(referenceNo));
	})
};

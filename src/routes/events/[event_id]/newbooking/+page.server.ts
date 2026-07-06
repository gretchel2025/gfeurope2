import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { Event } from '$lib/domain/event';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { isPublicBookingOpen } from '$lib/publicEvents';
import { getEventContext } from '$lib/server/http/eventContext';
import { publicRequestAuditActor } from '$lib/server/http/auditActor';
import { parseCreateBookingForm, parsePaymentProofFile } from '$lib/server/http/forms';
import { kitAction, withKitErrors } from '$lib/server/http/handlers';
import { getCountryOptions, type CountryOption } from '$lib/server/http/locationOptions';
import {
	createEventServices,
	paymentProofStorage,
	ticketTypeService
} from '$lib/server/http/services';

export type BookingTicketOption = TicketTypeConfig & {
	available: number;
	notes: string[];
};

export type ServerData = {
	event: Event;
	ticketOptions: BookingTicketOption[];
	countryOptions: CountryOption[];
};

export const load: PageServerLoad = withKitErrors(async (requestEvent): Promise<ServerData> => {
	const { eventId, event } = await getEventContext(requestEvent);
	const { ticketCounterService } = createEventServices(eventId);
	const routes = publicRoutes(eventId);

	if (!isPublicBookingOpen(eventId)) {
		throw redirect(303, routes.home);
	}

	const ticketTypes = await ticketTypeService.listActive(eventId);
	const ticketOptions = await Promise.all(
		ticketTypes.map(async (ticketType) => {
			const counter = await ticketCounterService.getById(ticketType.ticket_type_id);
			if (!counter) throw new NotFoundError(`${ticketType.label} ticket counter is missing`);

			return {
				...ticketType,
				available: counter.available,
				notes: getTicketNotes(eventId, ticketType)
			};
		})
	);

	if (ticketOptions.every((option) => option.available <= 0)) {
		throw redirect(303, routes.newBookingSoldOut);
	}

	return {
		event,
		ticketOptions,
		countryOptions: getCountryOptions()
	};
});

export const actions: Actions = {
	default: kitAction(async (event) => {
		const { eventId } = await getEventContext(event);
		const routes = publicRoutes(eventId);
		if (!isPublicBookingOpen(eventId)) {
			throw redirect(303, routes.home);
		}

		const { bookingService } = createEventServices(eventId);
		const { request } = event;
		const formData = await request.formData();
		const input = await parseCreateBookingForm(formData);
		const paymentProofFile = parsePaymentProofFile(formData);
		const paymentProofUrl = await paymentProofStorage.uploadProof(paymentProofFile);
		await bookingService.createNew(
			{
				...input,
				event_id: eventId,
				payment_proof_url: paymentProofUrl
			},
			publicRequestAuditActor(input.email)
		);
		throw redirect(303, routes.newBookingSuccess);
	})
};

function getTicketNotes(eventId: string, ticketType: TicketTypeConfig): string[] {
	const description =
		eventId === 'jewels2026' && ticketType.ticket_type_id === 'STANDARD'
			? 'Conference ticket for JEWELS CONFERENCE 2026'
			: ticketType.description;
	const notes = [description];

	if (ticketType.ticket_type_id === 'GRAND_FEAST_PLUS') {
		notes.push('Our Lady of Knock pilgrimage', 'Oct 4 sightseeing');
	}

	return notes.filter(Boolean);
}

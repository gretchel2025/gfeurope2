import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { isPublicBookingOpen } from '$lib/publicEvents';
import { getEventContext } from '$lib/server/http/eventContext';
import { parseCreateBookingForm, parsePaymentProofFile } from '$lib/server/http/forms';
import { kitAction, withKitErrors } from '$lib/server/http/handlers';
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
	ticketOptions: BookingTicketOption[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const { eventId } = await getEventContext(event);
	const { ticketCounterService } = createEventServices(eventId);
	const routes = publicRoutes(eventId);
	const ticketTypes = await ticketTypeService.listActive(eventId);
	const ticketOptions = await Promise.all(
		ticketTypes.map(async (ticketType) => {
			const counter = await ticketCounterService.getById(ticketType.ticket_type_id);
			if (!counter) throw new NotFoundError(`${ticketType.label} ticket counter is missing`);

			return {
				...ticketType,
				available: counter.available,
				notes: getTicketNotes(ticketType)
			};
		})
	);

	if (ticketOptions.every((option) => option.available <= 0)) {
		throw redirect(303, routes.newBookingSoldOut);
	}

	return {
		ticketOptions
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
		await bookingService.createNew({
			...input,
			event_id: eventId,
			payment_proof_url: paymentProofUrl
		});
		throw redirect(303, routes.newBookingSuccess);
	})
};

function getTicketNotes(ticketType: TicketTypeConfig): string[] {
	const notes = [ticketType.description];

	if (ticketType.early_bird_discount_available_until) {
		notes.push('No extra group discount during Early Bird');
	}
	if (ticketType.bulk_purchase_discount_min_quantity) {
		notes.push(
			`${formatDiscount(ticketType)} group discount for ${ticketType.bulk_purchase_discount_min_quantity}+ tickets`
		);
	}
	if (ticketType.ticket_type_id === 'GRAND_FEAST_PLUS') {
		notes.push('Our Lady of Knock pilgrimage', 'Oct 4 sightseeing');
	}

	return notes.filter(Boolean);
}

function formatDiscount(ticketType: TicketTypeConfig): string {
	if (ticketType.bulk_purchase_discount_rate !== undefined) {
		return `${Math.round(ticketType.bulk_purchase_discount_rate * 100)}%`;
	}
	if (ticketType.bulk_purchase_discount_amount !== undefined) {
		return `${ticketType.bulk_purchase_discount_amount} ${ticketType.currency}`;
	}
	return '';
}

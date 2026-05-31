import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { parseCreateBookingForm, parsePaymentProofFile } from '$lib/server/http/forms';
import { kitAction, withKitErrors } from '$lib/server/http/handlers';
import {
	bookingService,
	paymentProofStorage,
	ticketCounterService,
	ticketTypeService
} from '$lib/server/http/services';

export type BookingTicketOption = TicketTypeConfig & {
	available: number;
	notes: string[];
};

export type ServerData = {
	ticketOptions: BookingTicketOption[];
};

export const load = withKitErrors(async (): Promise<ServerData> => {
	const ticketTypes = await ticketTypeService.listActive(appConfig.appEventId);
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
		throw redirect(303, publicRoutes.newBookingSoldOut);
	}

	return {
		ticketOptions
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
			event_id: appConfig.appEventId,
			payment_proof_url: paymentProofUrl
		});
		throw redirect(303, publicRoutes.newBookingSuccess);
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

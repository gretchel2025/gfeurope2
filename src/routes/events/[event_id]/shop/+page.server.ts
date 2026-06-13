import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { groupMerchProductsByCategory, type MerchProduct } from '$lib/domain/merchandise';
import { publicRoutes } from '$lib/navigation/adminRoutes';
import { publicRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { parseCreateMerchReservationForm } from '$lib/server/http/forms';
import { kitAction, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	categories: {
		category: string;
		products: MerchProduct[];
	}[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { merchandiseService }
	} = await getEventServiceContext(event);
	const products = await merchandiseService.listAvailableProducts(eventId);

	return {
		categories: groupMerchProductsByCategory(products)
	};
});

export const actions: Actions = {
	reserve: kitAction(async (event) => {
		const {
			eventId,
			services: { merchandiseService }
		} = await getEventServiceContext(event);
		const input = parseCreateMerchReservationForm(await event.request.formData());
		const reservation = await merchandiseService.createReservation(
			{
				...input,
				event_id: eventId
			},
			publicRequestAuditActor(input.email)
		);

		throw redirect(303, publicRoutes(eventId).shopSuccess(reservation.reservation_id));
	})
};

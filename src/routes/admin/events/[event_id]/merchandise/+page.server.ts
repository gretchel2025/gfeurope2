import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { MerchProduct, MerchReservation } from '$lib/domain/merchandise';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	eventId: string;
	products: MerchProduct[];
	reservations: MerchReservation[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { merchandiseService }
	} = await getEventServiceContext(event);

	return {
		eventId,
		products: await merchandiseService.listProducts(eventId),
		reservations: await merchandiseService.listReservations(eventId)
	};
});

export const actions: Actions = {
	deleteProduct: adminAction(async (event) => {
		const {
			eventId,
			services: { merchandiseService }
		} = await getEventServiceContext(event);
		const formData = await event.request.formData();
		const productId = formData.get('product_id');
		if (typeof productId !== 'string') return;

		await merchandiseService.deleteProduct(eventId, productId, await adminRequestAuditActor(event));

		throw redirect(303, adminRoutes(eventId).merchandise);
	})
};

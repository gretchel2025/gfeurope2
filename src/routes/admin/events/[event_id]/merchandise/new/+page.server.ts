import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { parseCreateMerchProductForm, parseMerchProductImageFiles } from '$lib/server/http/forms';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';
import { merchProductImageStorage } from '$lib/server/http/services';

export type ServerData = {
	eventId: string;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const { eventId } = await getEventServiceContext(event);
	return { eventId };
});

export const actions: Actions = {
	createProduct: adminAction(async (event) => {
		const {
			eventId,
			services: { merchandiseService }
		} = await getEventServiceContext(event);
		const formData = await event.request.formData();
		const input = parseCreateMerchProductForm(formData);
		const imageFiles = parseMerchProductImageFiles(formData);
		const actor = await adminRequestAuditActor(event);
		const product = await merchandiseService.createProduct(
			{
				...input,
				event_id: eventId,
				image_urls: []
			},
			actor
		);

		if (imageFiles.length > 0) {
			const uploadedImageUrls = await merchProductImageStorage.uploadProductImages(
				eventId,
				product.product_id,
				imageFiles
			);
			await merchandiseService.updateProduct(
				eventId,
				{
					product_id: product.product_id,
					name: product.name,
					description: product.description,
					category: product.category,
					unit_price: product.unit_price,
					currency: product.currency,
					stock_count: product.stock_count,
					sizes: product.sizes,
					colors: product.colors,
					is_active: product.is_active,
					image_urls: uploadedImageUrls
				},
				actor
			);
		}

		throw redirect(303, adminRoutes(eventId).merchandise);
	})
};

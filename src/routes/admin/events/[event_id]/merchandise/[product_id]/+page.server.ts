import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { NotFoundError } from '$lib/application/errors';
import type { MerchProduct } from '$lib/domain/merchandise';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { parseMerchProductImageFiles, parseUpdateMerchProductForm } from '$lib/server/http/forms';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';
import { merchProductImageStorage } from '$lib/server/http/services';

export type ServerData = {
	eventId: string;
	product: MerchProduct;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { merchandiseService }
	} = await getEventServiceContext(event);
	const product = await merchandiseService.getProduct(eventId, event.params.product_id);
	if (!product) {
		throw new NotFoundError('merch product not found');
	}

	return {
		eventId,
		product
	};
});

export const actions: Actions = {
	updateProduct: adminAction(async (event) => {
		const {
			eventId,
			services: { merchandiseService }
		} = await getEventServiceContext(event);
		const formData = await event.request.formData();
		const input = parseUpdateMerchProductForm(formData);
		const existingProduct = await merchandiseService.getProduct(eventId, input.product_id);
		const keptImageUrls = (existingProduct?.image_urls ?? []).filter(
			(url) => !input.remove_image_urls.includes(url)
		);
		const uploadedImageUrls = await merchProductImageStorage.uploadProductImages(
			eventId,
			input.product_id,
			parseMerchProductImageFiles(formData)
		);

		await merchandiseService.updateProduct(
			eventId,
			{
				product_id: input.product_id,
				name: input.name,
				description: input.description,
				category: input.category,
				unit_price: input.unit_price,
				currency: input.currency,
				stock_count: input.stock_count,
				sizes: input.sizes,
				colors: input.colors,
				is_active: input.is_active,
				image_urls: [...keptImageUrls, ...uploadedImageUrls]
			},
			await adminRequestAuditActor(event)
		);

		throw redirect(303, adminRoutes(eventId).merchandise);
	})
};

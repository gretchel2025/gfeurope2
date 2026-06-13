import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { MerchProduct, MerchReservation } from '$lib/domain/merchandise';
import { adminRoutes } from '$lib/navigation/adminRoutes';
import { adminRequestAuditActor } from '$lib/server/http/auditActor';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import {
	parseCreateMerchProductForm,
	parseMerchProductImageFiles,
	parseUpdateMerchProductForm
} from '$lib/server/http/forms';
import { adminAction, withKitErrors } from '$lib/server/http/handlers';
import { merchProductImageStorage } from '$lib/server/http/services';

export type ServerData = {
	products: MerchProduct[];
	reservations: MerchReservation[];
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const {
		eventId,
		services: { merchandiseService }
	} = await getEventServiceContext(event);

	return {
		products: await merchandiseService.listProducts(eventId),
		reservations: await merchandiseService.listReservations(eventId)
	};
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
	}),

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
	}),

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

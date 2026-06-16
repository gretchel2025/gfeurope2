import { fail, redirect } from '@sveltejs/kit';
import { ValidationError } from '$lib/application/errors';
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

export type MerchReservationFormValues = {
	customer_name: string;
	email: string;
	mobile: string;
	quantities: Record<string, string>;
	sizes: Record<string, string>;
	colors: Record<string, string>;
};

export type MerchReservationFormErrors = Record<string, string>;

export type MerchReservationActionData = {
	values: MerchReservationFormValues;
	errors: MerchReservationFormErrors;
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

		const formData = await event.request.formData();
		const products = await merchandiseService.listAvailableProducts(eventId);
		const formErrors = validateReservationFormData(formData, products);
		if (hasReservationFormErrors(formErrors)) {
			return fail(400, {
				values: readReservationFormValues(formData),
				errors: formErrors
			});
		}

		try {
			const input = parseCreateMerchReservationForm(formData);
			const reservation = await merchandiseService.createReservation(
				{
					...input,
					event_id: eventId
				},
				publicRequestAuditActor(input.email)
			);

			throw redirect(303, publicRoutes(eventId).shopSuccess(reservation.reservation_id));
		} catch (caught) {
			if (
				caught instanceof ValidationError ||
				(caught instanceof Error && isMerchOptionValidationMessage(caught.message))
			) {
				return fail(400, buildReservationActionData(formData, caught.message));
			}

			throw caught;
		}
	})
};

function validateReservationFormData(
	formData: FormData,
	products: MerchProduct[]
): MerchReservationFormErrors {
	const errors: MerchReservationFormErrors = {};
	const customerName = readFormString(formData, 'customer_name').trim();
	const email = readFormString(formData, 'email').trim();
	const mobile = readFormString(formData, 'mobile').trim();
	let hasSelectedItem = false;
	let hasQuantityError = false;

	if (!customerName) {
		errors.customer_name = 'Customer name is required.';
	}
	if (!email) {
		errors.email = 'Email is required.';
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		errors.email = 'Enter a valid email address.';
	}
	if (!mobile) {
		errors.mobile = 'Mobile number is required.';
	}

	for (const product of products) {
		const field = `quantity_${product.product_id}`;
		const rawQuantity = readFormString(formData, field).trim();
		if (!rawQuantity) continue;

		if (!/^\d+$/.test(rawQuantity)) {
			errors[field] = 'Enter a whole number quantity.';
			hasQuantityError = true;
			continue;
		}

		const quantity = Number(rawQuantity);
		const maxQuantity = Math.min(product.stock_count, 99);
		if (quantity > maxQuantity) {
			errors[field] =
				maxQuantity === product.stock_count
					? `Only ${product.stock_count} available.`
					: `Enter ${maxQuantity} or fewer.`;
			hasQuantityError = true;
			continue;
		}

		if (quantity > 0) {
			hasSelectedItem = true;
			validateSelectedProductOptions(formData, product, errors);
		}
	}

	if (!hasSelectedItem && !hasQuantityError) {
		const productId = products[0]?.product_id || firstProductId(formData);
		errors[productId ? `quantity_${productId}` : 'items'] = productId
			? 'Select qty.'
			: 'Choose at least one merchandise item.';
	}

	return errors;
}

function validateSelectedProductOptions(
	formData: FormData,
	product: MerchProduct,
	errors: MerchReservationFormErrors
) {
	const size = readFormString(formData, sizeField(product.product_id)).trim();
	const color = readFormString(formData, colorField(product.product_id)).trim();

	if (product.sizes.length > 0) {
		if (!size) {
			errors[sizeField(product.product_id)] = 'Select size.';
		} else if (!product.sizes.includes(size)) {
			errors[sizeField(product.product_id)] = 'Select valid size.';
		}
	}

	if (product.colors.length > 0) {
		if (!color) {
			errors[colorField(product.product_id)] = 'Select color.';
		} else if (!product.colors.includes(color)) {
			errors[colorField(product.product_id)] = 'Select valid color.';
		}
	}
}

function hasReservationFormErrors(errors: MerchReservationFormErrors): boolean {
	return Object.values(errors).some(Boolean);
}

function isMerchOptionValidationMessage(message: string): boolean {
	return (
		message.includes('invalid size for merch product ') ||
		message.includes('invalid color for merch product ')
	);
}

function buildReservationActionData(
	formData: FormData,
	message: string
): MerchReservationActionData {
	return {
		values: readReservationFormValues(formData),
		errors: mapReservationValidationError(formData, message)
	};
}

function readReservationFormValues(formData: FormData): MerchReservationFormValues {
	const values: MerchReservationFormValues = {
		customer_name: readFormString(formData, 'customer_name'),
		email: readFormString(formData, 'email'),
		mobile: readFormString(formData, 'mobile'),
		quantities: {},
		sizes: {},
		colors: {}
	};

	for (const [key, value] of formData.entries()) {
		if (typeof value !== 'string') continue;
		if (key.startsWith('quantity_')) {
			values.quantities[key.slice('quantity_'.length)] = value;
		}
		if (key.startsWith('size_')) {
			values.sizes[key.slice('size_'.length)] = value;
		}
		if (key.startsWith('color_')) {
			values.colors[key.slice('color_'.length)] = value;
		}
	}

	return values;
}

function mapReservationValidationError(
	formData: FormData,
	message: string
): MerchReservationFormErrors {
	if (message === 'customer_name is required') {
		return { customer_name: 'Customer name is required.' };
	}
	if (message === 'email is required' || message === 'a valid email is required') {
		return { email: 'Enter a valid email address.' };
	}
	if (message === 'mobile is required') {
		return { mobile: 'Mobile number is required.' };
	}
	if (message === 'choose at least one merchandise item') {
		const productId = firstProductId(formData);
		return productId
			? { [`quantity_${productId}`]: 'Select qty.' }
			: { items: 'Choose at least one merchandise item.' };
	}
	if (message.endsWith(' is not numeric')) {
		const fieldName = message.slice(0, -' is not numeric'.length);
		if (fieldName.startsWith('quantity_')) {
			return { [fieldName]: 'Enter a whole number quantity.' };
		}
	}
	if (message === 'quantity must be between 1 and 99') {
		return { items: 'Enter a quantity between 1 and 99.' };
	}
	if (message.includes('invalid size for merch product ')) {
		const productId = message.split('invalid size for merch product ')[1]?.trim() ?? '';
		return { [sizeField(productId)]: 'Select valid size.' };
	}
	if (message.includes('invalid color for merch product ')) {
		const productId = message.split('invalid color for merch product ')[1]?.trim() ?? '';
		return { [colorField(productId)]: 'Select valid color.' };
	}

	return { items: message };
}

function readFormString(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === 'string' ? value : '';
}

function firstProductId(formData: FormData): string {
	for (const value of formData.getAll('product_id')) {
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
	}

	return '';
}

function sizeField(productId: string): string {
	return `size_${productId}`;
}

function colorField(productId: string): string {
	return `color_${productId}`;
}

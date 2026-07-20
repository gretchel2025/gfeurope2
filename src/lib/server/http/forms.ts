/**
 * Purpose:
 * This file parses HTTP form payloads into application input objects.
 *
 * Why this structure is good:
 * Request parsing belongs near the HTTP layer, not inside application services.
 * That keeps business code working with already-normalized inputs.
 */
import { ValidationError } from '$lib/application/errors';
import type { CreateBookingInput } from '$lib/domain/booking';
import {
	allowedPaymentProofTypes,
	maxPaymentProofSizeBytes,
	maxPaymentProofSizeLabel
} from '$lib/domain/paymentProof';
import {
	isMerchProductCategory,
	merchProductCategories,
	type CreateMerchProductInput,
	type CreateMerchReservationInput,
	type UpdateMerchProductInput
} from '$lib/domain/merchandise';

const allowedProductImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const maxProductImageSizeBytes = 5 * 1024 * 1024;
const maxProductImages = 5;

export type CreateBookingFormInput = Omit<CreateBookingInput, 'event_id'>;
export type CreateMerchProductFormInput = Omit<CreateMerchProductInput, 'event_id' | 'image_urls'>;
export type UpdateMerchProductFormInput = Omit<UpdateMerchProductInput, 'image_urls'> & {
	remove_image_urls: string[];
};
export type CreateMerchReservationFormInput = Omit<CreateMerchReservationInput, 'event_id'>;

/** Parses the public booking form into the application's booking input shape. */
export async function parseCreateBookingForm(formData: FormData): Promise<CreateBookingFormInput> {
	const name = readRequiredString(formData, 'name');
	const email = readRequiredString(formData, 'email');
	readRequiredString(formData, 'country');
	const city = readRequiredString(formData, 'city');
	const ticket_type = readRequiredString(formData, 'ticket_type');
	const quantity = readRequiredNumber(formData, 'quantity');

	const guests: string[] = [];
	for (let i = 1; i <= quantity; i += 1) {
		guests.push(readRequiredString(formData, `guest_${i}`));
	}

	parsePaymentProofFile(formData);

	return {
		name,
		email,
		city,
		ticket_type,
		quantity,
		guests
	};
}

/** Parses the admin merch product creation form. */
export function parseCreateMerchProductForm(formData: FormData): CreateMerchProductFormInput {
	return {
		name: readRequiredString(formData, 'name'),
		description: readRequiredString(formData, 'description'),
		category: readMerchProductCategory(formData),
		unit_price: readRequiredMoney(formData, 'unit_price'),
		currency: readOptionalString(formData, 'currency') || 'EUR',
		stock_count: readRequiredNumber(formData, 'stock_count'),
		sizes: parseCommaSeparatedList(readOptionalString(formData, 'sizes')),
		colors: parseCommaSeparatedList(readOptionalString(formData, 'colors')),
		is_active: readBoolean(formData, 'is_active')
	};
}

/** Parses the admin merch product update form. */
export function parseUpdateMerchProductForm(formData: FormData): UpdateMerchProductFormInput {
	return {
		product_id: readRequiredString(formData, 'product_id'),
		name: readRequiredString(formData, 'name'),
		description: readRequiredString(formData, 'description'),
		category: readMerchProductCategory(formData),
		unit_price: readRequiredMoney(formData, 'unit_price'),
		currency: readOptionalString(formData, 'currency') || 'EUR',
		stock_count: readRequiredNumber(formData, 'stock_count'),
		sizes: parseCommaSeparatedList(readOptionalString(formData, 'sizes')),
		colors: parseCommaSeparatedList(readOptionalString(formData, 'colors')),
		is_active: readBoolean(formData, 'is_active'),
		remove_image_urls: readStringList(formData, 'remove_image_url')
	};
}

/** Reads admin product image uploads and enforces type/count/size limits. */
export function parseMerchProductImageFiles(formData: FormData): File[] {
	const files = formData
		.getAll('images')
		.filter((value): value is File => value instanceof File && value.size > 0);

	if (files.length > maxProductImages) {
		throw new ValidationError(`upload at most ${maxProductImages} product images`);
	}

	for (const file of files) {
		if (file.size > maxProductImageSizeBytes) {
			throw new ValidationError('product images must be 5 MB or smaller');
		}
		if (!allowedProductImageTypes.has(file.type)) {
			throw new ValidationError('product images must be PNG, JPG, JPEG, or WEBP files');
		}
	}

	return files;
}

/** Parses the public merch reservation form into the application input shape. */
export function parseCreateMerchReservationForm(
	formData: FormData
): CreateMerchReservationFormInput {
	const customer_name = readRequiredString(formData, 'customer_name');
	const email = readRequiredString(formData, 'email');
	const mobile = readRequiredString(formData, 'mobile');
	const productIds = readStringList(formData, 'product_id');
	const items = productIds
		.map((productId) => {
			const quantity = readOptionalNumber(formData, `quantity_${productId}`);
			return {
				product_id: productId,
				quantity,
				selected_size: readOptionalString(formData, `size_${productId}`) || undefined,
				selected_color: readOptionalString(formData, `color_${productId}`) || undefined
			};
		})
		.filter((item) => item.quantity > 0);

	return {
		customer_name,
		email,
		mobile,
		items
	};
}

/** Reads a required trimmed string field from form data. */
function readRequiredString(formData: FormData, key: string): string {
	const value = formData.get(key);
	if (typeof value !== 'string' || value.trim() === '') {
		throw new ValidationError(`${key} is required`);
	}

	return value.trim();
}

function readMerchProductCategory(formData: FormData): string {
	const category = readRequiredString(formData, 'category');
	if (!isMerchProductCategory(category)) {
		throw new ValidationError(`category must be one of ${merchProductCategories.join(', ')}`);
	}

	return category;
}

function readOptionalString(formData: FormData, key: string): string {
	const value = formData.get(key);
	if (typeof value !== 'string') {
		return '';
	}

	return value.trim();
}

function readStringList(formData: FormData, key: string): string[] {
	return formData
		.getAll(key)
		.filter((value): value is string => typeof value === 'string')
		.map((value) => value.trim())
		.filter(Boolean);
}

/** Reads a required integer field from form data. */
function readRequiredNumber(formData: FormData, key: string): number {
	const value = readRequiredString(formData, key);
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed.toString() !== value) {
		throw new ValidationError(`${key} is not numeric`);
	}
	return parsed;
}

function readOptionalNumber(formData: FormData, key: string): number {
	const value = readOptionalString(formData, key);
	if (!value) {
		return 0;
	}

	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed) || parsed.toString() !== value) {
		throw new ValidationError(`${key} is not numeric`);
	}
	return parsed;
}

function readRequiredMoney(formData: FormData, key: string): number {
	const value = readRequiredString(formData, key);
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed) || parsed < 0) {
		throw new ValidationError(`${key} must be zero or greater`);
	}
	return Math.round(parsed * 100) / 100;
}

function readBoolean(formData: FormData, key: string): boolean {
	const value = formData.get(key);
	return value === 'on' || value === 'true' || value === '1';
}

function parseCommaSeparatedList(value: string): string[] {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

/** Requires a payment proof upload before a booking record can be created. */
export function parsePaymentProofFile(formData: FormData): File {
	const value = formData.get('payment_proof');
	if (!(value instanceof File) || value.size === 0) {
		throw new ValidationError('payment_proof is required');
	}

	if (value.size > maxPaymentProofSizeBytes) {
		throw new ValidationError(`payment_proof must be ${maxPaymentProofSizeLabel} or smaller`);
	}

	if (!allowedPaymentProofTypes.has(value.type)) {
		throw new ValidationError('payment_proof must be a PDF, PNG, JPG, or JPEG file');
	}

	return value;
}

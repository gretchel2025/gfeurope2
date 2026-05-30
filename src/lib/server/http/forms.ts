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

const allowedPaymentProofTypes = new Set(['application/pdf', 'image/png', 'image/jpeg']);
const maxPaymentProofSizeBytes = 10 * 1024 * 1024;

export type CreateBookingFormInput = Omit<CreateBookingInput, 'event_id'>;

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

/** Reads a required trimmed string field from form data. */
function readRequiredString(formData: FormData, key: string): string {
	const value = formData.get(key);
	if (typeof value !== 'string' || value.trim() === '') {
		throw new ValidationError(`${key} is required`);
	}

	return value.trim();
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

/** Requires a payment proof upload before a booking record can be created. */
export function parsePaymentProofFile(formData: FormData): File {
	const value = formData.get('payment_proof');
	if (!(value instanceof File) || value.size === 0) {
		throw new ValidationError('payment_proof is required');
	}

	if (value.size > maxPaymentProofSizeBytes) {
		throw new ValidationError('payment_proof must be 10 MB or smaller');
	}

	if (!allowedPaymentProofTypes.has(value.type)) {
		throw new ValidationError('payment_proof must be a PDF, PNG, JPG, or JPEG file');
	}

	return value;
}

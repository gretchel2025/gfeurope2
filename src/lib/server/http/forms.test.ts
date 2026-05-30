import { describe, expect, it } from 'vitest';
import { ValidationError } from '$lib/application/errors';
import { parseCreateBookingForm } from '$lib/server/http/forms';
import { TicketType } from '$lib/domain/shared/enums';

function bookingForm(overrides: Record<string, string> = {}) {
	const formData = new FormData();
	const values = {
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		country: 'Ireland',
		city: 'Dublin, Ireland',
		ticket_type: TicketType.STANDARD,
		quantity: '2',
		guest_1: 'Ada Lovelace',
		guest_2: 'Grace Hopper',
		...overrides
	};

	Object.entries(values).forEach(([key, value]) => formData.set(key, value));
	formData.set('payment_proof', new File(['proof'], 'proof.pdf', { type: 'application/pdf' }));
	return formData;
}

describe('parseCreateBookingForm', () => {
	it('parses separated country and city booking fields into existing booking input', async () => {
		await expect(parseCreateBookingForm(bookingForm())).resolves.toEqual({
			name: 'Ada Lovelace',
			email: 'ada@example.com',
			city: 'Dublin, Ireland',
			ticket_type: TicketType.STANDARD,
			quantity: 2,
			guests: ['Ada Lovelace', 'Grace Hopper']
		});
	});

	it('requires country before accepting the booking form', async () => {
		await expect(parseCreateBookingForm(bookingForm({ country: '' }))).rejects.toBeInstanceOf(
			ValidationError
		);
	});

	it('requires payment proof before accepting the booking form', async () => {
		const formData = bookingForm();
		formData.delete('payment_proof');

		await expect(parseCreateBookingForm(formData)).rejects.toBeInstanceOf(ValidationError);
	});

	it('rejects unsupported payment proof file types', async () => {
		const formData = bookingForm();
		formData.set('payment_proof', new File(['proof'], 'proof.txt', { type: 'text/plain' }));

		await expect(parseCreateBookingForm(formData)).rejects.toBeInstanceOf(ValidationError);
	});
});

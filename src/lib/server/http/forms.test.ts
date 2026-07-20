import { describe, expect, it } from 'vitest';

import { ValidationError } from '$lib/application/errors';
import { maxPaymentProofSizeBytes, maxPaymentProofSizeLabel } from '$lib/domain/paymentProof';
import {
	parseCreateMerchProductForm,
	parseCreateMerchReservationForm,
	parseMerchProductImageFiles,
	parsePaymentProofFile
} from '$lib/server/http/forms';

function imageFile(name: string, type = 'image/png'): File {
	return new File([new Uint8Array([1])], name, { type });
}

describe('merchandise form parsing', () => {
	it('parses product creation without a custom product id', () => {
		const formData = productFormData();

		expect(parseCreateMerchProductForm(formData)).toMatchObject({
			name: 'Grand Feast T-Shirt',
			category: 'T-Shirts',
			unit_price: 20,
			stock_count: 10
		});
		expect(parseCreateMerchProductForm(formData)).not.toHaveProperty('product_id');
	});

	it('rejects unsupported product categories', () => {
		const formData = productFormData();
		formData.set('category', 'Drinkware');

		expect(() => parseCreateMerchProductForm(formData)).toThrow(ValidationError);
	});

	it('accepts up to five product images', () => {
		const formData = new FormData();
		for (let index = 0; index < 5; index += 1) {
			formData.append('images', imageFile(`product-${index}.png`));
		}

		expect(parseMerchProductImageFiles(formData)).toHaveLength(5);
	});

	it('rejects more than five product images', () => {
		const formData = new FormData();
		for (let index = 0; index < 6; index += 1) {
			formData.append('images', imageFile(`product-${index}.png`));
		}

		expect(() => parseMerchProductImageFiles(formData)).toThrow(ValidationError);
	});

	it('rejects unsupported product image types', () => {
		const formData = new FormData();
		formData.append('images', imageFile('product.gif', 'image/gif'));

		expect(() => parseMerchProductImageFiles(formData)).toThrow(ValidationError);
	});

	it('parses reservation items with selected size and color', () => {
		const formData = new FormData();
		formData.append('customer_name', 'Codex Test Customer');
		formData.append('email', 'codex-merch-test@example.test');
		formData.append('mobile', '+353 000 000 000');
		formData.append('product_id', 'mug');
		formData.append('quantity_mug', '2');
		formData.append('size_mug', 'One Size');
		formData.append('color_mug', 'Gold');
		formData.append('product_id', 'shirt');
		formData.append('quantity_shirt', '0');

		expect(parseCreateMerchReservationForm(formData)).toEqual({
			customer_name: 'Codex Test Customer',
			email: 'codex-merch-test@example.test',
			mobile: '+353 000 000 000',
			items: [
				{
					product_id: 'mug',
					quantity: 2,
					selected_size: 'One Size',
					selected_color: 'Gold'
				}
			]
		});
	});
});

describe('payment proof form parsing', () => {
	it('accepts payment proof files at the configured upload limit', () => {
		const formData = new FormData();
		const file = new File([new Uint8Array(maxPaymentProofSizeBytes)], 'proof.pdf', {
			type: 'application/pdf'
		});
		formData.append('payment_proof', file);

		expect(parsePaymentProofFile(formData)).toBe(file);
	});

	it('rejects payment proof files over the configured upload limit', () => {
		const formData = new FormData();
		formData.append(
			'payment_proof',
			new File([new Uint8Array(maxPaymentProofSizeBytes + 1)], 'proof.pdf', {
				type: 'application/pdf'
			})
		);

		expect(() => parsePaymentProofFile(formData)).toThrow(
			`payment_proof must be ${maxPaymentProofSizeLabel} or smaller`
		);
	});
});

function productFormData(): FormData {
	const formData = new FormData();
	formData.append('name', 'Grand Feast T-Shirt');
	formData.append('description', 'Official event shirt.');
	formData.append('category', 'T-Shirts');
	formData.append('unit_price', '20');
	formData.append('currency', 'EUR');
	formData.append('stock_count', '10');
	formData.append('sizes', 'S, M, L');
	formData.append('colors', 'Navy, White');
	formData.append('is_active', 'on');
	return formData;
}

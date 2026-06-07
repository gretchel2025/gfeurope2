import { describe, expect, it } from 'vitest';
import {
	getCloudinaryPaymentProofResourceType,
	getCloudinaryPaymentProofSignedUrl
} from '$lib/infrastructure/media/cloudinaryPaymentProofStorage';

describe('CloudinaryPaymentProofStorage', () => {
	it('uploads PDFs as raw files so Cloudinary does not treat them as image PDFs', () => {
		const file = new File(['proof'], 'proof.pdf', { type: 'application/pdf' });

		expect(getCloudinaryPaymentProofResourceType(file)).toBe('raw');
	});

	it('uploads image payment proofs as image resources', () => {
		const file = new File(['proof'], 'proof.jpg', { type: 'image/jpeg' });

		expect(getCloudinaryPaymentProofResourceType(file)).toBe('image');
	});

	it('builds a signed Cloudinary URL for PDF proofs', () => {
		const signedUrl = getCloudinaryPaymentProofSignedUrl(
			'https://res.cloudinary.com/dg2u7fmoc/raw/upload/v1780820931/payment_proofs/BANK_ACCT_qhdfhp.pdf',
			1_780_821_231
		);

		expect(signedUrl).toContain('/raw/download?');
		expect(signedUrl).toContain('public_id=payment_proofs%2FBANK_ACCT_qhdfhp.pdf');
		expect(signedUrl).toContain('expires_at=1780821231');
		expect(signedUrl).toContain('signature=');
	});

	it('does not sign non-PDF proof URLs', () => {
		expect(
			getCloudinaryPaymentProofSignedUrl(
				'https://res.cloudinary.com/dg2u7fmoc/image/upload/v1780820931/payment_proofs/proof.jpg'
			)
		).toBeNull();
	});
});

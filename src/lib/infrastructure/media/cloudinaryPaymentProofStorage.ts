/**
 * Purpose:
 * This file uploads public booking payment proof files to Cloudinary.
 *
 * Why this structure is good:
 * The route can require proof upload without knowing Cloudinary SDK details.
 */
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { Buffer } from 'node:buffer';
import type { PaymentProofStorage } from '$lib/application/ports';
import { appConfig, assertCloudinaryConfigured } from '$lib/infrastructure/config/env.server';

cloudinary.config({
	cloud_name: appConfig.integrations.cloudinaryCloudName,
	api_key: appConfig.integrations.cloudinaryApiKey,
	api_secret: appConfig.integrations.cloudinaryApiSecret
});

/** Stores bank-transfer proof files in Cloudinary when credentials are configured. */
export class CloudinaryPaymentProofStorage implements PaymentProofStorage {
	async uploadProof(file: File): Promise<string> {
		assertCloudinaryConfigured();

		const buffer = Buffer.from(await file.arrayBuffer());
		const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
		const response: UploadApiResponse = await cloudinary.uploader.upload(dataUri, {
			folder: 'payment_proofs',
			resource_type: 'auto'
		});

		return response.secure_url;
	}
}

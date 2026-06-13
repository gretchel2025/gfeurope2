import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { Buffer } from 'node:buffer';
import type { MerchProductImageStorage } from '$lib/application/ports';
import { appConfig, assertCloudinaryConfigured } from '$lib/infrastructure/config/env.server';
import { logger } from '$lib/infrastructure/logging/logger';

cloudinary.config({
	cloud_name: appConfig.integrations.cloudinaryCloudName,
	api_key: appConfig.integrations.cloudinaryApiKey,
	api_secret: appConfig.integrations.cloudinaryApiSecret
});

export class CloudinaryMerchProductImageStorage implements MerchProductImageStorage {
	async uploadProductImages(eventId: string, productId: string, files: File[]): Promise<string[]> {
		if (files.length === 0) {
			return [];
		}

		if (appConfig.dev && isCloudinaryMissing()) {
			logger.warn('[WARN] Cloudinary is not configured in local dev, storing merch images inline');
			return await Promise.all(files.map(fileToDataUri));
		}

		assertCloudinaryConfigured();

		return await Promise.all(
			files.map(async (file) => {
				const response: UploadApiResponse = await cloudinary.uploader.upload(
					await fileToDataUri(file),
					{
						folder: `merchandise/${eventId}/${productId}`,
						resource_type: 'image',
						use_filename: true,
						unique_filename: true,
						filename_override: file.name
					}
				);
				return response.secure_url;
			})
		);
	}
}

async function fileToDataUri(file: File): Promise<string> {
	const buffer = Buffer.from(await file.arrayBuffer());
	return `data:${file.type};base64,${buffer.toString('base64')}`;
}

function isCloudinaryMissing(): boolean {
	return (
		!appConfig.integrations.cloudinaryCloudName ||
		!appConfig.integrations.cloudinaryApiKey ||
		!appConfig.integrations.cloudinaryApiSecret
	);
}

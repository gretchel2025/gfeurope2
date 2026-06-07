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
import { logger } from '$lib/infrastructure/logging/logger';

type CloudinaryPaymentProofResourceType = 'image' | 'raw';
type CloudinaryDeliveryType = 'upload' | 'private' | 'authenticated';

cloudinary.config({
	cloud_name: appConfig.integrations.cloudinaryCloudName,
	api_key: appConfig.integrations.cloudinaryApiKey,
	api_secret: appConfig.integrations.cloudinaryApiSecret
});

/** Stores bank-transfer proof files in Cloudinary when credentials are configured. */
export class CloudinaryPaymentProofStorage implements PaymentProofStorage {
	async uploadProof(file: File): Promise<string> {
		if (appConfig.dev && isCloudinaryMissing()) {
			logger.warn(
				'[WARN] Cloudinary is not configured in local dev, storing payment proof as inline data'
			);
			const buffer = Buffer.from(await file.arrayBuffer());
			return `data:${file.type};base64,${buffer.toString('base64')}`;
		}

		assertCloudinaryConfigured();

		const buffer = Buffer.from(await file.arrayBuffer());
		const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
		const response: UploadApiResponse = await cloudinary.uploader.upload(dataUri, {
			folder: 'payment_proofs',
			resource_type: getCloudinaryPaymentProofResourceType(file),
			use_filename: true,
			unique_filename: true,
			filename_override: file.name
		});

		return response.secure_url;
	}
}

export function getCloudinaryPaymentProofResourceType(
	file: File
): CloudinaryPaymentProofResourceType {
	if (file.type === 'application/pdf') {
		return 'raw';
	}

	return 'image';
}

export function getCloudinaryPaymentProofSignedUrl(
	proofUrl: string,
	expiresAt = Math.floor(Date.now() / 1000) + 5 * 60
): string | null {
	const details = parseCloudinaryDeliveryUrl(proofUrl);
	if (!details || details.format !== 'pdf') {
		return null;
	}

	assertCloudinaryConfigured();

	return cloudinary.utils.private_download_url(details.publicId, details.format, {
		resource_type: details.resourceType,
		type: details.deliveryType,
		expires_at: expiresAt,
		attachment: false
	});
}

function parseCloudinaryDeliveryUrl(proofUrl: string): {
	resourceType: CloudinaryPaymentProofResourceType;
	deliveryType: CloudinaryDeliveryType;
	publicId: string;
	format: string;
} | null {
	let url: URL;
	try {
		url = new URL(proofUrl);
	} catch {
		return null;
	}

	if (url.hostname !== 'res.cloudinary.com') {
		return null;
	}

	const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
	if (segments[0] !== appConfig.integrations.cloudinaryCloudName) {
		return null;
	}

	const resourceType = segments[1];
	const deliveryType = segments[2];
	if (
		(resourceType !== 'image' && resourceType !== 'raw') ||
		!isCloudinaryDeliveryType(deliveryType)
	) {
		return null;
	}

	const versionIndex = segments.findIndex((segment, index) => index > 2 && /^v\d+$/.test(segment));
	const publicIdSegments = segments.slice(versionIndex === -1 ? 3 : versionIndex + 1);
	if (publicIdSegments.length === 0) {
		return null;
	}

	const publicId = publicIdSegments.join('/');
	const filename = publicIdSegments.at(-1) ?? '';
	const extensionIndex = filename.lastIndexOf('.');
	const format = extensionIndex === -1 ? '' : filename.slice(extensionIndex + 1).toLowerCase();

	return {
		resourceType,
		deliveryType,
		publicId,
		format
	};
}

function isCloudinaryDeliveryType(value: string | undefined): value is CloudinaryDeliveryType {
	return value === 'upload' || value === 'private' || value === 'authenticated';
}

function isCloudinaryMissing(): boolean {
	return (
		!appConfig.integrations.cloudinaryCloudName ||
		!appConfig.integrations.cloudinaryApiKey ||
		!appConfig.integrations.cloudinaryApiSecret
	);
}

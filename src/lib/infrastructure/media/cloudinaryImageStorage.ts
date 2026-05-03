import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { ImageStorage } from "$lib/application/ports";
import { appConfig } from "$lib/infrastructure/config/env.server";
import { logger } from "$lib/infrastructure/logging/logger";

cloudinary.config({
    cloud_name: appConfig.integrations.cloudinaryCloudName,
    api_key: appConfig.integrations.cloudinaryApiKey,
    api_secret: appConfig.integrations.cloudinaryApiSecret,
});

export class CloudinaryImageStorage implements ImageStorage {
    async uploadImage(imageData: string): Promise<string> {
        if (
            !appConfig.integrations.cloudinaryCloudName ||
            !appConfig.integrations.cloudinaryApiKey ||
            !appConfig.integrations.cloudinaryApiSecret
        ) {
            logger.warn("[WARN] Cloudinary is not configured, returning inline image data instead of uploaded URL");
            return imageData;
        }

        const response: UploadApiResponse = await cloudinary.uploader.upload(imageData, {
            upload_preset: "ml_default",
            folder: "qr_codes",
        });
        return response.secure_url;
    }
}

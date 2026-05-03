import { env } from '$env/dynamic/private'
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';

const CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME
const API_KEY = env.CLOUDINARY_API_KEY
const API_SECRET = env.CLOUDINARY_API_SECRET

interface CloudinaryConfig {
    cloud_name: string;
    api_key: string;
    api_secret: string;
}

// Configure Cloudinary
const cloudinaryConfig: CloudinaryConfig = {
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET
};

cloudinary.config(cloudinaryConfig);

// UploadImage uploads the given image data and returns the URL of the uploaded image
export async function UploadImage(imageData: string): Promise<string> {
    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
        console.warn('[WARN] Cloudinary is not configured, returning inline image data instead of uploaded URL');
        return imageData;
    }

    try {
        const response: UploadApiResponse = await cloudinary.uploader.upload(imageData, {
            upload_preset: 'ml_default', // Set your upload preset if you have one
            folder: 'qr_codes' // Optional: specify a folder
        });
        return response.secure_url;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw error;
    }
}

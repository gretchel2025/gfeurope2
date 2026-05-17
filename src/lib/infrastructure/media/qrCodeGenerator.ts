/**
 * Purpose:
 * This file provides the QR code generation implementation.
 *
 * Why this structure is good:
 * The application asks for QR codes through a port, which keeps library choices
 * and encoding details out of the service layer.
 */
import { toDataURL } from "qrcode";
import type { QrCodeGenerator } from "$lib/application/ports";

/** Default QR generator that returns a data URL image. */
export class DefaultQrCodeGenerator implements QrCodeGenerator {
    /** Generates a QR image for the provided URL. */
    async generate(url: string): Promise<string> {
        return await toDataURL(url);
    }
}

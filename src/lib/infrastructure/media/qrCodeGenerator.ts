import { toDataURL } from "qrcode";
import type { QrCodeGenerator } from "$lib/application/ports";

export class DefaultQrCodeGenerator implements QrCodeGenerator {
    async generate(url: string): Promise<string> {
        return await toDataURL(url);
    }
}

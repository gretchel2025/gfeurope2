import { ValidationError } from "$lib/application/errors";
import type { CreateBookingInput } from "$lib/domain/booking";

export async function parseCreateBookingForm(formData: FormData): Promise<CreateBookingInput> {
    const name = readRequiredString(formData, "name");
    const email = readRequiredString(formData, "email");
    const city = readRequiredString(formData, "city");
    const ticket_type = readRequiredString(formData, "ticket_type");
    const quantity = readRequiredNumber(formData, "quantity");

    const guests: string[] = [];
    for (let i = 1; i <= quantity; i += 1) {
        guests.push(readRequiredString(formData, `guest_${i}`));
    }

    return {
        name,
        email,
        city,
        ticket_type,
        quantity,
        guests,
    };
}

function readRequiredString(formData: FormData, key: string): string {
    const value = formData.get(key);
    if (typeof value !== "string" || value.trim() === "") {
        throw new ValidationError(`${key} is required`);
    }

    return value.trim();
}

function readRequiredNumber(formData: FormData, key: string): number {
    const value = readRequiredString(formData, key);
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed.toString() !== value) {
        throw new ValidationError(`${key} is not numeric`);
    }
    return parsed;
}

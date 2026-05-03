import type { Booking } from "$lib/domain/booking";
import { sortBookingsByDateDescending } from "$lib/domain/booking";
import { bookingService } from "$lib/server/http/services";

export type ServerData = {
    bookings: Booking[],
}

export async function load({}): Promise<ServerData> {
    const bookings: Booking[] = await bookingService.list();
    return {
        bookings: bookings.sort(sortBookingsByDateDescending),
    }
}

import type {Booking, CityStats} from "$lib/domain/booking";
import { bookingService, reportingService } from "$lib/server/http/services";

export type ServerData = {
    topCities: CityStats[],
}

export async function load({}): Promise<ServerData> {
    const bookings: Booking[] = await bookingService.list();
    return {
        topCities: reportingService.getTopCities(bookings),
    }
}

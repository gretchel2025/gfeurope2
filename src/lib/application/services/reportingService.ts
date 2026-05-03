import { getTopCitiesByCountOfTicketsBooked } from "$lib/domain/booking";
import type { Booking, CityStats } from "$lib/domain/booking";

export class ReportingService {
    getTopCities(bookings: Booking[]): CityStats[] {
        return getTopCitiesByCountOfTicketsBooked(bookings);
    }
}

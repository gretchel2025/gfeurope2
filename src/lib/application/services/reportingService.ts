/**
 * Purpose:
 * This service exposes reporting-oriented use cases.
 *
 * Why this structure is good:
 * Even simple reporting helpers get a stable home in the application layer,
 * which gives routes one place to call and keeps analytics logic from drifting
 * into pages or repositories.
 */
import { getTopCitiesByCountOfTicketsBooked } from "$lib/domain/booking";
import type { Booking, CityStats } from "$lib/domain/booking";

/** Thin application wrapper around reusable reporting calculations. */
export class ReportingService {
    /** Returns per-city booking totals and payment mix for reporting screens. */
    getTopCities(bookings: Booking[]): CityStats[] {
        return getTopCitiesByCountOfTicketsBooked(bookings);
    }
}

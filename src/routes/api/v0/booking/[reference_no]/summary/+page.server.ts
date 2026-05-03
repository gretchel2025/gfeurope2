import type {Booking, TicketWithQRCode} from "$lib/domain/booking";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { bookingService } from "$lib/server/http/services";

export type ServerData = {
    booking: Booking | null,
    ticketsData: TicketWithQRCode[]
}

export async function load({ params }): Promise<ServerData> {
    try {
        const booking = await bookingService.getRequiredById(params.reference_no);
        const ticketsData = await bookingService.getRelatedTicketsWithCheckinQRCode(params.reference_no);
        return {
            booking,
            ticketsData,
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

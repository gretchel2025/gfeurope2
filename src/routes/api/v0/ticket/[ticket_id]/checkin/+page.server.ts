import type {Ticket} from "$lib/domain/ticket";
import type {Booking} from "$lib/domain/booking";
import type { Actions } from './$types';
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireAdminRequest } from "$lib/server/http/guards";
import { bookingService, ticketService } from "$lib/server/http/services";

export type ServerData = {
    aTicket: Ticket,
    aBooking: Booking,
}

export async function load({ params }): Promise<ServerData> {
    try {
        const aTicket = await ticketService.getRequiredById(params.ticket_id);
        const aBooking = await bookingService.getRequiredById(aTicket.booking_reference_no);
        return {
            aTicket,
            aBooking,
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

export const actions: Actions = {
    checkIn: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await ticketService.checkIn(params.ticket_id);
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
    checkOut: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await ticketService.checkOut(params.ticket_id);
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
};

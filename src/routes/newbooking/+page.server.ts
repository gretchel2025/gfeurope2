import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { NotFoundError } from "$lib/application/errors";
import type { TicketCounter } from "$lib/domain/ticketCounter";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { parseCreateBookingForm } from "$lib/server/http/forms";
import { bookingService, ticketCounterService } from "$lib/server/http/services";

export type ServerData = {
    standardTicketCounter: TicketCounter,
    vipTicketCounter: TicketCounter,
    youthTicketCounter: TicketCounter,
}

export async function load(): Promise<ServerData> {
    try {
        const [standardTicketCounter, vipTicketCounter, youthTicketCounter] = await Promise.all([
            ticketCounterService.getStandardTickets(),
            ticketCounterService.getVipTickets(),
            ticketCounterService.getYouthTickets(),
        ]);

        if (!standardTicketCounter) throw new NotFoundError("standard ticket counter is missing");
        if (!vipTicketCounter) throw new NotFoundError("vip ticket counter is missing");
        if (!youthTicketCounter) throw new NotFoundError("youth ticket counter is missing");

        if (
            standardTicketCounter.available <= 0 &&
            vipTicketCounter.available <= 0 &&
            youthTicketCounter.available <= 0
        ) {
            throw redirect(303, "/newbooking/soldout");
        }

        return {
            standardTicketCounter,
            vipTicketCounter,
            youthTicketCounter,
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

export const actions: Actions = {
    default: async ({ request }) => {
        try {
            const formData = await request.formData();
            const input = await parseCreateBookingForm(formData);
            await bookingService.createNew(input);
            throw redirect(303, "/newbooking/success");
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    }
};

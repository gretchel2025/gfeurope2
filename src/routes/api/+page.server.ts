import type { Actions } from './$types';
import { NotFoundError } from "$lib/application/errors";
import type {TicketCounter} from "$lib/domain/ticketCounter";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireAdminRequest } from "$lib/server/http/guards";
import { ticketCounterService } from "$lib/server/http/services";


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
    add10ToAvailableStandardTickets: async (event) => {
        try {
            await requireAdminRequest(event);
            await ticketCounterService.incrementStandardTickets({ available: 10, reserved: 0, sold: 0 });
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
    add10ToAvailableVIPTickets: async (event) => {
        try {
            await requireAdminRequest(event);
            await ticketCounterService.incrementVipTickets({ available: 10, reserved: 0, sold: 0 });
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
    add10ToAvailableYouthTickets: async (event) => {
        try {
            await requireAdminRequest(event);
            await ticketCounterService.incrementYouthTickets({ available: 10, reserved: 0, sold: 0 });
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
};

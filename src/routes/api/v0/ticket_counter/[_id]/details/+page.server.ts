import type { Actions } from './$types';
import { NotFoundError } from "$lib/application/errors";
import type {TicketCounter} from "$lib/domain/ticketCounter";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireAdminRequest } from "$lib/server/http/guards";
import { ticketCounterService } from "$lib/server/http/services";


export type ServerData = {
    ticketCounter: TicketCounter,
}

export async function load({ params }): Promise<ServerData> {
    try {
        const ticketCounter = await ticketCounterService.getById(params._id);
        if (!ticketCounter) {
            throw new NotFoundError("ticket counter does not exist");
        }

        return {
            ticketCounter,
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

export const actions: Actions = {
    incrementAvailableCount: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await ticketCounterService.incrementTickets(params._id, { available: 10, reserved: 0, sold: 0 });
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
};

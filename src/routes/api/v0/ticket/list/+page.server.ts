import type { Ticket } from "$lib/domain/ticket";
import { ticketService } from "$lib/server/http/services";

export type ServerData = {
    tickets: Ticket[],
}

export async function load({}) {
    return {
        tickets: await ticketService.getAll(),
    }
}

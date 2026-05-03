import type { Ticket, QRCode } from "$lib/domain/ticket";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { ticketService } from "$lib/server/http/services";

export type ServerData = {
    aTicket: Ticket,
    checkin: QRCode,
}

export async function load({ params }): Promise<ServerData> {
    try {
        const aTicket = await ticketService.getRequiredById(params.ticket_id);
        const qrCode = await ticketService.getCheckinQRCode(aTicket.ticket_id, aTicket.booking_reference_no);
        return {
            aTicket,
            checkin: qrCode,
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

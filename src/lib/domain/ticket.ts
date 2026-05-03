import type { Booking } from "$lib/domain/booking";
import { BookingPaymentStatus, TicketStatus, TicketType } from "$lib/domain/shared/enums";

export type Ticket = {
    ticket_id: string;
    name: string;
    ticket_type: TicketType;
    description: string;
    status: TicketStatus;
    is_paid: boolean;
    booking_reference_no: string;
    checkin_qr_code_image_url: string;
};

export type QRCode = {
    imageData: string;
    targetURL: string;
};

export type CreateTicketInput = {
    name: string;
    ticket_type: string;
    description: string;
    booking_reference_no: string;
    is_paid: boolean;
};

export function canCheckInTicket(booking: Booking, ticket: Ticket): boolean {
    return booking.payment_status === BookingPaymentStatus.PAID && ticket.status !== TicketStatus.CHECKED_IN;
}

export function canCheckOutTicket(booking: Booking, ticket: Ticket): boolean {
    return booking.payment_status === BookingPaymentStatus.PAID && ticket.status === TicketStatus.CHECKED_IN;
}

export function normalizeTicketType(input: string): TicketType {
    const standardizedInput = input ? input.toUpperCase() : "";

    switch (standardizedInput) {
        case TicketType.STANDARD:
            return TicketType.STANDARD;
        case TicketType.VIP:
            return TicketType.VIP;
        case TicketType.YOUTH:
            return TicketType.YOUTH;
        default:
            return TicketType.STANDARD;
    }
}

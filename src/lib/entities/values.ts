// Possible values of TicketPrice
import type {Booking, Ticket} from "$lib/entities/models";
import {error} from "@sveltejs/kit";

export enum TicketPrice {
    STANDARD= 35.0,
    VIP= 55.0,
    YOUTH= 15.0
}

// Possible values of Booking.PaymentStatus
export enum BookingPaymentStatus {
    UNPAID= "UNPAID",
    PAID = "PAID",
    BOOKING_RESERVATION_CANCELLED = "BOOKING_RESERVATION_CANCELLED"
}

// Possible values of Ticket.Status
export enum TicketStatus {
    CREATED= "CREATED",
    CHECKED_IN= "CHECKED_IN",
    CHECKED_OUT= "CHECKED_OUT"
}

// Possible values of TicketType (used in Booking and Ticket models)
export enum TicketType {
    STANDARD= "STANDARD",
    VIP= "VIP",
    YOUTH= "YOUTH"
}

// ***************************
// below are conversion functions
// ***************************

// export function convertBookingPaymentStatus(input: string): BookingPaymentStatus {
//     const standardizedInput = input ? input.toUpperCase() : ""
//
//     switch (standardizedInput){
//         case "PAID" :
//             return BookingPaymentStatus.PAID
//         case "UNPAID":
//             return BookingPaymentStatus.UNPAID
//         default:
//             // default unknown value
//             return BookingPaymentStatus.UNPAID
//     }
// }

export function ConvertTicketType(input: string): TicketType {
    // this helps guard against 'old' field name
    const standardizedInput = input ? input.toUpperCase() : ""

    switch (standardizedInput){
        case "STANDARD" :
            return TicketType.STANDARD
        case "VIP":
            return TicketType.VIP
        case "YOUTH":
            return TicketType.YOUTH
        default:
            // default unknown value
            return TicketType.STANDARD
    }
}

// export function convertTicketStatus(input: string): TicketStatus {
//     // this helps guard against 'old' field name
//     const standardizedInput = input ? input.toUpperCase() : ""
//
//     switch (standardizedInput) {
//         case "CREATED":
//             return TicketStatus.CREATED
//         default:
//             // default status is CREATED
//             return TicketStatus.CREATED
//     }
// }

// TicketCanCheckIn validates the state of the given Booking and Ticket, and returns true if the ticket can be checked in.
export function TicketCanCheckIn(aBooking: Booking, aTicket:Ticket) :boolean{
    const isPaid = aBooking.payment_status === BookingPaymentStatus.PAID
    const isCheckedIn = aTicket.status === TicketStatus.CHECKED_IN

    return isPaid && !isCheckedIn
}

// TicketCanCheckOut validates the state of the given Booking and Ticket, and returns true if the ticket can be checked out.
export function TicketCanCheckOut(aBooking: Booking, aTicket:Ticket) :boolean{
    const isPaid = aBooking.payment_status === BookingPaymentStatus.PAID
    const isCheckedIn = aTicket.status === TicketStatus.CHECKED_IN

    return isPaid && isCheckedIn
}

export function BookingCanBeCancelled(booking: Booking): boolean {
    if (booking.payment_status == BookingPaymentStatus.UNPAID) {
        return true
    }

    return false
}

export function BookingCanBeMarkedAsPaid(booking: Booking): boolean {
    const isUnpaid = booking.payment_status === BookingPaymentStatus.UNPAID
    if (isUnpaid) {
        return true
    }

    return false
}

export function BookingCanGenerateTickets(booking: Booking): boolean {
    const isPaid = booking.payment_status === BookingPaymentStatus.PAID

    const allTicketsWereGenerated = booking.ticket_ids.length >= booking.guests.length
    const canGenerateTickets = isPaid && !allTicketsWereGenerated

    return canGenerateTickets
}
/**
 * Purpose:
 * This file contains shared domain enums and constant values.
 *
 * Why this structure is good:
 * Shared business constants are easier to keep consistent when they live in a
 * single domain-focused module instead of being duplicated across routes,
 * repositories, and services.
 */
/** Ticket pricing constants in EUR. */
export enum TicketPrice {
    STANDARD = 35.0,
    VIP = 55.0,
    YOUTH = 15.0,
}

/** The states a booking's payment lifecycle can be in. */
export enum BookingPaymentStatus {
    UNPAID = "UNPAID",
    PAID = "PAID",
    BOOKING_RESERVATION_CANCELLED = "BOOKING_RESERVATION_CANCELLED",
}

/** The states a ticket can move through during event operations. */
export enum TicketStatus {
    CREATED = "CREATED",
    CHECKED_IN = "CHECKED_IN",
    CHECKED_OUT = "CHECKED_OUT",
}

/** Supported ticket classes sold by the application. */
export enum TicketType {
    STANDARD = "STANDARD",
    VIP = "VIP",
    YOUTH = "YOUTH",
}

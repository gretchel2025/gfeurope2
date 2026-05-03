import type { QRCode, Ticket } from "$lib/domain/ticket";
import { BookingPaymentStatus, TicketPrice, TicketType } from "$lib/domain/shared/enums";

export type Booking = {
    reference_no: string;
    name: string;
    email: string;
    city: string;
    ticket_type: TicketType;
    book_date: string;
    payment_status: BookingPaymentStatus;
    amount_total: number;
    guests: string[];
    ticket_ids: string[];
};

export type CreateBookingInput = {
    name: string;
    email: string;
    city: string;
    ticket_type: string;
    quantity: number;
    guests: string[];
};

export type TicketWithQRCode = {
    ticket: Ticket;
    qrCodeData: QRCode;
};

export type CityStats = {
    cityName: string;
    totalBookings: number;
    totalPaidBookings: number;
    totalUnpaidBookings: number;
    percentOfPaidBookings: number;
    percentOfThisCitysBookingsOverAllBookings: number;
};

export function canCancelBooking(booking: Booking): boolean {
    return booking.payment_status === BookingPaymentStatus.UNPAID;
}

export function canMarkBookingPaid(booking: Booking): boolean {
    return booking.payment_status === BookingPaymentStatus.UNPAID;
}

export function canGenerateTickets(booking: Booking): boolean {
    const isPaid = booking.payment_status === BookingPaymentStatus.PAID;
    const allTicketsGenerated = booking.ticket_ids.length >= booking.guests.length;

    return isPaid && !allTicketsGenerated;
}

export function computeTotalAmountDue(ticketType: TicketType, quantity: number): number {
    switch (ticketType) {
        case TicketType.VIP:
            return TicketPrice.VIP * quantity;
        case TicketType.YOUTH:
            return TicketPrice.YOUTH * quantity;
        case TicketType.STANDARD:
        default:
            return TicketPrice.STANDARD * quantity;
    }
}

export function sortBookingsByDateDescending(a: Booking, b: Booking): number {
    return Date.parse(b.book_date) - Date.parse(a.book_date);
}

export function getTopCitiesByCountOfTicketsBooked(bookings: Booking[]): CityStats[] {
    const cities: CityStats[] = bookings.reduce((accum: CityStats[], booking: Booking) => {
        let cityName = booking.city.toLowerCase();

        if (cityName === "belrin") {
            cityName = "berlin";
        }
        if (cityName === "no" || cityName === "none") {
            cityName = "none";
        }
        if (cityName === "bruxelles" || cityName === "feast brussels") {
            cityName = "brussels";
        }

        let cityIndex = accum.findIndex((city) => city.cityName === cityName);
        if (cityIndex === -1) {
            accum.push({
                cityName,
                totalBookings: 0,
                totalPaidBookings: 0,
                totalUnpaidBookings: 0,
                percentOfPaidBookings: 0,
                percentOfThisCitysBookingsOverAllBookings: 0,
            });
            cityIndex = accum.length - 1;
        }

        const ticketsBooked = booking.guests.length;
        accum[cityIndex].totalBookings += ticketsBooked;

        switch (booking.payment_status) {
            case BookingPaymentStatus.PAID:
                accum[cityIndex].totalPaidBookings += ticketsBooked;
                break;
            case BookingPaymentStatus.UNPAID:
                accum[cityIndex].totalUnpaidBookings += ticketsBooked;
                break;
            default:
                accum[cityIndex].totalPaidBookings += ticketsBooked;
                break;
        }

        return accum;
    }, []);

    const totalBookingsCount = cities.reduce((accum, city) => accum + city.totalBookings, 0);
    return cities
        .map((city) => ({
            ...city,
            percentOfPaidBookings: city.totalBookings > 0 ? city.totalPaidBookings / city.totalBookings : 0,
            percentOfThisCitysBookingsOverAllBookings:
                totalBookingsCount > 0 ? city.totalBookings / totalBookingsCount : 0,
        }))
        .sort((a, b) => b.totalBookings - a.totalBookings);
}

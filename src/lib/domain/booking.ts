/**
 * Purpose:
 * This file defines booking-centric domain types and rules.
 *
 * Why this structure is good:
 * The domain layer is where business vocabulary should live. Keeping booking
 * rules here makes them reusable across routes, services, and future tests
 * without pulling in framework or persistence concerns.
 */
import type { QRCode, Ticket } from '$lib/domain/ticket';
import { BookingPaymentStatus, TicketType } from '$lib/domain/shared/enums';

/** Canonical booking shape used by the application layer. */
export type Booking = {
	event_id: string;
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
	tickets_sent_to_client: boolean;
	payment_proof_url?: string;
};

/** Input required to create a booking before defaults and ids are added. */
export type CreateBookingInput = {
	event_id: string;
	name: string;
	email: string;
	city: string;
	ticket_type: string;
	quantity: number;
	guests: string[];
	payment_proof_url?: string;
};

/** Helper shape for admin/email views that need both ticket data and QR code data. */
export type TicketWithQRCode = {
	ticket: Ticket;
	qrCodeData: QRCode;
};

/** Reporting aggregate describing booking volume for a city. */
export type CityStats = {
	cityName: string;
	totalBookings: number;
	totalPaidBookings: number;
	totalUnpaidBookings: number;
	percentOfPaidBookings: number;
	percentOfThisCitysBookingsOverAllBookings: number;
};

/** Whether an unpaid booking may still be cancelled. */
export function canCancelBooking(booking: Booking): boolean {
	return booking.payment_status === BookingPaymentStatus.UNPAID;
}

/** Whether a booking is allowed to transition into the paid state. */
export function canMarkBookingPaid(booking: Booking): boolean {
	return booking.payment_status === BookingPaymentStatus.UNPAID;
}

/** Whether a paid booking still needs tickets generated for its guests. */
export function canGenerateTickets(booking: Booking): boolean {
	const isPaid = booking.payment_status === BookingPaymentStatus.PAID;
	const allTicketsGenerated = booking.ticket_ids.length >= booking.guests.length;

	return isPaid && !allTicketsGenerated;
}

/** Sort helper used by admin screens to show newest bookings first. */
export function sortBookingsByDateDescending(a: Booking, b: Booking): number {
	return Date.parse(b.book_date) - Date.parse(a.book_date);
}

/**
 * Aggregates bookings into per-city statistics.
 * The small normalization rules here capture existing business cleanup for city names.
 */
export function getTopCitiesByCountOfTicketsBooked(bookings: Booking[]): CityStats[] {
	const cities: CityStats[] = bookings.reduce((accum: CityStats[], booking: Booking) => {
		let cityName = booking.city.toLowerCase();

		if (cityName === 'belrin') {
			cityName = 'berlin';
		}
		if (cityName === 'no' || cityName === 'none') {
			cityName = 'none';
		}
		if (cityName === 'bruxelles' || cityName === 'feast brussels') {
			cityName = 'brussels';
		}

		let cityIndex = accum.findIndex((city) => city.cityName === cityName);
		if (cityIndex === -1) {
			accum.push({
				cityName,
				totalBookings: 0,
				totalPaidBookings: 0,
				totalUnpaidBookings: 0,
				percentOfPaidBookings: 0,
				percentOfThisCitysBookingsOverAllBookings: 0
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
			percentOfPaidBookings:
				city.totalBookings > 0 ? city.totalPaidBookings / city.totalBookings : 0,
			percentOfThisCitysBookingsOverAllBookings:
				totalBookingsCount > 0 ? city.totalBookings / totalBookingsCount : 0
		}))
		.sort((a, b) => b.totalBookings - a.totalBookings);
}

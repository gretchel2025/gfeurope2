/**
 * Purpose:
 * This service exposes reporting-oriented use cases.
 *
 * Why this structure is good:
 * Even simple reporting helpers get a stable home in the application layer,
 * which gives routes one place to call and keeps analytics logic from drifting
 * into pages or repositories.
 */
import { getTopCitiesByCountOfTicketsBooked } from '$lib/domain/booking';
import type { Booking, CityStats } from '$lib/domain/booking';
import { BookingPaymentStatus, formatTicketTypeLabel } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';

export type CityTicketSalesReport = {
	cityName: string;
	ticketsSold: number;
	paidBookings: number;
	amountPaid: number;
	percentOfPaidTickets: number;
};

export type CityTicketSalesExportRow = CityTicketSalesReport & {
	rank: number | '';
	isGrandTotal: boolean;
};

export type UnpaidBookingsByCityReport = {
	cityName: string;
	unpaidBookings: number;
	unpaidTickets: number;
	amountPending: number;
	referenceNumbers: string[];
};

export type GeneratedTicketReportRow = {
	rowNumber: number;
	ticketId: string;
	guestName: string;
	ticketType: string;
	status: string;
	paid: 'Yes' | 'No';
	bookingReferenceNo: string;
	cityName: string;
};

/** Thin application wrapper around reusable reporting calculations. */
export class ReportingService {
	/** Returns per-city booking totals and payment mix for reporting screens. */
	getTopCities(bookings: Booking[]): CityStats[] {
		return getTopCitiesByCountOfTicketsBooked(bookings);
	}

	/** Returns paid ticket sales grouped by buyer city. */
	getTopTicketSalesByCity(bookings: Booking[]): CityTicketSalesReport[] {
		return getTopTicketSalesByCity(bookings);
	}

	/** Returns unpaid booking follow-up data grouped by buyer city. */
	getUnpaidBookingsByCity(bookings: Booking[]): UnpaidBookingsByCityReport[] {
		return getUnpaidBookingsByCity(bookings);
	}

	/** Returns city sales rows with an appended grand total for spreadsheet export. */
	getCityTicketSalesExportRows(bookings: Booking[]): CityTicketSalesExportRow[] {
		return getCityTicketSalesExportRows(bookings);
	}

	/** Returns generated ticket rows joined to booking city for registration exports. */
	getGeneratedTicketReportRows(tickets: Ticket[], bookings: Booking[]): GeneratedTicketReportRow[] {
		return getGeneratedTicketReportRows(tickets, bookings);
	}
}

export function getTopTicketSalesByCity(bookings: Booking[]): CityTicketSalesReport[] {
	const paidBookings = bookings.filter(
		(booking) => booking.payment_status === BookingPaymentStatus.PAID
	);
	const totalPaidTickets = paidBookings.reduce((sum, booking) => sum + booking.guests.length, 0);
	const byCity = new Map<string, CityTicketSalesReport>();

	for (const booking of paidBookings) {
		const cityName = normalizeCityName(booking.city);
		const current = byCity.get(cityName) ?? {
			cityName,
			ticketsSold: 0,
			paidBookings: 0,
			amountPaid: 0,
			percentOfPaidTickets: 0
		};

		current.ticketsSold += booking.guests.length;
		current.paidBookings += 1;
		current.amountPaid += booking.amount_total;
		byCity.set(cityName, current);
	}

	return [...byCity.values()]
		.map((city) => ({
			...city,
			amountPaid: roundMoney(city.amountPaid),
			percentOfPaidTickets: totalPaidTickets > 0 ? city.ticketsSold / totalPaidTickets : 0
		}))
		.sort((a, b) => b.ticketsSold - a.ticketsSold || b.amountPaid - a.amountPaid);
}

export function getCityTicketSalesExportRows(bookings: Booking[]): CityTicketSalesExportRow[] {
	const cityRows = getTopTicketSalesByCity(bookings).map((city, index) => ({
		...city,
		rank: index + 1,
		isGrandTotal: false
	}));
	const grandTotal = cityRows.reduce(
		(total, city) => ({
			ticketsSold: total.ticketsSold + city.ticketsSold,
			paidBookings: total.paidBookings + city.paidBookings,
			amountPaid: total.amountPaid + city.amountPaid
		}),
		{ ticketsSold: 0, paidBookings: 0, amountPaid: 0 }
	);

	return [
		...cityRows,
		{
			rank: '',
			cityName: 'Grand total',
			ticketsSold: grandTotal.ticketsSold,
			paidBookings: grandTotal.paidBookings,
			amountPaid: roundMoney(grandTotal.amountPaid),
			percentOfPaidTickets: grandTotal.ticketsSold > 0 ? 1 : 0,
			isGrandTotal: true
		}
	];
}

export function getUnpaidBookingsByCity(bookings: Booking[]): UnpaidBookingsByCityReport[] {
	const byCity = new Map<string, UnpaidBookingsByCityReport>();

	for (const booking of bookings) {
		if (booking.payment_status !== BookingPaymentStatus.UNPAID) {
			continue;
		}

		const cityName = normalizeCityName(booking.city);
		const current = byCity.get(cityName) ?? {
			cityName,
			unpaidBookings: 0,
			unpaidTickets: 0,
			amountPending: 0,
			referenceNumbers: []
		};

		current.unpaidBookings += 1;
		current.unpaidTickets += booking.guests.length;
		current.amountPending += booking.amount_total;
		current.referenceNumbers.push(booking.reference_no);
		byCity.set(cityName, current);
	}

	return [...byCity.values()]
		.map((city) => ({
			...city,
			amountPending: roundMoney(city.amountPending),
			referenceNumbers: city.referenceNumbers.sort()
		}))
		.sort(
			(a, b) =>
				b.unpaidTickets - a.unpaidTickets ||
				b.unpaidBookings - a.unpaidBookings ||
				b.amountPending - a.amountPending
		);
}

export function getGeneratedTicketReportRows(
	tickets: Ticket[],
	bookings: Booking[]
): GeneratedTicketReportRow[] {
	const bookingsByReference = new Map(bookings.map((booking) => [booking.reference_no, booking]));

	return tickets
		.map((ticket) => {
			const booking = bookingsByReference.get(ticket.booking_reference_no);
			return {
				rowNumber: 0,
				ticketId: ticket.ticket_id,
				guestName: ticket.name,
				ticketType: formatTicketTypeLabel(ticket.ticket_type),
				status: ticket.status,
				paid: ticket.is_paid ? 'Yes' : 'No',
				bookingReferenceNo: ticket.booking_reference_no,
				cityName: normalizeCityName(booking?.city ?? '')
			} satisfies GeneratedTicketReportRow;
		})
		.sort(
			(a, b) =>
				a.guestName.localeCompare(b.guestName, undefined, { sensitivity: 'base' }) ||
				a.ticketId.localeCompare(b.ticketId)
		)
		.map((row, index) => ({
			...row,
			rowNumber: index + 1
		}));
}

function normalizeCityName(city: string): string {
	const normalized = city.trim().replace(/\s+/g, ' ').toLowerCase();

	if (normalized === 'belrin') {
		return 'Berlin';
	}
	if (normalized === 'no' || normalized === 'none' || normalized === '') {
		return 'Unspecified';
	}
	if (normalized === 'bruxelles' || normalized === 'feast brussels') {
		return 'Brussels';
	}

	return normalized
		.split(', ')
		.map((part) => titleCase(part))
		.join(', ');
}

function titleCase(value: string): string {
	return value
		.split(' ')
		.map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : word))
		.join(' ');
}

function roundMoney(amount: number): number {
	return Math.round(amount * 100) / 100;
}

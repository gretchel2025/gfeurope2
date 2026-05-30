import type { Booking } from '$lib/domain/booking';
import { BookingPaymentStatus } from '$lib/domain/shared/enums';
import { bookingService } from '$lib/server/http/services';

export type ServerData = {
	topTicketSalesByCity: CityTicketSalesReport[];
	unpaidBookingsByCity: UnpaidBookingsByCityReport[];
};

type CityTicketSalesReport = {
	cityName: string;
	ticketsSold: number;
	paidBookings: number;
	amountPaid: number;
	percentOfPaidTickets: number;
};

type UnpaidBookingsByCityReport = {
	cityName: string;
	unpaidBookings: number;
	unpaidTickets: number;
	amountPending: number;
	referenceNumbers: string[];
};

export async function load({}): Promise<ServerData> {
	const bookings = (await bookingService.list()) as Booking[];

	return {
		topTicketSalesByCity: getTopTicketSalesByCity(bookings),
		unpaidBookingsByCity: getUnpaidBookingsByCity(bookings)
	};
}

function getTopTicketSalesByCity(bookings: Booking[]): CityTicketSalesReport[] {
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

function getUnpaidBookingsByCity(bookings: Booking[]): UnpaidBookingsByCityReport[] {
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

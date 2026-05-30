import type { Booking, CityStats } from '$lib/domain/booking';
import type { TicketCounter } from '$lib/domain/ticketCounter';
import { bookingService, reportingService, ticketCounterService } from '$lib/server/http/services';

export type ServerData = {
	topCities: CityStats[];
	ticketStateCharts: TicketStateChart[];
};

type TicketStateChart = {
	title: string;
	segments: TicketStateSegment[];
	total: number;
};

type TicketStateSegment = {
	label: string;
	value: number;
	colorClass: string;
};

export async function load({}): Promise<ServerData> {
	const [bookings, standardTicketCounter, grandFeastPlusTicketCounter] = await Promise.all([
		bookingService.list(),
		ticketCounterService.getStandardTickets(),
		ticketCounterService.getGrandFeastPlusTickets()
	]);

	return {
		topCities: reportingService.getTopCities(bookings as Booking[]),
		ticketStateCharts: [
			createTicketStateChart('Standard Tickets', standardTicketCounter),
			createTicketStateChart('GrandFeast Plus Tickets', grandFeastPlusTicketCounter)
		]
	};
}

function createTicketStateChart(title: string, counter: TicketCounter | null): TicketStateChart {
	const safeCounter = {
		available: counter?.available ?? 0,
		reserved: counter?.reserved ?? 0,
		sold: counter?.sold ?? 0
	};

	return {
		title,
		total: safeCounter.available + safeCounter.reserved + safeCounter.sold,
		segments: [
			{
				label: 'Available',
				value: safeCounter.available,
				colorClass: 'text-emerald-500'
			},
			{
				label: 'Reserved',
				value: safeCounter.reserved,
				colorClass: 'text-amber-400'
			},
			{
				label: 'Paid',
				value: safeCounter.sold,
				colorClass: 'text-blue-600'
			}
		]
	};
}

/**
 * Purpose:
 * This file names the admin and public routes used across the UI/server layer.
 *
 * Why this structure is good:
 * Central route builders prevent fragile hand-written URL strings from being
 * copied into every feature. When a route moves, Codex has one obvious place to edit.
 */
const encodeSegment = (value: string): string => encodeURIComponent(value);

/** Admin app route builders. */
export const adminRoutes = {
	home: '/api',
	reports: '/api/reports',
	system: '/api/system',
	booking: {
		list: '/api/v0/booking/list',
		search: (referenceNo?: string): string => {
			if (!referenceNo) return '/api/v0/booking/search';
			return `/api/v0/booking/search?reference_no=${encodeURIComponent(referenceNo)}`;
		},
		details: (referenceNo: string): string =>
			`/api/v0/booking/${encodeSegment(referenceNo)}/details`,
		summary: (referenceNo: string): string =>
			`/api/v0/booking/${encodeSegment(referenceNo)}/summary`,
		cancel: (referenceNo: string): string => `/api/v0/booking/${encodeSegment(referenceNo)}/cancel`,
		cancelSuccess: (referenceNo: string): string =>
			`/api/v0/booking/${encodeSegment(referenceNo)}/cancel/cancel_success`,
		emailSuccess: (referenceNo: string): string =>
			`/api/v0/booking/${encodeSegment(referenceNo)}/details/email_success`
	},
	ticket: {
		list: '/api/v0/ticket/list',
		details: (ticketId: string): string => `/api/v0/ticket/${encodeSegment(ticketId)}/details`,
		checkin: (ticketId: string): string => `/api/v0/ticket/${encodeSegment(ticketId)}/checkin`
	},
	ticketCounter: {
		details: (counterId: string): string =>
			`/api/v0/ticket_counter/${encodeSegment(counterId)}/details`
	}
};

/** Public route builders. */
export const publicRoutes = {
	signin: '/signin',
	newBooking: '/newbooking',
	newBookingSoldOut: '/newbooking/soldout',
	newBookingSuccess: '/newbooking/success'
};

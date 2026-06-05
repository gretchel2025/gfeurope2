/**
 * Purpose:
 * This file names the public, admin, and global routes used across the UI/server layer.
 *
 * Why this structure is good:
 * Central event-aware route builders prevent fragile hand-written URL strings from being
 * copied into every feature. When event routing changes, Codex has one obvious place to edit.
 */
const encodeSegment = (value: string): string => encodeURIComponent(value);

export const globalRoutes = {
	signin: '/signin',
	authCallback: '/auth/callback',
	unauthorized: '/unauthorized'
};

export function publicRoutes(eventId: string) {
	const eventBase = `/events/${encodeSegment(eventId)}`;
	return {
		home: eventBase,
		newBooking: `${eventBase}/newbooking`,
		newBookingSoldOut: `${eventBase}/newbooking/soldout`,
		newBookingSuccess: `${eventBase}/newbooking/success`,
		conditions: `${eventBase}/conditions`,
		privacy: `${eventBase}/privacy`,
		faq: `${eventBase}/faq`
	};
}

export function adminRoutes(eventId: string) {
	const adminBase = `/admin/events/${encodeSegment(eventId)}`;
	return {
		home: adminBase,
		reports: `${adminBase}/reports`,
		system: `${adminBase}/system`,
		booking: {
			list: `${adminBase}/bookings`,
			search: (referenceNo?: string): string => {
				if (!referenceNo) return `${adminBase}/bookings/search`;
				return `${adminBase}/bookings/search?reference_no=${encodeURIComponent(referenceNo)}`;
			},
			details: (referenceNo: string): string =>
				`${adminBase}/bookings/${encodeSegment(referenceNo)}`,
			summary: (referenceNo: string): string =>
				`${adminBase}/bookings/${encodeSegment(referenceNo)}/summary`,
			cancel: (referenceNo: string): string =>
				`${adminBase}/bookings/${encodeSegment(referenceNo)}/cancel`,
			cancelSuccess: (referenceNo: string): string =>
				`${adminBase}/bookings/${encodeSegment(referenceNo)}/cancel/success`,
			emailSuccess: (referenceNo: string): string =>
				`${adminBase}/bookings/${encodeSegment(referenceNo)}/email-success`
		},
		ticket: {
			list: `${adminBase}/tickets`,
			details: (ticketId: string): string => `${adminBase}/tickets/${encodeSegment(ticketId)}`,
			checkin: (ticketId: string): string =>
				`${adminBase}/tickets/${encodeSegment(ticketId)}/checkin`
		},
		ticketCounter: {
			details: (counterId: string): string => `${adminBase}/counters/${encodeSegment(counterId)}`
		}
	};
}

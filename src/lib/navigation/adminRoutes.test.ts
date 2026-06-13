import { describe, expect, it } from 'vitest';
import { adminIndexRoute, adminRoutes, globalAdminRoutes, publicRoutes } from './adminRoutes';

describe('event route builders', () => {
	it.each(['gfeu2025', 'gfeu2026'])('builds public event routes for %s', (eventId) => {
		const routes = publicRoutes(eventId);

		expect(routes.home).toBe(`/events/${eventId}`);
		expect(routes.newBooking).toBe(`/events/${eventId}/newbooking`);
		expect(routes.shop).toBe(`/events/${eventId}/shop`);
		expect(routes.shopSuccess('MR-123')).toBe(
			`/events/${eventId}/shop/success?reservation_id=MR-123`
		);
		expect(routes.privacy).toBe(`/events/${eventId}/privacy`);
		expect(routes.conditions).toBe(`/events/${eventId}/conditions`);
		expect(routes.faq).toBe(`/events/${eventId}/faq`);
	});

	it.each(['gfeu2025', 'gfeu2026'])('builds admin event routes for %s', (eventId) => {
		const routes = adminRoutes(eventId);

		expect(routes.home).toBe(`/admin/events/${eventId}`);
		expect(routes.audit).toBe(`/admin/events/${eventId}/audit`);
		expect(routes.merchandise).toBe(`/admin/events/${eventId}/merchandise`);
		expect(routes.merchandiseNew).toBe(`/admin/events/${eventId}/merchandise/new`);
		expect(routes.merchandiseProduct('MP-123')).toBe(`/admin/events/${eventId}/merchandise/MP-123`);
		expect(routes.booking.list).toBe(`/admin/events/${eventId}/bookings`);
		expect(routes.booking.details('B123')).toBe(`/admin/events/${eventId}/bookings/B123`);
		expect(routes.ticket.details('T123')).toBe(`/admin/events/${eventId}/tickets/T123`);
		expect(routes.ticket.checkin('T123')).toBe(`/admin/events/${eventId}/tickets/T123/checkin`);
		expect(routes.ticketCounter.details('STANDARD')).toBe(
			`/admin/events/${eventId}/counters/STANDARD`
		);
	});

	it('builds admin directory and global admin routes', () => {
		expect(adminIndexRoute).toBe('/admin');
		expect(globalAdminRoutes.home).toBe('/admin/global');
		expect(globalAdminRoutes.events).toBe('/admin/global/events');
		expect(globalAdminRoutes.users).toBe('/admin/global/users');
	});
});

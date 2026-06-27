import { describe, expect, it } from 'vitest';
import type { Event } from '$lib/domain/event';
import { getPublicEventPage, groupEventsByYear, isPublicBookingOpen } from '$lib/publicEvents';

function makeEvent(event_id: string, datetime: string, title = event_id): Event {
	return {
		event_id,
		title,
		short_description: `${title} description`,
		country: 'Ireland',
		venue: 'Test venue',
		datetime,
		timezone: 'Europe/Dublin',
		theme_main_color: '#005B72',
		theme_sub_color: '#E7F6F9',
		theme_highlight_color: '#D99A32',
		theme_on_main_color: '#FFFFFF'
	};
}

describe('public event registry', () => {
	it('selects configured public event pages and rejects unknown event pages', () => {
		expect(getPublicEventPage('gfeu2026')).toEqual(
			expect.objectContaining({ component: 'gfeu2026', showBuyTickets: true })
		);
		expect(getPublicEventPage('gfeu2025')).toEqual(
			expect.objectContaining({ component: 'gfeu2025', status: 'archived' })
		);
		expect(getPublicEventPage('jewels2026')).toEqual(
			expect.objectContaining({
				component: 'jewels2026',
				headerTitle: 'Europe and UK\nJEWELS Conference 2026',
				showBuyTickets: true,
				status: 'active'
			})
		);
		expect(getPublicEventPage('unknown')).toBeNull();
	});

	it('keeps archived booking routes closed while active event booking routes are open', () => {
		expect(isPublicBookingOpen('gfeu2026')).toBe(true);
		expect(isPublicBookingOpen('gfeu2025')).toBe(false);
		expect(isPublicBookingOpen('jewels2026')).toBe(true);
	});

	it('uses the Jewels public menu labels with a booking link', () => {
		expect(getPublicEventPage('jewels2026')?.navLinks).toEqual([
			{ label: 'Home', target: 'home' },
			{ label: 'Speakers', target: 'speakers' },
			{ label: 'Details', target: 'details' },
			{ label: 'Buy Tickets', target: 'newBooking', variant: 'button' }
		]);
	});

	it('groups years newest-first and events date-ascending within each year', () => {
		expect(
			groupEventsByYear([
				makeEvent('gfeu2025', '2025-09-20T11:00:00.000Z', 'Called To More'),
				makeEvent('gfeu2026', '2026-10-03T11:00:00.000Z', 'Together 2026'),
				makeEvent('jewels2026', '2026-10-31T11:00:00.000Z', 'Jewels 2026')
			])
		).toEqual([
			{
				year: 2026,
				events: [
					expect.objectContaining({ event_id: 'gfeu2026' }),
					expect.objectContaining({ event_id: 'jewels2026' })
				]
			},
			{
				year: 2025,
				events: [expect.objectContaining({ event_id: 'gfeu2025' })]
			}
		]);
	});
});

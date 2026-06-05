import { describe, expect, it } from 'vitest';
import type { Event } from '$lib/domain/event';
import { canAccessGlobalAdmin, getAccessibleAdminEvents } from './adminDirectory';

const events = [makeEvent('gfeu2026', 'Together 2026'), makeEvent('gfeu2025', 'Called To More')];

describe('admin directory access', () => {
	it('lists only the event granted to a single-event admin', () => {
		expect(getAccessibleAdminEvents(events, [], { gfeu2026: ['admin'] })).toEqual([events[0]]);
	});

	it('lists every explicitly granted event for a multi-event admin', () => {
		expect(
			getAccessibleAdminEvents(events, [], { gfeu2025: ['admin'], gfeu2026: ['admin'] })
		).toEqual(events);
	});

	it('lists all events and global admin for superusers', () => {
		expect(getAccessibleAdminEvents(events, ['superuser'], {})).toEqual(events);
		expect(canAccessGlobalAdmin(['superuser'])).toBe(true);
	});

	it('does not list event routes for global admins without event grants', () => {
		expect(getAccessibleAdminEvents(events, ['admin'], {})).toEqual([]);
		expect(canAccessGlobalAdmin(['admin'])).toBe(false);
	});
});

function makeEvent(eventId: string, title: string): Event {
	return {
		event_id: eventId,
		title,
		short_description: title,
		country: 'Ireland',
		venue: 'Venue',
		datetime: '2026-10-03T11:00:00.000Z',
		timezone: 'Europe/Dublin',
		theme_main_color: '#005B72',
		theme_sub_color: '#E7F6F9',
		theme_highlight_color: '#D99A32',
		theme_on_main_color: '#FFFFFF'
	};
}

import type { Event } from '$lib/domain/event';
import { jewelsEventDisplayTitle } from '$lib/domain/eventDisplay';

export type PublicEventPageId = 'gfeu2025' | 'gfeu2026' | 'jewels2026';
export type PublicEventStatus = 'active' | 'archived';
export type PublicEventShellVariant = 'grand-feast' | 'jewels';
export type PublicEventNavTarget =
	| 'home'
	| 'speakers'
	| 'message'
	| 'theme'
	| 'details'
	| 'shop'
	| 'tickets'
	| 'newBooking';

export type PublicEventNavLink = {
	label: string;
	target: PublicEventNavTarget;
	variant?: 'link' | 'button';
};

export type PublicEventPageConfig = {
	eventId: PublicEventPageId;
	status: PublicEventStatus;
	component: PublicEventPageId;
	shellVariant?: PublicEventShellVariant;
	headerKicker?: string;
	headerTitle: string;
	footerKicker: string;
	footerTitle: string;
	footerCopyrightYear: number;
	footerCopyrightName?: string;
	showBuyTickets: boolean;
	navLinks?: PublicEventNavLink[];
};

export type EventYearGroup = {
	year: number;
	events: Event[];
};

const publicEventPages: Record<PublicEventPageId, PublicEventPageConfig> = {
	jewels2026: {
		eventId: 'jewels2026',
		status: 'active',
		component: 'jewels2026',
		shellVariant: 'jewels',
		headerTitle: jewelsEventDisplayTitle,
		footerKicker: 'Becoming in Malta',
		footerTitle: jewelsEventDisplayTitle,
		footerCopyrightYear: 2026,
		footerCopyrightName: 'JEWELS Europe',
		showBuyTickets: true,
		navLinks: [
			{ label: 'Home', target: 'home' },
			{ label: 'Speakers', target: 'speakers' },
			{ label: 'Details', target: 'details' },
			{ label: 'Buy Tickets', target: 'newBooking', variant: 'button' }
		]
	},
	gfeu2026: {
		eventId: 'gfeu2026',
		status: 'active',
		component: 'gfeu2026',
		headerKicker: 'Grand Feast',
		headerTitle: 'Europe 2026',
		footerKicker: 'Together in Dublin',
		footerTitle: 'Grand Feast Europe 2026',
		footerCopyrightYear: 2026,
		showBuyTickets: true
	},
	gfeu2025: {
		eventId: 'gfeu2025',
		status: 'archived',
		component: 'gfeu2025',
		headerKicker: 'Grand Feast',
		headerTitle: 'Europe 2025',
		footerKicker: 'Called To More in Oslo',
		footerTitle: 'Grand Feast Europe 2025',
		footerCopyrightYear: 2025,
		showBuyTickets: false
	}
};

export function getPublicEventPage(eventId: string | undefined): PublicEventPageConfig | null {
	if (!eventId) return null;
	return publicEventPages[eventId as PublicEventPageId] ?? null;
}

export function isPublicBookingOpen(eventId: string): boolean {
	return getPublicEventPage(eventId)?.showBuyTickets ?? false;
}

export function groupEventsByYear(events: Event[]): EventYearGroup[] {
	const groups = events.reduce((byYear, event) => {
		const year = new Date(event.datetime).getUTCFullYear();
		const group = byYear.get(year) ?? [];
		group.push(event);
		byYear.set(year, group);
		return byYear;
	}, new Map<number, Event[]>());

	return [...groups.entries()]
		.map(([year, yearEvents]) => ({
			year,
			events: yearEvents.sort(
				(a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
			)
		}))
		.sort((a, b) => b.year - a.year);
}

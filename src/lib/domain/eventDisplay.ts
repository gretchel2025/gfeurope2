export const jewelsEventDisplayTitle = 'JEWELS CONFERENCE 2026';
export const jewelsEventDisplayTitlePlain = jewelsEventDisplayTitle;

export function getEventDisplayTitle(eventId: string, fallbackTitle: string): string {
	if (eventId === 'jewels2026') {
		return jewelsEventDisplayTitle;
	}

	return fallbackTitle;
}

export function getEventDisplayTitlePlain(eventId: string, fallbackTitle: string): string {
	if (eventId === 'jewels2026') {
		return jewelsEventDisplayTitlePlain;
	}

	return fallbackTitle;
}

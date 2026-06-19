export type EventCommunicationDetails = {
	name: string;
	email: string;
	sender: string;
};

export const grandFeastCommunicationDetails: EventCommunicationDetails = {
	name: 'Grand Feast Europe',
	email: 'help@grandfeast.eu',
	sender: 'Grand Feast Europe <help@grandfeast.eu>'
};

export const jewelsCommunicationDetails: EventCommunicationDetails = {
	name: 'Jewels Europe',
	email: 'jewelseuropesupport@grandfeast.eu',
	sender: 'Jewels Europe <jewelseuropesupport@grandfeast.eu>'
};

export function getCommunicationDetailsForEvent(eventId: string): EventCommunicationDetails {
	if (eventId === 'jewels2026') {
		return jewelsCommunicationDetails;
	}

	return grandFeastCommunicationDetails;
}

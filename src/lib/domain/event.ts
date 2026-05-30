/** Canonical event shape used by the application layer. */
export type Event = {
	event_id: string;
	title: string;
	short_description: string;
	country: string;
	venue: string;
	datetime: string;
	timezone: string;
};

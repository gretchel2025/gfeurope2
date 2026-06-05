import type { RequestEvent } from '@sveltejs/kit';
import { NotFoundError, ValidationError } from '$lib/application/errors';
import type { Event } from '$lib/domain/event';
import { createEventServices, repositories, type EventServices } from '$lib/server/http/services';

export type EventContext = {
	eventId: string;
	event: Event;
};

export type EventServiceContext = EventContext & {
	services: EventServices;
};

export async function getEventContext(event: RequestEvent): Promise<EventContext> {
	const rawEventId = event.params.event_id;
	if (!rawEventId) {
		throw new ValidationError('missing event id');
	}

	const eventId = rawEventId.trim();
	const foundEvent = await repositories.eventRepository.findById(eventId);
	if (!foundEvent) {
		throw new NotFoundError('event not found');
	}

	return {
		eventId,
		event: foundEvent
	};
}

export async function getEventServiceContext(event: RequestEvent): Promise<EventServiceContext> {
	const context = await getEventContext(event);
	return {
		...context,
		services: createEventServices(context.eventId)
	};
}

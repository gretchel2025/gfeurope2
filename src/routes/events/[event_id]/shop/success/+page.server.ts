import type { PageServerLoad } from './$types';
import { NotFoundError, ValidationError } from '$lib/application/errors';
import type { MerchReservation } from '$lib/domain/merchandise';
import { getEventServiceContext } from '$lib/server/http/eventContext';
import { withKitErrors } from '$lib/server/http/handlers';

export type ServerData = {
	reservation: MerchReservation;
};

export const load: PageServerLoad = withKitErrors(async (event): Promise<ServerData> => {
	const reservationId = event.url.searchParams.get('reservation_id')?.trim();
	if (!reservationId) {
		throw new ValidationError('missing reservation id');
	}

	const {
		eventId,
		services: { merchandiseService }
	} = await getEventServiceContext(event);
	const reservation = await merchandiseService.getReservation(eventId, reservationId);
	if (!reservation) {
		throw new NotFoundError('merch reservation not found');
	}

	return { reservation };
});

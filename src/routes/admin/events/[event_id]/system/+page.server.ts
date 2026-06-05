import type { Actions, PageServerLoad } from './$types';
import { getAuthSession } from '$lib/infrastructure/auth/session';
import { requireSuperUserSession } from '$lib/server/http/guards';
import { superUserAction, withKitErrors } from '$lib/server/http/handlers';
import { systemService } from '$lib/server/http/services';

export type ServerData = {
	newBookingsAllowed: boolean;
};

export const load: PageServerLoad = withKitErrors(
	async (event: Parameters<PageServerLoad>[0]): Promise<ServerData> => {
		const session = await getAuthSession(event);
		await requireSuperUserSession(session);
		return {
			newBookingsAllowed: systemService.getNewBookingsAllowed()
		};
	}
);

export const actions: Actions = {
	toggleNewBookingsAllowed: superUserAction(async () => {
		systemService.setNewBookingsAllowed(!systemService.getNewBookingsAllowed());
	})
};

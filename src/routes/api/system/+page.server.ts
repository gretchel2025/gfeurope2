import type { Actions } from './$types';
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireSuperUserRequest, requireSuperUserSession } from "$lib/server/http/guards";
import { systemService } from "$lib/server/http/services";

export type ServerData = {
    newBookingsAllowed: boolean,
}

export async function load({ locals }): Promise<ServerData> {
    try {
        const session = await locals.auth();
        await requireSuperUserSession(session);
        return {
            newBookingsAllowed: systemService.getNewBookingsAllowed(),
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

export const actions: Actions = {
    toggleNewBookingsAllowed: async (event) => {
        try {
            await requireSuperUserRequest(event);
            systemService.setNewBookingsAllowed(!systemService.getNewBookingsAllowed());
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
};

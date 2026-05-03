import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { Booking } from "$lib/domain/booking";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireAdminRequest } from "$lib/server/http/guards";
import { bookingService } from "$lib/server/http/services";

export async function load({ params }): Promise<{aRecord: Booking | null}> {
    try {
        return {
            aRecord: await bookingService.getRequiredById(params.reference_no),
        };
    } catch (caught) {
        rethrowAsKitError(caught);
    }
}

export const actions: Actions = {
    cancelBooking: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await bookingService.cancelBookingReservation(params.reference_no);
            throw redirect(303, `/api/v0/booking/${params.reference_no}/cancel/cancel_success`);
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
};

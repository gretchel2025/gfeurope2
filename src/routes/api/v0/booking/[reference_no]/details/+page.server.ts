import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { Booking } from "$lib/domain/booking";
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireAdminRequest } from "$lib/server/http/guards";
import { bookingService, notificationService } from "$lib/server/http/services";

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
    markPaid: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await bookingService.markPaid(params.reference_no);
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
    generateTickets: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await bookingService.generateRelatedTickets(params.reference_no);
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
    sendTicketsEmail: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await notificationService.sendTicketsEmail(params.reference_no);
            throw redirect(303, "details/email_success");
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
    sendPaymentReminderEmail: async (event) => {
        try {
            await requireAdminRequest(event);
            const { params } = event;
            await notificationService.sendPaymentReminder(params.reference_no);
            throw redirect(303, "details/email_success");
        } catch (caught) {
            rethrowAsKitError(caught);
        }
    },
};

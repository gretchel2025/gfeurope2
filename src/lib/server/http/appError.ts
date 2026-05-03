import { error, redirect, type Redirect } from "@sveltejs/kit";
import { AppError, UnauthorizedError } from "$lib/application/errors";

export function rethrowAsKitError(caught: unknown): never {
    if (isRedirect(caught)) {
        throw caught;
    }

    if (caught instanceof UnauthorizedError) {
        throw redirect(303, "/signin");
    }

    if (caught instanceof AppError) {
        throw error(caught.status, caught.message);
    }

    throw caught;
}

function isRedirect(value: unknown): value is Redirect {
    return typeof value === "object" && value !== null && "status" in value && "location" in value;
}

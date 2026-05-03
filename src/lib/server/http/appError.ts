/**
 * Purpose:
 * This file translates application errors into SvelteKit HTTP behavior.
 *
 * Why this structure is good:
 * Framework-specific error handling is isolated at the HTTP edge, which keeps
 * the application layer framework-agnostic and easier to test.
 */
import { error, redirect, type Redirect } from "@sveltejs/kit";
import { AppError, UnauthorizedError } from "$lib/application/errors";

/** Converts known application failures into SvelteKit errors or redirects. */
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

/** Small type guard for SvelteKit redirect objects. */
function isRedirect(value: unknown): value is Redirect {
    return typeof value === "object" && value !== null && "status" in value && "location" in value;
}

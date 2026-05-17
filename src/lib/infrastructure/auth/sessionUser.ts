/**
 * Purpose:
 * This file converts an auth session into the app's internal SessionUser shape.
 *
 * Why this structure is good:
 * Translating third-party session data once keeps the rest of the codebase from
 * depending directly on Auth.js field shapes.
 */
import type { Session } from "@auth/sveltekit";
import type { SessionUser } from "$lib/domain/user";

/** Maps an Auth.js session into the app's normalized session user shape. */
export function getSessionUser(session: Session | null): SessionUser {
    const email = session?.user?.email?.trim().toLowerCase();
    const name = session?.user?.name ?? email ?? "";

    if (!email) {
        return {
            userName: "",
            _id: "",
            isASuperUser: false,
            wasFound: false,
        };
    }

    return {
        userName: name,
        _id: email,
        isASuperUser: false,
        wasFound: true,
    };
}

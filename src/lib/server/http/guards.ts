/**
 * Purpose:
 * This file contains HTTP-facing auth and authorization guards.
 *
 * Why this structure is good:
 * Route-level access checks stay consistent when they are centralized here
 * instead of being reimplemented differently across many pages and actions.
 */
import type { Session } from "@auth/sveltekit";
import type { RequestEvent } from "@sveltejs/kit";
import { UnauthorizedError } from "$lib/application/errors";
import type { SessionUser } from "$lib/domain/user";
import { isSuperUser } from "$lib/domain/user";
import { getSessionUser } from "$lib/infrastructure/auth/sessionUser";
import { userService } from "$lib/server/http/services";

/** Requires an authenticated admin session and returns the normalized session user. */
export async function requireAdminSession(session: Session | null): Promise<{ session: Session; user: SessionUser }> {
    const currentUser = getSessionUser(session);
    if (!currentUser.wasFound || !session) {
        throw new UnauthorizedError("sign in required");
    }

    const dbUser = await userService.getById(currentUser._id);
    if (!dbUser) {
        throw new UnauthorizedError(`user ${currentUser._id} unauthorized`);
    }

    return {
        session,
        user: {
            ...currentUser,
            isASuperUser: isSuperUser(dbUser),
        },
    };
}

/** Requires a signed-in superuser session. */
export async function requireSuperUserSession(session: Session | null): Promise<{ session: Session; user: SessionUser }> {
    const result = await requireAdminSession(session);
    if (!result.user.isASuperUser) {
        throw new UnauthorizedError("unauthorized, must be a superuser");
    }
    return result;
}

/** RequestEvent wrapper for admin-only route handlers. */
export async function requireAdminRequest(event: RequestEvent): Promise<{ session: Session; user: SessionUser }> {
    return await requireAdminSession(await event.locals.auth());
}

/** RequestEvent wrapper for superuser-only route handlers. */
export async function requireSuperUserRequest(event: RequestEvent): Promise<{ session: Session; user: SessionUser }> {
    return await requireSuperUserSession(await event.locals.auth());
}

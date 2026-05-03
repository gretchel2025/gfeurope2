import type { Session } from "@auth/sveltekit";
import type { SessionUser } from "$lib/domain/user";

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

/**
 * Purpose:
 * This file defines persisted user/admin shapes plus session-facing user helpers.
 *
 * Why this structure is good:
 * Splitting domain user concepts from auth infrastructure keeps access rules
 * explicit and gives the rest of the app one place to ask user-related questions.
 */
/** Persisted admin/user record stored in the database. */
export type User = {
    _id: string;
    roles: string[];
};

/** Auth-derived user shape used by guarded routes after session resolution. */
export type SessionUser = {
    _id: string;
    userName: string;
    isASuperUser: boolean;
    wasFound: boolean;
};

/** Helper for role-based access checks used by the guard layer. */
export function isSuperUser(user: User | null): boolean {
    return Boolean(user?.roles.includes("superuser"));
}

export type User = {
    _id: string;
    roles: string[];
};

export type SessionUser = {
    _id: string;
    userName: string;
    isASuperUser: boolean;
    wasFound: boolean;
};

export function isSuperUser(user: User | null): boolean {
    return Boolean(user?.roles.includes("superuser"));
}

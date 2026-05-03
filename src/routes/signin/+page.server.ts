import { dev } from "$app/environment"
import { GOOGLE_ID, GOOGLE_SECRET, LOCAL_ADMIN_EMAILS } from "$env/static/private"

export type ServerData = {
    hasGoogleAuth: boolean
    hasLocalDevAuth: boolean
}

export function load(): ServerData {
    return {
        hasGoogleAuth: Boolean(GOOGLE_ID && GOOGLE_SECRET),
        hasLocalDevAuth: dev && parseEmailList(LOCAL_ADMIN_EMAILS).length > 0,
    }
}

function parseEmailList(raw: string | undefined): string[] {
    if (!raw) {
        return []
    }

    return raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
}

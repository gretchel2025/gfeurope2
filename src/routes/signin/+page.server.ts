import { appConfig } from "$lib/infrastructure/config/env.server";

export type ServerData = {
    hasGoogleAuth: boolean
    hasLocalDevAuth: boolean
}

export function load(): ServerData {
    return {
        hasGoogleAuth: Boolean(appConfig.googleClientId && appConfig.googleClientSecret),
        hasLocalDevAuth: appConfig.dev && appConfig.localAdminEmails.length > 0,
    }
}

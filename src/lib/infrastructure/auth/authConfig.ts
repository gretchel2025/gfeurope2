/**
 * Purpose:
 * This file configures Auth.js / SvelteKitAuth providers for the app.
 *
 * Why this structure is good:
 * Auth wiring is infrastructure, not business logic. Keeping provider setup
 * here isolates third-party auth details and keeps hooks/routes simpler.
 */
import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import Credentials from "@auth/sveltekit/providers/credentials";
import { appConfig } from "$lib/infrastructure/config/env.server";

/** Exposes the SvelteKit auth handle with environment-aware providers. */
export const { handle } = SvelteKitAuth(async () => {
    const providers = [];

    /** Google is enabled when real OAuth credentials are present. */
    if (appConfig.googleClientId && appConfig.googleClientSecret) {
        providers.push(
            Google({
                clientId: appConfig.googleClientId,
                clientSecret: appConfig.googleClientSecret,
            })
        );
    }

    /** Local credentials auth exists only to make local admin work easier in development. */
    if (appConfig.dev && appConfig.localAdminEmails.length > 0) {
        providers.push(
            Credentials({
                name: "Local Admin",
                credentials: {
                    email: { label: "Email", type: "email" },
                },
                async authorize(credentials) {
                    const email = typeof credentials?.email === "string"
                        ? credentials.email.trim().toLowerCase()
                        : "";

                    if (!email || !appConfig.localAdminEmails.includes(email)) {
                        return null;
                    }

                    return {
                        id: email,
                        email,
                        name: email,
                    };
                },
            })
        );
    }

    return {
        providers,
        secret: appConfig.authSecret || undefined,
        trustHost: true,
    };
});

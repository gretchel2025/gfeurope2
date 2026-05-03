import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import Credentials from "@auth/sveltekit/providers/credentials";
import { appConfig } from "$lib/infrastructure/config/env.server";

export const { handle } = SvelteKitAuth(async () => {
    const providers = [];

    if (appConfig.googleClientId && appConfig.googleClientSecret) {
        providers.push(
            Google({
                clientId: appConfig.googleClientId,
                clientSecret: appConfig.googleClientSecret,
            })
        );
    }

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

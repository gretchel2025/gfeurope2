import { SvelteKitAuth } from "@auth/sveltekit"
import Google from "@auth/sveltekit/providers/google"
import Credentials from "@auth/sveltekit/providers/credentials"
import { dev } from "$app/environment"

import {
    GOOGLE_ID,
    GOOGLE_SECRET,
    AUTH_SECRET,
    LOCAL_ADMIN_EMAILS,
} from "$env/static/private"

export const { handle } = SvelteKitAuth(async (event) => {
    const providers = []
    const localAdminEmails = parseEmailList(LOCAL_ADMIN_EMAILS)

    if (GOOGLE_ID && GOOGLE_SECRET) {
        providers.push(Google({clientId: GOOGLE_ID, clientSecret: GOOGLE_SECRET}))
    }

    if (dev && localAdminEmails.length > 0) {
        providers.push(
            Credentials({
                name: "Local Admin",
                credentials: {
                    email: { label: "Email", type: "email" }
                },
                async authorize(credentials) {
                    const email = typeof credentials?.email === "string"
                        ? credentials.email.trim().toLowerCase()
                        : ""

                    if (!email || !localAdminEmails.includes(email)) {
                        return null
                    }

                    return {
                        id: email,
                        email,
                        name: email,
                    }
                }
            })
        )
    }

    const authOptions = {
        providers,
        secret: AUTH_SECRET || (dev ? "local-dev-auth-secret-change-me" : undefined),
        trustHost: true // this fixed UntrustedHost error during Netlify live deployment
    }

    return authOptions
})

function parseEmailList(raw: string | undefined): string[] {
    if (!raw) {
        return []
    }

    return raw
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
}

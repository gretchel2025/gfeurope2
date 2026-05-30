# Infrastructure Notes For Agents

Use this file when a change touches deployment, DNS, database connectivity, auth, or
environment configuration. Do not commit secrets or paste credential values into issues,
commits, PRs, or logs.

## Ownership

- DNS registrar: Squarespace Domains, account `jonathangersam@gmail.com`
- Deployment platform: Netlify, account `jonathangersam@gmail.com`
- Database/auth: Supabase, account `jonathangersam@gmail.com`
- Transactional emails: Resend, sending from verified domain `grandfeast.eu`
- Auth: Supabase Auth with Google sign-in

## Live Environments

- Production domain: `https://www.grandfeast.eu`
- Netlify production branch URL: `https://prod--grand-feast-uk-x-europe.netlify.app`
- Development tester URL: `https://dev.grandfeast.eu`
- Netlify development branch origin URL: `https://dev--grand-feast-uk-x-europe.netlify.app`
- Local development URL: `http://localhost:5173`

Netlify tracks the long-lived `dev` and `prod` branches. Pushing or merging to `dev`
updates the development branch deploy; pushing or merging to `prod` updates production.
The tester-facing development URL is `https://dev.grandfeast.eu`; the Netlify branch URL is
the origin behind it. Supabase Auth redirect URLs must include the public, branch-origin,
production, and local app origins.

## DNS

The registrar is Squarespace Domains, while authoritative DNS is managed in Cloudflare.
Netlify hosts the deployed SvelteKit app and serves the production domain. Production
records are DNS-only in Cloudflare so they continue pointing directly at Netlify.
`dev.grandfeast.eu` is proxied through a Cloudflare Worker to the Netlify `dev` branch
origin. When debugging domain or certificate issues, check Cloudflare DNS/Worker routing
first, then the Netlify domain/certificate settings for the site.

Cloudflare zone details:

```txt
Domain: grandfeast.eu
Zone ID: d05d5c6d1877f64cc4afa670536462f7
Nameservers: peter.ns.cloudflare.com, veronica.ns.cloudflare.com
Cloudflare account: jonathangersam@gmail.com
```

`grandfeast.eu` was moved from Squarespace/Google nameservers to Cloudflare
nameservers. Squarespace remains the registrar account, but DNS records now live in
Cloudflare. Keep the copied Google/Fastmail/Resend records intact when editing DNS.

Current important Cloudflare DNS records:

- `grandfeast.eu` A `75.2.60.5`, DNS-only, Netlify apex
- `grandfeast.eu` A `99.83.231.61`, DNS-only, Netlify apex
- `www.grandfeast.eu` CNAME `apex-loadbalancer.netlify.com`, DNS-only
- `dev.grandfeast.eu` CNAME `dev--grand-feast-uk-x-europe.netlify.app`, proxied
- MX `grandfeast.eu` to `in1-smtp.messagingengine.com` priority 10, DNS-only
- MX `grandfeast.eu` to `in2-smtp.messagingengine.com` priority 20, DNS-only
- TXT SPF and Google verification records, DNS-only
- Fastmail DKIM CNAMEs `fm1._domainkey`, `fm2._domainkey`, and `fm3._domainkey`
- Resend bounce records on `send.grandfeast.eu`, DNS-only
- Resend DKIM TXT `resend._domainkey.grandfeast.eu`, DNS-only
- DMARC TXT `_dmarc.grandfeast.eu`, DNS-only

## Deployment

The app deploys on Netlify with the checked-in `netlify.toml`:

```toml
[build]
command = "npm run build"
publish = "build"
```

Runtime values live in Netlify environment variables for hosted environments. Local values
come from `.env`, usually copied from `.env.example`.

Important deployment-related env vars:

- `APP_BASE_URL`
- `APP_EVENT_ID`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SECRETS_SCAN_OMIT_KEYS`, set to `SUPABASE_SERVICE_ROLE_KEY` so Netlify does not block
  deploys on legitimate server-side references to the secret env var name
- `CONTEXT` and `BRANCH`, supplied by Netlify

Netlify context mapping:

- `production` / `prod` branch: `77 Labs Prod`
- `branch-deploy` / `dev` branch: `77 Labs Test`

For Netlify `branch-deploy` context, use:

```txt
APP_BASE_URL=https://dev.grandfeast.eu
APP_EVENT_ID=gfeu2026
PUBLIC_SUPABASE_URL=<77 Labs Test Supabase URL>
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<77 Labs Test publishable key>
SUPABASE_SERVICE_ROLE_KEY=<77 Labs Test service-role key>
```

The `dev` branch deploy is rebuilt automatically when `dev` is pushed. After changing
Netlify env vars, trigger a redeploy so the branch deploy runtime picks up the new values.

## Database

Production and live development use separate hosted Supabase projects for stronger
isolation. Local development uses the Supabase CLI local stack only.

Hosted projects:

- `77 Labs Prod`
  - Project ref: `erhrykkyhsygnonyfbis`
  - Project URL: `https://erhrykkyhsygnonyfbis.supabase.co`
  - Used by Netlify production / `prod`
- `77 Labs Test`
  - Project ref: `guoqhigzyfisvtnlrbjw`
  - Project URL: `https://guoqhigzyfisvtnlrbjw.supabase.co`
  - Used by Netlify `branch-deploy` / `dev`

App data schema: `grandfeasteu`

App data tables:

- `bookings`
- `tickets`
- `ticket_counters`

All app data tables include `event_id text not null default 'gfeu2026'`, `created_at`,
and `updated_at`. The app scopes repository reads/writes by `APP_EVENT_ID`; prod/test
separation comes from the selected Supabase project, not an `environment` column.

RLS is enabled on all `grandfeasteu` schema tables with no anon/authenticated policies.
The schema is exposed to Supabase's Data API for server-side service-role access only.
App data access uses the server-only `SUPABASE_SERVICE_ROLE_KEY`; never expose that key
to browser code.

Important database env vars:

- `APP_EVENT_ID`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STANDARD_TICKETS_INITIAL_AVAILABLE`
- `GRAND_FEAST_PLUS_TICKETS_INITIAL_AVAILABLE`

Relevant code paths:

- `supabase/config.toml`
- `supabase/migrations/*.sql`
- `supabase/seed.sql`
- `src/lib/infrastructure/db/supabase/client.ts`
- `src/lib/infrastructure/db/supabase/*Repository.ts`
- `src/lib/infrastructure/bootstrap/bootstrap.ts`

On startup, the app creates missing ticket counter records. Local `supabase/seed.sql`
contains only initial counters for `event_id='gfeu2026'`; do not commit exported booking
data or PII.

Hosted authorization uses Supabase Auth `app_metadata.roles`. Do not use `user_metadata`
for authorization because users can edit it.

- `tester` grants access to public pages on live development.
- `admin` grants admin access in production/local and, with `tester`, on live development.
- `superuser` counts as admin-level access but does not imply `tester`.

Expected role combinations:

- `tester`: live-dev public pages only.
- `tester` plus `admin`: live-dev public pages and live-dev `/api`.
- `tester` plus `superuser`: live-dev public pages and live-dev `/api`.
- `admin`: production/local `/api` only; no live-dev access.
- `superuser`: production/local `/api` only; no live-dev access.

For `dev.grandfeast.eu`, `jonathangersam@gmail.com` currently needs all three roles:
`admin`, `superuser`, and `tester`.

Local Supabase role setup:

1. Start the local stack with `make supabase-up` or `make run-local`.
2. For offline-friendly local auth, use the default `admin` / `password` login or set
   `LOCAL_DEV_AUTH_EMAIL`, `LOCAL_DEV_AUTH_PASSWORD`, and optionally
   `LOCAL_DEV_AUTH_ROLES` in `.env`.
3. Create or update the local Supabase email/password user. `make run-local` does this
   automatically after Supabase starts, or run it directly:

   ```bash
   make setup-local-auth
   ```

   The helper refuses non-local Supabase URLs and writes roles to
   `auth.users.raw_app_meta_data`. The default UI login `admin` maps to Supabase user
   `admin@example.test`.

4. If using Google instead of local email/password, sign in once with Google so Supabase
   creates the local `auth.users` row.
5. Grant local roles:

   ```bash
   make grant-local-roles EMAIL=you@example.com
   ```

   The default roles are `tester`, `admin`, and `superuser`. Use
   `ROLES=admin` or another comma-separated subset for narrower local testing.

6. If the browser session was already active, sign out and back in once so the session
   reads the updated `app_metadata`.

## Auth

Auth is configured through Supabase Auth and wired into SvelteKit with `@supabase/ssr`.
Server-side authorization uses Supabase's trusted `auth.getUser()` path before reading
`app_metadata.roles`.

Important auth env vars:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Supabase Auth URL settings:

- `77 Labs Prod`
  - Site URL: `https://www.grandfeast.eu`
  - Redirect URLs: `http://localhost:5173/**`, `http://127.0.0.1:5173/**`,
    `https://www.grandfeast.eu/**`, and
    `https://prod--grand-feast-uk-x-europe.netlify.app/**`
- `77 Labs Test`
  - Site URL: `https://dev.grandfeast.eu`
  - Redirect URLs: `http://localhost:5173/**`, `http://127.0.0.1:5173/**`,
    `https://dev.grandfeast.eu/**`, and
    `https://dev--grand-feast-uk-x-europe.netlify.app/**`

Google OAuth callback URLs:

- `77 Labs Prod`: `https://erhrykkyhsygnonyfbis.supabase.co/auth/v1/callback`
- `77 Labs Test`: `https://guoqhigzyfisvtnlrbjw.supabase.co/auth/v1/callback`
- Local Supabase CLI: `http://127.0.0.1:54321/auth/v1/callback`

Application OAuth completes in SvelteKit at `/auth/callback`, where the Supabase auth code
is exchanged for a cookie-backed session.
Local Supabase Google OAuth is configured in `supabase/config.toml` and reads
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` plus
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` from `.env`. Restart the local Supabase
stack after changing those values.

First-time local setup checklist for agents:

1. Confirm `.env` points to local Supabase, not hosted Supabase, unless hosted verification
   is intentional.
2. Confirm the local Supabase URL is `http://127.0.0.1:54321`.
3. Confirm `PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` match
   `supabase status`.
4. Confirm `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` are set, but never print their values.
5. Confirm Google Cloud OAuth has `http://127.0.0.1:54321/auth/v1/callback` as an
   authorized redirect URI for the configured client.
6. Restart local Supabase after changing `.env` auth provider values.
7. For offline-friendly auth, run `make setup-local-auth`. The script creates or updates a
   confirmed local email/password Supabase Auth user and grants roles.
8. Ask the developer to use the local username/password form on `/signin`; by default, it
   is prefilled with `admin` / `password`.
9. If using Google instead, ask the developer to sign in once so the local `auth.users` row
   exists, then run `make grant-local-roles EMAIL=<developer email>` against the local
   stack.
10. If the developer was already signed in, have them sign out and sign in again to refresh
    session claims.

Auth troubleshooting map:

- Supabase returns `Unsupported provider: provider is not enabled`: the local auth service
  did not load Google provider config. Check the two local Google OAuth env vars and
  restart Supabase.
- No local email/password form appears: the app is not in local access mode or
  `PUBLIC_SUPABASE_URL` does not point to the local Supabase URL.
- Local password sign-in fails: run `make setup-local-auth` while local Supabase is
  running, then use `admin` / `password` unless `.env` intentionally overrides it.
- Google returns `redirect_uri_mismatch`: the Google Cloud OAuth client is missing
  `http://127.0.0.1:54321/auth/v1/callback`.
- The app shows `Access unavailable` after successful sign-in: the user exists but lacks
  required `app_metadata.roles`; run `make grant-local-roles EMAIL=...`, then refresh the
  browser session.

First-class access policy code:

- `src/lib/infrastructure/auth/accessPolicy.ts`
- `src/lib/infrastructure/auth/accessPolicy.test.ts`
- `src/lib/infrastructure/auth/session.ts`
- `src/lib/infrastructure/auth/sessionUser.ts`
- `src/hooks.server.ts`
- `src/routes/signin/+page.server.ts`
- `src/routes/signin/+page.svelte`
- `src/routes/auth/callback/+server.ts`
- `src/lib/server/http/guards.ts`

Access policy behavior:

- Production and local public pages are open.
- Production and local `/api` requires `admin` or `superuser`.
- Live dev public pages require a signed-in user with `tester`.
- Live dev `/api` requires `tester` and either `admin` or `superuser`.
- Signed-out protected requests redirect to `/signin?redirectTo=...`.
- Signed-in users missing required roles redirect to `/unauthorized`.

The live-dev classifier treats these as live dev:

- `dev.grandfeast.eu`
- `dev--grand-feast-uk-x-europe.netlify.app`
- Netlify `BRANCH=dev`

Current live-dev operator account:

```txt
Email: jonathangersam@gmail.com
Required Supabase app_metadata.roles: admin, superuser, tester
```

## Optional Integrations

Resend sends transactional emails from the verified `grandfeast.eu` domain.
The primary transactional sender is `Grand Feast EU and UK <help@grandfeast.eu>`,
with Resend configured in `eu-west-1` and MAIL FROM / bounce handling on
`send.grandfeast.eu`. Live-dev and local development use the same sender and reply-to
identity.

Resend can be left empty unless local email delivery is being tested. Cloudinary must be
configured because booking payment proof uploads are required and must not fall back to
placeholder URLs.

Important integration env vars:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `CLOUDINARY_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Relevant code paths:

- `src/lib/infrastructure/email/resendEmailSender.ts`
- `src/lib/infrastructure/media/cloudinaryImageStorage.ts`
- `src/lib/infrastructure/media/cloudinaryPaymentProofStorage.ts`

## Cloudflare Worker

The `dev.grandfeast.eu` tester URL uses the Worker source in
`cloudflare/grandfeast-dev-proxy/`. Deploy it with:

```bash
npx wrangler deploy --config cloudflare/grandfeast-dev-proxy/wrangler.jsonc
```

Worker behavior:

- Route: `dev.grandfeast.eu/*`
- Origin: `https://dev--grand-feast-uk-x-europe.netlify.app`
- Keeps tester traffic uncached with `Cache-Control: no-store`
- Rewrites Netlify-origin `Location` headers back to `https://dev.grandfeast.eu`
- Preserves all `Set-Cookie` headers so Supabase SSR auth survives the proxy hop
- Sends `X-Grandfeast-Public-Origin: https://dev.grandfeast.eu`

Supabase handles the provider OAuth callback on the Supabase project domain. The app's
`/auth/callback` route exchanges the returned code for a session and then redirects to the
requested app path.

## Verification Commands

DNS and routing:

```bash
dig NS grandfeast.eu @1.1.1.1 +short
dig dev.grandfeast.eu @1.1.1.1 +short
curl -I https://dev.grandfeast.eu/
curl -I https://dev.grandfeast.eu/api
```

OAuth start is browser-driven from `/signin`; verify that the Google sign-in URL starts
from Supabase and returns to `/auth/callback?next=...` on the same app origin.

## Agent Checklist

Before changing infrastructure-sensitive behavior:

- Read `README.md`, `AGENTS.md`, `LOG.md`, `.env.example`, and this file.
- Check whether the change affects Netlify env vars, Google OAuth settings, Supabase,
  Squarespace DNS, Resend, or Cloudinary.
- Keep secrets out of the repo and use placeholder names in documentation.
- Update `LOG.md` when the work changes app behavior, infrastructure, provider
  configuration, deployment state, auth/data/email behavior, or operating procedures.
  Skip routine verification-only actions such as test emails, availability checks, and
  normal command output.
- Run `npm run check`, `npm run test`, and `npm run lint` for code changes.
- Run `npm run build` when changing routes, deployment config, auth wiring, or server load
  behavior.

# Infrastructure Notes For Agents

Use this file when a change touches deployment, DNS, database connectivity, auth, or
environment configuration. Do not commit secrets or paste credential values into issues,
commits, PRs, or logs.

## Ownership

- DNS registrar: Squarespace Domains, account `jonathangersam@gmail.com`
- Deployment platform: Netlify, account `jonathangersam@gmail.com`
- Database: MongoDB Atlas, account `gretchelglopez@gmail.com`
- Transactional emails: Postmark, username `jonathangersam_gfeu`, linked email account
  `jonathan.lopez@grandfeast.eu`
- Auth: Google sign-in through Better Auth

## Live Environments

- Production domain: `https://www.grandfeast.eu`
- Netlify production branch URL: `https://prod--grand-feast-uk-x-europe.netlify.app`
- Development tester URL: `https://dev.grandfeast.eu`
- Netlify development branch origin URL: `https://dev--grand-feast-uk-x-europe.netlify.app`
- Local development URL: `http://localhost:5173`

Netlify tracks the long-lived `dev` and `prod` branches. Pushing or merging to `dev`
updates the development branch deploy; pushing or merging to `prod` updates production.
The tester-facing development URL is `https://dev.grandfeast.eu`; the Netlify branch URL is
the origin behind it. Deploy previews should use Better Auth's OAuth proxy through the stable
development URL, not wildcard Google OAuth origins.

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
Cloudflare. Keep the copied Google/Fastmail/Postmark records intact when editing DNS.

Current important Cloudflare DNS records:

- `grandfeast.eu` A `75.2.60.5`, DNS-only, Netlify apex
- `grandfeast.eu` A `99.83.231.61`, DNS-only, Netlify apex
- `www.grandfeast.eu` CNAME `apex-loadbalancer.netlify.com`, DNS-only
- `dev.grandfeast.eu` CNAME `dev--grand-feast-uk-x-europe.netlify.app`, proxied
- MX `grandfeast.eu` to `in1-smtp.messagingengine.com` priority 10, DNS-only
- MX `grandfeast.eu` to `in2-smtp.messagingengine.com` priority 20, DNS-only
- TXT SPF and Google verification records, DNS-only
- Fastmail DKIM CNAMEs `fm1._domainkey`, `fm2._domainkey`, and `fm3._domainkey`
- Postmark bounce CNAME `pm-bounces.grandfeast.eu -> pm.mtasv.net`

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
- `BETTER_AUTH_PROXY_URL`
- `CONTEXT` and `BRANCH`, supplied by Netlify
- `AUTH_SECRET`

For Netlify `branch-deploy` context, currently set:

```txt
APP_BASE_URL=https://dev.grandfeast.eu
BETTER_AUTH_PROXY_URL=https://dev.grandfeast.eu
```

The `dev` branch deploy is rebuilt automatically when `dev` is pushed. After changing
Netlify env vars, trigger a redeploy so the branch deploy runtime picks up the new values.

## Database

Production and hosted preview environments use MongoDB Atlas. Local development can use a
Docker MongoDB instance from `compose.yaml`.

Important database env vars:

- `MONGO_URI`
- `MONGO_DB_CONNECT_TIMEOUT_MS`
- `STANDARD_TICKETS_INITIAL_AVAILABLE`
- `VIP_TICKETS_INITIAL_AVAILABLE`
- `YOUTH_TICKETS_INITIAL_AVAILABLE`

Relevant code paths:

- `src/lib/infrastructure/db/mongo/client.ts`
- `src/lib/infrastructure/db/mongo/models.ts`
- `src/lib/infrastructure/db/mongo/*Repository.ts`
- `src/lib/infrastructure/bootstrap/bootstrap.ts`

On startup, the app connects to MongoDB, creates missing ticket counter records, and seeds
local admin users from `LOCAL_ADMIN_EMAILS` when configured.

Hosted authorization uses the app authorization records in Mongo collection `users`,
keyed by normalized email address as `_id`. Better Auth stores sign-in identities in its
own Mongo collection named `user`; do not confuse the two collections when assigning
roles.

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

## Auth

Auth is configured in `src/lib/infrastructure/auth/authConfig.ts` with Better Auth,
MongoDB persistence, Google OAuth, and a local-development email/password path for
configured admin emails.

Important auth env vars:

- `AUTH_SECRET`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- `BETTER_AUTH_PROXY_URL`
- `LOCAL_ADMIN_EMAILS`

Google OAuth callback URLs:

- Local: `http://localhost:5173/api/auth/callback/google`
- Development: `https://dev.grandfeast.eu/api/auth/callback/google`
- Development origin: `https://dev--grand-feast-uk-x-europe.netlify.app/api/auth/callback/google`
- Production: `https://www.grandfeast.eu/api/auth/callback/google`

Google OAuth origins:

- `http://localhost:5173`
- `https://dev.grandfeast.eu`
- `https://dev--grand-feast-uk-x-europe.netlify.app`
- `https://www.grandfeast.eu`

Do not configure wildcard deploy-preview origins in Google OAuth. Google does not allow
wildcard origins, and this repo expects deploy previews to proxy OAuth through the stable
development URL.

Local Better Auth users should be email-verified so a later Google sign-in with the same
admin email links cleanly instead of failing with `account_not_linked`.

First-class access policy code:

- `src/lib/infrastructure/auth/accessPolicy.ts`
- `src/lib/infrastructure/auth/accessPolicy.test.ts`
- `src/hooks.server.ts`
- `src/routes/signin/+page.server.ts`
- `src/routes/signin/+page.svelte`
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

## Optional Integrations

Postmark sends transactional emails. The Postmark account username is
`jonathangersam_gfeu`, linked to `jonathan.lopez@grandfeast.eu`.

Postmark and Cloudinary can be left empty for local booting unless local email delivery or
QR image uploads are being tested.

Important integration env vars:

- `MY_POSTMARK_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Relevant code paths:

- `src/lib/infrastructure/email/postmarkEmailSender.ts`
- `src/lib/infrastructure/media/cloudinaryImageStorage.ts`

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
- Sends `X-Grandfeast-Public-Origin: https://dev.grandfeast.eu`

`src/hooks.server.ts` uses `X-Grandfeast-Public-Origin` only for `/api/auth/*` requests.
It rebuilds the Better Auth request URL with the public origin before Better Auth handles
the request. This keeps Google OAuth authorization and callback/token exchange on the same
redirect URI:

```txt
https://dev.grandfeast.eu/api/auth/callback/google
```

If Google sign-in reaches `/api/auth/error?error=invalid_code`, check Netlify function
logs. A `redirect_uri_mismatch` usually means the Cloudflare Worker, Netlify env vars, or
Google OAuth redirect URI no longer agree on `https://dev.grandfeast.eu`.

## Verification Commands

DNS and routing:

```bash
dig NS grandfeast.eu @1.1.1.1 +short
dig dev.grandfeast.eu @1.1.1.1 +short
curl -I https://dev.grandfeast.eu/
curl -I https://dev.grandfeast.eu/api
```

OAuth start:

```bash
curl -i https://dev.grandfeast.eu/api/auth/sign-in/social \
  -H 'content-type: application/json' \
  -H 'origin: https://dev.grandfeast.eu' \
  --data '{"provider":"google","callbackURL":"/"}'
```

The OAuth start response should include
`redirect_uri=https%3A%2F%2Fdev.grandfeast.eu%2Fapi%2Fauth%2Fcallback%2Fgoogle`.

## Agent Checklist

Before changing infrastructure-sensitive behavior:

- Read `README.md`, `AGENTS.md`, `.env.example`, and this file.
- Check whether the change affects Netlify env vars, Google OAuth settings, MongoDB Atlas,
  Squarespace DNS, Postmark, or Cloudinary.
- Keep secrets out of the repo and use placeholder names in documentation.
- Run `npm run check`, `npm run test`, and `npm run lint` for code changes.
- Run `npm run build` when changing routes, deployment config, auth wiring, or server load
  behavior.

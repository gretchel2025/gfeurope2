# grandfeast-1a

SvelteKit app for the Grand Feast EU and UK ticketing and admin site.

The checked-in public pages are currently configured for the 2025 EU and UK Grand Feast
in Oslo, Norway.

Production site: [grandfeast.eu](https://www.grandfeast.eu/)

Development preview:
[dev.grandfeast.eu](https://dev.grandfeast.eu/)

Development branch origin:
[dev--grand-feast-uk-x-europe.netlify.app](https://dev--grand-feast-uk-x-europe.netlify.app/)

Deploy preview test branches can be used to validate Netlify preview auth flows before release.

Production branch deploy:
[prod--grand-feast-uk-x-europe.netlify.app](https://prod--grand-feast-uk-x-europe.netlify.app/)

Infrastructure notes for agents and maintainers live in
[`docs/infrastructure.md`](docs/infrastructure.md).

## Project Structure

- `src/routes/` contains SvelteKit routes.
- `src/lib/components/` contains shared UI components.
- `src/lib/domain/` contains framework-light domain models and business rules.
- `src/lib/application/` contains application services and ports.
- `src/lib/infrastructure/` contains adapters for auth, bootstrap, config, Supabase, email,
  logging, media, and system settings.
- `src/lib/server/http/` contains server-side HTTP service composition.
- `src/lib/navigation/` contains navigation metadata.
- `static/` contains static assets.

## Requirements

- Node.js and npm
- Docker, for the Supabase CLI local stack
- Supabase CLI, for local database/auth development

## Setup

Install dependencies:

```bash
make install
```

Create a local env file:

```bash
cp .env.example .env
```

Review `.env` and fill in any values needed for your environment.

## Run The App

Start the Vite development server:

```bash
make run
```

The local app expects `http://localhost:5173`, including for OAuth callback URLs.

## Run With Local Supabase

Use this for local database/auth development. Local data lives in the Supabase CLI stack,
not in either hosted Supabase project.

Make sure `.env` includes local values like:

```bash
APP_BASE_URL=http://localhost:5173
APP_EVENT_ID=gfeu2025
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon/publishable key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<local service_role key from supabase status>
```

Start Supabase and the app:

```bash
make run-local
```

Useful Supabase commands:

```bash
make supabase-up
make supabase-status
make supabase-down
supabase db reset
```

On startup, the app:

- connects to the Supabase project in `PUBLIC_SUPABASE_URL`
- uses `SUPABASE_SERVICE_ROLE_KEY` only on the server for app data
- creates missing ticket counter records for standard, VIP, and youth tickets

Local seed data includes only ticket counters for `APP_EVENT_ID=gfeu2025`; it does not
include real booking PII.

## Local Admin Sign-In

The app uses Supabase Auth for sessions. Google OAuth is configured in Supabase, and the
SvelteKit app needs:

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

For local auth development, use the Supabase CLI local stack and copy the local URL/key
from `supabase status`. The app no longer has a custom local admin shortcut.

Supabase Auth URL setup:

- `77 Labs Prod`: Site URL `https://www.grandfeast.eu`; redirects include
  `http://localhost:5173/**`, `http://127.0.0.1:5173/**`,
  `https://www.grandfeast.eu/**`, and
  `https://prod--grand-feast-uk-x-europe.netlify.app/**`.
- `77 Labs Test`: Site URL `https://dev.grandfeast.eu`; redirects include
  `http://localhost:5173/**`, `http://127.0.0.1:5173/**`,
  `https://dev.grandfeast.eu/**`, and
  `https://dev--grand-feast-uk-x-europe.netlify.app/**`.

Google OAuth setup:

- Configure Google as a Supabase Auth provider.
- Use Supabase's callback URL in Google OAuth:
  `https://<project-ref>.supabase.co/auth/v1/callback`
- Local Supabase uses `http://127.0.0.1:54321/auth/v1/callback`.
- For local Supabase Google OAuth, add `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
  `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` to `.env`, then restart the local
  Supabase stack so `supabase/config.toml` is reloaded.
- If Google returns `redirect_uri_mismatch`, add
  `http://127.0.0.1:54321/auth/v1/callback` to the Google Cloud OAuth client's
  authorized redirect URIs.

First-time local auth setup:

1. Copy `.env.example` to `.env`.
2. Start Supabase with `make supabase-up`.
3. Copy the local `supabase status` URL/key values into `.env`:
   `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.
4. Add the local Google OAuth env vars:
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`.
5. Confirm the Google OAuth client allows
   `http://127.0.0.1:54321/auth/v1/callback`.
6. Restart Supabase so `supabase/config.toml` reloads the OAuth env values.
7. Start the app, sign in once with Google, then grant local roles:

   ```bash
   make grant-local-roles EMAIL=you@example.com
   ```

8. Sign out and back in if the browser was already signed in before roles were granted.

Local auth troubleshooting:

- `Unsupported provider: provider is not enabled`: local Supabase has not loaded the
  Google provider. Check the `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` env vars and restart
  Supabase.
- Google `redirect_uri_mismatch`: add
  `http://127.0.0.1:54321/auth/v1/callback` to the Google OAuth client.
- `Access unavailable` after sign-in: grant local roles with `make grant-local-roles`,
  then sign out and back in.

## App Data

Grand Feast app data also lives in Supabase. Hosted isolation is by project:

- Production and the `prod` branch use `77 Labs Prod`.
- Live development and `branch-deploy` use `77 Labs Test`.
- Local development uses the Supabase CLI local stack only.

App data lives in the `grandfeasteu` schema. Tables use clean domain names
(`bookings`, `tickets`, `ticket_counters`) and include `event_id`, currently defaulting
to `gfeu2025`. Repository queries always scope by `APP_EVENT_ID`. App-data tables have
RLS enabled and no anon/authenticated policies; server code uses the service-role key.
The `grandfeasteu` schema is exposed to Supabase's Data API only so the server-side
service-role client can access it.

## Access Roles

Access is controlled by Supabase Auth `app_metadata.roles`. The app recognizes these
roles:

- `tester`: can access public pages on the live development site.
- `admin`: can access production/local admin pages, and can access live development admin
  pages only when combined with `tester`.
- `superuser`: counts as admin-level permission but does not imply `tester`.

Live development (`dev.grandfeast.eu` and the Netlify `dev` branch URL) requires a signed-in
user with `tester` for every non-auth page. Production and local public pages remain open.
Admin routes under `/api` require `admin` or `superuser`; on live development they also
require `tester`.

Do not use `user_metadata` for authorization; users can edit it. Assign roles only in
provider-owned `app_metadata`, for example:

```json
{ "roles": ["tester", "admin", "superuser"] }
```

For a local Supabase user, sign in once so the user exists, then grant local roles:

```bash
make grant-local-roles EMAIL=you@example.com
```

The default grants `tester`, `admin`, and `superuser`. To grant a narrower set:

```bash
make grant-local-roles EMAIL=you@example.com ROLES=admin
```

If the browser is already signed in when roles change, sign out and back in once so the
session picks up the updated `app_metadata`.

## Optional Integrations

Resend and Cloudinary credentials can be left empty for local booting. Fill them in only
when local email sending or QR image uploads need to work.

Relevant env vars:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Checks

Run Svelte and TypeScript validation:

```bash
npm run check
```

Run unit tests:

```bash
npm run test
```

Run formatting and lint checks:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

## Deployment

Netlify is connected to this GitHub repository and tracks two long-lived branches:

- `dev` is the official development branch. Merging or pushing changes to `dev`
  updates the Netlify branch origin at
  [dev--grand-feast-uk-x-europe.netlify.app](https://dev--grand-feast-uk-x-europe.netlify.app/),
  which testers should reach through [dev.grandfeast.eu](https://dev.grandfeast.eu/).
- `prod` is the production branch. Merging or pushing changes to `prod` triggers
  a production deploy to [grandfeast.eu](https://www.grandfeast.eu/).

To deploy to production:

```bash
git checkout prod
git push
```

Netlify is configured with:

```toml
[build]
command = "npm run build"
publish = "build"
```

The tester-facing dev URL is served through Cloudflare:

- Cloudflare DNS record: `dev.grandfeast.eu` CNAME to
  `dev--grand-feast-uk-x-europe.netlify.app`, proxied
- Worker source: `cloudflare/grandfeast-dev-proxy/`
- Worker route: `dev.grandfeast.eu/*`
- Worker origin: `https://dev--grand-feast-uk-x-europe.netlify.app`
- Netlify branch-deploy env:
  `APP_BASE_URL=https://dev.grandfeast.eu`, `PUBLIC_SUPABASE_URL`, and
  `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The Worker keeps tester traffic uncached, rewrites Netlify-origin redirects back to
`dev.grandfeast.eu`, and keeps tester traffic on the public dev origin while Supabase
handles OAuth callbacks through `/auth/callback`.

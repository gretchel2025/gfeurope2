# Local Development

Use this guide for local app, database, and auth development. Local data lives in the
Supabase CLI stack, not in either hosted Supabase project.

## Requirements

- Node.js and npm
- Docker, for the Supabase CLI local stack
- Supabase CLI

## Setup

Install dependencies:

```bash
make install
```

Create a local env file:

```bash
cp .env.example .env
```

For local Supabase development, make sure `.env` includes local values like:

```bash
APP_BASE_URL=http://localhost:5173
APP_EVENT_ID=gfeu2026
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local anon/publishable key from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<local service_role key from supabase status>
```

Start Supabase and the app:

```bash
make run-local
```

`make run-local` also creates or updates the default local auth user for the local
sign-in form. Use `admin` / `password` on `/signin`.

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
- creates missing ticket counter records for standard and GrandFeast Plus tickets

Local seed data includes only ticket counters for `APP_EVENT_ID=gfeu2026`; it does not
include real booking PII.

## Local Auth

The app uses Supabase Auth for sessions. Google OAuth is configured in Supabase, and the
SvelteKit app needs:

```bash
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

For local auth development, use the Supabase CLI local stack and copy the local URL/key
from `supabase status`. The app no longer has a custom local admin shortcut.

For offline-friendly local auth, prefer `make setup-local-auth`. It uses the local
Supabase service-role key, refuses non-local Supabase URLs, creates or updates the
email/password user, confirms the email, and writes roles to `app_metadata`. The default
browser login is `admin` / `password`, backed by Supabase user `admin@example.test`.

## First-Time Local Auth Setup

1. Copy `.env.example` to `.env`.
2. Start Supabase with `make supabase-up`.
3. Copy the local `supabase status` URL/key values into `.env`:
   `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`.
4. For offline-friendly local auth, set these in `.env`:

   ```bash
   LOCAL_DEV_AUTH_EMAIL=admin@example.test
   LOCAL_DEV_AUTH_PASSWORD=password
   LOCAL_DEV_AUTH_ROLES=tester,admin,superuser
   ```

5. Create or update the local Supabase email/password user:

   ```bash
   make setup-local-auth
   ```

   The local sign-in form accepts username `admin` and maps it to
   `admin@example.test`. You can also pass values directly:

   ```bash
   make setup-local-auth EMAIL=you@example.com PASSWORD=local-password
   ```

6. Add the local Google OAuth env vars if you also want local Google sign-in:
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`.
7. Confirm the Google OAuth client allows
   `http://127.0.0.1:54321/auth/v1/callback`.
8. Restart Supabase so `supabase/config.toml` reloads the OAuth env values.
9. Start the app. When running locally against the local Supabase URL, `/signin` shows a
   local username/password form prefilled with `admin` / `password`.
10. If you use Google instead of the local email/password form, sign in once with Google,
    then grant local roles:

    ```bash
    make grant-local-roles EMAIL=you@example.com
    ```

11. Sign out and back in if the browser was already signed in before roles were granted.

## Google OAuth

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

## App Data

Grand Feast app data also lives in Supabase. Hosted isolation is by project:

- Production and the `prod` branch use `77 Labs Prod`.
- Live development and `branch-deploy` use `77 Labs Test`.
- Local development uses the Supabase CLI local stack only.

App data lives in the `grandfeasteu` schema. Tables use clean domain names
(`events`, `ticket_types`, `bookings`, `tickets`, `ticket_counters`). `events` is
keyed by `event_id`; `ticket_types` stores per-event pricing and discount rules;
`ticket_counters.counter_id` uses the same stable ids as `ticket_types.ticket_type_id`.
The booking, ticket, and counter tables include `event_id`, currently defaulting to
`gfeu2026`. Repository queries always scope by `APP_EVENT_ID`. App-data tables have RLS
enabled and no anon/authenticated policies; server code uses the service-role key. The
`grandfeasteu` schema is exposed to Supabase's Data API only so the server-side
service-role client can access it.

Local schema changes must still use the repository migration workflow. Create migrations
with `npx supabase migration new <descriptive_name>`, edit the generated SQL file, apply
with `npx supabase migration up --local`, and verify with `npx supabase migration list
--local` plus a focused query. Do not rely on direct dashboard edits, hosted SQL editor
changes, or one-off local schema queries unless the same change is captured in a checked-in
file under `supabase/migrations/`.

After pulling new code, check for missed local database migrations before starting work
that depends on the schema. Run `npx supabase migration list --local` and compare local
and database history. If any migration is missing, state the exact migration version(s)
and ask the user for explicit permission before running `npx supabase migration up
--local`. Do not apply pulled migrations automatically.

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

## Troubleshooting

- `Unsupported provider: provider is not enabled`: local Supabase has not loaded the
  Google provider. Check the `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` env vars and restart
  Supabase.
- No local email/password form: confirm the app is running in local dev and
  `PUBLIC_SUPABASE_URL` points to `http://127.0.0.1:54321`.
- Local password sign-in fails: run `make setup-local-auth` while local Supabase is
  running and use `admin` / `password` unless `.env` intentionally overrides it.
- Google `redirect_uri_mismatch`: add
  `http://127.0.0.1:54321/auth/v1/callback` to the Google OAuth client.
- `Access unavailable` after sign-in: grant local roles with `make grant-local-roles`,
  then sign out and back in.

## Optional Integrations

Resend credentials can be left empty unless local email sending needs to work. Cloudinary
credentials are required for local booting because booking payment proof uploads must go
to Cloudinary instead of placeholder URLs.

Relevant env vars:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `CLOUDINARY_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

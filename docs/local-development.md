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

For live-dev automation, service account passwords may also live in the local untracked
`.env` as `LIVE_DEV_*` values. These values are for setup and Codex/browser testing only;
they are not read by the public app, are not Netlify env vars, and must not be committed.
Use `make setup-live-dev-service-accounts` to create or rotate the live-dev Supabase Auth
users in `77 Labs Test`.

For production Codex verification, keep the production service-account values in local
`.env` as `PROD_*` values and run `make setup-prod-service-account`. Do not add the
production password or production service-role key to Netlify; Netlify only needs the
non-secret `ENABLE_EMAIL_PASSWORD_AUTH=true` flag in contexts where hosted password login
is allowed.

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
   LOCAL_DEV_AUTH_EVENT_ROLES=gfeu2026:admin
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
`gfeu2026`. Event-scoped public and admin routes resolve the event id from URLs such as
`/events/gfeu2026/newbooking` and `/admin/events/gfeu2026/bookings`; repositories and
services for those routes are built per request event id. Global admin routes such as
`/admin` and `/admin/global/events` are not scoped to one event. `APP_EVENT_ID` is the
default event for `/` redirects and bootstrap/setup defaults. App-data tables have RLS
enabled and no anon/authenticated policies; server code uses the service-role key. The
`grandfeasteu` schema is exposed to Supabase's Data API only so the server-side
service-role client can access it.

Use canonical event routes in local testing:

- `/` redirects to the default event from `APP_EVENT_ID`.
- `/events` shows a neutral public events index.
- `/events/gfeu2026` shows the active 2026 public sales page.
- `/events/gfeu2025` shows the archive-only 2025 public page.
- `/events/gfeu2026/newbooking` opens the current booking flow.
- `/admin` shows the neutral admin directory for routes available to the signed-in user.
- `/admin/events/gfeu2026` and `/admin/events/gfeu2025` open event-scoped admin tools
  when the signed-in user has the matching event admin grant.

For admin inventory checks, `/admin/events/<event_id>` should render every counter row
for that event from `ticket_counters`, using `ticket_types.label` for card names. Inactive
ticket types should still appear in admin inventory with an inactive marker, while public
booking pages should continue to hide inactive ticket types.

- `/admin/global/events` shows the superuser-only global events list.

Public event landing pages can have independent marketing themes. The global `/events`
index and global admin pages should remain neutral. Event admin pages use DB-backed
colors from the selected `events` row so local testing should make it visually obvious
when switching between admin events.

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

Access is controlled by Supabase Auth `app_metadata.roles` and
`app_metadata.event_roles`. The app recognizes these roles:

- `tester`: can access public pages on the live development site.
- `admin`: can access the `/admin` directory.
- `event_roles[event_id]` containing `admin`: can access admin pages for that event.
- `superuser`: bypasses event-admin checks and live-dev tester checks.

Live development (`dev.grandfeast.eu` and the Netlify `dev` branch URL) requires a signed-in
user with `tester` for every non-auth page. Production and local public pages remain open.
The `/admin` directory requires `roles.admin`, at least one event admin grant, or
`superuser`. Admin routes under `/admin/events/<event_id>` require
`event_roles[event_id]` containing `admin`, or `superuser`. Global admin routes under
`/admin/global` require `superuser`. On live development, non-superusers also require
`tester`.

Do not use `user_metadata` for authorization; users can edit it. Assign roles only in
provider-owned `app_metadata`, for example:

```json
{
	"roles": ["tester"],
	"event_roles": {
		"gfeu2026": ["admin"],
		"gfeu2025": []
	}
}
```

For a local Supabase user, sign in once so the user exists, then grant local roles:

```bash
make grant-local-roles EMAIL=you@example.com
```

The default grants `tester`, `admin`, and `superuser`, plus
`event_roles.gfeu2026=["admin"]`. To grant a narrower set:

```bash
make grant-local-roles EMAIL=you@example.com ROLES=tester EVENT_ROLES=gfeu2026:admin
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

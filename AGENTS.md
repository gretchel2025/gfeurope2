# Repository Guidelines

## Project Structure & Module Organization

This is a SvelteKit app. Application routes live in `src/routes/`, UI-facing Svelte
components in `src/lib/ui/components/`, public event page registry/configuration in
`src/lib/publicEvents.ts`, and domain logic in `src/lib/domain/`. Application services
and port interfaces live under `src/lib/application/`, while infrastructure adapters are
grouped under `src/lib/infrastructure/` for auth, bootstrap, config, Supabase
repositories, email, logging, media, and system settings. Server-side HTTP helpers live
in `src/lib/server/http/`, navigation metadata lives in `src/lib/navigation/`, and static
assets live in `static/`. Tests are co-located with the code they cover, for example
`src/lib/domain/booking.test.ts`.

For deployment, DNS, Supabase, Google OAuth, and external account context, read `docs/infrastructure.md` before making infrastructure-sensitive changes.

## Event Routing & Theming

Canonical public event pages and event admin pages are event-scoped. Public event pages
live under `/events/<event_id>`, public booking lives under `/events/<event_id>/newbooking`,
and event admin pages live under `/admin/events/<event_id>` with child routes such as
`/admin/events/<event_id>/bookings`. `/admin` is a neutral admin directory for users
with any admin-level access, and `/admin/global` is a superuser-only branch for
global-scope tools. The root path `/` redirects to the default event from `APP_EVENT_ID`.
The `/events` index is global and uses a neutral theme. Auth routes remain global
(`/signin`, `/auth/callback`, `/unauthorized`); protected admin URLs should redirect
through `/signin?redirectTo=<original admin URL>`.

Public event landing pages are intentionally independent marketing surfaces. Put
event-specific public page components under `src/lib/ui/components/public/events/` and
register page metadata in `src/lib/publicEvents.ts`; do not make one event page silently
fall back to another event's design. Keep `/events` visually neutral. Admin pages share
the admin UI but read DB-backed event theme colors from the `events` table so operators
can distinguish which event they are managing.

## Admin Inventory

Ticket inventory is DB-backed. `ticket_types` stores per-event labels, pricing,
availability, discount rules, active state, and sort order; `ticket_counters` stores
mutable inventory using matching stable ids. Public booking pages should load only active
and available ticket types. Event admin dashboards should render all counters for the
route event, including inactive compatibility or historical ticket types, and use
`ticket_types.label` for display names when available.

## Audit Events

Important domain actions are written server-side to `grandfeasteu.audit_events` after
the represented action succeeds. Audit insert failures are logged and do not block the
completed user action. The table has a direct FK only to `events(event_id)`; bookings,
tickets, and counters are referenced by `entity_type` plus `entity_id`.

Current audit actions are `booking.created`, `booking.payment_reminder_sent`,
`booking.marked_paid`, `booking.cancelled`, `booking.tickets_generated`,
`ticket.created`, `ticket.checked_in`, `ticket.checked_out`, and
`ticket_counter.available_added`. Actor types are `public`, `admin`, and `system`.
Entity types are `booking`, `ticket`, and `ticket_counter`. Audit metadata may include
operational identifiers and state changes, but must not include secrets, tokens, uploaded
file contents, payment proof URLs, or email bodies.

Admin history pages and sections must not query audit rows by default. Use the explicit
`?load_history=true` query param for event, booking, and ticket history.

## Activity Logging

Keep `LOG.md` as a concise running record of meaningful project activity. Add entries for changes that affect app behavior, infrastructure, deployment, provider configuration, data/auth/email behavior, or operational procedures. Do not log routine checks or one-off verification tasks such as sending a test email, confirming a site is live, running standard tests, or checking command output unless the result changes project state or reveals a decision worth preserving.

## Agent Runbook: First-Time Local Auth Setup

For a new developer or a fresh local Supabase setup, use the local Supabase CLI stack. Do not point local development at hosted production/test unless the user explicitly asks to verify hosted behavior.

1. Copy `.env.example` to `.env` and set local Supabase values from `supabase status`:
   `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only
   `SUPABASE_SERVICE_ROLE_KEY`.
2. For offline-friendly local auth, run `make setup-local-auth`, or use `make run-local`
   which runs it automatically after Supabase starts. By default this creates or updates
   the local Supabase user `admin@example.test` for the UI login `admin` / `password`,
   grants `LOCAL_DEV_AUTH_ROLES`, defaulting to `tester,admin,superuser`, and grants
   `LOCAL_DEV_AUTH_EVENT_ROLES`, defaulting to `gfeu2026:admin`.
3. For local Google OAuth, ensure `.env` has
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and
   `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`. Do not print these values.
4. In the matching Google Cloud OAuth client, ensure the authorized redirect URIs include
   `http://127.0.0.1:54321/auth/v1/callback`.
5. Restart local Supabase after changing OAuth env values:
   `make supabase-down && make supabase-up`, or use the equivalent `supabase stop/start`
   commands.
6. Start the app with `npm run dev -- --host 127.0.0.1` or `make run-local`.
7. The `/signin` page shows a local username/password form only when the app runs locally
   against `http://127.0.0.1:54321` or `http://localhost:54321`; it displays and prefills
   the `admin` / `password` hint in that local-only mode.
8. If using Google instead of local email/password, have the developer sign in once so
   Supabase creates the local
   `auth.users` row.
9. Grant local roles with `make grant-local-roles EMAIL=developer@example.com`. The
   default grants `tester`, `admin`, and `superuser` plus `event_roles.gfeu2026=["admin"]`;
   pass `ROLES=tester EVENT_ROLES=gfeu2026:admin` or another subset only for narrower
   testing.
10. If the browser was already signed in before roles were granted, have the developer
    sign out and sign back in so the session picks up updated `app_metadata`.

Local auth failure map:

- `Unsupported provider: provider is not enabled`: local Supabase did not load the
  Google provider. Check the two `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` env vars and restart
  the local Supabase stack.
- No local email/password form: the app is not running in local mode against the local
  Supabase URL. Check `PUBLIC_SUPABASE_URL` and the Vite dev server.
- Local password sign-in fails: run `make setup-local-auth` after local Supabase is
  running, then use `admin` / `password` unless `.env` intentionally overrides it.
- Google `redirect_uri_mismatch`: add
  `http://127.0.0.1:54321/auth/v1/callback` to the Google Cloud OAuth client's
  authorized redirect URIs.
- App page says signed in but access unavailable: grant roles with
  `make grant-local-roles EMAIL=...`, then refresh the session by signing out and back in.

## Database Migration Workflow

All Supabase schema changes must be made through checked-in migration files in
`supabase/migrations/` and applied with Supabase migration commands. Do not make schema
changes directly in hosted dashboards, ad hoc SQL consoles, or one-off local queries
unless the same change is first captured in a migration file.

For a new schema change:

1. Create the migration with `npx supabase migration new <descriptive_name>`.
2. Write the SQL in the generated file under `supabase/migrations/`.
3. Apply locally with `npx supabase migration up --local`.
4. Verify with `npx supabase migration list --local` and a focused schema/data query.
5. Commit the migration with the application code that depends on it.

For existing migrations, apply missed local migrations with `npx supabase migration up
--local`; do not repair or manually edit migration history unless reconciling a known
history mismatch.

After pulling from git, check whether any checked-in migrations are missing from the
target database before continuing work. Use `npx supabase migration list --local` for
local development, or `npx supabase migration list --linked` only when intentionally
checking a hosted project. If migrations are missing, report the exact migration versions
and ask the user for explicit permission before applying them. Do not auto-apply missed
migrations just because they exist after a pull.

## Build, Test, and Development Commands

- `make install` or `npm install`: install dependencies.
- `make run`: start the Vite dev server and open the app in a browser.
- `make run-local`: start the Supabase CLI local stack, then run the app.
- `make supabase-up`, `make supabase-down`, `make supabase-status`: manage local Supabase.
- `make setup-local-auth [EMAIL=admin PASSWORD=password EVENT_ROLES=gfeu2026:admin]`: create or
  update an offline-friendly local Supabase email/password user.
- `make grant-local-roles EMAIL=you@example.com [ROLES=tester,admin,superuser] [EVENT_ROLES=gfeu2026:admin]`: grant
  local Supabase Auth roles and event roles after first local sign-in.
- `npm run build` or `make build`: create the production build.
- `npm run check` or `make test-unit`: run Svelte/TypeScript validation with `svelte-check`.
- `npm run test`: run Vitest once.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run lint`: run Prettier check and ESLint.
- `npm run format`: format the repository with Prettier.

## Coding Style & Naming Conventions

Use TypeScript and Svelte throughout the app. Follow the existing formatting rules: tabs, single quotes, trailing commas disabled, and 100-character line width. Keep filenames descriptive and aligned with their feature area, such as `bookingService.ts`, `ticketRepository.ts`, or `+page.server.ts`. Keep domain rules framework-light in `src/lib/domain/`, put orchestration in application services, and put direct vendor/database details in infrastructure modules.

## Testing Guidelines

Place unit tests next to the implementation and name them `*.test.ts`. Current coverage focuses on domain logic, so new business rules should add or update tests in `src/lib/domain/` first. Run `npm run test`, `npm run check`, and `npm run lint` before opening a merge request; run `npm run build` when routes, server loading, or deployment behavior changes.

## Commit & Pull Request Guidelines

Recent commits use short, imperative, lowercase subjects like `refactor legal pages styling` or `add ui refactor infographic`. Keep commit messages similarly concise and action-focused. Pull requests should describe the user-facing change, note any environment or migration impact, and include screenshots for UI work. If a change touches auth, Supabase, email, Cloudinary, local seeding, or deployment behavior, call that out explicitly.

## Security & Configuration Tips

Do not commit secrets. Copy `.env.example` to `.env` for local development and fill in values such as `APP_BASE_URL`, `APP_EVENT_ID`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. The app also reads initial ticket counter values, `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, and Cloudinary credentials. Local development uses the Supabase CLI stack; never point local work at hosted production/test unless you are intentionally verifying hosted behavior. Resend and Cloudinary can be left empty unless those integrations are needed locally.

Auth uses Supabase Auth with Google OAuth. Application roles live in Supabase Auth `app_metadata.roles` and event admin grants live in `app_metadata.event_roles`; do not use user-editable metadata for authorization. Booking, ticket, and counter data lives in the `grandfeasteu` Supabase schema (`events`, `ticket_types`, `bookings`, `tickets`, `ticket_counters`) scoped by event route ids such as `/events/gfeu2026` and `/admin/events/gfeu2026`; `APP_EVENT_ID` is only the default event for root redirects and setup/bootstrap defaults. Production uses `77 Labs Prod`, live development uses `77 Labs Test`, and local development uses the Supabase CLI local database.

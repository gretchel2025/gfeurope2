# Activity Log

Concise record of meaningful project changes. Do not log routine verification,
test sends, site availability checks, or command-only housekeeping.

## 2026-05-31

- Hardened live-dev Supabase session lookup so stale or malformed auth cookies are treated
  as signed out instead of surfacing as a generic 500, with server-side error logging.
- Limited browser-facing auth data to a minimal public session so Google provider tokens
  and identity payloads are not serialized into SvelteKit page data.
- Added live-dev/local error diagnostics to public error pages so browser-visible 500s
  include status, path, message, and stack details without exposing them in production.
- Added early client-side error capture so live-dev browser 500 pages can display
  hydration/runtime failures that do not reach server logs.
- Made public ticket selection more reliable on mobile by forcing homepage ticket links
  to use full navigation and changing booking ticket cards to native radio inputs.
- Added default favicon and Apple touch icon static files so mobile browsers do not
  request missing icon routes through SvelteKit.
- Added a live-dev-only Supabase email/password sign-in path for Codex service-account
  testing, with local-only `.env` password storage and a setup helper for `77 Labs Test`.
- Documented that agents should check for missing database migrations after `git pull`
  and ask explicit permission before applying them.
- Added DB-backed ticket type pricing and discount configuration, migrated
  ticket counter ids to stable ticket type ids, and moved booking price validation
  from hard-coded constants to `grandfeasteu.ticket_types`.

## 2026-05-30

- Added a timeout around Resend email delivery so stalled provider requests do not leave
  admin booking actions spinning indefinitely.
- Added first-class Grand Feast event records in Supabase and booking validation against
  the configured `APP_EVENT_ID`.
- Added a `do-test-booking` Codex skill for preparing local two-ticket test
  bookings up to the final user-owned confirmation step.
- Documented that Supabase schema changes must go through checked-in migration files
  and Supabase migration commands before being applied locally or to hosted projects.
- Updated the Cloudflare dev proxy to preserve Supabase auth `Set-Cookie` headers
  across the `dev.grandfeast.eu` proxy hop.
- Applied live-dev Supabase schema updates for `payment_proof_url` and GrandFeast
  Plus ticket constraints, then repaired `77 Labs Test` migration history to match
  the local migration versions.
- Added visible loading states to booking, sign-in, error recovery, and shared
  admin action buttons to reduce duplicate submissions during long-running work.
- Simplified booking country and city option loading so typeahead data is available
  synchronously and city lists are cached per selected country.
- Fixed Supabase ticket type constraints so GrandFeast Plus bookings can be created
  under the 2026 ticket model.
- Restyled booking reservation, payment reminder, and eTicket emails with richer
  event details and updated sender identity.
- Removed the public aurora treatment from the admin shell, added a subtle light
  admin background treatment, and styled admin success/error pages.
- Focused admin reports on paid ticket sales by city and unpaid bookings by city.
- Made Cloudinary configuration required at startup so booking proof uploads cannot
  silently fall back to local placeholder URLs.
- Added persistence and admin preview support for booking proof-of-payment URLs.
- Switched the active app event id defaults and local seed setup from `gfeu2025`
  to `gfeu2026`.
- Expanded admin booking search to support booking reference, email, booking
  name, guest names, and exact ticket IDs.
- Redesigned the booking form into a guided reservation flow with separated
  country and city selection.
- Simplified the booking city dropdown to collapse district-style variants into
  the parent city name.
- Hid ticket availability counts on booking cards unless a ticket type has ten
  or fewer remaining.
- Updated the Standard Early Bird card to show the regular price crossed out and
  the promo end date.
- Replaced booking country and city selects with searchable typeahead inputs.
- Updated booking quantity to start at zero and validate a minimum of one ticket
  when continuing.
- Clarified booking ticket selection visuals so only the selected ticket type
  shows a checkmark.
- Removed the separate booking details name field and now use the first guest
  name as the booking name.
- Added explicit required and invalid email feedback on the booking details step.
- Added bank-transfer instructions, required proof-of-payment upload validation,
  and a non-refundable confirmation before booking submission.
- Added Cloudinary upload for booking proof-of-payment files before booking
  records are created.
- Updated booking confirmation and reminder emails to use the Ireland bank
  transfer details instead of the old PayPal payment copy.
- Replaced the native non-refundable confirmation dialog with an in-page booking
  confirmation modal.
- Restyled the public website with the modern conference theme inspired by the
  Ireland Grand Feast visual direction.
- Prevented the 5+ group discount from stacking with the Standard Early Bird promo.
- Updated public ticket offerings and pricing rules to Standard and GrandFeast Plus,
  with child tickets shown as informational only and 5+ family discounts on paid tickets.
- Updated the landing page anchor verse and speaker-section message for the 2026
  Dublin event.
- Converted the public FAQ page question-and-answer content into bulleted lists.

## 2026-05-29

- Embedded the current architecture and booking-flow infographics in the README.
- Added a booking-flow infographic covering public reservation, inventory reservation,
  payment, cancellation, ticket generation, ticket email, and check-in ownership.
- Added a current-codebase architecture infographic v2 covering SvelteKit routes,
  server HTTP helpers, application services, domain/ports, Supabase, Resend, Cloudinary,
  and runtime access flows.
- Split human-facing README content from detailed local development and auth runbooks in
  `docs/local-development.md`.

## 2026-05-28

- Added `docs/architecture.md` with C4-style context, container, component, flow, and
  access-policy diagrams for maintainers.
- Migrated transactional email delivery from Postmark to Resend using the verified
  `grandfeast.eu` sending domain.
- Configured Resend environment variables for live dev and production, with mail sent
  from `Grand Feast EU and UK <help@grandfeast.eu>`.
- Redeployed live dev from the `dev` branch after the Resend migration.
- Added local Supabase Google OAuth provider configuration using env-based client
  credentials.
- Added a local role-grant helper for Supabase Auth onboarding.
- Expanded first-time local auth setup and troubleshooting runbooks for agents.
- Granted co-developer hosted Supabase app roles in live dev and production.
- Added local-only Supabase email/password auth setup for offline-friendly development.
- Prefilled local-only sign-in with the default admin credentials.

# Activity Log

Concise record of meaningful project changes. Do not log routine verification,
test sends, site availability checks, or command-only housekeeping.

## 2026-05-30

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
- Configured Resend environment variables for live dev and production, with live
  dev/local mail sent from `test@grandfeast.eu` and production mail sent from
  `admin@grandfeast.eu`.
- Redeployed live dev from the `dev` branch after the Resend migration.
- Added local Supabase Google OAuth provider configuration using env-based client
  credentials.
- Added a local role-grant helper for Supabase Auth onboarding.
- Expanded first-time local auth setup and troubleshooting runbooks for agents.
- Granted co-developer hosted Supabase app roles in live dev and production.
- Added local-only Supabase email/password auth setup for offline-friendly development.
- Prefilled local-only sign-in with the default admin credentials.

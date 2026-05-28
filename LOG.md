# Activity Log

Concise record of meaningful project changes. Do not log routine verification,
test sends, site availability checks, or command-only housekeeping.

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

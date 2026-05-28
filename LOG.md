# Activity Log

Concise record of meaningful project changes. Do not log routine verification,
test sends, site availability checks, or command-only housekeeping.

## 2026-05-28

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

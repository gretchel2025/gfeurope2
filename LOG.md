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

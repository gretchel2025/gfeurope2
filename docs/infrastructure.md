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
- Netlify development branch URL: `https://dev--grand-feast-uk-x-europe.netlify.app`
- Local development URL: `http://localhost:5173`

Netlify tracks the long-lived `dev` and `prod` branches. Pushing or merging to `dev`
updates the development branch deploy; pushing or merging to `prod` updates production.
Deploy previews should use Better Auth's OAuth proxy through the stable development URL,
not wildcard Google OAuth origins.

## DNS

DNS is managed in Squarespace Domains. Netlify hosts the deployed SvelteKit app and serves
the production domain. When debugging domain or certificate issues, check Squarespace DNS
records first, then the Netlify domain/certificate settings for the site.

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
- Development: `https://dev--grand-feast-uk-x-europe.netlify.app/api/auth/callback/google`
- Production: `https://www.grandfeast.eu/api/auth/callback/google`

Google OAuth origins:

- `http://localhost:5173`
- `https://dev--grand-feast-uk-x-europe.netlify.app`
- `https://www.grandfeast.eu`

Do not configure wildcard deploy-preview origins in Google OAuth. Google does not allow
wildcard origins, and this repo expects deploy previews to proxy OAuth through the stable
development URL.

Local Better Auth users should be email-verified so a later Google sign-in with the same
admin email links cleanly instead of failing with `account_not_linked`.

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

## Agent Checklist

Before changing infrastructure-sensitive behavior:

- Read `README.md`, `AGENTS.md`, `.env.example`, and this file.
- Check whether the change affects Netlify env vars, Google OAuth settings, MongoDB Atlas,
  Squarespace DNS, Postmark, or Cloudinary.
- Keep secrets out of the repo and use placeholder names in documentation.
- Run `npm run check`, `npm run test`, and `npm run lint` for code changes.
- Run `npm run build` when changing routes, deployment config, auth wiring, or server load
  behavior.

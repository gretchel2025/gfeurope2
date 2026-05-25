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
- `src/lib/infrastructure/` contains adapters for auth, bootstrap, config, MongoDB, email,
  logging, media, and system settings.
- `src/lib/server/http/` contains server-side HTTP service composition.
- `src/lib/navigation/` contains navigation metadata.
- `static/` contains static assets.

## Requirements

- Node.js and npm
- Docker, if you want to run MongoDB locally with `compose.yaml`

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

## Run With Local MongoDB

Use this when the shared or deployed MongoDB is unavailable, or when you want a disposable
local database.

Make sure `.env` includes local values like:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/grandfeast
APP_BASE_URL=http://localhost:5173
AUTH_SECRET=local-dev-auth-secret
LOCAL_ADMIN_EMAILS=alice@example.com,bob@example.com,charlie@example.com
```

Start MongoDB and the app:

```bash
make run-local
```

Useful MongoDB commands:

```bash
make db-up
make db-logs
make db-down
```

On startup, the app:

- connects to the MongoDB defined in `MONGO_URI`
- creates missing ticket counter records for standard, VIP, and youth tickets
- inserts local admin/superuser records from `LOCAL_ADMIN_EMAILS` if they do not already
  exist

## Local Admin Sign-In

The app uses Better Auth for admin sessions. Google OAuth is enabled when `GOOGLE_ID`
and `GOOGLE_SECRET` are set.

For local development without Google OAuth, set `LOCAL_ADMIN_EMAILS`. The `/signin` page
will show a local admin sign-in form, and any configured email can create a local admin
session. These local development email-password accounts are marked as verified so a
later Google sign-in with the same email can link to the same Better Auth user instead of
failing with `account_not_linked`.

Google OAuth setup for local admin sign-in:

- Authorized JavaScript origin: `http://localhost:5173`
- Authorized redirect URI: `http://localhost:5173/api/auth/callback/google`

Google OAuth setup for Netlify:

- Authorized JavaScript origins use origins only, with no path and no wildcard:
  `https://dev.grandfeast.eu`, `https://dev--grand-feast-uk-x-europe.netlify.app`, and
  `https://www.grandfeast.eu`
- Authorized redirect URIs use the full Better Auth callback URLs:
  `https://dev.grandfeast.eu/api/auth/callback/google`,
  `https://dev--grand-feast-uk-x-europe.netlify.app/api/auth/callback/google`, and
  `https://www.grandfeast.eu/api/auth/callback/google`

Netlify deploy previews proxy Google OAuth through the long-lived dev preview. Do not add
`https://deploy-preview-*--grand-feast-uk-x-europe.netlify.app` to Google OAuth settings;
Google does not allow wildcard origins, and deploy previews should use the dev callback
through Better Auth's OAuth proxy.

Set `BETTER_AUTH_PROXY_URL` to `https://dev.grandfeast.eu` for the `dev` branch and
to `https://www.grandfeast.eu` for production. Deploy previews can continue to proxy
OAuth through the stable development URL.

## Access Roles

Hosted access is controlled by Mongo `user` records. The app recognizes these roles:

- `tester`: can access public pages on the live development site.
- `admin`: can access production/local admin pages, and can access live development admin
  pages only when combined with `tester`.
- `superuser`: counts as admin-level permission but does not imply `tester`.

Live development (`dev.grandfeast.eu` and the Netlify `dev` branch URL) requires a signed-in
user with `tester` for every non-auth page. Production and local public pages remain open.
Admin routes under `/api` require `admin` or `superuser`; on live development they also
require `tester`.

## Optional Integrations

Postmark and Cloudinary credentials can be left empty for local booting. Fill them in only
when local email sending or QR image uploads need to work.

Relevant env vars:

- `MY_POSTMARK_API_KEY`
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

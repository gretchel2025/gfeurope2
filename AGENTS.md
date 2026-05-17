# Repository Guidelines

## Project Structure & Module Organization

This is a SvelteKit app. Application routes live in `src/routes/`, shared UI components in `src/lib/components/`, and domain logic in `src/lib/domain/`. Application services and port interfaces live under `src/lib/application/`, while infrastructure adapters are grouped under `src/lib/infrastructure/` for auth, bootstrap, config, MongoDB repositories, email, logging, media, and system settings. Server-side HTTP helpers live in `src/lib/server/http/`, navigation metadata lives in `src/lib/navigation/`, and static assets live in `static/`. Tests are co-located with the code they cover, for example `src/lib/domain/booking.test.ts`.

## Build, Test, and Development Commands

- `make install` or `npm install`: install dependencies.
- `make run`: start the Vite dev server and open the app in a browser.
- `make run-local`: start local MongoDB from `compose.yaml`, then run the app.
- `make db-up`, `make db-down`, `make db-logs`: manage the local MongoDB container.
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

Recent commits use short, imperative, lowercase subjects like `refactor legal pages styling` or `add ui refactor infographic`. Keep commit messages similarly concise and action-focused. Pull requests should describe the user-facing change, note any environment or migration impact, and include screenshots for UI work. If a change touches auth, MongoDB, email, Cloudinary, local seeding, or deployment behavior, call that out explicitly.

## Security & Configuration Tips

Do not commit secrets. Copy `.env.example` to `.env` for local development and fill in values such as `MONGO_URI`, `APP_BASE_URL`, and `AUTH_SECRET`. The app also reads `MONGO_DB_CONNECT_TIMEOUT_MS`, initial ticket counter values, optional `LOCAL_ADMIN_EMAILS`, `GOOGLE_ID`, `GOOGLE_SECRET`, `MY_POSTMARK_API_KEY`, and Cloudinary credentials. Local development can use Docker MongoDB via `make db-up`, and the app expects `http://localhost:5173` for local OAuth callbacks. Postmark, Cloudinary, and Google OAuth can be left empty unless those integrations are needed locally.

Auth uses Better Auth with Google OAuth and a dev-only `LOCAL_ADMIN_EMAILS` email-password path. Keep Google and local email-password providers linkable for the same admin email; local dev Better Auth users should be email-verified so Google sign-in does not fail with `account_not_linked`. Netlify deploy previews should proxy OAuth through the long-lived dev branch URL, not a wildcard Google OAuth origin.

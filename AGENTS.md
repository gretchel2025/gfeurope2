# Repository Guidelines

## Project Structure & Module Organization
This is a SvelteKit app. Application routes live in `src/routes/`, shared UI components in `src/lib/components/`, and domain logic in `src/lib/domain/`. Infrastructure code is grouped under `src/lib/infrastructure/`, while server-side HTTP helpers live in `src/lib/server/http/`. Tests are co-located with the code they cover, for example `src/lib/domain/booking.test.ts`.

## Build, Test, and Development Commands
- `make install` or `npm install`: install dependencies.
- `make run`: start the Vite dev server and open the app in a browser.
- `make run-local`: start local MongoDB via Docker, then run the app.
- `npm run build` or `make build`: create the production build.
- `npm run check` or `make test-unit`: run Svelte/TypeScript validation with `svelte-check`.
- `npm run test`: run Vitest once.
- `npm run lint`: run Prettier check and ESLint.
- `npm run format`: format the repository with Prettier.

## Coding Style & Naming Conventions
Use TypeScript and Svelte throughout the app. Follow the existing formatting rules: tabs, single quotes, trailing commas disabled, and 100-character line width. Keep filenames descriptive and aligned with their feature area, such as `bookingService.ts`, `ticketRepository.ts`, or `+page.server.ts`. Prefer co-locating feature code rather than creating large cross-cutting folders.

## Testing Guidelines
Place unit tests next to the implementation and name them `*.test.ts`. Current coverage focuses on domain logic, so new business rules should add or update tests in `src/lib/domain/` first. Run `npm run test` for Vitest and `npm run check` before opening a merge request.

## Commit & Pull Request Guidelines
Recent commits use short, imperative, lowercase subjects like `refactor legal pages styling` or `add ui refactor infographic`. Keep commit messages similarly concise and action-focused. Pull requests should describe the user-facing change, note any environment or migration impact, and include screenshots for UI work. If a change touches auth, MongoDB, or deployment behavior, call that out explicitly.

## Security & Configuration Tips
Do not commit secrets. Copy `.env.example` to `.env` for local development and fill in values such as `MONGO_URI`, `APP_BASE_URL`, and `AUTH_SECRET`. Local development can use Docker MongoDB via `make db-up`, and the app expects `http://localhost:5173` for local OAuth callbacks.

# Grand Feast EU/UK Ticketing

SvelteKit app for the Grand Feast EU and UK ticketing and admin site. The active public
sales page is currently the 2026 Dublin event, while the 2025 Oslo event remains available
as an archive/portfolio page.

## Environments

- Production: [grandfeast.eu](https://www.grandfeast.eu/)
- Development preview: [dev.grandfeast.eu](https://dev.grandfeast.eu/)
- Development branch origin:
  [dev--grand-feast-uk-x-europe.netlify.app](https://dev--grand-feast-uk-x-europe.netlify.app/)
- Production branch deploy:
  [prod--grand-feast-uk-x-europe.netlify.app](https://prod--grand-feast-uk-x-europe.netlify.app/)

## Infographics

![Grand Feast app architecture current codebase map](docs/grand-feast-architecture-infographic-v2.png)

![Grand Feast booking flow](docs/booking-flow-infographic-v1.png)

## Quick Start

Requirements:

- Node.js and npm
- Docker, for the Supabase CLI local stack
- Supabase CLI, for local database/auth development

Install dependencies and create a local env file:

```bash
make install
cp .env.example .env
```

For normal local database/auth development, point `.env` at the local Supabase CLI stack,
then run:

```bash
make run-local
```

For frontend-only work where database/auth behavior is not needed:

```bash
make run
```

The local app expects `http://localhost:5173`, including for OAuth callback URLs.

## Common Commands

```bash
make run-local        # start local Supabase, seed local auth, and run the app
make run              # start the Vite dev server
npm run check         # Svelte and TypeScript validation
npm run test          # Vitest once
npm run lint          # Prettier check and ESLint
npm run build         # production build
```

## Project Structure

- `src/routes/` contains SvelteKit routes.
- `src/lib/ui/components/` contains UI-facing Svelte components.
- `src/lib/publicEvents.ts` contains public event page registry/configuration.
- `src/lib/domain/` contains framework-light domain models and business rules.
- `src/lib/application/` contains application services and ports.
- `src/lib/infrastructure/` contains adapters for auth, bootstrap, config, Supabase, email,
  logging, media, and system settings.
- `src/lib/server/http/` contains server-side HTTP service composition.
- `src/lib/navigation/` contains navigation metadata.
- `static/` contains static assets.

## Routing And Theming

- Public event pages are event-scoped under `/events/<event_id>`.
- The public events index lives at `/events` and uses a neutral, non-event-specific theme.
- Public booking is event-scoped at `/events/<event_id>/newbooking`.
- `/admin` is a neutral directory of admin routes available to the signed-in user.
- Event admin pages are event-scoped under `/admin/events/<event_id>` and require
  event-specific admin grants.
- Global admin pages live under `/admin/global` and require `superuser`.
- Global auth stays outside event scope at `/signin` and `/auth/callback`; redirects carry
  the original admin or event URL through `redirectTo`.
- Public event marketing pages use independent Svelte components under
  `src/lib/ui/components/public/events/` so archived and future events can have distinct
  designs.
- Admin event pages use DB-backed event theme colors from the `events` table to help
  operators distinguish which event they are managing.

## Documentation

- Architecture map: [`docs/architecture.md`](docs/architecture.md)
- Local development and auth setup: [`docs/local-development.md`](docs/local-development.md)
- Infrastructure, deployment, DNS, Supabase, OAuth, Resend, and Cloudinary:
  [`docs/infrastructure.md`](docs/infrastructure.md)
- Agent instructions: [`AGENTS.md`](AGENTS.md)

# Activity Log

Concise record of meaningful project changes. Do not log routine verification,
test sends, site availability checks, or command-only housekeeping.

## 2026-08-24

- Updated the GFEU 2026 public message signature title to `Feast Builder`.

## 2026-07-20

- Reduced public booking proof-of-payment upload validation to 4 MB so oversized files
  are rejected before hitting Netlify's function payload limit.

## 2026-07-06

- Replaced the public booking country/city typeahead allowlist with Europe/UK options
  from the shared `country-state-city` data source so valid cities such as Helsinki can
  be selected.

## 2026-07-04

- Added the GrandFeast Plus October 4 itinerary to the GFEU 2026 public event details.

## 2026-06-27

- Added a public shop image carousel so merchandise products with multiple photos can be
  browsed one image at a time.
- Kept admin merchandise updates on the product edit page and added an inline product-ID
  success notice after saving.
- Refined Jewels 2026 public page responsiveness, hero artwork placement, event details
  alignment, and added a proofread attendee stories carousel.
- Added an explicit Jewels 2026 social preview image and Open Graph/Twitter metadata so
  shared event links render the event artwork instead of falling back to the favicon.
- Added a crawler-safe Jewels 2026 social preview response so Facebook and messenger
  scrapers receive explicit Open Graph image metadata.
- Routed Jewels 2026 social scrapers through a Netlify Edge Function so production
  prerendering cannot strip the event Open Graph image metadata.
- Updated the Jewels 2026 public venue map and Google Maps link to the St. Julian's
  Parish Church location.

## 2026-06-19

- Added the Jewels 2026 public event registry, landing-page implementation, static
  Becoming artwork, and seeded Malta event/ticket data through the existing event,
  ticket type, and inventory tables.
- Added a live Jewels 2026 landing-page countdown and aligned the seeded Malta event
  start time to 1:00 PM on October 31, 2026.
- Added the Jewels 2026 two-day event schedule to the public landing page.
- Added a Jewels 2026 hero Buy Ticket CTA that scrolls visitors to the ticket card.
- Updated the Jewels 2026 public menu to match the standard event nav labels and open the
  public booking route.
- Updated the Jewels 2026 public header title to a two-line conference lockup.
- Guarded closed event booking routes so disabled events cannot render the shared public
  reservation form.
- Opened Jewels 2026 public booking, linked the landing page CTAs to newbooking, and made
  the shared booking screen and booking emails use Jewels-specific event details.
- Replaced the Jewels 2026 hero artwork image with the supplied floral background asset
  and layered the theme title, date strip, countdown, and booking CTA over it.
- Replaced the CSS-rendered Jewels 2026 hero title with the supplied transparent
  Becoming title artwork for an exact match to the event collateral.
- Refined the Jewels 2026 hero details so the date/location floats over the artwork and
  the countdown starts directly with the time blocks.
- Rethemed the Jewels 2026 public booking form with cream, red, blush, and tan surfaces
  instead of the Grand Feast dark-blue booking palette.
- Added Jewels-specific bank transfer details for the public booking form and booking
  payment emails while keeping Grand Feast bank details unchanged.
- Added Jewels-specific support email identity for public booking help text and Jewels
  transactional email templates/sender overrides.
- Standardized the public Jewels event display name to `JEWELS CONFERENCE 2026` and
  sorted event listings by date within each year.
- Extended the Jewels public theme across shared booking status, legal/FAQ, and shop
  pages without changing Grand Feast 2026 page styling.
- Tightened the public booking country/city selectors so typed values must be chosen from
  the dropdown list before the details step can continue.

## 2026-06-16

- Updated Netlify production `EMAIL_FROM` and `EMAIL_REPLY_TO` from the admin mailbox to
  `Grand Feast Europe <help@grandfeast.eu>`, redeployed production, and verified the
  production smoke suite passed.
- Added admin XLSX exports for city ticket-sales totals and generated ticket registration
  lists from the event Reports page.
- Added admin merchandise reservation XLSX export and checkbox-based bulk reservation
  deletion from the merchandise page.
- Added inline validation for public merchandise reservations so missing customer details,
  item quantities, or required size/color selections stay on the shop form instead of
  showing an error page.

## 2026-06-14

- Improved public merchandise image presentation to avoid cropping uploaded product
  photos, added quantity-aware size/color validation on the public shop form, and made
  admin merchandise product IDs link to product detail pages.
- Added explicit customer-name and email browser prompts to the public merchandise
  reservation form.
- Replaced the fixed admin ticket-counter +10 action with a selectable 1-100 ticket
  increment.

## 2026-06-13

- Added event-scoped merchandise management, public shop reservations, merch reservation
  persistence, stock decrementing, audit events, image storage hooks, and customer
  reservation confirmation emails.
- Restricted merchandise categories to T-Shirts, Books, Cards, Bags, and Sweatshirt,
  moved product IDs to database generation, and added a merch image carousel below the
  public ticket cards when product images are available.
- Split admin merchandise management into a product list, dedicated create form, and
  dedicated update form, with local e2e coverage for create, update, and delete.

## 2026-06-07

- Removed 5+ group/family booking discounts from ticket type data and public ticket
  purchase copy.
- Centralized ticket-payment bank transfer details and added Bank of Ireland plus
  BIC/SWIFT details to booking and reminder payment instructions.
- Added explicit PDF handling for admin payment-proof previews and covered PDF receipt
  uploads in local e2e.
- Routed hosted PDF payment-proof uploads through Cloudinary raw-file delivery so admin
  proof links do not hit image/PDF delivery restrictions.
- Added an authenticated admin payment-proof route that signs Cloudinary PDF delivery
  URLs at request time so restricted PDFs can still be previewed or opened by admins.
- Replaced the custom Together visual panel on the GFEU 2026 landing page with the
  provided 2026 poster image.
- Replaced the GFEU 2026 landing page venue/map panel with the provided Ireland venue
  poster image.
- Added persisted booking confirmation email send status fields and surfaced the status
  on admin booking details so failed confirmation sends are visible to operators.
- Added Resend confirmation email delivery tracking so provider webhook events can mark
  booking confirmations as delivered or failed, and clarified admin email success copy.
- Updated GFEU event branding to Grand Feast Europe across public pages, email templates,
  sender examples, and event description data.
- Added the same €5 end-of-August early-bird discount to GrandFeast Plus ticket data and
  public ticket-card display.
- Disabled event-index links for archived or past events while leaving them listed with
  disabled View event controls.
- Added Bro Bo Sanchez as the main event speaker in the GFEU 2026 public landing message.
- Added an admin-only ticket holder name edit action with a `ticket.name_updated` audit
  event for customer-requested corrections, including booking guest-list sync.
- Improved mobile responsiveness for public event headers, hero headings, booking flow
  headings, and bank-transfer review details so narrow webviews do not crop text.

## 2026-06-06

- Documented hosted deployment terminology aliases: `prod`/`production` refer to
  `live-prod`, and `stg`/`staging` refer to `live-dev`.
- Added Playwright e2e regression commands for local, live-dev, and production, with
  production mutation gated behind an explicit booking canary command.
- Documented that local Playwright e2e requires local Supabase, local auth setup, and the
  app server to be running first; agents should ask before starting `make run-local` if
  the runtime is unavailable.
- Documented that hosted Netlify deploys must be triggered through the watched remote Git
  branches (`dev` for live-dev, `prod` for live-prod), with CLI usage limited to
  inspection/configuration rather than manual deploy workarounds.
- Documented that Codex should prefer the native Netlify plugin for deploy inspection and
  fall back to the CLI only when plugin tools are unavailable or insufficient.
- Documented that every live-dev or live-prod deployment must be followed by its
  corresponding hosted e2e suite after Netlify reports the deploy ready.
- Added a local-dev payment-proof upload fallback so local booking e2e can submit without
  Cloudinary credentials while hosted environments still require Cloudinary.
- Documented the live-dev-first deployment rule: `dev` should be equal to or ahead of
  `prod`, and production deploys should promote already-verified live-dev commits.
- Added hosted `ENABLE_EMAIL_PASSWORD_AUTH` support for managed service-account
  password login, plus a production Codex superuser setup helper with local-only secret
  storage.
- Added `bookings.tickets_sent_to_client` so admin ticket email sends persist a
  booking-level `Tickets Email Sent` state and audit the follow-up flag update.
- Added `booking.tickets_email_sent` audit events after successful admin ticket email sends.

## 2026-06-05

- Added a read-only superuser `/admin/global/users` directory for Supabase Auth users
  with tester, admin, superuser, or event-admin grants.
- Added event-admin error styling so 404/error states under `/admin/events/<event_id>`
  keep the admin shell, event context, and admin diagnostics.
- Deferred admin payment proof previews behind `show_payment_proof_image=true` so
  booking detail pages do not load uploaded proof files unless requested.
- Restyled `/signin` with the neutral site-wide admin shell so global auth pages do not
  inherit event-specific public marketing chrome.
- Made event admin dashboard ticket counter cards data-driven from all event counter rows,
  including inactive compatibility ticket types for admin inventory visibility.
- Added first-party Supabase audit events for booking, ticket, and manual counter actions,
  with event/admin history pages that query only after an explicit load-history request.
- Hardened admin detail and history pages for narrow viewports by allowing long
  operational values to wrap and rendering audit history as stacked mobile cards.
- Added a neutral `/admin` directory, superuser-only `/admin/global/events`, and distinct
  admin access semantics for directory, event, and global admin routes.
- Documented the event-scoped public/admin route model and the split between neutral,
  public event-specific, and DB-backed admin event theming.
- Moved UI-facing Svelte components under `src/lib/ui/components/` and updated project
  guidance to distinguish UI components from public event page configuration.
- Gave the `/events` index its own neutral public theme, separate from event-specific
  public landing page themes.
- Added event-specific public landing pages with a `/events` index, keeping 2026 as the
  active ticket sales page and making 2025 an archive-only event page.
- Added DB-backed event theme colors and applied them to event-scoped admin pages so
  admins can visually distinguish which event they are managing.

## 2026-05-31

- Moved public and admin pages to event-scoped routes, with `/` redirecting to the
  default event and admin authorization now checked through Supabase
  `app_metadata.event_roles`.
- Hardened live-dev Supabase session lookup so stale or malformed auth cookies are treated
  as signed out instead of surfacing as a generic 500, with server-side error logging.
- Limited browser-facing auth data to a minimal public session so Google provider tokens
  and identity payloads are not serialized into SvelteKit page data.
- Added live-dev/local error diagnostics to public error pages so browser-visible 500s
  include status, path, message, and stack details without exposing them in production.
- Added early client-side error capture so live-dev browser 500 pages can display
  hydration/runtime failures that do not reach server logs.
- Added a SvelteKit client `handleError` hook so handled client navigation/render
  failures are returned into live-dev error page diagnostics.
- Removed the heavy `country-state-city` import from the public booking page hydration path,
  replacing it with lightweight country/city text suggestions for mobile stability.
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
  from `Grand Feast Europe <help@grandfeast.eu>`.
- Redeployed live dev from the `dev` branch after the Resend migration.
- Added local Supabase Google OAuth provider configuration using env-based client
  credentials.
- Added a local role-grant helper for Supabase Auth onboarding.
- Expanded first-time local auth setup and troubleshooting runbooks for agents.
- Granted co-developer hosted Supabase app roles in live dev and production.
- Added local-only Supabase email/password auth setup for offline-friendly development.
- Prefilled local-only sign-in with the default admin credentials.

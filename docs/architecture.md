# Architecture Map

This document uses C4-style views to make the codebase easier to navigate. It is not an
exhaustive inventory of every route or class. Instead, it shows the main runtime
boundaries, dependency direction, and flows that explain where new work usually belongs.

Visual overview:
[`grand-feast-architecture-infographic-v2.png`](grand-feast-architecture-infographic-v2.png).

Booking flow overview:
[`booking-flow-infographic-v1.png`](booking-flow-infographic-v1.png).

## Level 1: System Context

```mermaid
flowchart LR
    visitor["Public visitor"]
    admin["Admin or superuser"]
    tester["Live-dev tester"]
    developer["Developer"]

    app["Grand Feast ticketing app\nSvelteKit on Netlify"]

    supabaseAuth["Supabase Auth\nGoogle OAuth and local auth"]
    supabaseData["Supabase Postgres\nschema: grandfeasteu"]
    google["Google OAuth"]
    resend["Resend\ntransactional email"]
    cloudinary["Cloudinary\nQR image storage"]
    paypal["PayPal.me\nmanual payment link"]
    cloudflare["Cloudflare\nDNS and dev proxy"]

    visitor -->|"Reserve tickets and view public pages"| app
    admin -->|"Manage bookings, tickets, counters, reports, and system settings"| app
    tester -->|"Access protected live-dev public and admin routes"| app
    developer -->|"Runs local app and Supabase CLI stack"| app

    app -->|"Sign-in and session cookies"| supabaseAuth
    supabaseAuth -->|"Delegates hosted sign-in"| google
    app -->|"Server-side service-role data access"| supabaseData
    app -->|"Sends booking confirmations, reminders, and ticket emails"| resend
    app -->|"Uploads generated QR code images"| cloudinary
    app -->|"Embeds payment URL in booking email"| paypal
    cloudflare -->|"Routes grandfeast.eu and dev.grandfeast.eu traffic"| app
```

## Level 2: Container View

```mermaid
flowchart TB
    browser["Browser\nSvelte pages and forms"]

    subgraph netlify["Netlify runtime"]
        hooks["hooks.server.ts\nbootstrap, CSRF, Supabase SSR, access policy"]
        routes["src/routes\nSvelteKit loads, actions, and callback route"]
        http["src/lib/server/http\nservice composition, guards, form parsing, error mapping"]
        appServices["src/lib/application/services\nbooking, tickets, counters, notifications, reports, system"]
        domain["src/lib/domain\nbusiness rules and domain types"]
        infra["src/lib/infrastructure\nSupabase, auth, email, media, logging, config, bootstrap"]
    end

    subgraph supabase["Supabase"]
        auth["Auth\nsessions and app_metadata.roles"]
        data["Postgres Data API\ngrandfeasteu bookings, tickets, ticket_counters"]
        rpc["Postgres RPC\nreservation, payment, cancellation, ticket append"]
    end

    providers["External providers\nGoogle OAuth, Resend, Cloudinary, PayPal"]

    browser -->|"HTTP requests, form actions, cookies"| hooks
    hooks --> routes
    routes --> http
    http --> appServices
    appServices --> domain
    appServices -->|"Ports"| infra
    infra --> auth
    infra --> data
    infra --> rpc
    infra --> providers
```

## Level 3: Main Code Components

```mermaid
flowchart LR
    routes["src/routes\nroute UI, loads, actions"]
    components["src/lib/components\npublic and admin Svelte components"]
    navigation["src/lib/navigation\nroute metadata"]

    http["src/lib/server/http\nhandlers, guards, forms, services"]
    services["src/lib/application/services\nuse-case orchestration"]
    ports["src/lib/application/ports.ts\nrepository and provider contracts"]
    domain["src/lib/domain\nbooking, ticket, counter, user rules"]

    infraAuth["infrastructure/auth\nsession and access policy helpers"]
    infraDb["infrastructure/db/supabase\nrepositories, mappers, schema, client"]
    infraEmail["infrastructure/email\nResendEmailSender"]
    infraMedia["infrastructure/media\nQR generator and Cloudinary storage"]
    infraConfig["infrastructure/config\nenv.server.ts"]
    infraBootstrap["infrastructure/bootstrap\nstartup counter initialization"]
    infraSystem["infrastructure/system\nsystem settings store"]
    infraLogging["infrastructure/logging\nlogger and event logger"]

    routes --> components
    routes --> navigation
    routes --> http

    http --> services
    http --> infraAuth
    http --> infraConfig

    services --> domain
    services --> ports

    infraDb -.implements.-> ports
    infraEmail -.implements.-> ports
    infraMedia -.implements.-> ports
    infraSystem -.implements.-> ports
    infraLogging -.implements.-> ports

    infraBootstrap --> services
    infraBootstrap --> infraConfig
```

## Dependency Rules

- `src/routes/` adapts HTTP, page load, and form action concerns into application calls.
- `src/lib/components/` renders UI and should not own persistence or provider logic.
- `src/lib/application/services/` coordinates use cases and depends on domain rules plus
  ports.
- `src/lib/domain/` stays framework-light and should not import SvelteKit, Supabase,
  Resend, Cloudinary, or environment configuration.
- `src/lib/infrastructure/` contains concrete adapters for databases, auth, email, media,
  config, logging, bootstrap, and system settings.
- `src/lib/server/http/services.ts` is the composition root for ready-to-use services.
- Cross-cutting HTTP behavior belongs in `hooks.server.ts` and `src/lib/server/http/`, not
  copied across route files.

In short:

```txt
routes/components -> server/http -> application services -> domain
                                      application services -> ports <- infrastructure
```

## Key Flow: Booking Reservation

```mermaid
sequenceDiagram
    actor Visitor
    participant Page as /newbooking page action
    participant Form as parseCreateBookingForm
    participant Booking as BookingService
    participant Counter as TicketCounterService
    participant Repo as SupabaseBookingRepository
    participant RPC as Supabase RPC create_booking_reservation
    participant Email as NotificationService and Resend
    participant Log as EventLogger

    Visitor->>Page: Submit reservation form
    Page->>Form: Parse and validate form shape
    Form-->>Page: CreateBookingInput
    Page->>Booking: createNew(input)
    Booking->>Counter: getByTicketType(ticket_type)
    Counter-->>Booking: current inventory counter
    Booking->>Booking: apply domain validation and compute total
    Booking->>Repo: insertReservation(booking)
    Repo->>RPC: create booking and reserve inventory for APP_EVENT_ID
    RPC-->>Repo: persisted booking row
    Repo-->>Booking: Booking
    Booking->>Email: sendBookingConfirmation(booking)
    Email-->>Visitor: Reservation email with payment instructions
    Booking->>Log: BOOKING_RESERVATION_CREATED
    Page-->>Visitor: Redirect to success page
```

## Key Flow: Paid Booking To Tickets

```mermaid
sequenceDiagram
    actor Admin
    actor Contact as Booking contact
    participant Route as Admin booking route action
    participant Guard as adminAction and guards
    participant Booking as BookingService
    participant Ticket as TicketService
    participant QR as QrCodeGenerator
    participant Storage as CloudinaryImageStorage
    participant TicketRepo as SupabaseTicketRepository
    participant BookingRepo as SupabaseBookingRepository
    participant Email as NotificationService and Resend

    Admin->>Route: Mark booking paid or generate tickets
    Route->>Guard: Require admin-level access
    Guard-->>Route: Authorized session user
    Route->>Booking: markPaid(reference_no)
    Booking->>BookingRepo: mark_booking_paid RPC
    BookingRepo-->>Booking: paid state persisted
    Route->>Booking: generateRelatedTickets(reference_no)
    Booking->>Ticket: createNew(guest ticket input)
    Ticket->>QR: generate check-in QR for app URL
    QR-->>Ticket: QR image data
    Ticket->>Storage: uploadImage(imageData)
    Storage-->>Ticket: hosted QR image URL
    Ticket->>TicketRepo: insert(ticket)
    Ticket-->>Booking: Ticket
    Booking->>BookingRepo: append_booking_ticket_id RPC
    Route->>Email: sendTicketsEmail(reference_no)
    Email-->>Contact: Tickets emailed to booking contact
```

## Runtime Access Model

```mermaid
flowchart TB
    request["Incoming request"]
    hooks["hooks.server.ts"]
    mode["getRuntimeAccessMode\nproduction, local, or live-dev"]
    required["getRequiredAccess\npublic, tester, admin"]
    session["Supabase getUser/getSession"]
    roles["app_metadata.roles"]
    allowed["Allow request"]
    signin["Redirect to /signin?redirectTo=..."]
    denied["Redirect to /unauthorized"]

    request --> hooks
    hooks --> mode
    mode --> required
    required -->|"bypass"| allowed
    required -->|"needs tester/admin"| session
    session -->|"signed out"| signin
    session -->|"signed in"| roles
    roles -->|"role policy passes"| allowed
    roles -->|"role policy fails"| denied
```

Access policy summary:

- Production and local public pages are open.
- Production and local `/api` routes require `admin` or `superuser`.
- Live development public pages require `tester`.
- Live development `/api` routes require `tester` plus `admin` or `superuser`.
- Role checks use Supabase Auth `app_metadata.roles`, not user-editable metadata.

## Where To Put New Work

- New public or admin screens: start in `src/routes/`, reuse components from
  `src/lib/components/`, and call application services through `src/lib/server/http/`.
- New business rules: put the rule in `src/lib/domain/` first, with co-located tests.
- New use cases: add or extend an application service in `src/lib/application/services/`.
- New database behavior: add a port if the application needs a new capability, then
  implement it in `src/lib/infrastructure/db/supabase/`.
- New provider integration: define the application-facing contract in
  `src/lib/application/ports.ts`, then implement the provider in `src/lib/infrastructure/`.
- New auth or HTTP cross-cutting behavior: prefer `hooks.server.ts` or
  `src/lib/server/http/` so routes stay thin.

For environment, deployment, DNS, Supabase, OAuth, Resend, and Cloudinary details, read
[`docs/infrastructure.md`](infrastructure.md).

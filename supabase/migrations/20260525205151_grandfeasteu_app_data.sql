create table if not exists public.grandfeasteu_bookings (
	event_id text not null default 'gfeu2025',
	reference_no text not null,
	name text not null,
	email text not null,
	city text not null default '',
	ticket_type text not null check (ticket_type in ('STANDARD', 'VIP', 'YOUTH')),
	book_date timestamptz not null,
	payment_status text not null check (
		payment_status in ('UNPAID', 'PAID', 'BOOKING_RESERVATION_CANCELLED')
	),
	amount_total numeric(10, 2) not null check (amount_total >= 0),
	guests text[] not null default '{}',
	ticket_ids text[] not null default '{}',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (event_id, reference_no)
);

create table if not exists public.grandfeasteu_tickets (
	event_id text not null default 'gfeu2025',
	ticket_id text not null,
	name text not null,
	ticket_type text not null check (ticket_type in ('STANDARD', 'VIP', 'YOUTH')),
	description text not null default '',
	status text not null check (status in ('CREATED', 'CHECKED_IN', 'CHECKED_OUT')),
	is_paid boolean not null default false,
	booking_reference_no text not null,
	checkin_qr_code_image_url text not null default '',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (event_id, ticket_id),
	constraint grandfeasteu_tickets_booking_fk
		foreign key (event_id, booking_reference_no)
		references public.grandfeasteu_bookings (event_id, reference_no)
		on update cascade
		on delete cascade
);

create table if not exists public.grandfeasteu_ticket_counters (
	event_id text not null default 'gfeu2025',
	counter_id text not null,
	available integer not null default 0 check (available >= 0),
	reserved integer not null default 0 check (reserved >= 0),
	sold integer not null default 0 check (sold >= 0),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (event_id, counter_id)
);

create index if not exists grandfeasteu_bookings_book_date_idx
	on public.grandfeasteu_bookings (event_id, book_date desc);

create index if not exists grandfeasteu_tickets_booking_reference_idx
	on public.grandfeasteu_tickets (event_id, booking_reference_no);

create or replace function public.grandfeasteu_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists grandfeasteu_bookings_set_updated_at
	on public.grandfeasteu_bookings;
create trigger grandfeasteu_bookings_set_updated_at
	before update on public.grandfeasteu_bookings
	for each row execute function public.grandfeasteu_set_updated_at();

drop trigger if exists grandfeasteu_tickets_set_updated_at
	on public.grandfeasteu_tickets;
create trigger grandfeasteu_tickets_set_updated_at
	before update on public.grandfeasteu_tickets
	for each row execute function public.grandfeasteu_set_updated_at();

drop trigger if exists grandfeasteu_ticket_counters_set_updated_at
	on public.grandfeasteu_ticket_counters;
create trigger grandfeasteu_ticket_counters_set_updated_at
	before update on public.grandfeasteu_ticket_counters
	for each row execute function public.grandfeasteu_set_updated_at();

create or replace function public.grandfeasteu_increment_ticket_counter(
	p_event_id text,
	p_counter_id text,
	p_available_delta integer,
	p_reserved_delta integer,
	p_sold_delta integer
)
returns public.grandfeasteu_ticket_counters
language plpgsql
security definer
set search_path = public
as $$
declare
	updated_counter public.grandfeasteu_ticket_counters;
begin
	update public.grandfeasteu_ticket_counters
	set
		available = available + p_available_delta,
		reserved = reserved + p_reserved_delta,
		sold = sold + p_sold_delta
	where event_id = p_event_id
		and counter_id = p_counter_id
		and available + p_available_delta >= 0
		and reserved + p_reserved_delta >= 0
		and sold + p_sold_delta >= 0
	returning * into updated_counter;

	if not found then
		raise exception
			'grandfeasteu ticket counter update failed for event_id %, counter_id %',
			p_event_id,
			p_counter_id
			using errcode = 'P0001';
	end if;

	return updated_counter;
end;
$$;

alter table public.grandfeasteu_bookings enable row level security;
alter table public.grandfeasteu_tickets enable row level security;
alter table public.grandfeasteu_ticket_counters enable row level security;

revoke all on public.grandfeasteu_bookings from anon, authenticated;
revoke all on public.grandfeasteu_tickets from anon, authenticated;
revoke all on public.grandfeasteu_ticket_counters from anon, authenticated;
revoke execute on function public.grandfeasteu_increment_ticket_counter(
	text,
	text,
	integer,
	integer,
	integer
) from public, anon, authenticated;

grant all on public.grandfeasteu_bookings to service_role;
grant all on public.grandfeasteu_tickets to service_role;
grant all on public.grandfeasteu_ticket_counters to service_role;
grant execute on function public.grandfeasteu_increment_ticket_counter(
	text,
	text,
	integer,
	integer,
	integer
) to service_role;

create schema if not exists grandfeasteu;

alter table if exists public.grandfeasteu_bookings
	set schema grandfeasteu;
alter table if exists public.grandfeasteu_ticket_counters
	set schema grandfeasteu;
alter table if exists public.grandfeasteu_tickets
	set schema grandfeasteu;

alter table if exists grandfeasteu.grandfeasteu_bookings
	rename to bookings;
alter table if exists grandfeasteu.grandfeasteu_ticket_counters
	rename to ticket_counters;
alter table if exists grandfeasteu.grandfeasteu_tickets
	rename to tickets;

alter index if exists grandfeasteu.grandfeasteu_bookings_pkey
	rename to bookings_pkey;
alter index if exists grandfeasteu.grandfeasteu_ticket_counters_pkey
	rename to ticket_counters_pkey;
alter index if exists grandfeasteu.grandfeasteu_tickets_pkey
	rename to tickets_pkey;
alter index if exists grandfeasteu.grandfeasteu_bookings_book_date_idx
	rename to bookings_book_date_idx;
alter index if exists grandfeasteu.grandfeasteu_tickets_booking_reference_idx
	rename to tickets_booking_reference_idx;

alter table if exists grandfeasteu.tickets
	rename constraint grandfeasteu_tickets_booking_fk to tickets_booking_fk;

drop trigger if exists grandfeasteu_bookings_set_updated_at on grandfeasteu.bookings;
drop trigger if exists grandfeasteu_ticket_counters_set_updated_at on grandfeasteu.ticket_counters;
drop trigger if exists grandfeasteu_tickets_set_updated_at on grandfeasteu.tickets;

drop function if exists public.grandfeasteu_set_updated_at() cascade;
drop function if exists public.grandfeasteu_counter_id_for_ticket_type(text);
drop function if exists public.grandfeasteu_create_booking_reservation(
	text,
	text,
	text,
	text,
	text,
	text,
	timestamptz,
	numeric,
	text[]
);
drop function if exists public.grandfeasteu_mark_booking_paid(text, text);
drop function if exists public.grandfeasteu_cancel_booking_reservation(text, text);
drop function if exists public.grandfeasteu_append_booking_ticket_id(text, text, text);
drop function if exists public.grandfeasteu_increment_ticket_counter(
	text,
	text,
	integer,
	integer,
	integer
);

create or replace function grandfeasteu.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

create trigger bookings_set_updated_at
	before update on grandfeasteu.bookings
	for each row execute function grandfeasteu.set_updated_at();

create trigger ticket_counters_set_updated_at
	before update on grandfeasteu.ticket_counters
	for each row execute function grandfeasteu.set_updated_at();

create trigger tickets_set_updated_at
	before update on grandfeasteu.tickets
	for each row execute function grandfeasteu.set_updated_at();

create or replace function grandfeasteu.counter_id_for_ticket_type(
	p_ticket_type text
)
returns text
language sql
immutable
set search_path = ''
as $$
	select case p_ticket_type
		when 'STANDARD' then 'standard_tickets'
		when 'VIP' then 'vip_tickets'
		when 'YOUTH' then 'youth_tickets'
		else null
	end;
$$;

create or replace function grandfeasteu.increment_ticket_counter(
	p_event_id text,
	p_counter_id text,
	p_available_delta integer,
	p_reserved_delta integer,
	p_sold_delta integer
)
returns grandfeasteu.ticket_counters
language plpgsql
security invoker
set search_path = ''
as $$
declare
	updated_counter grandfeasteu.ticket_counters;
begin
	update grandfeasteu.ticket_counters
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
			'ticket counter update failed for event_id %, counter_id %',
			p_event_id,
			p_counter_id
			using errcode = 'P0001';
	end if;

	return updated_counter;
end;
$$;

create or replace function grandfeasteu.create_booking_reservation(
	p_event_id text,
	p_reference_no text,
	p_name text,
	p_email text,
	p_city text,
	p_ticket_type text,
	p_book_date timestamptz,
	p_amount_total numeric,
	p_guests text[]
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	created_booking grandfeasteu.bookings;
	ticket_count integer := cardinality(p_guests);
	v_counter_id text := grandfeasteu.counter_id_for_ticket_type(p_ticket_type);
begin
	if ticket_count is null or ticket_count < 1 then
		raise exception 'booking reservation requires at least one guest'
			using errcode = 'P0001';
	end if;

	if v_counter_id is null then
		raise exception 'invalid ticket_type %', p_ticket_type
			using errcode = 'P0001';
	end if;

	update grandfeasteu.ticket_counters
	set
		available = available - ticket_count,
		reserved = reserved + ticket_count
	where event_id = p_event_id
		and counter_id = v_counter_id
		and available - ticket_count >= 0;

	if not found then
		raise exception
			'not enough available tickets for event_id %, ticket_type %',
			p_event_id,
			p_ticket_type
			using errcode = 'P0001';
	end if;

	insert into grandfeasteu.bookings (
		event_id,
		reference_no,
		name,
		email,
		city,
		ticket_type,
		book_date,
		payment_status,
		amount_total,
		guests,
		ticket_ids
	)
	values (
		p_event_id,
		p_reference_no,
		p_name,
		p_email,
		p_city,
		p_ticket_type,
		p_book_date,
		'UNPAID',
		p_amount_total,
		p_guests,
		'{}'
	)
	returning * into created_booking;

	return created_booking;
end;
$$;

create or replace function grandfeasteu.mark_booking_paid(
	p_event_id text,
	p_reference_no text
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	target_booking grandfeasteu.bookings;
	updated_booking grandfeasteu.bookings;
	ticket_count integer;
	v_counter_id text;
begin
	select * into target_booking
	from grandfeasteu.bookings
	where event_id = p_event_id
		and reference_no = p_reference_no
	for update;

	if not found then
		raise exception
			'booking not found for event_id %, reference_no %',
			p_event_id,
			p_reference_no
			using errcode = 'P0001';
	end if;

	if target_booking.payment_status <> 'UNPAID' then
		raise exception
			'booking % is not unpaid',
			p_reference_no
			using errcode = 'P0001';
	end if;

	ticket_count := cardinality(target_booking.guests);
	v_counter_id := grandfeasteu.counter_id_for_ticket_type(target_booking.ticket_type);

	update grandfeasteu.ticket_counters
	set
		reserved = reserved - ticket_count,
		sold = sold + ticket_count
	where event_id = p_event_id
		and counter_id = v_counter_id
		and reserved - ticket_count >= 0;

	if not found then
		raise exception
			'not enough reserved tickets for event_id %, ticket_type %',
			p_event_id,
			target_booking.ticket_type
			using errcode = 'P0001';
	end if;

	update grandfeasteu.bookings
	set payment_status = 'PAID'
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	return updated_booking;
end;
$$;

create or replace function grandfeasteu.cancel_booking_reservation(
	p_event_id text,
	p_reference_no text
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	target_booking grandfeasteu.bookings;
	updated_booking grandfeasteu.bookings;
	ticket_count integer;
	v_counter_id text;
begin
	select * into target_booking
	from grandfeasteu.bookings
	where event_id = p_event_id
		and reference_no = p_reference_no
	for update;

	if not found then
		raise exception
			'booking not found for event_id %, reference_no %',
			p_event_id,
			p_reference_no
			using errcode = 'P0001';
	end if;

	if target_booking.payment_status <> 'UNPAID' then
		raise exception
			'booking % is not unpaid',
			p_reference_no
			using errcode = 'P0001';
	end if;

	ticket_count := cardinality(target_booking.guests);
	v_counter_id := grandfeasteu.counter_id_for_ticket_type(target_booking.ticket_type);

	update grandfeasteu.ticket_counters
	set
		available = available + ticket_count,
		reserved = reserved - ticket_count
	where event_id = p_event_id
		and counter_id = v_counter_id
		and reserved - ticket_count >= 0;

	if not found then
		raise exception
			'not enough reserved tickets for event_id %, ticket_type %',
			p_event_id,
			target_booking.ticket_type
			using errcode = 'P0001';
	end if;

	update grandfeasteu.bookings
	set payment_status = 'BOOKING_RESERVATION_CANCELLED'
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	return updated_booking;
end;
$$;

create or replace function grandfeasteu.append_booking_ticket_id(
	p_event_id text,
	p_reference_no text,
	p_ticket_id text
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	updated_booking grandfeasteu.bookings;
begin
	update grandfeasteu.bookings
	set ticket_ids = array_append(ticket_ids, p_ticket_id)
	where event_id = p_event_id
		and reference_no = p_reference_no
		and not (p_ticket_id = any(ticket_ids))
	returning * into updated_booking;

	if not found then
		raise exception
			'booking ticket append failed for event_id %, reference_no %, ticket_id %',
			p_event_id,
			p_reference_no,
			p_ticket_id
			using errcode = 'P0001';
	end if;

	return updated_booking;
end;
$$;

alter table grandfeasteu.bookings enable row level security;
alter table grandfeasteu.tickets enable row level security;
alter table grandfeasteu.ticket_counters enable row level security;

revoke all on schema grandfeasteu from public, anon, authenticated;
revoke all on all tables in schema grandfeasteu from public, anon, authenticated;
revoke all on all routines in schema grandfeasteu from public, anon, authenticated;
revoke all on all sequences in schema grandfeasteu from public, anon, authenticated;

grant usage on schema grandfeasteu to service_role;
grant all on all tables in schema grandfeasteu to service_role;
grant all on all routines in schema grandfeasteu to service_role;
grant all on all sequences in schema grandfeasteu to service_role;

alter default privileges for role postgres in schema grandfeasteu
	grant all on tables to service_role;
alter default privileges for role postgres in schema grandfeasteu
	grant all on routines to service_role;
alter default privileges for role postgres in schema grandfeasteu
	grant all on sequences to service_role;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, grandfeasteu';
notify pgrst, 'reload config';

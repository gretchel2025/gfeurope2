create or replace function public.grandfeasteu_counter_id_for_ticket_type(
	p_ticket_type text
)
returns text
language sql
immutable
set search_path = public
as $$
	select case p_ticket_type
		when 'STANDARD' then 'standard_tickets'
		when 'VIP' then 'vip_tickets'
		when 'YOUTH' then 'youth_tickets'
		else null
	end;
$$;

create or replace function public.grandfeasteu_create_booking_reservation(
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
returns public.grandfeasteu_bookings
language plpgsql
security invoker
set search_path = public
as $$
declare
	created_booking public.grandfeasteu_bookings;
	ticket_count integer := cardinality(p_guests);
	v_counter_id text := public.grandfeasteu_counter_id_for_ticket_type(p_ticket_type);
begin
	if ticket_count is null or ticket_count < 1 then
		raise exception 'booking reservation requires at least one guest'
			using errcode = 'P0001';
	end if;

	if v_counter_id is null then
		raise exception 'invalid ticket_type %', p_ticket_type
			using errcode = 'P0001';
	end if;

	update public.grandfeasteu_ticket_counters
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

	insert into public.grandfeasteu_bookings (
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

create or replace function public.grandfeasteu_mark_booking_paid(
	p_event_id text,
	p_reference_no text
)
returns public.grandfeasteu_bookings
language plpgsql
security invoker
set search_path = public
as $$
declare
	target_booking public.grandfeasteu_bookings;
	updated_booking public.grandfeasteu_bookings;
	ticket_count integer;
	v_counter_id text;
begin
	select * into target_booking
	from public.grandfeasteu_bookings
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
	v_counter_id := public.grandfeasteu_counter_id_for_ticket_type(target_booking.ticket_type);

	update public.grandfeasteu_ticket_counters
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

	update public.grandfeasteu_bookings
	set payment_status = 'PAID'
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	return updated_booking;
end;
$$;

create or replace function public.grandfeasteu_cancel_booking_reservation(
	p_event_id text,
	p_reference_no text
)
returns public.grandfeasteu_bookings
language plpgsql
security invoker
set search_path = public
as $$
declare
	target_booking public.grandfeasteu_bookings;
	updated_booking public.grandfeasteu_bookings;
	ticket_count integer;
	v_counter_id text;
begin
	select * into target_booking
	from public.grandfeasteu_bookings
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
	v_counter_id := public.grandfeasteu_counter_id_for_ticket_type(target_booking.ticket_type);

	update public.grandfeasteu_ticket_counters
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

	update public.grandfeasteu_bookings
	set payment_status = 'BOOKING_RESERVATION_CANCELLED'
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	return updated_booking;
end;
$$;

revoke execute on function public.grandfeasteu_counter_id_for_ticket_type(text)
	from public, anon, authenticated;
revoke execute on function public.grandfeasteu_create_booking_reservation(
	text,
	text,
	text,
	text,
	text,
	text,
	timestamptz,
	numeric,
	text[]
) from public, anon, authenticated;
revoke execute on function public.grandfeasteu_mark_booking_paid(text, text)
	from public, anon, authenticated;
revoke execute on function public.grandfeasteu_cancel_booking_reservation(text, text)
	from public, anon, authenticated;

grant execute on function public.grandfeasteu_counter_id_for_ticket_type(text) to service_role;
grant execute on function public.grandfeasteu_create_booking_reservation(
	text,
	text,
	text,
	text,
	text,
	text,
	timestamptz,
	numeric,
	text[]
) to service_role;
grant execute on function public.grandfeasteu_mark_booking_paid(text, text) to service_role;
grant execute on function public.grandfeasteu_cancel_booking_reservation(text, text) to service_role;

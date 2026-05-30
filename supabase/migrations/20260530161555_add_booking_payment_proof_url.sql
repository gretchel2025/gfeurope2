alter table if exists grandfeasteu.bookings
	add column if not exists payment_proof_url text;

drop function if exists grandfeasteu.create_booking_reservation(
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

create or replace function grandfeasteu.create_booking_reservation(
	p_event_id text,
	p_reference_no text,
	p_name text,
	p_email text,
	p_city text,
	p_ticket_type text,
	p_book_date timestamptz,
	p_amount_total numeric,
	p_guests text[],
	p_payment_proof_url text
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
		ticket_ids,
		payment_proof_url
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
		'{}',
		p_payment_proof_url
	)
	returning * into created_booking;

	return created_booking;
end;
$$;

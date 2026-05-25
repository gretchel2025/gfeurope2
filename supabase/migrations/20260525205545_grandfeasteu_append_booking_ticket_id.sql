create or replace function public.grandfeasteu_append_booking_ticket_id(
	p_event_id text,
	p_reference_no text,
	p_ticket_id text
)
returns public.grandfeasteu_bookings
language plpgsql
security definer
set search_path = public
as $$
declare
	updated_booking public.grandfeasteu_bookings;
begin
	update public.grandfeasteu_bookings
	set ticket_ids = case
		when p_ticket_id = any(ticket_ids) then ticket_ids
		else array_append(ticket_ids, p_ticket_id)
	end
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	if not found then
		raise exception
			'grandfeasteu booking ticket append failed for event_id %, reference_no %',
			p_event_id,
			p_reference_no
			using errcode = 'P0001';
	end if;

	return updated_booking;
end;
$$;

revoke execute on function public.grandfeasteu_append_booking_ticket_id(
	text,
	text,
	text
) from public, anon, authenticated;

grant execute on function public.grandfeasteu_append_booking_ticket_id(
	text,
	text,
	text
) to service_role;

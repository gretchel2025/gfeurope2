alter table if exists grandfeasteu.bookings
	add column if not exists tickets_sent_to_client boolean not null default false;

update grandfeasteu.bookings as booking
set tickets_sent_to_client = true
where exists (
	select 1
	from grandfeasteu.audit_events as audit_event
	where audit_event.event_id = booking.event_id
		and audit_event.entity_type = 'booking'
		and audit_event.entity_id = booking.reference_no
		and audit_event.action = 'booking.tickets_email_sent'
);

create or replace function grandfeasteu.mark_booking_tickets_sent_to_client(
	p_event_id text,
	p_reference_no text
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
	set tickets_sent_to_client = true
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	if not found then
		raise exception
			'booking tickets sent update failed for event_id %, reference_no %',
			p_event_id,
			p_reference_no
			using errcode = 'P0001';
	end if;

	return updated_booking;
end;
$$;

revoke execute on function grandfeasteu.mark_booking_tickets_sent_to_client(
	text,
	text
) from public, anon, authenticated;

grant execute on function grandfeasteu.mark_booking_tickets_sent_to_client(
	text,
	text
) to service_role;

notify pgrst, 'reload schema';

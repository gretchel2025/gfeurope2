create or replace function grandfeasteu.update_booking_confirmation_email_delivery_status(
	p_provider_message_id text,
	p_status text,
	p_error text default null,
	p_provider_event_at timestamptz default null
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	updated_booking grandfeasteu.bookings;
begin
	if p_status not in ('DELIVERED', 'FAILED') then
		raise exception 'invalid booking confirmation email delivery status %', p_status
			using errcode = 'P0001';
	end if;

	update grandfeasteu.bookings
	set
		booking_confirmation_email_status = p_status,
		booking_confirmation_email_status_updated_at = coalesce(p_provider_event_at, now()),
		booking_confirmation_email_error = case
			when p_status = 'FAILED' then nullif(left(coalesce(p_error, 'email delivery failed'), 500), '')
			else null
		end
	where booking_confirmation_email_provider_id = p_provider_message_id
	returning * into updated_booking;

	return updated_booking;
end;
$$;

revoke execute on function grandfeasteu.update_booking_confirmation_email_delivery_status(
	text,
	text,
	text,
	timestamptz
) from public, anon, authenticated;

grant execute on function grandfeasteu.update_booking_confirmation_email_delivery_status(
	text,
	text,
	text,
	timestamptz
) to service_role;

notify pgrst, 'reload schema';

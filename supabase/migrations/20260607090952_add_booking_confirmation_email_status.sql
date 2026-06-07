alter table if exists grandfeasteu.bookings
	add column if not exists booking_confirmation_email_status text not null default 'PENDING',
	add column if not exists booking_confirmation_email_attempted_at timestamptz,
	add column if not exists booking_confirmation_email_error text,
	add constraint bookings_confirmation_email_status_check
		check (
			booking_confirmation_email_status in (
				'PENDING',
				'SENT',
				'FAILED',
				'SKIPPED',
				'UNKNOWN'
			)
		);

update grandfeasteu.bookings
set booking_confirmation_email_status = 'UNKNOWN'
where booking_confirmation_email_attempted_at is null
	and booking_confirmation_email_error is null
	and booking_confirmation_email_status = 'PENDING';

create or replace function grandfeasteu.update_booking_confirmation_email_status(
	p_event_id text,
	p_reference_no text,
	p_status text,
	p_error text default null
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	updated_booking grandfeasteu.bookings;
begin
	if p_status not in ('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'UNKNOWN') then
		raise exception 'invalid booking confirmation email status %', p_status
			using errcode = 'P0001';
	end if;

	update grandfeasteu.bookings
	set
		booking_confirmation_email_status = p_status,
		booking_confirmation_email_attempted_at = now(),
		booking_confirmation_email_error = case
			when p_status = 'FAILED' then nullif(left(coalesce(p_error, 'email send failed'), 500), '')
			else null
		end
	where event_id = p_event_id
		and reference_no = p_reference_no
	returning * into updated_booking;

	if not found then
		raise exception
			'booking confirmation email status update failed for event_id %, reference_no %',
			p_event_id,
			p_reference_no
			using errcode = 'P0001';
	end if;

	return updated_booking;
end;
$$;

revoke execute on function grandfeasteu.update_booking_confirmation_email_status(
	text,
	text,
	text,
	text
) from public, anon, authenticated;

grant execute on function grandfeasteu.update_booking_confirmation_email_status(
	text,
	text,
	text,
	text
) to service_role;

notify pgrst, 'reload schema';

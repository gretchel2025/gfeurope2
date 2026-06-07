alter table if exists grandfeasteu.bookings
	add column if not exists booking_confirmation_email_provider_id text,
	add column if not exists booking_confirmation_email_status_updated_at timestamptz;

alter table if exists grandfeasteu.bookings
	drop constraint if exists bookings_confirmation_email_status_check;

alter table if exists grandfeasteu.bookings
	add constraint bookings_confirmation_email_status_check
		check (
			booking_confirmation_email_status in (
				'PENDING',
				'SENT',
				'DELIVERED',
				'FAILED',
				'SKIPPED',
				'UNKNOWN'
			)
		);

create unique index if not exists bookings_confirmation_email_provider_id_idx
	on grandfeasteu.bookings (booking_confirmation_email_provider_id)
	where booking_confirmation_email_provider_id is not null;

drop function if exists grandfeasteu.update_booking_confirmation_email_status(
	text,
	text,
	text,
	text
);

create or replace function grandfeasteu.update_booking_confirmation_email_status(
	p_event_id text,
	p_reference_no text,
	p_status text,
	p_error text default null,
	p_provider_message_id text default null
)
returns grandfeasteu.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
	updated_booking grandfeasteu.bookings;
begin
	if p_status not in ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED', 'UNKNOWN') then
		raise exception 'invalid booking confirmation email status %', p_status
			using errcode = 'P0001';
	end if;

	update grandfeasteu.bookings
	set
		booking_confirmation_email_status = p_status,
		booking_confirmation_email_attempted_at = now(),
		booking_confirmation_email_status_updated_at = now(),
		booking_confirmation_email_provider_id = case
			when p_provider_message_id is null then booking_confirmation_email_provider_id
			else nullif(left(p_provider_message_id, 200), '')
		end,
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

	if not found then
		raise exception 'booking confirmation email delivery update failed for provider message id %',
			p_provider_message_id
			using errcode = 'P0001';
	end if;

	return updated_booking;
end;
$$;

revoke execute on function grandfeasteu.update_booking_confirmation_email_status(
	text,
	text,
	text,
	text,
	text
) from public, anon, authenticated;

revoke execute on function grandfeasteu.update_booking_confirmation_email_delivery_status(
	text,
	text,
	text,
	timestamptz
) from public, anon, authenticated;

grant execute on function grandfeasteu.update_booking_confirmation_email_status(
	text,
	text,
	text,
	text,
	text
) to service_role;

grant execute on function grandfeasteu.update_booking_confirmation_email_delivery_status(
	text,
	text,
	text,
	timestamptz
) to service_role;

notify pgrst, 'reload schema';

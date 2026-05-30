create table if not exists grandfeasteu.events (
	event_id text primary key,
	title text not null,
	short_description text not null,
	country text not null,
	venue text not null,
	datetime timestamptz not null,
	timezone text not null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

drop trigger if exists events_set_updated_at on grandfeasteu.events;
create trigger events_set_updated_at
	before update on grandfeasteu.events
	for each row execute function grandfeasteu.set_updated_at();

alter table grandfeasteu.events enable row level security;

revoke all on grandfeasteu.events from anon, authenticated;
grant all on grandfeasteu.events to service_role;

insert into grandfeasteu.events (
	event_id,
	title,
	short_description,
	country,
	venue,
	datetime,
	timezone
)
values
	(
		'gfeu2026',
		'Together 2026',
		'A Grand Feast EU and UK gathering in Dublin calling guests to communion, worship, connection, and shared faith.',
		'Ireland',
		'St. Helen''s Hotel, Stillorgan Road, Blackrock, Ireland, Dublin A94 V6W3',
		'2026-10-03T12:00:00+01:00',
		'Europe/Dublin'
	),
	(
		'gfeu2025',
		'Called To More',
		'A Grand Feast EU and UK gathering in Oslo inviting guests to rediscover deeper purpose, stronger faith, and bigger love.',
		'Norway',
		'Lambertseter kirke, Langbølgen 33, 1150 Oslo, Norway',
		'2025-09-20T13:00:00+02:00',
		'Europe/Oslo'
	)
on conflict (event_id) do update
set
	title = excluded.title,
	short_description = excluded.short_description,
	country = excluded.country,
	venue = excluded.venue,
	datetime = excluded.datetime,
	timezone = excluded.timezone;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'bookings_event_fk'
			and conrelid = 'grandfeasteu.bookings'::regclass
	) then
		alter table grandfeasteu.bookings
			add constraint bookings_event_fk
			foreign key (event_id)
			references grandfeasteu.events (event_id)
			on update cascade
			on delete restrict;
	end if;
end;
$$;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'ticket_counters_event_fk'
			and conrelid = 'grandfeasteu.ticket_counters'::regclass
	) then
		alter table grandfeasteu.ticket_counters
			add constraint ticket_counters_event_fk
			foreign key (event_id)
			references grandfeasteu.events (event_id)
			on update cascade
			on delete restrict;
	end if;
end;
$$;

insert into grandfeasteu.events (
	event_id,
	title,
	short_description,
	country,
	venue,
	datetime,
	timezone,
	theme_main_color,
	theme_sub_color,
	theme_highlight_color,
	theme_on_main_color
)
values (
	'jewels2026',
	'Europe and UK Jewels Conference 2026',
	'A JEWELS Europe gathering in Malta inviting women into Becoming through renewal, worship, and community.',
	'Malta',
	'St Julian''s, Lapsi Street, Malta',
	'2026-10-31T13:00:00+01:00',
	'Europe/Malta',
	'#BD302F',
	'#FFF4EB',
	'#F0D4CF',
	'#FFF8F1'
)
on conflict (event_id) do update
set
	title = excluded.title,
	short_description = excluded.short_description,
	country = excluded.country,
	venue = excluded.venue,
	datetime = excluded.datetime,
	timezone = excluded.timezone,
	theme_main_color = excluded.theme_main_color,
	theme_sub_color = excluded.theme_sub_color,
	theme_highlight_color = excluded.theme_highlight_color,
	theme_on_main_color = excluded.theme_on_main_color;

insert into grandfeasteu.ticket_types (
	event_id,
	ticket_type_id,
	label,
	description,
	base_price,
	currency,
	sort_order,
	is_active
)
values (
	'jewels2026',
	'STANDARD',
	'Standard',
	'Conference ticket for Europe and UK Jewels Conference 2026',
	25.00,
	'EUR',
	10,
	true
)
on conflict (event_id, ticket_type_id) do update
set
	label = excluded.label,
	description = excluded.description,
	base_price = excluded.base_price,
	currency = excluded.currency,
	sort_order = excluded.sort_order,
	is_active = excluded.is_active;

insert into grandfeasteu.ticket_counters (
	event_id,
	counter_id,
	available,
	reserved,
	sold
)
values (
	'jewels2026',
	'STANDARD',
	100,
	0,
	0
)
on conflict (event_id, counter_id) do update
set
	available = greatest(grandfeasteu.ticket_counters.available, excluded.available),
	updated_at = now();

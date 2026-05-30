alter table if exists grandfeasteu.bookings
	alter column event_id set default 'gfeu2026';

alter table if exists grandfeasteu.tickets
	alter column event_id set default 'gfeu2026';

alter table if exists grandfeasteu.ticket_counters
	alter column event_id set default 'gfeu2026';

insert into grandfeasteu.ticket_counters (event_id, counter_id, available, reserved, sold)
values
	('gfeu2026', 'standard_tickets', 200, 0, 0),
	('gfeu2026', 'grand_feast_plus_tickets', 50, 0, 0)
on conflict (event_id, counter_id) do nothing;

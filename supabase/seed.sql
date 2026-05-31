insert into grandfeasteu.ticket_counters (event_id, counter_id, available, reserved, sold)
values
	('gfeu2026', 'STANDARD', 200, 0, 0),
	('gfeu2026', 'GRAND_FEAST_PLUS', 50, 0, 0)
on conflict (event_id, counter_id) do update
set
	available = excluded.available,
	reserved = excluded.reserved,
	sold = excluded.sold;

insert into grandfeasteu.ticket_counters (event_id, counter_id, available, reserved, sold)
values
	('gfeu2025', 'standard_tickets', 200, 0, 0),
	('gfeu2025', 'vip_tickets', 50, 0, 0),
	('gfeu2025', 'youth_tickets', 25, 0, 0)
on conflict (event_id, counter_id) do update
set
	available = excluded.available,
	reserved = excluded.reserved,
	sold = excluded.sold;

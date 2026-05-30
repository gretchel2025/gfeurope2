create or replace function grandfeasteu.counter_id_for_ticket_type(
	p_ticket_type text
)
returns text
language sql
immutable
set search_path = ''
as $$
	select case p_ticket_type
		when 'STANDARD' then 'standard_tickets'
		when 'GRAND_FEAST_PLUS' then 'grand_feast_plus_tickets'
		when 'VIP' then 'grand_feast_plus_tickets'
		when 'YOUTH' then 'standard_tickets'
		else null
	end;
$$;

insert into grandfeasteu.ticket_counters (event_id, counter_id, available, reserved, sold)
values
	('gfeu2026', 'grand_feast_plus_tickets', 50, 0, 0)
on conflict (event_id, counter_id) do update
set available = greatest(grandfeasteu.ticket_counters.available, excluded.available);

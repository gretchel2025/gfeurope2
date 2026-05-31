create table if not exists grandfeasteu.ticket_types (
	event_id text not null
		references grandfeasteu.events (event_id)
		on update cascade
		on delete restrict,
	ticket_type_id text not null,
	label text not null,
	description text not null default '',
	base_price numeric(10, 2) not null,
	currency text not null default 'EUR',
	available_from timestamptz,
	available_until timestamptz,
	early_bird_discount_available_until timestamptz,
	early_bird_discount_rate numeric(5, 4),
	early_bird_discount_amount numeric(10, 2),
	bulk_purchase_discount_min_quantity int,
	bulk_purchase_discount_rate numeric(5, 4),
	bulk_purchase_discount_amount numeric(10, 2),
	sort_order int not null default 0,
	is_active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (event_id, ticket_type_id),
	constraint ticket_types_base_price_nonnegative check (base_price >= 0),
	constraint ticket_types_early_bird_rate_range check (
		early_bird_discount_rate is null
		or (early_bird_discount_rate >= 0 and early_bird_discount_rate <= 1)
	),
	constraint ticket_types_early_bird_amount_nonnegative check (
		early_bird_discount_amount is null
		or early_bird_discount_amount >= 0
	),
	constraint ticket_types_bulk_min_positive check (
		bulk_purchase_discount_min_quantity is null
		or bulk_purchase_discount_min_quantity > 0
	),
	constraint ticket_types_bulk_rate_range check (
		bulk_purchase_discount_rate is null
		or (bulk_purchase_discount_rate >= 0 and bulk_purchase_discount_rate <= 1)
	),
	constraint ticket_types_bulk_amount_nonnegative check (
		bulk_purchase_discount_amount is null
		or bulk_purchase_discount_amount >= 0
	)
);

drop trigger if exists ticket_types_set_updated_at on grandfeasteu.ticket_types;
create trigger ticket_types_set_updated_at
	before update on grandfeasteu.ticket_types
	for each row execute function grandfeasteu.set_updated_at();

alter table grandfeasteu.ticket_types enable row level security;

revoke all on grandfeasteu.ticket_types from anon, authenticated;
grant all on grandfeasteu.ticket_types to service_role;

insert into grandfeasteu.ticket_types (
	event_id,
	ticket_type_id,
	label,
	description,
	base_price,
	currency,
	early_bird_discount_available_until,
	early_bird_discount_amount,
	bulk_purchase_discount_min_quantity,
	bulk_purchase_discount_rate,
	sort_order,
	is_active
)
values
	(
		'gfeu2026',
		'STANDARD',
		'Standard',
		'General admission, standard seating',
		35.00,
		'EUR',
		'2026-08-31T23:59:59+01:00',
		5.00,
		null,
		null,
		10,
		true
	),
	(
		'gfeu2026',
		'GRAND_FEAST_PLUS',
		'GrandFeast Plus',
		'Grand Feast admission with pilgrimage and sightseeing benefits',
		65.00,
		'EUR',
		null,
		null,
		5,
		0.10,
		20,
		true
	),
	(
		'gfeu2025',
		'STANDARD',
		'Standard',
		'General admission',
		35.00,
		'EUR',
		null,
		null,
		null,
		null,
		10,
		true
	),
	(
		'gfeu2025',
		'VIP',
		'Premium',
		'Premium admission',
		55.00,
		'EUR',
		null,
		null,
		null,
		null,
		20,
		true
	),
	(
		'gfeu2025',
		'YOUTH',
		'Child',
		'Child admission',
		0.00,
		'EUR',
		null,
		null,
		null,
		null,
		30,
		true
	),
	(
		'gfeu2025',
		'GRAND_FEAST_PLUS',
		'GrandFeast Plus',
		'Legacy counter retained for compatibility',
		65.00,
		'EUR',
		null,
		null,
		null,
		null,
		40,
		false
	)
on conflict (event_id, ticket_type_id) do update
set
	label = excluded.label,
	description = excluded.description,
	base_price = excluded.base_price,
	currency = excluded.currency,
	available_from = excluded.available_from,
	available_until = excluded.available_until,
	early_bird_discount_available_until = excluded.early_bird_discount_available_until,
	early_bird_discount_rate = excluded.early_bird_discount_rate,
	early_bird_discount_amount = excluded.early_bird_discount_amount,
	bulk_purchase_discount_min_quantity = excluded.bulk_purchase_discount_min_quantity,
	bulk_purchase_discount_rate = excluded.bulk_purchase_discount_rate,
	bulk_purchase_discount_amount = excluded.bulk_purchase_discount_amount,
	sort_order = excluded.sort_order,
	is_active = excluded.is_active;

with mapped_counters as (
	select
		event_id,
		case counter_id
			when 'standard_tickets' then 'STANDARD'
			when 'grand_feast_plus_tickets' then 'GRAND_FEAST_PLUS'
			when 'vip_tickets' then 'VIP'
			when 'youth_tickets' then 'YOUTH'
			else counter_id
		end as counter_id,
		sum(available)::int as available,
		sum(reserved)::int as reserved,
		sum(sold)::int as sold,
		min(created_at) as created_at
	from grandfeasteu.ticket_counters
	group by event_id, 2
)
insert into grandfeasteu.ticket_counters (
	event_id,
	counter_id,
	available,
	reserved,
	sold,
	created_at,
	updated_at
)
select
	event_id,
	counter_id,
	available,
	reserved,
	sold,
	created_at,
	now()
from mapped_counters
where counter_id in ('STANDARD', 'GRAND_FEAST_PLUS', 'VIP', 'YOUTH')
on conflict (event_id, counter_id) do update
set
	available = excluded.available,
	reserved = excluded.reserved,
	sold = excluded.sold,
	updated_at = now();

delete from grandfeasteu.ticket_counters
where counter_id in (
	'standard_tickets',
	'grand_feast_plus_tickets',
	'vip_tickets',
	'youth_tickets'
);

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'ticket_counters_ticket_type_fk'
			and conrelid = 'grandfeasteu.ticket_counters'::regclass
	) then
		alter table grandfeasteu.ticket_counters
			add constraint ticket_counters_ticket_type_fk
			foreign key (event_id, counter_id)
			references grandfeasteu.ticket_types (event_id, ticket_type_id)
			on update cascade
			on delete restrict;
	end if;
end;
$$;

create or replace function grandfeasteu.counter_id_for_ticket_type(p_ticket_type text)
returns text
language sql
immutable
as $$
	select case upper(p_ticket_type)
		when 'STANDARD' then 'STANDARD'
		when 'STANDARD_TICKETS' then 'STANDARD'
		when 'GRAND_FEAST_PLUS' then 'GRAND_FEAST_PLUS'
		when 'GRAND_FEAST_PLUS_TICKETS' then 'GRAND_FEAST_PLUS'
		when 'VIP' then 'VIP'
		when 'VIP_TICKETS' then 'VIP'
		when 'YOUTH' then 'YOUTH'
		when 'YOUTH_TICKETS' then 'YOUTH'
		else null
	end;
$$;

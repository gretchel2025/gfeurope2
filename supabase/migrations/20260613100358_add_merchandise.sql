create extension if not exists pgcrypto with schema extensions;

create table if not exists grandfeasteu.merch_products (
	event_id text not null
		references grandfeasteu.events (event_id)
		on update cascade
		on delete restrict,
	product_id text not null,
	name text not null,
	description text not null default '',
	category text not null default 'General',
	unit_price numeric(10, 2) not null,
	currency text not null default 'EUR',
	stock_count integer not null default 0,
	sizes text[] not null default '{}',
	colors text[] not null default '{}',
	image_urls text[] not null default '{}',
	is_active boolean not null default true,
	deleted_at timestamptz,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (event_id, product_id),
	constraint merch_products_product_id_nonempty check (length(btrim(product_id)) > 0),
	constraint merch_products_name_nonempty check (length(btrim(name)) > 0),
	constraint merch_products_category_nonempty check (length(btrim(category)) > 0),
	constraint merch_products_unit_price_nonnegative check (unit_price >= 0),
	constraint merch_products_stock_count_nonnegative check (stock_count >= 0),
	constraint merch_products_image_limit check (cardinality(image_urls) <= 5),
	constraint merch_products_sizes_no_null check (array_position(sizes, null) is null),
	constraint merch_products_colors_no_null check (array_position(colors, null) is null),
	constraint merch_products_images_no_null check (array_position(image_urls, null) is null)
);

create table if not exists grandfeasteu.merch_reservations (
	event_id text not null
		references grandfeasteu.events (event_id)
		on update cascade
		on delete restrict,
	reservation_id text not null,
	customer_name text not null,
	email text not null,
	mobile text not null,
	reserved_at timestamptz not null default now(),
	status text not null default 'RESERVED',
	amount_total numeric(10, 2) not null default 0,
	currency text not null default 'EUR',
	confirmation_email_status text not null default 'PENDING',
	confirmation_email_attempted_at timestamptz,
	confirmation_email_provider_id text,
	confirmation_email_error text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	primary key (event_id, reservation_id),
	constraint merch_reservations_reservation_id_nonempty check (length(btrim(reservation_id)) > 0),
	constraint merch_reservations_customer_name_nonempty check (length(btrim(customer_name)) > 0),
	constraint merch_reservations_email_nonempty check (length(btrim(email)) > 0),
	constraint merch_reservations_mobile_nonempty check (length(btrim(mobile)) > 0),
	constraint merch_reservations_status_check check (
		status in ('RESERVED', 'CANCELLED', 'COLLECTED')
	),
	constraint merch_reservations_amount_total_nonnegative check (amount_total >= 0),
	constraint merch_reservations_confirmation_email_status_check check (
		confirmation_email_status in ('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'UNKNOWN')
	)
);

create table if not exists grandfeasteu.merch_reservation_items (
	item_id uuid primary key default extensions.gen_random_uuid(),
	event_id text not null,
	reservation_id text not null,
	product_id text not null,
	product_name text not null,
	quantity integer not null,
	unit_price numeric(10, 2) not null,
	currency text not null default 'EUR',
	selected_size text,
	selected_color text,
	created_at timestamptz not null default now(),
	constraint merch_reservation_items_reservation_fk
		foreign key (event_id, reservation_id)
		references grandfeasteu.merch_reservations (event_id, reservation_id)
		on update cascade
		on delete cascade,
	constraint merch_reservation_items_product_fk
		foreign key (event_id, product_id)
		references grandfeasteu.merch_products (event_id, product_id)
		on update cascade
		on delete restrict,
	constraint merch_reservation_items_product_name_nonempty check (
		length(btrim(product_name)) > 0
	),
	constraint merch_reservation_items_quantity_positive check (quantity > 0),
	constraint merch_reservation_items_unit_price_nonnegative check (unit_price >= 0)
);

drop trigger if exists merch_products_set_updated_at on grandfeasteu.merch_products;
create trigger merch_products_set_updated_at
	before update on grandfeasteu.merch_products
	for each row execute function grandfeasteu.set_updated_at();

drop trigger if exists merch_reservations_set_updated_at on grandfeasteu.merch_reservations;
create trigger merch_reservations_set_updated_at
	before update on grandfeasteu.merch_reservations
	for each row execute function grandfeasteu.set_updated_at();

create index if not exists merch_products_event_category_idx
	on grandfeasteu.merch_products (event_id, category, name)
	where deleted_at is null;

create index if not exists merch_products_event_active_idx
	on grandfeasteu.merch_products (event_id, is_active, stock_count)
	where deleted_at is null;

create index if not exists merch_reservations_event_reserved_at_idx
	on grandfeasteu.merch_reservations (event_id, reserved_at desc);

create index if not exists merch_reservations_email_idx
	on grandfeasteu.merch_reservations (event_id, lower(email), reserved_at desc);

create index if not exists merch_reservation_items_reservation_idx
	on grandfeasteu.merch_reservation_items (event_id, reservation_id);

create or replace function grandfeasteu.create_merch_reservation(
	p_event_id text,
	p_reservation_id text,
	p_customer_name text,
	p_email text,
	p_mobile text,
	p_items jsonb
)
returns grandfeasteu.merch_reservations
language plpgsql
security invoker
set search_path = ''
as $$
declare
	created_reservation grandfeasteu.merch_reservations;
	updated_reservation grandfeasteu.merch_reservations;
	item record;
	product grandfeasteu.merch_products;
	total_amount numeric(10, 2) := 0;
	item_count integer := 0;
begin
	if jsonb_typeof(p_items) is distinct from 'array' then
		raise exception 'merch reservation items must be a JSON array'
			using errcode = 'P0001';
	end if;

	if jsonb_array_length(p_items) < 1 then
		raise exception 'merch reservation requires at least one item'
			using errcode = 'P0001';
	end if;

	insert into grandfeasteu.merch_reservations (
		event_id,
		reservation_id,
		customer_name,
		email,
		mobile,
		amount_total
	)
	values (
		p_event_id,
		p_reservation_id,
		p_customer_name,
		p_email,
		p_mobile,
		0
	)
	returning * into created_reservation;

	for item in
		select *
		from jsonb_to_recordset(p_items) as x(
			product_id text,
			quantity integer,
			selected_size text,
			selected_color text
		)
	loop
		item_count := item_count + 1;

		if item.quantity is null or item.quantity < 1 then
			raise exception 'invalid quantity for merch product %', item.product_id
				using errcode = 'P0001';
		end if;

		select * into product
		from grandfeasteu.merch_products
		where event_id = p_event_id
			and product_id = item.product_id
			and is_active
			and deleted_at is null
		for update;

		if not found then
			raise exception 'merch product % is unavailable', item.product_id
				using errcode = 'P0001';
		end if;

		if product.stock_count < item.quantity then
			raise exception 'not enough stock for merch product %', item.product_id
				using errcode = 'P0001';
		end if;

		if cardinality(product.sizes) > 0
			and (
				item.selected_size is null
				or not item.selected_size = any(product.sizes)
			) then
			raise exception 'invalid size for merch product %', item.product_id
				using errcode = 'P0001';
		end if;

		if cardinality(product.colors) > 0
			and (
				item.selected_color is null
				or not item.selected_color = any(product.colors)
			) then
			raise exception 'invalid color for merch product %', item.product_id
				using errcode = 'P0001';
		end if;

		update grandfeasteu.merch_products
		set stock_count = stock_count - item.quantity
		where event_id = p_event_id
			and product_id = item.product_id;

		insert into grandfeasteu.merch_reservation_items (
			event_id,
			reservation_id,
			product_id,
			product_name,
			quantity,
			unit_price,
			currency,
			selected_size,
			selected_color
		)
		values (
			p_event_id,
			p_reservation_id,
			product.product_id,
			product.name,
			item.quantity,
			product.unit_price,
			product.currency,
			nullif(btrim(coalesce(item.selected_size, '')), ''),
			nullif(btrim(coalesce(item.selected_color, '')), '')
		);

		total_amount := total_amount + (product.unit_price * item.quantity);
	end loop;

	if item_count < 1 then
		raise exception 'merch reservation requires at least one valid item'
			using errcode = 'P0001';
	end if;

	update grandfeasteu.merch_reservations
	set amount_total = total_amount
	where event_id = p_event_id
		and reservation_id = p_reservation_id
	returning * into updated_reservation;

	return updated_reservation;
end;
$$;

create or replace function grandfeasteu.update_merch_reservation_confirmation_email_status(
	p_event_id text,
	p_reservation_id text,
	p_status text,
	p_error text default null,
	p_provider_message_id text default null
)
returns grandfeasteu.merch_reservations
language plpgsql
security invoker
set search_path = ''
as $$
declare
	updated_reservation grandfeasteu.merch_reservations;
begin
	if p_status not in ('PENDING', 'SENT', 'FAILED', 'SKIPPED', 'UNKNOWN') then
		raise exception 'invalid merch reservation confirmation email status %', p_status
			using errcode = 'P0001';
	end if;

	update grandfeasteu.merch_reservations
	set
		confirmation_email_status = p_status,
		confirmation_email_attempted_at = now(),
		confirmation_email_provider_id = case
			when p_status = 'SENT' then nullif(btrim(coalesce(p_provider_message_id, '')), '')
			else null
		end,
		confirmation_email_error = case
			when p_status = 'FAILED' then nullif(left(coalesce(p_error, 'email send failed'), 500), '')
			else null
		end
	where event_id = p_event_id
		and reservation_id = p_reservation_id
	returning * into updated_reservation;

	if not found then
		raise exception
			'merch reservation confirmation email status update failed for event_id %, reservation_id %',
			p_event_id,
			p_reservation_id
			using errcode = 'P0001';
	end if;

	return updated_reservation;
end;
$$;

alter table grandfeasteu.merch_products enable row level security;
alter table grandfeasteu.merch_reservations enable row level security;
alter table grandfeasteu.merch_reservation_items enable row level security;

revoke all on grandfeasteu.merch_products from anon, authenticated;
revoke all on grandfeasteu.merch_reservations from anon, authenticated;
revoke all on grandfeasteu.merch_reservation_items from anon, authenticated;

revoke execute on function grandfeasteu.create_merch_reservation(
	text,
	text,
	text,
	text,
	text,
	jsonb
) from public, anon, authenticated;

revoke execute on function grandfeasteu.update_merch_reservation_confirmation_email_status(
	text,
	text,
	text,
	text,
	text
) from public, anon, authenticated;

grant all on grandfeasteu.merch_products to service_role;
grant all on grandfeasteu.merch_reservations to service_role;
grant all on grandfeasteu.merch_reservation_items to service_role;

grant execute on function grandfeasteu.create_merch_reservation(
	text,
	text,
	text,
	text,
	text,
	jsonb
) to service_role;

grant execute on function grandfeasteu.update_merch_reservation_confirmation_email_status(
	text,
	text,
	text,
	text,
	text
) to service_role;

notify pgrst, 'reload schema';

create or replace function grandfeasteu.generate_merch_product_id()
returns text
language sql
volatile
set search_path = ''
as $$
	select 'MP-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 10));
$$;

alter table grandfeasteu.merch_products
	alter column product_id set default grandfeasteu.generate_merch_product_id();

revoke execute on function grandfeasteu.generate_merch_product_id() from anon, authenticated;
grant execute on function grandfeasteu.generate_merch_product_id() to service_role;

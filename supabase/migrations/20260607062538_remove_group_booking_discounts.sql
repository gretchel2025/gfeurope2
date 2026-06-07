update grandfeasteu.ticket_types
set
	bulk_purchase_discount_min_quantity = null,
	bulk_purchase_discount_rate = null,
	bulk_purchase_discount_amount = null,
	updated_at = now()
where
	bulk_purchase_discount_min_quantity is not null
	or bulk_purchase_discount_rate is not null
	or bulk_purchase_discount_amount is not null;

update grandfeasteu.ticket_types
set
	early_bird_discount_available_until = '2026-08-31T23:59:59+01:00',
	early_bird_discount_amount = 5.00,
	early_bird_discount_rate = null
where event_id = 'gfeu2026'
	and ticket_type_id = 'GRAND_FEAST_PLUS';

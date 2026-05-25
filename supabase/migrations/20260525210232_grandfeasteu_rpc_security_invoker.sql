alter function public.grandfeasteu_increment_ticket_counter(
	text,
	text,
	integer,
	integer,
	integer
) security invoker;

alter function public.grandfeasteu_append_booking_ticket_id(
	text,
	text,
	text
) security invoker;

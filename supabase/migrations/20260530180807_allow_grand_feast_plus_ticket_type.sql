alter table grandfeasteu.bookings
	drop constraint if exists grandfeasteu_bookings_ticket_type_check;

alter table grandfeasteu.bookings
	drop constraint if exists bookings_ticket_type_check;

alter table grandfeasteu.bookings
	add constraint bookings_ticket_type_check
	check (ticket_type in ('STANDARD', 'GRAND_FEAST_PLUS', 'VIP', 'YOUTH'));

alter table grandfeasteu.tickets
	drop constraint if exists grandfeasteu_tickets_ticket_type_check;

alter table grandfeasteu.tickets
	drop constraint if exists tickets_ticket_type_check;

alter table grandfeasteu.tickets
	add constraint tickets_ticket_type_check
	check (ticket_type in ('STANDARD', 'GRAND_FEAST_PLUS', 'VIP', 'YOUTH'));

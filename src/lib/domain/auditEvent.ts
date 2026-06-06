export const AuditAction = {
	BookingCreated: 'booking.created',
	BookingPaymentReminderSent: 'booking.payment_reminder_sent',
	BookingMarkedPaid: 'booking.marked_paid',
	BookingCancelled: 'booking.cancelled',
	BookingTicketsGenerated: 'booking.tickets_generated',
	BookingTicketsEmailSent: 'booking.tickets_email_sent',
	BookingMarkedTicketsAsSent: 'booking.marked_tickets_as_sent',
	TicketCreated: 'ticket.created',
	TicketCheckedIn: 'ticket.checked_in',
	TicketCheckedOut: 'ticket.checked_out',
	TicketCounterAvailableAdded: 'ticket_counter.available_added'
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditActorType = {
	Public: 'public',
	Admin: 'admin',
	System: 'system'
} as const;

export type AuditActorType = (typeof AuditActorType)[keyof typeof AuditActorType];

export const AuditEntityType = {
	Booking: 'booking',
	Ticket: 'ticket',
	TicketCounter: 'ticket_counter'
} as const;

export type AuditEntityType = (typeof AuditEntityType)[keyof typeof AuditEntityType];

export type AuditMetadata = Record<string, unknown>;

export type AuditActor = {
	actor_type: AuditActorType;
	actor_id?: string | null;
	actor_email?: string | null;
};

export type AuditEvent = AuditActor & {
	audit_event_id: string;
	event_id: string | null;
	action: AuditAction;
	entity_type: AuditEntityType;
	entity_id: string;
	occurred_at: string;
	metadata: AuditMetadata;
	created_at: string;
};

export type CreateAuditEventInput = AuditActor & {
	event_id: string | null;
	action: AuditAction;
	entity_type: AuditEntityType;
	entity_id: string;
	metadata?: AuditMetadata;
};

export type AuditEventListOptions = {
	limit?: number;
};

export const systemAuditActor: AuditActor = {
	actor_type: AuditActorType.System,
	actor_id: null,
	actor_email: null
};

export function publicAuditActor(email: string): AuditActor {
	return {
		actor_type: AuditActorType.Public,
		actor_id: null,
		actor_email: email
	};
}

/**
 * Purpose:
 * This service manages ticket inventory counters for each ticket class.
 *
 * Why this structure is good:
 * Inventory rules are centralized here instead of being scattered across
 * booking routes and repositories. That makes quantity updates consistent and
 * keeps ticket-type branching in one place.
 */
import { ValidationError } from '$lib/application/errors';
import type { TicketCounterRepository } from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import {
	AuditAction,
	AuditEntityType,
	systemAuditActor,
	type AuditActor
} from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import type { TicketCounter, TicketCounterDelta } from '$lib/domain/ticketCounter';
import type { TicketTypeConfig } from '$lib/domain/ticketType';
import { formatTicketTypeLabel, TicketType } from '$lib/domain/shared/enums';

/** Stable ids for the inventory counters stored in Supabase. */
const STANDARD_TICKETS_ID = TicketType.STANDARD;
const GRAND_FEAST_PLUS_TICKETS_ID = TicketType.GRAND_FEAST_PLUS;
const UNKNOWN_COUNTER_SORT_ORDER = Number.MAX_SAFE_INTEGER;

export type TicketCounterDashboardItem = {
	title: string;
	counter: TicketCounter;
	isActive: boolean;
	sortOrder: number;
};

export function buildTicketCounterDashboardItems(
	counters: TicketCounter[],
	ticketTypes: TicketTypeConfig[]
): TicketCounterDashboardItem[] {
	const ticketTypesById = new Map(
		ticketTypes.map((ticketType) => [ticketType.ticket_type_id, ticketType])
	);

	return counters
		.map((counter) => {
			const ticketType = ticketTypesById.get(counter._id);
			const label = ticketType?.label || formatTicketTypeLabel(counter._id);

			return {
				title: `${label} Tickets`,
				counter,
				isActive: ticketType?.is_active ?? true,
				sortOrder: ticketType?.sort_order ?? UNKNOWN_COUNTER_SORT_ORDER
			};
		})
		.sort(
			(left, right) =>
				left.sortOrder - right.sortOrder || left.counter._id.localeCompare(right.counter._id)
		);
}

/** Application service for ticket inventory counters. */
export class TicketCounterService {
	constructor(
		private readonly counterRepository: TicketCounterRepository,
		private readonly auditEventService: AuditEventService,
		private readonly eventId: string
	) {}

	/** Returns the storage id for the standard ticket counter. */
	getStandardCounterId(): string {
		return STANDARD_TICKETS_ID;
	}

	/** Returns the storage id for the GrandFeast Plus ticket counter. */
	getGrandFeastPlusCounterId(): string {
		return GRAND_FEAST_PLUS_TICKETS_ID;
	}

	/** Loads a counter by its storage id. */
	async getById(id: string): Promise<TicketCounter | null> {
		return await this.counterRepository.findById(id);
	}

	/** Lists all counters for the current event. */
	async list(): Promise<TicketCounter[]> {
		return await this.counterRepository.list();
	}

	/** Creates a new counter record, typically during bootstrap. */
	async create(id: string, values?: TicketCounterDelta): Promise<void> {
		await this.counterRepository.create(id, values);
	}

	/** Convenience reader for the standard counter. */
	async getStandardTickets(): Promise<TicketCounter | null> {
		return await this.getById(STANDARD_TICKETS_ID);
	}

	/** Convenience reader for the GrandFeast Plus counter. */
	async getGrandFeastPlusTickets(): Promise<TicketCounter | null> {
		return await this.getById(GRAND_FEAST_PLUS_TICKETS_ID);
	}

	/** Resolves the correct counter for a business-level ticket type. */
	async getByTicketType(ticketType: TicketType): Promise<TicketCounter | null> {
		switch (ticketType) {
			case TicketType.STANDARD:
				return await this.getStandardTickets();
			case TicketType.GRAND_FEAST_PLUS:
				return await this.getGrandFeastPlusTickets();
			case TicketType.VIP:
			case TicketType.YOUTH:
				return await this.getById(ticketType);
			default:
				throw new ValidationError(`Invalid ticket type ${ticketType}`);
		}
	}

	/** Applies a raw delta to a counter. */
	async incrementTickets(id: string, values: TicketCounterDelta): Promise<void> {
		await this.counterRepository.increment(id, values);
	}

	/** Adds manual available inventory and records the admin-facing audit event. */
	async addAvailableTickets(
		id: string,
		quantity: number,
		actor: AuditActor = systemAuditActor
	): Promise<void> {
		if (!Number.isInteger(quantity) || quantity <= 0) {
			throw new ValidationError('ticket quantity must be a positive integer');
		}

		await this.incrementTickets(id, { available: quantity, reserved: 0, sold: 0 });
		await this.auditEventService.record({
			...actor,
			event_id: this.eventId,
			action: AuditAction.TicketCounterAvailableAdded,
			entity_type: AuditEntityType.TicketCounter,
			entity_id: id,
			metadata: {
				ticket_type: id,
				quantity_added: quantity
			}
		});
	}

	/** Adds manual standard ticket availability. */
	async addAvailableStandardTickets(
		quantity: number,
		actor: AuditActor = systemAuditActor
	): Promise<void> {
		await this.addAvailableTickets(STANDARD_TICKETS_ID, quantity, actor);
	}

	/** Adds manual GrandFeast Plus ticket availability. */
	async addAvailableGrandFeastPlusTickets(
		quantity: number,
		actor: AuditActor = systemAuditActor
	): Promise<void> {
		await this.addAvailableTickets(GRAND_FEAST_PLUS_TICKETS_ID, quantity, actor);
	}

	/** Applies a delta to the standard counter. */
	async incrementStandardTickets(values: TicketCounterDelta): Promise<void> {
		await this.incrementTickets(STANDARD_TICKETS_ID, values);
	}

	/** Applies a delta to the GrandFeast Plus counter. */
	async incrementGrandFeastPlusTickets(values: TicketCounterDelta): Promise<void> {
		await this.incrementTickets(GRAND_FEAST_PLUS_TICKETS_ID, values);
	}

	/** Applies inventory changes based on the ticket type referenced by a booking. */
	async incrementForBooking(booking: Booking, delta: TicketCounterDelta): Promise<void> {
		switch (booking.ticket_type) {
			case TicketType.STANDARD:
				return await this.incrementStandardTickets(delta);
			case TicketType.GRAND_FEAST_PLUS:
				return await this.incrementGrandFeastPlusTickets(delta);
			case TicketType.VIP:
			case TicketType.YOUTH:
				return await this.incrementTickets(booking.ticket_type, delta);
			default:
				throw new ValidationError(
					`Invalid ticket type ${booking.ticket_type} on booking ${booking.reference_no}`
				);
		}
	}
}

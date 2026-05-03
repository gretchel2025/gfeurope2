/**
 * Purpose:
 * This service manages ticket inventory counters for each ticket class.
 *
 * Why this structure is good:
 * Inventory rules are centralized here instead of being scattered across
 * booking routes and repositories. That makes quantity updates consistent and
 * keeps ticket-type branching in one place.
 */
import { ValidationError } from "$lib/application/errors";
import type { TicketCounterRepository } from "$lib/application/ports";
import type { Booking } from "$lib/domain/booking";
import type { TicketCounter, TicketCounterDelta } from "$lib/domain/ticketCounter";
import { TicketType } from "$lib/domain/shared/enums";

/** Stable ids for the three inventory counters stored in Mongo. */
const STANDARD_TICKETS_ID = "standard_tickets";
const VIP_TICKETS_ID = "vip_tickets";
const YOUTH_TICKETS_ID = "youth_tickets";

/** Application service for ticket inventory counters. */
export class TicketCounterService {
    constructor(private readonly counterRepository: TicketCounterRepository) {}

    /** Returns the storage id for the standard ticket counter. */
    getStandardCounterId(): string {
        return STANDARD_TICKETS_ID;
    }

    /** Returns the storage id for the VIP ticket counter. */
    getVipCounterId(): string {
        return VIP_TICKETS_ID;
    }

    /** Returns the storage id for the youth ticket counter. */
    getYouthCounterId(): string {
        return YOUTH_TICKETS_ID;
    }

    /** Loads a counter by its storage id. */
    async getById(id: string): Promise<TicketCounter | null> {
        return await this.counterRepository.findById(id);
    }

    /** Creates a new counter record, typically during bootstrap. */
    async create(id: string, values?: TicketCounterDelta): Promise<void> {
        await this.counterRepository.create(id, values);
    }

    /** Convenience reader for the standard counter. */
    async getStandardTickets(): Promise<TicketCounter | null> {
        return await this.getById(STANDARD_TICKETS_ID);
    }

    /** Convenience reader for the VIP counter. */
    async getVipTickets(): Promise<TicketCounter | null> {
        return await this.getById(VIP_TICKETS_ID);
    }

    /** Convenience reader for the youth counter. */
    async getYouthTickets(): Promise<TicketCounter | null> {
        return await this.getById(YOUTH_TICKETS_ID);
    }

    /** Resolves the correct counter for a business-level ticket type. */
    async getByTicketType(ticketType: TicketType): Promise<TicketCounter | null> {
        switch (ticketType) {
            case TicketType.STANDARD:
                return await this.getStandardTickets();
            case TicketType.VIP:
                return await this.getVipTickets();
            case TicketType.YOUTH:
                return await this.getYouthTickets();
            default:
                throw new ValidationError(`Invalid ticket type ${ticketType}`);
        }
    }

    /** Applies a raw delta to a counter. */
    async incrementTickets(id: string, values: TicketCounterDelta): Promise<void> {
        await this.counterRepository.increment(id, values);
    }

    /** Applies a delta to the standard counter. */
    async incrementStandardTickets(values: TicketCounterDelta): Promise<void> {
        await this.incrementTickets(STANDARD_TICKETS_ID, values);
    }

    /** Applies a delta to the VIP counter. */
    async incrementVipTickets(values: TicketCounterDelta): Promise<void> {
        await this.incrementTickets(VIP_TICKETS_ID, values);
    }

    /** Applies a delta to the youth counter. */
    async incrementYouthTickets(values: TicketCounterDelta): Promise<void> {
        await this.incrementTickets(YOUTH_TICKETS_ID, values);
    }

    /** Applies inventory changes based on the ticket type referenced by a booking. */
    async incrementForBooking(booking: Booking, delta: TicketCounterDelta): Promise<void> {
        switch (booking.ticket_type) {
            case TicketType.STANDARD:
                return await this.incrementStandardTickets(delta);
            case TicketType.VIP:
                return await this.incrementVipTickets(delta);
            case TicketType.YOUTH:
                return await this.incrementYouthTickets(delta);
            default:
                throw new ValidationError(`Invalid ticket type ${booking.ticket_type} on booking ${booking.reference_no}`);
        }
    }
}

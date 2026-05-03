import { ValidationError } from "$lib/application/errors";
import type { TicketCounterRepository } from "$lib/application/ports";
import type { Booking } from "$lib/domain/booking";
import type { TicketCounter, TicketCounterDelta } from "$lib/domain/ticketCounter";
import { TicketType } from "$lib/domain/shared/enums";

const STANDARD_TICKETS_ID = "standard_tickets";
const VIP_TICKETS_ID = "vip_tickets";
const YOUTH_TICKETS_ID = "youth_tickets";

export class TicketCounterService {
    constructor(private readonly counterRepository: TicketCounterRepository) {}

    getStandardCounterId(): string {
        return STANDARD_TICKETS_ID;
    }

    getVipCounterId(): string {
        return VIP_TICKETS_ID;
    }

    getYouthCounterId(): string {
        return YOUTH_TICKETS_ID;
    }

    async getById(id: string): Promise<TicketCounter | null> {
        return await this.counterRepository.findById(id);
    }

    async create(id: string, values?: TicketCounterDelta): Promise<void> {
        await this.counterRepository.create(id, values);
    }

    async getStandardTickets(): Promise<TicketCounter | null> {
        return await this.getById(STANDARD_TICKETS_ID);
    }

    async getVipTickets(): Promise<TicketCounter | null> {
        return await this.getById(VIP_TICKETS_ID);
    }

    async getYouthTickets(): Promise<TicketCounter | null> {
        return await this.getById(YOUTH_TICKETS_ID);
    }

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

    async incrementTickets(id: string, values: TicketCounterDelta): Promise<void> {
        await this.counterRepository.increment(id, values);
    }

    async incrementStandardTickets(values: TicketCounterDelta): Promise<void> {
        await this.incrementTickets(STANDARD_TICKETS_ID, values);
    }

    async incrementVipTickets(values: TicketCounterDelta): Promise<void> {
        await this.incrementTickets(VIP_TICKETS_ID, values);
    }

    async incrementYouthTickets(values: TicketCounterDelta): Promise<void> {
        await this.incrementTickets(YOUTH_TICKETS_ID, values);
    }

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

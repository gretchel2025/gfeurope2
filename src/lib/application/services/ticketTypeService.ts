import { NotFoundError, ValidationError } from '$lib/application/errors';
import type { TicketTypeRepository } from '$lib/application/ports';
import {
	computeTicketPricing,
	isTicketTypeAvailable,
	type TicketPricing,
	type TicketTypeConfig
} from '$lib/domain/ticketType';

/** Application service for DB-backed ticket type configuration and pricing. */
export class TicketTypeService {
	constructor(private readonly ticketTypeRepository: TicketTypeRepository) {}

	async list(eventId: string): Promise<TicketTypeConfig[]> {
		return await this.ticketTypeRepository.list(eventId);
	}

	async listActive(eventId: string, now: Date = new Date()): Promise<TicketTypeConfig[]> {
		const ticketTypes = await this.ticketTypeRepository.listActive(eventId);
		return ticketTypes.filter((ticketType) => isTicketTypeAvailable(ticketType, now));
	}

	async getAvailableForBooking(
		eventId: string,
		ticketTypeId: string,
		now: Date = new Date()
	): Promise<TicketTypeConfig> {
		const ticketType = await this.ticketTypeRepository.findById(eventId, ticketTypeId);
		if (!ticketType) {
			throw new NotFoundError('ticket type not found');
		}
		if (!isTicketTypeAvailable(ticketType, now)) {
			throw new ValidationError('ticket type is not available');
		}

		return ticketType;
	}

	computePricing(
		ticketType: TicketTypeConfig,
		quantity: number,
		now: Date = new Date()
	): TicketPricing {
		return computeTicketPricing(ticketType, quantity, now);
	}
}

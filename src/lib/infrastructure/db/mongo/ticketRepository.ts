/**
 * Purpose:
 * This file contains the Mongo-backed ticket repository.
 *
 * Why this structure is good:
 * Ticket query and update behavior is isolated from other persistence concerns,
 * which makes ticket-related feature work faster to locate and review.
 */
import type { TicketRepository } from '$lib/application/ports';
import type { Ticket } from '$lib/domain/ticket';
import type { TicketStatus } from '$lib/domain/shared/enums';
import { TicketModel } from '$lib/infrastructure/db/mongo/models';
import { mapTicket } from '$lib/infrastructure/db/mongo/mappers';

/** Mongo implementation of the ticket repository port. */
export class MongoTicketRepository implements TicketRepository {
	/** Inserts a new ticket record and returns its id. */
	async insert(ticket: Ticket): Promise<string> {
		await TicketModel.create(ticket);
		return ticket.ticket_id;
	}

	/** Loads a ticket by its ticket id. */
	async findByTicketId(ticketId: string): Promise<Ticket | null> {
		const record = await TicketModel.findOne({ ticket_id: ticketId });
		return record ? mapTicket(record) : null;
	}

	/** Lists all tickets. */
	async list(): Promise<Ticket[]> {
		const records = await TicketModel.find({});
		return records.map(mapTicket);
	}

	/** Updates the lifecycle status of a ticket. */
	async updateStatus(ticketId: string, status: TicketStatus): Promise<void> {
		await TicketModel.findOneAndUpdate({ ticket_id: ticketId }, { status });
	}

	/** Deletes a ticket by its ticket id. */
	async deleteByTicketId(ticketId: string): Promise<void> {
		await TicketModel.deleteOne({ ticket_id: ticketId });
	}
}

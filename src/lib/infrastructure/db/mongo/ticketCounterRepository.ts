/**
 * Purpose:
 * This file contains the Mongo-backed ticket counter repository.
 *
 * Why this structure is good:
 * Inventory persistence has its own module, so counter behavior can evolve
 * without forcing developers to scan unrelated booking or ticket code.
 */
import { InfrastructureError } from '$lib/application/errors';
import type { TicketCounterRepository } from '$lib/application/ports';
import type { TicketCounter, TicketCounterDelta } from '$lib/domain/ticketCounter';
import { CounterModel } from '$lib/infrastructure/db/mongo/models';
import { mapTicketCounter } from '$lib/infrastructure/db/mongo/mappers';

/** Mongo implementation of the ticket counter repository port. */
export class MongoTicketCounterRepository implements TicketCounterRepository {
	/** Creates a new counter record. */
	async create(counterId: string, values?: TicketCounterDelta): Promise<void> {
		await CounterModel.create({
			_id: counterId,
			available: values?.available ?? 0,
			reserved: values?.reserved ?? 0,
			sold: values?.sold ?? 0
		});
	}

	/** Loads a counter by id and wraps persistence failures in an infrastructure error. */
	async findById(id: string): Promise<TicketCounter | null> {
		try {
			const record = await CounterModel.findOne({ _id: id });
			return record ? mapTicketCounter(record) : null;
		} catch {
			throw new InfrastructureError('ticket counter lookup failed');
		}
	}

	/** Replaces selected counter fields with absolute values. */
	async set(id: string, values: TicketCounterDelta): Promise<void> {
		await CounterModel.findOneAndUpdate({ _id: id }, { $set: values });
	}

	/** Applies an increment/decrement delta to the counter fields. */
	async increment(id: string, values: TicketCounterDelta): Promise<void> {
		try {
			await CounterModel.findOneAndUpdate({ _id: id }, { $inc: values });
		} catch {
			throw new InfrastructureError('ticket counter update failed');
		}
	}
}

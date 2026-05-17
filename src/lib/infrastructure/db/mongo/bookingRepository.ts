/**
 * Purpose:
 * This file contains the Mongo-backed booking repository.
 *
 * Why this structure is good:
 * Booking persistence changes now have a small, obvious home instead of sharing
 * one large file with every other Mongo adapter.
 */
import type { BookingRepository } from '$lib/application/ports';
import type { Booking } from '$lib/domain/booking';
import type { BookingPaymentStatus } from '$lib/domain/shared/enums';
import { BookingModel } from '$lib/infrastructure/db/mongo/models';
import { mapBooking } from '$lib/infrastructure/db/mongo/mappers';

/** Mongo implementation of the booking repository port. */
export class MongoBookingRepository implements BookingRepository {
	/** Inserts a new booking record. */
	async insert(booking: Booking): Promise<Booking> {
		await BookingModel.create({
			...booking,
			book_date: new Date(booking.book_date)
		});
		return booking;
	}

	/** Loads a booking by its reference number. */
	async findByReferenceNo(referenceNo: string): Promise<Booking | null> {
		const record = await BookingModel.findOne({ reference_no: referenceNo });
		return record ? mapBooking(record) : null;
	}

	/** Lists all bookings. */
	async list(): Promise<Booking[]> {
		const records = await BookingModel.find({});
		return records.map(mapBooking);
	}

	/** Updates only the payment status field for a booking. */
	async updatePaymentStatus(referenceNo: string, value: BookingPaymentStatus): Promise<void> {
		await BookingModel.findOneAndUpdate({ reference_no: referenceNo }, { payment_status: value });
	}

	/** Appends a newly created ticket id to the booking's ticket list. */
	async appendTicketId(referenceNo: string, ticketId: string): Promise<void> {
		await BookingModel.updateOne(
			{ reference_no: referenceNo },
			{ $push: { ticket_ids: ticketId } }
		);
	}
}

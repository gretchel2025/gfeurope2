/**
 * Purpose:
 * This file defines the Mongo/Mongoose schemas and model handles.
 *
 * Why this structure is good:
 * Persistence shape lives in one infrastructure module, separate from domain
 * types and repository behavior. Repository files can focus on queries.
 */
import mongoose from 'mongoose';

/** Mongoose schema for persisted bookings. */
const bookingSchema = new mongoose.Schema({
	reference_no: { type: String, required: true },
	name: { type: String, required: true },
	email: { type: String, required: true },
	city: { type: String, default: '' },
	ticket_type: { type: String, required: true },
	book_date: { type: Date, required: true },
	payment_status: { type: String, required: true },
	amount_total: { type: Number, required: true },
	guests: [{ type: String, required: true }],
	ticket_ids: [{ type: String, required: true }]
});

/** Mongoose schema for persisted tickets. */
const ticketSchema = new mongoose.Schema({
	ticket_id: { type: String, required: true },
	name: { type: String, required: true },
	ticket_type: { type: String, required: true },
	description: { type: String, default: '' },
	status: { type: String, required: true },
	is_paid: { type: Boolean, required: true },
	booking_reference_no: { type: String, required: true },
	checkin_qr_code_image_url: { type: String, required: true }
});

/** Mongoose schema for ticket inventory counters. */
const counterSchema = new mongoose.Schema({
	_id: { type: String, required: true },
	available: { type: Number, default: 0 },
	reserved: { type: Number, default: 0 },
	sold: { type: Number, default: 0 }
});

export const BookingModel = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
export const CounterModel = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

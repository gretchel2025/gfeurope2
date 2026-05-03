import mongoose from "mongoose";
import type {
    BookingRepository,
    TicketRepository,
    TicketCounterRepository,
    UserRepository,
} from "$lib/application/ports";
import { InfrastructureError } from "$lib/application/errors";
import type { Booking } from "$lib/domain/booking";
import type { Ticket } from "$lib/domain/ticket";
import type { TicketCounter, TicketCounterDelta } from "$lib/domain/ticketCounter";
import type { User } from "$lib/domain/user";
import { BookingPaymentStatus, TicketStatus, TicketType } from "$lib/domain/shared/enums";

const bookingSchema = new mongoose.Schema({
    reference_no: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    city: { type: String, default: "" },
    ticket_type: { type: String, required: true },
    book_date: { type: Date, required: true },
    payment_status: { type: String, required: true },
    amount_total: { type: Number, required: true },
    guests: [{ type: String, required: true }],
    ticket_ids: [{ type: String, required: true }],
});

const ticketSchema = new mongoose.Schema({
    ticket_id: { type: String, required: true },
    name: { type: String, required: true },
    ticket_type: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, required: true },
    is_paid: { type: Boolean, required: true },
    booking_reference_no: { type: String, required: true },
    checkin_qr_code_image_url: { type: String, required: true },
});

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    available: { type: Number, default: 0 },
    reserved: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
});

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    roles: [{ type: String, required: true }],
});

const BookingModel = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
const TicketModel = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema);
const CounterModel = mongoose.models.Counter || mongoose.model("Counter", counterSchema);
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export class MongoBookingRepository implements BookingRepository {
    async insert(booking: Booking): Promise<Booking> {
        await BookingModel.create({
            ...booking,
            book_date: new Date(booking.book_date),
        });
        return booking;
    }

    async findByReferenceNo(referenceNo: string): Promise<Booking | null> {
        const record = await BookingModel.findOne({ reference_no: referenceNo });
        return record ? mapBooking(record) : null;
    }

    async list(): Promise<Booking[]> {
        const records = await BookingModel.find({});
        return records.map(mapBooking);
    }

    async updatePaymentStatus(referenceNo: string, value: BookingPaymentStatus): Promise<void> {
        await BookingModel.findOneAndUpdate({ reference_no: referenceNo }, { payment_status: value });
    }

    async appendTicketId(referenceNo: string, ticketId: string): Promise<void> {
        await BookingModel.updateOne({ reference_no: referenceNo }, { $push: { ticket_ids: ticketId } });
    }
}

export class MongoTicketRepository implements TicketRepository {
    async insert(ticket: Ticket): Promise<string> {
        await TicketModel.create(ticket);
        return ticket.ticket_id;
    }

    async findByTicketId(ticketId: string): Promise<Ticket | null> {
        const record = await TicketModel.findOne({ ticket_id: ticketId });
        return record ? mapTicket(record) : null;
    }

    async list(): Promise<Ticket[]> {
        const records = await TicketModel.find({});
        return records.map(mapTicket);
    }

    async updateStatus(ticketId: string, status: TicketStatus): Promise<void> {
        await TicketModel.findOneAndUpdate({ ticket_id: ticketId }, { status });
    }

    async deleteByTicketId(ticketId: string): Promise<void> {
        await TicketModel.deleteOne({ ticket_id: ticketId });
    }
}

export class MongoTicketCounterRepository implements TicketCounterRepository {
    async create(counterId: string, values?: TicketCounterDelta): Promise<void> {
        await CounterModel.create({
            _id: counterId,
            available: values?.available ?? 0,
            reserved: values?.reserved ?? 0,
            sold: values?.sold ?? 0,
        });
    }

    async findById(id: string): Promise<TicketCounter | null> {
        try {
            const record = await CounterModel.findOne({ _id: id });
            return record ? mapTicketCounter(record) : null;
        } catch (error) {
            throw new InfrastructureError("ticket counter lookup failed");
        }
    }

    async set(id: string, values: TicketCounterDelta): Promise<void> {
        await CounterModel.findOneAndUpdate(
            { _id: id },
            { $set: values },
        );
    }

    async increment(id: string, values: TicketCounterDelta): Promise<void> {
        try {
            await CounterModel.findOneAndUpdate({ _id: id }, { $inc: values });
        } catch (error) {
            throw new InfrastructureError("ticket counter update failed");
        }
    }
}

export class MongoUserRepository implements UserRepository {
    async insert(user: User): Promise<void> {
        await UserModel.create(user);
    }

    async findById(id: string): Promise<User | null> {
        const record = await UserModel.findOne({ _id: id });
        return record ? mapUser(record) : null;
    }
}

function mapBooking(record: Record<string, unknown>): Booking {
    return {
        reference_no: String(record.reference_no),
        name: String(record.name),
        email: String(record.email),
        city: String(record.city ?? ""),
        ticket_type: record.ticket_type as TicketType,
        book_date: new Date(record.book_date as string | Date).toISOString(),
        payment_status: record.payment_status as BookingPaymentStatus,
        amount_total: Number(record.amount_total),
        guests: Array.isArray(record.guests) ? record.guests.map(String) : [],
        ticket_ids: Array.isArray(record.ticket_ids) ? record.ticket_ids.map(String) : [],
    };
}

function mapTicket(record: Record<string, unknown>): Ticket {
    return {
        ticket_id: String(record.ticket_id),
        name: String(record.name),
        ticket_type: record.ticket_type as TicketType,
        description: String(record.description ?? ""),
        status: record.status as TicketStatus,
        is_paid: Boolean(record.is_paid),
        booking_reference_no: String(record.booking_reference_no),
        checkin_qr_code_image_url: String(record.checkin_qr_code_image_url),
    };
}

function mapTicketCounter(record: Record<string, unknown>): TicketCounter {
    return {
        _id: String(record._id),
        available: Number(record.available),
        reserved: Number(record.reserved),
        sold: Number(record.sold),
    };
}

function mapUser(record: Record<string, unknown>): User {
    return {
        _id: String(record._id),
        roles: Array.isArray(record.roles) ? record.roles.map(String) : [],
    };
}

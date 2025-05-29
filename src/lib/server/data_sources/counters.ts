// import * as mongoose from "mongoose";
import mongoose from "mongoose";
import type {TicketCounter} from "$lib/entities/models";
import * as errors from "$lib/entities/errors";
import type {Query} from "mongoose";

const counterSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true },
        available: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        sold: { type: Number, default: 0 }
    }
);

// const counterCollection = await mongoose.model('counters', counterSchema);
const counterCollection = mongoose.models.counters || mongoose.model('counters', counterSchema);

// this was used one time to create an initial record
export async function Create (counterID: string): Promise<void> {
    await counterCollection.create(
        { _id: counterID },
    )
}

export async function GetByID(id: string): Promise<TicketCounter | null> {
    // do read
    let doc
    try {
        doc = await counterCollection.findOne({ _id: id })
    } catch (e) {
        console.warn("db/counters: GetByID() error:", e)

        // if there is any error from the db op, treat it as timeout
        throw errors.ERR_DB_TIMEOUT
    }

    // handle not found
    if (!doc) {
        console.log(`[ERROR] DB: GetByID(${id}) Not Found`)
        return null
    }

    // respond
    return {
        _id: doc._id,
        available: doc.available,
        reserved: doc.reserved,
        sold: doc.sold,
    }
}

// set the values exactly as given
export async function Set(
    id: string,
    values: {
        available: number,
        reserved: number,
        sold: number,
    }
): Promise<void> {
    await counterCollection.findByIdAndUpdate(
        { _id: id },
        { $set: {
                available: values.available,
                reserved: values.reserved,
                sold: values.sold,
            } },
    )
}

// increment the values as given. Possible to decrement by using negative values.
export async function Increment (
    id: string,
    values: {
        available: number,
        reserved: number,
        sold: number,
    }
): Promise<void> {
    try {
        // do update
        await counterCollection.findByIdAndUpdate(
            {_id: id},
            {
                $inc: {
                    available: values.available,
                    reserved: values.reserved,
                    sold: values.sold,
                }
            },
        )
    } catch (e) {
        // handle errors
        console.warn("db/counters: Increment() error:", e)

        // if there is any error from the db op, treat it as timeout
        throw errors.ERR_DB_TIMEOUT
    }
}

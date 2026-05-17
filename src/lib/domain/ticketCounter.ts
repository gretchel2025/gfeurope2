/**
 * Purpose:
 * This file defines the ticket inventory counter shapes.
 *
 * Why this structure is good:
 * Even simple shared types are easier to reason about when the application and
 * infrastructure layers agree on one canonical shape.
 */
/** Persisted counter for one ticket class. */
export type TicketCounter = {
    _id: string;
    available: number;
    reserved: number;
    sold: number;
};

/** Delta object used when incrementing or decrementing inventory buckets. */
export type TicketCounterDelta = {
    available: number;
    reserved: number;
    sold: number;
};

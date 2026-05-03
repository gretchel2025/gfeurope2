export type TicketCounter = {
    _id: string;
    available: number;
    reserved: number;
    sold: number;
};

export type TicketCounterDelta = {
    available: number;
    reserved: number;
    sold: number;
};

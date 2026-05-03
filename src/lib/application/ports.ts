import type { Booking, TicketWithQRCode } from "$lib/domain/booking";
import type { Ticket, QRCode } from "$lib/domain/ticket";
import type { TicketCounter, TicketCounterDelta } from "$lib/domain/ticketCounter";
import type { User } from "$lib/domain/user";
import type { BookingPaymentStatus, TicketStatus } from "$lib/domain/shared/enums";

export type EmailMessage = {
    from: string;
    to: string;
    subject: string;
    message: string;
};

export interface BookingRepository {
    insert(booking: Booking): Promise<Booking>;
    findByReferenceNo(referenceNo: string): Promise<Booking | null>;
    list(): Promise<Booking[]>;
    updatePaymentStatus(referenceNo: string, value: BookingPaymentStatus): Promise<void>;
    appendTicketId(referenceNo: string, ticketId: string): Promise<void>;
}

export interface TicketRepository {
    insert(ticket: Ticket): Promise<string>;
    findByTicketId(ticketId: string): Promise<Ticket | null>;
    list(): Promise<Ticket[]>;
    updateStatus(ticketId: string, status: TicketStatus): Promise<void>;
    deleteByTicketId(ticketId: string): Promise<void>;
}

export interface TicketCounterRepository {
    create(counterId: string, values?: TicketCounterDelta): Promise<void>;
    findById(id: string): Promise<TicketCounter | null>;
    set(id: string, values: TicketCounterDelta): Promise<void>;
    increment(id: string, values: TicketCounterDelta): Promise<void>;
}

export interface UserRepository {
    insert(user: User): Promise<void>;
    findById(id: string): Promise<User | null>;
}

export interface EmailSender {
    send(message: EmailMessage): Promise<void>;
}

export interface ImageStorage {
    uploadImage(imageData: string): Promise<string>;
}

export interface QrCodeGenerator {
    generate(url: string): Promise<string>;
}

export interface EventLogger {
    log(eventName: string, byUser: string, details: Record<string, unknown> | null): void;
}

export interface SystemSettingsStore {
    getNewBookingsAllowed(): boolean;
    setNewBookingsAllowed(enabled: boolean): void;
}

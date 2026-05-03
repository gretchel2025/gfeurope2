/**
 * Purpose:
 * This service owns the booking lifecycle: create, pay, cancel, and ticket generation.
 *
 * Why this structure is good:
 * Booking orchestration lives in one application service instead of being split
 * across routes, database modules, and UI handlers. That makes business flows
 * easier to follow and gives routes a thin adapter role.
 */
import { NotFoundError, ValidationError } from "$lib/application/errors";
import type { BookingRepository, EventLogger } from "$lib/application/ports";
import type {
    Booking,
    CreateBookingInput,
    TicketWithQRCode,
} from "$lib/domain/booking";
import {
    canCancelBooking,
    canGenerateTickets,
    canMarkBookingPaid,
    computeTotalAmountDue,
    getTopCitiesByCountOfTicketsBooked,
} from "$lib/domain/booking";
import type { Ticket } from "$lib/domain/ticket";
import { normalizeTicketType } from "$lib/domain/ticket";
import { BookingPaymentStatus } from "$lib/domain/shared/enums";
import type { TicketCounterService } from "$lib/application/services/ticketCounterService";
import type { TicketService } from "$lib/application/services/ticketService";
import type { NotificationService } from "$lib/application/services/notificationService";

/** Coordinates booking-related use cases across repositories and other services. */
export class BookingService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly ticketCounterService: TicketCounterService,
        private readonly ticketService: TicketService,
        private readonly notificationService: NotificationService,
        private readonly eventLogger: EventLogger,
        private readonly randomIdGenerator: (size: number) => string,
    ) {}

    /** Creates a new booking and updates inventory in the same application flow. */
    async createNew(input: CreateBookingInput): Promise<Booking> {
        if (input.quantity < 1 || input.quantity > 10) {
            throw new ValidationError("validation failed: quantity must be between 1 and 10");
        }

        const ticketType = normalizeTicketType(input.ticket_type);
        if (input.guests.length !== input.quantity) {
            throw new ValidationError("validation failed: guest count must match quantity");
        }

        const counter = await this.ticketCounterService.getByTicketType(ticketType);
        if (!counter) {
            throw new NotFoundError("ticket counter is missing");
        }
        if (counter.available < input.quantity) {
            throw new ValidationError(`Only ${counter.available} ${ticketType} tickets are available`);
        }

        const booking: Booking = {
            reference_no: this.generateBookingReferenceNo(),
            name: input.name,
            email: input.email,
            city: input.city,
            ticket_type: ticketType,
            book_date: new Date().toISOString(),
            payment_status: BookingPaymentStatus.UNPAID,
            amount_total: computeTotalAmountDue(ticketType, input.guests.length),
            guests: input.guests,
            ticket_ids: [],
        };

        const createdBooking = await this.bookingRepository.insert(booking);
        await this.ticketCounterService.incrementForBooking(createdBooking, {
            available: -input.quantity,
            reserved: input.quantity,
            sold: 0,
        });
        await this.notificationService.sendBookingConfirmation(createdBooking);

        this.eventLogger.log("BOOKING_RESERVATION_CREATED", createdBooking.email, {
            booking_reference_no: createdBooking.reference_no,
            count: createdBooking.guests.length,
            ticket_type: createdBooking.ticket_type,
        });

        return createdBooking;
    }

    /** Loads a booking by reference number when callers can handle a missing result. */
    async getById(referenceNo: string): Promise<Booking | null> {
        return await this.bookingRepository.findByReferenceNo(referenceNo);
    }

    /** Loads a booking by reference number and fails loudly when it must exist. */
    async getRequiredById(referenceNo: string): Promise<Booking> {
        const booking = await this.getById(referenceNo);
        if (!booking) {
            throw new NotFoundError("booking not found");
        }
        return booking;
    }

    /** Returns all stored bookings for admin and reporting screens. */
    async list(): Promise<Booking[]> {
        return await this.bookingRepository.list();
    }

    /** Marks an unpaid booking as paid and moves reserved inventory into sold inventory. */
    async markPaid(referenceNo: string): Promise<void> {
        const booking = await this.getRequiredById(referenceNo);
        if (!canMarkBookingPaid(booking)) {
            throw new ValidationError("Booking cannot be further marked as paid");
        }

        await this.bookingRepository.updatePaymentStatus(booking.reference_no, BookingPaymentStatus.PAID);
        await this.ticketCounterService.incrementForBooking(booking, {
            available: 0,
            reserved: -booking.guests.length,
            sold: booking.guests.length,
        });

        this.eventLogger.log("BOOKING_MARKED_AS_PAID", "system", {
            booking_reference_no: booking.reference_no,
            email: booking.email,
            payment_status: BookingPaymentStatus.PAID,
        });
    }

    /** Creates any missing tickets for a paid booking without duplicating existing ones. */
    async generateRelatedTickets(referenceNo: string): Promise<string[]> {
        const booking = await this.getRequiredById(referenceNo);
        if (!canGenerateTickets(booking)) {
            throw new ValidationError("Booking is in a state where it cannot generate tickets");
        }

        if (booking.ticket_ids.length >= booking.guests.length) {
            return [];
        }

        const ticketIds: string[] = [];
        const guestsWithoutTickets = booking.guests.slice(booking.ticket_ids.length);
        for (const guest of guestsWithoutTickets) {
            const ticket = await this.ticketService.createNew({
                name: guest,
                ticket_type: booking.ticket_type,
                description: "",
                booking_reference_no: referenceNo,
                is_paid: true,
            });

            await this.bookingRepository.appendTicketId(referenceNo, ticket.ticket_id);
            ticketIds.push(ticket.ticket_id);
            this.eventLogger.log("TICKET_APPENDED_TO_BOOKING", "system", {
                booking_reference_no: booking.reference_no,
                booking_email: booking.email,
                related_ticket_id: ticket.ticket_id,
                related_ticket_guest_name: ticket.name,
            });
        }

        return ticketIds;
    }

    /** Resolves all tickets referenced by a booking. */
    async getRelatedTickets(referenceNo: string): Promise<Ticket[]> {
        const booking = await this.getRequiredById(referenceNo);
        const tickets = await Promise.all(
            booking.ticket_ids.map(async (ticketId) => await this.ticketService.getById(ticketId))
        );
        return tickets.filter((ticket): ticket is Ticket => Boolean(ticket));
    }

    /** Enriches booking tickets with QR code payloads for email or detail screens. */
    async getRelatedTicketsWithCheckinQRCode(referenceNo: string): Promise<TicketWithQRCode[]> {
        const tickets = await this.getRelatedTickets(referenceNo);
        return await Promise.all(
            tickets.map(async (ticket) => ({
                ticket,
                qrCodeData: await this.ticketService.getCheckinQRCode(ticket.ticket_id, referenceNo),
            }))
        );
    }

    /** Cancels an unpaid reservation and returns its reserved inventory to availability. */
    async cancelBookingReservation(referenceNo: string): Promise<void> {
        const booking = await this.getRequiredById(referenceNo);
        if (!canCancelBooking(booking)) {
            throw new ValidationError("Only UNPAID Bookings can be cancelled");
        }

        await this.bookingRepository.updatePaymentStatus(
            referenceNo,
            BookingPaymentStatus.BOOKING_RESERVATION_CANCELLED,
        );
        await this.ticketCounterService.incrementForBooking(booking, {
            available: booking.guests.length,
            reserved: -booking.guests.length,
            sold: 0,
        });

        this.eventLogger.log("BOOKING_RESERVATION_CANCELLED", "system", {
            booking_reference_no: booking.reference_no,
            booking_email: booking.email,
            ticket_type: booking.ticket_type,
            count: booking.guests.length,
        });
    }

    /** Delegates city aggregation to the domain so reporting logic stays reusable. */
    getTopCitiesByCountOfTicketsBooked(bookings: Booking[]) {
        return getTopCitiesByCountOfTicketsBooked(bookings);
    }

    /** Generates the booking reference format used throughout the app. */
    private generateBookingReferenceNo(): string {
        const part1 = this.randomIdGenerator(3);
        const part2 = this.randomIdGenerator(4);
        return `B${part1}${part2}`;
    }
}

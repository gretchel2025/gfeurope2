import { NotFoundError } from "$lib/application/errors";
import type { BookingRepository, EmailMessage, EmailSender, TicketRepository } from "$lib/application/ports";
import type { Booking } from "$lib/domain/booking";

export class NotificationService {
    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly ticketRepository: TicketRepository,
        private readonly emailSender: EmailSender,
    ) {}

    async sendBookingConfirmation(booking: Booking): Promise<void> {
        const paypalBaseUrl = "https://paypal.me/TheFeastNorway";
        const paypalUrl = `${paypalBaseUrl}/${booking.amount_total}?country.x=NO&locale.x=en_US&item_name=${booking.reference_no}`;
        const amountNOK = Math.round(booking.amount_total * 11.52);

        await this.emailSender.send({
            from: "",
            to: booking.email,
            subject: `Your Ticket Reservation ${booking.reference_no}`,
            message: `
            <html>
                <body>
                    <h1>Hello ${booking.name},</h1>
                    <h2>Greetings from the Grand Feast EU and UK!</h2>
                    <p>Please complete your payment within <strong>24H</strong> and use reference <strong>${booking.reference_no}</strong>.</p>
                    <p>PayPal link: <a href="${paypalUrl}">${paypalUrl}</a></p>
                    <p>Approximate amount in NOK: ${amountNOK}</p>
                    <p>${booking.guests.length} ${booking.ticket_type} ticket(s), total ${booking.amount_total} EUR.</p>
                </body>
            </html>
            `,
        });
    }

    async sendTicketsEmail(bookingReferenceNo: string): Promise<void> {
        const booking = await this.bookingRepository.findByReferenceNo(bookingReferenceNo);
        if (!booking) {
            throw new NotFoundError("booking not found");
        }

        const tickets = await this.loadTickets(booking);

        await this.emailSender.send({
            from: "",
            to: booking.email,
            subject: `Your Tickets ${booking.reference_no}`,
            message: `
            <html>
                <body>
                    <h2>Dear ${booking.name},</h2>
                    <p>Here are your eTickets for the 2025 EU and UK Grand Feast in Oslo.</p>
                    ${tickets
                        .map(
                            (ticket, i) => `
                            <div>
                                <h3>${i + 1}: eTicket ${ticket.ticket_id}</h3>
                                Name: ${ticket.name}<br>
                                Ticket Class: ${ticket.ticket_type}<br>
                                <img src="${ticket.checkin_qr_code_image_url}" alt="QR Code" />
                            </div>
                            <hr>
                        `
                        )
                        .join("")}
                    <p>Booking reference number: ${booking.reference_no}</p>
                    <p>${booking.ticket_ids.length} ${booking.ticket_type} tickets, ${booking.amount_total} EUR, ${booking.payment_status}</p>
                </body>
            </html>
            `,
        });
    }

    async sendPaymentReminder(bookingReferenceNo: string): Promise<void> {
        const booking = await this.bookingRepository.findByReferenceNo(bookingReferenceNo);
        if (!booking) {
            throw new NotFoundError("booking not found");
        }

        const paypalBaseUrl = "https://paypal.me/TheFeastNorway";
        const paypalUrl = `${paypalBaseUrl}/${booking.amount_total}?country.x=NO&locale.x=en_US&item_name=${booking.reference_no}`;

        await this.emailSender.send({
            from: "",
            to: booking.email,
            subject: `Gentle Reminder: Your Ticket Reservation ${booking.reference_no} is Waiting`,
            message: `
            <html>
                <body>
                    <h1>Hello ${booking.name},</h1>
                    <h3>A gentle reminder that your ticket reservation is awaiting payment.</h3>
                    <p>Please make your payment and reference <strong>${booking.reference_no}</strong>.</p>
                    <p>PayPal link: <a href="${paypalUrl}">${paypalUrl}</a></p>
                </body>
            </html>
            `,
        });
    }

    private async loadTickets(booking: Booking) {
        const tickets = await Promise.all(
            booking.ticket_ids.map(async (ticketId) => await this.ticketRepository.findByTicketId(ticketId))
        );
        return tickets.filter((ticket): ticket is NonNullable<typeof ticket> => Boolean(ticket));
    }
}

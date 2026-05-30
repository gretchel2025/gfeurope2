/**
 * Purpose:
 * This service builds and sends booking-related emails.
 *
 * Why this structure is good:
 * Email composition is application behavior, but delivery is infrastructure.
 * Splitting those concerns keeps templates near the use cases while still
 * allowing the actual sending mechanism to be swapped out cleanly.
 */
import { NotFoundError } from '$lib/application/errors';
import type { BookingRepository, EmailSender, TicketRepository } from '$lib/application/ports';
import type { Booking } from '$lib/domain/booking';
import { formatTicketTypeLabel } from '$lib/domain/shared/enums';

const bankAccountName = 'LIGHT OF JESUS FAMILY IRELAND';
const bankIban = 'IE12 BOFI 9000 1780 5681 80';

/** Sends the user-facing emails associated with bookings and tickets. */
export class NotificationService {
	constructor(
		private readonly bookingRepository: BookingRepository,
		private readonly ticketRepository: TicketRepository,
		private readonly emailSender: EmailSender
	) {}

	/** Sends the initial reservation email after payment proof has been submitted. */
	async sendBookingConfirmation(booking: Booking): Promise<void> {
		const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);

		await this.emailSender.send({
			to: booking.email,
			subject: `Your Ticket Reservation ${booking.reference_no}`,
			message: `
            <html>
                <body>
                    <h1>Hello ${booking.name},</h1>
                    <h2>Greetings from the Grand Feast EU and UK!</h2>
                    <p>We received your reservation and proof of bank transfer. Your payment is now awaiting verification.</p>
                    <p>Booking reference: <strong>${booking.reference_no}</strong></p>
                    <p>Bank account: <strong>${bankAccountName}</strong><br>IBAN: <strong>${bankIban}</strong></p>
                    <p>${booking.guests.length} ${ticketTypeLabel} ticket(s), total ${booking.amount_total} EUR.</p>
                </body>
            </html>
            `
		});
	}

	/** Sends the final e-ticket email after tickets have been generated. */
	async sendTicketsEmail(bookingReferenceNo: string): Promise<void> {
		const booking = await this.bookingRepository.findByReferenceNo(bookingReferenceNo);
		if (!booking) {
			throw new NotFoundError('booking not found');
		}

		const tickets = await this.loadTickets(booking);
		const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);

		await this.emailSender.send({
			to: booking.email,
			subject: `Your Tickets ${booking.reference_no}`,
			message: `
            <html>
                <body>
                    <h2>Dear ${booking.name},</h2>
                    <p>Here are your eTickets for the 2026 EU and UK Grand Feast in Dublin.</p>
                    ${tickets
											.map(
												(ticket, i) => `
                            <div>
                                <h3>${i + 1}: eTicket ${ticket.ticket_id}</h3>
                                Name: ${ticket.name}<br>
                                Ticket Class: ${formatTicketTypeLabel(ticket.ticket_type)}<br>
                                <img src="${ticket.checkin_qr_code_image_url}" alt="QR Code" />
                            </div>
                            <hr>
                        `
											)
											.join('')}
                    <p>Booking reference number: ${booking.reference_no}</p>
                    <p>${booking.ticket_ids.length} ${ticketTypeLabel} tickets, ${booking.amount_total} EUR, ${booking.payment_status}</p>
                </body>
            </html>
            `
		});
	}

	/** Sends a reminder for a booking that is still awaiting payment. */
	async sendPaymentReminder(bookingReferenceNo: string): Promise<void> {
		const booking = await this.bookingRepository.findByReferenceNo(bookingReferenceNo);
		if (!booking) {
			throw new NotFoundError('booking not found');
		}

		await this.emailSender.send({
			to: booking.email,
			subject: `Gentle Reminder: Your Ticket Reservation ${booking.reference_no} is Waiting`,
			message: `
            <html>
                <body>
                    <h1>Hello ${booking.name},</h1>
                    <h3>A gentle reminder that your ticket reservation is awaiting payment.</h3>
                    <p>Please make your payment and reference <strong>${booking.reference_no}</strong>.</p>
                    <p>Bank account: <strong>${bankAccountName}</strong><br>IBAN: <strong>${bankIban}</strong></p>
                </body>
            </html>
            `
		});
	}

	/** Loads all concrete ticket records for the given booking. */
	private async loadTickets(booking: Booking) {
		const tickets = await Promise.all(
			booking.ticket_ids.map(
				async (ticketId) => await this.ticketRepository.findByTicketId(ticketId)
			)
		);
		return tickets.filter((ticket): ticket is NonNullable<typeof ticket> => Boolean(ticket));
	}
}

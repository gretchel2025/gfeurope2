/**
 * Purpose:
 * This service builds and sends booking-related emails.
 *
 * Why this structure is good:
 * Email composition is application behavior, but delivery is infrastructure.
 * Splitting those concerns keeps templates near the use cases while still
 * allowing the actual sending mechanism to be swapped out cleanly.
 */
import { ConflictError, NotFoundError } from '$lib/application/errors';
import type {
	BookingRepository,
	EmailSender,
	EmailSendResult,
	TicketRepository
} from '$lib/application/ports';
import type { AuditEventService } from '$lib/application/services/auditEventService';
import {
	AuditAction,
	AuditEntityType,
	systemAuditActor,
	type AuditActor
} from '$lib/domain/auditEvent';
import type { Booking } from '$lib/domain/booking';
import { grandFeastPaymentDetails } from '$lib/domain/paymentDetails';
import { BookingConfirmationEmailStatus, formatTicketTypeLabel } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';

const supportEmail = 'help@grandfeast.eu';

const eventDetails = {
	name: 'Grand Feast EU and UK 2026',
	formalName: '2026 EU and UK Grand Feast in Dublin',
	date: 'October 3, 2026',
	time: ['12:00 PM Registration', '12:30 PM Holy Mass', '1:30 PM Event Proper'],
	venue: "St. Helen's Hotel",
	address: ['Stillorgan Road, Blackrock, Ireland', 'Dublin A94 V6W3']
};

/** Sends the user-facing emails associated with bookings and tickets. */
export class NotificationService {
	constructor(
		private readonly bookingRepository: BookingRepository,
		private readonly ticketRepository: TicketRepository,
		private readonly emailSender: EmailSender,
		private readonly auditEventService: AuditEventService
	) {}

	/** Sends the initial reservation email after payment proof has been submitted. */
	async sendBookingConfirmation(booking: Booking): Promise<EmailSendResult> {
		return await this.emailSender.send({
			to: booking.email,
			subject: `We received your Grand Feast booking ${booking.reference_no}`,
			message: buildReservationEmail(booking)
		});
	}

	/** Sends the final e-ticket email after tickets have been generated. */
	async sendTicketsEmail(
		bookingReferenceNo: string,
		actor: AuditActor = systemAuditActor
	): Promise<EmailSendResult> {
		const booking = await this.bookingRepository.findByReferenceNo(bookingReferenceNo);
		if (!booking) {
			throw new NotFoundError('booking not found');
		}

		requireDeliverableBookingEmail(booking);
		const tickets = await this.loadTickets(booking);

		const emailResult = await this.emailSender.send({
			to: booking.email,
			subject: `Your Grand Feast eTickets ${booking.reference_no}`,
			message: buildTicketsEmail(booking, tickets)
		});
		requireAcceptedEmail(emailResult);
		await this.auditEventService.record({
			...actor,
			event_id: booking.event_id,
			action: AuditAction.BookingTicketsEmailSent,
			entity_type: AuditEntityType.Booking,
			entity_id: booking.reference_no,
			metadata: {
				booking_reference_no: booking.reference_no,
				email: booking.email,
				ticket_type: booking.ticket_type,
				quantity: tickets.length,
				ticket_ids: tickets.map((ticket) => ticket.ticket_id),
				amount_total: booking.amount_total,
				payment_status: booking.payment_status
			}
		});
		await this.bookingRepository.markTicketsSentToClient(booking.reference_no);
		await this.auditEventService.record({
			...actor,
			event_id: booking.event_id,
			action: AuditAction.BookingMarkedTicketsAsSent,
			entity_type: AuditEntityType.Booking,
			entity_id: booking.reference_no,
			metadata: {
				booking_reference_no: booking.reference_no,
				email: booking.email,
				ticket_type: booking.ticket_type,
				quantity: tickets.length,
				ticket_ids: tickets.map((ticket) => ticket.ticket_id),
				previous_tickets_sent_to_client: booking.tickets_sent_to_client,
				tickets_sent_to_client: true
			}
		});
		return emailResult;
	}

	/** Sends a reminder for a booking that is still awaiting payment. */
	async sendPaymentReminder(
		bookingReferenceNo: string,
		actor: AuditActor = systemAuditActor
	): Promise<EmailSendResult> {
		const booking = await this.bookingRepository.findByReferenceNo(bookingReferenceNo);
		if (!booking) {
			throw new NotFoundError('booking not found');
		}

		requireDeliverableBookingEmail(booking);
		const emailResult = await this.emailSender.send({
			to: booking.email,
			subject: `Payment reminder for your Grand Feast booking ${booking.reference_no}`,
			message: buildPaymentReminderEmail(booking)
		});
		requireAcceptedEmail(emailResult);
		await this.auditEventService.record({
			...actor,
			event_id: booking.event_id,
			action: AuditAction.BookingPaymentReminderSent,
			entity_type: AuditEntityType.Booking,
			entity_id: booking.reference_no,
			metadata: {
				booking_reference_no: booking.reference_no,
				email: booking.email,
				ticket_type: booking.ticket_type,
				quantity: booking.guests.length,
				amount_total: booking.amount_total,
				payment_status: booking.payment_status
			}
		});
		return emailResult;
	}

	/** Loads all concrete ticket records for the given booking. */
	private async loadTickets(booking: Booking) {
		if (booking.ticket_ids.length === 0) {
			throw new ConflictError('booking has no generated tickets');
		}

		const tickets = await Promise.all(
			booking.ticket_ids.map(
				async (ticketId) => await this.ticketRepository.findByTicketId(ticketId)
			)
		);
		const loadedTickets = tickets.filter((ticket): ticket is NonNullable<typeof ticket> =>
			Boolean(ticket)
		);
		if (loadedTickets.length !== booking.ticket_ids.length) {
			throw new ConflictError('booking ticket records are incomplete');
		}
		return loadedTickets;
	}
}

function requireDeliverableBookingEmail(booking: Booking): void {
	if (booking.booking_confirmation_email_status !== BookingConfirmationEmailStatus.FAILED) {
		return;
	}

	const reason = booking.booking_confirmation_email_error
		? ` Reason: ${booking.booking_confirmation_email_error}`
		: '';
	throw new ConflictError(`email delivery already failed for this booking.${reason}`);
}

function requireAcceptedEmail(result: EmailSendResult): void {
	if (result.status === 'SKIPPED') {
		throw new ConflictError('email sending is not configured');
	}
}

function buildReservationEmail(booking: Booking): string {
	const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);

	return buildEmailShell({
		preheader: `Your booking ${booking.reference_no} was received and is awaiting payment verification.`,
		eyebrow: 'Booking Received',
		title: 'Thank you for your reservation',
		body: `
			${paragraph(`Dear ${escapeHtml(booking.name)},`)}
			${paragraph(
				`We received your reservation and proof of payment for ${eventDetails.name}. We are excited to welcome you to Dublin.`
			)}
			${callout(`
				<strong>Payment verification can take up to 48 hours.</strong><br>
				Once your payment has been verified, you will receive your eTickets by email.
			`)}
			${sectionTitle('Booking Details')}
			${detailTable([
				['Booking reference', booking.reference_no],
				['Ticket class', ticketTypeLabel],
				['Quantity', String(booking.guests.length)],
				['Total amount', formatAmount(booking.amount_total)]
			])}
			${sectionTitle('Bank Transfer Details')}
			${paymentDetailsTable(booking.email)}
			${guestList(booking.guests)}
			${eventDetailsBlock()}
			${paragraph(
				`If you need help with your booking, please contact us at <a href="mailto:${supportEmail}" style="color:#005b72;font-weight:700;">${supportEmail}</a>.`
			)}
			${paragraph('Best regards,<br><strong>Grand Feast EU and UK Team</strong>')}
		`
	});
}

function buildTicketsEmail(booking: Booking, tickets: Ticket[]): string {
	const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);

	return buildEmailShell({
		preheader: `Your eTickets for ${eventDetails.name} are ready.`,
		eyebrow: 'Your eTickets',
		title: 'Your Grand Feast eTickets are ready',
		body: `
			${paragraph(`Dear ${escapeHtml(booking.name)},`)}
			${paragraph(
				`Here are your eTickets for ${eventDetails.formalName}. Please bring your eTicket with the QR code, as you will need it for entry at the venue. Having your eTicket ready for scanning will make check-in quick and easy.`
			)}
			${tickets.map((ticket, index) => ticketCard(ticket, index)).join('')}
			${sectionTitle('Booking Summary')}
			${detailTable([
				['Booking reference number', booking.reference_no],
				[
					'Tickets',
					`${booking.ticket_ids.length} ${ticketTypeLabel} ticket${
						booking.ticket_ids.length === 1 ? '' : 's'
					}`
				],
				['Total amount', formatAmount(booking.amount_total)],
				['Payment status', booking.payment_status]
			])}
			${guestList(booking.guests)}
			${eventDetailsBlock()}
			${paragraph('We hope you have a great time at the event!')}
			${paragraph('Have a blessed day!<br><strong>Grand Feast EU and UK Team</strong>')}
		`
	});
}

function buildPaymentReminderEmail(booking: Booking): string {
	const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);

	return buildEmailShell({
		preheader: `Your booking ${booking.reference_no} is still awaiting payment verification.`,
		eyebrow: 'Payment Reminder',
		title: 'Your booking is waiting',
		body: `
			${paragraph(`Dear ${escapeHtml(booking.name)},`)}
			${paragraph(
				`This is a gentle reminder that your ${eventDetails.name} reservation is still marked as unpaid. If you have already made your transfer, please allow up to 48 hours for payment verification.`
			)}
			${sectionTitle('Booking Details')}
			${detailTable([
				['Booking reference', booking.reference_no],
				['Ticket class', ticketTypeLabel],
				['Quantity', String(booking.guests.length)],
				['Total amount', formatAmount(booking.amount_total)],
				['Status', booking.payment_status]
			])}
			${sectionTitle('Bank Transfer Details')}
			${paymentDetailsTable(booking.email)}
			${paragraph(
				`If you need help with your booking, please contact us at <a href="mailto:${supportEmail}" style="color:#005b72;font-weight:700;">${supportEmail}</a>.`
			)}
			${paragraph('Best regards,<br><strong>Grand Feast EU and UK Team</strong>')}
		`
	});
}

function paymentDetailsTable(transferReference: string): string {
	return detailTable([
		['Account name', grandFeastPaymentDetails.accountName],
		['Bank name', grandFeastPaymentDetails.bankName],
		['IBAN', grandFeastPaymentDetails.iban],
		['BIC/SWIFT', grandFeastPaymentDetails.bicSwift],
		['Transfer reference', transferReference]
	]);
}

function buildEmailShell(input: {
	preheader: string;
	eyebrow: string;
	title: string;
	body: string;
}): string {
	return `
		<!doctype html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<title>${escapeHtml(input.title)}</title>
			</head>
			<body style="margin:0;background:#eef6ff;color:#061922;font-family:Arial,Helvetica,sans-serif;">
				<div style="display:none;max-height:0;overflow:hidden;opacity:0;">
					${escapeHtml(input.preheader)}
				</div>
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef6ff;">
					<tr>
						<td align="center" style="padding:28px 14px;">
							<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;overflow:hidden;border-radius:18px;background:#ffffff;border:1px solid #d9e2ec;box-shadow:0 18px 50px rgba(15,23,42,0.10);">
								<tr>
									<td style="height:7px;background:linear-gradient(90deg,#005b72,#d99a32,#d64b55);"></td>
								</tr>
								<tr>
									<td style="padding:30px 28px 12px;">
										<p style="margin:0 0 10px;color:#005b72;font-size:12px;font-weight:800;letter-spacing:2.4px;text-transform:uppercase;">${escapeHtml(
											input.eyebrow
										)}</p>
										<h1 style="margin:0;color:#061922;font-size:30px;line-height:1.15;font-weight:800;">${escapeHtml(
											input.title
										)}</h1>
									</td>
								</tr>
								<tr>
									<td style="padding:10px 28px 30px;">
										${input.body}
									</td>
								</tr>
								<tr>
									<td style="padding:22px 28px;background:#052a3a;color:#fff3df;">
										<p style="margin:0;font-size:13px;line-height:1.6;">
											<strong>Grand Feast EU and UK Team</strong><br>
											Need help? <a href="mailto:${supportEmail}" style="color:#f3c15f;font-weight:700;">${supportEmail}</a>
										</p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
		</html>
	`;
}

function ticketCard(ticket: Ticket, index: number): string {
	const qrCode = ticket.checkin_qr_code_image_url
		? `<img src="${escapeAttribute(ticket.checkin_qr_code_image_url)}" alt="Check-in QR code for ${escapeAttribute(
				ticket.ticket_id
			)}" style="display:block;width:150px;max-width:100%;height:auto;border:1px solid #d9e2ec;border-radius:12px;background:#ffffff;padding:10px;">`
		: '<p style="margin:8px 0 0;color:#64748b;font-size:14px;">QR code unavailable. Please contact support.</p>';

	return `
		<div style="margin:18px 0;padding:18px;border:1px solid #d9e2ec;border-radius:14px;background:#f8fbff;">
			<h2 style="margin:0 0 12px;color:#061922;font-size:20px;line-height:1.3;">
				${index + 1}: eTicket ${escapeHtml(ticket.ticket_id)}
			</h2>
			<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
				<tr>
					<td style="padding:0 0 14px;vertical-align:top;">
						<p style="margin:0 0 8px;color:#334155;font-size:15px;line-height:1.6;">
							<strong>Name:</strong> ${escapeHtml(ticket.name)}<br>
							<strong>Ticket Class:</strong> ${escapeHtml(formatTicketTypeLabel(ticket.ticket_type))}<br>
							<strong>Check-in QR Code</strong>
						</p>
					</td>
				</tr>
				<tr>
					<td>${qrCode}</td>
				</tr>
			</table>
		</div>
	`;
}

function eventDetailsBlock(): string {
	return `
		${sectionTitle('Event Details')}
		${detailTable([
			['Event', eventDetails.formalName],
			['Date', eventDetails.date],
			['Time', eventDetails.time.join('<br>')],
			['Venue', eventDetails.venue],
			['Address', eventDetails.address.join('<br>')]
		])}
	`;
}

function guestList(guests: string[]): string {
	const guestItems = guests
		.map(
			(guest) =>
				`<li style="margin:0 0 6px;color:#334155;font-size:15px;line-height:1.5;">${escapeHtml(
					guest
				)}</li>`
		)
		.join('');

	return `
		${sectionTitle(`${guests.length} Guest${guests.length === 1 ? '' : 's'}`)}
		<ol style="margin:0 0 18px;padding-left:22px;">${guestItems}</ol>
	`;
}

function detailTable(rows: [string, string][]): string {
	const body = rows
		.map(
			([label, value]) => `
				<tr>
					<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;font-weight:700;vertical-align:top;width:42%;">
						${escapeHtml(label)}
					</td>
					<td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#061922;font-size:14px;line-height:1.5;vertical-align:top;">
						${allowLineBreaks(value)}
					</td>
				</tr>
			`
		)
		.join('');

	return `
		<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;border:1px solid #e2e8f0;border-radius:12px;border-collapse:separate;border-spacing:0;overflow:hidden;background:#ffffff;">
			${body}
		</table>
	`;
}

function sectionTitle(title: string): string {
	return `<h2 style="margin:24px 0 10px;color:#005b72;font-size:18px;line-height:1.3;font-weight:800;">${escapeHtml(
		title
	)}</h2>`;
}

function paragraph(content: string): string {
	return `<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.7;">${content}</p>`;
}

function callout(content: string): string {
	return `
		<div style="margin:18px 0;padding:16px 18px;border-left:5px solid #d99a32;border-radius:12px;background:#fff8e8;color:#334155;font-size:15px;line-height:1.6;">
			${content}
		</div>
	`;
}

function formatAmount(amount: number): string {
	const value = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
	return `${value} EUR`;
}

function allowLineBreaks(value: string): string {
	return escapeHtml(value).replaceAll('&lt;br&gt;', '<br>');
}

function escapeAttribute(value: string): string {
	return escapeHtml(value).replaceAll('"', '&quot;');
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

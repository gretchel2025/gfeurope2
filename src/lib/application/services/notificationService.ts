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
import { jewelsEventDisplayTitle, jewelsEventDisplayTitlePlain } from '$lib/domain/eventDisplay';
import {
	getCommunicationDetailsForEvent,
	type EventCommunicationDetails
} from '$lib/domain/eventCommunication';
import type { MerchReservation } from '$lib/domain/merchandise';
import { getPaymentDetailsForEvent, type PaymentDetails } from '$lib/domain/paymentDetails';
import { BookingConfirmationEmailStatus, formatTicketTypeLabel } from '$lib/domain/shared/enums';
import type { Ticket } from '$lib/domain/ticket';

type EmailEventDetails = {
	name: string;
	formalName: string;
	subjectBrand: string;
	hostLocation: string;
	date: string;
	time: string[];
	venue: string;
	address: string[];
	teamName: string;
};

const eventDetailsById: Record<string, EmailEventDetails> = {
	gfeu2026: {
		name: 'Grand Feast Europe 2026',
		formalName: 'Grand Feast Europe 2026 in Dublin',
		subjectBrand: 'Grand Feast',
		hostLocation: 'Dublin',
		date: 'October 3, 2026',
		time: [
			'12:00 PM Registration',
			'1:00 PM Holy Mass',
			'2:00 PM Event Proper',
			'4:30 PM End of Program'
		],
		venue: "St. Helen's Hotel",
		address: ['Stillorgan Road, Blackrock, Ireland', 'Dublin A94 V6W3'],
		teamName: 'Grand Feast Europe Team'
	},
	jewels2026: {
		name: jewelsEventDisplayTitlePlain,
		formalName: jewelsEventDisplayTitle,
		subjectBrand: 'JEWELS CONFERENCE 2026',
		hostLocation: 'Malta',
		date: 'October 31 to November 1, 2026',
		time: [
			'Day 1 - 12:00 PM Registration',
			'Day 1 - 1:00 PM Event Proper',
			'Day 1 - 5:00 PM End of Day 1',
			'Day 1 - 6:00 PM Anticipated Mass',
			'Day 2 - 8:00 AM Breakfast and Morning Socials',
			'Day 2 - 9:00 AM Event Proper',
			'Day 2 - 12:00 PM End of Day 2'
		],
		venue: "St Julian's, Lapsi Street, Malta",
		address: ["St Julian's, Lapsi Street, Malta"],
		teamName: 'JEWELS Europe Team'
	}
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
		const eventDetails = getEmailEventDetails(booking.event_id);
		const communicationDetails = getCommunicationDetailsForEvent(booking.event_id);

		return await this.emailSender.send({
			to: booking.email,
			subject: `We received your ${eventDetails.subjectBrand} booking ${booking.reference_no}`,
			message: buildReservationEmail(booking, eventDetails, communicationDetails),
			...emailSenderOverrideForEvent(booking.event_id, communicationDetails)
		});
	}

	/** Sends the public merchandise reservation confirmation email. */
	async sendMerchReservationConfirmation(reservation: MerchReservation): Promise<EmailSendResult> {
		const eventDetails = getEmailEventDetails(reservation.event_id);
		const communicationDetails = getCommunicationDetailsForEvent(reservation.event_id);

		return await this.emailSender.send({
			to: reservation.email,
			subject: `Your ${eventDetails.subjectBrand} merchandise reservation ${reservation.reservation_id}`,
			message: buildMerchReservationEmail(reservation, eventDetails, communicationDetails),
			...emailSenderOverrideForEvent(reservation.event_id, communicationDetails)
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
		const eventDetails = getEmailEventDetails(booking.event_id);
		const communicationDetails = getCommunicationDetailsForEvent(booking.event_id);

		const emailResult = await this.emailSender.send({
			to: booking.email,
			subject: `Your ${eventDetails.subjectBrand} eTickets ${booking.reference_no}`,
			message: buildTicketsEmail(booking, tickets, eventDetails, communicationDetails),
			...emailSenderOverrideForEvent(booking.event_id, communicationDetails)
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
		const eventDetails = getEmailEventDetails(booking.event_id);
		const communicationDetails = getCommunicationDetailsForEvent(booking.event_id);
		const emailResult = await this.emailSender.send({
			to: booking.email,
			subject: `Payment reminder for your ${eventDetails.subjectBrand} booking ${booking.reference_no}`,
			message: buildPaymentReminderEmail(booking, eventDetails, communicationDetails),
			...emailSenderOverrideForEvent(booking.event_id, communicationDetails)
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

function getEmailEventDetails(eventId: string): EmailEventDetails {
	return eventDetailsById[eventId] ?? eventDetailsById.gfeu2026;
}

function emailSenderOverrideForEvent(
	eventId: string,
	communicationDetails: EventCommunicationDetails
) {
	if (eventId !== 'jewels2026') {
		return {};
	}

	return {
		from: communicationDetails.sender,
		replyTo: communicationDetails.sender
	};
}

function supportEmailLink(communicationDetails: EventCommunicationDetails): string {
	const email = escapeHtml(communicationDetails.email);
	const mailto = escapeAttribute(communicationDetails.email);
	return `<a href="mailto:${mailto}" style="color:#005b72;font-weight:700;">${email}</a>`;
}

function buildReservationEmail(
	booking: Booking,
	eventDetails: EmailEventDetails,
	communicationDetails: EventCommunicationDetails
): string {
	const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);
	const supportLink = supportEmailLink(communicationDetails);

	return buildEmailShell(
		{
			preheader: `Your booking ${booking.reference_no} was received and is awaiting payment verification.`,
			eyebrow: 'Booking Received',
			title: 'Thank you for your reservation',
			body: `
			${paragraph(`Dear ${escapeHtml(booking.name)},`)}
			${paragraph(
				`We received your reservation and proof of payment for ${eventDetails.name}. We are excited to welcome you to ${eventDetails.hostLocation}.`
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
			${paymentDetailsTable(getPaymentDetailsForEvent(booking.event_id), booking.email)}
			${guestList(booking.guests)}
			${eventDetailsBlock(eventDetails)}
			${paragraph(`If you need help with your booking, please contact us at ${supportLink}.`)}
			${paragraph(`Best regards,<br><strong>${escapeHtml(eventDetails.teamName)}</strong>`)}
		`
		},
		eventDetails,
		communicationDetails
	);
}

function buildTicketsEmail(
	booking: Booking,
	tickets: Ticket[],
	eventDetails: EmailEventDetails,
	communicationDetails: EventCommunicationDetails
): string {
	const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);

	return buildEmailShell(
		{
			preheader: `Your eTickets for ${eventDetails.name} are ready.`,
			eyebrow: 'Your eTickets',
			title: `Your ${eventDetails.subjectBrand} eTickets are ready`,
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
			${eventDetailsBlock(eventDetails)}
			${paragraph('We hope you have a great time at the event!')}
			${paragraph(`Have a blessed day!<br><strong>${escapeHtml(eventDetails.teamName)}</strong>`)}
		`
		},
		eventDetails,
		communicationDetails
	);
}

function buildPaymentReminderEmail(
	booking: Booking,
	eventDetails: EmailEventDetails,
	communicationDetails: EventCommunicationDetails
): string {
	const ticketTypeLabel = formatTicketTypeLabel(booking.ticket_type);
	const supportLink = supportEmailLink(communicationDetails);

	return buildEmailShell(
		{
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
			${paymentDetailsTable(getPaymentDetailsForEvent(booking.event_id), booking.email)}
			${paragraph(`If you need help with your booking, please contact us at ${supportLink}.`)}
			${paragraph(`Best regards,<br><strong>${escapeHtml(eventDetails.teamName)}</strong>`)}
		`
		},
		eventDetails,
		communicationDetails
	);
}

function buildMerchReservationEmail(
	reservation: MerchReservation,
	eventDetails: EmailEventDetails,
	communicationDetails: EventCommunicationDetails
): string {
	const supportLink = supportEmailLink(communicationDetails);

	return buildEmailShell(
		{
			preheader: `Your merchandise reservation ${reservation.reservation_id} was received.`,
			eyebrow: 'Merchandise Reserved',
			title: 'Your merch reservation is confirmed',
			body: `
			${paragraph(`Dear ${escapeHtml(reservation.customer_name)},`)}
			${paragraph(
				`We received your merchandise reservation for ${eventDetails.name}. Your reserved items will be paid for and collected on the day of the event.`
			)}
			${callout(`
				<strong>Please pay and collect your reserved merchandise at the event merch desk.</strong><br>
				Bring this email and your reservation reference so the team can find your items quickly.
			`)}
			${sectionTitle('Reservation Details')}
			${detailTable([
				['Reservation reference', reservation.reservation_id],
				['Customer name', reservation.customer_name],
				['Email', reservation.email],
				['Mobile', reservation.mobile],
				['Total due at event', formatAmount(reservation.amount_total)]
			])}
			${sectionTitle('Reserved Items')}
			${merchItemsTable(reservation)}
			${eventDetailsBlock(eventDetails)}
			${paragraph(`If you need help with your reservation, please contact us at ${supportLink}.`)}
			${paragraph(`Best regards,<br><strong>${escapeHtml(eventDetails.teamName)}</strong>`)}
		`
		},
		eventDetails,
		communicationDetails
	);
}

function merchItemsTable(reservation: MerchReservation): string {
	const rows = reservation.items.map((item) => {
		const variant = [item.selected_size, item.selected_color].filter(Boolean).join(' / ');
		const amount = item.unit_price * item.quantity;
		return [
			item.product_name,
			[
				`Qty ${item.quantity}`,
				variant ? `Variant: ${variant}` : '',
				`Unit: ${formatAmount(item.unit_price)}`,
				`Subtotal: ${formatAmount(amount)}`
			]
				.filter(Boolean)
				.join('<br>')
		] as [string, string];
	});

	return detailTable(rows);
}

function paymentDetailsTable(paymentDetails: PaymentDetails, transferReference: string): string {
	return detailTable([
		[paymentDetails.accountNameLabel, paymentDetails.accountName],
		[paymentDetails.bankNameLabel, paymentDetails.bankName],
		[paymentDetails.ibanLabel, paymentDetails.iban],
		[paymentDetails.bicSwiftLabel, paymentDetails.bicSwift],
		['Transfer reference', transferReference]
	]);
}

function buildEmailShell(
	input: {
		preheader: string;
		eyebrow: string;
		title: string;
		body: string;
	},
	eventDetails: EmailEventDetails,
	communicationDetails: EventCommunicationDetails
): string {
	const footerSupportEmail = escapeHtml(communicationDetails.email);
	const footerSupportMailto = escapeAttribute(communicationDetails.email);

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
											<strong>${escapeHtml(eventDetails.teamName)}</strong><br>
											Need help? <a href="mailto:${footerSupportMailto}" style="color:#f3c15f;font-weight:700;">${footerSupportEmail}</a>
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

function eventDetailsBlock(eventDetails: EmailEventDetails): string {
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
	return escapeHtml(value).replaceAll('&lt;br&gt;', '<br>').replaceAll('\n', '<br>');
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

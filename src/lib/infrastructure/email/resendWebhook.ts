import { BookingConfirmationEmailStatus } from '$lib/domain/shared/enums';
import type { WebhookEventPayload } from 'resend';

export type BookingConfirmationEmailDeliveryUpdate = {
	providerMessageId: string;
	status: BookingConfirmationEmailStatus.DELIVERED | BookingConfirmationEmailStatus.FAILED;
	errorMessage?: string;
	providerEventAt: string;
};

export function mapResendWebhookToBookingConfirmationEmailUpdate(
	event: WebhookEventPayload
): BookingConfirmationEmailDeliveryUpdate | null {
	const providerMessageId = getEmailId(event);
	if (!providerMessageId) {
		return null;
	}

	switch (event.type) {
		case 'email.delivered':
			return {
				providerMessageId,
				status: BookingConfirmationEmailStatus.DELIVERED,
				providerEventAt: event.created_at
			};
		case 'email.bounced':
			return {
				providerMessageId,
				status: BookingConfirmationEmailStatus.FAILED,
				errorMessage: compactErrorParts([
					'Email bounced',
					event.data.bounce.type,
					event.data.bounce.subType,
					event.data.bounce.message
				]),
				providerEventAt: event.created_at
			};
		case 'email.failed':
			return {
				providerMessageId,
				status: BookingConfirmationEmailStatus.FAILED,
				errorMessage: compactErrorParts(['Email failed', event.data.failed.reason]),
				providerEventAt: event.created_at
			};
		case 'email.suppressed':
			return {
				providerMessageId,
				status: BookingConfirmationEmailStatus.FAILED,
				errorMessage: compactErrorParts([
					'Email suppressed',
					event.data.suppressed.type,
					event.data.suppressed.message
				]),
				providerEventAt: event.created_at
			};
		default:
			return null;
	}
}

function getEmailId(event: WebhookEventPayload): string | null {
	if (!('data' in event) || !event.data || !('email_id' in event.data)) {
		return null;
	}

	return event.data.email_id;
}

function compactErrorParts(parts: Array<string | undefined>): string {
	return parts
		.map((part) => part?.trim())
		.filter((part): part is string => Boolean(part))
		.join(': ');
}

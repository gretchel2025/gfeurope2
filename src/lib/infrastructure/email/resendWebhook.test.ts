import { describe, expect, it } from 'vitest';
import { BookingConfirmationEmailStatus } from '$lib/domain/shared/enums';
import { mapResendWebhookToBookingConfirmationEmailUpdate } from '$lib/infrastructure/email/resendWebhook';
import type { WebhookEventPayload } from 'resend';

const baseEmailData = {
	created_at: '2026-06-07T09:30:00.000Z',
	email_id: 'email_123',
	from: 'Grand Feast <help@grandfeast.eu>',
	to: ['ada@example.com'],
	subject: 'Booking confirmation'
};

describe('Resend webhook mapping', () => {
	it('maps delivered email events to delivered confirmation status', () => {
		const event = {
			type: 'email.delivered',
			created_at: '2026-06-07T09:31:00.000Z',
			data: baseEmailData
		} satisfies WebhookEventPayload;

		expect(mapResendWebhookToBookingConfirmationEmailUpdate(event)).toEqual({
			providerMessageId: 'email_123',
			status: BookingConfirmationEmailStatus.DELIVERED,
			providerEventAt: '2026-06-07T09:31:00.000Z'
		});
	});

	it('maps bounced email events to failed confirmation status', () => {
		const event = {
			type: 'email.bounced',
			created_at: '2026-06-07T09:32:00.000Z',
			data: {
				...baseEmailData,
				bounce: {
					type: 'hard',
					subType: 'invalid_mailbox',
					message: 'mailbox does not exist'
				}
			}
		} satisfies WebhookEventPayload;

		expect(mapResendWebhookToBookingConfirmationEmailUpdate(event)).toEqual({
			providerMessageId: 'email_123',
			status: BookingConfirmationEmailStatus.FAILED,
			errorMessage: 'Email bounced: hard: invalid_mailbox: mailbox does not exist',
			providerEventAt: '2026-06-07T09:32:00.000Z'
		});
	});

	it('ignores non-delivery events', () => {
		const event = {
			type: 'email.opened',
			created_at: '2026-06-07T09:33:00.000Z',
			data: baseEmailData
		} satisfies WebhookEventPayload;

		expect(mapResendWebhookToBookingConfirmationEmailUpdate(event)).toBeNull();
	});
});

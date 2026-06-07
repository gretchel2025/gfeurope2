import { json, type RequestHandler } from '@sveltejs/kit';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { SupabaseBookingRepository } from '$lib/infrastructure/db/supabase/bookingRepository';
import { mapResendWebhookToBookingConfirmationEmailUpdate } from '$lib/infrastructure/email/resendWebhook';
import { logger } from '$lib/infrastructure/logging/logger';
import { Resend, type WebhookEventPayload } from 'resend';

const webhookHeaderNames = {
	id: 'webhook-id',
	timestamp: 'webhook-timestamp',
	signature: 'webhook-signature'
};

export const POST: RequestHandler = async ({ request }) => {
	if (!appConfig.integrations.resendWebhookSecret) {
		logger.error('resend webhook: RESEND_WEBHOOK_SECRET is not configured');
		return json({ error: 'webhook is not configured' }, { status: 503 });
	}

	const rawPayload = await request.text();
	const headers = readWebhookHeaders(request.headers);
	if (!headers) {
		return json({ error: 'missing webhook signature headers' }, { status: 400 });
	}

	let eventPayload: WebhookEventPayload;
	try {
		eventPayload = new Resend(
			appConfig.integrations.resendApiKey || 're_webhook_verify'
		).webhooks.verify({
			payload: rawPayload,
			headers,
			webhookSecret: appConfig.integrations.resendWebhookSecret
		});
	} catch (caught) {
		logger.warn({ err: caught }, 'resend webhook: signature verification failed');
		return json({ error: 'invalid webhook signature' }, { status: 401 });
	}

	const update = mapResendWebhookToBookingConfirmationEmailUpdate(eventPayload);
	if (!update) {
		return json({ received: true, ignored: true });
	}

	await new SupabaseBookingRepository(
		undefined,
		''
	).updateBookingConfirmationEmailDeliveryStatusByProviderMessageId(
		update.providerMessageId,
		update.status,
		update.errorMessage,
		update.providerEventAt
	);

	return json({ received: true });
};

function readWebhookHeaders(headers: Headers) {
	const id = headers.get(webhookHeaderNames.id);
	const timestamp = headers.get(webhookHeaderNames.timestamp);
	const signature = headers.get(webhookHeaderNames.signature);

	if (!id || !timestamp || !signature) {
		return null;
	}

	return { id, timestamp, signature };
}

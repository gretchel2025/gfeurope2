/**
 * Purpose:
 * This file provides the Resend-backed email sender implementation.
 *
 * Why this structure is good:
 * Delivery details stay in infrastructure while the application layer only
 * depends on the EmailSender port. That keeps transactional email replaceable
 * without spreading provider-specific code through booking workflows.
 */
import { AppError } from '$lib/application/errors';
import type { EmailMessage, EmailSender, EmailSendResult } from '$lib/application/ports';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { logger } from '$lib/infrastructure/logging/logger';
import { Resend, type CreateEmailOptions, type CreateEmailResponse } from 'resend';

type ResendClient = {
	emails: {
		send(payload: CreateEmailOptions): Promise<CreateEmailResponse>;
	};
};

const defaultSendTimeoutMs = 15_000;

/** Sends transactional emails through Resend when credentials are configured. */
export class ResendEmailSender implements EmailSender {
	constructor(
		private readonly createClient: (apiKey: string) => ResendClient = (apiKey) =>
			new Resend(apiKey),
		private readonly sendTimeoutMs: number = defaultSendTimeoutMs
	) {}

	/** Sends one outbound email message or skips cleanly in local development. */
	async send(message: EmailMessage): Promise<EmailSendResult> {
		const { resendApiKey, emailFrom, emailReplyTo } = appConfig.integrations;

		if (!resendApiKey) {
			logger.warn(
				`[WARN] email svc: RESEND_API_KEY is not configured, skipping email to ${message.to}`
			);
			return { status: 'SKIPPED' };
		}

		if (!emailFrom) {
			throw new AppError('email svc: EMAIL_FROM is not configured', 500, 'EMAIL_ERROR');
		}

		const response = await withTimeout(
			this.createClient(resendApiKey).emails.send({
				from: emailFrom,
				to: message.to,
				replyTo: emailReplyTo || emailFrom,
				subject: message.subject,
				html: message.message,
				tags: [{ name: 'category', value: 'transactional' }]
			}),
			this.sendTimeoutMs,
			`email svc: timed out sending email to ${message.to}`
		);

		if (response.error) {
			throw new AppError(
				`email svc: failed to send email:${JSON.stringify(response.error)}`,
				response.error.statusCode ?? 502,
				'EMAIL_ERROR'
			);
		}

		logger.info(
			{ email_id: response.data.id, to: message.to },
			'email svc: email sent through Resend'
		);
		return { status: 'SENT', providerMessageId: response.data.id };
	}
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeout = setTimeout(() => {
			reject(new AppError(message, 504, 'EMAIL_ERROR'));
		}, timeoutMs);
	});

	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeout) {
			clearTimeout(timeout);
		}
	}
}

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfig } from '$lib/infrastructure/config/env.server';
import { ResendEmailSender } from '$lib/infrastructure/email/resendEmailSender';
import { logger } from '$lib/infrastructure/logging/logger';

vi.mock('$lib/infrastructure/logging/logger', () => ({
	logger: {
		warn: vi.fn(),
		info: vi.fn()
	}
}));

describe('ResendEmailSender', () => {
	const originalIntegrations = { ...appConfig.integrations };
	const message = {
		to: 'ada@example.com',
		subject: 'Hello',
		message: '<p>Welcome</p>'
	};

	beforeEach(() => {
		Object.assign(appConfig.integrations, {
			...originalIntegrations,
			resendApiKey: '',
			emailFrom: '',
			emailReplyTo: ''
		});
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
		Object.assign(appConfig.integrations, originalIntegrations);
	});

	it('skips sending when Resend is not configured', async () => {
		const createClient = vi.fn();

		await expect(new ResendEmailSender(createClient).send(message)).resolves.toEqual({
			status: 'SKIPPED'
		});

		expect(createClient).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(
			'[WARN] email svc: RESEND_API_KEY is not configured, skipping email to ada@example.com'
		);
	});

	it('sends html email through Resend with configured sender identity', async () => {
		Object.assign(appConfig.integrations, {
			resendApiKey: 're_test',
			emailFrom: 'Grand Feast EU and UK <help@grandfeast.eu>',
			emailReplyTo: 'Grand Feast EU and UK <help@grandfeast.eu>'
		});
		const send = vi.fn().mockResolvedValue({
			data: { id: 'email_123' },
			error: null,
			headers: null
		});

		await expect(
			new ResendEmailSender(() => ({ emails: { send } })).send(message)
		).resolves.toEqual({
			status: 'SENT',
			providerMessageId: 'email_123'
		});

		expect(send).toHaveBeenCalledWith({
			from: 'Grand Feast EU and UK <help@grandfeast.eu>',
			to: 'ada@example.com',
			replyTo: 'Grand Feast EU and UK <help@grandfeast.eu>',
			subject: 'Hello',
			html: '<p>Welcome</p>',
			tags: [{ name: 'category', value: 'transactional' }]
		});
		expect(logger.info).toHaveBeenCalledWith(
			{ email_id: 'email_123', to: 'ada@example.com' },
			'email svc: email sent through Resend'
		);
	});

	it('requires EMAIL_FROM when an API key is configured', async () => {
		Object.assign(appConfig.integrations, {
			resendApiKey: 're_test',
			emailFrom: '',
			emailReplyTo: ''
		});

		await expect(
			new ResendEmailSender(() => ({ emails: { send: vi.fn() } })).send(message)
		).rejects.toMatchObject({
			code: 'EMAIL_ERROR',
			status: 500,
			message: 'email svc: EMAIL_FROM is not configured'
		});
	});

	it('wraps Resend failures as email errors', async () => {
		Object.assign(appConfig.integrations, {
			resendApiKey: 're_test',
			emailFrom: 'Grand Feast EU and UK <help@grandfeast.eu>',
			emailReplyTo: ''
		});
		const send = vi.fn().mockResolvedValue({
			data: null,
			error: {
				name: 'invalid_from_address',
				message: 'Invalid from address',
				statusCode: 422
			},
			headers: null
		});

		await expect(
			new ResendEmailSender(() => ({ emails: { send } })).send(message)
		).rejects.toMatchObject({
			code: 'EMAIL_ERROR',
			status: 422
		});
	});

	it('times out stalled Resend sends', async () => {
		vi.useFakeTimers();
		Object.assign(appConfig.integrations, {
			resendApiKey: 're_test',
			emailFrom: 'Grand Feast EU and UK <help@grandfeast.eu>',
			emailReplyTo: ''
		});
		const send = vi.fn(
			() =>
				new Promise<never>(() => {
					// Simulates a provider request that never resolves.
				})
		);

		const sendPromise = new ResendEmailSender(() => ({ emails: { send } }), 25).send(message);
		const expectedRejection = expect(sendPromise).rejects.toMatchObject({
			code: 'EMAIL_ERROR',
			status: 504,
			message: 'email svc: timed out sending email to ada@example.com'
		});

		await vi.advanceTimersByTimeAsync(25);
		await expectedRejection;
	});
});

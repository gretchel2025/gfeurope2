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
		Object.assign(appConfig.integrations, originalIntegrations);
	});

	it('skips sending when Resend is not configured', async () => {
		const createClient = vi.fn();

		await new ResendEmailSender(createClient).send(message);

		expect(createClient).not.toHaveBeenCalled();
		expect(logger.warn).toHaveBeenCalledWith(
			'[WARN] email svc: RESEND_API_KEY is not configured, skipping email to ada@example.com'
		);
	});

	it('sends html email through Resend with configured sender identity', async () => {
		Object.assign(appConfig.integrations, {
			resendApiKey: 're_test',
			emailFrom: 'Grand Feast EU and UK <admin@grandfeast.eu>',
			emailReplyTo: 'admin@grandfeast.eu'
		});
		const send = vi.fn().mockResolvedValue({
			data: { id: 'email_123' },
			error: null,
			headers: null
		});

		await new ResendEmailSender(() => ({ emails: { send } })).send(message);

		expect(send).toHaveBeenCalledWith({
			from: 'Grand Feast EU and UK <admin@grandfeast.eu>',
			to: 'ada@example.com',
			replyTo: 'admin@grandfeast.eu',
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
			emailFrom: 'Grand Feast EU and UK <admin@grandfeast.eu>',
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
});

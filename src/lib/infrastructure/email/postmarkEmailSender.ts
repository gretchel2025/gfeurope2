/**
 * Purpose:
 * This file provides the Postmark-backed email sender implementation.
 *
 * Why this structure is good:
 * Delivery details stay in infrastructure while the application layer only
 * depends on the EmailSender port. That makes email easier to disable locally
 * and easier to replace later.
 */
import { AppError } from "$lib/application/errors";
import type { EmailMessage, EmailSender } from "$lib/application/ports";
import { appConfig } from "$lib/infrastructure/config/env.server";
import { logger } from "$lib/infrastructure/logging/logger";

/** Sends emails through Postmark when credentials are configured. */
export class PostmarkEmailSender implements EmailSender {
    /** Sends one outbound email message or skips cleanly in local development. */
    async send(message: EmailMessage): Promise<void> {
        if (!appConfig.integrations.postmarkApiKey) {
            logger.warn(`[WARN] email svc: MY_POSTMARK_API_KEY is not configured, skipping email to ${message.to}`);
            return;
        }

        const response = await fetch("https://api.postmarkapp.com/email", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-Postmark-Server-Token": appConfig.integrations.postmarkApiKey,
            },
            body: JSON.stringify({
                From: "Grand Feast EU and UK<help@grandfeast.eu>",
                To: message.to,
                Subject: message.subject,
                HtmlBody: message.message,
                MessageStream: "outbound",
            }),
        });

        const body = await response.json();
        if (response.status !== 200) {
            throw new AppError(`email svc: failed to send email:${JSON.stringify(body)}`, response.status, "EMAIL_ERROR");
        }
    }
}

import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
	adminEventPath,
	e2eConfig,
	eventPath,
	expectPath,
	makeBookingIdentity,
	shouldRunMutatingBooking
} from './support/e2eConfig';
import { signInWithPassword } from './support/auth';

test.describe('mutating booking canary', () => {
	test.skip(
		!shouldRunMutatingBooking(),
		'Mutating booking canary is skipped for prod unless E2E_ALLOW_PROD_MUTATION=true.'
	);
	test.setTimeout(90_000);

	test('can reserve one Standard ticket and cancel the unpaid reservation', async ({ page }) => {
		const booking = makeBookingIdentity();
		const receiptPath = path.resolve(
			process.cwd(),
			'test/resources/fake-bank-transfer-receipt.pdf'
		);
		const bookingPath = eventPath('/newbooking?ticket_type=STANDARD');

		if (e2eConfig.requiresAuthForPublicPages) {
			await signInWithPassword(page, bookingPath);
		} else {
			await page.goto(bookingPath);
		}

		const quantityIncrement = page.getByTestId('ticket-quantity-increment');
		const quantityValue = page.getByTestId('ticket-quantity-value');

		await expect(quantityIncrement).toBeEnabled();
		for (let attempts = 0; attempts < 5; attempts += 1) {
			if ((await quantityValue.textContent())?.trim() === '1') break;
			await quantityIncrement.click();
			try {
				await expect(quantityValue).toHaveText('1', { timeout: 1_000 });
				break;
			} catch {
				await page.waitForTimeout(250);
			}
		}
		await expect(quantityValue).toHaveText('1');
		await page.getByRole('button', { name: 'Continue' }).click();

		await page.getByLabel('Email address*').fill(booking.email);
		await page.getByLabel('Country*').fill('Ireland');
		await page.getByRole('option', { name: 'Ireland' }).click();
		await page.getByLabel('City*').fill('Dublin');
		await page.getByRole('option', { name: 'Dublin', exact: true }).click();
		await page.getByRole('button', { name: 'Continue' }).click();

		await page.getByLabel('Guest 1').fill(booking.name);
		await page.getByRole('button', { name: 'Continue' }).click();

		await expect(page.getByText('Light Of Jesus Family Ireland CLG')).toBeVisible();
		await expect(page.getByText('Bank of Ireland')).toBeVisible();
		await expect(page.getByText('IE12 BOFI 9000 1780 5681 80')).toBeVisible();
		await expect(page.getByText('BOFIIE2DXXX')).toBeVisible();
		await page.getByLabel('Proof of payment*').setInputFiles(receiptPath);
		await page.getByTestId('reserve-booking-button').click();
		await expect(page.getByRole('dialog', { name: 'Non-refundable tickets' })).toBeVisible();
		await page.getByTestId('confirm-non-refundable-submit').click();

		await expect(page).toHaveURL(expectPath(eventPath('/newbooking/success')), {
			timeout: 30_000
		});
		await expect(page.getByRole('heading', { name: 'Successfully Booked' })).toBeVisible();

		await signInWithPassword(page, adminEventPath('/bookings/search'));
		await page.getByLabel('Booking reference, email, name, or ticket number').fill(booking.email);
		await page.getByRole('button', { name: 'Search' }).click();
		await expect(page.getByText(booking.email)).toBeVisible();
		await page.getByRole('link', { name: 'View details' }).click();

		await expect(page.getByRole('heading', { name: 'Booking Details' })).toBeVisible();
		await expect(page.getByText(booking.email)).toBeVisible();
		await expect(page.getByText('UNPAID')).toBeVisible();
		await expect(page.getByText('Confirmation Email')).toBeVisible();
		await page.getByRole('link', { name: 'Load proof preview' }).click();
		await expect(page.getByTestId('payment-proof-pdf-preview')).toBeVisible();
		const proofLink = page.getByRole('link', { name: 'Open proof in new tab' });
		await expect(proofLink).toBeVisible();
		await expect(proofLink).toHaveAttribute('href', /\/payment-proof$/);
		const proofResponse = await page.request.get(`${new URL(page.url()).pathname}/payment-proof`);
		expect(proofResponse.status()).toBe(200);
		expect(proofResponse.headers()['content-type']).toContain('application/pdf');
		await page.getByRole('link', { name: 'Cancel reservation' }).click();

		const firstConfirmation = page.getByTestId('danger-confirmation-first');
		const secondConfirmation = page.getByTestId('danger-confirmation-second');
		const cancellationButton = page.getByRole('button', { name: 'Proceed with cancellation' });

		await firstConfirmation.check();
		await secondConfirmation.check();

		await expect(firstConfirmation).toBeChecked();
		await expect(secondConfirmation).toBeChecked();
		await expect(cancellationButton).toBeEnabled({ timeout: 10_000 });
		await cancellationButton.click();

		await expect(page.getByRole('heading', { name: 'Booking Cancelled' })).toBeVisible({
			timeout: 20_000
		});
	});
});

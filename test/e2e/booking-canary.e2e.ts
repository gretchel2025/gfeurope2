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

	test('can reserve one Standard ticket and cancel the unpaid reservation', async ({ page }) => {
		const booking = makeBookingIdentity();
		const receiptPath = path.resolve(
			process.cwd(),
			'test/resources/fake-bank-transfer-receipt.jpg'
		);
		const bookingPath = eventPath('/newbooking?ticket_type=STANDARD');

		if (e2eConfig.requiresAuthForPublicPages) {
			await signInWithPassword(page, bookingPath);
		} else {
			await page.goto(bookingPath);
		}

		await expect(page.getByRole('button', { name: '+' })).toBeEnabled();
		await page.getByRole('button', { name: '+' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();

		await page.getByLabel('Email address*').fill(booking.email);
		await page.getByLabel('Country*').fill('Ireland');
		await page.getByRole('option', { name: 'Ireland' }).click();
		await page.getByLabel('City*').fill('Dublin');
		await page.getByRole('option', { name: 'Dublin' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();

		await page.getByLabel('Guest 1').fill(booking.name);
		await page.getByRole('button', { name: 'Continue' }).click();

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
		await page.getByRole('link', { name: 'Cancel reservation' }).click();

		await page.getByTestId('danger-confirmation-first').check();
		await page.getByTestId('danger-confirmation-second').check();
		await page.getByRole('button', { name: 'Proceed with cancellation' }).click();

		await expect(page.getByRole('heading', { name: 'Booking Cancelled' })).toBeVisible({
			timeout: 20_000
		});
	});
});

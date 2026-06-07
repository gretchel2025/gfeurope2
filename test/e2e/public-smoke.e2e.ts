import { expect, test } from '@playwright/test';
import { e2eConfig, eventPath, expectPath } from './support/e2eConfig';
import { signInWithPassword } from './support/auth';

test.describe('public deployment smoke', () => {
	test.beforeEach(async ({ page }) => {
		if (e2eConfig.requiresAuthForPublicPages) {
			await signInWithPassword(page, eventPath());
		}
	});

	test('root redirects to the configured event', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL(expectPath(eventPath()));
		await expect(page.getByText(/Grand Feast Europe 2026/i).first()).toBeVisible();
	});

	test('events index lists registered public events', async ({ page }) => {
		await page.goto('/events');

		await expect(page.getByRole('heading', { name: 'Grand Feast Europe Events' })).toBeVisible();
		await expect(page.locator(`a[href="${eventPath()}"]`)).toBeVisible();
		await expect(page.locator('a[href="/events/gfeu2025"]')).toHaveCount(0);

		const archivedEvent = page.locator('.events-index-entry-disabled').filter({
			hasText: 'Called To More'
		});
		await expect(archivedEvent).toBeVisible();
		await expect(archivedEvent.getByText('Archived')).toBeVisible();
		await expect(archivedEvent.getByRole('button', { name: 'View event' })).toBeDisabled();
	});

	test('active public event page loads', async ({ page }) => {
		await page.goto(eventPath());

		await expect(page).toHaveURL(expectPath(eventPath()));
		await expect(page.getByText(/Dublin/i).first()).toBeVisible();
		await expect(page.getByText(/Grand Feast Europe 2026/i).first()).toBeVisible();
	});

	test('booking page loads ticket options', async ({ page }) => {
		await page.goto(eventPath('/newbooking'));

		await expect(page.getByRole('heading', { name: 'Reserve Your Seat' })).toBeVisible();
		await expect(page.getByTestId('ticket-option-STANDARD')).toBeVisible();
	});

	for (const [pathname, heading] of [
		['/privacy', 'Privacy Policy'],
		['/conditions', 'Terms and Conditions'],
		['/faq', 'Frequently Asked Questions']
	] as const) {
		test(`${pathname} page loads`, async ({ page }) => {
			await page.goto(eventPath(pathname));

			await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
		});
	}

	test('unregistered public event id fails clearly', async ({ page }) => {
		const response = await page.goto('/events/__e2e_unregistered__');

		expect(response?.status()).toBe(404);
		await expect(page.getByText('Page unavailable')).toBeVisible();
		await expect(
			page.getByRole('heading', { name: /event not found|public event page not found/i })
		).toBeVisible();
	});
});

test('admin routes redirect unauthenticated users to sign in', async ({ page }) => {
	await page.goto(`/admin/events/${encodeURIComponent(e2eConfig.eventId)}`);

	await expect(page).toHaveURL(/\/signin\?redirectTo=%2Fadmin%2Fevents%2F/);
});
